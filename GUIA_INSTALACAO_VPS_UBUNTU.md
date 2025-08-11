# 🚀 Guia de Instalação TSEL Frontend + Backend - Ubuntu 24.04 VPS

## 📋 Pré-requisitos

- **Sistema Operacional**: Ubuntu 24.04 LTS
- **RAM Mínima**: 2GB (recomendado 4GB+)
- **Armazenamento**: 20GB+ livre
- **Acesso**: Root ou usuário com sudo
- **Domínio**: Opcional (para SSL)

## 🎯 Instalação Rápida (Recomendado)

### 1. Conectar na VPS
```bash
ssh root@seu-ip-da-vps
```

### 2. Baixar e executar o script de instalação
```bash
# Baixar o script
wget https://raw.githubusercontent.com/brazucacloud/tsel-backend/master/install-frontend-ubuntu-vps.sh

# Tornar executável
chmod +x install-frontend-ubuntu-vps.sh

# Executar instalação
./install-frontend-ubuntu-vps.sh
```

### 3. Configurar SSL (Opcional)
```bash
# Definir seu domínio
export DOMAIN=seu-dominio.com

# Executar novamente para configurar SSL
./install-frontend-ubuntu-vps.sh
```

## 🔧 Instalação Manual (Passo a Passo)

### Passo 1: Atualizar o sistema
```bash
apt update && apt upgrade -y
```

### Passo 2: Instalar dependências
```bash
apt install -y curl wget git unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release \
    htop nano ufw fail2ban nginx certbot python3-certbot-nginx
```

### Passo 3: Instalar Docker
```bash
# Remover versões antigas
apt remove -y docker docker-engine docker.io containerd runc

# Adicionar repositório oficial
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker
```

### Passo 4: Configurar firewall
```bash
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable
```

### Passo 5: Clonar repositório
```bash
git clone https://github.com/brazucacloud/tsel-backend.git
cd tsel-backend
```

### Passo 6: Configurar ambiente
```bash
cp env.example .env

# Gerar senhas seguras
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Atualizar .env
sed -i "s/your_database_password/$DB_PASSWORD/g" .env
sed -i "s/your_jwt_secret/$JWT_SECRET/g" .env
sed -i "s/your_redis_password/$REDIS_PASSWORD/g" .env
```

### Passo 7: Construir e iniciar containers
```bash
# Construir imagens
docker-compose build --no-cache

# Iniciar containers
docker-compose up -d
```

### Passo 8: Verificar status
```bash
# Verificar containers
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 🌐 URLs de Acesso

Após a instalação, você poderá acessar:

- **Frontend**: `http://SEU-IP:3000`
- **Backend API**: `http://SEU-IP:3001`
- **Com SSL**: `https://SEU-DOMINIO` (se configurado)

## 📊 Verificar Instalação

### Status dos containers
```bash
docker-compose ps
```

### Logs em tempo real
```bash
docker-compose logs -f
```

### Testar conectividade
```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:3001/health
```

## 🔧 Comandos Úteis

### Gerenciamento de containers
```bash
# Parar todos os containers
docker-compose down

# Reiniciar containers
docker-compose restart

# Reconstruir e reiniciar
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver logs de um serviço específico
docker-compose logs -f tsel-backend
docker-compose logs -f tsel-frontend
```

### Monitoramento
```bash
# Ver uso de recursos
htop

# Ver uso de disco
df -h

# Ver logs do sistema
journalctl -f

# Monitoramento automático (se configurado)
/usr/local/bin/tsel-monitor.sh
```

### Backup e Restore
```bash
# Backup do banco de dados
docker-compose exec tsel-postgres pg_dump -U postgres tsel_db > backup.sql

# Restore do banco de dados
docker-compose exec -T tsel-postgres psql -U postgres tsel_db < backup.sql
```

## 🛠️ Solução de Problemas

### Problema: Containers não iniciam
```bash
# Verificar logs detalhados
docker-compose logs

# Verificar se as portas estão livres
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Verificar configuração do Docker
docker info
```

### Problema: Erro de conectividade
```bash
# Verificar firewall
ufw status

# Verificar MTU
ip link show | grep mtu

# Corrigir MTU se necessário
ip link set dev eth0 mtu 1420
```

### Problema: Erro de permissão
```bash
# Verificar permissões do Docker
ls -la /var/run/docker.sock

# Adicionar usuário ao grupo docker
usermod -aG docker $USER
newgrp docker
```

### Problema: SSL não funciona
```bash
# Verificar certificado
certbot certificates

# Renovar certificado
certbot renew

# Verificar configuração do Nginx
nginx -t
systemctl status nginx
```

## 📈 Monitoramento e Manutenção

### Configurar monitoramento automático
```bash
# O script já configura monitoramento básico
# Verificar se está funcionando
crontab -l

# Ver logs do monitoramento
tail -f /var/log/tsel-monitor.log
```

### Atualizações
```bash
# Atualizar código
git pull origin master

# Reconstruir containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Limpeza de sistema
```bash
# Limpar imagens não utilizadas
docker system prune -f

# Limpar volumes não utilizados
docker volume prune -f

# Limpar logs antigos
journalctl --vacuum-time=7d
```

## 🔒 Segurança

### Configurações recomendadas
```bash
# Atualizar sistema regularmente
apt update && apt upgrade -y

# Configurar fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Verificar logs de segurança
tail -f /var/log/fail2ban.log
```

### Backup automático
```bash
# Criar script de backup
cat > /usr/local/bin/tsel-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/tsel"
mkdir -p $BACKUP_DIR

# Backup do banco
docker-compose exec -T tsel-postgres pg_dump -U postgres tsel_db > $BACKUP_DIR/db_$DATE.sql

# Backup dos arquivos de configuração
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/tsel-backup.sh

# Adicionar ao crontab (backup diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/tsel-backup.sh") | crontab -
```

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: `docker-compose logs -f`
2. **Verificar status**: `docker-compose ps`
3. **Reiniciar serviços**: `docker-compose restart`
4. **Reconstruir**: `docker-compose down && docker-compose build --no-cache && docker-compose up -d`

## 🎉 Próximos Passos

Após a instalação bem-sucedida:

1. **Configurar domínio** (se aplicável)
2. **Configurar SSL** com Let's Encrypt
3. **Configurar backup automático**
4. **Configurar monitoramento avançado**
5. **Testar todas as funcionalidades**
6. **Configurar usuários e permissões**

---

**🎯 Instalação Completa!** Seu TSEL Frontend + Backend está rodando na VPS Ubuntu 24.04!
