const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logError } = require('../utils/logger');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    logError(error, req);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso'
    });
  }

  next();
};

// Middleware para verificar se é admin ou usuário
const requireAdminOrUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores e usuários podem acessar este recurso'
    });
  }

  next();
};

// Middleware para verificar se é o próprio usuário ou admin
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  const requestedUserId = parseInt(req.params.userId || req.params.id);
  
  if (req.user.role !== 'admin' && req.user.id !== requestedUserId) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar seus próprios dados'
    });
  }

  next();
};

// Middleware opcional para autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    }
  } catch (error) {
    // Ignora erros de token inválido em autenticação opcional
  }

  next();
};

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Função para gerar refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Função para verificar refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrUser,
  requireOwnershipOrAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};
