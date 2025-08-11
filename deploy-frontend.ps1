# Script de Deploy do TSEL Frontend + Backend (PowerShell)
# Autor: TSEL Team
# Versão: 1.0

param(
    [switch]$SkipBuild,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"

# Função para log
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "Cyan" }
    }
    
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

# Verificar se Docker está instalado
function Test-Docker {
    try {
        $dockerVersion = docker --version
        $composeVersion = docker-compose --version
        Write-Log "Docker encontrado: $dockerVersion" "SUCCESS"
        Write-Log "Docker Compose encontrado: $composeVersion" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Docker não está instalado ou não está no PATH" "ERROR"
        Write-Log "Por favor, instale o Docker Desktop para Windows" "ERROR"
        return $false
    }
}

# Verificar se os arquivos necessários existem
function Test-RequiredFiles {
    $requiredFiles = @(
        "docker-compose.yml",
        "frontend/index.html",
        "frontend/app.js",
        "frontend/Dockerfile",
        "frontend/nginx.conf",
        "nginx.conf"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Log "Arquivo necessário não encontrado: $file" "ERROR"
            return $false
        }
    }
    
    Write-Log "Todos os arquivos necessários encontrados" "SUCCESS"
    return $true
}

# Parar containers existentes
function Stop-Containers {
    Write-Log "Parando containers existentes..."
    try {
        docker-compose down --remove-orphans
        Write-Log "Containers parados com sucesso" "SUCCESS"
    }
    catch {
        Write-Log "Erro ao parar containers: $($_.Exception.Message)" "WARN"
    }
}

# Limpar containers antigos
function Clear-Containers {
    if ($Force) {
        Write-Log "Limpando containers antigos..."
        try {
            docker-compose down -v --remove-orphans
            docker system prune -f
            Write-Log "Limpeza concluída" "SUCCESS"
        }
        catch {
            Write-Log "Erro na limpeza: $($_.Exception.Message)" "WARN"
        }
    }
}

# Construir e iniciar containers
function Start-Containers {
    Write-Log "Construindo e iniciando containers..."
    
    try {
        if (-not $SkipBuild) {
            Write-Log "Construindo imagens..."
            docker-compose build --no-cache
        }
        
        Write-Log "Iniciando containers..."
        docker-compose up -d
        
        Write-Log "Containers iniciados com sucesso!" "SUCCESS"
    }
    catch {
        Write-Log "Erro ao construir/iniciar containers: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Verificar status dos containers
function Test-ContainerStatus {
    Write-Log "Verificando status dos containers..."
    
    # Aguardar inicialização
    Start-Sleep -Seconds 10
    
    $containers = @(
        "tsel-backend",
        "tsel-frontend", 
        "tsel-postgres",
        "tsel-redis",
        "tsel-nginx"
    )
    
    $allRunning = $true
    
    foreach ($container in $containers) {
        try {
            $status = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String $container
            if ($status -and $status.ToString().Contains("Up")) {
                Write-Log "✅ $container está rodando" "SUCCESS"
            } else {
                Write-Log "❌ $container não está rodando" "ERROR"
                $allRunning = $false
            }
        }
        catch {
            Write-Log "❌ Erro ao verificar $container" "ERROR"
            $allRunning = $false
        }
    }
    
    return $allRunning
}

# Testar conectividade
function Test-Connectivity {
    Write-Log "Testando conectividade..."
    
    # Testar backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Backend está respondendo" "SUCCESS"
        } else {
            Write-Log "⚠️ Backend respondeu com status: $($response.StatusCode)" "WARN"
        }
    }
    catch {
        Write-Log "⚠️ Backend não está respondendo na porta 3001" "WARN"
    }
    
    # Testar frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Frontend está respondendo" "SUCCESS"
        } else {
            Write-Log "⚠️ Frontend respondeu com status: $($response.StatusCode)" "WARN"
        }
    }
    catch {
        Write-Log "⚠️ Frontend não está respondendo na porta 3000" "WARN"
    }
    
    # Testar nginx
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Nginx está respondendo" "SUCCESS"
        } else {
            Write-Log "⚠️ Nginx respondeu com status: $($response.StatusCode)" "WARN"
        }
    }
    catch {
        Write-Log "⚠️ Nginx não está respondendo na porta 80" "WARN"
    }
}

# Mostrar informações de acesso
function Show-AccessInfo {
    Write-Host ""
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Informações de Acesso:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
    Write-Host "   Nginx (HTTP): http://localhost:80" -ForegroundColor White
    Write-Host "   Nginx (HTTPS): https://localhost:443" -ForegroundColor White
    Write-Host ""
    Write-Host "🗄️ Banco de Dados:" -ForegroundColor Cyan
    Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "   Redis: localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Comandos úteis:" -ForegroundColor Cyan
    Write-Host "   Ver logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "   Parar: docker-compose down" -ForegroundColor White
    Write-Host "   Reiniciar: docker-compose restart" -ForegroundColor White
    Write-Host "   Status: docker-compose ps" -ForegroundColor White
    Write-Host ""
}

# Função principal
function Main {
    Write-Log "Iniciando deploy do TSEL..." "INFO"
    
    # Verificações
    if (-not (Test-Docker)) {
        exit 1
    }
    
    if (-not (Test-RequiredFiles)) {
        exit 1
    }
    
    # Deploy
    Stop-Containers
    Clear-Containers
    Start-Containers
    
    if (Test-ContainerStatus) {
        Test-Connectivity
        Show-AccessInfo
        Write-Log "Deploy concluído com sucesso! 🎉" "SUCCESS"
    } else {
        Write-Log "Falha no deploy. Verifique os logs com: docker-compose logs" "ERROR"
        exit 1
    }
}

# Executar função principal
try {
    Main
}
catch {
    Write-Log "Erro durante o deploy: $($_.Exception.Message)" "ERROR"
    exit 1
}
