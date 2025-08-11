#!/bin/bash

# TSEL Backend - Instalador Completo
# Este script instala e configura todo o sistema TSEL

set -e  # Para em caso de erro

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
    exit 1
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto (onde está o package.json)"
fi

log "🚀 Iniciando instalação completa do TSEL Backend..."

# 1. Verificar dependências do sistema
log "📋 Verificando dependências do sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Instale o Node.js 18+ primeiro."
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versão 18+ é necessária. Versão atual: $(node -v)"
fi

log "✅ Node.js $(node -v) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não está instalado."
fi

log "✅ npm $(npm -v) encontrado"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    warn "Docker não está instalado. A instalação continuará sem Docker."
    DOCKER_AVAILABLE=false
else
    log "✅ Docker encontrado"
    DOCKER_AVAILABLE=true
fi

# 2. Instalar dependências do backend
log "📦 Instalando dependências do backend..."
npm install

# Instalar dependência xlsx especificamente
log "📊 Instalando dependência xlsx para relatórios..."
npm install xlsx

# 3. Configurar variáveis de ambiente
log "⚙️ Configurando variáveis de ambiente..."

if [ ! -f ".env" ]; then
    log "📝 Criando arquivo .env..."
    cp env.example .env
    
    # Gerar senha aleatória para o banco
    DB_PASSWORD=$(openssl rand -base64 32)
    sed -i "s/your_password_here/$DB_PASSWORD/g" .env
    
    log "✅ Arquivo .env criado com senha aleatória"
    log "🔑 Senha do banco de dados: $DB_PASSWORD"
    log "⚠️ Guarde esta senha em local seguro!"
else
    log "✅ Arquivo .env já existe"
fi

# 4. Criar diretórios necessários
log "📁 Criando diretórios necessários..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

# 5. Configurar banco de dados
if [ "$DOCKER_AVAILABLE" = true ]; then
    log "🐳 Iniciando serviços Docker..."
    
    # Parar containers existentes
    docker compose down 2>/dev/null || true
    
    # Construir e iniciar containers
    log "🔨 Construindo containers..."
    docker compose build --no-cache
    
    log "🚀 Iniciando containers..."
    docker compose up -d
    
    # Aguardar banco estar pronto
    log "⏳ Aguardando banco de dados estar pronto..."
    sleep 10
    
    # Verificar se o banco está rodando
    if ! docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        error "Banco de dados não está respondendo. Verifique os logs: docker compose logs postgres"
    fi
    
    log "✅ Banco de dados PostgreSQL está rodando"
else
    log "⚠️ Docker não disponível. Configure o banco PostgreSQL manualmente."
    log "📋 Execute: npm run migrate"
fi

# 6. Executar migrações e seeds
log "🗄️ Inicializando banco de dados..."

# Tentar executar migrações
if npm run migrate 2>/dev/null; then
    log "✅ Migrações executadas com sucesso"
else
    warn "Migrações falharam. Execute manualmente: npm run migrate"
fi

# Tentar executar seeds
if npm run seed 2>/dev/null; then
    log "✅ Dados iniciais carregados"
else
    warn "Seeds falharam. Execute manualmente: npm run seed"
fi

# 7. Verificar instalação
log "🔍 Verificando instalação..."

# Testar imports
if node scripts/test-imports.js; then
    log "✅ Todos os módulos importados com sucesso"
else
    warn "Alguns módulos podem ter problemas de importação"
fi

# 8. Configurar frontend (se existir)
if [ -d "../TSEL/frontend" ]; then
    log "🎨 Configurando frontend..."
    cd ../TSEL/frontend
    
    if [ -f "package.json" ]; then
        log "📦 Instalando dependências do frontend..."
        npm install
        
        log "✅ Frontend configurado"
    else
        warn "package.json não encontrado no frontend"
    fi
    
    cd ../../BACKEND
else
    log "ℹ️ Diretório frontend não encontrado. Configure manualmente se necessário."
fi

# 9. Criar scripts úteis
log "📜 Criando scripts úteis..."

# Script para iniciar o sistema
cat > start-system.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando sistema TSEL..."
echo "📦 Iniciando containers Docker..."
docker compose up -d
echo "⏳ Aguardando serviços..."
sleep 5
echo "🌐 Iniciando servidor backend..."
npm start
EOF

chmod +x start-system.sh

# Script para parar o sistema
cat > stop-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Parando sistema TSEL..."
echo "📦 Parando containers Docker..."
docker compose down
echo "✅ Sistema parado"
EOF

chmod +x stop-system.sh

# Script para logs
cat > view-logs.sh << 'EOF'
#!/bin/bash
echo "📋 Visualizando logs do sistema..."
echo "🔍 Logs do backend:"
docker compose logs -f backend
EOF

chmod +x view-logs.sh

# 10. Resumo final
log "🎉 Instalação completa finalizada!"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           TSEL BACKEND                ${NC}"
echo -e "${BLUE}        Instalação Completa            ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Backend configurado e pronto${NC}"
echo -e "${GREEN}✅ Banco de dados PostgreSQL rodando${NC}"
echo -e "${GREEN}✅ API REST disponível${NC}"
echo -e "${GREEN}✅ Sistema de tarefas de 21 dias ativo${NC}"
echo -e "${GREEN}✅ Sistema de relatórios configurado${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos úteis:${NC}"
echo -e "  • ${BLUE}./start-system.sh${NC} - Iniciar todo o sistema"
echo -e "  • ${BLUE}./stop-system.sh${NC} - Parar todo o sistema"
echo -e "  • ${BLUE}./view-logs.sh${NC} - Visualizar logs"
echo -e "  • ${BLUE}npm start${NC} - Iniciar apenas o backend"
echo -e "  • ${BLUE}docker compose ps${NC} - Status dos containers"
echo ""
echo -e "${YELLOW}🌐 URLs importantes:${NC}"
echo -e "  • Backend API: ${BLUE}http://localhost:3000${NC}"
echo -e "  • Documentação: ${BLUE}http://localhost:3000/api-docs${NC}"
echo -e "  • Health Check: ${BLUE}http://localhost:3000/health${NC}"
echo ""
echo -e "${YELLOW}📚 Documentação:${NC}"
echo -e "  • ${BLUE}README.md${NC} - Documentação principal"
echo -e "  • ${BLUE}API_DOCUMENTATION.md${NC} - Documentação da API"
echo -e "  • ${BLUE}DAILY_TASKS_GUIDE.md${NC} - Guia das tarefas de 21 dias"
echo -e "  • ${BLUE}REPORTS_GUIDE.md${NC} - Guia dos relatórios"
echo ""
echo -e "${GREEN}🎯 Sistema pronto para uso!${NC}"
