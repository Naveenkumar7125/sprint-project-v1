# EShopping Zone - Stop Local Microservices
$ports = @(8761, 8888, 8080, 8086, 8081, 8082, 8088, 8083, 8084, 8085, 8087, 8089, 8090, 8091, 8092)

foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pidToKill in $processes) {
            Write-Host "Stopping process $pidToKill listening on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "All specified microservice ports have been stopped." -ForegroundColor Green
