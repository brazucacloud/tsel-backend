const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const Task = require('../models/Task');
const Content = require('../models/Content');
const { authenticateToken, requireAdminOrUser } = require('../middleware/auth');
const { logAudit } = require('../utils/logger');

// GET /api/analytics/overview - Visão geral
router.get('/overview', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const [userStats, deviceStats, taskStats, contentStats] = await Promise.all([
      User.getStats(),
      Device.getStats(),
      Task.getStats(),
      Content.getStats()
    ]);

    const overview = {
      users: userStats,
      devices: deviceStats,
      tasks: taskStats,
      content: contentStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: { overview }
    });
  } catch (error) {
    console.error('Erro ao buscar overview:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/devices - Analytics de dispositivos
router.get('/devices', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const deviceStats = await Device.getStats();
    const onlineDevices = await Device.getOnlineDevices();
    const offlineDevices = await Device.getOfflineDevices(24);

    const analytics = {
      stats: deviceStats,
      online_devices: onlineDevices,
      offline_devices: offlineDevices,
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Erro ao buscar analytics de dispositivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/tasks - Analytics de tarefas
router.get('/tasks', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const taskStats = await Task.getStats();
    const pendingTasks = await Task.getPendingTasks();
    const runningTasks = await Task.getRunningTasks();

    const analytics = {
      stats: taskStats,
      pending_tasks: pendingTasks,
      running_tasks: runningTasks,
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Erro ao buscar analytics de tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/content - Analytics de conteúdo
router.get('/content', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const contentStats = await Content.getStats();

    const analytics = {
      stats: contentStats,
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Erro ao buscar analytics de conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/realtime - Dados em tempo real
router.get('/realtime', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const [onlineDevices, runningTasks, recentContent] = await Promise.all([
      Device.getOnlineDevices(),
      Task.getRunningTasks(),
      Content.findAll({ limit: 10 })
    ]);

    const realtime = {
      online_devices_count: onlineDevices.length,
      running_tasks_count: runningTasks.length,
      recent_content_count: recentContent.content.length,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { realtime }
    });
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/performance - Performance do sistema
router.get('/performance', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const performance = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        node_version: process.version,
        pid: process.pid
      },
      database: {
        // Aqui você pode adicionar métricas do banco de dados
        connections: 'N/A', // Implementar se necessário
        queries_per_second: 'N/A' // Implementar se necessário
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { performance }
    });
  } catch (error) {
    console.error('Erro ao buscar performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/trends - Tendências
router.get('/trends', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Implementar análise de tendências baseada no período
    const trends = {
      devices: {
        growth_rate: 0, // Implementar cálculo
        online_trend: [], // Implementar dados históricos
        offline_trend: [] // Implementar dados históricos
      },
      tasks: {
        completion_rate: 0, // Implementar cálculo
        success_rate: 0, // Implementar cálculo
        daily_trend: [] // Implementar dados históricos
      },
      content: {
        upload_trend: [], // Implementar dados históricos
        storage_growth: 0 // Implementar cálculo
      },
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    console.error('Erro ao buscar tendências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/export - Exportar relatórios
router.get('/export', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { type, format = 'json', period = '7d' } = req.query;
    
    let data;
    
    switch (type) {
      case 'devices':
        const deviceStats = await Device.getStats();
        const devices = await Device.findAll({ limit: 1000 });
        data = { stats: deviceStats, devices: devices.devices };
        break;
      case 'tasks':
        const taskStats = await Task.getStats();
        const tasks = await Task.findAll({ limit: 1000 });
        data = { stats: taskStats, tasks: tasks.tasks };
        break;
      case 'content':
        const contentStats = await Content.getStats();
        const content = await Content.findAll({ limit: 1000 });
        data = { stats: contentStats, content: content.content };
        break;
      case 'users':
        const userStats = await User.getStats();
        const users = await User.findAll({ limit: 1000 });
        data = { stats: userStats, users: users.users };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de relatório inválido'
        });
    }

    // Log de auditoria
    logAudit('export_analytics', req.user.id, { type, format, period });

    if (format === 'csv') {
      // Implementar exportação CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_${period}_${Date.now()}.csv`);
      res.send('CSV export not implemented yet');
    } else {
      res.json({
        success: true,
        data: { 
          type,
          format,
          period,
          timestamp: new Date().toISOString(),
          ...data
        }
      });
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/analytics/dashboard - Dados do dashboard
router.get('/dashboard', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const [userStats, deviceStats, taskStats, contentStats, onlineDevices, runningTasks] = await Promise.all([
      User.getStats(),
      Device.getStats(),
      Task.getStats(),
      Content.getStats(),
      Device.getOnlineDevices(),
      Task.getRunningTasks()
    ]);

    const dashboard = {
      summary: {
        total_users: userStats.total_users,
        total_devices: deviceStats.total_devices,
        total_tasks: taskStats.total_tasks,
        total_content: contentStats.total_content
      },
      status: {
        online_devices: onlineDevices.length,
        running_tasks: runningTasks.length,
        active_users: userStats.active_users
      },
      recent_activity: {
        devices: onlineDevices.slice(0, 5),
        tasks: runningTasks.slice(0, 5)
      },
      charts: {
        devices_by_status: {
          online: deviceStats.online_devices,
          offline: deviceStats.offline_devices
        },
        tasks_by_status: {
          pending: taskStats.pending_tasks,
          running: taskStats.running_tasks,
          completed: taskStats.completed_tasks,
          failed: taskStats.failed_tasks
        },
        content_by_type: {
          audio: contentStats.audio_content,
          video: contentStats.video_content,
          image: contentStats.image_content,
          document: contentStats.document_content,
          message: contentStats.message_content
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { dashboard }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
