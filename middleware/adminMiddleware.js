// middleware/adminMiddleware.js - Enhanced with debugging
const adminMiddleware = (req, res, next) => {
    console.log('🔐 Admin middleware check...');
    console.log('👤 User from auth middleware:', req.user);

    // Check if user is authenticated and has admin role
    if (!req.user) {
        console.log('❌ No user found in request');
        return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('🔍 User role check:', req.user.role);

    if (req.user.role !== 'admin') {
        console.log('❌ User is not admin. Role:', req.user.role);
        return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('✅ Admin access granted');
    next();
};

export default adminMiddleware;