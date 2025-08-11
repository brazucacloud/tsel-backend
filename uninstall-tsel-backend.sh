#!/bin/bash

# 🗑️ TSEL Backend - Desinstalador
# Versão: 1.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

# Banner
echo -e "${RED}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🗑️ TSEL BACKEND                           ║
║                   Desinstalador                               ║
║                                                              ║
║  ⚠️  ATENÇÃO: Esta ação irá remover completamente o sistema  ║
║     incluindo todos os dados do banco de dados!             ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

# Confirmar desinstalação
echo -e "${YELLOW}⚠️  ATENÇÃO: Esta ação irá remover completamente o TSEL Backend!${NC}"
echo -e "${YELLOW}   - Todos os containers serão parados e removidos${NC}"
echo -e "${YELLOW}   - Todos os volumes serão removidos (dados perdidos!)${NC}"
echo -e "${YELLOW}   - Todos os arquivos do projeto serão removidos${NC}"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [[ "$confirm" != "SIM" ]]; then
    log "Desinstalação cancelada pelo usuário"
    exit 0
fi

PROJECT_DIR="/opt/tsel-backend"

log "Iniciando desinstalação do TSEL Backend..."

# 1. Parar e remover containers
log "Parando containers..."
cd $PROJECT_DIR 2>/dev/null && docker compose down --volumes --remove-orphans 2>/dev/null || true

# 2. Remover volumes
log "Removendo volumes..."
docker volume rm tsel-backend_postgres_data 2>/dev/null || true
docker volume rm tsel-backend_redis_data 2>/dev/null || true

# 3. Remover imagens
log "Removendo imagens..."
docker rmi tsel-backend-tsel-backend 2>/dev/null || true

# 4. Desabilitar e remover serviço systemd
log "Removendo serviço systemd..."
systemctl stop tsel-backend 2>/dev/null || true
systemctl disable tsel-backend 2>/dev/null || true
rm -f /etc/systemd/system/tsel-backend.service
systemctl daemon-reload

# 5. Remover script de gerenciamento
log "Removendo script de gerenciamento..."
rm -f /usr/local/bin/tsel-backend

# 6. Remover diretório do projeto
log "Removendo diretório do projeto..."
rm -rf $PROJECT_DIR

# 7. Limpar redes Docker não utilizadas
log "Limpando redes Docker..."
docker network prune -f

# 8. Mostrar conclusão
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    ✅ DESINSTALAÇÃO CONCLUÍDA!               ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "TSEL Backend foi completamente removido do sistema!"
log "Todos os dados foram perdidos."
log ""

echo -e "${BLUE}📋 O que foi removido:${NC}"
echo "  ✅ Containers Docker"
echo "  ✅ Volumes de dados"
echo "  ✅ Imagens Docker"
echo "  ✅ Serviço systemd"
echo "  ✅ Script de gerenciamento"
echo "  ✅ Diretório do projeto"
echo ""

warning "Se você quiser reinstalar, execute: sudo bash install-tsel-backend.sh"
