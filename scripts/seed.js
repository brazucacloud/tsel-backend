#!/usr/bin/env node

/**
 * Script de Seed do Banco de Dados - TSEL Backend
 * Popula o banco com dados iniciais para desenvolvimento e teste
 */

require('dotenv').config();
const { query, testConnection } = require('../config/database');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Importar modelos
const User = require('../models/User');
const Device = require('../models/Device');
const Task = require('../models/Task');
const Content = require('../models/Content');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');

async function runSeed() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  try {
    // Testar conexão com o banco
    console.log('🔍 Testando conexão com o banco de dados...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('❌ Não foi possível conectar ao banco de dados');
    }
    console.log('✅ Conexão com o banco estabelecida');

    // Verificar se já existem dados
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) > 1) {
      console.log('⚠️ Banco já possui dados. Use --force para sobrescrever.');
      if (!process.argv.includes('--force')) {
        return;
      }
    }

    // Criar usuários de teste
    console.log('\n👥 Criando usuários de teste...');
    await createTestUsers();
    console.log('✅ Usuários de teste criados');

    // Criar dispositivos de teste
    console.log('\n📱 Criando dispositivos de teste...');
    await createTestDevices();
    console.log('✅ Dispositivos de teste criados');

    // Criar tarefas de teste
    console.log('\n📋 Criando tarefas de teste...');
    await createTestTasks();
    console.log('✅ Tarefas de teste criadas');

    // Criar conteúdo de teste
    console.log('\n📁 Criando conteúdo de teste...');
    await createTestContent();
    console.log('✅ Conteúdo de teste criado');

    // Criar notificações de teste
    console.log('\n🔔 Criando notificações de teste...');
    await createTestNotifications();
    console.log('✅ Notificações de teste criadas');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('📊 Banco de dados populado com dados de teste');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    logger.error('Erro no seed do banco de dados', { error: error.message });
    process.exit(1);
  }
}

async function createTestUsers() {
  const testUsers = [
    {
      username: 'admin',
      email: 'admin@tsel.com',
      password: 'Admin123!',
      role: 'admin',
      full_name: 'Administrador do Sistema',
      phone: '+5511999999999',
      is_active: true
    },
    {
      username: 'gerente',
      email: 'gerente@tsel.com',
      password: 'Gerente123!',
      role: 'manager',
      full_name: 'Gerente de Operações',
      phone: '+5511888888888',
      is_active: true
    },
    {
      username: 'operador1',
      email: 'operador1@tsel.com',
      password: 'Operador123!',
      role: 'operator',
      full_name: 'Operador João Silva',
      phone: '+5511777777777',
      is_active: true
    },
    {
      username: 'operador2',
      email: 'operador2@tsel.com',
      password: 'Operador123!',
      role: 'operator',
      full_name: 'Operadora Maria Santos',
      phone: '+5511666666666',
      is_active: true
    },
    {
      username: 'viewer',
      email: 'viewer@tsel.com',
      password: 'Viewer123!',
      role: 'viewer',
      full_name: 'Visualizador do Sistema',
      phone: '+5511555555555',
      is_active: true
    }
  ];

  for (const userData of testUsers) {
    try {
      const existingUser = await User.findByEmail(userData.email);
      if (!existingUser) {
        await User.create(userData);
        console.log(`  ✅ Usuário criado: ${userData.username} (${userData.role})`);
      } else {
        console.log(`  ⚠️ Usuário já existe: ${userData.username}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao criar usuário ${userData.username}:`, error.message);
    }
  }
}

async function createTestDevices() {
  // Buscar usuários para associar aos dispositivos
  const users = await User.findAll();
  const adminUser = users.find(u => u.role === 'admin');
  const operatorUsers = users.filter(u => u.role === 'operator');

  const testDevices = [
    {
      device_id: 'SAMSUNG_GALAXY_S21_001',
      user_id: adminUser.id,
      name: 'Samsung Galaxy S21 - Admin',
      model: 'SM-G991B',
      brand: 'Samsung',
      android_version: '13',
      whatsapp_version: '2.23.24.78',
      status: 'active',
      is_online: true,
      ip_address: '192.168.1.100',
      last_seen: new Date(),
      notes: 'Dispositivo principal do administrador'
    },
    {
      device_id: 'XIAOMI_REDMI_NOTE_001',
      user_id: operatorUsers[0]?.id || adminUser.id,
      name: 'Xiaomi Redmi Note 10 - Operador 1',
      model: 'M2101K7AG',
      brand: 'Xiaomi',
      android_version: '12',
      whatsapp_version: '2.23.24.78',
      status: 'active',
      is_online: true,
      ip_address: '192.168.1.101',
      last_seen: new Date(),
      notes: 'Dispositivo do operador João'
    },
    {
      device_id: 'MOTOROLA_EDGE_001',
      user_id: operatorUsers[1]?.id || adminUser.id,
      name: 'Motorola Edge 30 - Operador 2',
      model: 'XT2203-1',
      brand: 'Motorola',
      android_version: '12',
      whatsapp_version: '2.23.24.78',
      status: 'active',
      is_online: false,
      ip_address: '192.168.1.102',
      last_seen: new Date(Date.now() - 3600000), // 1 hora atrás
      notes: 'Dispositivo da operadora Maria'
    },
    {
      device_id: 'GOOGLE_PIXEL_001',
      user_id: adminUser.id,
      name: 'Google Pixel 6 - Backup',
      model: 'GD1YQ',
      brand: 'Google',
      android_version: '14',
      whatsapp_version: '2.23.24.78',
      status: 'maintenance',
      is_online: false,
      ip_address: null,
      last_seen: new Date(Date.now() - 86400000), // 1 dia atrás
      notes: 'Dispositivo em manutenção'
    },
    {
      device_id: 'ONEPLUS_NORD_001',
      user_id: operatorUsers[0]?.id || adminUser.id,
      name: 'OnePlus Nord 2 - Teste',
      model: 'LE2123',
      brand: 'OnePlus',
      android_version: '12',
      whatsapp_version: '2.23.24.78',
      status: 'inactive',
      is_online: false,
      ip_address: null,
      last_seen: new Date(Date.now() - 604800000), // 1 semana atrás
      notes: 'Dispositivo inativo para testes'
    }
  ];

  for (const deviceData of testDevices) {
    try {
      const existingDevice = await Device.findByDeviceId(deviceData.device_id);
      if (!existingDevice) {
        await Device.create(deviceData);
        console.log(`  ✅ Dispositivo criado: ${deviceData.name}`);
      } else {
        console.log(`  ⚠️ Dispositivo já existe: ${deviceData.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao criar dispositivo ${deviceData.name}:`, error.message);
    }
  }
}

async function createTestTasks() {
  // Buscar dispositivos e usuários
  const devices = await Device.findAll();
  const users = await User.findAll();
  const adminUser = users.find(u => u.role === 'admin');
  const operatorUsers = users.filter(u => u.role === 'operator');

  const testTasks = [
    {
      device_id: devices[0]?.id,
      user_id: adminUser.id,
      type: 'message',
      title: 'Envio de Mensagem de Boas-vindas',
      description: 'Enviar mensagem de boas-vindas para novos contatos',
      content: 'Olá! Bem-vindo ao nosso sistema. Como posso ajudá-lo hoje?',
      status: 'completed',
      priority: 'medium',
      scheduled_at: new Date(Date.now() - 86400000), // 1 dia atrás
      started_at: new Date(Date.now() - 86400000 + 60000),
      completed_at: new Date(Date.now() - 86400000 + 120000),
      result: 'Mensagem enviada com sucesso para 150 contatos'
    },
    {
      device_id: devices[1]?.id,
      user_id: operatorUsers[0]?.id || adminUser.id,
      type: 'media',
      title: 'Envio de Imagem Promocional',
      description: 'Enviar imagem promocional para lista de clientes',
      content: 'Promoção especial válida até o final do mês!',
      status: 'running',
      priority: 'high',
      scheduled_at: new Date(),
      started_at: new Date(),
      media_path: '/uploads/images/promocao.jpg',
      result: 'Enviando para 200 contatos...'
    },
    {
      device_id: devices[2]?.id,
      user_id: operatorUsers[1]?.id || adminUser.id,
      type: 'contact',
      title: 'Adicionar Contatos Importantes',
      description: 'Adicionar contatos da lista VIP ao WhatsApp',
      status: 'pending',
      priority: 'low',
      scheduled_at: new Date(Date.now() + 3600000), // 1 hora no futuro
      contact_list: ['+5511999999999', '+5511888888888', '+5511777777777']
    },
    {
      device_id: devices[0]?.id,
      user_id: adminUser.id,
      type: 'group',
      title: 'Criar Grupo de Suporte',
      description: 'Criar grupo para suporte técnico',
      status: 'failed',
      priority: 'medium',
      scheduled_at: new Date(Date.now() - 7200000), // 2 horas atrás
      started_at: new Date(Date.now() - 7200000 + 60000),
      failed_at: new Date(Date.now() - 7200000 + 120000),
      error_message: 'Erro ao criar grupo: limite de grupos atingido'
    },
    {
      device_id: devices[3]?.id,
      user_id: adminUser.id,
      type: 'backup',
      title: 'Backup de Conversas',
      description: 'Realizar backup das conversas importantes',
      status: 'scheduled',
      priority: 'low',
      scheduled_at: new Date(Date.now() + 86400000), // 1 dia no futuro
      backup_path: '/backups/conversas/'
    }
  ];

  for (const taskData of testTasks) {
    try {
      await Task.create(taskData);
      console.log(`  ✅ Tarefa criada: ${taskData.title}`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar tarefa ${taskData.title}:`, error.message);
    }
  }
}

async function createTestContent() {
  // Buscar dispositivos e tarefas
  const devices = await Device.findAll();
  const tasks = await Task.findAll();
  const users = await User.findAll();
  const adminUser = users.find(u => u.role === 'admin');

  const testContent = [
    {
      content_id: uuidv4(),
      user_id: adminUser.id,
      device_id: devices[0]?.id,
      task_id: tasks[0]?.id,
      type: 'text',
      title: 'Mensagem de Boas-vindas',
      description: 'Mensagem padrão para novos contatos',
      content: 'Olá! Bem-vindo ao nosso sistema. Como posso ajudá-lo hoje?',
      status: 'active',
      tags: ['boas-vindas', 'padrão', 'novos-contatos'],
      usage_count: 45,
      rating: 4.5
    },
    {
      content_id: uuidv4(),
      user_id: adminUser.id,
      device_id: devices[1]?.id,
      task_id: tasks[1]?.id,
      type: 'image',
      title: 'Imagem Promocional',
      description: 'Imagem para promoções especiais',
      file_path: '/uploads/images/promocao.jpg',
      file_size: 1024000,
      mime_type: 'image/jpeg',
      status: 'active',
      tags: ['promoção', 'imagem', 'marketing'],
      usage_count: 23,
      rating: 4.2
    },
    {
      content_id: uuidv4(),
      user_id: adminUser.id,
      device_id: devices[2]?.id,
      type: 'video',
      title: 'Vídeo Tutorial',
      description: 'Vídeo explicativo sobre o sistema',
      file_path: '/uploads/videos/tutorial.mp4',
      file_size: 15728640,
      mime_type: 'video/mp4',
      duration: 120,
      status: 'active',
      tags: ['tutorial', 'vídeo', 'explicativo'],
      usage_count: 12,
      rating: 4.8
    },
    {
      content_id: uuidv4(),
      user_id: adminUser.id,
      device_id: devices[0]?.id,
      type: 'audio',
      title: 'Áudio de Suporte',
      description: 'Mensagem de áudio para suporte',
      file_path: '/uploads/audio/suporte.mp3',
      file_size: 512000,
      mime_type: 'audio/mpeg',
      duration: 30,
      status: 'active',
      tags: ['suporte', 'áudio', 'atendimento'],
      usage_count: 8,
      rating: 4.0
    },
    {
      content_id: uuidv4(),
      user_id: adminUser.id,
      device_id: devices[1]?.id,
      type: 'document',
      title: 'Manual do Sistema',
      description: 'Manual completo do sistema TSEL',
      file_path: '/uploads/documents/manual.pdf',
      file_size: 2048000,
      mime_type: 'application/pdf',
      status: 'active',
      tags: ['manual', 'documento', 'sistema'],
      usage_count: 5,
      rating: 4.6
    }
  ];

  for (const contentData of testContent) {
    try {
      await Content.create(contentData);
      console.log(`  ✅ Conteúdo criado: ${contentData.title}`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar conteúdo ${contentData.title}:`, error.message);
    }
  }
}

async function createTestNotifications() {
  // Buscar usuários
  const users = await User.findAll();
  const adminUser = users.find(u => u.role === 'admin');
  const operatorUsers = users.filter(u => u.role === 'operator');

  const testNotifications = [
    {
      user_id: adminUser.id,
      type: 'system',
      title: 'Sistema Iniciado',
      message: 'O sistema TSEL foi iniciado com sucesso',
      priority: 'info',
      is_read: true,
      created_at: new Date(Date.now() - 3600000) // 1 hora atrás
    },
    {
      user_id: adminUser.id,
      type: 'device',
      title: 'Dispositivo Conectado',
      message: 'Samsung Galaxy S21 conectado com sucesso',
      priority: 'success',
      is_read: false,
      created_at: new Date(Date.now() - 1800000) // 30 minutos atrás
    },
    {
      user_id: operatorUsers[0]?.id || adminUser.id,
      type: 'task',
      title: 'Tarefa Concluída',
      message: 'Envio de mensagem de boas-vindas concluído',
      priority: 'success',
      is_read: false,
      created_at: new Date(Date.now() - 900000) // 15 minutos atrás
    },
    {
      user_id: operatorUsers[1]?.id || adminUser.id,
      type: 'task',
      title: 'Tarefa Falhou',
      message: 'Erro ao criar grupo de suporte',
      priority: 'error',
      is_read: false,
      created_at: new Date(Date.now() - 600000) // 10 minutos atrás
    },
    {
      user_id: adminUser.id,
      type: 'system',
      title: 'Backup Automático',
      message: 'Backup automático realizado com sucesso',
      priority: 'info',
      is_read: true,
      created_at: new Date(Date.now() - 300000) // 5 minutos atrás
    }
  ];

  for (const notificationData of testNotifications) {
    try {
      await Notification.create(notificationData);
      console.log(`  ✅ Notificação criada: ${notificationData.title}`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar notificação ${notificationData.title}:`, error.message);
    }
  }
}

async function clearSeedData() {
  console.log('🗑️ Limpando dados de seed...');
  
  try {
    const tables = [
      'notifications',
      'content',
      'tasks',
      'devices',
      'users'
    ];

    for (const table of tables) {
      if (table === 'users') {
        // Manter apenas o usuário admin padrão
        await query(`DELETE FROM ${table} WHERE email != 'admin@tsel.com'`);
      } else {
        await query(`DELETE FROM ${table}`);
      }
      console.log(`  ✅ Dados de ${table} removidos`);
    }

    console.log('🎉 Dados de seed removidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    process.exit(1);
  }
}

async function showSeedStatus() {
  console.log('📊 Status dos dados de seed...');
  
  try {
    const tables = [
      'users',
      'devices', 
      'tasks',
      'content',
      'notifications'
    ];

    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ ${table}: tabela não existe`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  }
}

// Função principal
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'run':
      await runSeed();
      break;
    case 'clear':
      await clearSeedData();
      break;
    case 'status':
      await showSeedStatus();
      break;
    default:
      console.log('📚 Uso do script de seed:');
      console.log('  node scripts/seed.js run     - Executar seed');
      console.log('  node scripts/seed.js clear   - Limpar dados');
      console.log('  node scripts/seed.js status  - Verificar status');
      console.log('  node scripts/seed.js run --force  - Forçar execução');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runSeed,
  clearSeedData,
  showSeedStatus
};
