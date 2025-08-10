const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tsel_db',
  user: process.env.DB_USER || 'tsel_user',
  password: process.env.DB_PASSWORD || 'tsel_password',
  max: parseInt(process.env.DB_POOL_SIZE) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Event listeners para monitoramento do pool
pool.on('connect', (client) => {
  logger.info('Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err, client) => {
  logger.error('Erro inesperado no pool de conexões PostgreSQL:', err);
});

pool.on('remove', (client) => {
  logger.info('Cliente removido do pool PostgreSQL');
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao conectar com PostgreSQL:', error);
    return false;
  }
};

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executada em ${duration}ms: ${text}`);
    return result;
  } catch (error) {
    logger.error(`Erro na query: ${text}`, error);
    throw error;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
