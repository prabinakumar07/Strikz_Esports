/* ==========================================================================
   STRIKZ ESPORTS - WINNERS PAGE RENDERER
   ========================================================================== */

(function() {
    function renderAchievements(container) {
        const db = window.strikzDb.get();
        const trophies = db.achievements || [];

        // Check if there are any trophies
        if (trophies.length === 0) {
            container.innerHTML = `
                <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                    <div class="section-header">
                        <span class="section-subtitle">CHAMPIONSHIP WINNERS</span>
                        <h2 class="section-title">WINNER <span>SPOTLIGHT</span></h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="glass-panel text-center" style="padding: 60px 20px;">
                        <p style="color: var(--text-dim);">No championship winners recorded in the cabinet yet. Check back soon!</p>
                    </div>
                </section>
            `;
            return;
        }

        // The first index is the latest winner spotlight card
        const latest = trophies[0];
        const pastWinners = trophies.slice(1);

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">CHAMPIONSHIP WINNERS</span>
                    <h2 class="section-title">CHAMPIONS <span>SPOTLIGHT</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Latest Winner Hero Spotlight Card -->
                <div class="glass-panel" style="border: 1px solid var(--neon-cyan-border); box-shadow: 0 0 25px rgba(212, 175, 55, 0.08); margin-bottom: 60px; padding: 0; border-radius: var(--border-radius-lg); overflow: hidden;">
                    <div style="position: relative; height: 380px; overflow: hidden;">
                        <img src="${latest.image || 'assets/tournament_banner.png'}" alt="${latest.event}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, #050505 0%, rgba(5,5,5,0.7) 40%, rgba(5,5,5,0) 100%); z-index: 1;"></div>
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 30px; box-sizing: border-box; z-index: 2;">
                            <div style="background: var(--neon-cyan); color: #000; padding: 4px 12px; font-family: var(--font-header); font-size: 10px; font-weight: 900; border-radius: 4px; display: inline-block; margin-bottom: 12px; letter-spacing: 0.1em;">LATEST TOURNAMENT CHAMPIONS</div>
                            <h3 class="font-orbitron" style="font-size: 38px; font-weight: 900; line-height: 1.1; margin-bottom: 8px; text-transform: uppercase; text-shadow: 0 0 15px rgba(212, 175, 55, 0.25); color: #fff;">
                                ${latest.teamName}
                            </h3>
                            <p style="color: var(--neon-cyan); font-family: var(--font-header); font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                                ${latest.event} &bull; ${latest.date}
                            </p>
                        </div>
                    </div>
                    
                    <div class="achievements-highlight-grid" style="padding: 35px 30px; background: #080808;">
                        <div>
                            <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 13px; margin-bottom: 12px; letter-spacing: 0.05em; font-weight: 800;">TOURNAMENT HIGHLIGHTS</h4>
                            <p style="font-size: 14px; color: var(--text-silver); line-height: 1.6;">
                                ${latest.details}
                            </p>
                        </div>
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 22px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
                                <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-header); font-weight: 700;">PRIZE REWARD:</span>
                                <span style="font-size: 16px; font-weight: 900; color: var(--neon-green);">${latest.reward}</span>
                            </div>
                            <div>
                                <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; display: block; margin-bottom: 6px; font-family: var(--font-header); font-weight: 700;">CHAMPIONSHIP TITLE:</span>
                                <span class="font-orbitron" style="font-size: 15px; font-weight: 800; color: #fff; letter-spacing: 0.02em;">${latest.title}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Past Winners Cabinet Grid -->
                ${pastWinners.length > 0 ? `
                <div style="margin-top: 60px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 45px; letter-spacing: 0.05em;">PAST CHAMPIONSHIPS</h3>
                    
                    <div class="trophy-showcase reveal-stagger">
                        ${pastWinners.map(tr => `
                            <div class="glass-panel trophy-card ${tr.tier === 'gold' ? '' : (tr.tier === 'silver' ? 'silver-trophy' : 'bronze-trophy')}" style="border-radius: var(--border-radius-lg);">
                                <div class="trophy-icon">
                                    <i class="fa-solid fa-trophy"></i>
                                </div>
                                <h3 class="trophy-title font-orbitron">${tr.title}</h3>
                                <div class="trophy-event font-orbitron">${tr.event}</div>
                                <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 15px;">Date Secured: ${tr.date}</p>
                                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px; border-radius: 4px; display: inline-block;">
                                    <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-header);">Reward: </span>
                                    <span style="font-size: 12px; font-weight: 700; color: var(--neon-green);">${tr.reward}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Milestones / Roadmap -->
                <div class="reveal" style="margin-top: 80px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 40px; letter-spacing: 0.05em;">STRIKZ CLUB MILESTONES</h3>
                    
                    <div class="grid-2 reveal-stagger">
                        <div class="glass-panel" style="padding: 24px;">
                            <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-users"></i> 10,000+ DISCORD SURVIVORS</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Our official community server surpassed 10k members, serving as the main recruitment ground for Free Fire Max scrims and team matching.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px;">
                            <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-bolt"></i> GARENA LEVEL 4 GUILD</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Achieved Level 4 Guild status in-game, unlocking premium benefits, regional leaderboard multipliers, and guild showdown entries.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px; margin-top: 20px;">
                            <h4 class="font-orbitron" style="color: var(--neon-cyan); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-tv"></i> 5,000,000+ STREAM VIEWS</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Cumulative streaming views across tournament showcases, pro scrim channels, and YouTube highlights reached 5M views.</p>
                        </div>
                        <div class="glass-panel" style="padding: 24px; margin-top: 20px;">
                            <h4 class="font-orbitron" style="color: var(--neon-orange); font-size: 15px; margin-bottom: 12px;"><i class="fa-solid fa-handshake"></i> RED BULL TITLE SPONSORSHIP</h4>
                            <p style="font-size: 13px; color: var(--text-silver);">Signed our landmark title sponsorship deal, securing advanced bootcamp facilities, travel funding, and gear support.</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // Attach to global window
    window.renderAchievements = renderAchievements;
})();
