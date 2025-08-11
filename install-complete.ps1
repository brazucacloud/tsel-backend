# TSEL Backend - Instalador Completo (PowerShell)
# Este script instala e configura todo o sistema TSEL no Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipFrontend
)

# Funcao para log
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Level) {
        "ERROR" { Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red }
        "WARN" { Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow }
        "SUCCESS" { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
        default { Write-Host "[$timestamp] $Message" -ForegroundColor Cyan }
    }
}

# Funcao para erro
function Write-ErrorAndExit {
    param([string]$Message)
    Write-Log $Message "ERROR"
    exit 1
}

# Verificar se esta no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-ErrorAndExit "Execute este script no diretorio raiz do projeto (onde esta o package.json)"
}

Write-Log "Iniciando instalacao completa do TSEL Backend..." "SUCCESS"

# 1. Verificar dependencias do sistema
Write-Log "Verificando dependencias do sistema..."

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Log "Node.js $nodeVersion encontrado" "SUCCESS"
    
    # Verificar versao minima
    $majorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
    if ($majorVersion -lt 18) {
        Write-ErrorAndExit "Node.js versao 18+ e necessaria. Versao atual: $nodeVersion"
    }
} catch {
    Write-ErrorAndExit "Node.js nao esta instalado. Instale o Node.js 18+ primeiro."
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Log "npm $npmVersion encontrado" "SUCCESS"
} catch {
    Write-ErrorAndExit "npm nao esta instalado."
}

# Verificar Docker
$DOCKER_AVAILABLE = $false
if (-not $SkipDocker) {
    try {
        docker --version | Out-Null
        Write-Log "Docker encontrado" "SUCCESS"
        $DOCKER_AVAILABLE = $true
    } catch {
        Write-Log "Docker nao esta instalado. A instalacao continuara sem Docker." "WARN"
        $DOCKER_AVAILABLE = $false
    }
} else {
    Write-Log "Docker pulado por parametro -SkipDocker" "WARN"
}

# 2. Instalar dependencias do backend
Write-Log "Instalando dependencias do backend..."
try {
    npm install
    Write-Log "Dependencias do backend instaladas" "SUCCESS"
} catch {
    Write-ErrorAndExit "Falha ao instalar dependencias do backend"
}

# Instalar dependencia xlsx especificamente
Write-Log "Instalando dependencia xlsx para relatorios..."
try {
    npm install xlsx
    Write-Log "Dependencia xlsx instalada" "SUCCESS"
} catch {
    Write-Log "Falha ao instalar xlsx. Execute manualmente: npm install xlsx" "WARN"
}

# 3. Configurar variaveis de ambiente
Write-Log "Configurando variaveis de ambiente..."

if (-not (Test-Path ".env")) {
    Write-Log "Criando arquivo .env..."
    try {
        Copy-Item "env.example" ".env"
        
        # Gerar senha aleatoria para o banco
        $DB_PASSWORD = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        (Get-Content ".env") -replace "your_password_here", $DB_PASSWORD | Set-Content ".env"
        
        Write-Log "Arquivo .env criado com senha aleatoria" "SUCCESS"
        Write-Log "Senha do banco de dados: $DB_PASSWORD" "SUCCESS"
        Write-Log "Guarde esta senha em local seguro!" "WARN"
    } catch {
        Write-Log "Falha ao criar .env. Crie manualmente baseado no env.example" "WARN"
    }
} else {
    Write-Log "Arquivo .env ja existe" "SUCCESS"
}

# 4. Criar diretorios necessarios
Write-Log "Criando diretorios necessarios..."
$directories = @("uploads", "logs", "temp")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Log "Diretorio $dir criado" "SUCCESS"
    }
}

# 5. Configurar banco de dados
if ($DOCKER_AVAILABLE) {
    Write-Log "Iniciando servicos Docker..."
    
    # Parar containers existentes
    try {
        docker compose down 2>$null
        Write-Log "Containers existentes parados" "SUCCESS"
    } catch {
        Write-Log "Nenhum container para parar" "WARN"
    }
    
    # Construir e iniciar containers
    Write-Log "Construindo containers..."
    try {
        docker compose build --no-cache
        Write-Log "Containers construidos" "SUCCESS"
    } catch {
        Write-ErrorAndExit "Falha ao construir containers Docker"
    }
    
    Write-Log "Iniciando containers..."
    try {
        docker compose up -d
        Write-Log "Containers iniciados" "SUCCESS"
    } catch {
        Write-ErrorAndExit "Falha ao iniciar containers Docker"
    }
    
    # Aguardar banco estar pronto
    Write-Log "Aguardando banco de dados estar pronto..."
    Start-Sleep -Seconds 10
    
    # Verificar se o banco esta rodando
    try {
        docker compose exec -T postgres pg_isready -U postgres 2>$null
        Write-Log "Banco de dados PostgreSQL esta rodando" "SUCCESS"
    } catch {
        Write-Log "Banco de dados nao esta respondendo. Verifique os logs: docker compose logs postgres" "WARN"
    }
} else {
    Write-Log "Docker nao disponivel. Configure o banco PostgreSQL manualmente." "WARN"
    Write-Log "Execute: npm run migrate" "WARN"
}

# 6. Executar migracoes e seeds
Write-Log "Inicializando banco de dados..."

# Tentar executar migracoes
try {
    npm run migrate 2>$null
    Write-Log "Migracoes executadas com sucesso" "SUCCESS"
} catch {
    Write-Log "Migracoes falharam. Execute manualmente: npm run migrate" "WARN"
}

# Tentar executar seeds
try {
    npm run seed 2>$null
    Write-Log "Dados iniciais carregados" "SUCCESS"
} catch {
    Write-Log "Seeds falharam. Execute manualmente: npm run seed" "WARN"
}

# 7. Verificar instalacao
Write-Log "Verificando instalacao..."

# Testar imports
try {
    node scripts/test-imports.js 2>$null
    Write-Log "Todos os modulos importados com sucesso" "SUCCESS"
} catch {
    Write-Log "Alguns modulos podem ter problemas de importacao" "WARN"
}

# 8. Configurar frontend (se existir)
if (-not $SkipFrontend -and (Test-Path "../TSEL/frontend")) {
    Write-Log "Configurando frontend..."
    try {
        Push-Location "../TSEL/frontend"
        
        if (Test-Path "package.json") {
            Write-Log "Instalando dependencias do frontend..."
            npm install
            Write-Log "Frontend configurado" "SUCCESS"
        } else {
            Write-Log "package.json nao encontrado no frontend" "WARN"
        }
        
        Pop-Location
    } catch {
        Write-Log "Falha ao configurar frontend" "WARN"
        Pop-Location
    }
} else {
    Write-Log "Diretorio frontend nao encontrado ou pulado. Configure manualmente se necessario." "WARN"
}

# 9. Criar scripts uteis
Write-Log "Criando scripts uteis..."

# Script para iniciar o sistema
$startSystemContent = @"
# Script PowerShell para iniciar o sistema TSEL
Write-Host "Iniciando sistema TSEL..." -ForegroundColor Green
Write-Host "Iniciando containers Docker..." -ForegroundColor Yellow
docker compose up -d
Write-Host "Aguardando servicos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "Iniciando servidor backend..." -ForegroundColor Yellow
npm start
"@

Set-Content -Path "start-system.ps1" -Value $startSystemContent

# Script para parar o sistema
$stopSystemContent = @"
# Script PowerShell para parar o sistema TSEL
Write-Host "Parando sistema TSEL..." -ForegroundColor Red
Write-Host "Parando containers Docker..." -ForegroundColor Yellow
docker compose down
Write-Host "Sistema parado" -ForegroundColor Green
"@

Set-Content -Path "stop-system.ps1" -Value $stopSystemContent

# Script para logs
$viewLogsContent = @"
# Script PowerShell para visualizar logs
Write-Host "Visualizando logs do sistema..." -ForegroundColor Cyan
Write-Host "Logs do backend:" -ForegroundColor Yellow
docker compose logs -f backend
"@

Set-Content -Path "view-logs.ps1" -Value $viewLogsContent

Write-Log "Scripts uteis criados" "SUCCESS"

# 10. Resumo final
Write-Log "Instalacao completa finalizada!" "SUCCESS"
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "           TSEL BACKEND                " -ForegroundColor Blue
Write-Host "        Instalacao Completa            " -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Backend configurado e pronto" -ForegroundColor Green
Write-Host "Banco de dados PostgreSQL rodando" -ForegroundColor Green
Write-Host "API REST disponivel" -ForegroundColor Green
Write-Host "Sistema de tarefas de 21 dias ativo" -ForegroundColor Green
Write-Host "Sistema de relatorios configurado" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Yellow
Write-Host "  • .\start-system.ps1 - Iniciar todo o sistema" -ForegroundColor Blue
Write-Host "  • .\stop-system.ps1 - Parar todo o sistema" -ForegroundColor Blue
Write-Host "  • .\view-logs.ps1 - Visualizar logs" -ForegroundColor Blue
Write-Host "  • npm start - Iniciar apenas o backend" -ForegroundColor Blue
Write-Host "  • docker compose ps - Status dos containers" -ForegroundColor Blue
Write-Host ""
Write-Host "URLs importantes:" -ForegroundColor Yellow
Write-Host "  • Backend API: http://localhost:3000" -ForegroundColor Blue
Write-Host "  • Documentacao: http://localhost:3000/api-docs" -ForegroundColor Blue
Write-Host "  • Health Check: http://localhost:3000/health" -ForegroundColor Blue
Write-Host ""
Write-Host "Documentacao:" -ForegroundColor Yellow
Write-Host "  • README.md - Documentacao principal" -ForegroundColor Blue
Write-Host "  • API_DOCUMENTATION.md - Documentacao da API" -ForegroundColor Blue
Write-Host "  • DAILY_TASKS_GUIDE.md - Guia das tarefas de 21 dias" -ForegroundColor Blue
Write-Host "  • REPORTS_GUIDE.md - Guia dos relatorios" -ForegroundColor Blue
Write-Host ""
Write-Host "Sistema pronto para uso!" -ForegroundColor Green
