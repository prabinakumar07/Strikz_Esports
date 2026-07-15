/* ==========================================================================
   STRIKZ ESPORTS - SPONSORS SHOWCASE & BRAND PROMOTIONS
   ========================================================================== */

(function() {
    function renderSponsorsPage(container) {
        const db = window.strikzDb.get();
        const sponsors = db.sponsors || [];

        // Sponsored Channels / Promotions (Only show tier 'Ad')
        const sponsoredPromos = sponsors.filter(s => s.tier === 'Ad');

        container.innerHTML = `
            <!-- Page Header -->
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 40px;">
                <div class="section-header">
                    <span class="section-subtitle">FEATURED PROMOTIONS</span>
                    <h2 class="section-title">AD <span>SPONSORS</span></h2>
                    <div class="section-divider"></div>
                </div>
                <p class="text-center" style="max-width: 700px; margin: 0 auto; color: var(--text-silver); font-size: 14px; line-height: 1.6;">
                    Explore products, channels, and special community promotions sponsored by our paid advertisers.
                </p>
            </section>

            <!-- Ad Sponsors Showcase -->
            <section class="container bg-section-black reveal" style="margin-bottom: 80px;">
                ${sponsoredPromos.length > 0 ? `
                <div class="grid-3" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    ${sponsoredPromos.map(sp => `
                        <div class="glass-panel" style="border: 2px solid var(--neon-orange-border); box-shadow: 0 0 15px rgba(255, 230, 0, 0.08); background: rgba(255, 230, 0, 0.01); display: flex; flex-direction: column; justify-content: space-between; padding: 25px;">
                            <div>
                                <span style="font-size: 9px; font-weight: 800; background: rgba(255, 230, 0, 0.1); border: 1px solid var(--neon-yellow-border); color: var(--neon-yellow); padding: 3px 8px; border-radius: 4px; font-family: var(--font-header); text-transform: uppercase;">
                                    ${sp.promoType || 'Sponsorship'}
                                </span>
                                <h4 class="font-orbitron" style="font-size: 18px; color: #fff; margin-top: 15px; margin-bottom: 8px;">${sp.name}</h4>
                                <p style="font-size: 12px; color: var(--text-silver); line-height: 1.5; margin-bottom: 20px;">
                                    ${sp.description || 'Visit our official brand partner for exclusive details, products, and community events!'}
                                </p>
                            </div>
                            <a href="${sp.link}" target="_blank" class="cta-button btn-neon-orange text-center font-orbitron" style="display: block; padding: 10px 0; font-size: 11px; font-weight: 900;">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> CLICK HERE
                            </a>
                        </div>
                    `).join('')}
                </div>
                ` : `
                <div class="glass-panel text-center" style="padding: 60px 20px; border-color: var(--glass-border);">
                    <i class="fa-solid fa-rectangle-ad" style="font-size: 48px; color: var(--text-dim); margin-bottom: 20px;"></i>
                    <h4 class="font-orbitron" style="color: #fff; margin-bottom: 10px; text-transform: uppercase;">No Active Advertisements</h4>
                    <p style="color: var(--text-silver); font-size: 13px; max-width: 500px; margin: 0 auto; line-height:1.6;">
                        There are currently no active paid advertisements running on the arena portal. If you want to promote your brand or channel here, contact support.
                    </p>
                </div>
                `}
            </section>
        `;
    }

    // Attach to global window
    window.renderSponsorsPage = renderSponsorsPage;
})();
