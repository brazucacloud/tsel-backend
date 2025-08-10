#!/usr/bin/env node

/**
 * Script de Migração do Banco de Dados - TSEL Backend
 * Cria todas as tabelas necessárias para o sistema
 */

require('dotenv').config();
const { query, testConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Importar modelos para criação das tabelas
const User = require('../models/User');
const Device = require('../models/Device');
const Task = require('../models/Task');
const Content = require('../models/Content');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');

async function runMigrations() {
  logger.info('🚀 Iniciando migração do banco de dados...');
  
  try {
    // Testar conexão com o banco
    logger.info('🔍 Testando conexão com o banco de dados...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('❌ Não foi possível conectar ao banco de dados');
    }
    logger.info('✅ Conexão com o banco estabelecida');

    // Criar tabelas na ordem correta (respeitando dependências)
    logger.info('📋 Criando tabelas...');

    // 1. Tabela de usuários (base para outras tabelas)
    logger.info('👤 Criando tabela de usuários...');
    await User.createTable();
    logger.info('✅ Tabela de usuários criada');

    // 2. Tabela de dispositivos
    logger.info('📱 Criando tabela de dispositivos...');
    await Device.createTable();
    logger.info('✅ Tabela de dispositivos criada');

    // 3. Tabela de tarefas
    logger.info('📋 Criando tabela de tarefas...');
    await Task.createTable();
    logger.info('✅ Tabela de tarefas criada');

    // 4. Tabela de conteúdo
    logger.info('📁 Criando tabela de conteúdo...');
    await Content.createTable();
    logger.info('✅ Tabela de conteúdo criada');

    // 5. Tabela de configurações
    logger.info('⚙️ Criando tabela de configurações...');
    await Setting.createTable();
    logger.info('✅ Tabela de configurações criada');

    // 6. Tabela de notificações
    logger.info('🔔 Criando tabela de notificações...');
    await Notification.createTable();
    logger.info('✅ Tabela de notificações criada');

    // Criar índices adicionais para performance
    logger.info('🔍 Criando índices para otimização...');
    await createIndexes();
    logger.info('✅ Índices criados');

    // Inicializar configurações padrão
    logger.info('⚙️ Inicializando configurações padrão...');
    await Setting.createDefaultSettings();
    logger.info('✅ Configurações padrão inicializadas');

    logger.info('🎉 Migração concluída com sucesso!');
    logger.info('📊 Banco de dados pronto para uso');
    
  } catch (error) {
    logger.error('❌ Erro durante a migração:', error);
    logger.error('Erro na migração do banco de dados', { error: error.message });
    process.exit(1);
  }
}

async function createIndexes() {
  const indexes = [
    // Índices para usuários
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
    
    // Índices para dispositivos
    'CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id)',
    'CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)',
    'CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online)',
    'CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at)',
    
    // Índices para tarefas
    'CREATE INDEX IF NOT EXISTS idx_tasks_device_id ON tasks(device_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at)',
    
    // Índices para conteúdo
    'CREATE INDEX IF NOT EXISTS idx_content_content_id ON content(content_id)',
    'CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_content_device_id ON content(device_id)',
    'CREATE INDEX IF NOT EXISTS idx_content_task_id ON content(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_content_type ON content(type)',
    'CREATE INDEX IF NOT EXISTS idx_content_status ON content(status)',
    'CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_content_tags ON content USING GIN(tags)',
    
    // Índices para configurações
    'CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)',
    'CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category)',
    
    // Índices para notificações
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority)'
  ];

  for (const indexQuery of indexes) {
    try {
      await query(indexQuery);
    } catch (error) {
      logger.warn(`⚠️ Aviso ao criar índice: ${error.message}`);
    }
  }
}

async function rollbackMigrations() {
  logger.info('🔄 Iniciando rollback das migrações...');
  
  try {
    const tables = [
      'notifications',
      'settings', 
      'content',
      'tasks',
      'devices',
      'users'
    ];

    for (const table of tables) {
      logger.info(`🗑️ Removendo tabela ${table}...`);
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`✅ Tabela ${table} removida`);
    }

    logger.info('🎉 Rollback concluído com sucesso!');
    
  } catch (error) {
    logger.error('❌ Erro durante o rollback:', error);
    process.exit(1);
  }
}

async function showMigrationStatus() {
  logger.info('📊 Status das migrações...');
  
  try {
    const tables = [
      'users',
      'devices', 
      'tasks',
      'content',
      'settings',
      'notifications'
    ];

    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        logger.info(`✅ ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        logger.info(`❌ ${table}: tabela não existe`);
      }
    }
    
  } catch (error) {
    logger.error('❌ Erro ao verificar status:', error);
  }
}

// Função principal
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'up':
      await runMigrations();
      break;
    case 'down':
      await rollbackMigrations();
      break;
    case 'status':
      await showMigrationStatus();
      break;
    default:
      logger.info('📚 Uso do script de migração:');
      logger.info('  node scripts/migrate.js up     - Executar migrações');
      logger.info('  node scripts/migrate.js down   - Fazer rollback');
      logger.info('  node scripts/migrate.js status - Verificar status');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    logger.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  rollbackMigrations,
  showMigrationStatus
};
