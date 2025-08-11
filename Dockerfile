# Dockerfile para TSEL Backend - Debian Base
# Build timestamp: $(date) - Force cache invalidation
# FORÇAR USO DO DEBIAN - NÃO ALPINE!
# NUCLEAR REBUILD: $(date +%s)
FROM node:18-bullseye

# Configurar repositórios com múltiplos mirrors para melhor conectividade
RUN echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list

# Definir diretório de trabalho
WORKDIR /app

# Forçar reconstrução sem cache
ARG CACHEBUST=1

# Instalar dependências do sistema com múltiplos fallbacks e timeouts
RUN set -e; \
    # Primeira tentativa com mirrors padrão
    (apt-get update --option Acquire::Timeout=60 --option Acquire::Retries=3 && \
     apt-get install -y --no-install-recommends python3 make g++) || \
    # Segunda tentativa com mirrors alternativos
    (echo "Tentando mirrors alternativos..." && \
     echo "deb http://ftp.debian.org/debian bullseye main" > /etc/apt/sources.list && \
     echo "deb http://ftp.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
     echo "deb http://ftp.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list && \
     apt-get update --option Acquire::Timeout=60 --option Acquire::Retries=3 && \
     apt-get install -y --no-install-recommends python3 make g++) || \
    # Terceira tentativa com mirrors brasileiros
    (echo "Tentando mirrors brasileiros..." && \
     echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list && \
     echo "deb http://deb.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
     echo "deb http://deb.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list && \
     echo 'Acquire::http::Timeout "60";' > /etc/apt/apt.conf.d/99timeout && \
     echo 'Acquire::ftp::Timeout "60";' >> /etc/apt/apt.conf.d/99timeout && \
     apt-get update && \
     apt-get install -y --no-install-recommends python3 make g++) || \
    # Quarta tentativa - usar cache local se disponível
    (echo "Tentando com cache local..." && \
     apt-get update --option Acquire::http::Timeout=120 --option Acquire::Retries=5 && \
     apt-get install -y --no-install-recommends python3 make g++) || \
    # Última tentativa - instalar sem update
    (echo "Instalando sem update..." && \
     apt-get install -y --no-install-recommends python3 make g++ --allow-unauthenticated) && \
    rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com retry
RUN npm install --omit=dev --timeout=300000 || \
    (echo "Retry npm install..." && npm install --omit=dev --timeout=300000)

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups

# Definir permissões
RUN chmod +x scripts/*.js

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
