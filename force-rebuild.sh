#!/bin/bash

# Script para forçar reconstrução completa do Docker
# Este script garante que o Debian seja usado

echo "🔄 Forçando reconstrução completa do Docker..."
echo "📦 Parando containers..."
docker compose down

echo "🗑️ Removendo imagens antigas..."
docker rmi $(docker images -q tsel-backend) 2>/dev/null || true
docker rmi $(docker images -q backend_tsel-backend) 2>/dev/null || true

echo "🧹 Limpando cache do Docker..."
docker system prune -a -f

echo "🔨 Reconstruindo sem cache..."
docker compose build --no-cache --pull

echo "🚀 Iniciando containers..."
docker compose up -d

echo "✅ Reconstrução completa finalizada!"
echo "📊 Status dos containers:"
docker compose ps

echo ""
echo "🔍 Verificando se está usando Debian:"
docker compose exec backend cat /etc/os-release | head -1
