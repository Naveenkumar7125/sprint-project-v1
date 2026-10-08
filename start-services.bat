@echo off
echo =========================================
echo   Starting EShopping Zone Microservices  
echo =========================================

set BASE_DIR=%~dp0

echo Launching Eureka Server (8761)...
start "eureka-server" /D "%BASE_DIR%eureka-server" cmd /k "title Eureka Server (Port 8761) && java -Xms64m -Xmx256m -jar target\eureka-server-1.0.0-SNAPSHOT.jar"
timeout /t 6 /nobreak >nul 2>&1

echo Launching Config Server (8888)...
start "config-server" /D "%BASE_DIR%config-server" cmd /k "title Config Server (Port 8888) && java -Xms64m -Xmx256m -jar target\config-server-1.0.0-SNAPSHOT.jar"
timeout /t 5 /nobreak >nul 2>&1

echo Launching API Gateway (8080)...
start "api-gateway" /D "%BASE_DIR%api-gateway" cmd /k "title API Gateway (Port 8080) && java -Xms64m -Xmx256m -jar target\api-gateway-1.0.0-SNAPSHOT.jar"
timeout /t 3 /nobreak >nul 2>&1

echo Launching Auth Service (8086)...
start "auth-service" /D "%BASE_DIR%auth-service" cmd /k "title Auth Service (Port 8086) && java -Xms64m -Xmx256m -jar target\auth-service-1.0.0-SNAPSHOT.jar"

echo Launching Profile Service (8081)...
start "profile-service" /D "%BASE_DIR%profile-service" cmd /k "title Profile Service (Port 8081) && java -Xms64m -Xmx256m -jar target\profile-service-1.0.0-SNAPSHOT.jar"

echo Launching Product Service (8082)...
start "product-service" /D "%BASE_DIR%product-service" cmd /k "title Product Service (Port 8082) && java -Xms64m -Xmx256m -jar target\product-service-1.0.0-SNAPSHOT.jar"

echo Launching Inventory Service (8088)...
start "inventory-service" /D "%BASE_DIR%inventory-service" cmd /k "title Inventory Service (Port 8088) && java -Xms64m -Xmx256m -jar target\inventory-service-1.0.0-SNAPSHOT.jar"

echo Launching Cart Service (8083)...
start "cart-service" /D "%BASE_DIR%cart-service" cmd /k "title Cart Service (Port 8083) && java -Xms64m -Xmx256m -jar target\cart-service-1.0.0-SNAPSHOT.jar"

echo Launching Order Service (8084)...
start "order-service" /D "%BASE_DIR%order-service" cmd /k "title Order Service (Port 8084) && java -Xms64m -Xmx256m -jar target\order-service-1.0.0-SNAPSHOT.jar"

echo Launching Wallet Service (8085)...
start "wallet-service" /D "%BASE_DIR%wallet-service" cmd /k "title Wallet Service (Port 8085) && java -Xms64m -Xmx256m -jar target\wallet-service-1.0.0-SNAPSHOT.jar"

echo Launching Payment Service (8087)...
start "payment-service" /D "%BASE_DIR%payment-service" cmd /k "title Payment Service (Port 8087) && java -Xms64m -Xmx256m -jar target\payment-service-1.0.0-SNAPSHOT.jar"

echo Launching Delivery Service (8089)...
start "delivery-service" /D "%BASE_DIR%delivery-service" cmd /k "title Delivery Service (Port 8089) && java -Xms64m -Xmx256m -jar target\delivery-service-1.0.0-SNAPSHOT.jar"

echo Launching Notification Service (8090)...
start "notification-service" /D "%BASE_DIR%notification-service" cmd /k "title Notification Service (Port 8090) && java -Xms64m -Xmx256m -jar target\notification-service-1.0.0-SNAPSHOT.jar"

echo Launching Review Service (8091)...
start "review-service" /D "%BASE_DIR%review-service" cmd /k "title Review Service (Port 8091) && java -Xms64m -Xmx256m -jar target\review-service-1.0.0-SNAPSHOT.jar"

echo Launching Recommendation Service (8092)...
start "recommendation-service" /D "%BASE_DIR%recommendation-service" cmd /k "title Recommendation Service (Port 8092) && java -Xms64m -Xmx256m -jar target\recommendation-service-1.0.0-SNAPSHOT.jar"

echo Launching Frontend (4200)...
start "frontend" /D "%BASE_DIR%frontend" cmd /k "title Frontend (Port 4200) && npm start"

echo =========================================
echo  All services have been initiated!
echo =========================================
echo Frontend:         http://localhost:4200
echo API Gateway:      http://localhost:8080
echo Eureka Dashboard: http://localhost:8761
echo Config Server:    http://localhost:8888
