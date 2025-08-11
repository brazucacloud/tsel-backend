# 🚀 TSEL Backend - Instalador Eficiente

## 📋 Visão Geral

Este instalador automatizado para o **TSEL Backend** oferece uma solução completa e eficiente para implantar o sistema em servidores Ubuntu 24.04 VPS. O instalador resolve automaticamente todos os problemas conhecidos de conectividade, SSL e configuração.

## ✨ Características

- ✅ **Instalação Automatizada**: Tudo configurado automaticamente
- ✅ **Otimização MTU**: Resolve problemas de conectividade em VPS
- ✅ **SSL Desabilitado**: Evita problemas de certificados
- ✅ **Sistema Completo**: Node.js + PostgreSQL + Redis + Nginx
- ✅ **Gerenciamento Fácil**: Scripts de controle integrados
- ✅ **Serviço Systemd**: Inicialização automática com o sistema
- ✅ **Backup Automático**: Sistema de backup integrado

## 🛠️ Requisitos

- **Sistema Operacional**: Ubuntu 24.04 (recomendado) ou Ubuntu 22.04+
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Armazenamento**: Mínimo 10GB livre
- **Acesso**: Root ou sudo
- **Conexão**: Internet estável

## 🚀 Instalação Rápida

### 1. Download do Instalador

```bash
# Baixar o instalador
wget https://raw.githubusercontent.com/brazucacloud/tsel-backend/main/install-tsel-backend.sh

# Tornar executável
chmod +x install-tsel-backend.sh
```

### 2. Executar Instalação

```bash
# Executar como root
sudo bash install-tsel-backend.sh
```

### 3. Aguardar Conclusão

O instalador irá:
- Atualizar o sistema
- Instalar todas as dependências
- Configurar Docker com MTU otimizado
- Baixar e configurar o projeto
- Criar configurações sem SSL
- Iniciar todos os serviços
- Testar a conectividade

## 📁 Estrutura Instalada

```
/opt/tsel-backend/
├── config/
│   └── database.js          # Configuração do banco (sem SSL)
├── uploads/                 # Arquivos enviados
├── logs/                    # Logs do sistema
├── backups/                 # Backups automáticos
├── docker-compose.yml       # Configuração Docker
├── nginx.conf              # Configuração Nginx (sem SSL)
└── Dockerfile.ubuntu       # Dockerfile otimizado
```

## 🎮 Comandos de Gerenciamento

Após a instalação, você pode usar os seguintes comandos:

```bash
# Iniciar serviços
tsel-backend start

# Parar serviços
tsel-backend stop

# Reiniciar serviços
tsel-backend restart

# Ver status
tsel-backend status

# Ver logs em tempo real
tsel-backend logs

# Atualizar sistema
tsel-backend update

# Criar backup
tsel-backend backup
```

## 🌐 Acesso ao Sistema

Após a instalação, o sistema estará disponível em:

- **Backend API**: `http://SEU_IP:3001`
- **Nginx Proxy**: `http://SEU_IP:80`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

## 🔧 Configurações Automáticas

### Docker MTU
```json
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
```

### Banco de Dados (PostgreSQL)
- **Host**: postgres (container)
- **Porta**: 5432
- **Database**: tsel_db
- **Usuário**: tsel_user
- **Senha**: tsel_password
- **SSL**: Desabilitado

### Nginx
- **Porta**: 80 (HTTP)
- **Proxy**: Para backend na porta 3001
- **SSL**: Desabilitado (configuração simples)

## 📊 Monitoramento

### Verificar Status dos Containers
```bash
docker ps
```

### Ver Logs Específicos
```bash
# Logs do backend
docker logs tsel-backend

# Logs do PostgreSQL
docker logs tsel-postgres

# Logs do Redis
docker logs tsel-redis

# Logs do Nginx
docker logs tsel-nginx
```

### Verificar Recursos
```bash
# Uso de CPU e RAM
docker stats

# Espaço em disco
df -h

# Uso de rede
docker network ls
```

## 🔄 Atualizações

### Atualização Automática
```bash
tsel-backend update
```

### Atualização Manual
```bash
cd /opt/tsel-backend
git pull origin master
docker compose build --no-cache tsel-backend
docker compose up -d
```

## 💾 Backup e Restauração

### Criar Backup
```bash
tsel-backend backup
```

### Backup Manual
```bash
cd /opt/tsel-backend
docker compose exec postgres pg_dump -U tsel_user tsel_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup
```bash
cd /opt/tsel-backend
docker compose exec -T postgres psql -U tsel_user -d tsel_db < backup_arquivo.sql
```

## 🗑️ Desinstalação

### Desinstalação Completa
```bash
# Baixar desinstalador
wget https://raw.githubusercontent.com/brazucacloud/tsel-backend/main/uninstall-tsel-backend.sh

# Tornar executável
chmod +x uninstall-tsel-backend.sh

# Executar desinstalação
sudo bash uninstall-tsel-backend.sh
```

**⚠️ ATENÇÃO**: A desinstalação remove TODOS os dados!

## 🐛 Solução de Problemas

### Problema: Containers não iniciam
```bash
# Verificar logs
tsel-backend logs

# Reiniciar Docker
sudo systemctl restart docker

# Tentar novamente
tsel-backend restart
```

### Problema: Erro de conectividade
```bash
# Verificar MTU
cat /etc/docker/daemon.json

# Reiniciar Docker
sudo systemctl restart docker

# Verificar rede
docker network ls
```

### Problema: Erro de SSL
```bash
# Verificar configuração do banco
cat /opt/tsel-backend/config/database.js | grep ssl

# Deve mostrar: ssl: false
```

### Problema: Porta já em uso
```bash
# Verificar portas em uso
netstat -tulpn | grep :3001
netstat -tulpn | grep :80

# Parar serviços conflitantes
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
```

## 📞 Suporte

### Logs de Instalação
Os logs de instalação são exibidos em tempo real durante a execução do script.

### Verificar Instalação
```bash
# Verificar se tudo está funcionando
tsel-backend status

# Testar conectividade
curl http://localhost:3001/health
curl http://localhost:80
```

### Informações do Sistema
```bash
# Versão do Docker
docker --version

# Versão do Node.js
node --version

# Status dos serviços
systemctl status tsel-backend
```

## 🔒 Segurança

### Firewall (Opcional)
```bash
# Instalar UFW
sudo apt install ufw

# Configurar regras
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 3001/tcp  # Backend (se necessário)

# Ativar firewall
sudo ufw enable
```

### Atualizações de Segurança
```bash
# Atualizar sistema regularmente
sudo apt update && sudo apt upgrade -y

# Atualizar Docker
sudo apt update && sudo apt install docker-ce docker-ce-cli containerd.io
```

## 📈 Performance

### Otimizações Automáticas
- MTU configurado para 1420 (otimizado para VPS)
- Pool de conexões PostgreSQL configurado
- Nginx configurado como proxy reverso
- Redis configurado para cache

### Monitoramento de Performance
```bash
# Ver uso de recursos
docker stats

# Ver logs de performance
docker logs tsel-backend | grep "Query executada"
```

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. **Configurar Domínio** (opcional)
2. **Configurar SSL/HTTPS** (opcional)
3. **Configurar Backup Automático**
4. **Configurar Monitoramento**
5. **Configurar Firewall**

## 📝 Changelog

### Versão 1.0
- ✅ Instalação automatizada completa
- ✅ Resolução automática de problemas SSL
- ✅ Configuração MTU otimizada
- ✅ Scripts de gerenciamento
- ✅ Serviço systemd
- ✅ Sistema de backup

---

**🚀 TSEL Backend - Instalador Eficiente v1.0**

Desenvolvido para facilitar a implantação do TSEL Backend em ambientes de produção.
