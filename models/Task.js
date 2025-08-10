const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  // Criar tabela de tarefas
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        parameters JSONB,
        result JSONB,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        scheduled_at TIMESTAMP,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_tasks_device_id ON tasks(device_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela tasks criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela tasks:', error);
      throw error;
    }
  }

  // Criar tarefa
  static async create(taskData) {
    const {
      device_id,
      type,
      priority = 'normal',
      parameters = {},
      scheduled_at = null,
      estimated_duration = null,
      max_retries = 3
    } = taskData;

    const insertQuery = `
      INSERT INTO tasks (
        device_id, type, priority, parameters, scheduled_at,
        estimated_duration, max_retries
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        device_id, type, priority, JSON.stringify(parameters),
        scheduled_at, estimated_duration, max_retries
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar tarefa por ID
  static async findById(id) {
    const query = `
      SELECT t.*, d.device_name, d.device_id as device_identifier
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      WHERE t.id = $1
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar todas as tarefas
  static async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      priority, 
      device_id,
      startDate,
      endDate
    } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereClause += ` AND t.status = $${paramCount}`;
      params.push(status);
    }
    
    if (type) {
      paramCount++;
      whereClause += ` AND t.type = $${paramCount}`;
      params.push(type);
    }
    
    if (priority) {
      paramCount++;
      whereClause += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }
    
    if (device_id) {
      paramCount++;
      whereClause += ` AND t.device_id = $${paramCount}`;
      params.push(device_id);
    }
    
    if (startDate) {
      paramCount++;
      whereClause += ` AND t.created_at >= $${paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      whereClause += ` AND t.created_at <= $${paramCount}`;
      params.push(endDate);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT t.*, d.device_name, d.device_id as device_identifier
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset])
      ]);
      
      return {
        tasks: dataResult.rows,
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

  // Atualizar tarefa
  static async update(id, updateData) {
    const allowedFields = [
      'status', 'priority', 'parameters', 'result', 'error',
      'started_at', 'completed_at', 'retry_count', 'scheduled_at',
      'estimated_duration', 'actual_duration'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        if (key === 'parameters' || key === 'result') {
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
      UPDATE tasks
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

  // Iniciar tarefa
  static async start(id) {
    const updateQuery = `
      UPDATE tasks
      SET 
        status = 'running',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Completar tarefa
  static async complete(id, result = null) {
    const updateQuery = `
      UPDATE tasks
      SET 
        status = 'completed',
        result = $1,
        completed_at = CURRENT_TIMESTAMP,
        actual_duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'running'
      RETURNING *
    `;
    
    try {
      const resultData = result ? JSON.stringify(result) : null;
      const dbResult = await query(updateQuery, [resultData, id]);
      return dbResult.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Falhar tarefa
  static async fail(id, error = null) {
    const updateQuery = `
      UPDATE tasks
      SET 
        status = 'failed',
        error = $1,
        completed_at = CURRENT_TIMESTAMP,
        actual_duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'running'
      RETURNING *
    `;
    
    try {
      const dbResult = await query(updateQuery, [error, id]);
      return dbResult.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cancelar tarefa
  static async cancel(id) {
    const updateQuery = `
      UPDATE tasks
      SET 
        status = 'cancelled',
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('pending', 'running')
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Tentar novamente
  static async retry(id) {
    const updateQuery = `
      UPDATE tasks
      SET 
        status = 'pending',
        retry_count = retry_count + 1,
        started_at = NULL,
        completed_at = NULL,
        error = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND retry_count < max_retries
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar tarefa
  static async delete(id) {
    const deleteQuery = `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id, type, status
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Tarefas pendentes
  static async getPendingTasks() {
    const query = `
      SELECT t.*, d.device_name, d.device_id as device_identifier
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      WHERE t.status = 'pending'
      AND (t.scheduled_at IS NULL OR t.scheduled_at <= CURRENT_TIMESTAMP)
      ORDER BY t.priority DESC, t.created_at ASC
    `;
    
    try {
      const result = await query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Tarefas em execução
  static async getRunningTasks() {
    const query = `
      SELECT t.*, d.device_name, d.device_id as device_identifier
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      WHERE t.status = 'running'
      ORDER BY t.started_at ASC
    `;
    
    try {
      const result = await query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Tarefas por dispositivo
  static async getTasksByDevice(deviceId, options = {}) {
    const { status, limit = 50 } = options;
    
    let whereClause = 'WHERE t.device_id = $1';
    const params = [deviceId];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      whereClause += ` AND t.status = $${paramCount}`;
      params.push(status);
    }
    
    const query = `
      SELECT t.*, d.device_name, d.device_id as device_identifier
      FROM tasks t
      LEFT JOIN devices d ON t.device_id = d.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramCount + 1}
    `;
    
    try {
      const result = await query(query, [...params, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de tarefas
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tasks,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_tasks,
        COUNT(CASE WHEN priority = 'normal' THEN 1 END) as normal_tasks,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_tasks,
        COUNT(CASE WHEN type = 'whatsapp_message' THEN 1 END) as message_tasks,
        COUNT(CASE WHEN type = 'whatsapp_media' THEN 1 END) as media_tasks,
        COUNT(CASE WHEN type = 'follow_up' THEN 1 END) as followup_tasks,
        COUNT(CASE WHEN type = 'custom' THEN 1 END) as custom_tasks,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_tasks,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_tasks,
        AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration
      FROM tasks
    `;
    
    try {
      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Limpar tarefas antigas
  static async cleanupOldTasks(days = 30) {
    const deleteQuery = `
      DELETE FROM tasks
      WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
      AND status IN ('completed', 'failed', 'cancelled')
    `;
    
    try {
      const result = await query(deleteQuery);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Task;
