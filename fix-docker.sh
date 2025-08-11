#!/bin/bash

# Script para corrigir Docker corrompido após limpeza nuclear
# Este script reinicia o Docker completamente

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

log "🔧 Corrigindo Docker corrompido..."

# 1. PARAR DOCKER
log "🛑 Parando Docker..."
sudo systemctl stop docker
sudo systemctl stop docker.socket

# 2. AGUARDAR
log "⏳ Aguardando Docker parar..."
sleep 5

# 3. LIMPAR DIRETÓRIOS CORROMPIDOS
log "🧹 Limpando diretórios corrompidos..."
sudo rm -rf /var/lib/docker/overlay2/*
sudo rm -rf /var/lib/docker/tmp/*
sudo rm -rf /var/lib/docker/containers/*
sudo rm -rf /var/lib/docker/image/*
sudo rm -rf /var/lib/docker/volumes/*
sudo rm -rf /var/lib/docker/network/*

# 4. REINICIAR DOCKER
log "🔄 Reiniciando Docker..."
sudo systemctl start docker

# 5. AGUARDAR DOCKER ESTAR PRONTO
log "⏳ Aguardando Docker estar pronto..."
sleep 10

# 6. VERIFICAR SE DOCKER ESTÁ FUNCIONANDO
log "🔍 Verificando Docker..."
if docker info > /dev/null 2>&1; then
    log "✅ Docker está funcionando!"
else
    error "❌ Docker ainda não está funcionando!"
fi

# 7. VERIFICAR SE ESTÁ NO DIRETÓRIO CORRETO
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto (onde está o package.json)"
fi

# 8. CONSTRUIR NOVAMENTE
log "🔨 Construindo containers..."
docker compose build --no-cache --pull

# 9. VERIFICAR SE ESTÁ USANDO DEBIAN
log "🔍 Verificando sistema operacional..."
docker compose up -d
sleep 10

if docker compose exec -T backend cat /etc/os-release | grep -q "Debian"; then
    log "✅ SUCESSO! Container usando Debian"
else
    error "❌ FALHA! Container ainda usando Alpine"
fi

# 10. STATUS FINAL
log "📊 Status final dos containers:"
docker compose ps

log "🎉 Docker corrigido e funcionando!"
log "✅ Alpine foi ELIMINADO!"
log "✅ Debian está sendo usado!"
log "✅ Sistema pronto para uso!"

