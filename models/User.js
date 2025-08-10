const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Criar tabela de usuários
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `;
    
    try {
      await query(createTableQuery);
      console.log('Tabela users criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela users:', error);
      throw error;
    }
  }

  // Criar usuário
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    
    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const insertQuery = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, is_active, created_at
    `;
    
    try {
      const result = await query(insertQuery, [username, email, hashedPassword, role]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint.includes('email')) {
          throw new Error('Email já está em uso');
        }
        if (error.constraint.includes('username')) {
          throw new Error('Nome de usuário já está em uso');
        }
      }
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    const query = `
      SELECT id, username, email, role, is_active, last_login, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    try {
      const result = await query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password, role, is_active, last_login, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    try {
      const result = await query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por username
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password, role, is_active, last_login, created_at, updated_at
      FROM users
      WHERE username = $1
    `;
    
    try {
      const result = await query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Listar todos os usuários
  static async findAll(options = {}) {
    const { page = 1, limit = 10, role, isActive } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }
    
    if (isActive !== undefined) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(isActive);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT id, username, email, role, is_active, last_login, created_at, updated_at
      FROM users
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
        users: dataResult.rows,
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

  // Atualizar usuário
  static async update(id, updateData) {
    const allowedFields = ['username', 'email', 'role', 'is_active'];
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
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, is_active, last_login, created_at, updated_at
    `;
    
    try {
      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint.includes('email')) {
          throw new Error('Email já está em uso');
        }
        if (error.constraint.includes('username')) {
          throw new Error('Nome de usuário já está em uso');
        }
      }
      throw error;
    }
  }

  // Atualizar senha
  static async updatePassword(id, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const updateQuery = `
      UPDATE users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, role, is_active, created_at, updated_at
    `;
    
    try {
      const result = await query(updateQuery, [hashedPassword, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar último login
  static async updateLastLogin(id) {
    const updateQuery = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    try {
      await query(updateQuery, [id]);
    } catch (error) {
      throw error;
    }
  }

  // Verificar senha
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  // Deletar usuário
  static async delete(id) {
    const deleteQuery = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, username, email
    `;
    
    try {
      const result = await query(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Estatísticas de usuários
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'device' THEN 1 END) as device_users,
        COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_logins
      FROM users
    `;
    
    try {
      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
