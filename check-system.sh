#!/bin/bash

# TSEL Backend - Verificação de Sistema
# Versão: 1.0.0
# Autor: TSEL Team

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              TSEL BACKEND - VERIFICAÇÃO DE SISTEMA          ║
║                Chip Warmup para WhatsApp                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Variáveis
SYSTEM_OK=true
WARNINGS=()
ERRORS=()

# Funções
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
    WARNINGS+=("$1")
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    ERRORS+=("$1")
    SYSTEM_OK=false
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Verificar sistema operacional
check_os() {
    log "Verificando sistema operacional..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
            ID=$ID
            
            success "Sistema: $OS $VER"
            
            # Verificar compatibilidade
            case $ID in
                ubuntu)
                    if [[ $(echo "$VER >= 20.04" | bc -l 2>/dev/null) -eq 0 ]]; then
                        error "Ubuntu 20.04+ necessário. Versão atual: $VER"
                    else
                        success "Versão Ubuntu compatível"
                    fi
                    ;;
                debian)
                    if [[ $(echo "$VER >= 11" | bc -l 2>/dev/null) -eq 0 ]]; then
                        error "Debian 11+ necessário. Versão atual: $VER"
                    else
                        success "Versão Debian compatível"
                    fi
                    ;;
                centos|rhel|rocky|almalinux)
                    if [[ $(echo "$VER >= 8" | bc -l 2>/dev/null) -eq 0 ]]; then
                        error "CentOS/RHEL 8+ necessário. Versão atual: $VER"
                    else
                        success "Versão CentOS/RHEL compatível"
                    fi
                    ;;
                *)
                    warn "Sistema operacional não testado: $OS $VER"
                    ;;
            esac
        else
            error "Não foi possível detectar o sistema operacional"
        fi
    else
        error "Sistema operacional não suportado: $OSTYPE"
    fi
}

# Verificar arquitetura
check_architecture() {
    log "Verificando arquitetura..."
    
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            success "Arquitetura: $ARCH (64-bit)"
            ;;
        aarch64|arm64)
            success "Arquitetura: $ARCH (ARM64)"
            ;;
        *)
            error "Arquitetura não suportada: $ARCH"
            ;;
    esac
}

# Verificar memória RAM
check_memory() {
    log "Verificando memória RAM..."
    
    if command -v free &> /dev/null; then
        TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
        AVAILABLE_RAM=$(free -m | awk 'NR==2{printf "%.0f", $7/1024}')
        
        info "RAM Total: ${TOTAL_RAM}GB"
        info "RAM Disponível: ${AVAILABLE_RAM}GB"
        
        if [ "$TOTAL_RAM" -lt 2 ]; then
            error "Mínimo 2GB RAM necessário. Total: ${TOTAL_RAM}GB"
        elif [ "$TOTAL_RAM" -lt 4 ]; then
            warn "Recomendado 4GB RAM. Total: ${TOTAL_RAM}GB"
        else
            success "RAM suficiente: ${TOTAL_RAM}GB"
        fi
    else
        warn "Não foi possível verificar a memória RAM"
    fi
}

# Verificar espaço em disco
check_disk() {
    log "Verificando espaço em disco..."
    
    if command -v df &> /dev/null; then
        AVAILABLE_DISK=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
        
        info "Espaço disponível: ${AVAILABLE_DISK}GB"
        
        if [ "$AVAILABLE_DISK" -lt 10 ]; then
            error "Mínimo 10GB necessário. Disponível: ${AVAILABLE_DISK}GB"
        else
            success "Espaço em disco suficiente: ${AVAILABLE_DISK}GB"
        fi
    else
        warn "Não foi possível verificar o espaço em disco"
    fi
}

# Verificar conectividade de internet
check_internet() {
    log "Verificando conectividade de internet..."
    
    if command -v curl &> /dev/null; then
        if curl -s --connect-timeout 5 https://www.google.com > /dev/null; then
            success "Conectividade de internet OK"
        else
            error "Sem conectividade de internet"
        fi
    elif command -v wget &> /dev/null; then
        if wget -q --spider --timeout=5 https://www.google.com; then
            success "Conectividade de internet OK"
        else
            error "Sem conectividade de internet"
        fi
    else
        warn "Não foi possível verificar conectividade de internet"
    fi
}

# Verificar dependências do sistema
check_system_dependencies() {
    log "Verificando dependências do sistema..."
    
    local deps=("curl" "wget" "git" "bc")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if command -v "$dep" &> /dev/null; then
            success "$dep: OK"
        else
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        warn "Dependências faltando: ${missing[*]}"
        info "Execute: sudo apt install ${missing[*]}"
    fi
}

# Verificar Node.js
check_nodejs() {
    log "Verificando Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        info "Node.js versão: $NODE_VERSION"
        
        if [ "$NODE_MAJOR" -lt 18 ]; then
            error "Node.js 18.x+ necessário. Versão atual: $NODE_VERSION"
        else
            success "Node.js versão compatível: $NODE_VERSION"
        fi
    else
        error "Node.js não instalado"
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm versão: $NPM_VERSION"
    else
        error "npm não instalado"
    fi
}

# Verificar Docker
check_docker() {
    log "Verificando Docker..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        success "Docker versão: $DOCKER_VERSION"
        
        # Verificar se Docker está rodando
        if docker info &> /dev/null; then
            success "Docker está rodando"
        else
            error "Docker não está rodando"
            info "Execute: sudo systemctl start docker"
        fi
    else
        error "Docker não instalado"
    fi
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        success "Docker Compose versão: $COMPOSE_VERSION"
    else
        error "Docker Compose não instalado"
    fi
}

# Verificar portas
check_ports() {
    log "Verificando portas..."
    
    local ports=(3001 5432 6379)
    local occupied=()
    
    for port in "${ports[@]}"; do
        if command -v netstat &> /dev/null; then
            if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
                occupied+=("$port")
            fi
        elif command -v ss &> /dev/null; then
            if ss -tlnp 2>/dev/null | grep -q ":$port "; then
                occupied+=("$port")
            fi
        fi
    done
    
    if [ ${#occupied[@]} -gt 0 ]; then
        warn "Portas ocupadas: ${occupied[*]}"
        info "Verifique se outros serviços estão usando essas portas"
    else
        success "Portas livres: 3001, 5432, 6379"
    fi
}

# Verificar permissões
check_permissions() {
    log "Verificando permissões..."
    
    # Verificar se usuário está no grupo docker
    if groups $USER | grep -q docker; then
        success "Usuário no grupo docker"
    else
        warn "Usuário não está no grupo docker"
        info "Execute: sudo usermod -aG docker $USER"
    fi
    
    # Verificar permissões de escrita no diretório atual
    if [ -w . ]; then
        success "Permissões de escrita no diretório atual"
    else
        error "Sem permissões de escrita no diretório atual"
    fi
}

# Verificar arquivos do projeto
check_project_files() {
    log "Verificando arquivos do projeto..."
    
    local required_files=("package.json" "server.js" "docker-compose.yml")
    local optional_files=("env.example" ".env")
    local missing=()
    local missing_optional=()
    
    # Verificar arquivos obrigatórios
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            success "$file: OK"
        else
            missing+=("$file")
        fi
    done
    
    # Verificar arquivos opcionais
    for file in "${optional_files[@]}"; do
        if [ -f "$file" ]; then
            success "$file: OK"
        else
            missing_optional+=("$file")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        error "Arquivos obrigatórios faltando: ${missing[*]}"
        info "Execute este script no diretório do projeto TSEL Backend"
    fi
    
    if [ ${#missing_optional[@]} -gt 0 ]; then
        warn "Arquivos opcionais faltando: ${missing_optional[*]}"
        info "Você pode copiar env.example para .env e configurar as variáveis"
    fi
}

# Verificar firewall
check_firewall() {
    log "Verificando firewall..."
    
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            warn "UFW ativo - verifique se as portas 3001, 80, 443 estão liberadas"
        else
            success "UFW inativo"
        fi
    elif command -v firewall-cmd &> /dev/null; then
        if firewall-cmd --state | grep -q "running"; then
            warn "firewalld ativo - verifique se as portas 3001, 80, 443 estão liberadas"
        else
            success "firewalld inativo"
        fi
    else
        info "Firewall não detectado"
    fi
}

# Função principal
main() {
    echo -e "${BLUE}Iniciando verificação de sistema...${NC}\n"
    
    check_os
    check_architecture
    check_memory
    check_disk
    check_internet
    check_system_dependencies
    check_nodejs
    check_docker
    check_ports
    check_permissions
    check_project_files
    check_firewall
    
    echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"
    
    if [ "$SYSTEM_OK" = true ]; then
        echo -e "${GREEN}🎉 Sistema pronto para instalar TSEL Backend!${NC}"
        echo -e "${GREEN}Execute: ./quick-install.sh (Ubuntu) ou ./install.sh (outros)${NC}"
    else
        echo -e "${RED}❌ Sistema não está pronto para instalação${NC}"
        echo -e "${YELLOW}Corrija os erros acima antes de continuar${NC}"
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Avisos:${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "  • $warning"
        done
    fi
    
    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo -e "\n${RED}❌ Erros:${NC}"
        for error in "${ERRORS[@]}"; do
            echo -e "  • $error"
        done
    fi
    
    echo -e "\n${BLUE}Para mais informações, consulte: INSTALL_LINUX.md${NC}"
}

# Executar verificação
main
