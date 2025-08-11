#!/bin/bash

# Script para forçar atualização e build
echo "🔄 Forçando atualização e build..."
echo "=================================="

# Forçar atualização do repositório
echo "📥 Forçando atualização do repositório..."
git fetch origin
git reset --hard origin/master

# Verificar se Dockerfile.ubuntu está correto
echo "🔍 Verificando Dockerfile.ubuntu..."
if grep -q "nameserver 8.8.8.8" Dockerfile.ubuntu; then
    echo "❌ Dockerfile ainda tem configuração DNS problemática"
    echo "🔄 Removendo configuração DNS..."
    sed -i '/nameserver 8.8.8.8/d' Dockerfile.ubuntu
    sed -i '/nameserver 8.8.4.4/d' Dockerfile.ubuntu
    sed -i '/Configurar DNS e resolver/d' Dockerfile.ubuntu
    echo "✅ Configuração DNS removida"
else
    echo "✅ Dockerfile está correto"
fi

# Tentar build
echo "🔨 Iniciando build..."
docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
    echo "🚀 Iniciando serviços..."
    docker compose up -d
    echo "🎉 Sistema iniciado com sucesso!"
    echo "📊 API disponível em: http://localhost:3001"
else
    echo "❌ Build falhou"
    echo "🔄 Tentando com docker-compose..."
    docker compose build --no-cache --pull tsel-backend
    
    if [ $? -eq 0 ]; then
        echo "✅ Build com docker-compose bem-sucedido!"
        echo "🚀 Iniciando serviços..."
        docker compose up -d
        echo "🎉 Sistema iniciado com sucesso!"
        echo "📊 API disponível em: http://localhost:3001"
    else
        echo "❌ Build falhou completamente"
        echo "Execute: ./build-ubuntu-vps.sh"
    fi
fi
