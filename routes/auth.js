const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken, authenticateToken } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// POST /api/auth/login - Login de usuário
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o administrador.'
      });
    }

    // Verificar senha
    const isValidPassword = await User.verifyPassword(user, password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Atualizar último login
    await User.updateLastLogin(user.id);

    // Gerar tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Log de auditoria
    logAudit('login', user.id, { ip: req.ip, userAgent: req.get('User-Agent') });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/register - Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Criar usuário
    const user = await User.create({
      username,
      email,
      password,
      role
    });

    // Gerar tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Log de auditoria
    logAudit('register', user.id, { ip: req.ip, userAgent: req.get('User-Agent') });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error.message.includes('já está em uso')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refresh_token);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novos tokens
    const accessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        tokens: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        }
      }
    });
  } catch (error) {
    console.error('Erro na renovação do token:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido ou expirado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log de auditoria
    logAudit('logout', req.user.id, { ip: req.ip, userAgent: req.get('User-Agent') });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/me - Informações do usuário atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = await User.verifyPassword(user, current_password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    await User.updatePassword(user.id, new_password);

    // Log de auditoria
    logAudit('change_password', user.id, { ip: req.ip });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/forgot-password - Esqueci minha senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Por segurança, não informar se o email existe ou não
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    }

    // Gerar token temporário para reset de senha
    const resetToken = generateToken(user.id);
    
    // TODO: Implementar envio de email com link para reset de senha
    // Por enquanto, apenas retornar sucesso
    
    // Log de auditoria
    logAudit('forgot_password', user.id, { ip: req.ip, email });

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha'
    });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/reset-password - Redefinir senha
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Atualizar senha
    await User.updatePassword(user.id, new_password);

    // Log de auditoria
    logAudit('reset_password', user.id, { ip: req.ip });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro no reset password:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
