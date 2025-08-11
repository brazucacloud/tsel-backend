# 🚀 TSEL Frontend + Backend - Deploy Completo

## 📋 Visão Geral

Este projeto integra o **Frontend TSEL** (Sistema de Chip Warmup) com o **Backend API** usando Docker, fornecendo uma solução completa para gerenciamento de tarefas de warmup de chips WhatsApp.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx         │    │   Backend       │
│   (Porta 3000)  │◄──►│   (Porta 80/443)│◄──►│   (Porta 3001)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   (Porta 5432)  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Porta 6379)  │
                       └─────────────────┘
```

## 🎯 Funcionalidades

### Frontend
- ✅ **Dashboard Interativo** com estatísticas em tempo real
- ✅ **Sistema de Tarefas de 21 Dias** para warmup de chips
- ✅ **Gerenciamento de Dispositivos** Android
- ✅ **Interface Moderna** com animações e UX otimizada
- ✅ **Sistema de Notificações** Toast
- ✅ **Responsivo** para mobile e desktop

### Backend
- ✅ **API RESTful** completa
- ✅ **Autenticação JWT** com refresh tokens
- ✅ **Gerenciamento de Tarefas** de warmup
- ✅ **Integração com Dispositivos** Android
- ✅ **Banco de Dados PostgreSQL**
- ✅ **Cache Redis**

## 🚀 Deploy Rápido

### 1. Pré-requisitos

```bash
# Verificar se Docker está instalado
docker --version
docker-compose --version
```

### 2. Deploy Automático (Recomendado)

```bash
# Executar script de deploy
./deploy-frontend.sh
```

### 3. Deploy Manual

```bash
# Parar containers existentes
docker-compose down

# Construir e iniciar
docker-compose up -d --build

# Verificar status
docker-compose ps
```

## 📊 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **Backend API** | http://localhost:3001 | API REST |
| **Nginx HTTP** | http://localhost:80 | Proxy reverso |
| **Nginx HTTPS** | https://localhost:443 | Proxy reverso SSL |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redis** | localhost:6379 | Cache |

## 🔧 Configuração

### Variáveis de Ambiente

O backend está configurado com as seguintes variáveis:

```env
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tsel_db
DB_USER=tsel_user
DB_PASSWORD=tsel_password
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=lY5VDWqsncxqUbF9y9gK7sgc5D38KuIUjj1JTjxpkSdzZSHQQOfhcV7PlJJkdZaz
CORS_ORIGIN=http://localhost:3000,http://localhost:80,http://localhost:443
```

### Estrutura de Arquivos

```
BACKEND/
├── docker-compose.yml          # Configuração Docker
├── nginx.conf                  # Configuração Nginx principal
├── deploy-frontend.sh          # Script de deploy
├── frontend/
│   ├── index.html             # Página principal
│   ├── app.js                 # JavaScript principal
│   ├── Dockerfile             # Dockerfile do frontend
│   └── nginx.conf             # Configuração Nginx do frontend
├── routes/
│   ├── daily-tasks.js         # Rotas de tarefas diárias
│   ├── devices.js             # Rotas de dispositivos
│   ├── auth.js                # Rotas de autenticação
│   └── ...                    # Outras rotas
└── models/
    ├── DailyTask.js           # Modelo de tarefas diárias
    ├── Device.js              # Modelo de dispositivos
    └── ...                    # Outros modelos
```

## 🔌 Conectividade

### Frontend → Backend

O frontend se conecta automaticamente ao backend através de:

1. **Detecção Automática**: Detecta se está rodando em HTTPS ou HTTP
2. **Proxy Nginx**: Todas as chamadas `/api/*` são redirecionadas para o backend
3. **CORS Configurado**: Permite comunicação entre frontend e backend

### Exemplo de Conexão

```javascript
// Configuração automática da API
const API_BASE_URL = window.location.protocol === 'https:' 
    ? 'https://' + window.location.hostname 
    : 'http://' + window.location.hostname + ':3001';

// Exemplo de chamada
const response = await fetch(`${API_BASE_URL}/api/daily-tasks/device/${deviceId}`);
```

## 📱 Funcionalidades Principais

### 1. Dashboard
- Estatísticas em tempo real
- Gráficos interativos
- Dispositivos recentes
- Tarefas recentes

### 2. Tarefas de 21 Dias
- Inicialização de tarefas por dispositivo
- Progresso visual por dia
- Detalhes de cada tarefa
- Status de conclusão

### 3. Gerenciamento de Dispositivos
- Lista de dispositivos Android
- Status online/offline
- Informações de bateria
- Última atividade

## 🛠️ Comandos Úteis

### Docker

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f tsel-backend
docker-compose logs -f tsel-frontend

# Parar todos os serviços
docker-compose down

# Reiniciar um serviço
docker-compose restart tsel-backend

# Reconstruir e reiniciar
docker-compose up -d --build
```

### Manutenção

```bash
# Backup do banco de dados
docker exec tsel-postgres pg_dump -U tsel_user tsel_db > backup.sql

# Restaurar backup
docker exec -i tsel-postgres psql -U tsel_user tsel_db < backup.sql

# Limpar cache Redis
docker exec tsel-redis redis-cli FLUSHALL

# Verificar espaço em disco
docker system df
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Frontend não carrega**
   ```bash
   # Verificar se o container está rodando
   docker-compose ps tsel-frontend
   
   # Ver logs
   docker-compose logs tsel-frontend
   ```

2. **API não responde**
   ```bash
   # Verificar backend
   docker-compose logs tsel-backend
   
   # Testar conectividade
   curl http://localhost:3001/health
   ```

3. **Banco de dados não conecta**
   ```bash
   # Verificar PostgreSQL
   docker-compose logs tsel-postgres
   
   # Testar conexão
   docker exec -it tsel-postgres psql -U tsel_user -d tsel_db
   ```

### Logs Importantes

```bash
# Logs do sistema completo
docker-compose logs

# Logs específicos
docker-compose logs tsel-backend | grep ERROR
docker-compose logs tsel-frontend | grep error
```

## 📈 Monitoramento

### Health Checks

- **Backend**: http://localhost:3001/health
- **Frontend**: http://localhost:3000
- **Nginx**: http://localhost:80

### Métricas

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Imagens não utilizadas
docker images --filter "dangling=true"
```

## 🔐 Segurança

### Configurações Implementadas

- ✅ **HTTPS** com certificados SSL
- ✅ **CORS** configurado adequadamente
- ✅ **Rate Limiting** na API
- ✅ **Headers de Segurança** no Nginx
- ✅ **Autenticação JWT** com refresh tokens

### Recomendações

1. **Alterar senhas padrão** no `docker-compose.yml`
2. **Configurar certificados SSL** válidos
3. **Implementar firewall** no servidor
4. **Monitorar logs** regularmente

## 🚀 Próximos Passos

1. **Configurar domínio** real
2. **Implementar backup automático**
3. **Adicionar monitoramento** (Prometheus/Grafana)
4. **Configurar CI/CD** pipeline
5. **Implementar testes automatizados**

## 📞 Suporte

Para suporte técnico ou dúvidas:

- 📧 Email: suporte@tsel.com
- 📱 WhatsApp: +55 11 99999-9999
- 🌐 Website: https://tsel.com

---

**TSEL Team** - Sistema de Chip Warmup para WhatsApp 🚀
