# TSEL Backend - Scripts de Instalação para Linux

Este documento resume todos os scripts de instalação criados para o TSEL Backend no ambiente Linux.

## 📁 Scripts Disponíveis

### 1. `quick-install.sh` - Instalação Rápida (Ubuntu)
**Uso**: `./quick-install.sh`

**Descrição**: Script otimizado para Ubuntu que automatiza toda a instalação em um único comando.

**Funcionalidades**:
- ✅ Instalação automática de todas as dependências
- ✅ Configuração do Node.js 18.x, Docker e Docker Compose
- ✅ Configuração automática de variáveis de ambiente
- ✅ Inicialização do banco de dados
- ✅ Criação de scripts de gerenciamento
- ✅ Verificação de compatibilidade do sistema

**Compatibilidade**: Ubuntu 20.04+

---

### 2. `install.sh` - Instalação Completa (Multi-distro)
**Uso**: `./install.sh`

**Descrição**: Script completo e interativo para todas as distribuições Linux suportadas.

**Funcionalidades**:
- ✅ Verificação detalhada do sistema operacional
- ✅ Instalação opcional de dependências do sistema
- ✅ Configuração interativa (PM2, Nginx, SSL)
- ✅ Verificação de arquivos necessários
- ✅ Teste completo da aplicação
- ✅ Criação de scripts de gerenciamento

**Compatibilidade**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+

---

### 3. `install-dependencies.sh` - Instalação de Dependências
**Uso**: `./install-dependencies.sh`

**Descrição**: Script específico para instalar apenas as dependências do sistema.

**Funcionalidades**:
- ✅ Detecção automática da distribuição Linux
- ✅ Instalação de Node.js 18.x
- ✅ Instalação de Docker e Docker Compose
- ✅ Instalação de Git e ferramentas básicas
- ✅ Instalação opcional de PM2 e Nginx
- ✅ Verificação de instalações

**Compatibilidade**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, Arch Linux

---

### 4. `check-system.sh` - Verificação de Sistema
**Uso**: `./check-system.sh`

**Descrição**: Script de diagnóstico que verifica se o sistema está pronto para instalação.

**Funcionalidades**:
- ✅ Verificação do sistema operacional e versão
- ✅ Verificação de arquitetura (x86_64, ARM64)
- ✅ Verificação de memória RAM e espaço em disco
- ✅ Verificação de conectividade de internet
- ✅ Verificação de dependências instaladas
- ✅ Verificação de Node.js e Docker
- ✅ Verificação de portas e permissões
- ✅ Verificação de arquivos do projeto
- ✅ Verificação de firewall

**Compatibilidade**: Todas as distribuições Linux

---

## 🚀 Fluxo de Instalação Recomendado

### Para Ubuntu (Recomendado)
```bash
# 1. Verificar sistema
chmod +x check-system.sh
./check-system.sh

# 2. Instalação rápida
chmod +x quick-install.sh
./quick-install.sh
```

### Para Outras Distribuições
```bash
# 1. Verificar sistema
chmod +x check-system.sh
./check-system.sh

# 2. Instalar dependências (se necessário)
chmod +x install-dependencies.sh
./install-dependencies.sh

# 3. Instalação completa
chmod +x install.sh
./install.sh
```

---

## 📋 Scripts de Gerenciamento Criados

Após a instalação, os seguintes scripts estarão disponíveis:

| Script | Função |
|--------|--------|
| `start.sh` | Inicia o TSEL Backend |
| `stop.sh` | Para o TSEL Backend |
| `restart.sh` | Reinicia o TSEL Backend |
| `logs.sh` | Exibe logs em tempo real |
| `backup.sh` | Cria backup do banco de dados |
| `restore.sh` | Restaura backup do banco de dados |

---

## 🔧 Configurações Automáticas

### Variáveis de Ambiente
Os scripts configuram automaticamente:
- `JWT_SECRET` - Chave JWT gerada automaticamente
- `DATABASE_PASSWORD` - Senha do PostgreSQL gerada automaticamente
- `REDIS_PASSWORD` - Senha do Redis gerada automaticamente

### Containers Docker
- **PostgreSQL 15** - Banco de dados principal
- **Redis 7** - Cache e sessões
- **TSEL Backend** - Aplicação Node.js

### Portas Utilizadas
- **3001** - API TSEL Backend
- **5432** - PostgreSQL
- **6379** - Redis
- **80/443** - Nginx (opcional)

---

## 🛡️ Segurança

### Verificações de Segurança
- ✅ Não executa como root
- ✅ Verifica permissões de arquivos
- ✅ Gera senhas seguras automaticamente
- ✅ Verifica conectividade de rede
- ✅ Valida arquivos do projeto

### Recomendações Pós-Instalação
1. **Alterar senhas padrão** no arquivo `.env`
2. **Configurar firewall** para liberar portas necessárias
3. **Configurar SSL** para produção
4. **Configurar backup automático**
5. **Monitorar logs** regularmente

---

## 📊 Compatibilidade

### Sistemas Operacionais Suportados
| Distribuição | Versão Mínima | Status |
|--------------|---------------|--------|
| Ubuntu | 20.04+ | ✅ Testado |
| Debian | 11+ | ✅ Testado |
| CentOS | 8+ | ✅ Testado |
| RHEL | 8+ | ✅ Testado |
| Rocky Linux | 8+ | ✅ Testado |
| AlmaLinux | 8+ | ✅ Testado |
| Arch Linux | Latest | ⚠️ Suporte básico |

### Arquiteturas Suportadas
- **x86_64** (64-bit) - ✅ Totalmente suportado
- **ARM64** (aarch64) - ✅ Suportado
- **ARM32** - ⚠️ Suporte limitado

---

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. Permissões de Docker
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Portas Ocupadas
```bash
# Verificar portas em uso
sudo netstat -tlnp | grep :3001
sudo ss -tlnp | grep :3001
```

#### 3. Docker não inicia
```bash
# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 4. Memória Insuficiente
```bash
# Verificar memória
free -h
# Aumentar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📞 Suporte

### Documentação
- `README.md` - Documentação geral
- `INSTALL_LINUX.md` - Guia específico para Linux
- `API_DOCUMENTATION.md` - Documentação da API

### Logs
- `logs/app.log` - Logs da aplicação
- `logs/error.log` - Logs de erro
- `logs/audit.log` - Logs de auditoria

### Comandos Úteis
```bash
# Verificar status dos containers
docker-compose ps

# Verificar recursos
docker stats

# Verificar logs específicos
docker-compose logs tsel-backend
docker-compose logs postgres
docker-compose logs redis
```

---

## 🔄 Atualizações

### Atualizar Sistema
```bash
# Parar sistema
./stop.sh

# Backup
./backup.sh

# Atualizar código
git pull origin main

# Reinstalar dependências
npm install

# Executar migrações
node scripts/migrate.js up

# Reiniciar
./start.sh
```

---

**TSEL Backend** - Sistema completo para Chip Warmup do WhatsApp

*Scripts otimizados para Linux - Versão 2.0.0*
