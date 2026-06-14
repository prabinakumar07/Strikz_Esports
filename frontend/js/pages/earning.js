/* ==========================================================================
   STRIKZ ESPORTS - EARNING PAGE RENDERER
   ========================================================================== */

(function() {
    function renderEarning(container) {
        container.innerHTML = `
            <section class="container" style="padding-top: 60px; margin-bottom: 80px; text-align: center;">
                <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 40px; max-width: 800px; margin: 0 auto; box-shadow: 0 0 30px var(--neon-yellow-border);">
                    <h2 class="font-orbitron" style="color: var(--neon-yellow); margin-bottom: 20px; font-size: 24px; letter-spacing: 0.1em;">
                        <i class="fa-solid fa-hand-holding-dollar"></i> SQUAD EARNING PORTAL
                    </h2>
                    
                    <p style="font-size: 14px; color: var(--text-silver); line-height: 1.6; margin-bottom: 30px;">
                        Compete in premium matchups, complete daily survival challenges, and earn real-world currency dispatches and Strikz Token Credits. The elite arena belongs to those who earn their victory.
                    </p>

                    <div style="border: 2px solid var(--glass-border); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.4); margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <img src="assets/coming_soon.png" alt="Earning Coming Soon Poster" style="width: 100%; max-height: 450px; object-fit: cover; display: block;">
                    </div>

                    <div style="display: inline-flex; align-items: center; gap: 8px; color: var(--neon-cyan); font-family: var(--font-header); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border: 1px dashed var(--neon-cyan); padding: 10px 20px; border-radius: 4px; background: rgba(0, 240, 255, 0.03);">
                        <i class="fa-solid fa-triangle-exclamation fa-fade"></i> ESTABLISHED TRANSMISSION ONLINE IN NEXT PHASE
                    </div>
                </div>
            </section>
        `;
    }

    window.renderEarning = renderEarning;
})();
