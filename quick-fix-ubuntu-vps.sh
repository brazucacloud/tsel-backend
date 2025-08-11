#!/bin/bash

# Quick Fix para Ubuntu 24.04 VPS - TSEL Backend
# Execute este script para resolver problemas de conectividade

echo "🔧 Quick Fix - Ubuntu 24.04 VPS"
echo "================================"

# Tornar scripts executáveis
chmod +x install-ubuntu-vps.sh build-ubuntu-vps.sh fix-mtu-ubuntu-vps.sh

# Corrigir MTU primeiro
echo "🔧 Corrigindo MTU para 1420..."
if [ -f "fix-mtu-ubuntu-vps.sh" ]; then
    chmod +x fix-mtu-ubuntu-vps.sh
    ./fix-mtu-ubuntu-vps.sh
fi

# Tentar build com Dockerfile otimizado
echo "🔄 Tentando build com Dockerfile otimizado..."
if docker compose build --file Dockerfile.ubuntu --no-cache --pull tsel-backend; then
    echo "✅ Build bem-sucedido!"
    echo "🚀 Iniciando serviços..."
    docker compose up -d
    echo "🎉 Sistema iniciado com sucesso!"
    echo "📊 API disponível em: http://localhost:3001"
    exit 0
fi

# Se falhar, tentar build direto
echo "🔄 Tentando build direto..."
if docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .; then
    echo "✅ Build direto bem-sucedido!"
    echo "🚀 Iniciando serviços..."
    docker compose up -d
    echo "🎉 Sistema iniciado com sucesso!"
    echo "📊 API disponível em: http://localhost:3001"
    exit 0
fi

# Se ainda falhar, executar script completo
echo "🔄 Executando instalação completa..."
./install-ubuntu-vps.sh
