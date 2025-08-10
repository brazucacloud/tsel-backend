const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class Content {
  // Criar tabela de conteúdo
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        content_id VARCHAR(100) UNIQUE NOT NULL,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        whatsapp_number VARCHAR(20),
        content_type VARCHAR(20) NOT NULL,
        action VARCHAR(50),
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        dimensions JSONB,
        duration INTEGER,
        message_content TEXT,
        metadata JSONB,
        processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        file_hash VARCHAR(64),
        tags JSONB,
        content_rating VARCHAR(20) DEFAULT 'safe',
        is_private BOOLEAN NOT NULL DEFAULT false,
        access_level VARCHAR(20) DEFAULT 'public',
        usage_stats JSONB,
        backup_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_content_content_id ON content(content_id);
      CREATE INDEX IF NOT EXISTS idx_content_task_id ON content(task_id);
      CREATE INDEX IF NOT EXISTS idx_content_device_id ON content(device_id);
      CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content(processing_status);
      CREATE INDEX IF NOT EXISTS idx_content_rating ON content(content_rating);
      CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela content criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela content:', error);
      throw error;
    }
  }

  // Criar conteúdo
  static async create(contentData) {
    const {
      task_id,
      device_id,
      whatsapp_number,
      content_type,
      action,
      file_name,
      file_path,
      file_size,
      mime_type,
      dimensions,
      duration,
      message_content,
      metadata = {},
      tags = [],
      content_rating = 'safe',
      is_private = false,
      access_level = 'public'
    } = contentData;

    const content_id = uuidv4();

    const insertQuery = `
      INSERT INTO content (
        content_id, task_id, device_id, whatsapp_number, content_type,
        action, file_name, file_path, file_size, mime_type, dimensions,
        duration, message_content, metadata, tags, content_rating,
        is_private, access_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        content_id, task_id, device_id, whatsapp_number, content_type,
        action, file_name, file_path, file_size, mime_type, 
        dimensions ? JSON.stringify(dimensions) : null,
        duration, message_content, JSON.stringify(metadata),
        JSON.stringify(tags), content_rating, is_private, access_level
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar conteúdo por ID
  static async findById(id) {
    const query = `
      SELECT c.*, t.type as task_type, d.device_name
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar conteúdo por content_id
  static async findByContentId(contentId) {
    const query = `
      SELECT c.*, t.type as task_type, d.device_name
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      WHERE c.content_id = $1 AND c.deleted_at IS NULL
    `;
    
    try {
      const result = await query(query, [contentId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar todo o conteúdo
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      content_type, 
      processing_status, 
      content_rating,
      device_id,
      task_id,
      startDate,
      endDate
    } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE c.deleted_at IS NULL';
    const params = [];
    let paramCount = 0;
    
    if (content_type) {
      paramCount++;
      whereClause += ` AND c.content_type = $${paramCount}`;
      params.push(content_type);
    }
    
    if (processing_status) {
      paramCount++;
      whereClause += ` AND c.processing_status = $${paramCount}`;
      params.push(processing_status);
    }
    
    if (content_rating) {
      paramCount++;
      whereClause += ` AND c.content_rating = $${paramCount}`;
      params.push(content_rating);
    }
    
    if (device_id) {
      paramCount++;
      whereClause += ` AND c.device_id = $${paramCount}`;
      params.push(device_id);
    }
    
    if (task_id) {
      paramCount++;
      whereClause += ` AND c.task_id = $${paramCount}`;
      params.push(task_id);
    }
    
    if (startDate) {
      paramCount++;
      whereClause += ` AND c.created_at >= $${paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      whereClause += ` AND c.created_at <= $${paramCount}`;
      params.push(endDate);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT c.*, t.type as task_type, d.device_name
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset])
      ]);
      
      return {
        content: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Atualizar conteúdo
  static async update(id, updateData) {
    const allowedFields = [
      'processing_status', 'metadata', 'tags', 'content_rating',
      'is_private', 'access_level', 'usage_stats', 'backup_info',
      'file_hash', 'dimensions', 'duration'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        if (key === 'metadata' || key === 'tags' || key === 'usage_stats' || 
            key === 'backup_info' || key === 'dimensions') {
          updates.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }
    
    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const updateQuery = `
      UPDATE content
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar status de processamento
  static async updateProcessingStatus(id, status, metadata = null) {
    const updateQuery = `
      UPDATE content
      SET 
        processing_status = $1,
        metadata = COALESCE($2, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    
    try {
      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      const result = await query(updateQuery, [status, metadataJson, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar conteúdo (soft delete)
  static async delete(id) {
    const deleteQuery = `
      UPDATE content
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, content_id, file_name
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar conteúdo permanentemente
  static async deletePermanent(id) {
    const content = await this.findById(id);
    if (!content) {
      throw new Error('Conteúdo não encontrado');
    }

    // Deletar arquivo físico se existir
    if (content.file_path && fs.existsSync(content.file_path)) {
      try {
        fs.unlinkSync(content.file_path);
      } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
      }
    }

    const deleteQuery = `
      DELETE FROM content
      WHERE id = $1
      RETURNING id, content_id, file_name
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Conteúdo por dispositivo
  static async getContentByDevice(deviceId, options = {}) {
    const { content_type, limit = 50 } = options;
    
    let whereClause = 'WHERE c.device_id = $1 AND c.deleted_at IS NULL';
    const params = [deviceId];
    let paramCount = 1;
    
    if (content_type) {
      paramCount++;
      whereClause += ` AND c.content_type = $${paramCount}`;
      params.push(content_type);
    }
    
    const query = `
      SELECT c.*, t.type as task_type
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1}
    `;
    
    try {
      const result = await query(query, [...params, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Conteúdo por tarefa
  static async getContentByTask(taskId) {
    const query = `
      SELECT c.*, d.device_name
      FROM content c
      LEFT JOIN devices d ON c.device_id = d.id
      WHERE c.task_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `;
    
    try {
      const result = await query(query, [taskId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de conteúdo
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_content,
        COUNT(CASE WHEN content_type = 'audio' THEN 1 END) as audio_content,
        COUNT(CASE WHEN content_type = 'video' THEN 1 END) as video_content,
        COUNT(CASE WHEN content_type = 'image' THEN 1 END) as image_content,
        COUNT(CASE WHEN content_type = 'document' THEN 1 END) as document_content,
        COUNT(CASE WHEN content_type = 'message' THEN 1 END) as message_content,
        COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending_content,
        COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing_content,
        COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_content,
        COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_content,
        COUNT(CASE WHEN content_rating = 'safe' THEN 1 END) as safe_content,
        COUNT(CASE WHEN content_rating = 'sensitive' THEN 1 END) as sensitive_content,
        COUNT(CASE WHEN content_rating = 'inappropriate' THEN 1 END) as inappropriate_content,
        COUNT(CASE WHEN content_rating = 'spam' THEN 1 END) as spam_content,
        COUNT(CASE WHEN is_private = true THEN 1 END) as private_content,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_content,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_content,
        SUM(CASE WHEN file_size IS NOT NULL THEN file_size ELSE 0 END) as total_size,
        AVG(CASE WHEN file_size IS NOT NULL THEN file_size END) as avg_file_size
      FROM content
      WHERE deleted_at IS NULL
    `;
    
    try {
      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar por tags
  static async findByTags(tags, options = {}) {
    const { limit = 20 } = options;
    
    const query = `
      SELECT c.*, t.type as task_type, d.device_name
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      WHERE c.deleted_at IS NULL
      AND c.tags ?| $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await query(query, [tags, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Buscar por rating
  static async findByRating(rating, options = {}) {
    const { limit = 20 } = options;
    
    const query = `
      SELECT c.*, t.type as task_type, d.device_name
      FROM content c
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN devices d ON c.device_id = d.id
      WHERE c.deleted_at IS NULL
      AND c.content_rating = $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await query(query, [rating, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar estatísticas de uso
  static async updateUsageStats(id, usageData) {
    const updateQuery = `
      UPDATE content
      SET 
        usage_stats = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [JSON.stringify(usageData), id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Limpar conteúdo antigo
  static async cleanupOldContent(days = 90) {
    const deleteQuery = `
      UPDATE content
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
      AND deleted_at IS NULL
      AND is_private = false
    `;
    
    try {
      const result = await query(deleteQuery);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Content;
