# Script PowerShell para build com fallbacks para problemas de conectividade
Write-Host "🚀 TSEL Backend - Build com Fallbacks" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Função para tentar build com diferentes configurações
function Try-Build {
    param(
        [string]$Dockerfile,
        [string]$Description
    )
    
    Write-Host ""
    Write-Host "🔄 Tentando: $Description" -ForegroundColor Yellow
    Write-Host "📁 Dockerfile: $Dockerfile" -ForegroundColor Cyan
    Write-Host "⏳ Aguarde..." -ForegroundColor Gray
    
    try {
        if ($Dockerfile -eq "default") {
            docker compose build --no-cache --pull tsel-backend
        } else {
            docker compose build --no-cache --pull --file "$Dockerfile" tsel-backend
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Sucesso com $Description!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Falhou com $Description" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Opção 1: Build com Dockerfile principal (melhorado)
Write-Host "1️⃣ Tentando build com Dockerfile principal (melhorado)..." -ForegroundColor Blue
if (Try-Build -Dockerfile "Dockerfile" -Description "Dockerfile principal com fallbacks") {
    Write-Host "🎉 Build concluído com sucesso!" -ForegroundColor Green
    exit 0
}

# Opção 2: Build com Dockerfile alternativo (Ubuntu)
Write-Host "2️⃣ Tentando build com Dockerfile alternativo (Ubuntu)..." -ForegroundColor Blue
if (Try-Build -Dockerfile "Dockerfile.alternative" -Description "Dockerfile Ubuntu") {
    Write-Host "🎉 Build concluído com sucesso!" -ForegroundColor Green
    exit 0
}

# Opção 3: Build com configurações de rede específicas
Write-Host "3️⃣ Tentando build com configurações de rede específicas..." -ForegroundColor Blue
$env:DOCKER_BUILDKIT = "1"
$env:BUILDKIT_PROGRESS = "plain"

if (Try-Build -Dockerfile "default" -Description "Build com BuildKit") {
    Write-Host "🎉 Build concluído com sucesso!" -ForegroundColor Green
    exit 0
}

# Opção 4: Build sem dependências do sistema (se possível)
Write-Host "4️⃣ Tentando build minimalista..." -ForegroundColor Blue

$minimalDockerfile = @"
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --timeout=300000
COPY . .
RUN mkdir -p uploads/images uploads/videos uploads/audio uploads/documents logs backups
RUN chmod +x scripts/*.js
EXPOSE 3001
CMD ["node", "server.js"]
"@

$minimalDockerfile | Out-File -FilePath "Dockerfile.minimal" -Encoding UTF8

if (Try-Build -Dockerfile "Dockerfile.minimal" -Description "Dockerfile minimalista") {
    Write-Host "🎉 Build concluído com sucesso!" -ForegroundColor Green
    Remove-Item "Dockerfile.minimal" -Force
    exit 0
}

# Se chegou até aqui, todas as tentativas falharam
Write-Host ""
Write-Host "❌ Todas as tentativas de build falharam!" -ForegroundColor Red
Write-Host ""
Write-Host "🔧 Sugestões para resolver:" -ForegroundColor Yellow
Write-Host "1. Verifique sua conexão com a internet" -ForegroundColor White
Write-Host "2. Tente usar uma VPN ou proxy" -ForegroundColor White
Write-Host "3. Execute: docker system prune -a" -ForegroundColor White
Write-Host "4. Tente em um horário diferente" -ForegroundColor White
Write-Host "5. Use: docker build --network=host ." -ForegroundColor White
Write-Host ""
Write-Host "💡 Comando alternativo para tentar:" -ForegroundColor Cyan
Write-Host "docker build --network=host --no-cache --pull -t tsel-backend ." -ForegroundColor Gray
