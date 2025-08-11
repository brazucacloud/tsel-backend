# 🚀 TSEL Backend - Instalação Linux

## ⚡ Pré-requisitos (Instalar Primeiro)

### 1. Node.js 18+
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Docker
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# CentOS/RHEL/Fedora
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker-compose --version
```

**⚠️ IMPORTANTE:** Após adicionar o usuário ao grupo docker, faça logout e login novamente.

## 🎯 Comando de Instalação

```bash
# 1. Navegar para o diretório do projeto
cd /caminho/para/BACKEND

# 2. Tornar o script executável
chmod +x install-complete.sh

# 3. Executar instalador
./install-complete.sh
```

## 🔧 Opções de Instalação

### Instalação Completa (Recomendada)
```bash
./install-complete.sh
```

### Instalação Sem Docker
```bash
./install-complete.sh --skip-docker
```

### Instalação Sem Frontend
```bash
./install-complete.sh --skip-frontend
```

## 📋 Comandos Alternativos (Instalação Manual)

Se o instalador não funcionar, execute manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Instalar xlsx
npm install xlsx

# 3. Criar .env
cp env.example .env

# 4. Criar diretórios
mkdir -p uploads logs temp

# 5. Iniciar Docker
docker-compose up -d

# 6. Aguardar banco estar pronto
sleep 10

# 7. Executar migrações
npm run migrate

# 8. Executar seeds
npm run seed

# 9. Iniciar servidor
npm start
```

## 🛠️ Scripts Úteis Criados

Após a instalação, você terá:

```bash
# Iniciar sistema
./start-system.sh

# Parar sistema
./stop-system.sh

# Ver logs
./view-logs.sh
```

## 🎉 Após a Instalação

O sistema estará disponível em:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Documentação**: http://localhost:3000/api-docs

## 🔍 Troubleshooting

### Problema: Permissão negada
```bash
# Dar permissão de execução
chmod +x install-complete.sh
chmod +x *.sh
```

### Problema: Docker não encontrado
```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker
```

### Problema: Porta 3000 em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :3000

# Parar processo ou mudar porta no .env
```

### Problema: Node.js não encontrado
```bash
# Verificar instalação
which node
which npm

# Reinstalar se necessário
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📊 Sistema de Tarefas de 21 Dias

Após a instalação, você terá acesso a:

- ✅ **Timeline de 21 dias** - Visualização das tarefas
- ✅ **Relatórios detalhados** - Métricas e progresso
- ✅ **Exportação de dados** - CSV e Excel
- ✅ **API completa** - Todos os endpoints

## 🐳 Verificar Containers

```bash
# Status dos containers
docker-compose ps

# Logs dos containers
docker-compose logs -f

# Parar containers
docker-compose down

# Reconstruir containers
docker-compose build --no-cache
```

## 📚 Documentação

- `README.md` - Documentação principal
- `API_DOCUMENTATION.md` - Documentação da API
- `DAILY_TASKS_GUIDE.md` - Guia das tarefas de 21 dias
- `REPORTS_GUIDE.md` - Guia dos relatórios

## 🎯 Próximos Passos

Após a instalação:

1. **Configure usuários** através da API
2. **Adicione dispositivos** para as tarefas
3. **Inicialize tarefas** para um dispositivo
4. **Monitore progresso** através dos relatórios
5. **Personalize tarefas** conforme necessário

---

**💡 Dica:** Execute `./install-complete.sh` e aguarde a conclusão automática!
