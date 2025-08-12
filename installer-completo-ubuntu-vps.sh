#!/bin/bash

# 🚀 TSEL Frontend + Backend - Instalador Completo Ubuntu 24.04 VPS
# Versão: 3.0 - Instalador Robusto e Completo
# Autor: TSEL Team
# Data: 2024

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis globais
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/tsel-install.log"
BACKUP_DIR="/opt/tsel-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Banner
show_banner() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 TSEL INSTALLER                        ║"
    echo "║              Frontend + Backend Ubuntu 24.04                ║"
    echo "║                     Versão 3.0                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}📋 Este instalador irá configurar completamente o TSEL na sua VPS${NC}"
    echo -e "${YELLOW}⏱️  Tempo estimado: 10-15 minutos${NC}"
    echo ""
}

# Verificações iniciais
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verificar se é root
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script deve ser executado como root (sudo)"
        exit 1
    fi
    
    # Verificar se é Ubuntu 24.04
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_error "Este script é específico para Ubuntu"
        exit 1
    fi
    
    UBUNTU_VERSION=$(grep "VERSION_ID" /etc/os-release | cut -d'"' -f2)
    if [[ "$UBUNTU_VERSION" != "24.04" ]]; then
        log_warning "Testado para Ubuntu 24.04. Versão detectada: $UBUNTU_VERSION"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Verificar conectividade
    if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_error "Sem conectividade com a internet"
        exit 1
    fi
    
    # Verificar espaço em disco (mínimo 5GB)
    DISK_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$DISK_SPACE" -lt 5242880 ]; then
        log_error "Espaço insuficiente em disco. Mínimo: 5GB"
        exit 1
    fi
    
    # Verificar memória (mínimo 2GB)
    MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
    if [ "$MEMORY_GB" -lt 2 ]; then
        log_warning "Memória baixa detectada: ${MEMORY_GB}GB (recomendado: 4GB+)"
    fi
    
    log_success "Pré-requisitos verificados"
}

# Backup do sistema
create_backup() {
    log_info "Criando backup do sistema..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de configurações importantes
    if [ -f /etc/nginx/nginx.conf ]; then
        cp /etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf.backup"
    fi
    
    if [ -f /etc/ufw/user.rules ]; then
        cp /etc/ufw/user.rules "$BACKUP_DIR/ufw.rules.backup"
    fi
    
    # Backup de variáveis de ambiente
    if [ -f .env ]; then
        cp .env "$BACKUP_DIR/env.backup"
    fi
    
    log_success "Backup criado em $BACKUP_DIR"
}

# Atualizar sistema
update_system() {
    log_info "Atualizando sistema..."
    
    # Atualizar lista de pacotes
    apt update -y
    
    # Atualizar pacotes
    apt upgrade -y
    
    # Instalar pacotes essenciais
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    log_success "Sistema atualizado"
}

# Configurar timezone
setup_timezone() {
    log_info "Configurando timezone..."
    
    # Detectar timezone automaticamente ou usar UTC
    if command -v timedatectl >/dev/null 2>&1; then
        timedatectl set-timezone UTC
    fi
    
    log_success "Timezone configurado para UTC"
}

# Corrigir MTU para VPS
fix_mtu() {
    log_info "Configurando MTU para VPS..."
    
    # Detectar interface principal
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -n "$INTERFACE" ]; then
        # Configurar MTU para 1420 (comum em VPS)
        ip link set dev "$INTERFACE" mtu 1420 2>/dev/null || true
        
        # Configurar Docker com MTU
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << EOF
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
        
        log_success "MTU configurado para 1420"
    else
        log_warning "Não foi possível detectar interface de rede"
    fi
}

# Instalar Docker
install_docker() {
    log_info "Instalando Docker..."
    
    # Remover versões antigas
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Adicionar repositório oficial
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Atualizar e instalar Docker
    apt update -y
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    # Adicionar usuário ao grupo docker
    if [ "$SUDO_USER" ]; then
        usermod -aG docker "$SUDO_USER"
    fi
    
    # Verificar instalação
    if docker --version >/dev/null 2>&1; then
        log_success "Docker instalado: $(docker --version)"
    else
        log_error "Falha na instalação do Docker"
        exit 1
    fi
}

# Configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    # Instalar UFW se não estiver instalado
    apt install -y ufw
    
    # Perguntar sobre UFW
    echo ""
    log_warning "Configuração do Firewall:"
    echo "  1) Desabilitar UFW (recomendado para desenvolvimento)"
    echo "  2) Configurar UFW com regras para Docker"
    echo "  3) Pular configuração de firewall"
    echo ""
    read -p "Escolha uma opção (1-3): " firewall_choice
    
    case $firewall_choice in
        1)
            log_info "Desabilitando UFW..."
            ufw --force disable
            log_success "UFW desabilitado"
            ;;
        2)
            log_info "Configurando UFW com regras para Docker..."
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing
            ufw allow ssh
            ufw allow 80/tcp
            ufw allow 443/tcp
            ufw allow 3000/tcp
            ufw allow 3001/tcp
            ufw --force enable
            log_success "UFW configurado com regras para Docker"
            ;;
        3)
            log_warning "Configuração de firewall ignorada"
            ;;
        *)
            log_warning "Opção inválida. Desabilitando UFW por padrão..."
            ufw --force disable
            log_success "UFW desabilitado"
            ;;
    esac
}

# Configurar swap (se necessário)
setup_swap() {
    log_info "Verificando swap..."
    
    # Verificar se já existe swap
    if swapon --show | grep -q "/swapfile"; then
        log_info "Swap já configurado"
        return
    fi
    
    # Verificar memória
    MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
    
    if [ "$MEMORY_GB" -lt 4 ]; then
        log_info "Memória baixa detectada (${MEMORY_GB}GB). Configurando swap..."
        
        # Criar arquivo de swap
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        
        # Adicionar ao fstab
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        
        # Configurar swappiness
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
        sysctl vm.swappiness=10
        
        log_success "Swap de 2GB configurado"
    else
        log_info "Memória suficiente (${MEMORY_GB}GB). Swap não necessário"
    fi
}

# Baixar e configurar projeto
setup_project() {
    log_info "Configurando projeto TSEL..."
    
    # Verificar se já existe o projeto
    if [ -d ".git" ]; then
        log_info "Projeto já existe. Atualizando..."
        git pull origin master || {
            log_warning "Falha ao atualizar via git. Baixando novamente..."
            cd ..
            rm -rf "$SCRIPT_DIR"
            git clone https://github.com/brazucacloud/tsel-backend.git
            cd tsel-backend
        }
    else
        log_info "Baixando projeto..."
        cd ..
        git clone https://github.com/brazucacloud/tsel-backend.git
        cd tsel-backend
    fi
    
    # Verificar se o clone foi bem-sucedido
    if [ ! -f "docker-compose.yml" ]; then
        log_error "Falha ao baixar o projeto"
        exit 1
    fi
    
    log_success "Projeto configurado"
}

# Configurar variáveis de ambiente
setup_environment() {
    log_info "Configurando variáveis de ambiente..."
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        log_info "Criando arquivo .env..."
        cp env.example .env
    fi
    
    # Gerar senhas seguras
    DB_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Atualizar .env com senhas geradas
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    
    # Configurar CORS para permitir acesso local
    sed -i "s/CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/localhost:3000,http:\/\/localhost:80,http:\/\/localhost:443/" .env
    
    log_success "Variáveis de ambiente configuradas"
}

# Deploy dos containers
deploy_containers() {
    log_info "Fazendo deploy dos containers..."
    
    # Parar containers existentes
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Limpar containers e imagens antigas
    docker system prune -f
    
    # Build e start dos containers
    log_info "Construindo containers..."
    docker-compose build --no-cache
    
    log_info "Iniciando containers..."
    docker-compose up -d
    
    # Aguardar containers iniciarem
    log_info "Aguardando containers iniciarem..."
    sleep 30
    
    # Verificar status dos containers
    if docker-compose ps | grep -q "Up"; then
        log_success "Containers iniciados com sucesso"
    else
        log_error "Falha ao iniciar containers"
        docker-compose logs
        exit 1
    fi
}

# Configurar Nginx (opcional)
setup_nginx() {
    log_info "Configurando Nginx..."
    
    # Perguntar se quer configurar Nginx
    echo ""
    log_warning "Configuração do Nginx:"
    echo "  1) Configurar Nginx como proxy reverso"
    echo "  2) Pular configuração do Nginx"
    echo ""
    read -p "Escolha uma opção (1-2): " nginx_choice
    
    case $nginx_choice in
        1)
            # Instalar Nginx
            apt install -y nginx
            
            # Configurar Nginx
            cat > /etc/nginx/sites-available/tsel << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }
}
EOF
            
            # Habilitar site
            ln -sf /etc/nginx/sites-available/tsel /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            
            # Testar configuração
            nginx -t
            
            # Reiniciar Nginx
            systemctl restart nginx
            systemctl enable nginx
            
            log_success "Nginx configurado como proxy reverso"
            ;;
        2)
            log_warning "Configuração do Nginx ignorada"
            ;;
        *)
            log_warning "Opção inválida. Configuração do Nginx ignorada"
            ;;
    esac
}

# Configurar SSL (opcional)
setup_ssl() {
    log_info "Configurando SSL..."
    
    # Perguntar se quer configurar SSL
    echo ""
    log_warning "Configuração do SSL:"
    echo "  1) Configurar SSL com Let's Encrypt (requer domínio)"
    echo "  2) Pular configuração do SSL"
    echo ""
    read -p "Escolha uma opção (1-2): " ssl_choice
    
    case $ssl_choice in
        1)
            # Verificar se Nginx está instalado
            if ! command -v nginx >/dev/null 2>&1; then
                log_error "Nginx deve estar instalado para configurar SSL"
                return
            fi
            
            # Perguntar domínio
            read -p "Digite seu domínio (ex: exemplo.com): " DOMAIN
            
            if [ -n "$DOMAIN" ]; then
                # Instalar Certbot
                apt install -y certbot python3-certbot-nginx
                
                # Obter certificado
                certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || {
                    log_warning "Falha ao obter certificado SSL. Configure manualmente depois."
                }
                
                log_success "SSL configurado para $DOMAIN"
            else
                log_warning "Domínio não informado. SSL não configurado"
            fi
            ;;
        2)
            log_warning "Configuração do SSL ignorada"
            ;;
        *)
            log_warning "Opção inválida. Configuração do SSL ignorada"
            ;;
    esac
}

# Configurar monitoramento
setup_monitoring() {
    log_info "Configurando monitoramento..."
    
    # Criar script de monitoramento
    cat > /opt/tsel-monitor.sh << 'EOF'
#!/bin/bash

# Script de monitoramento TSEL
LOG_FILE="/var/log/tsel-monitor.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Verificar containers
if ! docker-compose ps | grep -q "Up"; then
    log "ERRO: Containers não estão rodando"
    docker-compose restart
    log "Containers reiniciados"
fi

# Verificar uso de disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log "ALERTA: Uso de disco alto: ${DISK_USAGE}%"
fi

# Verificar uso de memória
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    log "ALERTA: Uso de memória alto: ${MEMORY_USAGE}%"
fi

# Limpar logs antigos
find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true
EOF
    
    chmod +x /opt/tsel-monitor.sh
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/tsel-monitor.sh") | crontab -
    
    log_success "Monitoramento configurado"
}

# Verificar instalação
verify_installation() {
    log_info "Verificando instalação..."
    
    # Verificar containers
    if docker-compose ps | grep -q "Up"; then
        log_success "✅ Containers rodando"
    else
        log_error "❌ Containers não estão rodando"
        return 1
    fi
    
    # Verificar portas
    if netstat -tuln | grep -q ":3000"; then
        log_success "✅ Frontend acessível na porta 3000"
    else
        log_warning "⚠️  Frontend não está na porta 3000"
    fi
    
    if netstat -tuln | grep -q ":3001"; then
        log_success "✅ Backend acessível na porta 3001"
    else
        log_warning "⚠️  Backend não está na porta 3001"
    fi
    
    # Verificar API
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        log_success "✅ API respondendo"
    else
        log_warning "⚠️  API não está respondendo"
    fi
    
    log_success "Verificação concluída"
}

# Mostrar informações finais
show_final_info() {
    log_info "Instalação concluída!"
    
    # Obter IP da VPS
    VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}🎉 TSEL instalado com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}📋 Informações de Acesso:${NC}"
    echo -e "   🌐 Frontend: http://$VPS_IP:3000"
    echo -e "   🔧 Backend API: http://$VPS_IP:3001"
    echo -e "   📊 Health Check: http://$VPS_IP:3001/health"
    echo ""
    
    if command -v nginx >/dev/null 2>&1; then
        echo -e "${CYAN}🌐 Nginx Proxy:${NC}"
        echo -e "   🌐 Frontend: http://$VPS_IP"
        echo -e "   🔧 Backend: http://$VPS_IP/api"
        echo ""
    fi
    
    echo -e "${CYAN}🔧 Comandos Úteis:${NC}"
    echo -e "   📊 Status: docker-compose ps"
    echo -e "   📝 Logs: docker-compose logs -f"
    echo -e "   🔄 Reiniciar: docker-compose restart"
    echo -e "   🛑 Parar: docker-compose down"
    echo -e "   🚀 Iniciar: docker-compose up -d"
    echo ""
    
    echo -e "${CYAN}📁 Arquivos Importantes:${NC}"
    echo -e "   📄 Configuração: $SCRIPT_DIR/.env"
    echo -e "   📋 Logs: $LOG_FILE"
    echo -e "   💾 Backup: $BACKUP_DIR"
    echo -e "   📊 Monitor: /opt/tsel-monitor.sh"
    echo ""
    
    echo -e "${YELLOW}⚠️  Próximos Passos:${NC}"
    echo -e "   1. Acesse o frontend e configure o primeiro usuário"
    echo -e "   2. Configure dispositivos Android"
    echo -e "   3. Configure SSL se necessário"
    echo -e "   4. Configure backup automático"
    echo ""
    
    echo -e "${GREEN}🚀 TSEL está pronto para uso!${NC}"
}

# Função principal
main() {
    show_banner
    
    # Verificar se quer continuar
    echo -e "${YELLOW}⚠️  Este instalador irá configurar completamente o TSEL na sua VPS${NC}"
    read -p "Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Instalação cancelada pelo usuário"
        exit 0
    fi
    
    # Executar etapas
    check_prerequisites
    create_backup
    update_system
    setup_timezone
    fix_mtu
    install_docker
    setup_firewall
    setup_swap
    setup_project
    setup_environment
    deploy_containers
    setup_nginx
    setup_ssl
    setup_monitoring
    verify_installation
    show_final_info
    
    log_success "Instalação concluída com sucesso!"
}

# Executar função principal
main "$@"
