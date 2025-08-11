#!/bin/bash

# Script para corrigir MTU no Ubuntu VPS
# Define MTU para 1420 para resolver problemas de conectividade

echo "🔧 Corrigindo MTU para 1420 - Ubuntu VPS"
echo "========================================"

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

# Função para verificar MTU atual
check_current_mtu() {
    log_info "Verificando MTU atual..."
    
    # Encontrar interface principal
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -z "$INTERFACE" ]; then
        log_error "Não foi possível identificar a interface de rede"
        return 1
    fi
    
    CURRENT_MTU=$(ip link show $INTERFACE | grep mtu | awk '{print $5}')
    log_info "Interface: $INTERFACE"
    log_info "MTU atual: $CURRENT_MTU"
    
    if [ "$CURRENT_MTU" = "1420" ]; then
        log_success "MTU já está configurado corretamente (1420)"
        return 0
    else
        log_warning "MTU precisa ser ajustado de $CURRENT_MTU para 1420"
        return 1
    fi
}

# Função para configurar MTU
configure_mtu() {
    log_info "Configurando MTU para 1420..."
    
    # Encontrar interface principal
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -z "$INTERFACE" ]; then
        log_error "Não foi possível identificar a interface de rede"
        return 1
    fi
    
    # Configurar MTU
    ip link set dev $INTERFACE mtu 1420
    
    if [ $? -eq 0 ]; then
        log_success "MTU configurado com sucesso para 1420"
        
        # Verificar se foi aplicado
        NEW_MTU=$(ip link show $INTERFACE | grep mtu | awk '{print $5}')
        if [ "$NEW_MTU" = "1420" ]; then
            log_success "MTU confirmado: $NEW_MTU"
        else
            log_warning "MTU não foi aplicado corretamente. Atual: $NEW_MTU"
        fi
    else
        log_error "Falha ao configurar MTU"
        return 1
    fi
}

# Função para configurar MTU permanentemente
configure_mtu_permanent() {
    log_info "Configurando MTU permanentemente..."
    
    # Encontrar interface principal
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    
    if [ -z "$INTERFACE" ]; then
        log_error "Não foi possível identificar a interface de rede"
        return 1
    fi
    
    # Criar arquivo de configuração Netplan
    NETPLAN_FILE="/etc/netplan/01-netcfg.yaml"
    
    # Backup do arquivo original
    if [ -f "$NETPLAN_FILE" ]; then
        cp "$NETPLAN_FILE" "${NETPLAN_FILE}.backup"
        log_info "Backup criado: ${NETPLAN_FILE}.backup"
    fi
    
    # Criar configuração Netplan com MTU
    cat > "$NETPLAN_FILE" << EOF
network:
  version: 2
  renderer: networkd
  ethernets:
    $INTERFACE:
      dhcp4: true
      mtu: 1420
EOF
    
    # Aplicar configuração
    netplan apply
    
    if [ $? -eq 0 ]; then
        log_success "MTU configurado permanentemente"
    else
        log_warning "Falha ao aplicar configuração Netplan"
        return 1
    fi
}

# Função para testar conectividade
test_connectivity() {
    log_info "Testando conectividade..."
    
    # Teste básico
    if ping -c 3 8.8.8.8 >/dev/null 2>&1; then
        log_success "Conectividade básica OK"
    else
        log_error "Problemas de conectividade básica"
        return 1
    fi
    
    # Teste específico para repositórios Debian
    if curl -s --connect-timeout 10 https://deb.debian.org >/dev/null 2>&1; then
        log_success "Acesso aos repositórios Debian OK"
    else
        log_warning "Ainda há problemas com repositórios Debian"
    fi
    
    # Teste de velocidade
    log_info "Testando velocidade de download..."
    SPEED=$(curl -s -w "%{speed_download}" -o /dev/null https://deb.debian.org/debian/dists/bullseye/InRelease)
    if [ ! -z "$SPEED" ]; then
        log_info "Velocidade de download: $SPEED bytes/s"
    fi
}

# Função para configurar Docker com MTU
configure_docker_mtu() {
    log_info "Configurando Docker com MTU 1420..."
    
    # Criar/atualizar daemon.json
    DOCKER_DAEMON="/etc/docker/daemon.json"
    
    # Backup
    if [ -f "$DOCKER_DAEMON" ]; then
        cp "$DOCKER_DAEMON" "${DOCKER_DAEMON}.backup"
    fi
    
    # Configurar Docker com MTU
    cat > "$DOCKER_DAEMON" << EOF
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
    
    # Reiniciar Docker
    systemctl restart docker
    
    if [ $? -eq 0 ]; then
        log_success "Docker configurado com MTU 1420"
    else
        log_warning "Falha ao reiniciar Docker"
    fi
}

# Função principal
main() {
    log_info "Iniciando correção de MTU para Ubuntu VPS..."
    
    # Verificar MTU atual
    if check_current_mtu; then
        log_success "MTU já está correto!"
    else
        # Configurar MTU temporariamente
        configure_mtu
        
        # Configurar MTU permanentemente
        configure_mtu_permanent
        
        # Configurar Docker
        configure_docker_mtu
    fi
    
    # Testar conectividade
    test_connectivity
    
    echo ""
    log_success "🎉 Correção de MTU concluída!"
    echo ""
    log_info "Agora você pode tentar o build do Docker novamente:"
    echo "  ./quick-fix-ubuntu-vps.sh"
    echo ""
    log_info "Ou build manual:"
    echo "  docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend ."
}

# Executar função principal
main "$@"
