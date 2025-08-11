# Script PowerShell para forçar reconstrução completa do Docker

Write-Host "🔄 Forçando reconstrução completa do Docker..." -ForegroundColor Green

# Parar todos os containers
Write-Host "📦 Parando containers..." -ForegroundColor Yellow
docker compose down

# Remover todas as imagens relacionadas ao projeto
Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
docker rmi $(docker images -q tsel-backend) 2>$null
docker rmi $(docker images -q backend_tsel-backend) 2>$null

# Limpar cache do Docker
Write-Host "🧹 Limpando cache do Docker..." -ForegroundColor Yellow
docker system prune -a -f

# Reconstruir sem cache
Write-Host "🔨 Reconstruindo sem cache..." -ForegroundColor Yellow
docker compose build --no-cache

# Iniciar containers
Write-Host "🚀 Iniciando containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "✅ Reconstrução completa finalizada!" -ForegroundColor Green
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker compose ps
