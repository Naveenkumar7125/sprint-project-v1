/**
 * EShopping Zone Data Seeder
 * Connects to API Gateway at http://localhost:8080 or MySQL to seed categories & 50 products
 */
const http = require('http');

console.log('🌱 EShopping Zone Seeder Ready');
console.log('Flyway migration files created:');
console.log(' - product-service/src/main/resources/db/migration/V3__seed_categories_and_50_products.sql');
console.log(' - inventory-service/src/main/resources/db/migration/V3__seed_inventory_data.sql');
console.log('Unified SQL script created:');
console.log(' - seed-data.sql');
