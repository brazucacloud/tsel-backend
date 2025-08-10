const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken, requireAdminOrUser } = require('../middleware/auth');
const { notificationValidation, notificationIdValidation, paginationValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// GET /api/notifications - Listar notificações do usuário
router.get('/', authenticateToken, requireAdminOrUser, paginationValidation, async (req, res) => {
  try {
    const { page, limit, isRead, type } = req.query;
    
    const result = await Notification.findByUserId(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/all - Listar todas as notificações (admin)
router.get('/all', authenticateToken, requireAdminOrUser, paginationValidation, async (req, res) => {
  try {
    const { page, limit, type, isRead, userId } = req.query;
    
    const result = await Notification.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      userId: userId ? parseInt(userId) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar todas as notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/:id - Obter notificação específica
router.get('/:id', authenticateToken, requireAdminOrUser, notificationIdValidation, async (req, res) => {
  try {
    const notification = await Notification.findById(parseInt(req.params.id));
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    // Verificar se o usuário pode acessar esta notificação
    if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications - Criar notificação
router.post('/', authenticateToken, requireAdminOrUser, notificationValidation, async (req, res) => {
  try {
    const { user_id, title, message, type, data } = req.body;

    // Verificar se o usuário pode criar notificação para outro usuário
    if (user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const notification = await Notification.create({
      user_id,
      title,
      message,
      type,
      data
    });

    // Log de auditoria
    logAudit('create_notification', req.user.id, { 
      notification_id: notification.id, 
      target_user_id: user_id,
      type 
    });

    res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/broadcast - Criar notificação para todos os usuários (admin)
router.post('/broadcast', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { title, message, type, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Título e mensagem são obrigatórios'
      });
    }

    const notifications = await Notification.createForAllUsers({
      title,
      message,
      type: type || 'info',
      data
    });

    // Log de auditoria
    logAudit('broadcast_notification', req.user.id, { 
      notifications_count: notifications.length,
      title,
      type 
    });

    res.status(201).json({
      success: true,
      message: 'Notificação enviada para todos os usuários',
      data: { 
        notifications_count: notifications.length,
        notification: {
          title,
          message,
          type: type || 'info',
          data
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/notifications/:id - Atualizar notificação
router.put('/:id', authenticateToken, requireAdminOrUser, notificationIdValidation, notificationValidation, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const updateData = { ...req.body };
    
    // Remover campos que não devem ser atualizados
    delete updateData.created_at;
    delete updateData.updated_at;

    const notification = await Notification.update(notificationId, updateData);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    // Verificar se o usuário pode atualizar esta notificação
    if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Log de auditoria
    logAudit('update_notification', req.user.id, { notification_id: notificationId, changes: updateData });

    res.json({
      success: true,
      message: 'Notificação atualizada com sucesso',
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/notifications/:id - Deletar notificação
router.delete('/:id', authenticateToken, requireAdminOrUser, notificationIdValidation, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await Notification.delete(notificationId, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    // Log de auditoria
    logAudit('delete_notification', req.user.id, { notification_id: notificationId, title: notification.title });

    res.json({
      success: true,
      message: 'Notificação deletada com sucesso',
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/notifications/:id/admin - Deletar notificação (admin)
router.delete('/:id/admin', authenticateToken, requireAdminOrUser, notificationIdValidation, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await Notification.deleteById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    // Log de auditoria
    logAudit('delete_notification_admin', req.user.id, { notification_id: notificationId, title: notification.title });

    res.json({
      success: true,
      message: 'Notificação deletada com sucesso',
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/:id/read - Marcar como lida
router.post('/:id/read', authenticateToken, requireAdminOrUser, notificationIdValidation, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await Notification.markAsRead(notificationId, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: { notification }
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/read-all - Marcar todas como lidas
router.post('/read-all', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notificações marcadas como lidas`,
      data: { count }
    });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/unread/count - Contar notificações não lidas
router.get('/unread/count', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const count = await Notification.countUnread(req.user.id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/unread/list - Notificações não lidas
router.get('/unread/list', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { limit } = req.query;
    
    const notifications = await Notification.getUnread(req.user.id, parseInt(limit) || 10);

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/stats/overview - Estatísticas de notificações
router.get('/stats/overview', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const stats = await Notification.getStats();

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

// POST /api/notifications/system - Criar notificação de sistema (admin)
router.post('/system', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { title, message, type, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Título e mensagem são obrigatórios'
      });
    }

    const notifications = await Notification.createSystemNotification(title, message, type, data);

    // Log de auditoria
    logAudit('create_system_notification', req.user.id, { 
      notifications_count: notifications.length,
      title,
      type 
    });

    res.status(201).json({
      success: true,
      message: 'Notificação de sistema criada com sucesso',
      data: { 
        notifications_count: notifications.length,
        notification: {
          title,
          message,
          type: type || 'info',
          data: { ...data, system: true }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação de sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/device - Criar notificação de dispositivo
router.post('/device', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { device_id, device_name, action, type } = req.body;

    if (!device_id || !device_name || !action) {
      return res.status(400).json({
        success: false,
        message: 'device_id, device_name e action são obrigatórios'
      });
    }

    const notifications = await Notification.createDeviceNotification(device_id, device_name, action, type);

    // Log de auditoria
    logAudit('create_device_notification', req.user.id, { 
      device_id,
      device_name,
      action,
      notifications_count: notifications.length
    });

    res.status(201).json({
      success: true,
      message: 'Notificação de dispositivo criada com sucesso',
      data: { 
        notifications_count: notifications.length,
        notification: {
          device_id,
          device_name,
          action,
          type: type || 'info'
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação de dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/task - Criar notificação de tarefa
router.post('/task', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { task_id, task_type, status, type } = req.body;

    if (!task_id || !task_type || !status) {
      return res.status(400).json({
        success: false,
        message: 'task_id, task_type e status são obrigatórios'
      });
    }

    const notifications = await Notification.createTaskNotification(task_id, task_type, status, type);

    // Log de auditoria
    logAudit('create_task_notification', req.user.id, { 
      task_id,
      task_type,
      status,
      notifications_count: notifications.length
    });

    res.status(201).json({
      success: true,
      message: 'Notificação de tarefa criada com sucesso',
      data: { 
        notifications_count: notifications.length,
        notification: {
          task_id,
          task_type,
          status,
          type: type || 'info'
        }
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação de tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
