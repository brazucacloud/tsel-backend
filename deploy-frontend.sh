#!/bin/bash

# Script de Deploy do TSEL Frontend + Backend
# Autor: TSEL Team
# Versão: 1.0

set -e

echo "🚀 Iniciando deploy do TSEL Frontend + Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
    
    log "Docker e Docker Compose encontrados"
}

# Verificar se os arquivos necessários existem
check_files() {
    local required_files=(
        "docker-compose.yml"
        "frontend/index.html"
        "frontend/app.js"
        "frontend/Dockerfile"
        "frontend/nginx.conf"
        "nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Arquivo necessário não encontrado: $file"
            exit 1
        fi
    done
    
    log "Todos os arquivos necessários encontrados"
}

# Parar containers existentes
stop_containers() {
    log "Parando containers existentes..."
    docker-compose down --remove-orphans || true
}

# Remover containers antigos
cleanup_containers() {
    log "Limpando containers antigos..."
    docker-compose down -v --remove-orphans || true
    docker system prune -f || true
}

# Construir e iniciar containers
build_and_start() {
    log "Construindo e iniciando containers..."
    
    # Construir imagens
    docker-compose build --no-cache
    
    # Iniciar containers
    docker-compose up -d
    
    log "Containers iniciados com sucesso!"
}

# Verificar status dos containers
check_status() {
    log "Verificando status dos containers..."
    
    # Aguardar um pouco para os containers inicializarem
    sleep 10
    
    # Verificar se todos os containers estão rodando
    local containers=(
        "tsel-backend"
        "tsel-frontend"
        "tsel-postgres"
        "tsel-redis"
        "tsel-nginx"
    )
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            log "✅ $container está rodando"
        else
            error "❌ $container não está rodando"
            return 1
        fi
    done
    
    return 0
}

# Testar conectividade
test_connectivity() {
    log "Testando conectividade..."
    
    # Testar backend
    if curl -f -s http://localhost:3001/health > /dev/null; then
        log "✅ Backend está respondendo"
    else
        warn "⚠️ Backend não está respondendo na porta 3001"
    fi
    
    # Testar frontend
    if curl -f -s http://localhost:3000 > /dev/null; then
        log "✅ Frontend está respondendo"
    else
        warn "⚠️ Frontend não está respondendo na porta 3000"
    fi
    
    # Testar nginx
    if curl -f -s http://localhost:80 > /dev/null; then
        log "✅ Nginx está respondendo"
    else
        warn "⚠️ Nginx não está respondendo na porta 80"
    fi
}

# Mostrar informações de acesso
show_access_info() {
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo ""
    echo "📋 Informações de Acesso:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Nginx (HTTP): http://localhost:80"
    echo "   Nginx (HTTPS): https://localhost:443"
    echo ""
    echo "🗄️ Banco de Dados:"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo ""
    echo "🔧 Comandos úteis:"
    echo "   Ver logs: docker-compose logs -f"
    echo "   Parar: docker-compose down"
    echo "   Reiniciar: docker-compose restart"
    echo "   Status: docker-compose ps"
    echo ""
}

# Função principal
main() {
    log "Iniciando deploy do TSEL..."
    
    check_docker
    check_files
    stop_containers
    cleanup_containers
    build_and_start
    
    if check_status; then
        test_connectivity
        show_access_info
        log "Deploy concluído com sucesso! 🎉"
    else
        error "Falha no deploy. Verifique os logs com: docker-compose logs"
        exit 1
    fi
}

# Executar função principal
main "$@"
