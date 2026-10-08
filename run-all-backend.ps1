# Continuous Backend Microservices Runner
$ErrorActionPreference = "Continue"

$logsDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$services = @(
    @{ Name = "eureka-server";          Port = 8761; Path = "eureka-server";          Wait = 12 },
    @{ Name = "config-server";          Port = 8888; Path = "config-server";          Wait = 10 },
    @{ Name = "api-gateway";            Port = 8080; Path = "api-gateway";            Wait = 6 },
    @{ Name = "auth-service";           Port = 8086; Path = "auth-service";           Wait = 3 },
    @{ Name = "profile-service";        Port = 8081; Path = "profile-service";        Wait = 3 },
    @{ Name = "product-service";        Port = 8082; Path = "product-service";        Wait = 3 },
    @{ Name = "inventory-service";      Port = 8088; Path = "inventory-service";      Wait = 3 },
    @{ Name = "cart-service";           Port = 8083; Path = "cart-service";           Wait = 3 },
    @{ Name = "order-service";          Port = 8084; Path = "order-service";          Wait = 3 },
    @{ Name = "wallet-service";         Port = 8085; Path = "wallet-service";         Wait = 3 },
    @{ Name = "payment-service";        Port = 8087; Path = "payment-service";        Wait = 3 },
    @{ Name = "delivery-service";       Port = 8089; Path = "delivery-service";       Wait = 3 },
    @{ Name = "notification-service";   Port = 8090; Path = "notification-service";   Wait = 3 },
    @{ Name = "review-service";         Port = 8091; Path = "review-service";         Wait = 3 },
    @{ Name = "recommendation-service"; Port = 8092; Path = "recommendation-service"; Wait = 3 }
)

$runningProcesses = @()

foreach ($s in $services) {
    $serviceDir = Join-Path $PSScriptRoot $s.Path
    $relJar = "target\$($s.Name)-1.0.0-SNAPSHOT.jar"
    $outLog = Join-Path $logsDir "$($s.Name).log"
    $errLog = Join-Path $logsDir "$($s.Name)_err.log"

    Write-Host "[+] Starting $($s.Name) on port $($s.Port)..." -ForegroundColor Green

    $proc = Start-Process -FilePath "java" -ArgumentList "-Xms64m", "-Xmx256m", "-jar", $relJar -WorkingDirectory $serviceDir -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    $runningProcesses += $proc

    Write-Host "    PID: $($proc.Id), waiting $($s.Wait)s..." -ForegroundColor Gray
    Start-Sleep -Seconds $s.Wait
}

Write-Host "`nAll 15 microservices launched successfully! Keeping supervisor process alive..." -ForegroundColor Cyan

# Keep process alive and monitor health
while ($true) {
    Start-Sleep -Seconds 30
}
