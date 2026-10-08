# Start all backend microservices in background with logs in ./logs
$ErrorActionPreference = "Continue"

$logsDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$services = @(
    @{ Name = "eureka-server";          Port = 8761; Path = "eureka-server" },
    @{ Name = "config-server";          Port = 8888; Path = "config-server" },
    @{ Name = "api-gateway";            Port = 8080; Path = "api-gateway" },
    @{ Name = "auth-service";           Port = 8086; Path = "auth-service" },
    @{ Name = "profile-service";        Port = 8081; Path = "profile-service" },
    @{ Name = "product-service";        Port = 8082; Path = "product-service" },
    @{ Name = "inventory-service";      Port = 8088; Path = "inventory-service" },
    @{ Name = "cart-service";           Port = 8083; Path = "cart-service" },
    @{ Name = "order-service";          Port = 8084; Path = "order-service" },
    @{ Name = "wallet-service";         Port = 8085; Path = "wallet-service" },
    @{ Name = "payment-service";        Port = 8087; Path = "payment-service" },
    @{ Name = "delivery-service";       Port = 8089; Path = "delivery-service" },
    @{ Name = "notification-service";   Port = 8090; Path = "notification-service" },
    @{ Name = "review-service";         Port = 8091; Path = "review-service" },
    @{ Name = "recommendation-service"; Port = 8092; Path = "recommendation-service" }
)

foreach ($s in $services) {
    # Check if port is already listening
    $active = Get-NetTCPConnection -LocalPort $s.Port -State Listen -ErrorAction SilentlyContinue
    if ($active) {
        Write-Host "$($s.Name) is already running on port $($s.Port)." -ForegroundColor Yellow
        continue
    }

    $serviceDir = Join-Path $PSScriptRoot $s.Path
    $relJar = "target\$($s.Name)-1.0.0-SNAPSHOT.jar"
    $outLog = Join-Path $logsDir "$($s.Name).log"
    $errLog = Join-Path $logsDir "$($s.Name)_err.log"

    Write-Host "Starting $($s.Name) on port $($s.Port)..." -ForegroundColor Green

    Start-Process -FilePath "java" -ArgumentList "-Xms64m", "-Xmx256m", "-jar", $relJar -WorkingDirectory $serviceDir -RedirectStandardOutput $outLog -RedirectStandardError $errLog

    if ($s.Name -eq "eureka-server") {
        Write-Host "Waiting for Eureka Server to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } elseif ($s.Name -eq "config-server") {
        Write-Host "Waiting for Config Server to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 8
    } elseif ($s.Name -eq "api-gateway") {
        Write-Host "Waiting for API Gateway to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 4
    } else {
        Start-Sleep -Seconds 2
    }
}

# Check Frontend
$feActive = Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue
if (-not $feActive) {
    Write-Host "Starting Frontend on port 4200..." -ForegroundColor Green
    $feDir = Join-Path $PSScriptRoot "frontend"
    $feOutLog = Join-Path $logsDir "frontend.log"
    $feErrLog = Join-Path $logsDir "frontend_err.log"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WorkingDirectory $feDir -RedirectStandardOutput $feOutLog -RedirectStandardError $feErrLog
} else {
    Write-Host "Frontend is already running on port 4200." -ForegroundColor Yellow
}

Write-Host "`nAll services launch sequence initiated! Check ./logs for output." -ForegroundColor Cyan
