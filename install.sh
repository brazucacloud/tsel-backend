#!/bin/bash

# TSEL Backend - Script de Instalação para Linux/Ubuntu
# Versão: 2.0.0
# Autor: TSEL Team
# Compatível: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+

set -e  # Para o script se qualquer comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              TSEL BACKEND INSTALLER (Linux)                  ║
║                Chip Warmup para WhatsApp                     ║
║                                                              ║
║  Sistema completo com PostgreSQL, APIs REST, WebSocket,     ║
║  Autenticação JWT, Redis Cache, e Dashboard Analytics       ║
║                                                              ║
║  Compatível: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+  ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root!"
   exit 1
fi

# Verificar sistema operacional
check_os() {
    log "Verificando sistema operacional..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
            ID_LIKE=$ID_LIKE
        else
            error "Não foi possível detectar o sistema operacional"
            exit 1
        fi
    else
        error "Sistema operacional não suportado: $OSTYPE"
        exit 1
    fi
    
    # Verificar compatibilidade
    case $ID in
        ubuntu)
            if [[ $(echo "$VER >= 20.04" | bc -l) -eq 0 ]]; then
                error "Ubuntu 20.04 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        debian)
            if [[ $(echo "$VER >= 11" | bc -l) -eq 0 ]]; then
                error "Debian 11 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        centos|rhel|rocky|almalinux)
            if [[ $(echo "$VER >= 8" | bc -l) -eq 0 ]]; then
                error "CentOS/RHEL 8 ou superior é necessário. Versão atual: $VER"
                exit 1
            fi
            ;;
        *)
            warn "Sistema operacional não testado: $OS $VER"
            ;;
    esac
    
    success "Sistema detectado: $OS $VER"
}

# Verificar dependências do sistema
check_system_dependencies() {
    log "Verificando dependências do sistema..."
    
    local missing_deps=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            warn "Node.js versão $NODE_VERSION detectada. Recomendado: 18.x ou superior"
        else
            success "Node.js $NODE_VERSION encontrado"
        fi
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        success "npm $(npm --version) encontrado"
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) encontrado"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        success "Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) encontrado"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        success "Git $(git --version | cut -d' ' -f3) encontrado"
    fi
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    else
        success "curl encontrado"
    fi
    
    # Verificar wget
    if ! command -v wget &> /dev/null; then
        missing_deps+=("wget")
    else
        success "wget encontrado"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependências faltando: ${missing_deps[*]}"
        warn "Execute o script de instalação de dependências primeiro:"
        echo "  ./install-dependencies.sh"
        exit 1
    fi
}

# Instalar dependências do sistema (Ubuntu/Debian)
install_system_dependencies() {
    log "Instalando dependências do sistema..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release
        
        # Instalar Node.js 18.x
        if ! command -v node &> /dev/null || [ "$NODE_MAJOR" -lt 18 ]; then
            log "Instalando Node.js 18.x..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt install -y nodejs
        fi
        
        # Instalar Docker
        if ! command -v docker &> /dev/null; then
            log "Instalando Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Instalar Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            log "Instalando Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        success "Dependências do sistema instaladas"
    else
        error "Sistema operacional não suportado para instalação automática: $OS"
        warn "Instale manualmente: Node.js 18+, Docker, Docker Compose, Git, curl, wget"
        exit 1
    fi
}

# Verificar se o diretório já existe
check_existing_installation() {
    if [ -d "node_modules" ] || [ -f "package.json" ]; then
        warn "Instalação existente detectada!"
        read -p "Deseja continuar e sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Instalação cancelada pelo usuário"
            exit 0
        fi
        log "Continuando com sobrescrita..."
    fi
}

# Criar estrutura de diretórios
create_directories() {
    log "Criando estrutura de diretórios..."
    
    mkdir -p {config,models,middleware,routes,utils,scripts,logs,uploads/{images,videos,audio,documents,apks},backups,ssl}
    
    success "Estrutura de diretórios criada"
}

# Verificar arquivos necessários
check_required_files() {
    log "Verificando arquivos necessários..."
    
    local required_files=(
        "package.json"
        "server.js"
        "config/database.js"
        "utils/logger.js"
        "models/User.js"
        "models/Device.js"
        "models/Task.js"
        "models/Content.js"
        "models/Setting.js"
        "models/Notification.js"
        "middleware/auth.js"
        "middleware/validation.js"
        "routes/auth.js"
        "routes/users.js"
        "routes/devices.js"
        "routes/tasks.js"
        "routes/content.js"
        "routes/analytics.js"
        "routes/settings.js"
        "routes/notifications.js"
        "scripts/migrate.js"
        "scripts/seed.js"
        "scripts/test-imports.js"
        "Dockerfile"
        "docker-compose.yml"
        "nginx.conf"
        "ecosystem.config.js"
        ".gitignore"
        "README.md"
        "API_DOCUMENTATION.md"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        error "Arquivos necessários não encontrados:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        error "Execute primeiro: git clone <repository-url>"
        exit 1
    fi
    
    # Criar arquivo .env se não existir
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            log "Criando arquivo .env a partir de env.example..."
            cp env.example .env
            success "Arquivo .env criado"
        else
            warn "Arquivo env.example não encontrado"
        fi
    fi
    
    success "Todos os arquivos necessários encontrados"
}

# Instalar dependências Node.js
install_node_dependencies() {
    log "Instalando dependências Node.js..."
    
    # Verificar se package.json existe
    if [ ! -f "package.json" ]; then
        error "package.json não encontrado!"
        exit 1
    fi
    
    # Instalar dependências
    npm install
    
    if [ $? -eq 0 ]; then
        success "Dependências Node.js instaladas"
    else
        error "Falha ao instalar dependências Node.js"
        exit 1
    fi
}

# Configurar variáveis de ambiente
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            log "Criando arquivo .env a partir de env.example..."
            cp env.example .env
            success "Arquivo .env criado"
        else
            error "Arquivo .env não encontrado e env.example não disponível!"
            exit 1
        fi
    fi
    
    # Gerar JWT_SECRET se não existir
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your_jwt_secret_here" .env; then
        JWT_SECRET=$(openssl rand -hex 64)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        success "JWT_SECRET gerado automaticamente"
    fi
    
    # Gerar DATABASE_PASSWORD se não existir
    if ! grep -q "DATABASE_PASSWORD=" .env || grep -q "DATABASE_PASSWORD=your_password_here" .env; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$DB_PASSWORD/" .env
        success "DATABASE_PASSWORD gerado automaticamente"
    fi
    
    # Gerar REDIS_PASSWORD se não existir
    if ! grep -q "REDIS_PASSWORD=" .env || grep -q "REDIS_PASSWORD=your_redis_password_here" .env; then
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
        success "REDIS_PASSWORD gerado automaticamente"
    fi
    
    success "Variáveis de ambiente configuradas"
}

# Testar imports
test_imports() {
    log "Testando imports e dependências..."
    
    if [ -f "scripts/test-imports.js" ]; then
        node scripts/test-imports.js
        if [ $? -eq 0 ]; then
            success "Teste de imports concluído"
        else
            error "Falha no teste de imports"
            exit 1
        fi
    else
        warn "Script de teste de imports não encontrado, pulando..."
    fi
}

# Inicializar banco de dados
initialize_database() {
    log "Inicializando banco de dados..."
    
    # Verificar se Docker está rodando
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando!"
        warn "Inicie o Docker e tente novamente"
        exit 1
    fi
    
    # Parar containers existentes
    docker-compose down > /dev/null 2>&1 || true
    
    # Iniciar PostgreSQL e Redis
    log "Iniciando PostgreSQL e Redis..."
    docker-compose up -d postgres redis
    
    # Aguardar PostgreSQL estar pronto
    log "Aguardando PostgreSQL estar pronto..."
    sleep 10
    
    # Executar migrações
    if [ -f "scripts/migrate.js" ]; then
        log "Executando migrações do banco de dados..."
        node scripts/migrate.js up
        if [ $? -eq 0 ]; then
            success "Migrações executadas"
        else
            error "Falha ao executar migrações"
            exit 1
        fi
    fi
    
    # Executar seed (opcional)
    read -p "Deseja executar seed com dados de teste? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "scripts/seed.js" ]; then
            log "Executando seed do banco de dados..."
            node scripts/seed.js
            if [ $? -eq 0 ]; then
                success "Seed executado"
            else
                warn "Falha ao executar seed (não crítico)"
            fi
        fi
    fi
    
    success "Banco de dados inicializado"
}

# Testar aplicação
test_application() {
    log "Testando aplicação..."
    
    # Iniciar aplicação em background
    log "Iniciando aplicação para teste..."
    timeout 30s npm start > /dev/null 2>&1 &
    APP_PID=$!
    
    # Aguardar aplicação iniciar
    sleep 5
    
    # Testar health check
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        success "Aplicação iniciada com sucesso"
    else
        error "Falha ao iniciar aplicação"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Parar aplicação
    kill $APP_PID 2>/dev/null || true
    sleep 2
    
    success "Teste da aplicação concluído"
}

# Configurar PM2 (opcional)
setup_pm2() {
    read -p "Deseja configurar PM2 para produção? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Configurando PM2..."
        
        # Instalar PM2 globalmente
        npm install -g pm2
        
        # Verificar se ecosystem.config.js existe
        if [ -f "ecosystem.config.js" ]; then
            success "PM2 configurado. Use 'pm2 start ecosystem.config.js' para iniciar"
        else
            warn "ecosystem.config.js não encontrado"
        fi
    fi
}

# Configurar Nginx (opcional)
setup_nginx() {
    read -p "Deseja configurar Nginx como reverse proxy? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Configurando Nginx..."
        
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            # Instalar Nginx
            sudo apt install -y nginx
            
            # Copiar configuração
            if [ -f "nginx.conf" ]; then
                sudo cp nginx.conf /etc/nginx/nginx.conf
                sudo nginx -t
                if [ $? -eq 0 ]; then
                    sudo systemctl enable nginx
                    sudo systemctl restart nginx
                    success "Nginx configurado e iniciado"
                else
                    error "Configuração do Nginx inválida"
                fi
            else
                warn "nginx.conf não encontrado"
            fi
        else
            warn "Configuração automática do Nginx não suportada para $OS"
        fi
    fi
}

# Configurar SSL (opcional)
setup_ssl() {
    read -p "Deseja configurar SSL com Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Configurando SSL..."
        
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            # Instalar certbot
            sudo apt install -y certbot python3-certbot-nginx
            
            read -p "Digite o domínio para SSL (ex: api.tseusuario.com): " DOMAIN
            
            if [ ! -z "$DOMAIN" ]; then
                # Obter certificado
                sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
                
                if [ $? -eq 0 ]; then
                    success "SSL configurado para $DOMAIN"
                else
                    error "Falha ao configurar SSL"
                fi
            fi
        else
            warn "Configuração automática do SSL não suportada para $OS"
        fi
    fi
}

# Criar scripts de gerenciamento
create_management_scripts() {
    log "Criando scripts de gerenciamento..."
    
    # Script de start
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando TSEL Backend..."
docker-compose up -d
echo "✅ TSEL Backend iniciado!"
echo "📊 Dashboard: http://localhost:3001"
echo "🔧 Health Check: http://localhost:3001/health"
EOF
    
    # Script de stop
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Parando TSEL Backend..."
docker-compose down
echo "✅ TSEL Backend parado!"
EOF
    
    # Script de restart
    cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Reiniciando TSEL Backend..."
docker-compose down
docker-compose up -d
echo "✅ TSEL Backend reiniciado!"
EOF
    
    # Script de logs
    cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 Exibindo logs do TSEL Backend..."
docker-compose logs -f
EOF
    
    # Script de backup
    cat > backup.sh << 'EOF'
#!/bin/bash
echo "💾 Criando backup do banco de dados..."
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T postgres pg_dump -U tsel_user tsel_db > "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
EOF
    
    # Script de restore
    cat > restore.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "❌ Uso: ./restore.sh <arquivo_backup.sql>"
    exit 1
fi
echo "🔄 Restaurando backup: $1"
docker-compose exec -T postgres psql -U tsel_user tsel_db < "$1"
echo "✅ Backup restaurado!"
EOF
    
    # Tornar scripts executáveis
    chmod +x {start,stop,restart,logs,backup,restore}.sh
    
    success "Scripts de gerenciamento criados"
}

# Mostrar informações finais
show_final_info() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    INSTALAÇÃO CONCLUÍDA!                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    success "TSEL Backend instalado com sucesso!"
    
    echo -e "${BLUE}📋 Informações importantes:${NC}"
    echo "  • API Base URL: http://localhost:3001/api"
    echo "  • Health Check: http://localhost:3001/health"
    echo "  • Documentação: http://localhost:3001/api"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    
    echo -e "${BLUE}🔧 Comandos úteis:${NC}"
    echo "  • Iniciar: ./start.sh"
    echo "  • Parar: ./stop.sh"
    echo "  • Reiniciar: ./restart.sh"
    echo "  • Logs: ./logs.sh"
    echo "  • Backup: ./backup.sh"
    echo "  • Restaurar: ./restore.sh <arquivo>"
    
    echo -e "${BLUE}👤 Usuário padrão:${NC}"
    echo "  • Email: admin@tsel.com"
    echo "  • Senha: admin123"
    
    echo -e "${BLUE}📚 Documentação:${NC}"
    echo "  • README.md - Guia completo"
    echo "  • API_DOCUMENTATION.md - Documentação da API"
    
    echo -e "${YELLOW}⚠️  Próximos passos:${NC}"
    echo "  1. Altere as senhas padrão no arquivo .env"
    echo "  2. Configure SSL para produção"
    echo "  3. Configure backup automático"
    echo "  4. Monitore os logs regularmente"
    
    echo -e "${GREEN}🎉 TSEL Backend está pronto para uso!${NC}"
}

# Função principal
main() {
    log "Iniciando instalação do TSEL Backend..."
    
    # Verificações iniciais
    check_os
    check_system_dependencies
    
    # Perguntar se quer instalar dependências
    read -p "Deseja instalar dependências do sistema automaticamente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_system_dependencies
    fi
    
    # Verificar instalação existente
    check_existing_installation
    
    # Criar estrutura
    create_directories
    
    # Verificar arquivos
    check_required_files
    
    # Instalar dependências Node.js
    install_node_dependencies
    
    # Configurar ambiente
    setup_environment
    
    # Testar imports
    test_imports
    
    # Inicializar banco
    initialize_database
    
    # Testar aplicação
    test_application
    
    # Configurações opcionais
    setup_pm2
    setup_nginx
    setup_ssl
    
    # Criar scripts de gerenciamento
    create_management_scripts
    
    # Informações finais
    show_final_info
}

# Executar função principal
main "$@"
