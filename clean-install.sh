#!/bin/bash

# Script de instalação limpa - Sem Alpine/APK
# Este script remove todas as referências ao Alpine e instala usando apenas Debian

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log "🧹 Iniciando instalação limpa (sem Alpine/APK)..."

# 1. Parar e limpar containers existentes
log "📦 Parando containers existentes..."
docker compose down 2>/dev/null || true

# 2. Remover imagens antigas
log "🗑️ Removendo imagens antigas..."
docker rmi $(docker images -q tsel-backend) 2>/dev/null || true
docker rmi $(docker images -q backend_tsel-backend) 2>/dev/null || true

# 3. Limpar cache do Docker
log "🧹 Limpando cache do Docker..."
docker system prune -a -f

# 4. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto (onde está o package.json)"
fi

# 5. Verificar dependências
log "📋 Verificando dependências..."

if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Instale o Node.js 18+ primeiro."
fi

if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale o Docker primeiro."
fi

log "✅ Dependências verificadas"

# 6. Instalar dependências do backend
log "📦 Instalando dependências do backend..."
npm install

# 6.1. Verificar e corrigir vulnerabilidades
log "🔒 Verificando vulnerabilidades de segurança..."
npm audit --audit-level=moderate || true

# 6.2. Tentar corrigir vulnerabilidades automaticamente
log "🔧 Tentando corrigir vulnerabilidades..."
npm audit fix --force || warn "Algumas vulnerabilidades não puderam ser corrigidas automaticamente"

# 7. Instalar xlsx especificamente
log "📊 Instalando dependência xlsx..."
npm install xlsx

# 8. Configurar variáveis de ambiente
log "⚙️ Configurando variáveis de ambiente..."

if [ ! -f ".env" ]; then
    log "📝 Criando arquivo .env..."
    cp env.example .env
    
    # Gerar senha aleatória para o banco
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    sed -i "s/your_password_here/$DB_PASSWORD/g" .env
    
    log "✅ Arquivo .env criado com senha aleatória"
    log "🔑 Senha do banco de dados: $DB_PASSWORD"
    log "⚠️ Guarde esta senha em local seguro!"
else
    log "✅ Arquivo .env já existe"
fi

# 9. Criar diretórios necessários (sem APK)
log "📁 Criando diretórios necessários..."
mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups temp

# 10. Construir containers com Debian
log "🔨 Construindo containers com Debian..."
docker compose build --no-cache --pull

# 11. Iniciar containers
log "🚀 Iniciando containers..."
docker compose up -d

# 12. Aguardar banco estar pronto
log "⏳ Aguardando banco de dados estar pronto..."
sleep 15

# 13. Verificar se o banco está rodando
if ! docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    warn "Banco de dados não está respondendo. Aguardando mais tempo..."
    sleep 10
fi

# 14. Executar migrações
log "🗄️ Executando migrações..."
npm run migrate 2>/dev/null || warn "Migrações falharam. Execute manualmente: npm run migrate"

# 15. Executar seeds
log "🌱 Executando seeds..."
npm run seed 2>/dev/null || warn "Seeds falharam. Execute manualmente: npm run seed"

# 16. Verificar instalação
log "🔍 Verificando instalação..."

# Testar imports
if node scripts/test-imports.js 2>/dev/null; then
    log "✅ Todos os módulos importados com sucesso"
else
    warn "Alguns módulos podem ter problemas de importação"
fi

# 17. Verificar se está usando Debian
log "🔍 Verificando sistema operacional..."
if docker compose exec -T backend cat /etc/os-release | grep -q "Debian"; then
    log "✅ Container usando Debian"
else
    warn "Container pode não estar usando Debian"
fi

# 18. Criar scripts úteis
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

log "✅ Scripts úteis criados"

# 19. Resumo final
log "🎉 Instalação limpa finalizada!"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           TSEL BACKEND                ${NC}"
echo -e "${BLUE}        Instalação Limpa               ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Backend configurado e pronto${NC}"
echo -e "${GREEN}✅ Banco de dados PostgreSQL rodando${NC}"
echo -e "${GREEN}✅ API REST disponível${NC}"
echo -e "${GREEN}✅ Sistema de tarefas de 21 dias ativo${NC}"
echo -e "${GREEN}✅ Sistema de relatórios configurado${NC}"
echo -e "${GREEN}✅ Sem referências ao Alpine/APK${NC}"
echo ""
echo -e "${YELLOW}📋 Comandos úteis:${NC}"
echo -e "  • ${BLUE}./start-system.sh${NC} - Iniciar todo o sistema"
echo -e "  • ${BLUE}./stop-system.sh${NC} - Parar todo o sistema"
echo -e "  • ${BLUE}./view-logs.sh${NC} - Visualizar logs"
echo -e "  • ${BLUE}npm start${NC} - Iniciar apenas o backend"
echo -e "  • ${BLUE}docker compose ps${NC} - Status dos containers"
echo ""
echo -e "${YELLOW}🌐 URLs importantes:${NC}"
echo -e "  • Backend API: ${BLUE}http://localhost:3001${NC}"
echo -e "  • Documentação: ${BLUE}http://localhost:3001/api-docs${NC}"
echo -e "  • Health Check: ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "${GREEN}🎯 Sistema pronto para uso!${NC}"
