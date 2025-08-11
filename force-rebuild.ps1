# Script PowerShell para forçar reconstrução completa do Docker
# Este script garante que o Debian seja usado

Write-Host "🔄 Forçando reconstrução completa do Docker..." -ForegroundColor Green
Write-Host "📦 Parando containers..." -ForegroundColor Yellow
docker compose down

Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
docker rmi $(docker images -q tsel-backend) 2>$null
docker rmi $(docker images -q backend_tsel-backend) 2>$null

Write-Host "🧹 Limpando cache do Docker..." -ForegroundColor Yellow
docker system prune -a -f

Write-Host "🔨 Reconstruindo sem cache..." -ForegroundColor Yellow
docker compose build --no-cache --pull

Write-Host "🚀 Iniciando containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "✅ Reconstrução completa finalizada!" -ForegroundColor Green
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "🔍 Verificando se está usando Debian:" -ForegroundColor Cyan
docker compose exec backend cat /etc/os-release | Select-Object -First 1
