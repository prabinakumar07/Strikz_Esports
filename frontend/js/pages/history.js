/* ==========================================================================
   STRIKZ ESPORTS - TOURNAMENT HISTORY PAGE RENDERER
   ========================================================================== */

(function() {
    function renderHistory(container) {
        const db = window.strikzDb.get() || {};
        const pastTournaments = (db.tournaments || []).filter(t => t.status === 'Closed');

        // Load winners list from admin panel history section
        const historyList = [...(db.history || [])].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'recent' ? -1 : 1;
            }
            return (a.rank || 99) - (b.rank || 99);
        });

        // Fallback default winners if empty
        let records = historyList;
        if (records.length === 0) {
            records = [
                { rank: 1, tournamentName: 'Free Fire India Championship (FFIC) 2025', title: 'STRIKZ ESPORTS', description: '$80,000 USD Prize Pool', date: 'October 2025', logo: 'assets/logo.png', type: 'recent' },
                { rank: 2, tournamentName: 'Free Fire World Series (FFWS) Bangkok 2025', title: 'STRIKZ ESPORTS', description: '$250,000 USD Prize Pool', date: 'Bangkok 2025', logo: '', type: 'recent' },
                { rank: 1, tournamentName: 'Clash Squad Master Invitational 2024', title: 'STRIKZ ESPORTS', description: '$20,000 USD Prize Pool', date: '2024', logo: '', type: 'past' },
                { rank: 3, tournamentName: 'Asia Arena Showdown 2024', title: 'STRIKZ ESPORTS', description: '$10,000 USD Prize Pool', date: '2024', logo: '', type: 'past' },
                { rank: 1, tournamentName: 'Guild Wars Season 4', title: 'STRIKZ ESPORTS', description: '$5,000 USD Prize Pool', date: '2024', logo: '', type: 'past' }
            ];
        }

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
                                    <th>Team / Roster</th>
                                    <th>Placement</th>
                                    <th>Prize / Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map(rec => {
                                    const logoHtml = rec.logo 
                                        ? `<img src="${rec.logo}" style="width:22px; height:22px; object-fit:contain; vertical-align:middle; margin-right:8px; background:rgba(255,255,255,0.05); padding:2px; border-radius:3px;">`
                                        : `<i class="fa-solid fa-shield" style="color:var(--text-dim); margin-right:8px; font-size:14px; vertical-align:middle;"></i>`;
                                    
                                    let rankText = `#${rec.rank}`;
                                    if (rec.rank === 1) rankText = '1st (Champions)';
                                    else if (rec.rank === 2) rankText = '2nd (Runners-Up)';
                                    else if (rec.rank === 3) rankText = '3rd Place';

                                    return `
                                    <tr>
                                        <td style="font-weight: 600; color: #fff;">
                                            ${rec.tournamentName || rec.year || '—'}
                                            ${rec.type === 'recent' ? `<span style="background:rgba(0,240,255,0.1); color:var(--neon-cyan); padding:1px 5px; border-radius:2px; font-size:7px; font-weight:bold; margin-left:5px; border:1px solid rgba(0,240,255,0.2);">RECENT</span>` : ''}
                                        </td>
                                        <td style="color: #fff; font-weight: 500;">
                                            ${logoHtml} ${rec.title}
                                        </td>
                                        <td class="${rec.rank === 1 ? 'history-winner' : ''}">${rankText}</td>
                                        <td class="history-prize">${rec.description}</td>
                                    </tr>
                                    `;
                                }).join('')}
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
