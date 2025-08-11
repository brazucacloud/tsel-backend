#!/bin/bash

echo "🔄 Forçando reconstrução completa do Docker..."

# Parar todos os containers
echo "📦 Parando containers..."
docker compose down

# Remover todas as imagens relacionadas ao projeto
echo "🗑️ Removendo imagens antigas..."
docker rmi $(docker images -q tsel-backend) 2>/dev/null || true
docker rmi $(docker images -q backend_tsel-backend) 2>/dev/null || true

# Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker system prune -a -f

# Reconstruir sem cache
echo "🔨 Reconstruindo sem cache..."
docker compose build --no-cache

# Iniciar containers
echo "🚀 Iniciando containers..."
docker compose up -d

echo "✅ Reconstrução completa finalizada!"
echo "📊 Status dos containers:"
docker compose ps
