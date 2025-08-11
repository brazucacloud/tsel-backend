# 📋 TSEL Backend - Endpoints Completos da API

Documentação completa de todos os endpoints disponíveis na API do TSEL Backend.

## 🔗 Base URL

```
Development: http://localhost:3001
Production: http://SEU_IP:3001
```

## 🔐 Autenticação

Todos os endpoints (exceto `/health`, `/api` e `/api/auth/*`) requerem autenticação JWT.

**Header obrigatório:**
```
Authorization: Bearer <seu-jwt-token>
```

---

## 🏥 Health Check

### GET /health
Verifica se o backend está funcionando.

**Response:**
```json
{
  "success": true,
  "message": "TSEL Backend está funcionando",
  "timestamp": "2025-08-11T21:59:36.548Z",
  "uptime": 393.050690617,
  "environment": "production"
}
```

---

## 📚 Informações da API

### GET /api
Informações gerais sobre a API.

**Response:**
```json
{
  "success": true,
  "message": "TSEL - Sistema de Chip Warmup para WhatsApp",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "devices": "/api/devices",
    "tasks": "/api/tasks",
    "dailyTasks": "/api/daily-tasks",
    "content": "/api/content",
    "analytics": "/api/analytics",
    "settings": "/api/settings",
    "notifications": "/api/notifications"
  },
  "documentation": "/api/docs",
  "timestamp": "2025-08-11T21:59:36.548Z"
}
```

---

## 🔐 Autenticação

### POST /api/auth/login
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
      "is_active": true,
      "last_login": "2025-08-11T21:59:36.548Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "24h"
    }
  }
}
```

### POST /api/auth/register
Registro de novo usuário (apenas admin).

**Request Body:**
```json
{
  "username": "novo_usuario",
  "email": "novo@tsel.com",
  "password": "Senha123!",
  "role": "operator"
}
```

### POST /api/auth/refresh
Renovar token de acesso.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Obter dados do usuário atual.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 👥 Usuários

### GET /api/users
Listar todos os usuários (apenas admin).

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Termo de busca
- `role`: Filtrar por role

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@tsel.com",
        "role": "admin",
        "is_active": true,
        "last_login": "2025-08-11T21:59:36.548Z",
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/users/:id
Obter usuário específico.

### POST /api/users
Criar novo usuário (apenas admin).

**Request Body:**
```json
{
  "username": "usuario",
  "email": "usuario@tsel.com",
  "password": "Senha123!",
  "role": "operator"
}
```

### PUT /api/users/:id
Atualizar usuário.

### DELETE /api/users/:id
Deletar usuário (apenas admin).

---

## 📱 Dispositivos

### GET /api/devices
Listar dispositivos.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `status`: Filtrar por status
- `isOnline`: Filtrar por status online (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "device_id": "SAMSUNG_GALAXY_S21_001",
        "device_name": "Samsung Galaxy S21",
        "model": "SM-G991B",
        "android_version": "13",
        "whatsapp_version": "2.23.24.78",
        "is_online": true,
        "last_seen": "2025-08-11T21:59:36.548Z",
        "status": "active",
        "battery_level": 85,
        "battery_charging": false,
        "wifi_connected": true,
        "mobile_data": false,
        "ip_address": "192.168.1.100",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/devices/:id
Obter dispositivo específico.

### POST /api/devices
Criar novo dispositivo.

**Request Body:**
```json
{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "device_name": "Samsung Galaxy S21",
  "model": "SM-G991B",
  "android_version": "13",
  "whatsapp_version": "2.23.24.78"
}
```

### PUT /api/devices/:id
Atualizar dispositivo.

### DELETE /api/devices/:id
Deletar dispositivo.

### POST /api/devices/:id/connect
Conectar dispositivo.

### POST /api/devices/:id/disconnect
Desconectar dispositivo.

### POST /api/devices/connect/android
API Android - Conectar dispositivo.

**Request Body:**
```json
{
  "device_id": "SAMSUNG_GALAXY_S21_001",
  "device_info": {
    "model": "SM-G991B",
    "android_version": "13",
    "whatsapp_version": "2.23.24.78"
  },
  "ip_address": "192.168.1.100"
}
```

### POST /api/devices/heartbeat
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

---

## 📋 Tarefas

### GET /api/tasks
Listar tarefas.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `status`: Filtrar por status
- `type`: Filtrar por tipo
- `priority`: Filtrar por prioridade
- `device_id`: Filtrar por dispositivo
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "device_id": 1,
        "device_name": "Samsung Galaxy S21",
        "type": "send_message",
        "status": "pending",
        "priority": "normal",
        "parameters": {
          "message": "Olá!",
          "phone": "+5511999999999"
        },
        "result": null,
        "error": null,
        "started_at": null,
        "completed_at": null,
        "retry_count": 0,
        "max_retries": 3,
        "scheduled_at": null,
        "estimated_duration": 30,
        "actual_duration": null,
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/tasks/:id
Obter tarefa específica.

### POST /api/tasks
Criar tarefa.

**Request Body:**
```json
{
  "device_id": 1,
  "type": "send_message",
  "priority": "normal",
  "parameters": {
    "message": "Olá!",
    "phone": "+5511999999999"
  },
  "scheduled_at": "2025-08-12T10:00:00Z",
  "estimated_duration": 30,
  "max_retries": 3
}
```

### PUT /api/tasks/:id
Atualizar tarefa.

### DELETE /api/tasks/:id
Deletar tarefa.

### POST /api/tasks/:id/start
Iniciar tarefa.

### POST /api/tasks/:id/complete
Completar tarefa.

**Request Body:**
```json
{
  "result": "Mensagem enviada com sucesso",
  "actual_duration": 25
}
```

### POST /api/tasks/:id/fail
Falhar tarefa.

**Request Body:**
```json
{
  "error": "Número não encontrado",
  "actual_duration": 15
}
```

### POST /api/tasks/:id/cancel
Cancelar tarefa.

### POST /api/tasks/:id/status
API Android - Atualizar status da tarefa.

**Request Body:**
```json
{
  "status": "completed",
  "result": "Mensagem enviada com sucesso",
  "progress": 100
}
```

---

## 📅 Tarefas Diárias

### GET /api/daily-tasks
Listar tarefas diárias.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `device_id`: Filtrar por dispositivo
- `day_number`: Filtrar por dia (1-21)
- `status`: Filtrar por status
- `task_type`: Filtrar por tipo

**Response:**
```json
{
  "success": true,
  "data": {
    "daily_tasks": [
      {
        "id": 1,
        "device_id": 1,
        "device_name": "Samsung Galaxy S21",
        "day_number": 1,
        "task_type": "send_message",
        "task_description": "Enviar mensagem de boas-vindas",
        "status": "pending",
        "completed_at": null,
        "notes": null,
        "metadata": {
          "message": "Bem-vindo ao nosso serviço!"
        },
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/daily-tasks/:id
Obter tarefa diária específica.

### POST /api/daily-tasks
Criar tarefa diária.

**Request Body:**
```json
{
  "device_id": 1,
  "day_number": 1,
  "task_type": "send_message",
  "task_description": "Enviar mensagem de boas-vindas",
  "metadata": {
    "message": "Bem-vindo ao nosso serviço!"
  }
}
```

### PUT /api/daily-tasks/:id
Atualizar tarefa diária.

### DELETE /api/daily-tasks/:id
Deletar tarefa diária.

### POST /api/daily-tasks/:id/complete
Completar tarefa diária.

**Request Body:**
```json
{
  "notes": "Tarefa executada com sucesso"
}
```

---

## 📁 Conteúdo

### GET /api/content
Listar conteúdo.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `content_type`: Filtrar por tipo
- `processing_status`: Filtrar por status
- `device_id`: Filtrar por dispositivo
- `task_id`: Filtrar por tarefa

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "content_id": "IMG_001",
        "task_id": 1,
        "device_id": 1,
        "whatsapp_number": "+5511999999999",
        "content_type": "image",
        "action": "send",
        "file_name": "imagem.jpg",
        "file_path": "/uploads/images/imagem.jpg",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "dimensions": {
          "width": 1920,
          "height": 1080
        },
        "duration": null,
        "message_content": "Olha que imagem legal!",
        "metadata": {
          "caption": "Imagem enviada"
        },
        "processing_status": "completed",
        "file_hash": "abc123...",
        "tags": ["imagem", "whatsapp"],
        "content_rating": "safe",
        "is_private": false,
        "access_level": "public",
        "usage_stats": {
          "views": 10,
          "downloads": 5
        },
        "backup_info": {
          "backed_up": true,
          "backup_date": "2025-08-11T21:53:07.000Z"
        },
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/content/:id
Obter conteúdo específico.

### POST /api/content
Criar conteúdo.

**Request Body:**
```json
{
  "content_id": "IMG_001",
  "task_id": 1,
  "device_id": 1,
  "whatsapp_number": "+5511999999999",
  "content_type": "image",
  "action": "send",
  "file_name": "imagem.jpg",
  "message_content": "Olha que imagem legal!",
  "metadata": {
    "caption": "Imagem enviada"
  }
}
```

### POST /api/content/upload
Upload de arquivo.

**Request Body (multipart/form-data):**
```
file: [arquivo]
content_type: "image"
message_content: "Descrição da imagem"
```

### PUT /api/content/:id
Atualizar conteúdo.

### DELETE /api/content/:id
Deletar conteúdo (soft delete).

### DELETE /api/content/:id/permanent
Deletar conteúdo permanentemente.

### GET /api/content/:id/download
Download de arquivo.

---

## 📊 Analytics

### GET /api/analytics/overview
Visão geral do sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "users": {
        "total_users": 25,
        "active_users": 20,
        "new_users_30d": 5
      },
      "devices": {
        "total_devices": 15,
        "online_devices": 8,
        "offline_devices": 7
      },
      "tasks": {
        "total_tasks": 150,
        "pending_tasks": 20,
        "running_tasks": 10,
        "completed_tasks": 120,
        "failed_tasks": 10
      },
      "content": {
        "total_content": 45,
        "image_content": 20,
        "video_content": 10,
        "audio_content": 5,
        "document_content": 5,
        "message_content": 5
      },
      "system": {
        "uptime": 86400,
        "memory": {
          "rss": 52428800,
          "heapTotal": 20971520,
          "heapUsed": 10485760,
          "external": 2097152
        },
        "timestamp": "2025-08-11T21:59:36.548Z"
      }
    }
  }
}
```

### GET /api/analytics/devices
Analytics de dispositivos.

### GET /api/analytics/tasks
Analytics de tarefas.

### GET /api/analytics/content
Analytics de conteúdo.

### GET /api/analytics/realtime
Dados em tempo real.

**Response:**
```json
{
  "success": true,
  "data": {
    "realtime": {
      "online_devices_count": 8,
      "running_tasks_count": 10,
      "recent_content_count": 5,
      "system": {
        "uptime": 86400,
        "memory": {
          "rss": 52428800,
          "heapTotal": 20971520,
          "heapUsed": 10485760,
          "external": 2097152
        },
        "cpu": {
          "user": 1000000,
          "system": 500000
        }
      },
      "timestamp": "2025-08-11T21:59:36.548Z"
    }
  }
}
```

### GET /api/analytics/performance
Métricas de performance.

### GET /api/analytics/trends
Tendências do sistema.

### GET /api/analytics/export
Exportar dados.

**Query Parameters:**
- `type`: Tipo de dados (users, devices, tasks, content)
- `format`: Formato (json, csv, xlsx)
- `date_from`: Data inicial (YYYY-MM-DD)
- `date_to`: Data final (YYYY-MM-DD)

### GET /api/analytics/dashboard
Dados do dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "summary": {
        "total_users": 25,
        "total_devices": 15,
        "total_tasks": 150,
        "total_content": 45
      },
      "status": {
        "online_devices": 8,
        "running_tasks": 10,
        "active_users": 20
      },
      "recent_activity": {
        "devices": [...],
        "tasks": [...]
      },
      "charts": {
        "devices_by_status": {
          "online": 8,
          "offline": 7
        },
        "tasks_by_status": {
          "pending": 20,
          "running": 10,
          "completed": 120,
          "failed": 10
        },
        "content_by_type": {
          "audio": 5,
          "video": 10,
          "image": 20,
          "document": 5,
          "message": 5
        }
      },
      "timestamp": "2025-08-11T21:59:36.548Z"
    }
  }
}
```

---

## ⚙️ Configurações

### GET /api/settings
Listar configurações.

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": [
      {
        "id": 1,
        "key": "system_name",
        "value": "TSEL Backend",
        "description": "Nome do sistema",
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ]
  }
}
```

### GET /api/settings/:key
Obter configuração específica.

### POST /api/settings
Criar configuração.

**Request Body:**
```json
{
  "key": "max_devices_per_user",
  "value": "10",
  "description": "Máximo de dispositivos por usuário"
}
```

### PUT /api/settings/:key
Atualizar configuração.

### DELETE /api/settings/:key
Deletar configuração.

### POST /api/settings/init
Inicializar configurações padrão.

### GET /api/settings/system/info
Informações do sistema.

---

## 🔔 Notificações

### GET /api/notifications
Listar notificações do usuário.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `type`: Filtrar por tipo
- `is_read`: Filtrar por lida (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "user_id": 1,
        "title": "Nova tarefa criada",
        "message": "Uma nova tarefa foi criada para o dispositivo Samsung Galaxy S21",
        "type": "info",
        "is_read": false,
        "data": {
          "task_id": 1,
          "device_id": 1
        },
        "created_at": "2025-08-11T21:53:07.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/notifications/:id
Obter notificação específica.

### POST /api/notifications
Criar notificação.

**Request Body:**
```json
{
  "user_id": 1,
  "title": "Nova tarefa criada",
  "message": "Uma nova tarefa foi criada",
  "type": "info",
  "data": {
    "task_id": 1
  }
}
```

### PUT /api/notifications/:id
Atualizar notificação.

### DELETE /api/notifications/:id
Deletar notificação.

### POST /api/notifications/:id/read
Marcar notificação como lida.

### POST /api/notifications/read-all
Marcar todas as notificações como lidas.

---

## 📁 Uploads

### GET /uploads/:filename
Acessar arquivo enviado.

**Exemplo:**
```
GET /uploads/images/imagem.jpg
```

---

## 🚨 Códigos de Erro

### 400 - Bad Request
Dados inválidos ou parâmetros incorretos.

### 401 - Unauthorized
Token inválido ou expirado.

### 403 - Forbidden
Sem permissão para acessar o recurso.

### 404 - Not Found
Recurso não encontrado.

### 500 - Internal Server Error
Erro interno do servidor.

---

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

### Listar Dispositivos
```bash
curl -X GET http://localhost:3001/api/devices \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar Tarefa
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": 1,
    "type": "send_message",
    "priority": "normal",
    "parameters": {
      "message": "Olá!",
      "phone": "+5511999999999"
    }
  }'
```

### Upload de Arquivo
```bash
curl -X POST http://localhost:3001/api/content/upload \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@imagem.jpg" \
  -F "content_type=image" \
  -F "message_content=Descrição da imagem"
```

---

## 🔄 Webhooks (Futuro)

### POST /api/webhooks/device-status
Webhook para atualização de status de dispositivo.

### POST /api/webhooks/task-completed
Webhook para conclusão de tarefa.

### POST /api/webhooks/content-uploaded
Webhook para upload de conteúdo.

---

**📋 TSEL Backend API v1.0**

Documentação completa dos endpoints disponíveis na API.
