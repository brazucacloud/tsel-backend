#!/bin/bash

# Script para configurar Docker com MTU 1420
# Interface de rede já está com MTU 1442 (OK)

echo "🔧 Configurando Docker com MTU 1420"
echo "==================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
if [[ $EUID -ne 0 ]]; then
    log_error "Este script deve ser executado como root"
    log_info "Execute: sudo $0"
    exit 1
fi

# Verificar MTU da interface
check_interface_mtu() {
    log_info "Verificando MTU da interface de rede..."
    
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    CURRENT_MTU=$(ip link show $INTERFACE | grep mtu | awk '{print $5}' 2>/dev/null)
    
    log_info "Interface: $INTERFACE"
    log_info "MTU atual: $CURRENT_MTU"
    
    if [ "$CURRENT_MTU" = "1442" ] || [ "$CURRENT_MTU" = "1420" ]; then
        log_success "MTU da interface está correto ($CURRENT_MTU)"
        return 0
    else
        log_warning "MTU da interface pode precisar de ajuste ($CURRENT_MTU)"
        return 1
    fi
}

# Configurar Docker com MTU 1420
configure_docker_mtu() {
    log_info "Configurando Docker com MTU 1420..."
    
    # Criar diretório se não existir
    mkdir -p /etc/docker
    
    # Backup do arquivo existente
    DOCKER_DAEMON="/etc/docker/daemon.json"
    if [ -f "$DOCKER_DAEMON" ]; then
        cp "$DOCKER_DAEMON" "${DOCKER_DAEMON}.backup"
        log_info "Backup criado: ${DOCKER_DAEMON}.backup"
    fi
    
    # Configurar Docker com MTU 1420
    cat > "$DOCKER_DAEMON" << EOF
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
EOF
    
    if [ $? -eq 0 ]; then
        log_success "Configuração do Docker criada"
    else
        log_error "Falha ao criar configuração do Docker"
        return 1
    fi
}

# Reiniciar Docker
restart_docker() {
    log_info "Reiniciando Docker..."
    
    if systemctl is-active --quiet docker; then
        systemctl restart docker
        
        if [ $? -eq 0 ]; then
            log_success "Docker reiniciado com sucesso"
        else
            log_error "Falha ao reiniciar Docker"
            return 1
        fi
    else
        log_warning "Docker não está rodando, iniciando..."
        systemctl start docker
        
        if [ $? -eq 0 ]; then
            log_success "Docker iniciado com sucesso"
        else
            log_error "Falha ao iniciar Docker"
            return 1
        fi
    fi
}

# Verificar configuração do Docker
verify_docker_config() {
    log_info "Verificando configuração do Docker..."
    
    # Aguardar Docker estar pronto
    sleep 3
    
    # Verificar se Docker está rodando
    if systemctl is-active --quiet docker; then
        log_success "Docker está rodando"
    else
        log_error "Docker não está rodando"
        return 1
    fi
    
    # Verificar configuração
    if docker info | grep -q "MTU: 1420"; then
        log_success "Docker configurado com MTU 1420"
    else
        log_warning "MTU do Docker pode não estar aplicado corretamente"
        docker info | grep -i mtu || log_info "MTU não encontrado na configuração"
    fi
}

# Testar conectividade do Docker
test_docker_connectivity() {
    log_info "Testando conectividade do Docker..."
    
    # Teste básico
    if docker run --rm alpine:latest ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_success "Conectividade básica do Docker OK"
    else
        log_warning "Problemas de conectividade básica do Docker"
    fi
    
    # Teste de download
    if docker run --rm alpine:latest wget -q --timeout=10 -O- https://deb.debian.org >/dev/null 2>&1; then
        log_success "Acesso aos repositórios Debian via Docker OK"
    else
        log_warning "Problemas de acesso aos repositórios Debian via Docker"
    fi
}

# Função principal
main() {
    log_info "Iniciando configuração do Docker com MTU 1420..."
    
    # Verificar MTU da interface
    check_interface_mtu
    
    # Configurar Docker
    configure_docker_mtu
    
    # Reiniciar Docker
    restart_docker
    
    # Verificar configuração
    verify_docker_config
    
    # Testar conectividade
    test_docker_connectivity
    
    echo ""
    log_success "🎉 Docker configurado com MTU 1420!"
    echo ""
    log_info "Agora você pode tentar o build do Docker:"
    echo "  docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend ."
    echo ""
    log_info "Ou usar o script de build:"
    echo "  ./build-ubuntu-vps.sh"
    echo ""
    log_info "Ou solução rápida:"
    echo "  ./quick-fix-ubuntu-vps.sh"
}

# Executar função principal
main "$@"
