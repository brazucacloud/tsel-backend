#!/bin/bash

# TSEL Backend - Script de Teste de Instalação
# Versão: 1.0.0
# Autor: TSEL Team

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              TSEL BACKEND - TESTE DE INSTALAÇÃO              ║
║                Chip Warmup para WhatsApp                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Funções
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Testar se estamos no diretório correto
test_directory() {
    log "Testando diretório do projeto..."
    
    if [ ! -f "package.json" ]; then
        error "package.json não encontrado!"
        error "Execute este script no diretório do projeto TSEL Backend"
        exit 1
    fi
    
    if [ ! -f "server.js" ]; then
        error "server.js não encontrado!"
        error "Execute este script no diretório do projeto TSEL Backend"
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml não encontrado!"
        error "Execute este script no diretório do projeto TSEL Backend"
        exit 1
    fi
    
    success "Diretório do projeto OK"
}

# Testar arquivo .env
test_env_file() {
    log "Testando arquivo .env..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            warn "Arquivo .env não encontrado, criando a partir de env.example..."
            cp env.example .env
            success "Arquivo .env criado"
        else
            error "Arquivos .env e env.example não encontrados!"
            exit 1
        fi
    else
        success "Arquivo .env encontrado"
    fi
}

# Testar dependências Node.js
test_node_dependencies() {
    log "Testando dependências Node.js..."
    
    if [ ! -d "node_modules" ]; then
        warn "node_modules não encontrado, instalando dependências..."
        npm install
        if [ $? -eq 0 ]; then
            success "Dependências Node.js instaladas"
        else
            error "Falha ao instalar dependências Node.js"
            exit 1
        fi
    else
        success "Dependências Node.js OK"
    fi
}

# Testar Docker
test_docker() {
    log "Testando Docker..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker não instalado!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker não está rodando!"
        info "Execute: sudo systemctl start docker"
        exit 1
    fi
    
    success "Docker OK"
}

# Testar Docker Compose
test_docker_compose() {
    log "Testando Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não instalado!"
        exit 1
    fi
    
    success "Docker Compose OK"
}

# Testar banco de dados
test_database() {
    log "Testando banco de dados..."
    
    # Verificar se PostgreSQL está rodando
    if docker ps | grep -q postgres; then
        success "PostgreSQL está rodando"
    else
        warn "PostgreSQL não está rodando, iniciando..."
        docker-compose up -d postgres redis
        sleep 10
        success "PostgreSQL e Redis iniciados"
    fi
}

# Testar migrações
test_migrations() {
    log "Testando migrações..."
    
    if [ -f "scripts/migrate.js" ]; then
        node scripts/migrate.js up
        if [ $? -eq 0 ]; then
            success "Migrações executadas"
        else
            error "Falha ao executar migrações"
            exit 1
        fi
    else
        warn "Script de migração não encontrado"
    fi
}

# Testar servidor
test_server() {
    log "Testando servidor..."
    
    # Iniciar servidor em background
    timeout 10s node server.js &
    SERVER_PID=$!
    
    # Aguardar servidor iniciar
    sleep 3
    
    # Testar health check
    if curl -s http://localhost:3001/health > /dev/null; then
        success "Servidor está funcionando"
    else
        error "Servidor não está respondendo"
    fi
    
    # Parar servidor
    kill $SERVER_PID 2>/dev/null || true
}

# Testar scripts de instalação
test_installation_scripts() {
    log "Testando scripts de instalação..."
    
    local scripts=("check-system.sh" "quick-install.sh" "install.sh" "install-dependencies.sh")
    local missing=()
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                success "$script: OK"
            else
                warn "$script: não executável"
                chmod +x "$script"
                success "$script: permissões corrigidas"
            fi
        else
            missing+=("$script")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        warn "Scripts faltando: ${missing[*]}"
    fi
}

# Testar documentação
test_documentation() {
    log "Testando documentação..."
    
    local docs=("README.md" "INSTALL_LINUX.md" "API_DOCUMENTATION.md" "SCRIPTS_SUMMARY.md")
    local missing=()
    
    for doc in "${docs[@]}"; do
        if [ -f "$doc" ]; then
            success "$doc: OK"
        else
            missing+=("$doc")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        warn "Documentação faltando: ${missing[*]}"
    fi
}

# Função principal
main() {
    echo -e "${BLUE}Iniciando testes de instalação...${NC}\n"
    
    test_directory
    test_env_file
    test_node_dependencies
    test_docker
    test_docker_compose
    test_database
    test_migrations
    test_server
    test_installation_scripts
    test_documentation
    
    echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Todos os testes foram concluídos!${NC}"
    echo -e "${GREEN}O TSEL Backend está pronto para uso.${NC}"
    echo ""
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "  • Para iniciar o sistema: ./start.sh"
    echo "  • Para ver logs: ./logs.sh"
    echo "  • Para parar o sistema: ./stop.sh"
    echo ""
    echo -e "${BLUE}🌐 Acessos:${NC}"
    echo "  • API: http://localhost:3001/api"
    echo "  • Health Check: http://localhost:3001/health"
    echo "  • Documentação: http://localhost:3001/api"
}

# Executar testes
main
