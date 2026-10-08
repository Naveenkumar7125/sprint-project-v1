# EShopping Zone - Multi-Service Local Runner
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting EShopping Zone Microservices  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

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
    Write-Host "Launching $($s.Name) on port $($s.Port)..." -ForegroundColor Green
    $jarPath = "$PSScriptRoot\$($s.Path)\target\$($s.Name)-1.0.0-SNAPSHOT.jar"
    $title = "$($s.Name) (Port $($s.Port))"
    
    $targetJar = "target\$($s.Name)-1.0.0-SNAPSHOT.jar"
    $serviceDir = Join-Path $PSScriptRoot $s.Path
    
    if (Test-Path (Join-Path $serviceDir $targetJar)) {
        Start-Process cmd.exe -WorkingDirectory $serviceDir -ArgumentList "/k", "title $title && java -Xms64m -Xmx256m -jar $targetJar"
    } else {
        Start-Process cmd.exe -WorkingDirectory $serviceDir -ArgumentList "/k", "title $title && mvn spring-boot:run"
    }
    
    if ($s.Name -eq "eureka-server") {
        Start-Sleep -Seconds 6
    } elseif ($s.Name -eq "config-server") {
        Start-Sleep -Seconds 4
    } else {
        Start-Sleep -Seconds 1
    }
}

Write-Host "Launching Frontend on port 4200..." -ForegroundColor Green
$frontendDir = Join-Path $PSScriptRoot "frontend"
Start-Process cmd.exe -WorkingDirectory $frontendDir -ArgumentList "/k", "title Frontend (Port 4200) && npm start"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " All services have been launched! " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Frontend:         http://localhost:4200" -ForegroundColor Yellow
Write-Host "API Gateway:      http://localhost:8080" -ForegroundColor Yellow
Write-Host "Eureka Dashboard: http://localhost:8761" -ForegroundColor Yellow
Write-Host "Config Server:    http://localhost:8888" -ForegroundColor Yellow


