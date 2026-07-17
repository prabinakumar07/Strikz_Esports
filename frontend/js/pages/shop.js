/* ==========================================================================
   STRIKZ ESPORTS - SHOP PAGE RENDERER (SUBSCRIPTIONS STOREFRONT)
   ========================================================================== */

(function() {
    function renderShop(container) {
        const db = window.strikzDb.get();
        const products = db.products || [];
        const settings = db.settings || {};
        const rawWhatsapp = settings.whatsappNumber || '';
        const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '');

        // Separate products by category
        const ottProducts = products.filter(p => p.category === 'OTT');
        const aiProducts = products.filter(p => p.category === 'AI');
        const otherProducts = products.filter(p => p.category !== 'OTT' && p.category !== 'AI');

        const renderProductCard = (p) => {
            const safeImage = p.image || 'assets/coming_soon.png';
            const customMsg = `Hello Strikz Esports! I want to buy the "${p.name}" subscription plan for INR ${p.discountedPrice || p.price}. Please guide me on payment details.`;
            const waLink = cleanWhatsapp 
                ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(customMsg)}`
                : 'javascript:alert("WhatsApp support number is not configured in settings yet. Please contact support via email.");';

            return `
                <div class="glass-panel text-center reveal-item" style="padding: 25px 20px; border-color: rgba(255,255,255,0.03); display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; position: relative; overflow: hidden; background: rgba(0,0,0,0.3); transition: all 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                    
                    <!-- Top Ribbon / Category tag -->
                    <div style="font-size: 8px; font-weight: 800; font-family: var(--font-header); letter-spacing: 0.1em; color: var(--neon-cyan); background: rgba(0, 240, 255, 0.08); border: 1px solid var(--neon-cyan-border); padding: 3px 8px; border-radius: 3px; position: absolute; top: 12px; right: 12px; text-transform: uppercase;">
                        ${p.category}
                    </div>

                    <div>
                        <!-- Product Logo / Image -->
                        <div style="width: 75px; height: 75px; margin: 15px auto 20px auto; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); padding: 5px; display: flex; align-items: center; justify-content: center;">
                            <img src="${safeImage}" alt="${p.name} Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
                        </div>

                        <!-- Product Title -->
                        <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin-bottom: 8px; letter-spacing: 0.03em; font-weight: 800; text-transform: uppercase;">
                            ${p.name}
                        </h4>

                        <!-- Product description -->
                        <p style="font-size: 11.5px; color: var(--text-silver); line-height: 1.5; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                            ${p.description || 'Premium subscription license activation keys.'}
                        </p>
                    </div>

                    <div>
                        <!-- Price tags -->
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px;">
                            ${p.price ? `<span style="font-size: 11px; text-decoration: line-through; color: var(--text-dim); font-weight: bold; font-family: var(--font-header);">INR ${p.price}</span>` : ''}
                            <span style="font-size: 18px; color: var(--neon-yellow); font-weight: 800; font-family: var(--font-header); letter-spacing: 0.02em; text-shadow: 0 0 10px rgba(255, 230, 0, 0.15);">
                                INR ${p.discountedPrice || p.price}
                            </span>
                        </div>

                        <!-- Buy button -->
                        <a href="${waLink}" target="${cleanWhatsapp ? '_blank' : '_self'}" class="cta-button btn-neon-cyan w-full" style="padding: 10px 15px; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 4px;" onclick="if(window.strikzPlayClickSound) window.strikzPlayClickSound();">
                            <i class="fa-solid fa-cart-shopping"></i> BUY NOW
                        </a>
                    </div>

                </div>
            `;
        };

        const renderCategorySection = (title, icon, list) => {
            if (list.length === 0) return '';
            return `
                <div style="margin-bottom: 50px;">
                    <h3 class="font-orbitron" style="font-size: 14px; color: var(--text-white); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; letter-spacing: 0.05em; font-weight: 800;">
                        <i class="${icon}" style="color: var(--neon-cyan);"></i> ${title.toUpperCase()}
                    </h3>
                    <div class="grid-3" style="gap: 20px;">
                        ${list.map(renderProductCard).join('')}
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 950px;">
                
                <!-- Section Header -->
                <div class="section-header" style="margin-bottom: 40px;">
                    <span class="section-subtitle">PREMIUM SERVICE LICENSES</span>
                    <h2 class="section-title">SUBSCRIBERS <span>SHOP</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="glass-panel" style="border-color: var(--neon-cyan-border); padding: 35px; box-shadow: 0 0 25px rgba(0, 240, 255, 0.02); margin-bottom: 30px;">
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <i class="fa-solid fa-tags" style="font-size: 42px; color: var(--neon-cyan); filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.3));"></i>
                        <div style="flex: 1; min-width: 250px;">
                            <h3 class="font-orbitron" style="font-size: 16px; color: #fff; margin-bottom: 6px;">DISCOUNTED SUBSCRIPTIONS DESPATCH</h3>
                            <p style="font-size: 12.5px; color: var(--text-silver); line-height: 1.5; margin: 0;">
                                Get premium entertainment OTT activations and AI builder tools licenses at exclusive gamer discounts. Simply choose your plan, click buy, and communicate with support over WhatsApp to activate your credentials!
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Products Grid Categories -->
                <div id="shop-catalog-mount">
                    ${products.length === 0 ? `
                        <div class="glass-panel text-center" style="padding: 60px 20px; border-color: rgba(255,255,255,0.03);">
                            <i class="fa-solid fa-store-slash" style="font-size: 48px; color: var(--neon-orange); margin-bottom: 15px;"></i>
                            <h4 class="font-orbitron" style="color: #fff; margin-bottom: 8px;">NO ITEMS LISTED</h4>
                            <p style="font-size: 13px; color: var(--text-silver); max-width: 450px; margin: 0 auto;">
                                The subscription store is currently restocking. Check back soon for discounted Netflix, Amazon Prime, and AI tools access!
                            </p>
                        </div>
                    ` : `
                        ${renderCategorySection('OTT Subscriptions', 'fa-solid fa-tv', ottProducts)}
                        ${renderCategorySection('AI & Developer Tools', 'fa-solid fa-robot', aiProducts)}
                        ${renderCategorySection('Other Licenses', 'fa-solid fa-puzzle-piece', otherProducts)}
                    `}
                </div>

            </section>
        `;
    }

    window.renderShop = renderShop;
})();
