const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdminOrUser } = require('../middleware/auth');
const { contentValidation, contentIdValidation, paginationValidation, dateFilterValidation } = require('../middleware/validation');
const { logAudit } = require('../utils/logger');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const contentType = req.body.content_type || 'general';
    const targetPath = path.join(uploadPath, contentType);
    
    // Criar diretório se não existir
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,mp4,avi,mov,mp3,wav,pdf,doc,docx').split(',');
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${ext}`));
    }
  }
});

// GET /api/content - Listar conteúdo
router.get('/', authenticateToken, requireAdminOrUser, paginationValidation, dateFilterValidation, async (req, res) => {
  try {
    const { page, limit, content_type, processing_status, content_rating, device_id, task_id, startDate, endDate } = req.query;
    
    const result = await Content.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      content_type,
      processing_status,
      content_rating,
      device_id: device_id ? parseInt(device_id) : undefined,
      task_id: task_id ? parseInt(task_id) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/:id - Obter conteúdo específico
router.get('/:id', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const content = await Content.findById(parseInt(req.params.id));
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/content - Criar conteúdo
router.post('/', authenticateToken, requireAdminOrUser, contentValidation, async (req, res) => {
  try {
    const content = await Content.create(req.body);

    // Log de auditoria
    logAudit('create_content', req.user.id, { 
      content_id: content.id, 
      content_type: content.content_type 
    });

    res.status(201).json({
      success: true,
      message: 'Conteúdo criado com sucesso',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao criar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/content/upload - Upload de arquivo
router.post('/upload', authenticateToken, requireAdminOrUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const fileInfo = {
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };

    // Determinar tipo de conteúdo baseado no MIME type
    let contentType = 'document';
    if (fileInfo.mime_type.startsWith('image/')) {
      contentType = 'image';
    } else if (fileInfo.mime_type.startsWith('video/')) {
      contentType = 'video';
    } else if (fileInfo.mime_type.startsWith('audio/')) {
      contentType = 'audio';
    }

    const contentData = {
      ...req.body,
      ...fileInfo,
      content_type: req.body.content_type || contentType
    };

    const content = await Content.create(contentData);

    // Log de auditoria
    logAudit('upload_content', req.user.id, { 
      content_id: content.id, 
      file_name: fileInfo.file_name,
      file_size: fileInfo.file_size
    });

    res.status(201).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: { content }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    
    if (error.message.includes('Tipo de arquivo não permitido')) {
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

// PUT /api/content/:id - Atualizar conteúdo
router.put('/:id', authenticateToken, requireAdminOrUser, contentIdValidation, contentValidation, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const updateData = { ...req.body };
    
    // Remover campos que não devem ser atualizados
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.deleted_at;

    const content = await Content.update(contentId, updateData);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('update_content', req.user.id, { content_id: contentId, changes: updateData });

    res.json({
      success: true,
      message: 'Conteúdo atualizado com sucesso',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/content/:id - Deletar conteúdo (soft delete)
router.delete('/:id', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    
    const content = await Content.delete(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('delete_content', req.user.id, { content_id: contentId, file_name: content.file_name });

    res.json({
      success: true,
      message: 'Conteúdo deletado com sucesso',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao deletar conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/content/:id/permanent - Deletar conteúdo permanentemente
router.delete('/:id/permanent', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    
    const content = await Content.deletePermanent(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('delete_content_permanent', req.user.id, { content_id: contentId, file_name: content.file_name });

    res.json({
      success: true,
      message: 'Conteúdo deletado permanentemente',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao deletar conteúdo permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/content/:id/process - Atualizar status de processamento
router.post('/:id/process', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const { status, metadata } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }

    const content = await Content.updateProcessingStatus(contentId, status, metadata);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Status de processamento atualizado',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao atualizar status de processamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/stats/overview - Estatísticas de conteúdo
router.get('/stats/overview', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const stats = await Content.getStats();

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

// GET /api/content/device/:deviceId - Conteúdo por dispositivo
router.get('/device/:deviceId', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const { content_type, limit } = req.query;
    
    const content = await Content.getContentByDevice(deviceId, {
      content_type,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao buscar conteúdo do dispositivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/task/:taskId - Conteúdo por tarefa
router.get('/task/:taskId', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    
    const content = await Content.getContentByTask(taskId);

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao buscar conteúdo da tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/tags/search - Buscar por tags
router.get('/tags/search', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { tags, limit } = req.query;
    
    if (!tags) {
      return res.status(400).json({
        success: false,
        message: 'Tags são obrigatórias'
      });
    }

    const tagsArray = tags.split(',').map(tag => tag.trim());
    const content = await Content.findByTags(tagsArray, {
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Erro na busca por tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/rating/:rating - Buscar por rating
router.get('/rating/:rating', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { rating } = req.params;
    const { limit } = req.query;
    
    const content = await Content.findByRating(rating, {
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Erro na busca por rating:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/search/query - Buscar conteúdo
router.get('/search/query', authenticateToken, requireAdminOrUser, async (req, res) => {
  try {
    const { q, content_type, processing_status, content_rating, device_id, task_id, startDate, endDate, page, limit } = req.query;
    
    const result = await Content.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      content_type,
      processing_status,
      content_rating,
      device_id: device_id ? parseInt(device_id) : undefined,
      task_id: task_id ? parseInt(task_id) : undefined,
      startDate,
      endDate
    });

    // Filtrar por termo de busca se fornecido
    if (q) {
      const searchTerm = q.toLowerCase();
      result.content = result.content.filter(item => 
        (item.file_name && item.file_name.toLowerCase().includes(searchTerm)) ||
        (item.message_content && item.message_content.toLowerCase().includes(searchTerm)) ||
        (item.whatsapp_number && item.whatsapp_number.includes(searchTerm)) ||
        (item.content_type && item.content_type.toLowerCase().includes(searchTerm))
      );
      result.pagination.total = result.content.length;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro na busca de conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/content/:id/download - Download de arquivo
router.get('/:id/download', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const content = await Content.findById(parseInt(req.params.id));
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    if (!content.file_path || !fs.existsSync(content.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Log de auditoria
    logAudit('download_content', req.user.id, { content_id: content.id, file_name: content.file_name });

    res.download(content.file_path, content.file_name);
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/content/:id/usage-stats - Atualizar estatísticas de uso
router.post('/:id/usage-stats', authenticateToken, requireAdminOrUser, contentIdValidation, async (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const usageData = req.body;

    const content = await Content.updateUsageStats(contentId, usageData);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Conteúdo não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estatísticas de uso atualizadas',
      data: { content }
    });
  } catch (error) {
    console.error('Erro ao atualizar estatísticas de uso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
