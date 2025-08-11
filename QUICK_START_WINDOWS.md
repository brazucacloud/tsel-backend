# 🚀 TSEL Backend - Início Rápido (Windows)

## ⚡ Instalação em 3 Passos

### 1. Pré-requisitos
Certifique-se de ter instalado:
- ✅ **Node.js 18+** - [Download aqui](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download aqui](https://www.docker.com/products/docker-desktop/)

### 2. Executar Instalador
Abra o PowerShell como **Administrador** e execute:

```powershell
# Navegar para o diretório do projeto
cd "C:\Users\HP\Documents\PROJETO BRAZUCA\BACKEND"

# Executar instalador
.\install-complete.ps1
```

### 3. Iniciar Sistema
Após a instalação, execute:

```powershell
# Iniciar todo o sistema
.\start-system.ps1

# OU apenas o backend
npm start
```

## 🎯 URLs Importantes

- **API Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Documentação**: http://localhost:3000/api-docs

## 🛠️ Comandos Úteis

```powershell
# Ver status dos containers
docker compose ps

# Ver logs
.\view-logs.ps1

# Parar sistema
.\stop-system.ps1

# Reiniciar containers
docker compose restart
```

## 🔧 Se Algo Der Errado

### Docker não inicia:
```powershell
# Verificar se Docker Desktop está rodando
# Abrir Docker Desktop e aguardar inicialização
```

### Porta 3000 ocupada:
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :3000

# Parar processo ou mudar porta no .env
```

### Dependências não instalam:
```powershell
# Limpar cache
npm cache clean --force

# Reinstalar
npm install
```

### Docker build falha (problemas de rede):
```powershell
# Usar script de fallback automático
.\build-with-fallback.ps1

# OU tentar manualmente:
docker build --network=host --no-cache --pull -t tsel-backend .

# OU usar Dockerfile alternativo:
docker compose build --file Dockerfile.alternative --no-cache --pull
```

## 📊 Sistema de Tarefas de 21 Dias

Após a instalação, você terá acesso a:

- ✅ **Timeline de 21 dias** - Visualização das tarefas
- ✅ **Relatórios detalhados** - Métricas e progresso
- ✅ **Exportação de dados** - CSV e Excel
- ✅ **API completa** - Todos os endpoints

## 🎉 Pronto!

Seu sistema TSEL está configurado e pronto para uso!

---

**💡 Dica**: Use `.\install-complete.ps1 -SkipDocker` se não quiser usar Docker.
