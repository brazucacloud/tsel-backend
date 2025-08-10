#!/bin/bash

# TSEL Backend - Instalação Rápida para Ubuntu
# Versão: 1.0.0
# Autor: TSEL Team
# Compatível: Ubuntu 20.04+

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║              TSEL BACKEND - INSTALAÇÃO RÁPIDA               ║
║                Chip Warmup para WhatsApp                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo -e "${RED}❌ Este script é específico para Ubuntu${NC}"
    echo -e "${YELLOW}Para outros sistemas, use: ./install.sh${NC}"
    exit 1
fi

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
    echo -e "${RED}❌ Não execute como root!${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Iniciando instalação rápida do TSEL Backend...${NC}"

# Atualizar sistema
echo -e "${BLUE}📦 Atualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo -e "${BLUE}📦 Instalando dependências básicas...${NC}"
sudo apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential python3 bc

# Instalar Node.js 18.x
echo -e "${BLUE}📦 Instalando Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Docker
echo -e "${BLUE}📦 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Instalar Docker Compose
echo -e "${BLUE}📦 Instalando Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalações
echo -e "${BLUE}🔍 Verificando instalações...${NC}"
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)

echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
echo -e "${GREEN}✅ Docker: $DOCKER_VERSION${NC}"
echo -e "${GREEN}✅ Docker Compose: $COMPOSE_VERSION${NC}"

# Verificar se os arquivos necessários existem
if [ ! -f "package.json" ] || [ ! -f ".env" ] || [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Arquivos do projeto não encontrados!${NC}"
    echo -e "${YELLOW}Execute este script no diretório do projeto TSEL Backend${NC}"
    exit 1
fi

# Instalar dependências Node.js
echo -e "${BLUE}📦 Instalando dependências Node.js...${NC}"
npm install

# Configurar variáveis de ambiente
echo -e "${BLUE}⚙️  Configurando variáveis de ambiente...${NC}"
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your_jwt_secret_here" .env; then
    JWT_SECRET=$(openssl rand -hex 64)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    echo -e "${GREEN}✅ JWT_SECRET gerado${NC}"
fi

if ! grep -q "DATABASE_PASSWORD=" .env || grep -q "DATABASE_PASSWORD=your_password_here" .env; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    sed -i "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$DB_PASSWORD/" .env
    echo -e "${GREEN}✅ DATABASE_PASSWORD gerado${NC}"
fi

# Iniciar Docker
echo -e "${BLUE}🐳 Iniciando Docker...${NC}"
sudo systemctl start docker
sudo systemctl enable docker

# Iniciar PostgreSQL e Redis
echo -e "${BLUE}🐳 Iniciando PostgreSQL e Redis...${NC}"
docker-compose up -d postgres redis

# Aguardar PostgreSQL estar pronto
echo -e "${BLUE}⏳ Aguardando PostgreSQL estar pronto...${NC}"
sleep 15

# Executar migrações
if [ -f "scripts/migrate.js" ]; then
    echo -e "${BLUE}🗄️  Executando migrações...${NC}"
    node scripts/migrate.js up
fi

# Executar seed (opcional)
read -p "Deseja executar seed com dados de teste? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/seed.js" ]; then
        echo -e "${BLUE}🌱 Executando seed...${NC}"
        node scripts/seed.js
    fi
fi

# Criar scripts de gerenciamento
echo -e "${BLUE}📝 Criando scripts de gerenciamento...${NC}"

cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando TSEL Backend..."
docker-compose up -d
echo "✅ TSEL Backend iniciado!"
echo "📊 Dashboard: http://localhost:3001"
echo "🔧 Health Check: http://localhost:3001/health"
EOF

cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Parando TSEL Backend..."
docker-compose down
echo "✅ TSEL Backend parado!"
EOF

cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Reiniciando TSEL Backend..."
docker-compose down
docker-compose up -d
echo "✅ TSEL Backend reiniciado!"
EOF

cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 Exibindo logs do TSEL Backend..."
docker-compose logs -f
EOF

chmod +x {start,stop,restart,logs}.sh

# Mostrar informações finais
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    INSTALAÇÃO CONCLUÍDA!                     ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}🎉 TSEL Backend instalado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Informações importantes:${NC}"
echo "  • API Base URL: http://localhost:3001/api"
echo "  • Health Check: http://localhost:3001/health"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo "  • Iniciar: ./start.sh"
echo "  • Parar: ./stop.sh"
echo "  • Reiniciar: ./restart.sh"
echo "  • Logs: ./logs.sh"
echo ""
echo -e "${BLUE}👤 Usuário padrão:${NC}"
echo "  • Email: admin@tsel.com"
echo "  • Senha: admin123"
echo ""
echo -e "${YELLOW}⚠️  Importante:${NC}"
echo "  • Faça logout e login para aplicar as mudanças do Docker"
echo "  • Ou execute: newgrp docker"
echo ""
echo -e "${GREEN}🚀 Para iniciar o sistema: ./start.sh${NC}"
