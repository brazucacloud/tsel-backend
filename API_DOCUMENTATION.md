# TSEL API Documentation

Documentação completa da API REST do sistema TSEL - Chip Warmup para WhatsApp.

## 🔗 Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <your-jwt-token>
```

## 📋 Endpoints

### Autenticação

#### POST /api/auth/login
Login de usuário.

**Request Body:**
```json
{
  "email": "admin@tsel.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@tsel.com",
      "role": "admin",
      "full_name": "Administrador do Sistema"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/register
Registro de novo usuário (apenas admin).

**Request Body:**
```json
{
  "username": "novo_usuario",
  "email": "novo@tsel.com",
  "password": "Senha123!",
  "full_name": "Novo Usuário",
  "role": "operator"
}
```

#### POST /api/auth/refresh
Renovar token de acesso.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/auth/me
Obter dados do usuário atual.

**Headers:**
```
Authorization: Bearer <token>
```

### Usuários

#### GET /api/users
Listar todos os usuários (apenas admin).

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Termo de busca
- `role`: Filtrar por role

#### GET /api/users/:id
Obter usuário específico.

#### POST /api/users
Criar novo usuário (apenas admin).

**Request Body:**
```json
{
  "username": "usuario",
  "email": "usuario@tsel.com",
  "password": "Senha123!",
  "full_name": "Nome Completo",
  "role": "operator",
  "phone": "+5511999999999"
}
```

#### PUT /api/users/:id
Atualizar usuário.

#### DELETE /api/users/:id
Deletar usuário (apenas admin).

### Dispositivos

#### GET /api/devices
Listar dispositivos.

**Query Parameters:**
- `page`: Número da página
- `limit`: Itens por página
- `status`: Filtrar por status
- `user_id`: Filtrar por usuário
- `online`: Filtrar por status online

#### GET /api/devices/:id
Obter dispositivo específico.

#### POST /api/devices
Criar novo dispositivo.

**Request Body:**
```json
{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "name": "Samsung Galaxy S21",
  "model": "SM-G991B",
  "brand": "Samsung",
  "android_version": "13",
  "whatsapp_version": "2.23.24.78",
  "notes": "Dispositivo principal"
}
```

#### PUT /api/devices/:id
Atualizar dispositivo.

#### DELETE /api/devices/:id
Deletar dispositivo.

#### POST /api/devices/:id/connect
Conectar dispositivo.

#### POST /api/devices/:id/disconnect
Desconectar dispositivo.

#### POST /api/devices/connect/android
API Android - Conectar dispositivo.

**Request Body:**
```json
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

#### POST /api/devices/heartbeat
API Android - Heartbeat.

**Request Body:**
```json
{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "status": "online",
  "battery_level": 85,
  "memory_usage": 65
}
```

### Tarefas

#### GET /api/tasks
Listar tarefas.

**Query Parameters:**
- `page`: Número da página
- `limit`: Itens por página
- `status`: Filtrar por status
- `type`: Filtrar por tipo
- `device_id`: Filtrar por dispositivo
- `user_id`: Filtrar por usuário

#### GET /api/tasks/:id
Obter tarefa específica.

#### POST /api/tasks
Criar nova tarefa.

**Request Body:**
```json
{
  "device_id": 1,
  "type": "message",
  "title": "Enviar Mensagem",
  "description": "Enviar mensagem de boas-vindas",
  "content": "Olá! Bem-vindo ao nosso sistema.",
  "priority": "medium",
  "scheduled_at": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/tasks/:id
Atualizar tarefa.

#### DELETE /api/tasks/:id
Deletar tarefa.

#### POST /api/tasks/:id/start
Iniciar tarefa.

#### POST /api/tasks/:id/complete
Completar tarefa.

**Request Body:**
```json
{
  "result": "Tarefa concluída com sucesso"
}
```

#### POST /api/tasks/:id/fail
Falhar tarefa.

**Request Body:**
```json
{
  "error_message": "Erro ao executar tarefa"
}
```

#### POST /api/tasks/:id/status
API Android - Atualizar status da tarefa.

**Request Body:**
```json
{
  "status": "completed",
  "result": "Mensagem enviada com sucesso",
  "progress": 100
}
```

### Conteúdo

#### GET /api/content
Listar conteúdo.

**Query Parameters:**
- `page`: Número da página
- `limit`: Itens por página
- `type`: Filtrar por tipo
- `device_id`: Filtrar por dispositivo
- `tags`: Filtrar por tags

#### GET /api/content/:id
Obter conteúdo específico.

#### POST /api/content
Criar novo conteúdo.

**Request Body:**
```json
{
  "type": "text",
  "title": "Mensagem de Boas-vindas",
  "description": "Mensagem padrão para novos contatos",
  "content": "Olá! Bem-vindo ao nosso sistema.",
  "tags": ["boas-vindas", "padrão"]
}
```

#### POST /api/content/upload
Upload de arquivo.

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <arquivo>
type: image|video|audio|document
title: Título do arquivo
description: Descrição do arquivo
tags: tag1,tag2,tag3
```

#### PUT /api/content/:id
Atualizar conteúdo.

#### DELETE /api/content/:id
Deletar conteúdo (soft delete).

#### DELETE /api/content/:id/permanent
Deletar conteúdo permanentemente.

#### GET /api/content/:id/download
Download de arquivo.

### Analytics

#### GET /api/analytics/overview
Visão geral do sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 25,
    "total_devices": 15,
    "online_devices": 8,
    "total_tasks": 150,
    "completed_tasks": 120,
    "pending_tasks": 20,
    "failed_tasks": 10,
    "total_content": 45,
    "system_uptime": 86400,
    "memory_usage": 65.5,
    "cpu_usage": 45.2
  }
}
```

#### GET /api/analytics/devices
Analytics de dispositivos.

#### GET /api/analytics/tasks
Analytics de tarefas.

#### GET /api/analytics/content
Analytics de conteúdo.

#### GET /api/analytics/realtime
Dados em tempo real.

#### GET /api/analytics/performance
Métricas de performance.

#### GET /api/analytics/trends
Tendências do sistema.

#### GET /api/analytics/export
Exportar dados.

**Query Parameters:**
- `type`: Tipo de dados (users, devices, tasks, content)
- `format`: Formato (json, csv, xlsx)
- `date_from`: Data inicial
- `date_to`: Data final

#### GET /api/analytics/dashboard
Dados do dashboard.

### Configurações

#### GET /api/settings
Listar configurações.

#### GET /api/settings/:key
Obter configuração específica.

#### POST /api/settings
Criar configuração.

**Request Body:**
```json
{
  "key": "max_devices_per_user",
  "value": "10",
  "description": "Máximo de dispositivos por usuário"
}
```

#### PUT /api/settings/:key
Atualizar configuração.

#### DELETE /api/settings/:key
Deletar configuração.

#### POST /api/settings/init
Inicializar configurações padrão.

#### GET /api/settings/system/info
Informações do sistema.

### Notificações

#### GET /api/notifications
Listar notificações do usuário.

**Query Parameters:**
- `page`: Número da página
- `limit`: Itens por página
- `type`: Filtrar por tipo
- `is_read`: Filtrar por status de leitura

#### GET /api/notifications/all
Listar todas as notificações (apenas admin).

#### GET /api/notifications/:id
Obter notificação específica.

#### POST /api/notifications
Criar notificação.

**Request Body:**
```json
{
  "user_id": 1,
  "type": "system",
  "title": "Sistema Atualizado",
  "message": "O sistema foi atualizado com sucesso",
  "priority": "info"
}
```

#### POST /api/notifications/broadcast
Enviar notificação para todos os usuários.

#### PUT /api/notifications/:id
Atualizar notificação.

#### DELETE /api/notifications/:id
Deletar notificação.

#### POST /api/notifications/:id/read
Marcar notificação como lida.

#### POST /api/notifications/read-all
Marcar todas as notificações como lidas.

#### GET /api/notifications/unread/count
Contar notificações não lidas.

## 📊 Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `422` - Dados inválidos
- `429` - Muitas requisições
- `500` - Erro interno do servidor

## 🔍 Paginação

Endpoints que retornam listas suportam paginação:

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔍 Filtros

Muitos endpoints suportam filtros:

**Query Parameters:**
- `search`: Busca textual
- `date_from`: Data inicial
- `date_to`: Data final
- `status`: Filtro por status
- `type`: Filtro por tipo
- `user_id`: Filtro por usuário
- `device_id`: Filtro por dispositivo

## 📝 Exemplos de Uso

### Login e Obter Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tsel.com",
    "password": "Admin123!"
  }'
```

### Criar Dispositivo
```bash
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "device_id": "SAMSUNG_GALAXY_S21_001",
    "name": "Samsung Galaxy S21",
    "model": "SM-G991B",
    "brand": "Samsung",
    "android_version": "13",
    "whatsapp_version": "2.23.24.78"
  }'
```

### Upload de Arquivo
```bash
curl -X POST http://localhost:3001/api/content/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@imagem.jpg" \
  -F "type=image" \
  -F "title=Imagem Promocional" \
  -F "description=Imagem para promoções"
```

## 🛡️ Segurança

- Todos os endpoints (exceto login/register) requerem autenticação
- Rate limiting aplicado em todos os endpoints
- Validação de entrada em todos os requests
- Sanitização de dados
- Headers de segurança (CORS, Helmet)

## 📞 Suporte

Para suporte técnico:
- Email: suporte@tsel.com
- Documentação: `/api/docs`
- Health Check: `/health`
