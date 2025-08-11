const express = require('express');
const router = express.Router();
const DailyTask = require('../models/DailyTask');
const { authenticateToken } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validation');
const { pool } = require('../config/database'); // Assuming pool is exported from database.js

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @route POST /api/daily-tasks/initialize/:deviceId
 * @desc Inicializar tarefas de 21 dias para um dispositivo
 * @access Private
 */
router.post('/initialize/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Verificar se o dispositivo existe
    const Device = require('../models/Device');
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dispositivo não encontrado' 
      });
    }

    // Inicializar tarefas
    const result = await DailyTask.initializeTasks(deviceId);
    
    res.status(201).json({
      success: true,
      message: 'Tarefas de 21 dias inicializadas com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro ao inicializar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/daily-tasks/device/:deviceId
 * @desc Listar todas as tarefas de um dispositivo
 * @access Private
 */
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { day_number, status, task_type } = req.query;
    
    const options = {};
    if (day_number) options.day_number = parseInt(day_number);
    if (status) options.status = status;
    if (task_type) options.task_type = task_type;
    
    const tasks = await DailyTask.getTasksByDevice(deviceId, options);
    
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/daily-tasks/device/:deviceId/day/:dayNumber
 * @desc Listar tarefas de um dia específico
 * @access Private
 */
router.get('/device/:deviceId/day/:dayNumber', async (req, res) => {
  try {
    const { deviceId, dayNumber } = req.params;
    
    if (dayNumber < 1 || dayNumber > 21) {
      return res.status(400).json({
        success: false,
        message: 'Dia deve estar entre 1 e 21'
      });
    }
    
    const tasks = await DailyTask.getTasksByDeviceAndDay(deviceId, parseInt(dayNumber));
    
    res.json({
      success: true,
      data: tasks,
      day: parseInt(dayNumber),
      count: tasks.length
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas do dia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/daily-tasks/:id
 * @desc Buscar tarefa específica por ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await DailyTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/daily-tasks
 * @desc Criar nova tarefa personalizada
 * @access Private
 */
router.post('/', taskValidation, async (req, res) => {
  try {
    const { device_id, day_number, task_type, task_description, metadata } = req.body;
    
    // Verificar se o dispositivo existe
    const Device = require('../models/Device');
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }
    
    const task = await DailyTask.create({
      device_id,
      day_number,
      task_type,
      task_description,
      metadata: metadata || {}
    });
    
    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      data: task
    });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/daily-tasks/:id
 * @desc Atualizar tarefa
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, metadata } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (metadata) updateData.metadata = metadata;
    
    const task = await DailyTask.update(id, updateData);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      data: task
    });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/daily-tasks/:id/complete
 * @desc Marcar tarefa como concluída
 * @access Private
 */
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const task = await DailyTask.complete(id, notes);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Tarefa marcada como concluída',
      data: task
    });
  } catch (error) {
    console.error('Erro ao completar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/daily-tasks/:id
 * @desc Deletar tarefa
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await DailyTask.delete(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarefa não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Tarefa deletada com sucesso',
      data: task
    });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/daily-tasks/progress/:deviceId
 * @desc Obter estatísticas de progresso
 * @access Private
 */
router.get('/progress/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const progress = await DailyTask.getProgressStats(deviceId);
    
    // Calcular estatísticas gerais
    const totalTasks = progress.reduce((sum, day) => sum + parseInt(day.total_tasks), 0);
    const completedTasks = progress.reduce((sum, day) => sum + parseInt(day.completed_tasks), 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        daily_progress: progress,
        overall_stats: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: totalTasks - completedTasks,
          overall_percentage: overallProgress
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/daily-tasks/device/:deviceId/clear
 * @desc Limpar todas as tarefas de um dispositivo
 * @access Private
 */
router.delete('/device/:deviceId/clear', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const deletedCount = await DailyTask.clearDeviceTasks(deviceId);
    
    res.json({
      success: true,
      message: `${deletedCount} tarefas removidas com sucesso`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Erro ao limpar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/daily-tasks/templates
 * @desc Obter templates de tarefas padrão
 * @access Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = DailyTask.getDefaultTasks();
    
    res.json({
      success: true,
      data: templates,
      total_days: Object.keys(templates).length
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatórios
router.get('/reports/overview', async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (deviceId) {
      whereClause += ' WHERE device_id = $1';
      params.push(deviceId);
    }
    
    if (startDate && endDate) {
      const paramIndex = params.length + 1;
      whereClause += params.length > 0 ? ' AND' : ' WHERE';
      whereClause += ` created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
    }
    
    // Estatísticas gerais
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        AVG(CASE WHEN status = 'completed' THEN progress END) as avg_progress,
        COUNT(DISTINCT device_id) as total_devices,
        COUNT(DISTINCT day_number) as total_days
      FROM daily_tasks
      ${whereClause}
    `;
    
    const statsResult = await pool.query(statsQuery, params);
    const stats = statsResult.rows[0];
    
    // Progresso por dia
    const dailyProgressQuery = `
      SELECT 
        day_number,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        AVG(progress) as avg_progress
      FROM daily_tasks
      ${whereClause}
      GROUP BY day_number
      ORDER BY day_number
    `;
    
    const dailyProgressResult = await pool.query(dailyProgressQuery, params);
    
    // Progresso por tipo de tarefa
    const taskTypeQuery = `
      SELECT 
        type,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        AVG(progress) as avg_progress
      FROM daily_tasks
      ${whereClause}
      GROUP BY type
      ORDER BY total_tasks DESC
    `;
    
    const taskTypeResult = await pool.query(taskTypeQuery, params);
    
    // Progresso por dispositivo
    const deviceProgressQuery = `
      SELECT 
        d.device_id,
        d.name as device_name,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN dt.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN dt.status = 'failed' THEN 1 END) as failed_tasks,
        AVG(dt.progress) as avg_progress,
        MAX(dt.updated_at) as last_activity
      FROM daily_tasks dt
      JOIN devices d ON dt.device_id = d.id
      ${whereClause.replace('device_id', 'dt.device_id')}
      GROUP BY d.device_id, d.name
      ORDER BY completed_tasks DESC
    `;
    
    const deviceProgressResult = await pool.query(deviceProgressQuery, params);
    
    // Tendências temporais
    const temporalQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks
      FROM daily_tasks
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    const temporalResult = await pool.query(temporalQuery, params);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTasks: parseInt(stats.total_tasks) || 0,
          completedTasks: parseInt(stats.completed_tasks) || 0,
          failedTasks: parseInt(stats.failed_tasks) || 0,
          inProgressTasks: parseInt(stats.in_progress_tasks) || 0,
          pendingTasks: parseInt(stats.pending_tasks) || 0,
          avgProgress: parseFloat(stats.avg_progress) || 0,
          totalDevices: parseInt(stats.total_devices) || 0,
          totalDays: parseInt(stats.total_days) || 0,
          successRate: stats.total_tasks > 0 ? 
            ((parseInt(stats.completed_tasks) / parseInt(stats.total_tasks)) * 100).toFixed(2) : 0
        },
        dailyProgress: dailyProgressResult.rows,
        taskTypes: taskTypeResult.rows,
        deviceProgress: deviceProgressResult.rows,
        temporalTrends: temporalResult.rows
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

router.get('/reports/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Verificar se o dispositivo existe
    const deviceResult = await pool.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispositivo não encontrado' });
    }
    
    const device = deviceResult.rows[0];
    
    let whereClause = 'WHERE device_id = $1';
    const params = [deviceId];
    
    if (startDate && endDate) {
      whereClause += ' AND created_at >= $2 AND created_at <= $3';
      params.push(startDate, endDate);
    }
    
    // Estatísticas do dispositivo
    const deviceStatsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        AVG(progress) as avg_progress,
        MAX(updated_at) as last_activity,
        MIN(created_at) as first_activity
      FROM daily_tasks
      ${whereClause}
    `;
    
    const deviceStatsResult = await pool.query(deviceStatsQuery, params);
    const deviceStats = deviceStatsResult.rows[0];
    
    // Progresso por dia
    const dailyProgressQuery = `
      SELECT 
        day_number,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        AVG(progress) as avg_progress,
        MAX(updated_at) as last_activity
      FROM daily_tasks
      ${whereClause}
      GROUP BY day_number
      ORDER BY day_number
    `;
    
    const dailyProgressResult = await pool.query(dailyProgressQuery, params);
    
    // Tarefas por tipo
    const taskTypeQuery = `
      SELECT 
        type,
        description,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        AVG(progress) as avg_progress
      FROM daily_tasks
      ${whereClause}
      GROUP BY type, description
      ORDER BY total_tasks DESC
    `;
    
    const taskTypeResult = await pool.query(taskTypeQuery, params);
    
    // Histórico de atividades
    const activityQuery = `
      SELECT 
        id,
        type,
        description,
        status,
        progress,
        created_at,
        updated_at,
        completed_at,
        day_number
      FROM daily_tasks
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    
    const activityResult = await pool.query(activityQuery, params);
    
    // Calcular métricas de performance
    const totalDays = dailyProgressResult.rows.length;
    const completedDays = dailyProgressResult.rows.filter(day => 
      day.completed_tasks === day.total_tasks && day.total_tasks > 0
    ).length;
    
    const avgCompletionTime = deviceStats.first_activity && deviceStats.last_activity ? 
      (new Date(deviceStats.last_activity) - new Date(deviceStats.first_activity)) / (1000 * 60 * 60 * 24) : 0;
    
    res.json({
      success: true,
      data: {
        device: {
          id: device.id,
          name: device.name,
          deviceId: device.device_id,
          model: device.model,
          os: device.os,
          status: device.status
        },
        overview: {
          totalTasks: parseInt(deviceStats.total_tasks) || 0,
          completedTasks: parseInt(deviceStats.completed_tasks) || 0,
          failedTasks: parseInt(deviceStats.failed_tasks) || 0,
          inProgressTasks: parseInt(deviceStats.in_progress_tasks) || 0,
          pendingTasks: parseInt(deviceStats.pending_tasks) || 0,
          avgProgress: parseFloat(deviceStats.avg_progress) || 0,
          successRate: deviceStats.total_tasks > 0 ? 
            ((parseInt(deviceStats.completed_tasks) / parseInt(deviceStats.total_tasks)) * 100).toFixed(2) : 0,
          totalDays,
          completedDays,
          avgCompletionTime: avgCompletionTime.toFixed(1),
          lastActivity: deviceStats.last_activity,
          firstActivity: deviceStats.first_activity
        },
        dailyProgress: dailyProgressResult.rows,
        taskTypes: taskTypeResult.rows,
        recentActivity: activityResult.rows
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do dispositivo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

router.get('/reports/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { deviceId, startDate, endDate, reportType } = req.query;
    
    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Formato não suportado' });
    }
    
    let whereClause = '';
    const params = [];
    
    if (deviceId) {
      whereClause += ' WHERE device_id = $1';
      params.push(deviceId);
    }
    
    if (startDate && endDate) {
      const paramIndex = params.length + 1;
      whereClause += params.length > 0 ? ' AND' : ' WHERE';
      whereClause += ` created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
    }
    
    let query = '';
    let filename = '';
    
    switch (reportType) {
      case 'daily_progress':
        query = `
          SELECT 
            day_number as "Dia",
            COUNT(*) as "Total de Tarefas",
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as "Tarefas Concluídas",
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as "Tarefas Falhadas",
            ROUND(AVG(progress), 2) as "Progresso Médio (%)"
          FROM daily_tasks
          ${whereClause}
          GROUP BY day_number
          ORDER BY day_number
        `;
        filename = `relatorio_progresso_diario_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'task_types':
        query = `
          SELECT 
            type as "Tipo de Tarefa",
            COUNT(*) as "Total",
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as "Concluídas",
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as "Falhadas",
            ROUND(AVG(progress), 2) as "Progresso Médio (%)"
          FROM daily_tasks
          ${whereClause}
          GROUP BY type
          ORDER BY COUNT(*) DESC
        `;
        filename = `relatorio_tipos_tarefa_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'device_summary':
        query = `
          SELECT 
            d.name as "Dispositivo",
            d.device_id as "ID do Dispositivo",
            COUNT(*) as "Total de Tarefas",
            COUNT(CASE WHEN dt.status = 'completed' THEN 1 END) as "Tarefas Concluídas",
            COUNT(CASE WHEN dt.status = 'failed' THEN 1 END) as "Tarefas Falhadas",
            ROUND(AVG(dt.progress), 2) as "Progresso Médio (%)",
            MAX(dt.updated_at) as "Última Atividade"
          FROM daily_tasks dt
          JOIN devices d ON dt.device_id = d.id
          ${whereClause.replace('device_id', 'dt.device_id')}
          GROUP BY d.id, d.name, d.device_id
          ORDER BY COUNT(CASE WHEN dt.status = 'completed' THEN 1 END) DESC
        `;
        filename = `relatorio_resumo_dispositivos_${new Date().toISOString().split('T')[0]}`;
        break;
        
      default:
        query = `
          SELECT 
            dt.id,
            d.name as device_name,
            dt.day_number,
            dt.type,
            dt.description,
            dt.status,
            dt.progress,
            dt.created_at,
            dt.updated_at,
            dt.completed_at
          FROM daily_tasks dt
          JOIN devices d ON dt.device_id = d.id
          ${whereClause.replace('device_id', 'dt.device_id')}
          ORDER BY dt.created_at DESC
        `;
        filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}`;
    }
    
    const result = await pool.query(query, params);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(result.rows);
    } else if (format === 'csv') {
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else if (format === 'xlsx') {
      const workbook = convertToXLSX(result.rows, filename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      workbook.pipe(res);
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
});

// Função auxiliar para converter para CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Função auxiliar para converter para XLSX
function convertToXLSX(data, filename) {
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = router;
