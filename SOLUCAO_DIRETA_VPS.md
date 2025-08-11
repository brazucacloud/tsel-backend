# 🚀 SOLUÇÃO DIRETA PARA VPS - SEM DOWNLOADS

## ⚡ Execute estes comandos DIRETAMENTE no seu VPS:

```bash
# 1. Resolver conflito git
cd ~/tsel-backend
git stash
git fetch origin
git reset --hard origin/master

# 2. Verificar se Dockerfile.ubuntu tem problema
grep -n "nameserver" Dockerfile.ubuntu

# 3. Se encontrar linhas com "nameserver", remover:
sed -i '/nameserver 8.8.8.8/d' Dockerfile.ubuntu
sed -i '/nameserver 8.8.4.4/d' Dockerfile.ubuntu
sed -i '/Configurar DNS e resolver/d' Dockerfile.ubuntu

# 4. Verificar se foi removido
grep -n "nameserver" Dockerfile.ubuntu

# 5. Tentar build
docker build --file Dockerfile.ubuntu --no-cache --pull -t tsel-backend .

# 6. Se funcionar, iniciar serviços
docker compose up -d
```

## 🔧 Se o comando acima falhar, tente:

```bash
# Build com docker-compose
docker compose build --no-cache --pull tsel-backend
docker compose up -d
```

## 🎯 Comandos de verificação:

```bash
# Verificar containers
docker compose ps

# Ver logs
docker compose logs -f

# Testar API
curl http://localhost:3001/health
```

## 📊 URLs após sucesso:

- **API**: http://localhost:3001
- **Health**: http://localhost:3001/health
- **Docs**: http://localhost:3001/api-docs
