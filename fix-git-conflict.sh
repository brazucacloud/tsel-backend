#!/bin/bash

# Script para resolver conflito git e forçar atualização
echo "🔧 Resolvendo conflito git e forçando atualização..."
echo "=================================================="

# Fazer stash das mudanças locais
echo "📦 Salvando mudanças locais..."
git stash

# Forçar atualização do repositório
echo "📥 Forçando atualização do repositório..."
git fetch origin
git reset --hard origin/master

# Verificar se o script existe
echo "🔍 Verificando se force-update-and-build.sh existe..."
if [ -f "force-update-and-build.sh" ]; then
    echo "✅ Script encontrado"
    chmod +x force-update-and-build.sh
    echo "🚀 Executando script de correção..."
    ./force-update-and-build.sh
else
    echo "❌ Script não encontrado"
    echo "🔄 Tentando build manual..."
    
    # Verificar e corrigir Dockerfile se necessário
    if grep -q "nameserver 8.8.8.8" Dockerfile.ubuntu; then
        echo "🔄 Removendo configuração DNS problemática..."
        sed -i '/nameserver 8.8.8.8/d' Dockerfile.ubuntu
        sed -i '/nameserver 8.8.4.4/d' Dockerfile.ubuntu
        sed -i '/Configurar DNS e resolver/d' Dockerfile.ubuntu
        echo "✅ Configuração DNS removida"
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
fi
