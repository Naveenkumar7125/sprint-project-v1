-- ================================================================
-- EShopping Zone - Complete Database Seed Script (50 Products)
-- ================================================================

-- Switch to product_db
USE product_db;

-- 1. Insert Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Electronics & Gadgets', 'Smartphones, laptops, smart home devices, and cutting-edge personal tech.'),
(2, 'Fashion & Apparel', 'Trendy urban streetwear, luxury watches, designer footwear, and accessories.'),
(3, 'Audio & Sound', 'High-fidelity headphones, wireless earbuds, soundbars, and studio monitors.'),
(4, 'Gaming & VR', 'Next-gen gaming consoles, VR headsets, mechanical keyboards, and gaming gear.'),
(5, 'Home & Kitchen', 'Smart kitchen appliances, espresso machines, robot vacuums, and modern living essentials.'),
(6, 'Sports & Fitness', 'Smart fitness wearables, strength equipment, yoga gear, and outdoor accessories.'),
(7, 'Beauty & Personal Care', 'Premium skincare serums, salon-grade hair styling, and luxury wellness essentials.'),
(8, 'Photography & Drones', '4K aerial drones, mirrorless cameras, action cams, and creator equipment.')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- 2. Insert 50 Products
INSERT INTO products (id, merchant_id, category_id, name, description, price, image_url, active) VALUES
(1, 1, 1, 'Quantum Pro Max 5G Smartphone 256GB', 'Flagship smartphone featuring a 6.8-inch Dynamic AMOLED 120Hz display, Snapdragon 8 Gen 3 chipset, 200MP quad camera system with 100x Space Zoom, and 5000mAh battery with 65W ultra-fast charging.', 1199.99, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80', TRUE),
(2, 1, 1, 'UltraBook Neo 16 OLED Laptop (M3 Pro, 32GB, 1TB)', 'Powerhouse creator workstation equipped with a 16.2-inch Liquid Retina XDR screen, 12-core CPU, 18-core GPU, 32GB unified memory, and 22-hour battery life encased in aerospace aluminum.', 2499.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', TRUE),
(3, 1, 1, 'Apex Horizon 4K Ultra-Short-Throw Laser Projector', 'Cinema-grade home theater projector with 3000 ANSI Lumens, HDR10+, Dolby Vision support, and built-in Bowers & Wilkins 40W acoustics projecting up to 150-inch screen from 9 inches.', 1899.50, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80', TRUE),
(4, 1, 1, 'NovaTab Air 11-inch Tablet 128GB Wi-Fi', 'Ultra-thin versatile tablet with 2.8K 144Hz stylus-ready display, quad stereo speakers, AI multitasking dock, and magnetic keyboard folio compatibility.', 499.99, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', TRUE),
(5, 1, 1, 'Lumix Smart Ambient Desk Lamp with Qi Fast Charger', 'Minimalist architectural task lamp with daylight spectrum LEDs, gesture dimming, auto-circadian color shifting, and integrated 15W wireless charging base.', 129.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80', TRUE),
(6, 1, 1, 'Titanium Slim PowerBank 24,000mAh 140W PD', 'High-capacity dual USB-C power bank capable of fast-charging a laptop and two phones simultaneously with smart TFT power display.', 99.99, 'https://images.unsplash.com/photo-1609592426815-581372dfcb17?auto=format&fit=crop&w=800&q=80', TRUE),
(7, 2, 2, 'Chronograph Precision Automatic Watch', 'Handcrafted Swiss automatic movement timepiece with 42mm sapphire crystal dial, exhibition caseback, 100m water resistance, and Italian calfskin leather strap.', 580.00, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', TRUE),
(8, 2, 2, 'AeroGlide Elite Runner Sneakers', 'Carbon-fiber plated performance running shoes featuring responsive nitrogen-infused foam midsole and breathable engineered mesh upper for supreme race-day speed.', 185.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', TRUE),
(9, 2, 2, 'Artisan Vintage Full-Grain Leather Messenger Bag', 'Rugged yet refined commuter satchel with padded 15-inch laptop compartment, antique brass hardware, water-resistant waxed finish, and detachable shoulder strap.', 240.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', TRUE),
(10, 2, 2, 'Eclipse Polarized Aviator Sunglasses', 'Featherweight titanium frames with 100% UV400 polarized mineral glass lenses, anti-reflective coating, and hydrophobic smudge resistance.', 160.00, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80', TRUE),
(11, 2, 2, 'Nordic Merino Wool Oversized Knit Sweater', '100% extra-fine sustainable Merino wool pullover featuring ribbed crewneck, thermal moisture-wicking comfort, and timeless Scandinavian silhouette.', 145.00, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80', TRUE),
(12, 2, 2, 'Stealth Waterproof Technical Urban Parka', '3-layer GORE-TEX breathable weatherproof coat with magnetic storm flap, fleece-lined handwarmer pockets, and reflective stealth accents.', 320.00, 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80', TRUE),
(13, 1, 3, 'SonicWave Studio ANC Wireless Headphones', 'Industry-leading Active Noise Cancellation with dual custom 45mm beryllium drivers, spatial audio head tracking, transparency mode, and 40-hour battery life.', 349.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', TRUE),
(14, 1, 3, 'PulseBuds Pro 2 ANC True Wireless Earbuds', 'Lossless Hi-Res audio earbuds with adaptive ANC, 6-microphone AI beamforming voice isolation, IPX7 sweatproofing, and 36-hour Qi wireless charging case.', 179.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', TRUE),
(15, 1, 3, 'AuraBeam 360 Spatial Bluetooth Speaker', 'Room-filling omnidirectional acoustic speaker featuring custom downward subwoofer, Bluetooth 5.3 multi-room sync, ambient halo lighting, and 18-hour playtime.', 219.00, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', TRUE),
(16, 1, 3, 'SoundBar Cinema Pro 5.1.2 with Wireless Subwoofer', 'Dolby Atmos and DTS:X soundbar with up-firing height channels, eARC HDMI passthrough, 600W total output, and wireless rear satellite modules.', 699.00, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', TRUE),
(17, 1, 3, 'VocalMaster Cardioid USB-C Studio Microphone', 'Broadcast-quality 24-bit/192kHz condenser microphone with integrated pop filter, zero-latency headphone monitoring, and RGB gain status ring for streaming.', 149.00, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', TRUE),
(18, 1, 3, 'Audiophile Retro Hi-Fi Belt-Drive Turntable', 'Precision aluminum platter turntable with Audio-Technica magnetic cartridge, built-in switchable phono preamp, and natural walnut wood chassis.', 289.00, 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', TRUE),
(19, 2, 4, 'CyberDeck 87 Mechanical RGB Gaming Keyboard', 'Hot-swappable linear optical switches, sound-dampening gasket mount, PBT double-shot keycaps, and customizable per-key RGB backlighting.', 159.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', TRUE),
(20, 2, 4, 'Viperstrike Ultra-Light 4K Wireless Gaming Mouse', '49-gram magnesium alloy honey-comb chassis with 30,000 DPI optical sensor, 4000Hz polling rate, optical micro switches, and zero debounce lag.', 129.99, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', TRUE),
(21, 2, 4, 'NexusVR Next-Gen Spatial 4K VR Headset', 'Standalone virtual reality headset with dual 4K micro-OLED displays, pancake optics, inside-out eye and face tracking, and wireless PC-link streaming.', 599.00, 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80', TRUE),
(22, 2, 4, 'Predator Curved 34-inch QD-OLED 175Hz Gaming Monitor', 'UltraWide WQHD (3440x1440) 1800R curved display with 0.03ms response time, 99.3% DCI-P3 color gamut, G-Sync Ultimate, and HDR True Black 400.', 899.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', TRUE),
(23, 2, 4, 'AeroThrust Wireless Haptic Feedback Game Controller', 'Precision gamepad featuring Hall Effect magnetic joysticks, microswitch tactile triggers, mappable rear paddles, and dual-axis linear rumble motors.', 89.99, 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80', TRUE),
(24, 2, 4, 'Titan Ergonomic Racing Recline Gaming Chair', 'Full cold-cure foam lumbar contour chair with 4D armrests, magnetic memory foam head pillow, and multi-tilt recline up to 165 degrees.', 399.00, 'https://images.unsplash.com/photo-1580481077167-33635234744b?auto=format&fit=crop&w=800&q=80', TRUE),
(25, 3, 5, 'Barista Touch Espresso Machine & Grinder', 'Professional 15-bar Italian pump espresso maker with integrated conical burr grinder, PID digital temperature control, and microfoam steam wand.', 749.99, 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=800&q=80', TRUE),
(26, 3, 5, 'TurboCrisp Dual-Zone Smart Air Fryer 9L', 'Dual-basket air fryer with independent temperature synchronization, 8 smart presets, 360-degree rapid heat vortex, and dishwasher-safe crisper plates.', 179.99, 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80', TRUE),
(27, 3, 5, 'RoboClean S9 Laser Navigation Robot Vacuum & Mop', '6000Pa extreme suction robotic vacuum with LiDAR room mapping, sonic scrubbing mop, auto-empty dustbin station, and multi-floor obstacle avoidance.', 649.00, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80', TRUE),
(28, 3, 5, 'PureAir Hepa Pro Smart Air Purifier', 'Medical-grade H13 True HEPA filtration capturing 99.97% of airborne allergens, real-time PM2.5 air quality laser sensor, and ultra-quiet 22dB sleep mode.', 199.99, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80', TRUE),
(29, 3, 5, 'Damascus Steel 8-Piece Master Chef Knife Set', 'Hand-forged 67-layer Japanese VG-10 Damascus high-carbon steel knives with ergonomic pakkawood handles and magnetic walnut display block.', 289.00, 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80', TRUE),
(30, 3, 5, 'Smart Temperature Control Ceramic Travel Mug', 'App-connected smart thermal mug that keeps your coffee or tea at your exact preferred temperature (120F - 145F) for up to 3 hours or all day on charging coaster.', 139.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', TRUE),
(31, 2, 6, 'PulseGrip Smart GPS Multisport Smartwatch', 'Rugged titanium bezel sports watch with dual-frequency GPS, VO2 Max monitor, ECG sensor, wrist-based heart rate tracker, and 28-day battery life.', 399.99, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', TRUE),
(32, 2, 6, 'FlexForm Pro Adjustable Dumbbell Set (5 - 52.5 lbs)', 'Space-saving rapid weight selector dumbbells replacing 15 sets of weights with durable thermoplastic molding for quiet clank-free lifts.', 349.00, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', TRUE),
(33, 2, 6, 'ZenAlign Premium Non-Slip Eco Yoga Mat 6mm', 'High-density natural rubber and biodegradable polyurethane mat with laser-etched posture alignment grid and sweat-activated grip.', 88.00, 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80', TRUE),
(34, 2, 6, 'DeepRelief Percussion Deep Tissue Massage Gun', 'Brushless quiet-force motor delivering 3200 RPM with 16mm amplitude, 6 interchangeable therapy heads, OLED pressure sensor, and 6-hour runtime.', 169.99, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', TRUE),
(35, 2, 6, 'AeroCycle Foldable Indoor Spin Bike with Display', 'Magnetic resistance exercise bike with silent belt drive, heavy 35lb flywheel, tablet holder, and real-time cadence/heart-rate Bluetooth broadcast.', 499.00, 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80', TRUE),
(36, 2, 6, 'HydroShield Insulated 32oz Stainless Steel Bottle', 'Double-wall vacuum insulated sports flask keeping beverages ice cold for 24 hours or piping hot for 12 hours with leakproof straw lid.', 36.00, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80', TRUE),
(37, 3, 7, 'HydraGlow Peptide & Vitamin C Renewal Serum', 'Ultra-concentrated brightening facial serum with 15% pure Vitamin C, hyaluronic acid complex, and ferulic acid for radiant skin rejuvenation.', 65.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', TRUE),
(38, 3, 7, 'AeroDry Supersonic High-Speed Ionic Hair Dryer', '110,000 RPM brushless motor hair dryer with intelligent thermal sensor preventing heat damage, magnetic styling nozzles, and negative ion frizz reducer.', 249.99, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', TRUE),
(39, 3, 7, 'Luxe Noir Eau de Parfum 100ml', 'Intoxicating luxury fragrance blending top notes of bergamot and pink pepper with smoky cedarwood, rich amber, and velvety bourbon vanilla base.', 125.00, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80', TRUE),
(40, 3, 7, 'Precision 5-in-1 Waterproof Beard & Body Groomer', 'Self-sharpening titanium ceramic blades with 20 lock-in precision length settings, cordless USB-C charging, and 100% showerproof IPX7 rating.', 79.99, 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80', TRUE),
(41, 3, 7, 'Botanical Revive Organic Anti-Aging Night Cream', 'Rich velvety cream formulated with botanical retinol alternatives, squalane, and ceramides to repair and deeply hydrate while you sleep.', 58.00, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', TRUE),
(42, 3, 7, 'SonicClean Ultra Whitening Electric Toothbrush', '48,000 vibrations per minute magnetic levitation sonic motor with 5 brushing modes, smart 2-minute timer, and wireless UV sanitizing travel case.', 89.99, 'https://images.unsplash.com/photo-1559591937-e1032c8e388f?auto=format&fit=crop&w=800&q=80', TRUE),
(43, 1, 8, 'SkyPhantom 4K HDR Foldable Camera Drone', '3-axis gimbal quadcopter with 4K/60fps video, 1/1.3-inch CMOS sensor, 10km transmission range, obstacle sensors, and 38-minute extended flight time.', 799.00, 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=800&q=80', TRUE),
(44, 1, 8, 'AlphaVision 33MP Full-Frame Mirrorless Camera', 'Next-gen hybrid creator camera with 33MP Exmor R BSI sensor, 4K 60p 10-bit 4:2:2 recording, Real-time Eye AF tracking, and 5-axis IBIS stabilization.', 1999.00, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', TRUE),
(45, 1, 8, 'GimbalMaster 3-Axis Handheld Smartphone Stabilizer', 'AI magnetic tracking mobile gimbal with built-in extendable selfie rod, wireless charging, cinematic wheel controls, and vortex 360 spin mode.', 139.99, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', TRUE),
(46, 1, 8, 'ActionCam X9 Waterproof 5.3K Adventure Camera', 'Rugged waterproof up to 33ft action camera with dual color LCD screens, Horizon Leveling stabilization, 8x slo-mo, and voice control.', 399.00, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', TRUE),
(47, 1, 8, 'StudioPro Bi-Color RGB LED Video Light Panel', '60W CRI 97+ creator panel with 2500K-8500K color range, app control, 360-degree full color gamut, and portable aluminum light stand.', 119.00, 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=800&q=80', TRUE),
(48, 1, 8, 'CarbonFiber Ultra-Compact Travel Tripod', 'Lightweight 2.8lb carbon fiber camera tripod with 360 panoramic ball head, Arca-Swiss plate, and quick flip leg locks extending up to 64 inches.', 179.00, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80', TRUE),
(49, 1, 8, 'VlogPod Wireless Lavalier Microphone Kit (Dual Channel)', 'Plug-and-play 2.4GHz wireless lapel mics with active DSP noise cancellation, 200m range, OLED charging case, and universal USB-C/Lightning adapters.', 109.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', TRUE),
(50, 1, 8, 'ExtremePro 512GB V90 UHS-II SDXC Memory Card', 'Ultra-fast memory card with read speeds up to 300MB/s and write speeds up to 260MB/s built for continuous burst shooting and cinematic 8K video.', 229.00, 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), image_url=VALUES(image_url), category_id=VALUES(category_id), active=VALUES(active);

-- 3. Insert Product Specs & Gallery
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES
(1, 'Brand', 'Quantum'),
(1, 'Display', '6.8" Dynamic AMOLED 2X 120Hz'),
(1, 'Warranty', '2 Years Global'),
(1, 'galleryImages', '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"]'),
(2, 'Brand', 'NovaBook'),
(2, 'Processor', 'M3 Pro 12-core'),
(2, 'RAM', '32GB Unified'),
(2, 'galleryImages', '["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"]'),
(7, 'Brand', 'Geneva Horology'),
(7, 'Movement', 'Swiss Calibre 2824-2 Automatic'),
(7, 'galleryImages', '["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"]'),
(8, 'Brand', 'AeroGlide'),
(8, 'Upper', 'Engineered FlyKnit Mesh'),
(8, 'galleryImages', '["https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80"]'),
(13, 'Brand', 'SonicWave'),
(13, 'Battery Life', '40 Hours (ANC On)'),
(13, 'galleryImages', '["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"]'),
(25, 'Brand', 'Barista Pro'),
(25, 'Pump Pressure', '15 Bar Italian'),
(25, 'galleryImages', '["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"]')
ON DUPLICATE KEY UPDATE spec_value=VALUES(spec_value);

-- Switch to inventory_db
USE inventory_db;

-- 4. Insert Inventory for all 50 Products
INSERT INTO inventory (id, product_id, available_stock, reserved_stock, sold_stock, low_stock_threshold, version) VALUES
(1, 1, 45, 0, 12, 5, 0),
(2, 2, 28, 0, 8, 3, 0),
(3, 3, 15, 0, 4, 2, 0),
(4, 4, 60, 0, 20, 10, 0),
(5, 5, 120, 0, 35, 15, 0),
(6, 6, 85, 0, 22, 10, 0),
(7, 7, 18, 0, 6, 2, 0),
(8, 8, 95, 0, 40, 10, 0),
(9, 9, 32, 0, 11, 5, 0),
(10, 10, 75, 0, 18, 10, 0),
(11, 11, 50, 0, 14, 5, 0),
(12, 12, 40, 0, 9, 5, 0),
(13, 13, 110, 0, 45, 15, 0),
(14, 14, 140, 0, 60, 20, 0),
(15, 15, 65, 0, 19, 10, 0),
(16, 16, 22, 0, 7, 3, 0),
(17, 17, 80, 0, 25, 10, 0),
(18, 18, 30, 0, 10, 5, 0),
(19, 19, 70, 0, 30, 10, 0),
(20, 20, 90, 0, 35, 15, 0),
(21, 21, 35, 0, 12, 5, 0),
(22, 22, 25, 0, 8, 3, 0),
(23, 23, 150, 0, 55, 20, 0),
(24, 24, 20, 0, 5, 2, 0),
(25, 25, 24, 0, 10, 3, 0),
(26, 26, 85, 0, 28, 10, 0),
(27, 27, 30, 0, 9, 5, 0),
(28, 28, 55, 0, 16, 8, 0),
(29, 29, 40, 0, 12, 5, 0),
(30, 30, 95, 0, 38, 10, 0),
(31, 31, 50, 0, 15, 8, 0),
(32, 32, 35, 0, 11, 5, 0),
(33, 33, 120, 0, 42, 15, 0),
(34, 34, 60, 0, 24, 10, 0),
(35, 35, 18, 0, 6, 3, 0),
(36, 36, 200, 0, 80, 25, 0),
(37, 37, 150, 0, 65, 20, 0),
(38, 38, 45, 0, 18, 5, 0),
(39, 39, 80, 0, 30, 10, 0),
(40, 40, 90, 0, 35, 12, 0),
(41, 41, 110, 0, 40, 15, 0),
(42, 42, 85, 0, 29, 10, 0),
(43, 43, 25, 0, 7, 3, 0),
(44, 44, 16, 0, 5, 2, 0),
(45, 45, 70, 0, 22, 10, 0),
(46, 46, 50, 0, 15, 8, 0),
(47, 47, 65, 0, 20, 10, 0),
(48, 48, 40, 0, 14, 5, 0),
(49, 49, 85, 0, 28, 10, 0),
(50, 50, 130, 0, 50, 15, 0)
ON DUPLICATE KEY UPDATE available_stock=VALUES(available_stock), low_stock_threshold=VALUES(low_stock_threshold);

-- Switch to auth_db
USE auth_db;

-- 5. Insert Default Users (Password@123)
INSERT INTO users (id, username, email, password, role, enabled, account_status, created_at) VALUES
(1, 'john_doe', 'john@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'CUSTOMER', TRUE, 'ACTIVE', NOW()),
(2, 'merchant_bob', 'merchant@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'MERCHANT', TRUE, 'ACTIVE', NOW()),
(3, 'admin_sarah', 'admin@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ADMIN', TRUE, 'ACTIVE', NOW()),
(4, 'delivery_dan', 'delivery@example.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'DELIVERY_AGENT', TRUE, 'ACTIVE', NOW()),
(10, 'admin', 'admin@eshoppingzone.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ADMIN', TRUE, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE 
    email=VALUES(email),
    password=VALUES(password),
    role=VALUES(role),
    enabled=VALUES(enabled),
    account_status=VALUES(account_status);

