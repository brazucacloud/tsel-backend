# 🚀 TSEL Backend - Instalação Ubuntu 24.04 VPS

## ⚡ Solução Completa para Problemas de Conectividade

Este guia resolve especificamente os problemas de conectividade com repositórios Debian que você está enfrentando no seu VPS Ubuntu 24.04.

## 🔧 Problema Identificado

O erro que você está vendo:
```
Connection timed out [IP: 151.101.130.132 80]
Failed to fetch http://deb.debian.org/debian/dists/bullseye/InRelease
```

É causado por problemas de conectividade com os repositórios Debian durante o build do Docker.

## 🎯 Solução Automática (Recomendada)

### 1. Executar Script de Instalação Completa

```bash
# Navegar para o diretório do projeto
cd ~/tsel-backend

# Tornar script executável
chmod +x install-ubuntu-vps.sh

# Executar instalação completa
./install-ubuntu-vps.sh
```

### 2. Se o script principal falhar, usar script de build específico

```bash
# Executar script de build com múltiplos fallbacks
chmod +x build-ubuntu-vps.sh
./build-ubuntu-vps.sh
```

## 🛠️ Solução Manual (Passo a Passo)

### Passo 1: Verificar e Preparar Sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências essenciais
sudo apt install -y curl wget git build-essential software-properties-common

# Verificar conectividade
ping -c 3 8.8.8.8
curl -I https://deb.debian.org
```

### Passo 2: Instalar Node.js 18

```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Passo 3: Instalar Docker

```bash
# Instalar Docker
sudo apt install -y docker.io docker-compose

# Iniciar e habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker-compose --version
```

### Passo 4: Configurar Projeto

```bash
# Navegar para o projeto
cd ~/tsel-backend

# Instalar dependências Node.js
npm install --timeout=300000 --retry=3

# Criar arquivo .env
cp env.example .env

# Criar diretórios necessários
mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
```

### Passo 5: Build Docker com Fallbacks

#### Opção A: Usar Dockerfile Otimizado para Ubuntu

```bash
# Build com Dockerfile otimizado
docker compose build --file Dockerfile.ubuntu --no-cache --pull tsel-backend
```

#### Opção B: Build Direto

```bash
# Build direto sem docker-compose
docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .
```

#### Opção C: Build com Configurações de Rede

```bash
# Build com configurações de rede específicas
export DOCKER_BUILDKIT=1
docker build --file Dockerfile.ubuntu --no-cache --pull --network=host -t tsel-backend .
```

### Passo 6: Iniciar Serviços

```bash
# Iniciar containers
docker compose up -d

# Aguardar banco estar pronto
sleep 15

# Executar migrações
npm run migrate

# Executar seeds
npm run seed
```

## 🔍 Troubleshooting Específico

### Problema: Timeout nos Repositórios Debian

**Solução:**
```bash
# Limpar cache Docker
docker system prune -a

# Tentar com mirrors alternativos
docker build --file Dockerfile.mirrors --no-cache --pull -t tsel-backend .
```

### Problema: Falha no npm install

**Solução:**
```bash
# Limpar cache npm
npm cache clean --force

# Reinstalar com timeout maior
npm install --timeout=300000 --retry=3
```

### Problema: Permissões de Docker

**Solução:**
```bash
# Verificar se usuário está no grupo docker
groups $USER

# Se não estiver, adicionar e fazer logout/login
sudo usermod -aG docker $USER
newgrp docker
```

### Problema: Porta 3001 em uso

**Solução:**
```bash
# Verificar o que está usando a porta
sudo lsof -i :3001

# Parar processo ou mudar porta no .env
```

## 📊 Verificação da Instalação

```bash
# Verificar containers
docker compose ps

# Verificar logs
docker compose logs -f

# Testar API
curl http://localhost:3001/health

# Verificar status do sistema
./check-system.sh
```

## 🎯 URLs Importantes

Após a instalação bem-sucedida:

- **API Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Documentação**: http://localhost:3001/api-docs

## 🛠️ Comandos Úteis

```bash
# Iniciar sistema
./start-system.sh

# Parar sistema
./stop-system.sh

# Ver logs
./view-logs.sh

# Reiniciar containers
docker compose restart

# Ver status
docker compose ps
```

## 🔧 Scripts Criados

Após a instalação, você terá:

- `install-ubuntu-vps.sh` - Instalação completa
- `build-ubuntu-vps.sh` - Build com fallbacks
- `start-system.sh` - Iniciar sistema
- `stop-system.sh` - Parar sistema
- `view-logs.sh` - Ver logs

## 💡 Dicas Importantes

1. **Execute como root** em VPS para evitar problemas de permissão
2. **Use o Dockerfile.ubuntu** que é otimizado para Ubuntu 24.04
3. **Se houver problemas de rede**, tente em horários diferentes
4. **Mantenha o sistema atualizado** regularmente
5. **Use os scripts de fallback** se o build principal falhar

## 🚨 Se Nada Funcionar

Se todas as soluções falharem:

1. **Verificar conectividade do VPS**:
   ```bash
   ping 8.8.8.8
   curl -I https://google.com
   ```

2. **Verificar configurações de firewall**:
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

3. **Contatar suporte do VPS** sobre problemas de conectividade

4. **Tentar instalação sem Docker**:
   ```bash
   ./install-ubuntu-vps.sh --skip-docker
   ```

---

**🎉 Com essas soluções, seu TSEL Backend deve funcionar perfeitamente no Ubuntu 24.04 VPS!**
