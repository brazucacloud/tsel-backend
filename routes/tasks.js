const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Device = require('../models/Device');
const { authenticateToken, requireAdminOrUser } = require('../middleware/auth');
const { taskValidation, taskIdValidation, paginationValidation, dateFilterValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// GET /api/tasks - Listar tarefas
router.get('/', authenticateToken, requireAdminOrUser, paginationValidation, dateFilterValidation, async (req, res) => {
  try {
    const { page, limit, status, type, priority, device_id, startDate, endDate } = req.query;
    
    const result = await Task.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      type,
      priority,
      device_id: device_id ? parseInt(device_id) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/:id - Obter tarefa específica
router.get('/:id', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const task = await Task.findById(parseInt(req.params.id));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks - Criar tarefa
router.post('/', authenticateToken, requireAdminOrUser, taskValidation, async (req, res) => {
  try {
    const { device_id, type, priority, parameters, scheduled_at, estimated_duration, max_retries } = req.body;

    // Verificar se dispositivo existe e está online
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    if (!device.is_online) {
      return res.status(400).json({
        success: false,
        message: 'Dispositivo deve estar online para receber tarefas'
      });
    }

    const task = await Task.create({
      device_id,
      type,
      priority,
      parameters,
      scheduled_at,
      estimated_duration,
      max_retries
    });

    // Log de auditoria
    logAudit('create_task', req.user.id, { 
      task_id: task.id, 
      device_id, 
      type, 
      priority 
    });

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/tasks/:id - Atualizar tarefa
router.put('/:id', authenticateToken, requireAdminOrUser, taskIdValidation, taskValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updateData = { ...req.body };
    
    // Remover campos que não devem ser atualizados
    delete updateData.created_at;
    delete updateData.updated_at;

    const task = await Task.update(taskId, updateData);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    // Log de auditoria
    logAudit('update_task', req.user.id, { task_id: taskId, changes: updateData });

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/tasks/:id - Deletar tarefa
router.delete('/:id', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const task = await Task.delete(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    // Log de auditoria
    logAudit('delete_task', req.user.id, { task_id: taskId, type: task.type });

    res.json({
      success: true,
      message: 'Tarefa deletada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks/:id/start - Iniciar tarefa
router.post('/:id/start', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const task = await Task.start(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada ou não pode ser iniciada'
      });
    }

    // Log de auditoria
    logAudit('start_task', req.user.id, { task_id: taskId, type: task.type });

    res.json({
      success: true,
      message: 'Tarefa iniciada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao iniciar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks/:id/complete - Completar tarefa
router.post('/:id/complete', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { result } = req.body;
    
    const task = await Task.complete(taskId, result);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada ou não pode ser completada'
      });
    }

    // Log de auditoria
    logAudit('complete_task', req.user.id, { task_id: taskId, type: task.type });

    res.json({
      success: true,
      message: 'Tarefa completada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao completar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks/:id/fail - Falhar tarefa
router.post('/:id/fail', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { error } = req.body;
    
    const task = await Task.fail(taskId, error);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada ou não pode ser marcada como falha'
      });
    }

    // Log de auditoria
    logAudit('fail_task', req.user.id, { task_id: taskId, type: task.type, error });

    res.json({
      success: true,
      message: 'Tarefa marcada como falha',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao falhar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks/:id/cancel - Cancelar tarefa
router.post('/:id/cancel', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const task = await Task.cancel(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada ou não pode ser cancelada'
      });
    }

    // Log de auditoria
    logAudit('cancel_task', req.user.id, { task_id: taskId, type: task.type });

    res.json({
      success: true,
      message: 'Tarefa cancelada com sucesso',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao cancelar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/tasks/:id/retry - Tentar novamente
router.post('/:id/retry', authenticateToken, requireAdminOrUser, taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const task = await Task.retry(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada ou não pode ser tentada novamente'
      });
    }

    // Log de auditoria
    logAudit('retry_task', req.user.id, { task_id: taskId, type: task.type });

    res.json({
      success: true,
      message: 'Tarefa será tentada novamente',
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao tentar novamente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/stats/overview - Estatísticas de tarefas
router.get('/stats/overview', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const stats = await Task.getStats();

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

// GET /api/tasks/pending/list - Tarefas pendentes
router.get('/pending/list', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const tasks = await Task.getPendingTasks();

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/running/list - Tarefas em execução
router.get('/running/list', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const tasks = await Task.getRunningTasks();

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas em execução:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/device/:deviceId - Tarefas por dispositivo
router.get('/device/:deviceId', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const { status, limit } = req.query;
    
    const tasks = await Task.getTasksByDevice(deviceId, {
      status,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/search/query - Buscar tarefas
router.get('/search/query', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { q, status, type, priority, device_id, startDate, endDate, page, limit } = req.query;
    
    const result = await Task.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      type,
      priority,
      device_id: device_id ? parseInt(device_id) : undefined,
      startDate,
      endDate
    });

    // Filtrar por termo de busca se fornecido
    if (q) {
      const searchTerm = q.toLowerCase();
      result.tasks = result.tasks.filter(task => 
        task.type.toLowerCase().includes(searchTerm) ||
        (task.device_name && task.device_name.toLowerCase().includes(searchTerm)) ||
        (task.device_identifier && task.device_identifier.toLowerCase().includes(searchTerm))
      );
      result.pagination.total = result.tasks.length;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro na busca de tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// API para dispositivos Android reportarem status de tarefas
// POST /api/tasks/:id/status - Atualizar status da tarefa (API Android)
router.post('/:id/status', taskIdValidation, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, result, error } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }

    let task;
    
    switch (status) {
      case 'running':
        task = await Task.start(taskId);
        break;
      case 'completed':
        task = await Task.complete(taskId, result);
        break;
      case 'failed':
        task = await Task.fail(taskId, error);
        break;
      case 'cancelled':
        task = await Task.cancel(taskId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }

    res.json({
      success: true,
      message: `Tarefa ${status} com sucesso`,
      data: { task }
    });
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/tasks/pending/device/:deviceId - Tarefas pendentes para dispositivo
router.get('/pending/device/:deviceId', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    
    // Buscar dispositivo pelo device_id
    const device = await Device.findByDeviceId(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    // Buscar tarefas pendentes para o dispositivo
    const tasks = await Task.getTasksByDevice(device.id, {
      status: 'pending',
      limit: 10
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas pendentes para dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
