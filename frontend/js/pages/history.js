/* ==========================================================================
   STRIKZ ESPORTS - TOURNAMENT HISTORY PAGE RENDERER
   ========================================================================== */

(function() {
    function renderHistory(container) {
        const db = window.strikzDb.get();
        // Load closed or seeded past tournaments
        const pastTournaments = db.tournaments.filter(t => t.status === 'Closed');

        // Initial past history list if empty
        const records = [
            { id: 1, tournament: 'Free Fire India Championship (FFIC) 2025', placement: '1st (Champions)', prize: '$80,000 USD', kills: '142 Kills', mvp: 'STRIKZ.Storm' },
            { id: 2, tournament: 'Free Fire World Series (FFWS) Bangkok 2025', placement: '2nd (Runners-Up)', prize: '$250,000 USD', kills: '210 Kills', mvp: 'STRIKZ.Viper' },
            { id: 3, tournament: 'Clash Squad Master Invitational 2024', placement: '1st (Champions)', prize: '$20,000 USD', kills: '84 Squad Wipes', mvp: 'STRIKZ.Deadeye' },
            { id: 4, tournament: 'Asia Arena Showdown 2024', placement: '3rd Place', prize: '$10,000 USD', kills: '115 Kills', mvp: 'STRIKZ.Storm' },
            { id: 5, tournament: 'Guild Wars Season 4', placement: '1st (Champions)', prize: '$5,000 USD', kills: '78 Kills', mvp: 'STRIKZ.Guardian' }
        ];

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">COMPETITIVE TRAIL</span>
                    <h2 class="section-title">TOURNAMENT <span>RECORD HISTORY</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="glass-panel reveal" style="padding: 30px; border-color: var(--neon-orange-border);">
                    <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-orange); margin-bottom: 20px;"><i class="fa-solid fa-file-invoice-dollar"></i> PRIZE WINNINGS LOG</h3>
                    
                    <div class="history-table-container">
                        <table class="history-table">
                            <thead>
                                <tr>
                                    <th>Tournament / Campaign</th>
                                    <th>Placement</th>
                                    <th>Prize Won</th>
                                    <th>Total Squad Kills</th>
                                    <th>Team MVP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map(rec => `
                                    <tr>
                                        <td style="font-weight: 600; color: #fff;">${rec.tournament}</td>
                                        <td class="${rec.placement.includes('1st') ? 'history-winner' : ''}">${rec.placement}</td>
                                        <td class="history-prize">${rec.prize}</td>
                                        <td>${rec.kills}</td>
                                        <td style="color: var(--neon-cyan); font-family: var(--font-header); font-size: 12px;">${rec.mvp}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Closed Scrims Showcase -->
                ${pastTournaments.length > 0 ? `
                <div style="margin-top: 50px;">
                    <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px; text-align: center;">RECENT CLOSED CAMPAIGNS</h3>
                    <div class="grid-2">
                        ${pastTournaments.map(t => `
                            <div class="glass-panel" style="display: flex; gap: 20px; align-items: center;">
                                <div style="width: 100px; height: 80px; overflow: hidden; border-radius: 4px;">
                                    <img src="${t.image}" alt="${t.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div style="flex: 1;">
                                    <h4 class="font-orbitron" style="font-size: 15px; color: #fff;">${t.name}</h4>
                                    <p style="font-size: 12px; color: var(--text-silver); margin: 4px 0;">Prize Pool: <strong style="color: var(--neon-green);">${t.prizePool}</strong></p>
                                    <span class="badge-status status-rejected" style="font-size: 8px; padding: 2px 6px;">CLOSED</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </section>
        `;
    }

    // Attach to global window
    window.renderHistory = renderHistory;
})();
