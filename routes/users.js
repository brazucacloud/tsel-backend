const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { userValidation, userIdValidation, paginationValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// GET /api/users - Listar usuários (admin)
router.get('/', authenticateToken, requireAdmin, paginationValidation, async (req, res) => {
  try {
    const { page, limit, role, isActive } = req.query;
    
    const result = await User.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/:id - Obter usuário específico
router.get('/:id', authenticateToken, requireOwnershipOrAdmin, userIdValidation, async (req, res) => {
  try {
    const user = await User.findById(parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/users - Criar usuário (admin)
router.post('/', authenticateToken, requireAdmin, userValidation, async (req, res) => {
  try {
    const { username, email, password, role, is_active } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',
      is_active: is_active !== undefined ? is_active : true
    });

    // Log de auditoria
    logAudit('create_user', req.user.id, { created_user_id: user.id, username: user.username });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
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

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', authenticateToken, requireOwnershipOrAdmin, userIdValidation, userValidation, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = { ...req.body };
    
    // Remover campos que não devem ser atualizados
    delete updateData.password;
    delete updateData.created_at;
    delete updateData.updated_at;

    const user = await User.update(userId, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    logAudit('update_user', req.user.id, { updated_user_id: userId, changes: updateData });

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
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

// DELETE /api/users/:id - Deletar usuário (admin)
router.delete('/:id', authenticateToken, requireAdmin, userIdValidation, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Não permitir deletar o próprio usuário
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar sua própria conta'
      });
    }

    const user = await User.delete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    logAudit('delete_user', req.user.id, { deleted_user_id: userId, username: user.username });

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/users/:id/activate - Ativar usuário (admin)
router.post('/:id/activate', authenticateToken, requireAdmin, userIdValidation, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await User.update(userId, { is_active: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    logAudit('activate_user', req.user.id, { activated_user_id: userId });

    res.json({
      success: true,
      message: 'Usuário ativado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/users/:id/deactivate - Desativar usuário (admin)
router.post('/:id/deactivate', authenticateToken, requireAdmin, userIdValidation, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Não permitir desativar o próprio usuário
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar sua própria conta'
      });
    }
    
    const user = await User.update(userId, { is_active: false });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    logAudit('deactivate_user', req.user.id, { deactivated_user_id: userId });

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/users/:id/reset-password - Resetar senha (admin)
router.post('/:id/reset-password', authenticateToken, requireAdmin, userIdValidation, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    const user = await User.updatePassword(userId, new_password);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de auditoria
    logAudit('reset_user_password', req.user.id, { reset_user_id: userId });

    res.json({
      success: true,
      message: 'Senha do usuário resetada com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/stats - Estatísticas de usuários (admin)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await User.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/users/search - Buscar usuários (admin)
router.get('/search/query', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, role, isActive, page, limit } = req.query;
    
    // Implementar busca por nome de usuário ou email
    // Por enquanto, retornar lista completa com filtros
    const result = await User.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });

    // Filtrar por termo de busca se fornecido
    if (q) {
      const searchTerm = q.toLowerCase();
      result.users = result.users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
      result.pagination.total = result.users.length;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro na busca de usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
