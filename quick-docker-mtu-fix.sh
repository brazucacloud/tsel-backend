#!/bin/bash

# Quick Fix para Docker MTU 1420
# Interface já está com MTU 1442 (OK)

echo "🔧 Quick Fix - Docker MTU 1420"
echo "=============================="

# Tornar script executável
chmod +x fix-docker-mtu.sh

# Executar correção de MTU do Docker
echo "🔄 Configurando Docker com MTU 1420..."
./fix-docker-mtu.sh

# Se a correção foi bem-sucedida, tentar build
if [ $? -eq 0 ]; then
    echo ""
    echo "🔄 Tentando build com Docker configurado..."
    
    # Tentar build com Dockerfile otimizado
    if docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .; then
        echo "✅ Build bem-sucedido!"
        echo "🚀 Iniciando serviços..."
        docker compose up -d
        echo "🎉 Sistema iniciado com sucesso!"
        echo "📊 API disponível em: http://localhost:3001"
        exit 0
    else
        echo "⚠️ Build falhou, tentando com docker-compose..."
        
        # Tentar com docker-compose
        if docker compose build --file Dockerfile.ubuntu --no-cache --pull tsel-backend; then
            echo "✅ Build com docker-compose bem-sucedido!"
            echo "🚀 Iniciando serviços..."
            docker compose up -d
            echo "🎉 Sistema iniciado com sucesso!"
            echo "📊 API disponível em: http://localhost:3001"
            exit 0
        else
            echo "❌ Build falhou. Execute o script completo:"
            echo "   ./build-ubuntu-vps.sh"
        fi
    fi
else
    echo "❌ Falha na configuração do Docker MTU"
    echo "Execute manualmente:"
    echo "   sudo ./fix-docker-mtu.sh"
fi
