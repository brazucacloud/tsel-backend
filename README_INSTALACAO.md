# 🚀 TSEL Backend - Instalação Completa

## 📋 Resumo do Sistema

O TSEL Backend inclui:
- ✅ **API REST completa** com Node.js/Express
- ✅ **Banco PostgreSQL** com Docker
- ✅ **Sistema de tarefas de 21 dias** para WhatsApp chip warming
- ✅ **Sistema de relatórios** com exportação CSV/Excel
- ✅ **Frontend React** com timeline visual
- ✅ **Instalador automático** para Linux

## 🎯 Instalação Rápida (Linux)

### 1. Clonar o Repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd BACKEND
```

### 2. Instalar Pré-requisitos
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Logout e login novamente após adicionar ao grupo docker
```

### 3. Executar Instalador
```bash
chmod +x install-complete.sh
./install-complete.sh
```

## 🎉 Pronto!

O sistema estará disponível em:
- **API Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Documentação**: http://localhost:3000/api-docs

## 🛠️ Comandos Úteis

```bash
# Iniciar sistema
./start-system.sh

# Parar sistema
./stop-system.sh

# Ver logs
./view-logs.sh

# Status dos containers
docker-compose ps

# Reconstruir containers
docker-compose build --no-cache
```

## 📊 Funcionalidades Principais

### Sistema de Tarefas de 21 Dias
- Timeline visual com progresso
- Tarefas detalhadas para cada dia
- Sistema de conclusão de tarefas
- Relatórios de progresso

### API Endpoints
- `POST /api/daily-tasks/initialize/:deviceId` - Inicializar tarefas
- `GET /api/daily-tasks/device/:deviceId` - Listar tarefas do dispositivo
- `PUT /api/daily-tasks/:id/complete` - Completar tarefa
- `GET /api/daily-tasks/reports/overview` - Relatório geral
- `GET /api/daily-tasks/reports/export/:format` - Exportar dados

## 📚 Documentação

- `INSTALACAO_LINUX.md` - Guia completo de instalação
- `DAILY_TASKS_GUIDE.md` - Guia das tarefas de 21 dias
- `REPORTS_GUIDE.md` - Guia dos relatórios
- `FRONTEND_21_DAYS_GUIDE.md` - Guia do frontend

## 🔧 Troubleshooting

### Problema: Permissão negada
```bash
chmod +x *.sh
```

### Problema: Docker não encontrado
```bash
sudo systemctl start docker
```

### Problema: Porta 3000 em uso
```bash
sudo lsof -i :3000
```

## 🎯 Próximos Passos

1. **Configure usuários** através da API
2. **Adicione dispositivos** para as tarefas
3. **Inicialize tarefas** para um dispositivo
4. **Monitore progresso** através dos relatórios
5. **Personalize tarefas** conforme necessário

---

**💡 Dica:** Execute `./install-complete.sh` e aguarde a conclusão automática!
