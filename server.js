require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Importar configurações e utilitários
const { testConnection } = require('./config/database');
const { logger, logRequest, logError } = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const taskRoutes = require('./routes/tasks');
const dailyTaskRoutes = require('./routes/daily-tasks');
const contentRoutes = require('./routes/content');
const analyticsRoutes = require('./routes/analytics');
const settingRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');

// Importar modelos para inicialização
const User = require('./models/User');
const Device = require('./models/Device');
const Task = require('./models/Task');
const DailyTask = require('./models/DailyTask');
const Content = require('./models/Content');
const Setting = require('./models/Setting');
const Notification = require('./models/Notification');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite por IP
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de segurança e otimização
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(logRequest);

// Criar diretórios necessários
const dirs = ['uploads', 'uploads/images', 'uploads/videos', 'uploads/audio', 'uploads/documents', 'logs', 'backups'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TSEL Backend está funcionando',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de informações da API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TSEL - Sistema de Chip Warmup para WhatsApp',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      devices: '/api/devices',
      tasks: '/api/tasks',
      dailyTasks: '/api/daily-tasks',
      content: '/api/content',
      analytics: '/api/analytics',
      settings: '/api/settings',
      notifications: '/api/notifications'
    },
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logError(err, req);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: err.errors
    });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Erro no upload de arquivo',
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Testar conexão
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    // Criar tabelas
    console.log('📋 Criando tabelas...');
    await User.createTable();
    await Device.createTable();
    await Task.createTable();
    await DailyTask.createTable();
    await Content.createTable();
    await Setting.createTable();
    await Notification.createTable();
    
    // Inicializar configurações padrão
    console.log('⚙️ Inicializando configurações padrão...');
    await Setting.createDefaultSettings();
    
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

// Função para criar usuário admin padrão
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findByEmail('admin@tsel.com');
    if (!adminExists) {
      console.log('👤 Criando usuário admin padrão...');
      await User.create({
        username: 'admin',
        email: 'admin@tsel.com',
        password: 'Admin123!',
        role: 'admin'
      });
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📧 Email: admin@tsel.com');
      console.log('🔑 Senha: Admin123!');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  }
}

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase();
    
    // Criar usuário admin padrão
    await createDefaultAdmin();
    
    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log('🚀 TSEL Backend iniciado com sucesso!');
      console.log(`📍 Servidor rodando em: http://${HOST}:${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📚 API Info: http://${HOST}:${PORT}/api`);
      console.log('⏰', new Date().toLocaleString('pt-BR'));
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
