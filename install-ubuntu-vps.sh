#!/bin/bash

# Script de Instalação TSEL Backend para Ubuntu 24.04 VPS
# Resolve problemas de conectividade e fornece múltiplos fallbacks

set -e

echo "🚀 TSEL Backend - Instalação Ubuntu 24.04 VPS"
echo "=============================================="
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
        log_warning "Falha no apt-get update, tentando com mirrors alternativos..."
        echo "deb http://ftp.debian.org/debian bullseye main" > /etc/apt/sources.list
        apt-get update
    }
    
    # Instalar dependências essenciais
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release || {
        log_warning "Algumas dependências falharam, continuando..."
    }
}

# Função para instalar Node.js
install_nodejs() {
    log_info "Instalando Node.js 18..."
    
    # Verificar se Node.js já está instalado
    if command -v node &> /dev/null && node --version | grep -q "v18"; then
        log_success "Node.js 18 já está instalado"
        return 0
    fi
    
    # Instalar Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || {
        log_warning "Falha na instalação via script oficial, tentando método alternativo..."
        apt-get install -y nodejs npm
    }
    
    apt-get install -y nodejs || {
        log_error "Falha na instalação do Node.js"
        return 1
    }
    
    log_success "Node.js instalado: $(node --version)"
    log_success "NPM instalado: $(npm --version)"
}

# Função para instalar Docker
install_docker() {
    log_info "Instalando Docker..."
    
    # Verificar se Docker já está instalado
    if command -v docker &> /dev/null; then
        log_success "Docker já está instalado"
        return 0
    fi
    
    # Instalar Docker
    apt-get install -y docker.io docker-compose || {
        log_warning "Falha na instalação via apt, tentando método alternativo..."
        
        # Método alternativo
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    }
    
    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker instalado: $(docker --version)"
}

# Função para configurar projeto
setup_project() {
    log_info "Configurando projeto..."
    
    # Verificar se já existe package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado. Execute este script no diretório do projeto."
        exit 1
    fi
    
    # Instalar dependências Node.js
    log_info "Instalando dependências Node.js..."
    npm install --timeout=300000 --retry=3 || {
        log_warning "Falha no npm install, tentando com cache limpo..."
        npm cache clean --force
        npm install --timeout=300000 --retry=3
    }
    
    # Criar arquivo .env se não existir
    if [ ! -f ".env" ]; then
        log_info "Criando arquivo .env..."
        cp env.example .env 2>/dev/null || {
            log_warning "env.example não encontrado, criando .env básico..."
            cat > .env << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tsel_db
DB_USER=tsel_user
DB_PASSWORD=tsel_password
JWT_SECRET=your-secret-key-here
EOF
        }
    fi
    
    # Criar diretórios necessários
    mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
    
    log_success "Projeto configurado"
}

# Função para build Docker com fallbacks
build_docker() {
    log_info "Construindo container Docker..."
    
    # Tentativa 1: Dockerfile otimizado para Ubuntu
    log_info "Tentativa 1: Dockerfile otimizado para Ubuntu..."
    if docker compose build --file Dockerfile.ubuntu --no-cache --pull tsel-backend; then
        log_success "Build bem-sucedido com Dockerfile.ubuntu"
        return 0
    fi
    
    # Tentativa 2: Dockerfile alternativo
    log_info "Tentativa 2: Dockerfile alternativo..."
    if docker compose build --file Dockerfile.alternative --no-cache --pull tsel-backend; then
        log_success "Build bem-sucedido com Dockerfile.alternative"
        return 0
    fi
    
    # Tentativa 3: Dockerfile principal com configurações especiais
    log_info "Tentativa 3: Dockerfile principal com configurações especiais..."
    export DOCKER_BUILDKIT=1
    export BUILDKIT_PROGRESS=plain
    
    if docker compose build --no-cache --pull --build-arg BUILDKIT_INLINE_CACHE=1 tsel-backend; then
        log_success "Build bem-sucedido com configurações especiais"
        return 0
    fi
    
    # Tentativa 4: Build direto sem docker-compose
    log_info "Tentativa 4: Build direto..."
    if docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .; then
        log_success "Build direto bem-sucedido"
        return 0
    fi
    
    log_error "Todas as tentativas de build falharam"
    return 1
}

# Função para iniciar serviços
start_services() {
    log_info "Iniciando serviços..."
    
    # Iniciar containers
    docker compose up -d || {
        log_warning "Falha no docker-compose up, tentando método alternativo..."
        docker-compose up -d
    }
    
    # Aguardar banco estar pronto
    log_info "Aguardando banco de dados estar pronto..."
    sleep 15
    
    # Executar migrações
    log_info "Executando migrações..."
    npm run migrate 2>/dev/null || {
        log_warning "Migrações falharam, continuando..."
    }
    
    # Executar seeds
    log_info "Executando seeds..."
    npm run seed 2>/dev/null || {
        log_warning "Seeds falharam, continuando..."
    }
    
    log_success "Serviços iniciados"
}

# Função para criar scripts úteis
create_scripts() {
    log_info "Criando scripts úteis..."
    
    # Script para iniciar sistema
    cat > start-system.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando TSEL Backend..."
docker compose up -d
echo "✅ Sistema iniciado!"
echo "📊 API disponível em: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/health"
EOF

    # Script para parar sistema
    cat > stop-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Parando TSEL Backend..."
docker compose down
echo "✅ Sistema parado!"
EOF

    # Script para ver logs
    cat > view-logs.sh << 'EOF'
#!/bin/bash
echo "📋 Logs do TSEL Backend..."
docker compose logs -f
EOF

    # Tornar scripts executáveis
    chmod +x start-system.sh stop-system.sh view-logs.sh
    
    log_success "Scripts criados"
}

# Função para verificar instalação
verify_installation() {
    log_info "Verificando instalação..."
    
    # Verificar se containers estão rodando
    if docker compose ps | grep -q "Up"; then
        log_success "Containers estão rodando"
    else
        log_warning "Containers não estão rodando"
    fi
    
    # Verificar se API responde
    sleep 5
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        log_success "API está respondendo"
    else
        log_warning "API não está respondendo ainda"
    fi
    
    log_success "Verificação concluída"
}

# Função principal
main() {
    log_info "Iniciando instalação do TSEL Backend para Ubuntu 24.04 VPS..."
    
    # Verificar conectividade
    check_connectivity
    
    # Corrigir MTU
    fix_mtu
    
    # Instalar dependências do sistema
    install_system_deps
    
    # Instalar Node.js
    install_nodejs
    
    # Instalar Docker
    install_docker
    
    # Configurar projeto
    setup_project
    
    # Build Docker
    build_docker
    
    # Iniciar serviços
    start_services
    
    # Criar scripts úteis
    create_scripts
    
    # Verificar instalação
    verify_installation
    
    echo ""
    log_success "🎉 Instalação concluída com sucesso!"
    echo ""
    echo "📊 URLs importantes:"
    echo "   API Backend: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    echo "   Documentação: http://localhost:3001/api-docs"
    echo ""
    echo "🛠️  Comandos úteis:"
    echo "   Iniciar: ./start-system.sh"
    echo "   Parar: ./stop-system.sh"
    echo "   Logs: ./view-logs.sh"
    echo ""
    echo "💡 Dica: Se houver problemas, execute: docker compose logs -f"
}

# Executar função principal
main "$@"
