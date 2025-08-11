# Dockerfile para TSEL Backend - Debian Base
# Build timestamp: $(date) - Force cache invalidation
# FORÇAR USO DO DEBIAN - NÃO ALPINE!
# NUCLEAR REBUILD: $(date +%s)
FROM node:18-bullseye

# Configurar repositórios para melhor conectividade
RUN echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list

# Definir diretório de trabalho
WORKDIR /app

# Forçar reconstrução sem cache
ARG CACHEBUST=1

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

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
