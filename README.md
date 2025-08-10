# TSEL - Sistema de Chip Warmup para WhatsApp

Sistema completo de backend para gerenciamento de dispositivos Android e automação de tarefas do WhatsApp.

## 🚀 Características

- **Backend Node.js** com Express e PostgreSQL
- **Autenticação JWT** com roles e permissões
- **API REST** completa e documentada
- **WebSocket** para comunicação em tempo real
- **Sistema de logs** com Winston
- **Upload de arquivos** com Multer
- **Cache Redis** para performance
- **Validação** com express-validator
- **Rate limiting** e segurança com Helmet
- **Scripts de migração** e seed automáticos

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- PostgreSQL 12.x ou superior
- Redis 6.x ou superior (opcional)
- NPM ou Yarn

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd tsel-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados PostgreSQL

```sql
-- Conecte ao PostgreSQL como superusuário
sudo -u postgres psql

-- Crie o banco de dados
CREATE DATABASE tsel_db;

-- Crie o usuário
CREATE USER tsel_user WITH PASSWORD 'tsel_password';

-- Conceda privilégios
GRANT ALL PRIVILEGES ON DATABASE tsel_db TO tsel_user;

-- Conecte ao banco criado
\c tsel_db

-- Conceda privilégios no schema
GRANT ALL ON SCHEMA public TO tsel_user;
```

### 4. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Servidor
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tsel_db
DB_USER=tsel_user
DB_PASSWORD=tsel_password
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30000

# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Configurações JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Configurações de Segurança
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Upload
UPLOAD_MAX_SIZE=100mb
UPLOAD_PATH=./uploads
APK_PATH=./uploads/apks

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Configurações do Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 5. Execute as migrações

```bash
# Criar tabelas e índices
npm run migrate

# Ou executar diretamente
node scripts/migrate.js up
```

### 6. Popule o banco com dados de teste (opcional)

```bash
# Executar seed com dados de teste
npm run seed

# Ou executar diretamente
node scripts/seed.js run
```

### 7. Teste os imports

```bash
# Verificar se todas as dependências estão funcionando
npm run test-imports

# Ou executar diretamente
node scripts/test-imports.js
```

### 8. Inicie o servidor

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

## 📊 Estrutura do Projeto

```
tsel-backend/
├── config/
│   └── database.js          # Configuração do PostgreSQL
├── middleware/
│   ├── auth.js              # Autenticação JWT
│   └── validation.js        # Validação de dados
├── models/
│   ├── User.js              # Modelo de usuários
│   ├── Device.js            # Modelo de dispositivos
│   ├── Task.js              # Modelo de tarefas
│   ├── Content.js           # Modelo de conteúdo
│   ├── Setting.js           # Modelo de configurações
│   └── Notification.js      # Modelo de notificações
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── users.js             # Rotas de usuários
│   ├── devices.js           # Rotas de dispositivos
│   ├── tasks.js             # Rotas de tarefas
│   ├── content.js           # Rotas de conteúdo
│   ├── analytics.js         # Rotas de analytics
│   ├── settings.js          # Rotas de configurações
│   └── notifications.js     # Rotas de notificações
├── scripts/
│   ├── migrate.js           # Script de migração
│   ├── seed.js              # Script de seed
│   └── test-imports.js      # Script de teste
├── utils/
│   └── logger.js            # Sistema de logs
├── uploads/                 # Arquivos enviados
├── logs/                    # Logs do sistema
├── backups/                 # Backups automáticos
├── .env                     # Variáveis de ambiente
├── package.json             # Dependências e scripts
├── server.js                # Servidor principal
└── README.md                # Documentação
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação. Os tokens são enviados no header `Authorization: Bearer <token>`.

### Roles de Usuário

- **admin**: Acesso total ao sistema
- **manager**: Gerencia operações e usuários
- **operator**: Executa tarefas e gerencia dispositivos
- **viewer**: Apenas visualização de dados

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário atual

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter usuário
- `POST /api/users` - Criar usuário (admin)
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (admin)
- `POST /api/users/:id/activate` - Ativar usuário (admin)
- `POST /api/users/:id/deactivate` - Desativar usuário (admin)

### Dispositivos
- `GET /api/devices` - Listar dispositivos
- `GET /api/devices/:id` - Obter dispositivo
- `POST /api/devices` - Criar dispositivo
- `PUT /api/devices/:id` - Atualizar dispositivo
- `DELETE /api/devices/:id` - Deletar dispositivo
- `POST /api/devices/:id/connect` - Conectar dispositivo
- `POST /api/devices/:id/disconnect` - Desconectar dispositivo
- `POST /api/devices/connect/android` - API Android - Conectar
- `POST /api/devices/heartbeat` - API Android - Heartbeat

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `GET /api/tasks/:id` - Obter tarefa
- `POST /api/tasks` - Criar tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa
- `POST /api/tasks/:id/start` - Iniciar tarefa
- `POST /api/tasks/:id/complete` - Completar tarefa
- `POST /api/tasks/:id/fail` - Falhar tarefa
- `POST /api/tasks/:id/cancel` - Cancelar tarefa
- `POST /api/tasks/:id/status` - API Android - Atualizar status

### Conteúdo
- `GET /api/content` - Listar conteúdo
- `GET /api/content/:id` - Obter conteúdo
- `POST /api/content` - Criar conteúdo
- `POST /api/content/upload` - Upload de arquivo
- `PUT /api/content/:id` - Atualizar conteúdo
- `DELETE /api/content/:id` - Deletar conteúdo (soft)
- `DELETE /api/content/:id/permanent` - Deletar conteúdo (permanente)
- `GET /api/content/:id/download` - Download de arquivo

### Analytics
- `GET /api/analytics/overview` - Visão geral
- `GET /api/analytics/devices` - Analytics de dispositivos
- `GET /api/analytics/tasks` - Analytics de tarefas
- `GET /api/analytics/content` - Analytics de conteúdo
- `GET /api/analytics/realtime` - Dados em tempo real
- `GET /api/analytics/performance` - Métricas de performance
- `GET /api/analytics/trends` - Tendências
- `GET /api/analytics/export` - Exportar dados
- `GET /api/analytics/dashboard` - Dados do dashboard

### Configurações
- `GET /api/settings` - Listar configurações
- `GET /api/settings/:key` - Obter configuração
- `POST /api/settings` - Criar configuração
- `PUT /api/settings/:key` - Atualizar configuração
- `DELETE /api/settings/:key` - Deletar configuração
- `POST /api/settings/init` - Inicializar configurações padrão
- `GET /api/settings/system/info` - Informações do sistema

### Notificações
- `GET /api/notifications` - Listar notificações do usuário
- `GET /api/notifications/all` - Listar todas (admin)
- `GET /api/notifications/:id` - Obter notificação
- `POST /api/notifications` - Criar notificação
- `POST /api/notifications/broadcast` - Broadcast para todos
- `PUT /api/notifications/:id` - Atualizar notificação
- `DELETE /api/notifications/:id` - Deletar notificação
- `POST /api/notifications/:id/read` - Marcar como lida
- `POST /api/notifications/read-all` - Marcar todas como lidas

## 🔧 Scripts Disponíveis

### Migração
```bash
# Executar migrações
npm run migrate
node scripts/migrate.js up

# Fazer rollback
node scripts/migrate.js down

# Verificar status
node scripts/migrate.js status
```

### Seed
```bash
# Executar seed
npm run seed
node scripts/seed.js run

# Limpar dados
node scripts/seed.js clear

# Verificar status
node scripts/seed.js status

# Forçar execução
node scripts/seed.js run --force
```

### Testes
```bash
# Testar imports
npm run test-imports
node scripts/test-imports.js

# Executar testes
npm test
```

## 📱 API Android

O sistema inclui endpoints específicos para comunicação com dispositivos Android:

### Conectar Dispositivo
```http
POST /api/devices/connect/android
Content-Type: application/json

{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "device_info": {
    "model": "SM-G991B",
    "brand": "Samsung",
    "android_version": "13",
    "whatsapp_version": "2.23.24.78"
  },
  "ip_address": "192.168.1.100"
}
```

### Heartbeat
```http
POST /api/devices/heartbeat
Content-Type: application/json

{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "status": "online",
  "battery_level": 85,
  "memory_usage": 65
}
```

### Atualizar Status da Tarefa
```http
POST /api/tasks/:id/status
Content-Type: application/json

{
  "status": "completed",
  "result": "Mensagem enviada com sucesso",
  "progress": 100
}
```

## 🚀 Deploy em Produção

### 1. Configurar Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Configurar PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name "tsel-backend"

# Configurar startup automático
pm2 startup
pm2 save
```

### 3. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d your-domain.com
```

## 🔍 Monitoramento

### Health Check
```http
GET /health
```

### Logs
Os logs são salvos em:
- `./logs/app.log` - Logs da aplicação
- `./logs/error.log` - Logs de erro
- `./logs/audit.log` - Logs de auditoria

### Métricas
- Uptime do servidor
- Uso de memória e CPU
- Estatísticas de requisições
- Performance do banco de dados

## 🛡️ Segurança

- **Helmet**: Headers de segurança
- **CORS**: Configuração de origens permitidas
- **Rate Limiting**: Limite de requisições por IP
- **Input Validation**: Validação de dados de entrada
- **JWT**: Autenticação segura
- **bcrypt**: Hash de senhas
- **SQL Injection Protection**: Prepared statements

## 📞 Suporte

Para suporte técnico ou dúvidas:

- **Email**: suporte@tsel.com
- **Documentação**: `/api/docs`
- **Issues**: GitHub Issues

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**TSEL Backend** - Sistema completo de Chip Warmup para WhatsApp
