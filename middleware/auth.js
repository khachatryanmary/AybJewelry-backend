import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    console.log('🔍 Auth Debug - Full Authorization Header:', req.headers.authorization);
    console.log('🔍 Auth Debug - All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Auth Debug - JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔍 Auth Debug - Extracted token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

    if (!token) {
        console.log('❌ Auth Debug - No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Auth Debug - Token decoded successfully:', { id: decoded.id, role: decoded.role });

        if (decoded.role !== 'admin') {
            console.log('❌ Auth Debug - Not admin role:', decoded.role);
            return res.status(403).json({ message: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log('❌ Auth Debug - Token verification failed:', error.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default authMiddleware;