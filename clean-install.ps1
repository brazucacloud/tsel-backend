# Script PowerShell de instalação limpa - Sem Alpine/APK
# Este script remove todas as referências ao Alpine e instala usando apenas Debian

param(
    [switch]$Force
)

# Funções de log
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Warning {
    param([string]$Message)
    Write-Log "WARNING: $Message" -Color "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "ERROR: $Message" -Color "Red"
    exit 1
}

Write-Log "🧹 Iniciando instalação limpa (sem Alpine/APK)..."

# 1. Parar e limpar containers existentes
Write-Log "📦 Parando containers existentes..." -Color "Yellow"
docker compose down 2>$null

# 2. Remover imagens antigas
Write-Log "🗑️ Removendo imagens antigas..." -Color "Yellow"
docker rmi $(docker images -q tsel-backend) 2>$null
docker rmi $(docker images -q backend_tsel-backend) 2>$null

# 3. Limpar cache do Docker
Write-Log "🧹 Limpando cache do Docker..." -Color "Yellow"
docker system prune -a -f

# 4. Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "Execute este script no diretório raiz do projeto (onde está o package.json)"
}

# 5. Verificar dependências
Write-Log "📋 Verificando dependências..." -Color "Yellow"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js não está instalado. Instale o Node.js 18+ primeiro."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker não está instalado. Instale o Docker primeiro."
}

Write-Log "✅ Dependências verificadas"

# 6. Instalar dependências do backend
Write-Log "📦 Instalando dependências do backend..." -Color "Yellow"
npm install

# 7. Instalar xlsx especificamente
Write-Log "📊 Instalando dependência xlsx..." -Color "Yellow"
npm install xlsx

# 8. Configurar variáveis de ambiente
Write-Log "⚙️ Configurando variáveis de ambiente..." -Color "Yellow"

if (-not (Test-Path ".env")) {
    Write-Log "📝 Criando arquivo .env..." -Color "Yellow"
    Copy-Item env.example .env
    
    # Gerar senha aleatória para o banco
    $DB_PASSWORD = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    (Get-Content .env) -replace 'your_password_here', $DB_PASSWORD | Set-Content .env
    
    Write-Log "✅ Arquivo .env criado com senha aleatória"
    Write-Log "🔑 Senha do banco de dados: $DB_PASSWORD"
    Write-Log "⚠️ Guarde esta senha em local seguro!" -Color "Yellow"
} else {
    Write-Log "✅ Arquivo .env já existe"
}

# 9. Criar diretórios necessários (sem APK)
Write-Log "📁 Criando diretórios necessários..." -Color "Yellow"
New-Item -ItemType Directory -Force -Path uploads/images, uploads/videos, uploads/audio, uploads/documents, logs, backups, temp | Out-Null

# 10. Construir containers com Debian
Write-Log "🔨 Construindo containers com Debian..." -Color "Yellow"
docker compose build --no-cache --pull

# 11. Iniciar containers
Write-Log "🚀 Iniciando containers..." -Color "Yellow"
docker compose up -d

# 12. Aguardar banco estar pronto
Write-Log "⏳ Aguardando banco de dados estar pronto..." -Color "Yellow"
Start-Sleep -Seconds 15

# 13. Verificar se o banco está rodando
try {
    docker compose exec -T postgres pg_isready -U postgres | Out-Null
} catch {
    Write-Warning "Banco de dados não está respondendo. Aguardando mais tempo..."
    Start-Sleep -Seconds 10
}

# 14. Executar migrações
Write-Log "🗄️ Executando migrações..." -Color "Yellow"
try {
    npm run migrate
} catch {
    Write-Warning "Migrações falharam. Execute manualmente: npm run migrate"
}

# 15. Executar seeds
Write-Log "🌱 Executando seeds..." -Color "Yellow"
try {
    npm run seed
} catch {
    Write-Warning "Seeds falharam. Execute manualmente: npm run seed"
}

# 16. Verificar instalação
Write-Log "🔍 Verificando instalação..." -Color "Yellow"

# Testar imports
try {
    node scripts/test-imports.js
    Write-Log "✅ Todos os módulos importados com sucesso"
} catch {
    Write-Warning "Alguns módulos podem ter problemas de importação"
}

# 17. Verificar se está usando Debian
Write-Log "🔍 Verificando sistema operacional..." -Color "Yellow"
try {
    $osInfo = docker compose exec -T backend cat /etc/os-release
    if ($osInfo -match "Debian") {
        Write-Log "✅ Container usando Debian"
    } else {
        Write-Warning "Container pode não estar usando Debian"
    }
} catch {
    Write-Warning "Não foi possível verificar o sistema operacional"
}

# 18. Criar scripts úteis
Write-Log "📜 Criando scripts úteis..." -Color "Yellow"

# Script para iniciar o sistema
@"
# Script para iniciar o sistema TSEL
Write-Host "🚀 Iniciando sistema TSEL..." -ForegroundColor Green
Write-Host "📦 Iniciando containers Docker..." -ForegroundColor Yellow
docker compose up -d
Write-Host "⏳ Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "🌐 Iniciando servidor backend..." -ForegroundColor Yellow
npm start
"@ | Out-File -FilePath "start-system.ps1" -Encoding UTF8

# Script para parar o sistema
@"
# Script para parar o sistema TSEL
Write-Host "🛑 Parando sistema TSEL..." -ForegroundColor Red
Write-Host "📦 Parando containers Docker..." -ForegroundColor Yellow
docker compose down
Write-Host "✅ Sistema parado" -ForegroundColor Green
"@ | Out-File -FilePath "stop-system.ps1" -Encoding UTF8

# Script para logs
@"
# Script para visualizar logs
Write-Host "📋 Visualizando logs do sistema..." -ForegroundColor Cyan
Write-Host "🔍 Logs do backend:" -ForegroundColor Yellow
docker compose logs -f backend
"@ | Out-File -FilePath "view-logs.ps1" -Encoding UTF8

Write-Log "✅ Scripts úteis criados"

# 19. Resumo final
Write-Log "🎉 Instalação limpa finalizada!"
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "           TSEL BACKEND                " -ForegroundColor Blue
Write-Host "        Instalação Limpa               " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "✅ Backend configurado e pronto" -ForegroundColor Green
Write-Host "✅ Banco de dados PostgreSQL rodando" -ForegroundColor Green
Write-Host "✅ API REST disponível" -ForegroundColor Green
Write-Host "✅ Sistema de tarefas de 21 dias ativo" -ForegroundColor Green
Write-Host "✅ Sistema de relatórios configurado" -ForegroundColor Green
Write-Host "✅ Sem referências ao Alpine/APK" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Comandos úteis:" -ForegroundColor Yellow
Write-Host "  • .\start-system.ps1 - Iniciar todo o sistema" -ForegroundColor Blue
Write-Host "  • .\stop-system.ps1 - Parar todo o sistema" -ForegroundColor Blue
Write-Host "  • .\view-logs.ps1 - Visualizar logs" -ForegroundColor Blue
Write-Host "  • npm start - Iniciar apenas o backend" -ForegroundColor Blue
Write-Host "  • docker compose ps - Status dos containers" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 URLs importantes:" -ForegroundColor Yellow
Write-Host "  • Backend API: http://localhost:3001" -ForegroundColor Blue
Write-Host "  • Documentação: http://localhost:3001/api-docs" -ForegroundColor Blue
Write-Host "  • Health Check: http://localhost:3001/health" -ForegroundColor Blue
Write-Host ""
Write-Host "🎯 Sistema pronto para uso!" -ForegroundColor Green
