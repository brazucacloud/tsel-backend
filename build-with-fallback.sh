#!/bin/bash

# Script para build com fallbacks para problemas de conectividade
echo "🚀 TSEL Backend - Build com Fallbacks"
echo "======================================"

# Função para tentar build com diferentes configurações
try_build() {
    local dockerfile=$1
    local description=$2
    
    echo ""
    echo "🔄 Tentando: $description"
    echo "📁 Dockerfile: $dockerfile"
    echo "⏳ Aguarde..."
    
    if docker compose build --no-cache --pull --file "$dockerfile" tsel-backend; then
        echo "✅ Sucesso com $description!"
        return 0
    else
        echo "❌ Falhou com $description"
        return 1
    fi
}

# Opção 1: Build com Dockerfile principal (melhorado)
echo "1️⃣ Tentando build com Dockerfile principal (melhorado)..."
if try_build "Dockerfile" "Dockerfile principal com fallbacks"; then
    echo "🎉 Build concluído com sucesso!"
    exit 0
fi

# Opção 2: Build com Dockerfile alternativo (Ubuntu)
echo "2️⃣ Tentando build com Dockerfile alternativo (Ubuntu)..."
if try_build "Dockerfile.alternative" "Dockerfile Ubuntu"; then
    echo "🎉 Build concluído com sucesso!"
    exit 0
fi

# Opção 3: Build com configurações de rede específicas
echo "3️⃣ Tentando build com configurações de rede específicas..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

if docker compose build --no-cache --pull --build-arg BUILDKIT_INLINE_CACHE=1 tsel-backend; then
    echo "🎉 Build concluído com sucesso!"
    exit 0
fi

# Opção 4: Build sem dependências do sistema (se possível)
echo "4️⃣ Tentando build minimalista..."
cat > Dockerfile.minimal << 'EOF'
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --timeout=300000
COPY . .
RUN mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
RUN chmod +x scripts/*.js
EXPOSE 3001
CMD ["node", "server.js"]
EOF

if try_build "Dockerfile.minimal" "Dockerfile minimalista"; then
    echo "🎉 Build concluído com sucesso!"
    rm Dockerfile.minimal
    exit 0
fi

# Se chegou até aqui, todas as tentativas falharam
echo ""
echo "❌ Todas as tentativas de build falharam!"
echo ""
echo "🔧 Sugestões para resolver:"
echo "1. Verifique sua conexão com a internet"
echo "2. Tente usar uma VPN ou proxy"
echo "3. Execute: docker system prune -a"
echo "4. Tente em um horário diferente"
echo "5. Use: docker build --network=host ."
echo ""
echo "💡 Comando alternativo para tentar:"
echo "docker build --network=host --no-cache --pull -t tsel-backend ."
