#!/bin/bash

# Script NUCLEAR para forçar reconstrução completa do Docker
# Este script DESTRÓI TUDO e reconstrói do zero

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log "💥 INICIANDO RECONSTRUÇÃO NUCLEAR - DESTRUINDO TUDO!"

# 1. PARAR TUDO
log "🛑 Parando TODOS os containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker compose down 2>/dev/null || true

# 2. REMOVER TODOS OS CONTAINERS
log "🗑️ Removendo TODOS os containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# 3. REMOVER TODAS AS IMAGENS
log "🗑️ Removendo TODAS as imagens..."
docker rmi -f $(docker images -aq) 2>/dev/null || true

# 4. REMOVER TODOS OS VOLUMES
log "🗑️ Removendo TODOS os volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# 5. REMOVER TODAS AS REDES
log "🗑️ Removendo TODAS as redes..."
docker network rm $(docker network ls -q) 2>/dev/null || true

# 6. LIMPAR CACHE COMPLETAMENTE
log "🧹 Limpando cache do Docker COMPLETAMENTE..."
docker system prune -a -f --volumes

# 7. REMOVER ARQUIVOS DE CACHE DO DOCKER
log "🗑️ Removendo arquivos de cache do Docker..."
sudo rm -rf /var/lib/docker/tmp/* 2>/dev/null || true
sudo rm -rf /var/lib/docker/overlay2/* 2>/dev/null || true

# 8. VERIFICAR SE ESTÁ NO DIRETÓRIO CORRETO
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto (onde está o package.json)"
fi

# 9. VERIFICAR DOCKERFILE
log "🔍 Verificando Dockerfile..."
if grep -q "alpine" Dockerfile; then
    error "Dockerfile ainda contém referências ao Alpine!"
fi

if ! grep -q "node:18-bullseye" Dockerfile; then
    error "Dockerfile não está usando node:18-bullseye!"
fi

log "✅ Dockerfile está correto (usando Debian)"

# 10. CONSTRUIR SEM CACHE E PULL
log "🔨 Construindo SEM CACHE e PULL..."
docker compose build --no-cache --pull --force-rm

# 11. VERIFICAR IMAGEM CONSTRUÍDA
log "🔍 Verificando imagem construída..."
docker images | grep tsel-backend

# 12. INICIAR CONTAINERS
log "🚀 Iniciando containers..."
docker compose up -d

# 13. AGUARDAR E VERIFICAR
log "⏳ Aguardando containers..."
sleep 10

# 14. VERIFICAR SE ESTÁ USANDO DEBIAN
log "🔍 Verificando sistema operacional..."
if docker compose exec -T backend cat /etc/os-release | grep -q "Debian"; then
    log "✅ SUCESSO! Container usando Debian"
else
    error "❌ FALHA! Container ainda usando Alpine"
fi

# 15. STATUS FINAL
log "📊 Status final dos containers:"
docker compose ps

log "🎉 RECONSTRUÇÃO NUCLEAR CONCLUÍDA!"
log "✅ Alpine foi ELIMINADO!"
log "✅ Debian está sendo usado!"
log "✅ Sistema pronto para uso!"
