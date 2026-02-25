# Railway Deployment Script
# This script commits changes and pushes to GitHub, triggering Railway deployment

param(
    [string]$message = "Update project",
    [string]$branch = "main"
)

Write-Host "🚀 Building Permit System - Railway Deployment Script" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if git is available
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed or not in PATH. Please install Git or add it to your PATH."
    }

    # Navigate to project directory
    $projectPath = Get-Location
    Write-Host "📁 Project Path: $projectPath" -ForegroundColor Yellow
    Write-Host ""

    # Check git status
    Write-Host "📊 Checking git status..." -ForegroundColor Cyan
    $gitStatus = git status --porcelain
    
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "✅ No changes to commit" -ForegroundColor Green
        exit 0
    }

    Write-Host "📝 Changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""

    # Stage changes
    Write-Host "📦 Staging all changes..." -ForegroundColor Cyan
    git add .
    
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Cyan
    git commit -m $message
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }

    # Push to GitHub
    Write-Host "🌐 Pushing to GitHub branch: $branch..." -ForegroundColor Cyan
    git push origin $branch
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push to GitHub"
    }

    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🔄 Railway will automatically detect the push and start building..." -ForegroundColor Green
    Write-Host "📊 Check your Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}
