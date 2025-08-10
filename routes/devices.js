const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { authenticateToken, requireAdminOrUser } = require('../middleware/auth');
const { deviceValidation, deviceIdValidation, paginationValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// GET /api/devices - Listar dispositivos
router.get('/', authenticateToken, requireAdminOrUser, paginationValidation, async (req, res) => {
  try {
    const { page, limit, status, isOnline } = req.query;
    
    const result = await Device.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar dispositivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/devices/:id - Obter dispositivo específico
router.get('/:id', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const device = await Device.findById(parseInt(req.params.id));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    res.json({
      success: true,
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao buscar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices - Criar dispositivo
router.post('/', authenticateToken, requireAdminOrUser, deviceValidation, async (req, res) => {
  try {
    const device = await Device.create(req.body);

    // Log de auditoria
    logAudit('create_device', req.user.id, { device_id: device.id, device_name: device.device_name });

    res.status(201).json({
      success: true,
      message: 'Dispositivo criado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao criar dispositivo:', error);
    
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

// PUT /api/devices/:id - Atualizar dispositivo
router.put('/:id', authenticateToken, requireAdminOrUser, deviceIdValidation, deviceValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const updateData = { ...req.body };
    
    // Remover campos que não devem ser atualizados
    delete updateData.created_at;
    delete updateData.updated_at;

    const device = await Device.update(deviceId, updateData);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('update_device', req.user.id, { device_id: deviceId, changes: updateData });

    res.json({
      success: true,
      message: 'Dispositivo atualizado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao atualizar dispositivo:', error);
    
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

// DELETE /api/devices/:id - Deletar dispositivo
router.delete('/:id', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    const device = await Device.delete(deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('delete_device', req.user.id, { device_id: deviceId, device_name: device.device_name });

    res.json({
      success: true,
      message: 'Dispositivo deletado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao deletar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices/:id/connect - Conectar dispositivo
router.post('/:id/connect', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    const device = await Device.connect(deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('connect_device', req.user.id, { device_id: deviceId, device_name: device.device_name });

    res.json({
      success: true,
      message: 'Dispositivo conectado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao conectar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices/:id/disconnect - Desconectar dispositivo
router.post('/:id/disconnect', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    
    const device = await Device.disconnect(deviceId);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('disconnect_device', req.user.id, { device_id: deviceId, device_name: device.device_name });

    res.json({
      success: true,
      message: 'Dispositivo desconectado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao desconectar dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices/:id/update-status - Atualizar status online
router.post('/:id/update-status', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const { isOnline, ipAddress } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnline deve ser true ou false'
      });
    }

    const device = await Device.updateOnlineStatus(deviceId, isOnline, ipAddress);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Status do dispositivo atualizado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao atualizar status do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices/:id/update-info - Atualizar informações do dispositivo
router.post('/:id/update-info', authenticateToken, requireAdminOrUser, deviceIdValidation, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const deviceInfo = req.body;

    const device = await Device.updateDeviceInfo(deviceId, deviceInfo);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Informações do dispositivo atualizadas com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro ao atualizar informações do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/devices/stats/overview - Estatísticas de dispositivos
router.get('/stats/overview', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const stats = await Device.getStats();

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

// GET /api/devices/online/list - Dispositivos online
router.get('/online/list', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const devices = await Device.getOnlineDevices();

    res.json({
      success: true,
      data: { devices }
    });
  } catch (error) {
    console.error('Erro ao buscar dispositivos online:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/devices/offline/list - Dispositivos offline há muito tempo
router.get('/offline/list', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const devices = await Device.getOfflineDevices(parseInt(hours));

    res.json({
      success: true,
      data: { devices }
    });
  } catch (error) {
    console.error('Erro ao buscar dispositivos offline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/devices/search/query - Buscar dispositivos
router.get('/search/query', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { q, status, isOnline, page, limit } = req.query;
    
    const result = await Device.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined
    });

    // Filtrar por termo de busca se fornecido
    if (q) {
      const searchTerm = q.toLowerCase();
      result.devices = result.devices.filter(device => 
        device.device_name.toLowerCase().includes(searchTerm) ||
        device.device_id.toLowerCase().includes(searchTerm) ||
        (device.model && device.model.toLowerCase().includes(searchTerm))
      );
      result.pagination.total = result.devices.length;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro na busca de dispositivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// API para dispositivos Android se conectarem
// POST /api/devices/connect - Conectar dispositivo (API Android)
router.post('/connect/android', async (req, res) => {
  try {
    const { device_id, device_info } = req.body;

    if (!device_id || !device_info) {
      return res.status(400).json({
        success: false,
        message: 'device_id e device_info são obrigatórios'
      });
    }

    // Verificar se dispositivo já existe
    let device = await Device.findByDeviceId(device_id);
    
    if (!device) {
      // Criar novo dispositivo
      device = await Device.create({
        device_id,
        device_name: device_info.device_name || `Device ${device_id}`,
        model: device_info.model,
        android_version: device_info.android_version,
        whatsapp_version: device_info.whatsapp_version,
        battery_level: device_info.battery_level,
        battery_charging: device_info.battery_charging,
        wifi_connected: device_info.wifi_connected,
        mobile_data: device_info.mobile_data,
        ip_address: req.ip,
        mac_address: device_info.mac_address
      });
    } else {
      // Atualizar informações do dispositivo
      device = await Device.updateDeviceInfo(device_id, {
        ...device_info,
        ip_address: req.ip
      });
    }

    // Conectar dispositivo
    device = await Device.connect(device_id);

    res.json({
      success: true,
      message: 'Dispositivo conectado com sucesso',
      data: { device }
    });
  } catch (error) {
    console.error('Erro na conexão do dispositivo Android:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/devices/heartbeat - Heartbeat do dispositivo (API Android)
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id, device_info } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: 'device_id é obrigatório'
      });
    }

    // Atualizar informações do dispositivo
    const device = await Device.updateDeviceInfo(device_id, {
      ...device_info,
      ip_address: req.ip
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Dispositivo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Heartbeat recebido',
      data: { device }
    });
  } catch (error) {
    console.error('Erro no heartbeat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
