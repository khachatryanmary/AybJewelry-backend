// routes/adminRoutes.js
import express from 'express';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import User from '../models/User.js';
import EnhancedOrder from '../models/EnhancedOrder.js';
import Product from '../models/productModel.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply middlewares to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// Test route for debugging
router.get('/test-connection', (req, res) => {
    console.log('🧪 Admin test route hit successfully');
    res.json({
        message: 'Admin routes working!',
        user: req.user,
        timestamp: new Date()
    });
});

// Individual Stats Routes for AdminDashboard
router.get('/stats/products', async (req, res) => {
    try {
        console.log('📊 Fetching products stats...');
        const total = await Product.countDocuments();
        console.log('✅ Products count:', total);
        res.json({ total });
    } catch (error) {
        console.error('❌ Error fetching products stats:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/stats/orders', async (req, res) => {
    try {
        console.log('📊 Fetching orders stats...');
        const [totalOrders, totalRevenue] = await Promise.all([
            EnhancedOrder.countDocuments(),
            EnhancedOrder.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);

        const response = {
            total: totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        };

        console.log('✅ Orders stats:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ Error fetching orders stats:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/stats/users', async (req, res) => {
    try {
        console.log('📊 Fetching users stats...');
        const total = await User.countDocuments();
        console.log('✅ Users count:', total);
        res.json({ total });
    } catch (error) {
        console.error('❌ Error fetching users stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Stats Overview - Fixed route path to match frontend call
router.get('/stats/overview', async (req, res) => {
    try {
        console.log('📊 Fetching admin stats overview...');

        const [
            totalProducts,
            totalOrders,
            totalCustomers,
            totalRevenue,
            recentOrders,
            topProducts
        ] = await Promise.all([
            Product.countDocuments(),
            EnhancedOrder.countDocuments(),
            User.countDocuments(),
            EnhancedOrder.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            EnhancedOrder.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name surname email')
                .lean(),
            Product.aggregate([
                { $match: { status: { $ne: 'discontinued' } } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        const response = {
            stats: {
                products: totalProducts,
                orders: totalOrders,
                customers: totalCustomers,
                revenue: totalRevenue[0]?.total || 0
            },
            recentOrders: recentOrders.map(order => ({
                _id: order._id,
                firstName: order.user?.name?.split(' ')[0] || order.firstName || 'Unknown',
                lastName: order.user?.name?.split(' ')[1] || order.lastName || '',
                total: order.total,
                status: order.status,
                createdAt: order.createdAt
            })),
            topProducts
        };

        console.log('✅ Stats overview fetched successfully');
        res.json(response);
    } catch (error) {
        console.error('❌ Error fetching stats overview:', error);
        res.status(500).json({ message: error.message });
    }
});

// Analytics Sales Data
router.get('/analytics/sales', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        console.log(`📈 Fetching sales analytics for period: ${period}`);

        let dateLimit;
        const now = new Date();

        switch (period) {
            case '7d':
                dateLimit = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                dateLimit = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90d':
                dateLimit = new Date(now.setDate(now.getDate() - 90));
                break;
            case '1y':
                dateLimit = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                dateLimit = new Date(now.setDate(now.getDate() - 30));
        }

        // Get sales data by day
        const salesData = await EnhancedOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: dateLimit },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Get category performance stats
        const categoryStats = await EnhancedOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: dateLimit },
                    paymentStatus: 'paid'
                }
            },
            { $unwind: '$cartItems' },
            {
                $group: {
                    _id: '$cartItems.category',
                    count: { $sum: '$cartItems.quantity' },
                    revenue: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        const response = {
            salesData: salesData || [],
            categoryStats: categoryStats || []
        };

        console.log('✅ Sales analytics fetched successfully:', {
            salesDataPoints: salesData.length,
            categories: categoryStats.length
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Error fetching sales analytics:', error);
        res.status(500).json({ message: error.message });
    }
});

// Orders Management
router.get('/orders', async (req, res) => {
    try {
        console.log('📦 Fetching orders with params:', req.query);

        const {
            page = 1,
            limit = 20,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Status filter
        if (status && status !== 'all' && status !== '') {
            query.status = status;
        }

        // Search filter
        if (search && search.trim() !== '') {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('📦 Query:', query);

        // Get orders with pagination
        const orders = await EnhancedOrder.find(query)
            .populate('user', 'name surname email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        // Get total count
        const totalItems = await EnhancedOrder.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const response = {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        console.log('✅ Orders fetched:', {
            count: orders.length,
            totalItems,
            currentPage: page,
            totalPages
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single order details
router.get('/orders/:id', async (req, res) => {
    try {
        console.log('📦 Fetching order details for ID:', req.params.id);

        const order = await EnhancedOrder.findById(req.params.id)
            .populate('user', 'name surname email')
            .lean();

        if (!order) {
            console.log('❌ Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('✅ Order details fetched');
        res.json(order);
    } catch (error) {
        console.error('❌ Error fetching order details:', error);
        res.status(500).json({ message: error.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        console.log('📦 Updating order status:', req.params.id, req.body);

        const { status, trackingNumber, adminNotes } = req.body;

        const updateData = { status, updatedAt: new Date() };

        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (adminNotes) updateData.adminNotes = adminNotes;

        // Set timestamp based on status
        if (status === 'shipped') updateData.shippedAt = new Date();
        if (status === 'delivered') updateData.deliveredAt = new Date();
        if (status === 'cancelled') updateData.cancelledAt = new Date();

        const order = await EnhancedOrder.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('✅ Order status updated');
        res.json(order);
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        res.status(500).json({ message: error.message });
    }
});

// Categories Management
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: error.message });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: error.message });
    }
});

// Collections Management
router.get('/collections', async (req, res) => {
    try {
        const collections = await Collection.find().populate('products');
        res.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/collections', async (req, res) => {
    try {
        const collection = new Collection(req.body);
        await collection.save();
        res.status(201).json(collection);
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ message: error.message });
    }
});

// Products Management
router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, status, search } = req.query;

        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
});

// Customers Management
router.get('/customers', async (req, res) => {
    try {
        console.log('👥 Fetching customers with params:', req.query);

        const {
            page = 1,
            limit = 20,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Search filter
        if (search && search.trim() !== '') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { surname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('👥 Customer query:', query);

        // Get customers with order statistics
        const customers = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'enhancedorders', // Make sure this matches your collection name
                    localField: '_id',
                    foreignField: 'user',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: { $ifNull: ['$order.total', 0] }
                            }
                        }
                    }
                }
            },
            { $unset: ['password', 'orders', 'resetPasswordToken', 'resetPasswordExpires'] },
            { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        // Get total count
        const totalItems = await User.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const response = {
            customers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        console.log('✅ Customers fetched:', {
            count: customers.length,
            totalItems,
            currentPage: page,
            totalPages
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Error fetching customers:', error);
        res.status(500).json({ message: error.message });
    }
});

// Ban/Unban customer
router.put('/customers/:id/ban', async (req, res) => {
    try {
        console.log('👥 Updating customer ban status:', req.params.id, req.body);

        const { banned, reason } = req.body;

        const updateData = { banned };
        if (reason) updateData.banReason = reason;
        if (banned) updateData.bannedAt = new Date();
        else {
            updateData.bannedAt = null;
            updateData.banReason = null;
        }

        const customer = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('✅ Customer ban status updated');
        res.json({
            message: banned ? 'Customer banned successfully' : 'Customer unbanned successfully',
            customer
        });
    } catch (error) {
        console.error('❌ Error updating customer ban status:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update User Role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        // Validate role
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Find user
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update role
        user.role = role;
        await user.save();

        res.json({
            message: `User role updated to ${role} successfully`,
            user: {
                id: user._id,
                email: user.email,
                name: user.name || user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;