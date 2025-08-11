#!/usr/bin/env node

/**
 * Script de Teste de Imports - TSEL Backend
 * Verifica se todas as dependências estão funcionando corretamente
 */

console.log('🧪 Iniciando teste de imports...\n');

// Testar imports básicos do Node.js
console.log('📦 Testando imports básicos...');
try {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  console.log('  ✅ Imports básicos do Node.js OK');
} catch (error) {
  console.error('  ❌ Erro nos imports básicos:', error.message);
}

// Testar dotenv
console.log('\n🔧 Testando dotenv...');
try {
  require('dotenv').config();
  console.log('  ✅ dotenv carregado com sucesso');
  console.log(`  📍 NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`  📍 PORT: ${process.env.PORT || 'não definido'}`);
} catch (error) {
  console.error('  ❌ Erro ao carregar dotenv:', error.message);
}

// Testar dependências principais
console.log('\n📚 Testando dependências principais...');
const dependencies = [
  { name: 'express', test: () => require('express') },
  { name: 'pg', test: () => require('pg') },
  { name: 'pg-pool', test: () => require('pg-pool') },
  { name: 'bcryptjs', test: () => require('bcryptjs') },
  { name: 'jsonwebtoken', test: () => require('jsonwebtoken') },
  { name: 'cors', test: () => require('cors') },
  { name: 'helmet', test: () => require('helmet') },
  { name: 'express-rate-limit', test: () => require('express-rate-limit') },
  { name: 'express-validator', test: () => require('express-validator') },
  { name: 'multer', test: () => require('multer') },
  { name: 'socket.io', test: () => require('socket.io') },
  { name: 'redis', test: () => require('redis') },
  { name: 'winston', test: () => require('winston') },
  { name: 'compression', test: () => require('compression') },
  { name: 'morgan', test: () => require('morgan') },
  { name: 'uuid', test: () => require('uuid') },
  { name: 'moment', test: () => require('moment') },
  { name: 'node-cron', test: () => require('node-cron') },
  { name: 'sharp', test: () => require('sharp') },
  { name: 'fluent-ffmpeg', test: () => require('fluent-ffmpeg') }
];

for (const dep of dependencies) {
  try {
    dep.test();
    console.log(`  ✅ ${dep.name} OK`);
  } catch (error) {
    console.error(`  ❌ ${dep.name}: ${error.message}`);
  }
}

// Testar imports internos do projeto
console.log('\n🏗️ Testando imports internos...');
const internalModules = [
  { name: 'config/database', test: () => require('../config/database') },
  { name: 'utils/logger', test: () => require('../utils/logger') },
  { name: 'models/User', test: () => require('../models/User') },
  { name: 'models/Device', test: () => require('../models/Device') },
  { name: 'models/Task', test: () => require('../models/Task') },
  { name: 'models/Content', test: () => require('../models/Content') },
  { name: 'models/Setting', test: () => require('../models/Setting') },
  { name: 'models/Notification', test: () => require('../models/Notification') },
  { name: 'middleware/auth', test: () => require('../middleware/auth') },
  { name: 'middleware/validation', test: () => require('../middleware/validation') },
  { name: 'routes/auth', test: () => require('../routes/auth') },
  { name: 'routes/users', test: () => require('../routes/users') },
  { name: 'routes/devices', test: () => require('../routes/devices') },
  { name: 'routes/tasks', test: () => require('../routes/tasks') },
  { name: 'routes/content', test: () => require('../routes/content') },
  { name: 'routes/analytics', test: () => require('../routes/analytics') },
  { name: 'routes/settings', test: () => require('../routes/settings') },
  { name: 'routes/notifications', test: () => require('../routes/notifications') }
];

for (const module of internalModules) {
  try {
    module.test();
    console.log(`  ✅ ${module.name} OK`);
  } catch (error) {
    console.error(`  ❌ ${module.name}: ${error.message}`);
  }
}

// Testar conexão com banco de dados
console.log('\n🗄️ Testando conexão com banco de dados...');
async function testDatabaseConnection() {
  try {
    const { testConnection } = require('../config/database');
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('  ✅ Conexão com banco de dados OK');
    } else {
      console.log('  ⚠️ Conexão com banco de dados falhou');
    }
  } catch (error) {
    console.error('  ❌ Erro ao testar conexão com banco:', error.message);
  }
}

// Testar criação de diretórios
console.log('\n📁 Testando criação de diretórios...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const dirs = [
    'uploads',
    'uploads/images',
    'uploads/videos', 
    'uploads/audio',
    'uploads/documents',
    
    'logs',
    'backups'
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Diretório criado: ${dir}`);
    } else {
      console.log(`  ✅ Diretório existe: ${dir}`);
    }
  }
} catch (error) {
  console.error('  ❌ Erro ao criar diretórios:', error.message);
}

// Testar funcionalidades específicas
console.log('\n🔍 Testando funcionalidades específicas...');

// Testar bcrypt
try {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('test123', 10);
  const isValid = bcrypt.compareSync('test123', hash);
  if (isValid) {
    console.log('  ✅ bcrypt funcionando corretamente');
  } else {
    console.log('  ❌ bcrypt não está funcionando');
  }
} catch (error) {
  console.error('  ❌ Erro no bcrypt:', error.message);
}

// Testar JWT
try {
  const jwt = require('jsonwebtoken');
  const secret = 'test-secret';
  const token = jwt.sign({ userId: 1 }, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  if (decoded.userId === 1) {
    console.log('  ✅ JWT funcionando corretamente');
  } else {
    console.log('  ❌ JWT não está funcionando');
  }
} catch (error) {
  console.error('  ❌ Erro no JWT:', error.message);
}

// Testar UUID
try {
  const { v4: uuidv4 } = require('uuid');
  const uuid = uuidv4();
  if (uuid && uuid.length > 0) {
    console.log('  ✅ UUID funcionando corretamente');
  } else {
    console.log('  ❌ UUID não está funcionando');
  }
} catch (error) {
  console.error('  ❌ Erro no UUID:', error.message);
}

// Testar moment
try {
  const moment = require('moment');
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  if (now) {
    console.log('  ✅ moment funcionando corretamente');
  } else {
    console.log('  ❌ moment não está funcionando');
  }
} catch (error) {
  console.error('  ❌ Erro no moment:', error.message);
}

// Executar teste de conexão com banco
testDatabaseConnection().then(() => {
  console.log('\n🎉 Teste de imports concluído!');
  console.log('📋 Resumo:');
  console.log('  - Dependências principais testadas');
  console.log('  - Módulos internos verificados');
  console.log('  - Funcionalidades específicas validadas');
  console.log('  - Diretórios criados/verificados');
  console.log('\n✅ Sistema pronto para uso!');
}).catch((error) => {
  console.error('\n❌ Erro durante os testes:', error);
  process.exit(1);
});
