# TSEL Backend - Guia do Instalador Completo

## 📋 Visão Geral

Este guia explica como usar o **Instalador Completo** do TSEL Backend, que automatiza toda a configuração do sistema, incluindo:

- ✅ Instalação de dependências
- ✅ Configuração do banco de dados PostgreSQL
- ✅ Configuração do Docker
- ✅ Sistema de tarefas de 21 dias
- ✅ Sistema de relatórios
- ✅ Configuração do frontend (se disponível)
- ✅ Scripts úteis para gerenciamento

## 🚀 Instalação Rápida

### Para Linux/macOS:
```bash
chmod +x install-complete.sh
./install-complete.sh
```

### Para Windows (PowerShell):
```powershell
.\install-complete.ps1
```

## 📦 Pré-requisitos

### Obrigatórios:
- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **npm** - Vem com o Node.js

### Opcionais:
- **Docker** - [Download aqui](https://www.docker.com/products/docker-desktop/)
- **Git** - Para clonar o repositório

## 🔧 Opções de Instalação

### Instalação Completa (Recomendada)
```bash
./install-complete.sh
```
- Instala tudo automaticamente
- Configura Docker se disponível
- Configura frontend se encontrado

### Instalação Sem Docker
```bash
./install-complete.sh --skip-docker
```
- Instala backend e dependências
- Você precisará configurar PostgreSQL manualmente

### Instalação Sem Frontend
```bash
./install-complete.sh --skip-frontend
```
- Instala apenas o backend
- Frontend pode ser configurado posteriormente

## 📁 Estrutura Criada

Após a instalação, você terá:

```
BACKEND/
├── install-complete.sh          # Instalador Linux/macOS
├── install-complete.ps1         # Instalador Windows
├── start-system.sh              # Script para iniciar sistema
├── stop-system.sh               # Script para parar sistema
├── view-logs.sh                 # Script para visualizar logs
├── start-system.ps1             # Script PowerShell para iniciar
├── stop-system.ps1              # Script PowerShell para parar
├── view-logs.ps1                # Script PowerShell para logs
├── .env                         # Variáveis de ambiente (criado automaticamente)
├── uploads/                     # Diretório para uploads
├── logs/                        # Diretório para logs
└── temp/                        # Diretório temporário
```

## 🔐 Configuração de Segurança

### Senha do Banco de Dados
O instalador gera automaticamente uma senha aleatória para o banco PostgreSQL:

```bash
# Exemplo de saída:
🔑 Senha do banco de dados: xK9mP2nQ8vR5sT7uV3wX1yZ4aB6cD9eF
⚠️ Guarde esta senha em local seguro!
```

**⚠️ IMPORTANTE:** Guarde esta senha! Ela será necessária para:
- Acessar o banco diretamente
- Configurar ferramentas de administração
- Troubleshooting

## 🐳 Configuração Docker

### Containers Criados:
- **postgres**: Banco de dados PostgreSQL
- **redis**: Cache Redis
- **nginx**: Proxy reverso
- **tsel-backend**: Aplicação principal

### Verificar Status:
```bash
docker compose ps
```

### Logs dos Containers:
```bash
docker compose logs -f
```

## 📊 Sistema de Tarefas de 21 Dias

O instalador configura automaticamente:

### Backend:
- ✅ Modelo `DailyTask` com todas as tarefas
- ✅ API endpoints para gerenciamento
- ✅ Sistema de progresso
- ✅ Relatórios detalhados

### Frontend:
- ✅ Componente `Timeline21Days` refatorado
- ✅ Componente `DailyTaskReports` para relatórios
- ✅ Integração com API

## 📈 Sistema de Relatórios

### Funcionalidades:
- ✅ Relatórios de visão geral
- ✅ Relatórios por dispositivo
- ✅ Exportação em CSV e Excel
- ✅ Métricas de progresso
- ✅ Análises temporais

### Endpoints Disponíveis:
- `GET /api/daily-tasks/reports/overview`
- `GET /api/daily-tasks/reports/device/:deviceId`
- `GET /api/daily-tasks/reports/export/:format`

## 🛠️ Scripts Úteis

### Iniciar Sistema:
```bash
# Linux/macOS
./start-system.sh

# Windows
.\start-system.ps1
```

### Parar Sistema:
```bash
# Linux/macOS
./stop-system.sh

# Windows
.\stop-system.ps1
```

### Visualizar Logs:
```bash
# Linux/macOS
./view-logs.sh

# Windows
.\view-logs.ps1
```

## 🌐 URLs Importantes

Após a instalação, acesse:

- **API Backend**: http://localhost:3000
- **Documentação**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Frontend**: http://localhost:3001 (se configurado)

## 📚 Documentação

### Guias Disponíveis:
- `README.md` - Documentação principal
- `API_DOCUMENTATION.md` - Documentação da API
- `DAILY_TASKS_GUIDE.md` - Guia das tarefas de 21 dias
- `REPORTS_GUIDE.md` - Guia dos relatórios
- `FRONTEND_21_DAYS_GUIDE.md` - Guia do frontend

## 🔍 Troubleshooting

### Problema: Docker não encontrado
```bash
# Solução: Instalar Docker
# Linux: https://docs.docker.com/engine/install/
# Windows: https://docs.docker.com/desktop/install/windows/
# macOS: https://docs.docker.com/desktop/install/mac/
```

### Problema: Node.js versão antiga
```bash
# Verificar versão
node --version

# Instalar versão 18+
# https://nodejs.org/
```

### Problema: Porta 3000 em uso
```bash
# Verificar o que está usando a porta
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Parar processo ou mudar porta no .env
```

### Problema: Banco não conecta
```bash
# Verificar logs do PostgreSQL
docker compose logs postgres

# Verificar se o container está rodando
docker compose ps

# Reiniciar containers
docker compose restart
```

### Problema: Dependências não instalam
```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Atualização

Para atualizar o sistema:

```bash
# 1. Parar sistema
./stop-system.sh

# 2. Atualizar código
git pull

# 3. Reinstalar dependências
npm install

# 4. Reconstruir containers
docker compose build --no-cache

# 5. Iniciar sistema
./start-system.sh
```

## 📞 Suporte

### Logs Úteis:
```bash
# Logs do backend
docker compose logs -f backend

# Logs do banco
docker compose logs -f postgres

# Logs do nginx
docker compose logs -f nginx
```

### Verificação de Saúde:
```bash
# Health check da API
curl http://localhost:3000/health

# Status dos containers
docker compose ps

# Uso de recursos
docker stats
```

## 🎯 Próximos Passos

Após a instalação:

1. **Configure usuários** através da API
2. **Adicione dispositivos** para as tarefas
3. **Inicialize tarefas** para um dispositivo
4. **Monitore progresso** através dos relatórios
5. **Personalize tarefas** conforme necessário

## ✅ Checklist de Verificação

- [ ] Node.js 18+ instalado
- [ ] Docker instalado (opcional)
- [ ] Instalador executado com sucesso
- [ ] Banco de dados rodando
- [ ] API respondendo em http://localhost:3000
- [ ] Frontend configurado (se aplicável)
- [ ] Scripts úteis criados
- [ ] Documentação lida

---

**🎉 Parabéns! Seu sistema TSEL está pronto para uso!**
