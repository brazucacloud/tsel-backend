#!/bin/bash

# Script de Build para Ubuntu 24.04 VPS
# Resolve problemas de conectividade com repositórios Debian

set -e

echo "🔧 TSEL Backend - Build Ubuntu 24.04 VPS"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para tentar build com diferentes estratégias
try_build() {
    local dockerfile=$1
    local description=$2
    local extra_args=$3
    
    echo ""
    log_info "Tentando: $description"
    echo "📁 Dockerfile: $dockerfile"
    echo "⏳ Aguarde..."
    
    if docker compose build --file "$dockerfile" --no-cache --pull $extra_args tsel-backend; then
        log_success "Build bem-sucedido com $description!"
        return 0
    else
        log_warning "Falhou com $description"
        return 1
    fi
}

# Função para build direto
try_direct_build() {
    local dockerfile=$1
    local description=$2
    
    echo ""
    log_info "Tentando build direto: $description"
    echo "📁 Dockerfile: $dockerfile"
    echo "⏳ Aguarde..."
    
    if docker build --file "$dockerfile" --no-cache --pull -t tsel-backend .; then
        log_success "Build direto bem-sucedido com $description!"
        return 0
    else
        log_warning "Build direto falhou com $description"
        return 1
    fi
}

# Limpar cache Docker se necessário
clean_docker_cache() {
    log_info "Limpando cache Docker..."
    docker system prune -f
    docker builder prune -f
}

# Verificar conectividade
check_connectivity() {
    log_info "Verificando conectividade..."
    
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_success "Conectividade básica OK"
    else
        log_error "Problemas de conectividade detectados"
        return 1
    fi
}

# Estratégia 1: Dockerfile otimizado para Ubuntu
log_info "1️⃣ Estratégia 1: Dockerfile otimizado para Ubuntu"
if try_build "Dockerfile.ubuntu" "Dockerfile otimizado para Ubuntu"; then
    log_success "🎉 Build concluído com sucesso!"
    exit 0
fi

# Estratégia 2: Dockerfile alternativo (Ubuntu base)
log_info "2️⃣ Estratégia 2: Dockerfile alternativo (Ubuntu base)"
if try_build "Dockerfile.alternative" "Dockerfile Ubuntu base"; then
    log_success "🎉 Build concluído com sucesso!"
    exit 0
fi

# Estratégia 3: Build com BuildKit habilitado
log_info "3️⃣ Estratégia 3: Build com BuildKit habilitado"
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

if try_build "Dockerfile.ubuntu" "BuildKit habilitado" "--build-arg BUILDKIT_INLINE_CACHE=1"; then
    log_success "🎉 Build concluído com sucesso!"
    exit 0
fi

# Estratégia 4: Build direto sem docker-compose
log_info "4️⃣ Estratégia 4: Build direto sem docker-compose"
if try_direct_build "Dockerfile.ubuntu" "Build direto Ubuntu"; then
    log_success "🎉 Build concluído com sucesso!"
    exit 0
fi

# Estratégia 5: Build com configurações de rede específicas
log_info "5️⃣ Estratégia 5: Build com configurações de rede específicas"
if docker build --file Dockerfile.ubuntu --no-cache --pull --network=host -t tsel-backend .; then
    log_success "🎉 Build concluído com sucesso!"
    exit 0
fi

# Estratégia 6: Build minimalista (sem dependências extras)
log_info "6️⃣ Estratégia 6: Build minimalista"
cat > Dockerfile.minimal << 'EOF'
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --timeout=300000 --retry=3
COPY . .
RUN mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
RUN chmod +x scripts/*.js 2>/dev/null || true
EXPOSE 3001
CMD ["node", "server.js"]
EOF

if try_direct_build "Dockerfile.minimal" "Build minimalista"; then
    log_success "🎉 Build concluído com sucesso!"
    rm Dockerfile.minimal
    exit 0
fi

# Estratégia 7: Build com mirrors alternativos
log_info "7️⃣ Estratégia 7: Build com mirrors alternativos"
cat > Dockerfile.mirrors << 'EOF'
FROM node:18-bullseye-slim
WORKDIR /app

# Configurar mirrors alternativos
RUN echo "deb http://ftp.debian.org/debian bullseye main" > /etc/apt/sources.list && \
    echo "deb http://ftp.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
    echo "deb http://ftp.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list

# Configurar timeouts
RUN echo 'Acquire::http::Timeout "120";' > /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::ftp::Timeout "120";' >> /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::Retries "5";' >> /etc/apt/apt.conf.d/99timeout

# Instalar dependências mínimas
RUN apt-get update --option Acquire::http::Timeout=120 --option Acquire::Retries=5 && \
    apt-get install -y --no-install-recommends make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --timeout=300000 --retry=3
COPY . .
RUN mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
RUN chmod +x scripts/*.js 2>/dev/null || true
EXPOSE 3001
CMD ["node", "server.js"]
EOF

if try_direct_build "Dockerfile.mirrors" "Build com mirrors alternativos"; then
    log_success "🎉 Build concluído com sucesso!"
    rm Dockerfile.mirrors
    exit 0
fi

# Se chegou até aqui, todas as tentativas falharam
echo ""
log_error "❌ Todas as tentativas de build falharam!"
echo ""
log_warning "🔧 Sugestões para resolver:"
echo "1. Verifique sua conexão com a internet"
echo "2. Tente usar uma VPN ou proxy"
echo "3. Execute: docker system prune -a"
echo "4. Tente em um horário diferente"
echo "5. Verifique se há firewall bloqueando conexões"
echo ""
log_info "💡 Comandos alternativos para tentar:"
echo "docker build --network=host --no-cache --pull -t tsel-backend ."
echo "docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend ."
echo ""
log_info "🔍 Para diagnosticar problemas:"
echo "docker system info"
echo "docker version"
echo "ping deb.debian.org"
echo "curl -I https://deb.debian.org"
