#!/bin/bash

# Script de Instalação TSEL Frontend + Backend para Ubuntu 24.04 VPS
# Versão: 2.0 - Com Frontend Integrado
# Autor: TSEL Team

set -e

echo "🚀 TSEL Frontend + Backend - Instalação Ubuntu 24.04 VPS"
echo "========================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
    log_warning "Executando como root. Isso é OK para VPS."
else
    log_warning "Recomendado executar como root em VPS para evitar problemas de permissão."
fi

# Função para verificar conectividade
check_connectivity() {
    log_info "Verificando conectividade..."
    
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_success "Conectividade básica OK"
    else
        log_error "Problemas de conectividade detectados"
        return 1
    fi
    
    if curl -s --connect-timeout 10 https://deb.debian.org >/dev/null 2>&1; then
        log_success "Acesso aos repositórios Debian OK"
    else
        log_warning "Problemas de acesso aos repositórios Debian"
    fi
}

# Função para corrigir MTU
fix_mtu() {
    log_info "Verificando e corrigindo MTU..."
    
    # Verificar MTU atual
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    CURRENT_MTU=$(ip link show $INTERFACE | grep mtu | awk '{print $5}' 2>/dev/null)
    
    if [ "$CURRENT_MTU" != "1420" ]; then
        log_warning "MTU atual: $CURRENT_MTU, configurando para 1420..."
        
        # Configurar MTU temporariamente
        ip link set dev $INTERFACE mtu 1420 2>/dev/null
        
        # Configurar Docker com MTU
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << EOF
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
        
        # Reiniciar Docker se estiver rodando
        if systemctl is-active --quiet docker; then
            systemctl restart docker
        fi
        
        log_success "MTU configurado para 1420"
    else
        log_success "MTU já está correto (1420)"
    fi
}

# Função para instalar dependências do sistema
install_system_deps() {
    log_info "Instalando dependências do sistema..."
    
    # Atualizar lista de pacotes
    apt-get update || {
        log_warning "Falha ao atualizar pacotes, tentando com fallback..."
        apt-get update --allow-releaseinfo-change || true
    }
    
    # Instalar dependências essenciais
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        htop \
        nano \
        ufw \
        fail2ban \
        nginx \
        certbot \
        python3-certbot-nginx || {
        log_error "Falha ao instalar dependências básicas"
        return 1
    }
    
    log_success "Dependências do sistema instaladas"
}

# Função para instalar Docker
install_docker() {
    log_info "Instalando Docker..."
    
    # Remover versões antigas
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Adicionar repositório oficial do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Atualizar e instalar Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    # Adicionar usuário atual ao grupo docker (se não for root)
    if [[ $EUID -ne 0 ]]; then
        usermod -aG docker $USER
    fi
    
    log_success "Docker instalado e configurado"
}

# Função para instalar Docker Compose
install_docker_compose() {
    log_info "Instalando Docker Compose..."
    
    # Instalar Docker Compose v2 (já vem com docker-ce)
    if ! command -v docker-compose &> /dev/null; then
        # Fallback para instalação manual
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    log_success "Docker Compose instalado"
}

# Função para configurar firewall
setup_firewall() {
    log_info "Configurando firewall..."
    
    # Resetar regras
    ufw --force reset
    
    # Configurar regras padrão
    ufw default deny incoming
    ufw default allow outgoing
    
    # Permitir SSH
    ufw allow ssh
    
    # Permitir HTTP e HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Permitir portas do Docker (se necessário)
    ufw allow 3000/tcp
    ufw allow 3001/tcp
    
    # Habilitar firewall
    ufw --force enable
    
    log_success "Firewall configurado"
}

# Função para configurar SSL
setup_ssl() {
    log_info "Configurando SSL..."
    
    # Verificar se o domínio está configurado
    if [ -z "$DOMAIN" ]; then
        log_warning "Variável DOMAIN não definida. SSL será configurado posteriormente."
        return 0
    fi
    
    # Configurar Nginx para o domínio
    cat > /etc/nginx/sites-available/tsel << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
    
    # Obter certificado SSL
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        log_warning "Falha ao obter certificado SSL. Configure manualmente depois."
    }
    
    log_success "SSL configurado para $DOMAIN"
}

# Função para clonar ou atualizar repositório
setup_repository() {
    log_info "Configurando repositório..."
    
    if [ -d ".git" ]; then
        log_info "Repositório já existe, atualizando..."
        git pull origin master || {
            log_warning "Falha ao atualizar repositório"
        }
    else
        log_info "Clonando repositório..."
        git clone https://github.com/brazucacloud/tsel-backend.git . || {
            log_error "Falha ao clonar repositório"
            return 1
        }
    fi
    
    log_success "Repositório configurado"
}

# Função para configurar variáveis de ambiente
setup_environment() {
    log_info "Configurando variáveis de ambiente..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        
        # Gerar senhas seguras
        DB_PASSWORD=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 64)
        REDIS_PASSWORD=$(openssl rand -base64 32)
        
        # Atualizar .env
        sed -i "s/your_database_password/$DB_PASSWORD/g" .env
        sed -i "s/your_jwt_secret/$JWT_SECRET/g" .env
        sed -i "s/your_redis_password/$REDIS_PASSWORD/g" .env
        
        log_success "Arquivo .env criado com senhas seguras"
    else
        log_info "Arquivo .env já existe"
    fi
}

# Função para construir e iniciar containers
deploy_containers() {
    log_info "Construindo e iniciando containers..."
    
    # Parar containers existentes
    docker-compose down --remove-orphans || true
    
    # Limpar imagens antigas
    docker system prune -f || true
    
    # Construir imagens
    docker-compose build --no-cache || {
        log_error "Falha ao construir containers"
        return 1
    }
    
    # Iniciar containers
    docker-compose up -d || {
        log_error "Falha ao iniciar containers"
        return 1
    }
    
    log_success "Containers iniciados com sucesso"
}

# Função para verificar status
check_status() {
    log_info "Verificando status dos containers..."
    
    sleep 10
    
    if docker-compose ps | grep -q "Up"; then
        log_success "Todos os containers estão rodando"
        
        # Mostrar status detalhado
        echo ""
        echo "📊 Status dos Containers:"
        echo "========================="
        docker-compose ps
        
        echo ""
        echo "🌐 URLs de Acesso:"
        echo "=================="
        echo "Frontend: http://$(curl -s ifconfig.me):3000"
        echo "Backend API: http://$(curl -s ifconfig.me):3001"
        if [ ! -z "$DOMAIN" ]; then
            echo "Frontend (SSL): https://$DOMAIN"
            echo "Backend API (SSL): https://$DOMAIN/api"
        fi
        
        echo ""
        echo "📝 Logs dos Containers:"
        echo "======================="
        docker-compose logs --tail=20
        
    else
        log_error "Alguns containers falharam ao iniciar"
        docker-compose logs
        return 1
    fi
}

# Função para configurar monitoramento
setup_monitoring() {
    log_info "Configurando monitoramento básico..."
    
    # Criar script de monitoramento
    cat > /usr/local/bin/tsel-monitor.sh << 'EOF'
#!/bin/bash
echo "=== TSEL System Monitor ==="
echo "Data: $(date)"
echo ""
echo "=== Docker Containers ==="
docker-compose ps
echo ""
echo "=== System Resources ==="
free -h
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Recent Logs ==="
docker-compose logs --tail=10
EOF
    
    chmod +x /usr/local/bin/tsel-monitor.sh
    
    # Adicionar ao crontab para monitoramento automático
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/tsel-monitor.sh > /var/log/tsel-monitor.log 2>&1") | crontab -
    
    log_success "Monitoramento configurado"
}

# Função principal
main() {
    echo "🚀 Iniciando instalação do TSEL Frontend + Backend..."
    echo ""
    
    # Verificar conectividade
    check_connectivity
    
    # Corrigir MTU
    fix_mtu
    
    # Instalar dependências
    install_system_deps
    
    # Instalar Docker
    install_docker
    
    # Instalar Docker Compose
    install_docker_compose
    
    # Configurar firewall
    setup_firewall
    
    # Configurar repositório
    setup_repository
    
    # Configurar ambiente
    setup_environment
    
    # Deploy containers
    deploy_containers
    
    # Verificar status
    check_status
    
    # Configurar monitoramento
    setup_monitoring
    
    # Configurar SSL se DOMAIN estiver definido
    if [ ! -z "$DOMAIN" ]; then
        setup_ssl
    fi
    
    echo ""
    echo "🎉 Instalação concluída com sucesso!"
    echo "====================================="
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure seu domínio apontando para este servidor"
    echo "2. Execute: export DOMAIN=seu-dominio.com"
    echo "3. Execute: ./install-frontend-ubuntu-vps.sh (para configurar SSL)"
    echo "4. Acesse o frontend em: http://$(curl -s ifconfig.me):3000"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "- Ver logs: docker-compose logs -f"
    echo "- Reiniciar: docker-compose restart"
    echo "- Parar: docker-compose down"
    echo "- Monitoramento: /usr/local/bin/tsel-monitor.sh"
    echo ""
}

# Executar função principal
main "$@"
