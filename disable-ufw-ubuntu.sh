#!/bin/bash

# Script para desabilitar UFW no Ubuntu 24.04 com Docker Compose
# ⚠️  ATENÇÃO: Desabilita o firewall - use apenas em ambientes controlados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Script para desabilitar UFW no Ubuntu 24.04${NC}"
echo -e "${YELLOW}⚠️  ATENÇÃO: Este script vai desabilitar o firewall UFW${NC}"
echo ""

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script deve ser executado como root (sudo)${NC}"
   exit 1
fi

# Verificar se é Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo -e "${RED}❌ Este script é específico para Ubuntu${NC}"
    exit 1
fi

# Verificar se UFW está instalado
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}⚠️  UFW não está instalado. Nada a fazer.${NC}"
    exit 0
fi

# Verificar status atual do UFW
echo -e "${BLUE}📊 Status atual do UFW:${NC}"
ufw status

echo ""
echo -e "${YELLOW}🤔 Deseja continuar e desabilitar o UFW? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}🛑 Desabilitando UFW...${NC}"
    
    # Desabilitar UFW
    ufw --force disable
    
    # Verificar se foi desabilitado
    if ufw status | grep -q "Status: inactive"; then
        echo -e "${GREEN}✅ UFW desabilitado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao desabilitar UFW${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}📋 Status final do UFW:${NC}"
    ufw status
    
    echo ""
    echo -e "${GREEN}🎯 UFW desabilitado! Agora você pode usar Docker Compose sem problemas de firewall.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Dicas:${NC}"
    echo "   - Docker Compose agora deve funcionar normalmente"
    echo "   - Se precisar reabilitar: sudo ufw enable"
    echo "   - Para ver status: sudo ufw status"
    echo ""
    echo -e "${BLUE}🚀 Próximo passo: Execute o script de instalação do frontend${NC}"
    echo "   sudo ./install-frontend-ubuntu-vps.sh"
    
else
    echo -e "${YELLOW}❌ Operação cancelada pelo usuário${NC}"
    exit 0
fi
