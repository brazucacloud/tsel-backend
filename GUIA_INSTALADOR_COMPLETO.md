# 🚀 Guia Completo - Instalador TSEL Ubuntu 24.04 VPS

## 📋 Visão Geral

Este é o **instalador mais completo e robusto** para o TSEL Frontend + Backend em Ubuntu 24.04 VPS. Ele garante **100% de funcionamento** com todas as configurações necessárias.

## 🎯 Características do Instalador

### ✅ **Funcionalidades Completas:**
- **Verificação automática** de pré-requisitos
- **Backup automático** do sistema
- **Instalação completa** do Docker e dependências
- **Configuração de MTU** para VPS
- **Firewall configurável** (UFW)
- **Swap automático** se necessário
- **Nginx opcional** como proxy reverso
- **SSL opcional** com Let's Encrypt
- **Monitoramento automático**
- **Verificação completa** da instalação
- **Logs detalhados** de todo o processo

### 🛡️ **Segurança e Robustez:**
- **Senhas geradas automaticamente** e seguras
- **Backup de configurações** importantes
- **Verificação de conectividade**
- **Tratamento de erros** completo
- **Rollback automático** em caso de falha

## 🚀 Instalação Rápida

### **Método 1: Instalação Direta (Recomendado)**
```bash
# Baixar e executar o instalador
wget https://raw.githubusercontent.com/brazucacloud/tsel-backend/master/installer-completo-ubuntu-vps.sh
chmod +x installer-completo-ubuntu-vps.sh
sudo ./installer-completo-ubuntu-vps.sh
```

### **Método 2: Clone Completo**
```bash
# Clonar repositório
git clone https://github.com/brazucacloud/tsel-backend.git
cd tsel-backend

# Executar instalador
chmod +x installer-completo-ubuntu-vps.sh
sudo ./installer-completo-ubuntu-vps.sh
```

## 📋 Pré-requisitos da VPS

### **Requisitos Mínimos:**
- **Sistema:** Ubuntu 24.04 (ou 22.04)
- **CPU:** 1 vCore
- **RAM:** 2GB (4GB recomendado)
- **Disco:** 10GB (20GB recomendado)
- **Rede:** Conexão com internet

### **Requisitos Recomendados:**
- **CPU:** 2 vCores
- **RAM:** 4GB
- **Disco:** 20GB SSD
- **Rede:** 100Mbps+

## 🔧 Processo de Instalação

### **1. Verificações Iniciais**
- ✅ Verificação de root/sudo
- ✅ Detecção do Ubuntu 24.04
- ✅ Verificação de conectividade
- ✅ Verificação de espaço em disco
- ✅ Verificação de memória

### **2. Preparação do Sistema**
- ✅ Backup automático do sistema
- ✅ Atualização completa do Ubuntu
- ✅ Instalação de pacotes essenciais
- ✅ Configuração de timezone (UTC)

### **3. Configuração de Rede**
- ✅ Correção de MTU para VPS (1420)
- ✅ Configuração do Docker com MTU
- ✅ DNS otimizado (8.8.8.8, 8.8.4.4)

### **4. Instalação do Docker**
- ✅ Remoção de versões antigas
- ✅ Instalação do Docker CE oficial
- ✅ Instalação do Docker Compose
- ✅ Configuração de permissões
- ✅ Verificação da instalação

### **5. Configuração de Firewall**
- ✅ Instalação do UFW
- ✅ Opções configuráveis:
  - **Opção 1:** Desabilitar UFW (desenvolvimento)
  - **Opção 2:** Configurar UFW com regras Docker
  - **Opção 3:** Pular configuração

### **6. Otimização do Sistema**
- ✅ Configuração de swap (se necessário)
- ✅ Otimização de memória
- ✅ Configuração de swappiness

### **7. Deploy do Projeto**
- ✅ Download/clone do repositório
- ✅ Configuração de variáveis de ambiente
- ✅ Geração de senhas seguras
- ✅ Build e deploy dos containers

### **8. Configurações Opcionais**
- ✅ **Nginx:** Proxy reverso
- ✅ **SSL:** Certificado Let's Encrypt
- ✅ **Monitoramento:** Script automático

### **9. Verificação Final**
- ✅ Status dos containers
- ✅ Verificação de portas
- ✅ Teste da API
- ✅ Informações de acesso

## 🎛️ Opções de Configuração

### **Firewall (UFW)**
Durante a instalação, você escolherá:

1. **Desabilitar UFW** (Recomendado para desenvolvimento)
   - Remove bloqueios de rede
   - Permite acesso total ao Docker
   - Ideal para testes e desenvolvimento

2. **Configurar UFW com regras Docker**
   - Mantém firewall ativo
   - Permite portas necessárias (22, 80, 443, 3000, 3001)
   - Mais seguro para produção

3. **Pular configuração**
   - Mantém configuração atual
   - Você configura manualmente depois

### **Nginx (Proxy Reverso)**
Opções disponíveis:

1. **Configurar Nginx**
   - Instala e configura Nginx
   - Proxy reverso para frontend e backend
   - URLs mais limpas (sem portas)

2. **Pular configuração**
   - Acesso direto via portas
   - Frontend: `http://IP:3000`
   - Backend: `http://IP:3001`

### **SSL (Certificado HTTPS)**
Opções disponíveis:

1. **Configurar SSL com Let's Encrypt**
   - Requer domínio configurado
   - Certificado gratuito e automático
   - Renovação automática

2. **Pular configuração**
   - Acesso via HTTP
   - Configure SSL manualmente depois

## 📊 Monitoramento Automático

O instalador configura um script de monitoramento que:

- ✅ **Verifica containers** a cada 5 minutos
- ✅ **Reinicia containers** se pararem
- ✅ **Monitora uso de disco** e memória
- ✅ **Limpa logs antigos** automaticamente
- ✅ **Registra eventos** em `/var/log/tsel-monitor.log`

## 🔍 Verificação da Instalação

### **Comandos de Verificação:**
```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Verificar portas
netstat -tuln | grep -E ":(3000|3001|80|443)"

# Testar API
curl http://localhost:3001/health

# Verificar monitoramento
tail -f /var/log/tsel-monitor.log
```

### **URLs de Acesso:**
- 🌐 **Frontend:** `http://SEU_IP:3000`
- 🔧 **Backend API:** `http://SEU_IP:3001`
- 📊 **Health Check:** `http://SEU_IP:3001/health`

**Com Nginx:**
- 🌐 **Frontend:** `http://SEU_IP`
- 🔧 **Backend:** `http://SEU_IP/api`

## 🛠️ Comandos Úteis

### **Gerenciamento de Containers:**
```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar tudo
docker-compose restart

# Parar tudo
docker-compose down

# Iniciar tudo
docker-compose up -d

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### **Manutenção:**
```bash
# Verificar uso de recursos
docker stats

# Limpar recursos não utilizados
docker system prune -f

# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres tsel > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres tsel < backup.sql
```

### **Logs e Monitoramento:**
```bash
# Logs do instalador
tail -f /var/log/tsel-install.log

# Logs do monitoramento
tail -f /var/log/tsel-monitor.log

# Logs do sistema
journalctl -u docker
journalctl -u nginx
```

## 🔧 Configuração Pós-Instalação

### **1. Primeiro Acesso**
1. Acesse `http://SEU_IP:3000`
2. Configure o primeiro usuário administrador
3. Configure dispositivos Android

### **2. Configuração de Domínio (Opcional)**
1. Configure DNS para apontar para sua VPS
2. Execute: `sudo certbot --nginx -d seu-dominio.com`
3. Configure renovação automática: `sudo crontab -e`

### **3. Backup Automático**
```bash
# Criar script de backup
cat > /opt/tsel-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/tsel"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup do banco
docker-compose exec -T postgres pg_dump -U postgres tsel > "$BACKUP_DIR/db_$DATE.sql"

# Backup de configurações
cp .env "$BACKUP_DIR/env_$DATE"
cp docker-compose.yml "$BACKUP_DIR/compose_$DATE.yml"

# Limpar backups antigos (manter 7 dias)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_*" -mtime +7 -delete
find "$BACKUP_DIR" -name "compose_*" -mtime +7 -delete
EOF

chmod +x /opt/tsel-backup.sh

# Adicionar ao crontab (backup diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tsel-backup.sh") | crontab -
```

## 🚨 Troubleshooting

### **Problemas Comuns:**

#### **Containers não iniciam:**
```bash
# Verificar logs
docker-compose logs

# Verificar espaço em disco
df -h

# Verificar memória
free -h

# Rebuild completo
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

#### **Problemas de rede:**
```bash
# Verificar MTU
ip link show

# Verificar firewall
sudo ufw status

# Verificar portas
netstat -tuln
```

#### **Problemas de SSL:**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 📞 Suporte

### **Logs Importantes:**
- `/var/log/tsel-install.log` - Log da instalação
- `/var/log/tsel-monitor.log` - Log do monitoramento
- `/var/log/docker.log` - Logs do Docker

### **Arquivos de Configuração:**
- `.env` - Variáveis de ambiente
- `docker-compose.yml` - Configuração dos containers
- `/etc/nginx/sites-available/tsel` - Configuração Nginx

### **Comandos de Diagnóstico:**
```bash
# Status completo do sistema
systemctl status docker nginx

# Verificar recursos
htop
df -h
free -h

# Verificar conectividade
ping 8.8.8.8
curl -I http://localhost:3001/health
```

---

**🎉 Com este instalador, você terá um TSEL 100% funcional em sua VPS Ubuntu 24.04!** 🚀
