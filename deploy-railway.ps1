# Direct Railway Deployment Script
# Uses Railway CLI to deploy directly without Git

Write-Host "🚀 Building Permit System - Direct Railway Deployment" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if Railway CLI is available
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        throw "Railway CLI is not installed. Install it from https://docs.railway.com/cli/install"
    }

    # Navigate to project directory
    $projectPath = Get-Location
    Write-Host "📁 Project Path: $projectPath" -ForegroundColor Yellow
    Write-Host ""

    # Check Railway status
    Write-Host "📊 Checking Railway project status..." -ForegroundColor Cyan
    railway status
    Write-Host ""

    # Deploy to Railway
    Write-Host "🔄 Deploying to Railway..." -ForegroundColor Cyan
    railway up
    
    if ($LASTEXITCODE -ne 0) {
        throw "Railway deployment failed"
    }

    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "📊 View your deployment: https://railway.app/dashboard" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}
