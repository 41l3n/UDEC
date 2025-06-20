const jwt = require('jsonwebtoken');
const db = require('../models');  // Correct import via models/index.js
const User = db.User;  // Get initialized User model

// JWT authentication middleware
exports.authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required.' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role', 'blockchainAddress', 'isActive']
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      blockchainAddress: user.blockchainAddress
    };
    
    next();
    
  } catch (error) {
    // Enhanced error handling
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token format.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication service unavailable.' });
  }
};

// Role-based authorization (unchanged)
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Requires ${roles.join('/')} role. Current role: ${req.user.role}`
      });
    }
    
    next();
  };
};