const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DailyTask {
  // Criar tabela de tarefas diárias
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 21),
        task_type VARCHAR(100) NOT NULL,
        task_description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        completed_at TIMESTAMP,
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, day_number, task_type)
      );
      
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_device_id ON daily_tasks(device_id);
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_day_number ON daily_tasks(day_number);
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_type ON daily_tasks(task_type);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela daily_tasks criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela daily_tasks:', error);
      throw error;
    }
  }

  // Definir tarefas padrão para 21 dias
  static getDefaultTasks() {
    return {
      1: [
        { type: 'profile_setup', description: 'Inserir uma Foto 70% Feminina 30% Masculina', metadata: { category: 'profile' } },
        { type: 'metadata_change', description: 'Trocar o Metadados da imagem', metadata: { category: 'profile' } },
        { type: 'name_setup', description: 'Colocar nome e sobrenome comum de pessoa', metadata: { category: 'profile' } },
        { type: 'description_setup', description: 'Inserir uma mensagem na descrição', metadata: { category: 'profile' } },
        { type: 'two_factor', description: 'Ativar verificação de duas etapas', metadata: { category: 'security' } },
        { type: 'complete_profile', description: 'Preenche todos os dados solicitados', metadata: { category: 'profile' } },
        { type: 'wait_period', description: 'Não realizar mais nada - deixar 24 ou 48 horas sem uso', metadata: { category: 'waiting' } }
      ],
      2: [
        { type: 'join_groups', description: 'Entrar em 2 grupos de Whatsapp', metadata: { count: 2, category: 'groups' } },
        { type: 'receive_messages', description: 'Receber 2 msg na manhã', metadata: { count: 2, period: 'morning', category: 'messages' } },
        { type: 'receive_messages', description: 'Receber 3 msg na tarde', metadata: { count: 3, period: 'afternoon', category: 'messages' } },
        { type: 'receive_audio', description: 'Receber 4 áudios na manhã', metadata: { count: 4, period: 'morning', category: 'audio' } },
        { type: 'receive_audio', description: 'Receber 1 áudios na tarde', metadata: { count: 1, period: 'afternoon', category: 'audio' } },
        { type: 'receive_images', description: 'Receber 3 img na manhã', metadata: { count: 3, period: 'morning', category: 'images' } },
        { type: 'receive_images', description: 'Receber 2 img na tarde', metadata: { count: 2, period: 'afternoon', category: 'images' } },
        { type: 'receive_videos', description: 'Receber 1 vídeo na manhã', metadata: { count: 1, period: 'morning', category: 'videos' } },
        { type: 'receive_videos', description: 'Receber 1 vídeo na tarde', metadata: { count: 1, period: 'afternoon', category: 'videos' } },
        { type: 'delete_messages', description: 'Apagar uma mensagem em 2 conversas diferentes', metadata: { count: 1, conversations: 2, category: 'messages' } }
      ],
      3: [
        { type: 'chat_contacts', description: 'Conversar com 2 contatos na manhã', metadata: { count: 2, period: 'morning', category: 'chat' } },
        { type: 'chat_contacts', description: 'Conversar com 3 contatos na tarde', metadata: { count: 3, period: 'afternoon', category: 'chat' } },
        { type: 'receive_messages', description: 'Receber 4 msg na manhã', metadata: { count: 4, period: 'morning', category: 'messages' } },
        { type: 'receive_messages', description: 'Receber 3 msg na tarde', metadata: { count: 3, period: 'afternoon', category: 'messages' } },
        { type: 'receive_audio', description: 'Receber 3 áudios na manhã', metadata: { count: 3, period: 'morning', category: 'audio' } },
        { type: 'receive_audio', description: 'Receber 4 áudios na tarde', metadata: { count: 4, period: 'afternoon', category: 'audio' } },
        { type: 'receive_images', description: 'Receber 3 img na manhã', metadata: { count: 3, period: 'morning', category: 'images' } },
        { type: 'receive_images', description: 'Receber 2 img na tarde', metadata: { count: 2, period: 'afternoon', category: 'images' } },
        { type: 'receive_videos', description: 'Receber 2 vídeo na manhã', metadata: { count: 2, period: 'morning', category: 'videos' } },
        { type: 'receive_videos', description: 'Receber 3 vídeo na tarde', metadata: { count: 3, period: 'afternoon', category: 'videos' } },
        { type: 'create_group', description: 'Criar um grupo e colocar 3 pessoas', metadata: { members: 3, category: 'groups' } },
        { type: 'interact_group', description: 'Interagir em grupo criado no dia', metadata: { category: 'groups' } },
        { type: 'join_groups', description: 'Entrar em 2 grupos de Whatsapp', metadata: { count: 2, category: 'groups' } },
        { type: 'send_audio', description: 'Enviar 4 msg de áudio nos grupos', metadata: { count: 4, category: 'audio' } },
        { type: 'forward_messages', description: 'Encaminhar 3 mensagens', metadata: { count: 3, category: 'messages' } },
        { type: 'delete_messages', description: 'Apagar 3 mensagens em conversas diferentes', metadata: { count: 3, category: 'messages' } },
        { type: 'send_stickers', description: 'Enviar figurinha para 3 contatos', metadata: { count: 3, category: 'stickers' } },
        { type: 'send_emoji', description: 'Enviar emoji para 5 conversas', metadata: { count: 5, category: 'emoji' } },
        { type: 'send_images', description: 'Enviar 2 img para contatos diferentes', metadata: { count: 2, category: 'images' } },
        { type: 'send_documents', description: 'Enviar 1 pdf para contatos diferentes', metadata: { count: 1, category: 'documents' } },
        { type: 'missed_call', description: 'Dar um toque ligando pra alguém e desligar', metadata: { category: 'calls' } },
        { type: 'mark_unread', description: 'Marcar uma conversa como não lida', metadata: { category: 'messages' } },
        { type: 'post_status', description: 'Postar 3 status', metadata: { count: 3, category: 'status' } }
             ],
      4: [
        { type: 'chat_contacts', description: 'Conversar com 8 novos contatos ao longo do dia', metadata: { count: 8, category: 'chat' } },
        { type: 'receive_messages', description: 'Receber 6 msg na manhã', metadata: { count: 6, period: 'morning', category: 'messages' } },
        { type: 'receive_messages', description: 'Receber 5 msg na tarde', metadata: { count: 5, period: 'afternoon', category: 'messages' } },
        { type: 'receive_audio', description: 'Receber 4 áudios na manhã', metadata: { count: 4, period: 'morning', category: 'audio' } },
        { type: 'receive_audio', description: 'Receber 4 áudios na tarde', metadata: { count: 4, period: 'afternoon', category: 'audio' } },
        { type: 'receive_images', description: 'Receber 6 img na manhã', metadata: { count: 6, period: 'morning', category: 'images' } },
        { type: 'receive_images', description: 'Receber 3 img na tarde', metadata: { count: 3, period: 'afternoon', category: 'images' } },
        { type: 'receive_videos', description: 'Receber 3 vídeo na manhã', metadata: { count: 3, period: 'morning', category: 'videos' } },
        { type: 'receive_videos', description: 'Receber 2 vídeo na tarde', metadata: { count: 2, period: 'afternoon', category: 'videos' } },
        { type: 'add_vcard', description: 'Adicionar 6 Vcard', metadata: { count: 6, category: 'contacts' } },
        { type: 'pin_contact', description: 'Fixar 1 contato', metadata: { count: 1, category: 'contacts' } },
        { type: 'join_groups', description: 'Entrar em 2 grupos de Whatsapp', metadata: { count: 2, category: 'groups' } },
        { type: 'audio_call', description: 'Fazer 1 ligação de áudio na manhã 10min', metadata: { duration: 10, period: 'morning', category: 'calls' } },
        { type: 'video_call', description: 'Fazer uma chamada de vídeo à tarde 5min', metadata: { duration: 5, period: 'afternoon', category: 'calls' } },
        { type: 'receive_audio_calls', description: 'Receber 2 ligações de audio 8 min ao longo do dia', metadata: { count: 2, duration: 8, category: 'calls' } },
        { type: 'receive_video_calls', description: 'Receber 2 ligação de vídeo 10 min ao longo do dia', metadata: { count: 2, duration: 10, category: 'calls' } },
        { type: 'send_temp_images', description: 'Enviar 12 imagem temporária manhã para 36 contatos diferentes', metadata: { count: 12, contacts: 36, period: 'morning', category: 'images' } },
        { type: 'send_temp_images', description: 'Enviar 11 imagem temporária tarde para 29 contatos diferentes', metadata: { count: 11, contacts: 29, period: 'afternoon', category: 'images' } },
        { type: 'send_audio', description: 'Enviar 7 áudios', metadata: { count: 7, category: 'audio' } },
        { type: 'forward_messages', description: 'Encaminhar 5 mensagens', metadata: { count: 5, category: 'messages' } },
        { type: 'delete_messages', description: 'Apagar 5 mensagens em conversas diferentes', metadata: { count: 5, category: 'messages' } },
        { type: 'archive_conversations', description: 'Arquivar 2 conversas', metadata: { count: 2, category: 'conversations' } },
        { type: 'favorite_messages', description: 'Favoritar 5 mensagens', metadata: { count: 5, category: 'messages' } },
        { type: 'post_status', description: 'Postar 5 status', metadata: { count: 5, category: 'status' } }
      ],
      5: [
        { type: 'chat_contacts', description: 'Conversar com 17 novos contatos ao longo do dia', metadata: { count: 17, category: 'chat' } },
        { type: 'receive_messages', description: 'Receber 10 msg na manhã', metadata: { count: 10, period: 'morning', category: 'messages' } },
        { type: 'receive_messages', description: 'Receber 6 msg na tarde', metadata: { count: 6, period: 'afternoon', category: 'messages' } },
        { type: 'receive_audio', description: 'Receber 8 áudios na manhã', metadata: { count: 8, period: 'morning', category: 'audio' } },
        { type: 'receive_audio', description: 'Receber 6 áudios na tarde', metadata: { count: 6, period: 'afternoon', category: 'audio' } },
        { type: 'receive_images', description: 'Receber 6 img na manhã', metadata: { count: 6, period: 'morning', category: 'images' } },
        { type: 'receive_images', description: 'Receber 5 img na tarde', metadata: { count: 5, period: 'afternoon', category: 'images' } },
        { type: 'receive_videos', description: 'Receber 4 vídeo na manhã', metadata: { count: 4, period: 'morning', category: 'videos' } },
        { type: 'receive_videos', description: 'Receber 5 vídeo na tarde', metadata: { count: 5, period: 'afternoon', category: 'videos' } },
        { type: 'add_vcard', description: 'Adicionar 2 Vcard', metadata: { count: 2, category: 'contacts' } },
        { type: 'change_profile_photo', description: 'Trocar foto do perfil', metadata: { category: 'profile' } },
        { type: 'audio_call', description: 'Fazer 2 ligações de áudio na manhã 15min', metadata: { count: 2, duration: 15, period: 'morning', category: 'calls' } },
        { type: 'video_call', description: 'Fazer 1 chamada de vídeo à tarde 10min', metadata: { duration: 10, period: 'afternoon', category: 'calls' } },
        { type: 'receive_audio_calls', description: 'Receber 2 ligações de audio 8 min ao longo do dia', metadata: { count: 2, duration: 8, category: 'calls' } },
        { type: 'receive_video_calls', description: 'Receber 2 ligação de vídeo 10 min ao longo do dia', metadata: { count: 2, duration: 10, category: 'calls' } },
        { type: 'send_temp_images', description: 'Enviar 12 imagem temporária manhã para 36 contatos diferentes', metadata: { count: 12, contacts: 36, period: 'morning', category: 'images' } },
        { type: 'send_temp_images', description: 'Enviar 11 imagem temporária tarde para 29 contatos diferentes', metadata: { count: 11, contacts: 29, period: 'afternoon', category: 'images' } },
        { type: 'leave_groups', description: 'Sair de 3 grupos', metadata: { count: 3, category: 'groups' } },
        { type: 'join_groups', description: 'Entrar em 1 grupo', metadata: { count: 1, category: 'groups' } },
        { type: 'send_audio', description: 'Enviar 10 áudios', metadata: { count: 10, category: 'audio' } },
        { type: 'forward_messages', description: 'Encaminhar 1 mensagem', metadata: { count: 1, category: 'messages' } },
        { type: 'delete_messages', description: 'Apagar 3 mensagens em conversas diferentes', metadata: { count: 3, category: 'messages' } },
        { type: 'share_contacts', description: 'Compartilhar 2 contatos', metadata: { count: 2, category: 'contacts' } },
        { type: 'clear_conversations', description: 'Limpar 2 conversas', metadata: { count: 2, category: 'conversations' } },
        { type: 'post_status', description: 'Postar 12 status', metadata: { count: 12, category: 'status' } }
      ]
      // Continua para os outros dias...
     };
  }

  // Inicializar tarefas para um dispositivo
  static async initializeTasks(deviceId) {
    const defaultTasks = this.getDefaultTasks();
    
    try {
      await transaction(async (client) => {
        for (const [dayNumber, tasks] of Object.entries(defaultTasks)) {
          for (const task of tasks) {
            const insertQuery = `
              INSERT INTO daily_tasks (device_id, day_number, task_type, task_description, metadata)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (device_id, day_number, task_type) DO NOTHING
            `;
            
            await client.query(insertQuery, [
              deviceId,
              parseInt(dayNumber),
              task.type,
              task.description,
              JSON.stringify(task.metadata)
            ]);
          }
        }
      });
      
      return { success: true, message: 'Tarefas inicializadas com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  // Criar tarefa individual
  static async create(taskData) {
    const {
      device_id,
      day_number,
      task_type,
      task_description,
      metadata = {}
    } = taskData;

    const insertQuery = `
      INSERT INTO daily_tasks (device_id, day_number, task_type, task_description, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await query(insertQuery, [
        device_id,
        day_number,
        task_type,
        task_description,
        JSON.stringify(metadata)
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar tarefa por ID
  static async findById(id) {
    const query = `
      SELECT dt.*, d.device_name, d.device_id as device_identifier
      FROM daily_tasks dt
      LEFT JOIN devices d ON dt.device_id = d.id
      WHERE dt.id = $1
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar tarefas por dispositivo e dia
  static async getTasksByDeviceAndDay(deviceId, dayNumber) {
    const query = `
      SELECT dt.*, d.device_name, d.device_id as device_identifier
      FROM daily_tasks dt
      LEFT JOIN devices d ON dt.device_id = d.id
      WHERE dt.device_id = $1 AND dt.day_number = $2
      ORDER BY dt.task_type, dt.created_at
    `;
    
    try {
      const result = await query(query, [deviceId, dayNumber]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Listar todas as tarefas de um dispositivo
  static async getTasksByDevice(deviceId, options = {}) {
    const { day_number, status, task_type } = options;
    
    let whereClause = 'WHERE dt.device_id = $1';
    const params = [deviceId];
    let paramCount = 1;
    
    if (day_number) {
      paramCount++;
      whereClause += ` AND dt.day_number = $${paramCount}`;
      params.push(day_number);
    }
    
    if (status) {
      paramCount++;
      whereClause += ` AND dt.status = $${paramCount}`;
      params.push(status);
    }
    
    if (task_type) {
      paramCount++;
      whereClause += ` AND dt.task_type = $${paramCount}`;
      params.push(task_type);
    }
    
    const query = `
      SELECT dt.*, d.device_name, d.device_id as device_identifier
      FROM daily_tasks dt
      LEFT JOIN devices d ON dt.device_id = d.id
      ${whereClause}
      ORDER BY dt.day_number ASC, dt.task_type ASC
    `;
    
    try {
      const result = await query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar tarefa
  static async update(id, updateData) {
    const allowedFields = [
      'status', 'completed_at', 'notes', 'metadata'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        if (key === 'metadata') {
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
      UPDATE daily_tasks
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

  // Marcar tarefa como concluída
  static async complete(id, notes = null) {
    const updateQuery = `
      UPDATE daily_tasks
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        notes = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await query(updateQuery, [notes, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Deletar tarefa
  static async delete(id) {
    const deleteQuery = `
      DELETE FROM daily_tasks
      WHERE id = $1
      RETURNING id, task_type, status
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de progresso
  static async getProgressStats(deviceId) {
    const statsQuery = `
      SELECT 
        day_number,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        ROUND(
          (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
        ) as completion_percentage
      FROM daily_tasks
      WHERE device_id = $1
      GROUP BY day_number
      ORDER BY day_number
    `;
    
    try {
      const result = await query(statsQuery, [deviceId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Limpar tarefas de um dispositivo
  static async clearDeviceTasks(deviceId) {
    const deleteQuery = `
      DELETE FROM daily_tasks
      WHERE device_id = $1
    `;
    
    try {
      const result = await query(deleteQuery, [deviceId]);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DailyTask;
