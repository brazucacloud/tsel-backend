const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Device {
  // Criar tabela de dispositivos
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        device_name VARCHAR(100) NOT NULL,
        model VARCHAR(100),
        android_version VARCHAR(20),
        whatsapp_version VARCHAR(20),
        is_online BOOLEAN NOT NULL DEFAULT false,
        last_seen TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        battery_level INTEGER,
        battery_charging BOOLEAN,
        wifi_connected BOOLEAN,
        mobile_data BOOLEAN,
        ip_address VARCHAR(45),
        mac_address VARCHAR(17),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
      CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
      CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online);
      CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela devices criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela devices:', error);
      throw error;
    }
  }

  // Criar dispositivo
  static async create(deviceData) {
    const {
      device_id,
      device_name,
      model,
      android_version,
      whatsapp_version,
      battery_level,
      battery_charging,
      wifi_connected,
      mobile_data,
      ip_address,
      mac_address
    } = deviceData;

    const insertQuery = `
      INSERT INTO devices (
        device_id, device_name, model, android_version, whatsapp_version,
        battery_level, battery_charging, wifi_connected, mobile_data,
        ip_address, mac_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        device_id, device_name, model, android_version, whatsapp_version,
        battery_level, battery_charging, wifi_connected, mobile_data,
        ip_address, mac_address
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Device ID já está em uso');
      }
      throw error;
    }
  }

  // Buscar dispositivo por ID
  static async findById(id) {
    const query = `
      SELECT * FROM devices WHERE id = $1
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar dispositivo por device_id
  static async findByDeviceId(deviceId) {
    const query = `
      SELECT * FROM devices WHERE device_id = $1
    `;
    
    try {
      const result = await query(query, [deviceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar todos os dispositivos
  static async findAll(options = {}) {
    const { page = 1, limit = 10, status, isOnline } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    if (isOnline !== undefined) {
      paramCount++;
      whereClause += ` AND is_online = $${paramCount}`;
      params.push(isOnline);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM devices
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT * FROM devices
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset])
      ]);
      
      return {
        devices: dataResult.rows,
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

  // Atualizar dispositivo
  static async update(id, updateData) {
    const allowedFields = [
      'device_name', 'model', 'android_version', 'whatsapp_version',
      'battery_level', 'battery_charging', 'wifi_connected', 'mobile_data',
      'ip_address', 'mac_address', 'status'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }
    
    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const updateQuery = `
      UPDATE devices
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

  // Atualizar status online
  static async updateOnlineStatus(deviceId, isOnline, ipAddress = null) {
    const updateQuery = `
      UPDATE devices
      SET 
        is_online = $1,
        last_seen = CURRENT_TIMESTAMP,
        ip_address = COALESCE($2, ip_address),
        updated_at = CURRENT_TIMESTAMP
      WHERE device_id = $3
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [isOnline, ipAddress, deviceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar informações do dispositivo
  static async updateDeviceInfo(deviceId, deviceInfo) {
    const {
      battery_level,
      battery_charging,
      wifi_connected,
      mobile_data,
      ip_address,
      android_version,
      whatsapp_version
    } = deviceInfo;

    const updateQuery = `
      UPDATE devices
      SET 
        battery_level = $1,
        battery_charging = $2,
        wifi_connected = $3,
        mobile_data = $4,
        ip_address = $5,
        android_version = $6,
        whatsapp_version = $7,
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE device_id = $8
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [
        battery_level, battery_charging, wifi_connected, mobile_data,
        ip_address, android_version, whatsapp_version, deviceId
      ]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Conectar dispositivo
  static async connect(deviceId) {
    const updateQuery = `
      UPDATE devices
      SET 
        is_online = true,
        status = 'active',
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE device_id = $1
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [deviceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Desconectar dispositivo
  static async disconnect(deviceId) {
    const updateQuery = `
      UPDATE devices
      SET 
        is_online = false,
        status = 'inactive',
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE device_id = $1
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [deviceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar dispositivo
  static async delete(id) {
    const deleteQuery = `
      DELETE FROM devices
      WHERE id = $1
      RETURNING id, device_id, device_name
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de dispositivos
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN is_online = true THEN 1 END) as online_devices,
        COUNT(CASE WHEN is_online = false THEN 1 END) as offline_devices,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_devices,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_devices,
        COUNT(CASE WHEN battery_level <= 20 THEN 1 END) as low_battery_devices,
        COUNT(CASE WHEN wifi_connected = true THEN 1 END) as wifi_devices,
        COUNT(CASE WHEN mobile_data = true THEN 1 END) as mobile_data_devices,
        COUNT(CASE WHEN last_seen >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1 END) as recent_devices
      FROM devices
    `;
    
    try {
      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Dispositivos online
  static async getOnlineDevices() {
    const query = `
      SELECT * FROM devices
      WHERE is_online = true
      ORDER BY last_seen DESC
    `;
    
    try {
      const result = await query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Dispositivos offline há muito tempo
  static async getOfflineDevices(hours = 24) {
    const query = `
      SELECT * FROM devices
      WHERE is_online = false
      AND (last_seen IS NULL OR last_seen < CURRENT_TIMESTAMP - INTERVAL '${hours} hours')
      ORDER BY last_seen DESC
    `;
    
    try {
      const result = await query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Device;
