
Write-Host "🛑 Killing all Node.js processes..." -ForegroundColor Cyan
taskkill /F /IM node.exe /T 2>$null

Write-Host "🛑 Stopping Docker containers..." -ForegroundColor Cyan
docker-compose down

Write-Host "✅ Cleanup Complete." -ForegroundColor Green
