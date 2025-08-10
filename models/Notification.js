const { query } = require('../config/database');

class Notification {
  // Criar tabela de notificações
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        is_read BOOLEAN NOT NULL DEFAULT false,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela notifications criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela notifications:', error);
      throw error;
    }
  }

  // Criar notificação
  static async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type = 'info',
      data = {}
    } = notificationData;

    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        user_id, title, message, type, JSON.stringify(data)
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Criar notificação para todos os usuários
  static async createForAllUsers(notificationData) {
    const { title, message, type = 'info', data = {} } = notificationData;

    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type, data)
      SELECT id, $1, $2, $3, $4
      FROM users
      WHERE is_active = true
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        title, message, type, JSON.stringify(data)
      ]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Buscar notificação por ID
  static async findById(id) {
    const query = `
      SELECT n.*, u.username, u.email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = $1
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar notificações de um usuário
  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, isRead, type } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE n.user_id = $1';
    const params = [userId];
    let paramCount = 1;
    
    if (isRead !== undefined) {
      paramCount++;
      whereClause += ` AND n.is_read = $${paramCount}`;
      params.push(isRead);
    }
    
    if (type) {
      paramCount++;
      whereClause += ` AND n.type = $${paramCount}`;
      params.push(type);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT n.*, u.username, u.email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset])
      ]);
      
      return {
        notifications: dataResult.rows,
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

  // Listar todas as notificações (admin)
  static async findAll(options = {}) {
    const { page = 1, limit = 20, type, isRead, userId } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (type) {
      paramCount++;
      whereClause += ` AND n.type = $${paramCount}`;
      params.push(type);
    }
    
    if (isRead !== undefined) {
      paramCount++;
      whereClause += ` AND n.is_read = $${paramCount}`;
      params.push(isRead);
    }
    
    if (userId) {
      paramCount++;
      whereClause += ` AND n.user_id = $${paramCount}`;
      params.push(userId);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT n.*, u.username, u.email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset])
      ]);
      
      return {
        notifications: dataResult.rows,
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

  // Marcar como lida
  static async markAsRead(id, userId) {
    const updateQuery = `
      UPDATE notifications
      SET 
        is_read = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [id, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Marcar todas como lidas
  static async markAllAsRead(userId) {
    const updateQuery = `
      UPDATE notifications
      SET 
        is_read = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `;
    
    try {
      const result = await query(updateQuery, [userId]);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar notificação
  static async update(id, updateData) {
    const allowedFields = ['title', 'message', 'type', 'data'];
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        if (key === 'data') {
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
      UPDATE notifications
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar notificação
  static async delete(id, userId) {
    const deleteQuery = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id, title
    `;
    
    try {
      const result = await query(deleteQuery, [id, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar notificação (admin)
  static async deleteById(id) {
    const deleteQuery = `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING id, title
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Contar notificações não lidas
  static async countUnread(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    
    try {
      const result = await query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Notificações não lidas
  static async getUnread(userId, limit = 10) {
    const query = `
      SELECT n.*, u.username, u.email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.user_id = $1 AND n.is_read = false
      ORDER BY n.created_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de notificações
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read_notifications,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info_notifications,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_notifications,
        COUNT(CASE WHEN type = 'error' THEN 1 END) as error_notifications,
        COUNT(CASE WHEN type = 'success' THEN 1 END) as success_notifications,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_notifications,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_notifications
      FROM notifications
    `;
    
    try {
      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Limpar notificações antigas
  static async cleanupOldNotifications(days = 30) {
    const deleteQuery = `
      DELETE FROM notifications
      WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
      AND is_read = true
    `;
    
    try {
      const result = await query(deleteQuery);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // Criar notificação de sistema
  static async createSystemNotification(title, message, type = 'info', data = {}) {
    return await this.createForAllUsers({
      title,
      message,
      type,
      data: { ...data, system: true }
    });
  }

  // Criar notificação de dispositivo
  static async createDeviceNotification(deviceId, deviceName, action, type = 'info') {
    const title = `Dispositivo ${deviceName}`;
    const message = `Dispositivo ${deviceName} (${deviceId}) - ${action}`;
    
    return await this.createForAllUsers({
      title,
      message,
      type,
      data: { device_id: deviceId, device_name: deviceName, action }
    });
  }

  // Criar notificação de tarefa
  static async createTaskNotification(taskId, taskType, status, type = 'info') {
    const title = `Tarefa ${taskType}`;
    const message = `Tarefa ${taskType} (ID: ${taskId}) - Status: ${status}`;
    
    return await this.createForAllUsers({
      title,
      message,
      type,
      data: { task_id: taskId, task_type: taskType, status }
    });
  }
}

module.exports = Notification;
