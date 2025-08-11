#!/bin/bash

# 🚀 TSEL Backend - Instalador Eficiente
# Versão: 1.0
# Data: $(date +%Y-%m-%d)

set -e

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

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🚀 TSEL BACKEND                           ║
║                   Instalador Eficiente                       ║
║                                                              ║
║  Sistema completo: Node.js + PostgreSQL + Redis + Nginx     ║
║  Otimizado para Ubuntu 24.04 VPS                            ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

# Verificar sistema operacional
if [[ ! -f /etc/os-release ]]; then
    error "Sistema operacional não suportado"
fi

source /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
    warning "Este instalador foi testado em Ubuntu. Outros sistemas podem não funcionar corretamente."
fi

log "Iniciando instalação do TSEL Backend..."

# 1. Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências
log "Instalando dependências..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 3. Instalar Node.js 18
log "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar versão
NODE_VERSION=$(node --version)
log "Node.js instalado: $NODE_VERSION"

# 4. Instalar Docker
log "Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $SUDO_USER

# 5. Instalar Docker Compose
log "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 6. Configurar MTU para Docker (solução para problemas de conectividade)
log "Configurando MTU para Docker..."
mkdir -p /etc/docker

cat > /etc/docker/daemon.json << EOF
{
  "mtu": 1420,
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF

# 7. Reiniciar Docker
log "Reiniciando Docker..."
systemctl restart docker
systemctl enable docker

# 8. Criar diretório do projeto
PROJECT_DIR="/opt/tsel-backend"
log "Criando diretório do projeto: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 9. Clonar repositório (se não existir)
if [[ ! -d ".git" ]]; then
    log "Clonando repositório..."
    git clone https://github.com/brazucacloud/tsel-backend.git .
else
    log "Atualizando repositório existente..."
    git pull origin master
fi

# 10. Criar arquivo de configuração do banco (sem SSL)
log "Criando configuração do banco de dados..."
mkdir -p config

cat > config/database.js << 'EOF'
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tsel_db',
  user: process.env.DB_USER || 'tsel_user',
  password: process.env.DB_PASSWORD || 'tsel_password',
  max: parseInt(process.env.DB_POOL_SIZE) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Query executada em ${duration}ms: ${text}`);
    return result;
  } catch (error) {
    console.error(`Erro na query: ${text}`, error);
    throw error;
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
EOF

# 11. Criar configuração do Nginx (sem SSL)
log "Criando configuração do Nginx..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server tsel-backend:3001;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 12. Criar diretórios necessários
log "Criando diretórios..."
mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups

# 13. Configurar permissões
log "Configurando permissões..."
chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 14. Parar containers existentes (se houver)
log "Parando containers existentes..."
docker compose down 2>/dev/null || true

# 15. Remover volumes antigos (se houver)
log "Limpando volumes antigos..."
docker volume rm tsel-backend_postgres_data 2>/dev/null || true
docker volume rm tsel-backend_redis_data 2>/dev/null || true

# 16. Build e iniciar containers
log "Construindo e iniciando containers..."
docker compose build --no-cache tsel-backend
docker compose up -d

# 17. Aguardar inicialização
log "Aguardando inicialização dos serviços..."
sleep 30

# 18. Verificar status
log "Verificando status dos containers..."
docker ps

# 19. Testar conectividade
log "Testando conectividade..."

# Aguardar backend ficar saudável
for i in {1..60}; do
    if docker ps | grep -q "tsel-backend.*healthy"; then
        log "Backend está saudável!"
        break
    fi
    if [[ $i -eq 60 ]]; then
        warning "Backend não ficou saudável em 60 segundos"
    fi
    sleep 1
done

# 20. Testar endpoints
log "Testando endpoints..."

# Testar backend diretamente
if curl -s http://localhost:3001/health > /dev/null; then
    log "✅ Backend respondendo na porta 3001"
else
    warning "⚠️ Backend não respondeu na porta 3001"
fi

# Testar nginx
if curl -s http://localhost:80 > /dev/null; then
    log "✅ Nginx respondendo na porta 80"
else
    warning "⚠️ Nginx não respondeu na porta 80"
fi

# 21. Criar script de gerenciamento
log "Criando script de gerenciamento..."
cat > /usr/local/bin/tsel-backend << 'EOF'
#!/bin/bash

PROJECT_DIR="/opt/tsel-backend"

case "$1" in
    start)
        cd $PROJECT_DIR
        docker compose up -d
        echo "TSEL Backend iniciado"
        ;;
    stop)
        cd $PROJECT_DIR
        docker compose down
        echo "TSEL Backend parado"
        ;;
    restart)
        cd $PROJECT_DIR
        docker compose restart
        echo "TSEL Backend reiniciado"
        ;;
    status)
        cd $PROJECT_DIR
        docker compose ps
        ;;
    logs)
        cd $PROJECT_DIR
        docker compose logs -f
        ;;
    update)
        cd $PROJECT_DIR
        git pull origin master
        docker compose build --no-cache tsel-backend
        docker compose up -d
        echo "TSEL Backend atualizado"
        ;;
    backup)
        cd $PROJECT_DIR
        docker compose exec postgres pg_dump -U tsel_user tsel_db > backup_$(date +%Y%m%d_%H%M%S).sql
        echo "Backup criado"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|update|backup}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/tsel-backend

# 22. Criar serviço systemd
log "Criando serviço systemd..."
cat > /etc/systemd/system/tsel-backend.service << EOF
[Unit]
Description=TSEL Backend
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tsel-backend

# 23. Mostrar informações finais
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    ✅ INSTALAÇÃO CONCLUÍDA!                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "TSEL Backend instalado com sucesso!"
log "Diretório do projeto: $PROJECT_DIR"
log ""

echo -e "${BLUE}📋 COMANDOS ÚTEIS:${NC}"
echo "  tsel-backend start    - Iniciar serviços"
echo "  tsel-backend stop     - Parar serviços"
echo "  tsel-backend restart  - Reiniciar serviços"
echo "  tsel-backend status   - Ver status"
echo "  tsel-backend logs     - Ver logs"
echo "  tsel-backend update   - Atualizar sistema"
echo "  tsel-backend backup   - Criar backup"
echo ""

echo -e "${BLUE}🌐 ACESSO:${NC}"
echo "  Backend: http://$(hostname -I | awk '{print $1}'):3001"
echo "  Nginx:   http://$(hostname -I | awk '{print $1}'):80"
echo ""

echo -e "${BLUE}📁 DIRETÓRIOS:${NC}"
echo "  Projeto: $PROJECT_DIR"
echo "  Logs:    $PROJECT_DIR/logs"
echo "  Uploads: $PROJECT_DIR/uploads"
echo ""

echo -e "${BLUE}🔧 CONFIGURAÇÃO:${NC}"
echo "  PostgreSQL: localhost:5432"
echo "  Redis:      localhost:6379"
echo "  MTU Docker: 1420 (configurado)"
echo ""

log "Instalação concluída! O sistema está pronto para uso."
