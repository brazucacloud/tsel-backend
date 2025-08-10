const { query } = require('../config/database');

class Setting {
  // Criar tabela de configurações
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela settings criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela settings:', error);
      throw error;
    }
  }

  // Criar configuração
  static async create(settingData) {
    const { key, value, description } = settingData;

    const insertQuery = `
      INSERT INTO settings (key, value, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [key, value, description]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Chave de configuração já existe');
      }
      throw error;
    }
  }

  // Buscar configuração por chave
  static async findByKey(key) {
    const query = `
      SELECT * FROM settings WHERE key = $1
    `;
    
    try {
      const result = await query(query, [key]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar todas as configurações
  static async findAll() {
    const query = `
      SELECT * FROM settings
      ORDER BY key ASC
    `;
    
    try {
      const result = await query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar configuração
  static async update(key, updateData) {
    const { value, description } = updateData;
    
    const updateQuery = `
      UPDATE settings
      SET 
        value = $1,
        description = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE key = $3
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [value, description, key]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar configuração
  static async delete(key) {
    const deleteQuery = `
      DELETE FROM settings
      WHERE key = $1
      RETURNING key, value
    `;
    
    try {
      const result = await query(deleteQuery, [key]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obter valor de configuração
  static async getValue(key, defaultValue = null) {
    const setting = await this.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  // Definir valor de configuração
  static async setValue(key, value, description = null) {
    const existing = await this.findByKey(key);
    
    if (existing) {
      return await this.update(key, { value, description });
    } else {
      return await this.create({ key, value, description });
    }
  }

  // Configurações padrão do sistema
  static async createDefaultSettings() {
    const defaultSettings = [
      {
        key: 'system_name',
        value: 'TSEL - Sistema de Chip Warmup',
        description: 'Nome do sistema'
      },
      {
        key: 'system_version',
        value: '1.0.0',
        description: 'Versão do sistema'
      },
      {
        key: 'max_devices_per_user',
        value: '10',
        description: 'Máximo de dispositivos por usuário'
      },
      {
        key: 'max_tasks_per_device',
        value: '50',
        description: 'Máximo de tarefas por dispositivo'
      },
      {
        key: 'task_timeout_minutes',
        value: '30',
        description: 'Timeout padrão para tarefas em minutos'
      },
      {
        key: 'max_file_size_mb',
        value: '100',
        description: 'Tamanho máximo de arquivo em MB'
      },
      {
        key: 'allowed_file_types',
        value: 'jpg,jpeg,png,gif,mp4,avi,mov,mp3,wav,pdf,doc,docx',
        description: 'Tipos de arquivo permitidos'
      },
      {
        key: 'backup_enabled',
        value: 'true',
        description: 'Backup automático habilitado'
      },
      {
        key: 'backup_retention_days',
        value: '30',
        description: 'Dias de retenção do backup'
      },
      {
        key: 'notifications_enabled',
        value: 'true',
        description: 'Notificações habilitadas'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Modo de manutenção'
      },
      {
        key: 'api_rate_limit',
        value: '100',
        description: 'Limite de requisições por minuto'
      }
    ];

    for (const setting of defaultSettings) {
      try {
        await this.setValue(setting.key, setting.value, setting.description);
      } catch (error) {
        console.log(`Configuração ${setting.key} já existe`);
      }
    }
  }
}

module.exports = Setting;
