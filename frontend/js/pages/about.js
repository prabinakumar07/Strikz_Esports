/* ==========================================================================
   STRIKZ ESPORTS - ABOUT US PAGE RENDERER
   ========================================================================== */

(function() {
    function renderAbout(container) {
        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">WHO WE ARE</span>
                    <h2 class="section-title">ABOUT <span>STRIKZ ESPORTS</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="about-grid reveal-stagger">
                    <div>
                        <h3 class="font-orbitron" style="font-size: 22px; color: var(--neon-cyan); margin-bottom: 15px;">DOMINATING THE BATTLE ROYALE ARENA</h3>
                        <p style="color: var(--text-silver); margin-bottom: 18px;">Founded in 2024, Strikz Esports emerged as a highly competitive gaming collective focused on the intense, tactical combat of Free Fire Max. Our organization is dedicated to providing players a platform to go pro, giving sponsors high visibility, and creating community arenas for players globally.</p>
                        <p style="color: var(--text-silver); margin-bottom: 30px;">With an elite professional roster and a dedicated fanbase, we host premium championships, scrims, and league matches. Through high-tier infrastructure and clean esports operations, we bridge the gap between amateur survivors and professional world championships.</p>
                        
                        <div class="grid-2">
                            <div class="glass-panel" style="padding: 20px;">
                                <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 14px; margin-bottom: 8px;"><i class="fa-solid fa-crosshairs"></i> OUR MISSION</h4>
                                <p style="font-size: 13px; color: var(--text-silver);">To nurture grass-roots gaming talents and provide standard arenas to test skills, build teams, and claim global titles.</p>
                            </div>
                            <div class="glass-panel" style="padding: 20px;">
                                <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 14px; margin-bottom: 8px;"><i class="fa-solid fa-eye"></i> OUR VISION</h4>
                                <p style="font-size: 13px; color: var(--text-silver);">To establish Strikz as the leading Free Fire Max tournament manager globally, expanding access and elevating mobile esports.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-panel" style="text-align: center; border-color: var(--neon-cyan-border); box-shadow: 0 0 15px rgba(0, 240, 255, 0.05);">
                        <img src="assets/logo.png" alt="Strikz Shield" style="max-height: 180px; margin: 0 auto 20px auto;">
                        <h4 class="font-orbitron" style="font-size: 18px; margin-bottom: 6px;">STRIKZ GUILD HUB</h4>
                        <p style="font-size: 12px; color: var(--neon-cyan); letter-spacing: 0.1em; text-transform: uppercase;">Est. 2024 • Bermuda Arena</p>
                        <div style="border-top: 1px solid var(--glass-border); margin-top: 20px; padding-top: 15px;">
                            <span class="font-orbitron" style="font-size: 32px; font-weight: 900; color: var(--neon-orange);">#1</span>
                            <p style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em;">Ranked Free Fire Guild (Qualifiers)</p>
                        </div>
                    </div>
                </div>

                <!-- Organization Timeline -->
                <div class="reveal" style="margin-top: 80px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 30px;">OUR JOURNEY TO GLORY</h3>
                    <div class="about-timeline reveal-stagger">
                        <div class="timeline-item">
                            <span class="timeline-year">DECEMBER 2025</span>
                            <h4 class="timeline-title">Runners-Up at FFWS Bangkok</h4>
                            <p class="timeline-desc">Secured the second position on the global stage, competing against 18 elite world-class rosters and claiming a $250,000 prize pool.</p>
                        </div>
                        <div class="timeline-item">
                            <span class="timeline-year">OCTOBER 2025</span>
                            <h4 class="timeline-title">Crowned National Champions (FFIC)</h4>
                            <p class="timeline-desc">Fought through the Grand Finals of the Free Fire India Championship, breaking regional kill records in Bermuda and Purgatory maps.</p>
                        </div>
                        <div class="timeline-item">
                            <span class="timeline-year">AUGUST 2024</span>
                            <h4 class="timeline-title">Guild Launch & Master Invitational</h4>
                            <p class="timeline-desc">Strikz Guild officially registered. Within weeks, the active roster won the local Master Invitational, establishing regional dominance.</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // Attach to global window
    window.renderAbout = renderAbout;
})();
