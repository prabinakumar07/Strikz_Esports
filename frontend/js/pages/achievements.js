/* ==========================================================================
   STRIKZ ESPORTS - WINNERS PAGE RENDERER (REDESIGNED)
   ========================================================================== */

(function() {
    function renderAchievements(container) {
        const db = window.strikzDb.get();
        const trophies = db.achievements || [];

        // Empty state
        if (trophies.length === 0) {
            container.innerHTML = `
                <section class="winners-page-section container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                    <div class="section-header">
                        <span class="section-subtitle">TOURNAMENT RESULTS</span>
                        <h2 class="section-title">WINNERS <span>SPOTLIGHT</span></h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="glass-panel text-center" style="padding: 80px 20px;">
                        <i class="fa-solid fa-trophy" style="font-size: 48px; color: var(--neon-yellow); opacity: 0.3; margin-bottom: 20px; display: block;"></i>
                        <p style="color: var(--text-dim); font-size: 16px;">No championship winners recorded yet. Check back soon!</p>
                    </div>
                </section>
            `;
            return;
        }

        /* ---- Tier colour mapping ---- */
        const tierMeta = {
            diamond:  { color: '#00f0ff', glow: 'rgba(0,240,255,0.4)',  label: 'DIAMOND',  icon: 'fa-gem' },
            platinum: { color: '#e2e8f0', glow: 'rgba(226,232,240,0.4)', label: 'PLATINUM', icon: 'fa-star' },
            gold:     { color: '#FFE600', glow: 'rgba(255,230,0,0.5)',   label: 'GOLD',     icon: 'fa-crown' },
            silver:   { color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)', label: 'SILVER',   icon: 'fa-medal' },
            bronze:   { color: '#cd7f32', glow: 'rgba(205,127,50,0.4)',  label: 'BRONZE',   icon: 'fa-award' },
        };
        const getTier = (t) => tierMeta[t && t.toLowerCase()] || { color: '#7e7e7e', glow: 'rgba(126,126,126,0.3)', label: (t || 'N/A').toUpperCase(), icon: 'fa-shield-halved' };

        /* ---- Medal colours for top 3 positions ---- */
        const medalColors = {
            1: { color: '#FFE600', shadow: 'rgba(255,230,0,0.6)',  label: '1ST', size: 'large' },
            2: { color: '#c0c0c0', shadow: 'rgba(192,192,192,0.5)', label: '2ND', size: 'medium' },
            3: { color: '#cd7f32', shadow: 'rgba(205,127,50,0.45)', label: '3RD', size: 'medium' },
        };
        const getMedalColor = (rank) => medalColors[rank] || { color: '#7e7e7e', shadow: 'rgba(126,126,126,0.3)', label: `#${rank}`, size: 'small' };

        /* ---- Render a single tournament card ---- */
        function renderTournamentCard(tr, isLatest) {
            let winners = tr.winnersList || [];
            if (!winners.length) {
                winners = [{ rank: 1, teamName: tr.teamName || 'STRIKZ ESPORTS', teamLogo: tr.teamLogo || '', tier: tr.tier || 'gold', prize: tr.reward || '' }];
            }

            const sorted = [...winners].sort((a, b) => a.rank - b.rank);
            const rank1 = sorted.find(w => w.rank === 1) || sorted[0];
            const others = sorted.filter(w => w.rank !== (rank1 ? rank1.rank : -1));

            // Top 3 for podium
            const top3 = sorted.filter(w => w.rank <= 3);
            const hasPodium = top3.length >= 2;

            const t1meta = getTier(rank1 ? (rank1.tier || tr.tier) : tr.tier);

            // --- 1st Place Hero Banner ---
            const heroBannerStyle = tr.image
                ? `background-image: url('${tr.image}'); background-size: cover; background-position: center;`
                : `background: linear-gradient(135deg, #0a0a0a 0%, #1a1200 50%, #0a0a0a 100%);`;

            const rank1LogoHtml = rank1 && rank1.teamLogo
                ? `<img src="${rank1.teamLogo}" alt="${rank1.teamName}" class="winner-hero-logo">`
                : `<div class="winner-hero-logo-placeholder"><i class="fa-solid fa-crown"></i></div>`;

            // --- Podium Section ---
            let podiumHtml = '';
            if (hasPodium) {
                const place2 = sorted.find(w => w.rank === 2);
                const place3 = sorted.find(w => w.rank === 3);

                const makePodiumCard = (w, position) => {
                    if (!w) return '';
                    const mc = getMedalColor(position);
                    const logoHtml = w.teamLogo
                        ? `<img src="${w.teamLogo}" alt="${w.teamName}" class="podium-logo" style="border-color: ${mc.color}; box-shadow: 0 0 14px ${mc.shadow};">`
                        : `<div class="podium-logo-placeholder" style="border-color: ${mc.color}; box-shadow: 0 0 14px ${mc.shadow}; color: ${mc.color};"><i class="fa-solid fa-shield-halved"></i></div>`;
                    const height = position === 1 ? '90px' : position === 2 ? '65px' : '50px';
                    return `
                        <div class="podium-slot podium-rank-${position}">
                            ${logoHtml}
                            <div class="podium-team-name" style="color: ${mc.color};">${w.teamName || '—'}</div>
                            <div class="podium-rank-badge" style="background: ${mc.color}; color: #000;">${mc.label}</div>
                            ${w.prize ? `<div class="podium-prize">${w.prize}</div>` : ''}
                            <div class="podium-block" style="height: ${height}; background: linear-gradient(180deg, ${mc.color}22 0%, ${mc.color}08 100%); border-top: 3px solid ${mc.color}; box-shadow: 0 -4px 20px ${mc.shadow};"></div>
                        </div>
                    `;
                };

                podiumHtml = `
                    <div class="winners-podium-container">
                        <h4 class="font-orbitron winners-subsection-label">PODIUM STANDINGS</h4>
                        <div class="winners-podium">
                            ${makePodiumCard(place2, 2)}
                            ${makePodiumCard(rank1, 1)}
                            ${makePodiumCard(place3, 3)}
                        </div>
                    </div>
                `;
            }

            // --- Full Standings Table ---
            let standingsHtml = '';
            if (sorted.length > 0) {
                const rows = sorted.map(w => {
                    const mc = getMedalColor(w.rank);
                    const tc = getTier(w.tier);
                    const logoHtml = w.teamLogo
                        ? `<img src="${w.teamLogo}" alt="${w.teamName}" class="standings-logo">`
                        : `<div class="standings-logo-placeholder"><i class="fa-solid fa-shield-halved"></i></div>`;
                    const isTop3 = w.rank <= 3;
                    return `
                        <div class="standings-row ${isTop3 ? 'standings-top3' : ''}" style="${isTop3 ? `--mc: ${mc.color}; --mc-shadow: ${mc.shadow};` : ''}">
                            <div class="standings-rank" style="color: ${isTop3 ? mc.color : '#7e7e7e'}; text-shadow: ${isTop3 ? `0 0 8px ${mc.shadow}` : 'none'};">${mc.label}</div>
                            <div class="standings-team">
                                ${logoHtml}
                                <span class="standings-team-name">${w.teamName || '—'}</span>
                            </div>
                            <div class="standings-tier" style="color: ${tc.color};">
                                <i class="fa-solid ${tc.icon}" style="margin-right: 4px;"></i>${tc.label}
                            </div>
                            <div class="standings-prize">${w.prize || '—'}</div>
                        </div>
                    `;
                }).join('');

                standingsHtml = `
                    <div class="winners-standings-container">
                        <div class="standings-header-row">
                            <div class="standings-rank">RANK</div>
                            <div class="standings-team">TEAM</div>
                            <div class="standings-tier">TIER</div>
                            <div class="standings-prize">PRIZE</div>
                        </div>
                        ${rows}
                    </div>
                `;
            }

            const cardClass = isLatest ? 'winner-tournament-card winner-card-featured' : 'winner-tournament-card';

            return `
                <div class="${cardClass} glass-panel reveal">
                    <!-- Hero Banner (only for 1st place featured card) -->
                    <div class="winner-hero-banner" style="${heroBannerStyle}">
                        <div class="winner-hero-overlay"></div>
                        <div class="winner-hero-content">
                            ${rank1LogoHtml}
                            <div class="winner-hero-badge" style="background: ${t1meta.glow}; border-color: ${t1meta.color}; color: ${t1meta.color};">
                                <i class="fa-solid ${t1meta.icon}"></i> ${t1meta.label} TIER
                            </div>
                            <h3 class="winner-hero-team font-orbitron" style="text-shadow: 0 0 20px ${t1meta.glow};">
                                ${rank1 ? rank1.teamName : tr.teamName}
                            </h3>
                            <p class="winner-hero-event">
                                <i class="fa-solid fa-trophy"></i> ${tr.event} &bull; <i class="fa-regular fa-calendar"></i> ${window.strikzFormatDate(tr.date)}
                            </p>
                            ${isLatest ? '<div class="winner-latest-ribbon"><i class="fa-solid fa-fire"></i> LATEST</div>' : ''}
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="winner-card-body">
                        <div class="winner-card-meta-row">
                            <div class="winner-meta-block">
                                <span class="winner-meta-label">CHAMPIONSHIP TITLE</span>
                                <span class="winner-meta-value font-orbitron">${tr.title || tr.event}</span>
                            </div>
                            <div class="winner-meta-block">
                                <span class="winner-meta-label">CHAMPION REWARD</span>
                                <span class="winner-meta-value" style="color: var(--neon-yellow);">${rank1 ? (rank1.prize || tr.reward || '—') : (tr.reward || '—')}</span>
                            </div>
                            <div class="winner-meta-block">
                                <span class="winner-meta-label">TOTAL TEAMS</span>
                                <span class="winner-meta-value">${sorted.length} FINALIST${sorted.length !== 1 ? 'S' : ''}</span>
                            </div>
                        </div>

                        ${tr.details ? `<p class="winner-card-summary">${tr.details}</p>` : ''}

                        ${podiumHtml}

                        ${standingsHtml}
                    </div>
                </div>
            `;
        }

        // --- Milestones section (static) ---
        const milestonesHtml = `
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
        `;

        const latest = trophies[0];
        const past   = trophies.slice(1);

        container.innerHTML = `
            <section class="winners-page-section container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">TOURNAMENT RESULTS</span>
                    <h2 class="section-title">CHAMPIONS <span>SPOTLIGHT</span></h2>
                    <div class="section-divider"></div>
                </div>

                <!-- Featured / Latest Tournament -->
                ${renderTournamentCard(latest, true)}

                <!-- Past Tournaments -->
                ${past.length > 0 ? `
                <div style="margin-top: 70px;">
                    <h3 class="font-orbitron" style="font-size: 20px; text-align: center; margin-bottom: 45px; letter-spacing: 0.05em; color: var(--text-silver);">PAST CHAMPIONSHIPS</h3>
                    <div style="display: flex; flex-direction: column; gap: 40px;">
                        ${past.map(tr => renderTournamentCard(tr, false)).join('')}
                    </div>
                </div>
                ` : ''}

                ${milestonesHtml}
            </section>
        `;
    }

    window.renderAchievements = renderAchievements;
})();
