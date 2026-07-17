/* ==========================================================================
   STRIKZ ESPORTS - SHOP DIGITAL MARKETPLACE & STOREFRONT
   ========================================================================== */

(function() {
    function renderShop(container) {
        const db = window.strikzDb.get();
        const products = db.products || [];
        const settings = db.settings || {};
        
        // WhatsApp settings
        const rawWhatsapp = settings.whatsappNumber || '';
        const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '');
        const messageTemplate = settings.whatsappMessageTemplate || "Hello, I'm interested in purchasing the {product_name} subscription ({duration}) for {price}.";

        // Read query parameters
        const hash = window.location.hash || '';
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const urlParams = new URLSearchParams(query);
        const productId = urlParams.get('product');

        // Check if viewing a specific product detailed page
        if (productId) {
            const product = products.find(p => p.id === parseInt(productId));
            if (product && product.enabled !== false) {
                renderProductDetailsPage(container, product, products, cleanWhatsapp, messageTemplate);
                return;
            }
        }

        // Otherwise render storefront catalog listing
        renderCatalogPage(container, products, cleanWhatsapp, messageTemplate);
    }

    // ==========================================
    // PRODUCT DETAILS PAGE RENDERER
    // ==========================================
    function renderProductDetailsPage(container, p, allProducts, whatsappNum, template) {
        const safeImage = p.image || 'assets/coming_soon.png';
        
        // Savings calculations
        const regPrice = parseFloat(p.price) || 0;
        const discPrice = parseFloat(p.discountedPrice) || 0;
        const savingsVal = regPrice - discPrice;
        const savingsPercent = regPrice > 0 ? Math.round((savingsVal / regPrice) * 100) : 0;

        // Features list
        const featuresList = p.features && p.features.length > 0 
            ? p.features 
            : ["Instant account credentials delivery", "24/7 technical support", "Full-duration warranty & security guarantee", "Works on Mobile, Tablet & PC"];

        // Parse WhatsApp template
        const formattedPrice = `INR ${p.discountedPrice || p.price}`;
        let customMsg = template
            .replace(/{product_name}/g, p.name)
            .replace(/{price}/g, formattedPrice)
            .replace(/{duration}/g, p.duration || 'Monthly');

        const waLink = whatsappNum 
            ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(customMsg)}`
            : 'javascript:alert("WhatsApp support number is not configured in settings yet. Please contact support via email.");';

        // Filter related products (same category, enabled, excluding current product, limit 3)
        const related = allProducts
            .filter(item => item.category === p.category && item.id !== p.id && item.enabled !== false)
            .slice(0, 3);

        const shareUrl = `${window.location.origin}${window.location.pathname}#/shop?product=${p.id}`;

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 950px;">
                
                <!-- Breadcrumbs & Back Nav -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                    <div style="font-size: 12px; color: var(--text-dim); font-family: var(--font-header);">
                        <a href="#/shop" style="color: var(--neon-cyan); text-decoration: none;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">SHOP</a> 
                        <span style="margin: 0 8px;">/</span> 
                        <span style="color: var(--text-silver);">${p.category.toUpperCase()}</span> 
                        <span style="margin: 0 8px;">/</span> 
                        <span style="color: #fff;">${p.name.toUpperCase()}</span>
                    </div>
                    <a href="#/shop" class="cta-button" style="padding: 6px 14px; font-size: 10px; border-color: var(--glass-border); display: flex; align-items: center; gap: 6px;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                        <i class="fa-solid fa-arrow-left"></i> BACK TO CATALOG
                    </a>
                </div>

                <div class="account-grid" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 35px; align-items: start; margin-bottom: 50px;">
                    
                    <!-- Left: Large Logo Image Box & Sharing -->
                    <div>
                        <div class="glass-panel text-center" style="padding: 40px; border-color: var(--neon-cyan-border); background: rgba(0,0,0,0.45); border-radius: 12px; position: relative;">
                            
                            <!-- Badges -->
                            ${p.badge && p.badge !== 'none' ? `
                                <span class="badge-status status-approved font-orbitron" style="position: absolute; top: 15px; left: 15px; font-size: 9px; font-weight: 800; padding: 4px 10px; text-transform: uppercase;">
                                    ${p.badge}
                                </span>
                            ` : ''}
                            
                            <span class="badge-status ${p.availability === 'Out of Stock' ? 'status-rejected' : 'status-pending'} font-orbitron" style="position: absolute; top: 15px; right: 15px; font-size: 9px; font-weight: 800; padding: 4px 10px; text-transform: uppercase;">
                                ${p.availability || 'In Stock'}
                            </span>

                            <img src="${safeImage}" alt="${p.name} Large Logo" style="width: 140px; height: 140px; object-fit: contain; margin: 0 auto; display: block; border-radius: 12px; background: rgba(0,0,0,0.3); padding: 8px; border: 1px solid var(--glass-border);">
                            
                            <div style="margin-top: 30px; display: flex; justify-content: center; gap: 12px;">
                                <button id="btn-share-product" class="cta-button" style="padding: 8px 18px; font-size: 11px; display: flex; align-items: center; gap: 8px; border-color: rgba(255,255,255,0.08); font-weight: 800;">
                                    <i class="fa-solid fa-share-nodes"></i> SHARE PRODUCT
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Info Panel & Purchase flow -->
                    <div class="glass-panel" style="padding: 30px; border-color: rgba(255,255,255,0.04); background: rgba(0,0,0,0.25);">
                        
                        <!-- Top Metadata -->
                        <span class="font-orbitron" style="font-size: 9px; color: var(--neon-cyan); letter-spacing: 0.1em; font-weight: 800; display: block; margin-bottom: 8px; text-transform: uppercase;">
                            ${p.category} &bull; ${p.duration || 'Monthly'} Plan
                        </span>
                        
                        <h2 class="font-orbitron" style="font-size: 26px; color: #fff; margin-bottom: 12px; text-shadow: 0 0 10px rgba(255,255,255,0.1); text-transform: uppercase;">
                            ${p.name}
                        </h2>
                        
                        <!-- Price section -->
                        <div style="display: flex; align-items: baseline; gap: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                            <span style="font-size: 28px; color: var(--neon-yellow); font-weight: 900; font-family: var(--font-header);">
                                INR ${p.discountedPrice || p.price}
                            </span>
                            ${p.price && p.discountedPrice ? `
                                <span style="font-size: 14px; text-decoration: line-through; color: var(--text-dim); font-weight: bold; font-family: var(--font-header);">
                                    INR ${p.price}
                                </span>
                                <span class="badge-status status-approved font-orbitron" style="font-size: 10px; font-weight: 800; padding: 2px 8px; background: rgba(34, 197, 94, 0.1); border-color: rgba(34,197,94,0.3); color: var(--neon-green);">
                                    SAVE INR ${savingsVal} (${savingsPercent}% OFF)
                                </span>
                            ` : ''}
                        </div>

                        <!-- Description -->
                        <h4 class="font-orbitron" style="font-size: 11px; color: var(--text-silver); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase;">PLAN OVERVIEW</h4>
                        <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 25px;">
                            ${p.description || 'Activate premium features instantly. Access streaming content or use pro tools license accounts with full security updates and dedicated configurations.'}
                        </p>

                        <!-- Bullet features -->
                        <h4 class="font-orbitron" style="font-size: 11px; color: var(--text-silver); margin-bottom: 12px; letter-spacing: 0.05em; text-transform: uppercase;">PLAN BENEFITS</h4>
                        <ul style="padding-left: 0; list-style: none; display: grid; gap: 8px; margin-bottom: 30px;">
                            ${featuresList.map(f => `
                                <li style="font-size: 12.5px; color: var(--text-silver); display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-solid fa-circle-check" style="color: var(--neon-cyan); font-size: 13px;"></i>
                                    <span>${f}</span>
                                </li>
                            `).join('')}
                        </ul>

                        <!-- CTA buy now -->
                        <a href="${waLink}" target="${whatsappNum ? '_blank' : '_self'}" class="cta-button btn-neon-cyan w-full" style="padding: 15px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; border-radius: 4px;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                            <i class="fa-solid fa-cart-shopping"></i> BUY VIA WHATSAPP CHAT
                        </a>
                    </div>
                </div>

                <!-- Related Products Section -->
                ${related.length > 0 ? `
                    <div style="margin-top: 60px;">
                        <h3 class="font-orbitron" style="font-size: 14px; color: var(--text-white); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; letter-spacing: 0.05em; font-weight: 800; text-transform: uppercase;">
                            <i class="fa-solid fa-puzzle-piece" style="color: var(--neon-cyan);"></i> RELATED SUBSCRIPTIONS
                        </h3>
                        <div class="grid-3" style="gap: 20px;">
                            ${related.map(item => `
                                <div class="glass-panel text-center" style="padding: 20px; border-color: rgba(255,255,255,0.03); background: rgba(0,0,0,0.25); display: flex; flex-direction: column; justify-content: space-between; min-height: 250px;">
                                    <div>
                                        <img src="${item.image || 'assets/coming_soon.png'}" style="width: 50px; height: 50px; object-fit: contain; margin: 10px auto; display: block; border-radius: 6px; background: rgba(0,0,0,0.3); padding: 3px; border: 1px solid var(--glass-border);">
                                        <h5 class="font-orbitron" style="font-size: 13px; color: #fff; margin: 10px 0 5px 0; text-transform: uppercase;">${item.name}</h5>
                                        <p style="font-size: 11px; color: var(--text-silver); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; margin-bottom: 15px;">${item.description || 'Premium subscription licenses'}</p>
                                    </div>
                                    <div>
                                        <div style="font-size: 13px; color: var(--neon-yellow); font-family: var(--font-header); font-weight: bold; margin-bottom: 12px;">INR ${item.discountedPrice || item.price}</div>
                                        <a href="#/shop?product=${item.id}" class="cta-button btn-neon-cyan w-full" style="padding: 6px 10px; font-size: 10px; font-weight: 800;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">VIEW DETAILS</a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

            </section>
        `;

        // Bind Share click
        const shareBtn = document.getElementById('btn-share-product');
        if (shareBtn) {
            shareBtn.onclick = function() {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const toast = document.createElement('div');
                    toast.className = 'glass-panel font-orbitron';
                    toast.style.position = 'fixed';
                    toast.style.bottom = '100px';
                    toast.style.left = '50%';
                    toast.style.transform = 'translateX(-50%)';
                    toast.style.padding = '12px 25px';
                    toast.style.color = '#fff';
                    toast.style.border = '1px solid var(--neon-cyan-border)';
                    toast.style.background = 'rgba(0,0,0,0.9)';
                    toast.style.zIndex = '999999';
                    toast.style.fontSize = '12px';
                    toast.style.letterSpacing = '0.05em';
                    toast.style.borderRadius = '4px';
                    toast.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.25)';
                    toast.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--neon-cyan); margin-right: 8px;"></i> PRODUCT SHARE LINK COPIED!';
                    
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transition = 'opacity 0.5s';
                        setTimeout(() => toast.remove(), 500);
                    }, 2000);
                }).catch(err => {
                    alert("Copy failed: " + err.message);
                });
            };
        }
    }

    // ==========================================
    // STOREFRONT CATALOG PAGE RENDERER
    // ==========================================
    function renderCatalogPage(container, products, whatsappNum, template) {
        // Categories list
        const categories = ["All", "OTT", "AI Tools", "Software", "Productivity", "Design", "Streaming", "Others"];
        
        let selectedCategory = "All";
        let searchQuery = "";
        let selectedSort = "Recommended";
        let filterFeaturedOnly = false;
        let filterNewOnly = false;

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 950px;">
                
                <!-- Promotional Banner -->
                <div class="glass-panel" style="border-color: var(--neon-cyan-border); padding: 35px; box-shadow: 0 0 25px rgba(0, 240, 255, 0.05); margin-bottom: 30px; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0, 40, 60, 0.8) 100%);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(0, 240, 255, 0.04); border-radius: 50%; filter: blur(30px); pointer-events: none;"></div>
                    <div style="display: flex; gap: 25px; align-items: center; flex-wrap: wrap; position: relative; z-index: 2;">
                        <i class="fa-solid fa-tags" style="font-size: 48px; color: var(--neon-cyan); filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.4));"></i>
                        <div style="flex: 1; min-width: 250px; text-align: left;">
                            <h3 class="font-orbitron" style="font-size: 18px; color: #fff; margin-bottom: 6px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">STRIKZ DIGITAL STOREFRONT</h3>
                            <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin: 0;">
                                Get premium entertainment OTT activations and AI builder tools licenses at exclusive gamer discounts of <strong style="color:var(--neon-yellow);">up to 70% OFF</strong>. Instant activation, 24/7 support & secure communication over WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Catalog Filters Controls -->
                <div class="glass-panel" style="padding: 20px; border-color: rgba(255,255,255,0.03); background: rgba(0,0,0,0.15); margin-bottom: 30px; display: grid; gap: 15px; grid-template-columns: 1fr auto; flex-wrap: wrap; align-items: center; min-width: 0;">
                    
                    <!-- Search Input & Sorting & Filters -->
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center; width: 100%; min-width: 0;">
                        
                        <!-- Search Box -->
                        <div style="position: relative; flex-grow: 1; min-width: 200px; display: flex; align-items: center;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 12px; color: var(--text-dim); font-size: 13px;"></i>
                            <input type="text" id="shop-search-input" placeholder="Search subscriptions (e.g. Netflix, ChatGPT)..." style="padding: 10px 12px 10px 36px; color: #fff; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 4px; font-size: 12.5px; width: 100%;">
                        </div>

                        <!-- Sort dropdown -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 11px; font-family: var(--font-header); color: var(--text-silver); text-transform: uppercase;">Sort By:</label>
                            <select id="shop-sort-select" style="background: rgba(0,0,0,0.5); color: #fff; border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                <option value="Recommended">Recommended</option>
                                <option value="LowToHigh">Price: Low to High</option>
                                <option value="HighToLow">Price: High to Low</option>
                                <option value="BestDeals">Best Deals</option>
                            </select>
                        </div>
                    </div>

                    <!-- Toggles switches -->
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; cursor: pointer; color: var(--text-silver); font-family: var(--font-header); text-transform: uppercase;">
                            <input type="checkbox" id="shop-filter-featured" style="width: 15px; height: 15px;"> Featured Only
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; cursor: pointer; color: var(--text-silver); font-family: var(--font-header); text-transform: uppercase;">
                            <input type="checkbox" id="shop-filter-new" style="width: 15px; height: 15px;"> New Arrivals
                        </label>
                    </div>

                </div>

                <!-- Category Filters Tabs -->
                <div class="comms-tabs-nav font-orbitron" style="display: flex; gap: 8px; margin-bottom: 30px; padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch;">
                    ${categories.map(c => `
                        <button class="tab-trigger category-tab-btn ${c === selectedCategory ? 'active' : ''}" data-category="${c}" style="background: none; border: none; font-size: 12px; font-weight: 800; padding: 8px 16px; cursor: pointer; font-family: var(--font-header); letter-spacing: 0.05em; transition: all 0.2s; border-radius: 4px; border: 1px solid ${c === selectedCategory ? 'var(--neon-cyan-border)' : 'transparent'}; color: ${c === selectedCategory ? 'var(--neon-cyan)' : 'var(--text-dim)'}; background: ${c === selectedCategory ? 'rgba(0, 240, 255, 0.05)' : 'none'};">
                            ${c.toUpperCase()}
                        </button>
                    `).join('')}
                </div>

                <!-- Products Grid -->
                <div id="shop-catalog-grid-mount" class="grid-3" style="gap: 20px; margin-bottom: 60px;">
                    <!-- Loaded dynamically -->
                </div>

                <!-- Customer FAQ Accordions -->
                <div style="margin-top: 70px; border-top: 1px solid var(--glass-border); padding-top: 50px;">
                    <h3 class="font-orbitron text-center" style="font-size: 18px; color: #fff; margin-bottom: 30px; letter-spacing: 0.05em; font-weight: 800; text-transform: uppercase;">
                        SHOP <span style="color: var(--neon-cyan);">FAQ</span> & HELP
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 700px; margin: 0 auto;">
                        
                        <div class="faq-item glass-panel" style="padding: 15px 20px; border-color: rgba(255,255,255,0.03); cursor: pointer; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <h5 class="font-orbitron" style="font-size: 12.5px; color: #fff; margin: 0;">HOW DO I PURCHASE A SUBSCRIPTION PLAN?</h5>
                                <i class="fa-solid fa-plus faq-icon" style="color: var(--neon-cyan); font-size: 12px;"></i>
                            </div>
                            <p class="faq-content" style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-top: 10px; display: none;">
                                To buy any subscription plan, browse our shop catalog, select a product, and click the "Buy Now" or "Buy Via WhatsApp" CTA button. You will be redirected instantly to our official WhatsApp support number with a pre-filled message detailing your desired product. Our support agents will guide you through instant payment details (via UPI, Cards, etc.) and deliver your activation credentials.
                            </p>
                        </div>

                        <div class="faq-item glass-panel" style="padding: 15px 20px; border-color: rgba(255,255,255,0.03); cursor: pointer; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <h5 class="font-orbitron" style="font-size: 12.5px; color: #fff; margin: 0;">HOW LONG DOES ACCOUNT ACTIVATION TAKE?</h5>
                                <i class="fa-solid fa-plus faq-icon" style="color: var(--neon-cyan); font-size: 12px;"></i>
                            </div>
                            <p class="faq-content" style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-top: 10px; display: none;">
                                Activation is extremely fast! Most credentials (such as Netflix screens or ChatGPT Plus accounts) are delivered within 5 to 15 minutes of payment verification. In rare cases where licensing servers are congested, activation might take up to 2 hours.
                            </p>
                        </div>

                        <div class="faq-item glass-panel" style="padding: 15px 20px; border-color: rgba(255,255,255,0.03); cursor: pointer; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <h5 class="font-orbitron" style="font-size: 12.5px; color: #fff; margin: 0;">ARE THESE ACCOUNTS PRIVATE OR SHARED?</h5>
                                <i class="fa-solid fa-plus faq-icon" style="color: var(--neon-cyan); font-size: 12px;"></i>
                            </div>
                            <p class="faq-content" style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-top: 10px; display: none;">
                                We offer both private accounts (sole access) and shared screen plans (dedicated personal profile/screen on a shared premium family account). The details, limit parameters, and rules are explicitly configured under each plan's features list when viewing details.
                            </p>
                        </div>

                        <div class="faq-item glass-panel" style="padding: 15px 20px; border-color: rgba(255,255,255,0.03); cursor: pointer; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                <h5 class="font-orbitron" style="font-size: 12.5px; color: #fff; margin: 0;">IS THERE A WARRANTY/REFUND FOR DIALLED PLANS?</h5>
                                <i class="fa-solid fa-plus faq-icon" style="color: var(--neon-cyan); font-size: 12px;"></i>
                            </div>
                            <p class="faq-content" style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-top: 10px; display: none;">
                                Yes! All digital purchases are fully backed by our security warranty. If any credential has issues or stops functioning during the purchased duration, we will instantly replace the credentials or restore access free of charge. Contact us via our WhatsApp channel for immediate troubleshooting.
                            </p>
                        </div>

                    </div>
                </div>

            </section>
        `;

        const gridMount = document.getElementById('shop-catalog-grid-mount');
        const searchInput = document.getElementById('shop-search-input');
        const sortSelect = document.getElementById('shop-sort-select');
        const featCheck = document.getElementById('shop-filter-featured');
        const newCheck = document.getElementById('shop-filter-new');

        function loadFilteredCatalog() {
            // Filter products
            let list = products.filter(p => p.enabled !== false);

            // Category filter
            if (selectedCategory !== "All") {
                list = list.filter(p => p.category === selectedCategory);
            }

            // Search query filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                list = list.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    p.category.toLowerCase().includes(q) || 
                    (p.description && p.description.toLowerCase().includes(q))
                );
            }

            // Featured only filter
            if (filterFeaturedOnly) {
                list = list.filter(p => p.featured === true);
            }

            // New arrivals filter (take items with badge "New" or recently added - last 4 items)
            if (filterNewOnly) {
                list = list.filter(p => p.badge && p.badge.toLowerCase() === 'new');
            }

            // Sorting logic
            if (selectedSort === "LowToHigh") {
                list.sort((a, b) => (parseFloat(a.discountedPrice || a.price) || 0) - (parseFloat(b.discountedPrice || b.price) || 0));
            } else if (selectedSort === "HighToLow") {
                list.sort((a, b) => (parseFloat(b.discountedPrice || b.price) || 0) - (parseFloat(a.discountedPrice || a.price) || 0));
            } else if (selectedSort === "BestDeals") {
                // Sort by highest percentage discount
                list.sort((a, b) => {
                    const priceA = parseFloat(a.price) || 0;
                    const discA = parseFloat(a.discountedPrice) || priceA;
                    const saveA = priceA > 0 ? (priceA - discA) / priceA : 0;

                    const priceB = parseFloat(b.price) || 0;
                    const discB = parseFloat(b.discountedPrice) || priceB;
                    const saveB = priceB > 0 ? (priceB - discB) / priceB : 0;

                    return saveB - saveA;
                });
            } else {
                // Default: sortOrder asc, id desc
                list.sort((a, b) => {
                    const sortA = parseInt(a.sortOrder) || 0;
                    const sortB = parseInt(b.sortOrder) || 0;
                    if (sortA !== sortB) return sortA - sortB;
                    return b.id - a.id;
                });
            }

            // Render
            gridMount.innerHTML = list.length === 0 ? `
                <div class="glass-panel text-center" style="grid-column: 1 / -1; padding: 50px;">
                    <i class="fa-solid fa-magnifying-glass-chart" style="font-size: 40px; color: var(--neon-orange); margin-bottom: 12px;"></i>
                    <h5 class="font-orbitron" style="color: #fff; margin-bottom: 5px;">NO MATCHES FOUND</h5>
                    <p style="color: var(--text-silver); font-size: 12px; margin: 0;">Try adjusting your query, selecting a different category, or resetting active filters.</p>
                </div>
            ` : list.map(p => {
                const safeImage = p.image || 'assets/coming_soon.png';
                const regPrice = parseFloat(p.price) || 0;
                const discPrice = parseFloat(p.discountedPrice) || 0;
                const savingsPercent = regPrice > 0 ? Math.round(((regPrice - discPrice) / regPrice) * 100) : 0;

                return `
                    <div class="glass-panel text-center reveal-item" style="padding: 20px; border-color: rgba(255,255,255,0.03); display: flex; flex-direction: column; justify-content: space-between; min-height: 360px; position: relative; background: rgba(0,0,0,0.3); transition: all 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                        
                        <!-- Badges -->
                        <div style="position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 5px; align-items: flex-start;">
                            ${p.badge && p.badge !== 'none' ? `
                                <span class="badge-status status-approved font-orbitron" style="font-size: 8px; font-weight: 800; padding: 2px 6px; text-transform: uppercase;">
                                    ${p.badge}
                                </span>
                            ` : ''}
                            ${savingsPercent > 0 && p.price && p.discountedPrice ? `
                                <span class="badge-status status-pending font-orbitron" style="font-size: 8px; font-weight: 800; padding: 2px 6px; background: rgba(34, 197, 94, 0.1); border-color: rgba(34,197,94,0.3); color: var(--neon-green);">
                                    ${savingsPercent}% OFF
                                </span>
                            ` : ''}
                        </div>

                        <div style="font-size: 8px; font-weight: 800; font-family: var(--font-header); letter-spacing: 0.1em; color: var(--neon-cyan); background: rgba(0, 240, 255, 0.08); border: 1px solid var(--neon-cyan-border); padding: 3px 8px; border-radius: 3px; position: absolute; top: 12px; right: 12px; text-transform: uppercase;">
                            ${p.category}
                        </div>

                        <div>
                            <!-- Logo -->
                            <div style="width: 70px; height: 70px; margin: 20px auto 15px auto; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); padding: 5px; display: flex; align-items: center; justify-content: center;">
                                <img src="${safeImage}" alt="${p.name} Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
                            </div>

                            <!-- Name -->
                            <h4 class="font-orbitron" style="font-size: 14.5px; color: #fff; margin-bottom: 6px; letter-spacing: 0.03em; font-weight: 800; text-transform: uppercase;">
                                ${p.name}
                            </h4>

                            <!-- Summary -->
                            <p style="font-size: 11px; color: var(--text-silver); line-height: 1.4; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${p.description || 'Premium subscription activation keys.'}
                            </p>
                        </div>

                        <div>
                            <!-- Price -->
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 15px;">
                                ${p.price && p.discountedPrice ? `<span style="font-size: 10px; text-decoration: line-through; color: var(--text-dim); font-weight: bold; font-family: var(--font-header);">INR ${p.price}</span>` : ''}
                                <span style="font-size: 16px; color: var(--neon-yellow); font-weight: 800; font-family: var(--font-header);">
                                    INR ${p.discountedPrice || p.price}
                                </span>
                            </div>

                            <!-- View Details -->
                            <a href="#/shop?product=${p.id}" class="cta-button btn-neon-cyan w-full" style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 6px; border-radius: 4px;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                                <i class="fa-solid fa-cart-shopping"></i> BUY NOW / DETAILS
                            </a>
                        </div>

                    </div>
                `;
            }).join('');
        }

        // Bind Search
        searchInput.oninput = function() {
            searchQuery = this.value.trim();
            loadFilteredCatalog();
        };

        // Bind Sort
        sortSelect.onchange = function() {
            selectedSort = this.value;
            loadFilteredCatalog();
        };

        // Bind Featured Toggle
        featCheck.onchange = function() {
            filterFeaturedOnly = this.checked;
            loadFilteredCatalog();
        };

        // Bind New Toggle
        newCheck.onchange = function() {
            filterNewOnly = this.checked;
            loadFilteredCatalog();
        };

        // Bind Categories tabs clicks
        document.querySelectorAll('.category-tab-btn').forEach(btn => {
            btn.onclick = function() {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                document.querySelectorAll('.category-tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = 'transparent';
                    b.style.color = 'var(--text-dim)';
                    b.style.background = 'none';
                });
                
                this.classList.add('active');
                this.style.borderColor = 'var(--neon-cyan-border)';
                this.style.color = 'var(--neon-cyan)';
                this.style.background = 'rgba(0, 240, 255, 0.05)';
                
                selectedCategory = this.dataset.category;
                loadFilteredCatalog();
            };
        });

        // FAQ accordion toggle binding
        document.querySelectorAll('.faq-item').forEach(item => {
            item.onclick = function() {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                
                const content = this.querySelector('.faq-content');
                const icon = this.querySelector('.faq-icon');
                
                if (content.style.display === 'none' || !content.style.display) {
                    content.style.display = 'block';
                    icon.className = 'fa-solid fa-minus faq-icon';
                    this.style.borderColor = 'var(--neon-cyan-border)';
                } else {
                    content.style.display = 'none';
                    icon.className = 'fa-solid fa-plus faq-icon';
                    this.style.borderColor = 'rgba(255,255,255,0.03)';
                }
            };
        });

        // Initialize load
        loadFilteredCatalog();
    }

    window.renderShop = renderShop;
})();
