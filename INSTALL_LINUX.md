# TSEL Backend - Instalação no Linux

Este guia fornece instruções para instalar o TSEL Backend em sistemas Linux (Ubuntu, Debian, CentOS, RHEL).

## 📋 Requisitos do Sistema

- **Ubuntu 20.04+** ou **Debian 11+** ou **CentOS 8+** ou **RHEL 8+**
- **2GB RAM** mínimo (4GB recomendado)
- **10GB** espaço em disco
- **Acesso root** para instalação de dependências

## 🚀 Instalação Rápida (Ubuntu)

Para uma instalação rápida e automatizada no Ubuntu:

```bash
# 1. Tornar o script executável
chmod +x quick-install.sh

# 2. Executar instalação rápida
./quick-install.sh
```

Este script irá:
- ✅ Instalar todas as dependências automaticamente
- ✅ Configurar Node.js 18.x, Docker e Docker Compose
- ✅ Configurar variáveis de ambiente
- ✅ Inicializar banco de dados
- ✅ Criar scripts de gerenciamento

## 🔧 Instalação Completa

Para uma instalação mais controlada:

### 1. Instalar Dependências do Sistema

```bash
# Tornar executável
chmod +x install-dependencies.sh

# Executar instalação de dependências
./install-dependencies.sh
```

### 2. Instalar TSEL Backend

```bash
# Tornar executável
chmod +x install.sh

# Executar instalação completa
./install.sh
```

## 📦 Dependências Instaladas

### Sistema
- **Node.js 18.x** - Runtime JavaScript
- **npm** - Gerenciador de pacotes Node.js
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Git** - Controle de versão
- **curl/wget** - Ferramentas de download

### Opcionais
- **Nginx** - Servidor web (reverse proxy)
- **PM2** - Gerenciador de processos Node.js

## 🐳 Containers Docker

O sistema utiliza os seguintes containers:

- **PostgreSQL 15** - Banco de dados principal
- **Redis 7** - Cache e sessões
- **TSEL Backend** - Aplicação Node.js

## 🔧 Scripts de Gerenciamento

Após a instalação, os seguintes scripts estarão disponíveis:

```bash
# Iniciar o sistema
./start.sh

# Parar o sistema
./stop.sh

# Reiniciar o sistema
./restart.sh

# Visualizar logs
./logs.sh

# Backup do banco
./backup.sh

# Restaurar backup
./restore.sh <arquivo_backup.sql>
```

## 🌐 Acessos

Após a instalação, o sistema estará disponível em:

- **API Base**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Documentação**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 👤 Usuário Padrão

- **Email**: admin@tsel.com
- **Senha**: admin123

⚠️ **Importante**: Altere essas credenciais após o primeiro login!

## 🔒 Configuração de Segurança

### 1. Alterar Senhas Padrão

Edite o arquivo `.env` e altere:

```bash
# Senha do banco de dados
DATABASE_PASSWORD=sua_senha_segura_aqui

# Senha do Redis
REDIS_PASSWORD=sua_senha_redis_aqui

# Chave JWT
JWT_SECRET=sua_chave_jwt_segura_aqui
```

### 2. Configurar Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 3001
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 3. Configurar SSL (Produção)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento

### Logs do Sistema

```bash
# Logs da aplicação
tail -f logs/app.log

# Logs de erro
tail -f logs/error.log

# Logs de auditoria
tail -f logs/audit.log
```

### Status dos Containers

```bash
# Verificar status
docker-compose ps

# Verificar recursos
docker stats
```

## 🔄 Backup e Restauração

### Backup Automático

Crie um cron job para backup automático:

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /caminho/para/tsel-backend/backup.sh
```

### Backup Manual

```bash
# Backup completo
./backup.sh

# Restaurar backup
./restore.sh backups/backup_20241201_143022.sql
```

## 🚨 Solução de Problemas

### Docker não inicia

```bash
# Verificar status do Docker
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker

# Habilitar Docker
sudo systemctl enable docker
```

### PostgreSQL não conecta

```bash
# Verificar logs do PostgreSQL
docker-compose logs postgres

# Reiniciar container
docker-compose restart postgres
```

### Porta 3001 ocupada

```bash
# Verificar processo na porta
sudo netstat -tlnp | grep :3001

# Matar processo
sudo kill -9 <PID>
```

### Permissões de Docker

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Recarregar grupos (ou fazer logout/login)
newgrp docker
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `./logs.sh`
2. Consulte a documentação: `README.md`
3. Verifique a documentação da API: `API_DOCUMENTATION.md`

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# Parar o sistema
./stop.sh

# Fazer backup
./backup.sh

# Atualizar código
git pull origin main

# Reinstalar dependências
npm install

# Executar migrações
node scripts/migrate.js up

# Reiniciar sistema
./start.sh
```

## 📝 Notas Importantes

- ✅ Sempre faça backup antes de atualizações
- ✅ Monitore os logs regularmente
- ✅ Mantenha as senhas seguras
- ✅ Configure SSL para produção
- ✅ Configure backup automático
- ✅ Monitore o uso de recursos

---

**TSEL Backend** - Sistema completo para Chip Warmup do WhatsApp
