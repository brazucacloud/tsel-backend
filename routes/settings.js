const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { settingValidation, settingKeyValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// GET /api/settings - Listar configurações
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.findAll();

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/settings/:key - Obter configuração específica
router.get('/:key', authenticateToken, requireAdmin, settingKeyValidation, async (req, res) => {
  try {
    const setting = await Setting.findByKey(req.params.key);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    res.json({
      success: true,
      data: { setting }
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/settings - Criar configuração
router.post('/', authenticateToken, requireAdmin, settingValidation, async (req, res) => {
  try {
    const { key, value, description } = req.body;

    const setting = await Setting.create({
      key,
      value,
      description
    });

    // Log de auditoria
    logAudit('create_setting', req.user.id, { key, value });

    res.status(201).json({
      success: true,
      message: 'Configuração criada com sucesso',
      data: { setting }
    });
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    
    if (error.message.includes('já existe')) {
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

// PUT /api/settings/:key - Atualizar configuração
router.put('/:key', authenticateToken, requireAdmin, settingKeyValidation, settingValidation, async (req, res) => {
  try {
    const { value, description } = req.body;
    
    const setting = await Setting.update(req.params.key, {
      value,
      description
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    // Log de auditoria
    logAudit('update_setting', req.user.id, { key: req.params.key, value, description });

    res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: { setting }
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/settings/:key - Deletar configuração
router.delete('/:key', authenticateToken, requireAdmin, settingKeyValidation, async (req, res) => {
  try {
    const setting = await Setting.delete(req.params.key);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }

    // Log de auditoria
    logAudit('delete_setting', req.user.id, { key: req.params.key, value: setting.value });

    res.json({
      success: true,
      message: 'Configuração deletada com sucesso',
      data: { setting }
    });
  } catch (error) {
    console.error('Erro ao deletar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/settings/init - Inicializar configurações padrão
router.post('/init', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Setting.createDefaultSettings();

    // Log de auditoria
    logAudit('init_settings', req.user.id, {});

    res.json({
      success: true,
      message: 'Configurações padrão inicializadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/settings/value/:key - Obter valor de configuração
router.get('/value/:key', authenticateToken, requireAdmin, settingKeyValidation, async (req, res) => {
  try {
    const value = await Setting.getValue(req.params.key);
    
    res.json({
      success: true,
      data: { 
        key: req.params.key,
        value 
      }
    });
  } catch (error) {
    console.error('Erro ao buscar valor da configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/settings/value/:key - Definir valor de configuração
router.post('/value/:key', authenticateToken, requireAdmin, settingKeyValidation, async (req, res) => {
  try {
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Valor é obrigatório'
      });
    }

    const setting = await Setting.setValue(req.params.key, value, description);

    // Log de auditoria
    logAudit('set_setting_value', req.user.id, { key: req.params.key, value, description });

    res.json({
      success: true,
      message: 'Valor da configuração definido com sucesso',
      data: { setting }
    });
  } catch (error) {
    console.error('Erro ao definir valor da configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/settings/system - Configurações do sistema
router.get('/system/info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const systemSettings = await Setting.findAll();
    
    // Filtrar apenas configurações do sistema
    const systemInfo = systemSettings.filter(setting => 
      setting.key.startsWith('system_') || 
      setting.key.startsWith('api_') || 
      setting.key.startsWith('backup_') ||
      setting.key.startsWith('notification_')
    );

    res.json({
      success: true,
      data: { 
        system_settings: systemInfo,
        total_settings: systemSettings.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/settings/backup - Backup de configurações
router.post('/backup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.findAll();
    
    const backup = {
      timestamp: new Date().toISOString(),
      settings: settings,
      version: '1.0.0'
    };

    // Log de auditoria
    logAudit('backup_settings', req.user.id, { settings_count: settings.length });

    res.json({
      success: true,
      message: 'Backup de configurações gerado com sucesso',
      data: { backup }
    });
  } catch (error) {
    console.error('Erro ao gerar backup de configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/settings/restore - Restaurar configurações
router.post('/restore', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { backup } = req.body;

    if (!backup || !backup.settings) {
      return res.status(400).json({
        success: false,
        message: 'Dados de backup inválidos'
      });
    }

    // Restaurar configurações
    for (const setting of backup.settings) {
      await Setting.setValue(setting.key, setting.value, setting.description);
    }

    // Log de auditoria
    logAudit('restore_settings', req.user.id, { 
      settings_count: backup.settings.length,
      backup_timestamp: backup.timestamp 
    });

    res.json({
      success: true,
      message: 'Configurações restauradas com sucesso',
      data: { 
        restored_count: backup.settings.length,
        backup_timestamp: backup.timestamp
      }
    });
  } catch (error) {
    console.error('Erro ao restaurar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
