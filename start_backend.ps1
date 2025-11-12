# PowerShell script to start the backend with DATABASE_URL
$env:DATABASE_URL = "mysql+pymysql://root:password%4012345@localhost:3306/ecommerce_admin"
Write-Host "DATABASE_URL set to: $env:DATABASE_URL" -ForegroundColor Green
Write-Host "Starting backend server..." -ForegroundColor Yellow
python backend.py

