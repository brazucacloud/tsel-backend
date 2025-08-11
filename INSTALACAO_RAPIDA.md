# 🚀 TSEL Backend - Instalação Rápida

## ⚡ Pré-requisitos (Instalar Primeiro)

### 1. Node.js 18+
**Baixe e instale:** https://nodejs.org/

1. Acesse https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador
4. Reinicie o PowerShell após a instalação

**Verificar instalação:**
```powershell
node --version
npm --version
```

### 2. Docker Desktop
**Baixe e instale:** https://www.docker.com/products/docker-desktop/

1. Acesse https://www.docker.com/products/docker-desktop/
2. Baixe o Docker Desktop para Windows
3. Execute o instalador
4. Reinicie o computador após a instalação
5. Abra o Docker Desktop e aguarde inicialização

**Verificar instalação:**
```powershell
docker --version
```

## 🎯 Comando de Instalação

Após instalar Node.js e Docker, execute:

```powershell
# Navegar para o diretório do projeto
cd "C:\Users\HP\Documents\PROJETO BRAZUCA\BACKEND"

# Executar instalador
powershell -ExecutionPolicy Bypass -File install-complete.ps1
```

## 🔧 Se Node.js não for encontrado

Se mesmo após instalar o Node.js o comando não for reconhecido:

1. **Reinicie o PowerShell** (ou reinicie o computador)
2. **Verifique o PATH:**
   ```powershell
   $env:PATH -split ';' | Where-Object { $_ -like '*node*' }
   ```
3. **Instale manualmente o Node.js** se necessário

## 🐳 Se Docker não for encontrado

Se o Docker não for reconhecido:

1. **Abra o Docker Desktop**
2. **Aguarde a inicialização completa**
3. **Reinicie o PowerShell**
4. **Verifique se está rodando:**
   ```powershell
   docker ps
   ```

## 📋 Comandos Alternativos

Se o instalador não funcionar, execute manualmente:

```powershell
# 1. Instalar dependências
npm install

# 2. Instalar xlsx
npm install xlsx

# 3. Criar .env
Copy-Item env.example .env

# 4. Iniciar Docker
docker compose up -d

# 5. Executar migrações
npm run migrate

# 6. Executar seeds
npm run seed

# 7. Iniciar servidor
npm start
```

## 🎉 Após a Instalação

O sistema estará disponível em:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📞 Suporte

Se encontrar problemas:

1. **Verifique se Node.js está instalado:**
   ```powershell
   node --version
   ```

2. **Verifique se Docker está rodando:**
   ```powershell
   docker ps
   ```

3. **Verifique logs:**
   ```powershell
   docker compose logs
   ```

---

**💡 Dica:** Execute os comandos um por vez para identificar onde está o problema.
