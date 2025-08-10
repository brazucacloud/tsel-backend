#!/bin/bash

# TSEL Backend - Corrigir Permissões do Docker
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
║              TSEL BACKEND - CORRIGIR DOCKER                  ║
║                Chip Warmup para WhatsApp                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Funções
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Verificar se é root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "Este script não deve ser executado como root!"
        exit 1
    fi
}

# Verificar se Docker está instalado
check_docker_installed() {
    log "Verificando se Docker está instalado..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado!"
        info "Execute: ./install-dependencies.sh"
        exit 1
    fi
    
    success "Docker está instalado"
}

# Verificar se Docker está rodando
check_docker_running() {
    log "Verificando se Docker está rodando..."
    
    if ! docker info &> /dev/null; then
        error "Docker não está rodando!"
        info "Iniciando Docker..."
        sudo systemctl start docker
        sudo systemctl enable docker
        sleep 3
        
        if docker info &> /dev/null; then
            success "Docker iniciado com sucesso"
        else
            error "Falha ao iniciar Docker"
            exit 1
        fi
    else
        success "Docker está rodando"
    fi
}

# Verificar permissões do usuário
check_user_permissions() {
    log "Verificando permissões do usuário..."
    
    if groups $USER | grep -q docker; then
        success "Usuário já está no grupo docker"
    else
        warn "Usuário não está no grupo docker"
        log "Adicionando usuário ao grupo docker..."
        sudo usermod -aG docker $USER
        success "Usuário adicionado ao grupo docker"
    fi
}

# Testar permissões do Docker
test_docker_permissions() {
    log "Testando permissões do Docker..."
    
    if docker ps &> /dev/null; then
        success "Permissões do Docker OK"
    else
        error "Permissões do Docker ainda não funcionam"
        warn "Você precisa fazer logout e login novamente"
        warn "Ou execute: newgrp docker"
        
        read -p "Deseja tentar recarregar os grupos agora? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Recarregando grupos..."
            newgrp docker
            
            if docker ps &> /dev/null; then
                success "Permissões do Docker funcionando agora!"
            else
                error "Ainda não funcionou. Faça logout e login novamente."
            fi
        fi
    fi
}

# Testar Docker Compose
test_docker_compose() {
    log "Testando Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado!"
        exit 1
    fi
    
    if docker-compose --version &> /dev/null; then
        success "Docker Compose OK"
    else
        error "Docker Compose não está funcionando"
        exit 1
    fi
}

# Testar containers do projeto
test_project_containers() {
    log "Testando containers do projeto..."
    
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml não encontrado!"
        error "Execute este script no diretório do projeto TSEL Backend"
        exit 1
    fi
    
    # Testar se consegue fazer pull das imagens
    log "Baixando imagens Docker..."
    docker-compose pull postgres redis
    
    if [ $? -eq 0 ]; then
        success "Imagens Docker baixadas com sucesso"
    else
        error "Falha ao baixar imagens Docker"
        exit 1
    fi
}

# Função principal
main() {
    echo -e "${BLUE}Iniciando correção de permissões do Docker...${NC}\n"
    
    check_root
    check_docker_installed
    check_docker_running
    check_user_permissions
    test_docker_permissions
    test_docker_compose
    test_project_containers
    
    echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Permissões do Docker corrigidas!${NC}"
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "  • Execute: ./quick-install.sh"
    echo "  • Ou execute: ./install.sh"
    echo ""
    echo -e "${YELLOW}⚠️  Se ainda tiver problemas:${NC}"
    echo "  • Faça logout e login novamente"
    echo "  • Ou execute: newgrp docker"
    echo "  • Ou reinicie o sistema"
}

# Executar correção
main
