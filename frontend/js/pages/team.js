/* ==========================================================================
   STRIKZ ESPORTS - ROSTER PAGE RENDERER
   ========================================================================== */

(function() {
    function renderTeam(container) {
        const db = window.strikzDb.get();
        const roster = db.roster;
        const settings = db.settings || {};

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">THE SQUAD</span>
                    <h2 class="section-title">OFFICIAL <span>ESPORTS TEAM</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Category Filters -->
                <div class="filter-tabs">
                    <button class="filter-tab active" data-category="pro">PRO PLAYERS</button>
                    <button class="filter-tab" data-category="support">COACH & MGMT</button>
                </div>

                <!-- Roster Grid -->
                <div class="grid-4 reveal-stagger" id="roster-grid">
                    <!-- Cards injected by JS -->
                </div>
            </section>
        `;

        const rosterGrid = document.getElementById('roster-grid');

        // Render functions
        function displayRoster(filter) {
            let list = roster;
            if (filter === 'pro') {
                list = roster.filter(p => !p.role.toLowerCase().includes('management') && !p.role.toLowerCase().includes('coach') && !p.role.toLowerCase().includes('manager'));
            } else if (filter === 'support') {
                list = roster.filter(p => p.role.toLowerCase().includes('management') || p.role.toLowerCase().includes('coach') || p.role.toLowerCase().includes('manager'));
            }

            rosterGrid.innerHTML = list.map(player => {
                const visibleStatsCount = [
                    settings.showKd !== false,
                    settings.showHs !== false,
                    settings.showMatches !== false,
                    settings.showWinRate === true,
                    settings.showRank !== false
                ].filter(Boolean).length;

                return `
                <div class="player-card">
                    <div class="player-card-overlay"></div>
                    <img src="${player.avatar}" alt="${player.tag}" class="player-avatar">
                    <div class="player-details">
                        <span style="font-size: 10px; color: var(--neon-orange); font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: inline-block; letter-spacing: 0.05em;">${player.role}</span>
                        <h3 class="player-tag">${player.tag}</h3>
                        <p class="player-real-name">${player.fullName}</p>
                        
                        ${visibleStatsCount > 0 ? `
                        <div class="player-stats-row" style="grid-template-columns: repeat(${visibleStatsCount}, 1fr); padding: 8px 4px;">
                            ${(settings.showKd !== false) ? `
                            <div>
                                <div class="player-stat-val">${player.stats && player.stats.kd ? player.stats.kd : (player.kd || 'N/A')}</div>
                                <div class="player-stat-lbl">K/D</div>
                            </div>
                            ` : ''}
                            ${(settings.showHs !== false) ? `
                            <div>
                                <div class="player-stat-val">${player.stats && player.stats.hs ? player.stats.hs : (player.hs || 'N/A')}</div>
                                <div class="player-stat-lbl">HS%</div>
                            </div>
                            ` : ''}
                            ${(settings.showMatches !== false) ? `
                            <div>
                                <div class="player-stat-val">${player.stats && player.stats.matches ? player.stats.matches : (player.matches || 'N/A')}</div>
                                <div class="player-stat-lbl">Matches</div>
                            </div>
                            ` : ''}
                            ${(settings.showWinRate === true) ? `
                            <div>
                                <div class="player-stat-val">${player.stats && player.stats.winRate ? player.stats.winRate : (player.winRate || 'N/A')}</div>
                                <div class="player-stat-lbl">Win %</div>
                            </div>
                            ` : ''}
                            ${(settings.showRank !== false) ? `
                            <div>
                                <div class="player-stat-val">${player.stats && player.stats.rank ? player.stats.rank : (player.rank || 'N/A')}</div>
                                <div class="player-stat-lbl">Rank</div>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}

                        <div class="player-socials">
                            <a href="${player.twitter}" class="player-social-icon" title="Twitter" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-x-twitter"></i></a>
                            <a href="${player.youtube}" class="player-social-icon" title="YouTube" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube"></i></a>
                            <a href="${player.instagram}" class="player-social-icon" title="Instagram" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            // Re-trigger reveal states for filtered cards
            setTimeout(() => {
                rosterGrid.classList.add('active');
                rosterGrid.querySelectorAll('.player-card').forEach(card => {
                    card.style.opacity = 1;
                    card.style.transform = 'translateY(0)';
                });
            }, 50);
        }

        // Initial render
        displayRoster('pro');

        // Event Listeners for Filters
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const category = e.target.dataset.category;
                displayRoster(category);
            });
        });
    }

    // Attach to global window
    window.renderTeam = renderTeam;
})();
