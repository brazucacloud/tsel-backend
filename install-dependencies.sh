#!/bin/bash

# TSEL Backend - Script de Instalação de Dependências para Linux
# Versão: 2.0.0
# Autor: TSEL Team
# Compatível: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║            TSEL DEPENDENCIES INSTALLER (Linux)               ║
║                                                              ║
║  Instalando dependências do sistema para TSEL Backend       ║
║                                                              ║
║  Compatível: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+  ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root!"
   exit 1
fi

# Detectar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
            ID=$ID
            ID_LIKE=$ID_LIKE
        else
            error "Não foi possível detectar o sistema operacional"
            exit 1
        fi
    else
        error "Sistema operacional não suportado: $OSTYPE"
        exit 1
    fi
    
    # Verificar compatibilidade
    case $ID in
        ubuntu)
            if [[ $(echo "$VER >= 20.04" | bc -l) -eq 0 ]]; then
                error "Ubuntu 20.04 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        debian)
            if [[ $(echo "$VER >= 11" | bc -l) -eq 0 ]]; then
                error "Debian 11 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        centos|rhel|rocky|almalinux)
            if [[ $(echo "$VER >= 8" | bc -l) -eq 0 ]]; then
                error "CentOS/RHEL 8 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        *)
            warn "Sistema operacional não testado: $OS $VER"
            ;;
    esac
    
    success "Sistema detectado: $OS $VER"
}

# Instalar dependências Ubuntu/Debian
install_ubuntu_debian() {
    log "Instalando dependências para Ubuntu/Debian..."
    
    # Atualizar repositórios
    sudo apt update
    
    # Instalar dependências básicas
    sudo apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential python3
    
    # Instalar Node.js 18.x
    log "Instalando Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verificar instalação do Node.js
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    success "Node.js $NODE_VERSION e npm $NPM_VERSION instalados"
    
    # Instalar Docker
    log "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    # Verificar instalação do Docker
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    success "Docker $DOCKER_VERSION instalado"
    
    # Instalar Docker Compose
    log "Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verificar instalação do Docker Compose
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    success "Docker Compose $COMPOSE_VERSION instalado"
    
    # Instalar Nginx (opcional)
    read -p "Deseja instalar Nginx? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt install -y nginx
        success "Nginx instalado"
    fi
    
    # Instalar PM2 (opcional)
    read -p "Deseja instalar PM2 globalmente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        success "PM2 instalado globalmente"
    fi
    
    success "Todas as dependências foram instaladas com sucesso!"
}

# Instalar dependências CentOS/RHEL/Fedora
install_centos_rhel_fedora() {
    log "Instalando dependências para CentOS/RHEL/Fedora..."
    
    # Detectar gerenciador de pacotes
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    else
        error "Gerenciador de pacotes não suportado"
        exit 1
    fi
    
    # Atualizar sistema
    sudo $PKG_MANAGER update -y
    
    # Instalar dependências básicas
    sudo $PKG_MANAGER install -y curl wget git gcc gcc-c++ make python3
    
    # Instalar Node.js 18.x
    log "Instalando Node.js 18.x..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo $PKG_MANAGER install -y nodejs
    
    # Verificar instalação do Node.js
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    success "Node.js $NODE_VERSION e npm $NPM_VERSION instalados"
    
    # Instalar Docker
    log "Instalando Docker..."
    sudo $PKG_MANAGER install -y docker docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    
    # Verificar instalação do Docker
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    success "Docker $DOCKER_VERSION instalado"
    
    # Instalar Nginx (opcional)
    read -p "Deseja instalar Nginx? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo $PKG_MANAGER install -y nginx
        sudo systemctl enable nginx
        success "Nginx instalado"
    fi
    
    # Instalar PM2 (opcional)
    read -p "Deseja instalar PM2 globalmente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        success "PM2 instalado globalmente"
    fi
    
    success "Todas as dependências foram instaladas com sucesso!"
}

# Instalar dependências Arch Linux
install_arch() {
    log "Instalando dependências para Arch Linux..."
    
    # Atualizar sistema
    sudo pacman -Syu --noconfirm
    
    # Instalar dependências básicas
    sudo pacman -S --noconfirm curl wget git base-devel python3
    
    # Instalar Node.js
    log "Instalando Node.js..."
    sudo pacman -S --noconfirm nodejs npm
    
    # Verificar instalação do Node.js
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    success "Node.js $NODE_VERSION e npm $NPM_VERSION instalados"
    
    # Instalar Docker
    log "Instalando Docker..."
    sudo pacman -S --noconfirm docker docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    
    # Verificar instalação do Docker
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    success "Docker $DOCKER_VERSION instalado"
    
    # Instalar Nginx (opcional)
    read -p "Deseja instalar Nginx? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo pacman -S --noconfirm nginx
        sudo systemctl enable nginx
        success "Nginx instalado"
    fi
    
    # Instalar PM2 (opcional)
    read -p "Deseja instalar PM2 globalmente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        success "PM2 instalado globalmente"
    fi
    
    success "Todas as dependências foram instaladas com sucesso!"
}

# Verificar instalações
verify_installations() {
    log "Verificando instalações..."
    
    local errors=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        errors+=("Node.js não encontrado")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            errors+=("Node.js versão $NODE_VERSION é muito antiga. Necessário 18.x+")
        else
            success "Node.js $NODE_VERSION ✓"
        fi
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        errors+=("npm não encontrado")
    else
        success "npm $(npm --version) ✓"
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        errors+=("Docker não encontrado")
    else
        success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        errors+=("Docker Compose não encontrado")
    else
        success "Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        errors+=("Git não encontrado")
    else
        success "Git $(git --version | cut -d' ' -f3) ✓"
    fi
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        errors+=("curl não encontrado")
    else
        success "curl ✓"
    fi
    
    # Verificar wget
    if ! command -v wget &> /dev/null; then
        errors+=("wget não encontrado")
    else
        success "wget ✓"
    fi
    
    if [ ${#errors[@]} -ne 0 ]; then
        error "Problemas encontrados:"
        for err in "${errors[@]}"; do
            echo "  - $err"
        done
        return 1
    else
        success "Todas as verificações passaram!"
        return 0
    fi
}

# Mostrar informações finais
show_final_info() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              INSTALAÇÃO DE DEPENDÊNCIAS CONCLUÍDA!           ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    success "Dependências do sistema instaladas com sucesso!"
    
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "  1. Faça logout e login novamente para aplicar as mudanças do Docker"
    echo "  2. Execute o script de instalação principal: ./install.sh"
    echo "  3. Ou clone o repositório e execute: git clone <url> && cd tsel-backend && ./install.sh"
    
    echo -e "${YELLOW}⚠️  Importante:${NC}"
    echo "  • Você precisa fazer logout e login para que o usuário seja adicionado ao grupo docker"
    echo "  • Ou execute: newgrp docker"
    
    echo -e "${GREEN}🎉 Sistema pronto para instalar o TSEL Backend!${NC}"
}

# Função principal
main() {
    log "Iniciando instalação de dependências..."
    
    # Detectar sistema operacional
    detect_os
    
    # Instalar dependências baseado no sistema
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            install_ubuntu_debian
            ;;
        *"CentOS"*|*"Red Hat"*|*"Fedora"*)
            install_centos_rhel_fedora
            ;;
        *"Arch"*)
            install_arch
            ;;
        *)
            error "Sistema operacional não suportado: $OS"
            echo "Sistemas suportados: Ubuntu, Debian, CentOS, RHEL, Fedora, Arch Linux"
            exit 1
            ;;
    esac
    
    # Verificar instalações
    if verify_installations; then
        show_final_info
    else
        error "Algumas dependências não foram instaladas corretamente"
        exit 1
    fi
}

# Executar função principal
main "$@"
