/* ==========================================================================
   STRIKZ ESPORTS - MY TEAM PANEL & CONFIRMATION SYSTEM
   ========================================================================== */

(function() {
    async function renderMyTeam(container) {
        if (!window.strikzAuth || !window.strikzAuth.isLoggedIn()) {
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 80px; margin-bottom: 80px; max-width: 600px; text-align: center;">
                    <div style="padding: 20px 10px;">
                        <i class="fa-solid fa-users-gear" style="font-size: 58px; color: var(--neon-orange); filter: drop-shadow(0 0 12px var(--neon-orange-glow)); margin-bottom: 20px;"></i>
                        <h2 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 10px; letter-spacing: 0.05em;">SECURE TEAM ACCESS</h2>
                        <p style="color: var(--text-silver); font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                            You must log in to your gamer profile to manage your esports squad, invite team members, quick-fill registrations, and confirm tournament ticket joins.
                        </p>
                        <button class="cta-button btn-neon-orange w-full" id="btn-team-login-trigger" style="padding: 15px;">
                            <i class="fa-solid fa-right-to-bracket"></i> LOGIN TO ARENA
                        </button>
                    </div>
                </section>
            `;
            
            const btn = document.getElementById('btn-team-login-trigger');
            if (btn) {
                btn.onclick = function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    const loginModal = document.getElementById('login-modal');
                    if (loginModal) {
                        loginModal.classList.add('active');
                    }
                };
            }
            return;
        }

        const user = window.strikzAuth.getUser();
        
        // Render spinner while querying database API
        container.innerHTML = `
            <div class="loading-screen" style="padding: 100px 0;">
                <div class="loader-spinner"></div>
                <div class="loader-text font-orbitron">GETTING SQUAD STATUS...</div>
            </div>
        `;

        try {
            // Find user's team details from network
            const userTeam = await window.strikzDb.getMyTeam();

            if (!userTeam) {
                renderCreateTeamForm(container, user);
            } else {
                renderTeamDashboard(container, user, userTeam);
            }
        } catch (err) {
            container.innerHTML = `
                <div class="container text-center" style="padding: 80px 0;">
                    <h3 class="font-orbitron" style="color:var(--neon-orange);">ARENA COMMS FAULT</h3>
                    <p style="color:var(--text-silver); margin-top:10px;">${err.message}</p>
                    <button class="cta-button btn-neon-orange" onclick="window.location.reload();" style="margin-top:20px;">RETRY CONNECTION</button>
                </div>
            `;
        }
    }

    // CREATE TEAM SCREEN
    function renderCreateTeamForm(container, user) {
        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 800px;">
                <div class="section-header">
                    <span class="section-subtitle">INITIALIZE SQUAD</span>
                    <h2 class="section-title">CREATE <span>YOUR TEAM</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="glass-panel" style="border-color: var(--neon-yellow-border);">
                    <form id="create-team-form" onsubmit="return false;">
                        <div class="form-group">
                            <label>TEAM SQUAD NAME</label>
                            <input type="text" id="new-team-name" placeholder="E.g. Odisha Overlords" required style="color:#fff;">
                        </div>
                        <div class="form-group">
                            <label>TEAM DESCRIPTION / BIO</label>
                            <textarea id="new-team-desc" rows="3" placeholder="Describe your team history, achievements, etc..." required style="width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 10px; border-radius: 4px; color:#fff; font-size:13px;"></textarea>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 30px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (4 CORE MEMBERS)</h4>
                        
                        <!-- core players -->
                        ${[1, 2, 3, 4].map(num => `
                            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">CORE MEMBER #${num} ${num === 1 ? '(Captain/IGL)' : ''}</span>
                                <div class="form-row" style="margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Gamer Tag (Website Nickname)</label>
                                        <input type="text" class="team-member-name" placeholder="Nickname" value="${num === 1 ? user.username : ''}" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Real Name</label>
                                        <input type="text" class="team-member-real" placeholder="Full Name" value="${num === 1 ? user.username : ''}" required style="color:#fff;">
                                    </div>
                                </div>
                                <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Free Fire Max UID</label>
                                        <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label>Combat Roster Role</label>
                                        <select class="team-member-role">
                                            <option value="IGL">In-Game Leader (IGL)</option>
                                            <option value="Rusher">Rusher</option>
                                            <option value="Sniper">Sniper</option>
                                            <option value="Support">Support</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px;">
                            CREATE SQUAD TERMINAL
                        </button>
                    </form>
                </div>
            </section>
        `;

        const form = document.getElementById('create-team-form');
        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const teamName = document.getElementById('new-team-name').value.trim();
            const teamDesc = document.getElementById('new-team-desc').value.trim();

            const memberNames = document.querySelectorAll('.team-member-name');
            const memberReals = document.querySelectorAll('.team-member-real');
            const memberUids = document.querySelectorAll('.team-member-uid');
            const memberRoles = document.querySelectorAll('.team-member-role');

            const members = [];
            for (let i = 0; i < 4; i++) {
                members.push({
                    name: memberNames[i].value.trim(),
                    realName: memberReals[i].value.trim(),
                    gameUid: memberUids[i].value.trim(),
                    role: memberRoles[i].value
                });
            }

            try {
                await window.strikzDb.createMyTeam({
                    name: teamName,
                    description: teamDesc,
                    members
                });

                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                alert("Esports Squad created successfully! Now members can quick-register and confirm ticket requests.");
                
                // Reload tab to show dashboard
                renderMyTeam(container);
            } catch (err) {
                alert("Failed to initialize squad: " + err.message);
            }
        };
    }

    // TEAM PROFILE DASHBOARD & REGISTRATION CONFIRMATION SCREEN
    async function renderTeamDashboard(container, user, team) {
        // Query if this user has any pending confirmations in team registrations
        const db = window.strikzDb.get();
        
        // Fetch all registrations from admin lists to find invitations
        let registrations = [];
        try {
            const res = await fetch('/api/v1/snapshot'); // Refreshes public lists
            const json = await res.json();
            // Fetch tickets using status tracker query or local snapshot (only public list contains registered tags)
            // To find invitations, we will check registrations this user belongs to
        } catch(e){}

        // Since we want to find registrations where user is a player and confirmed is false:
        // Let's call a secure track search or query active invitations in backend snapshot.
        // For simplicity, we can load all registrations for this tournament where the player's name matches and is not confirmed.
        // Wait, the client-side snapshot has active tournaments and news, but registrations list is kept secure.
        // To query pending confirmations for a user, let's check if the backend has registrations cached or if we should fetch them.
        // Wait, does the snapshot endpoint return registrations? No, it's public.
        // In order to show pending confirmations securely, we can add an endpoint:
        // `GET /api/v1/my-team/confirmations` which returns all team registrations the user is listed in as a member!
        // Oh, that is extremely secure and clean!
        // Let's check if we have defined it. We can add this endpoint easily in the backend auth/tournament routes!
        // Let's define the endpoint: `GET /api/v1/my-team/confirmations` returns pending confirmations for user.
        // Let's implement it inside the backend controller if not already present.
        
        let pendingConfirmations = [];
        try {
            pendingConfirmations = await window.strikzDb.getPendingConfirmations();
        } catch(err) {
            console.error("Failed to load invitations:", err);
        }

        container.innerHTML = `
            <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">SQUAD PORTAL</span>
                    <h2 class="section-title">TEAM <span>DASHBOARD</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-2 reveal-stagger">
                    <!-- Squad Profile Details -->
                    <div class="glass-panel" style="border-color: var(--neon-yellow-border);">
                        <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; margin-bottom: 20px;">
                            <img src="${team.logo}" alt="${team.name} Logo" style="width: 80px; height: 80px; border-radius: 4px; border: 1.5px solid var(--glass-border); padding: 5px; background: rgba(0,0,0,0.5);">
                            <div>
                                <h3 class="font-orbitron" style="font-size: 22px; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.1);">${team.name}</h3>
                                <div style="font-size: 11px; color: var(--neon-yellow); letter-spacing: 0.1em; font-weight: 800; font-family: var(--font-header);">CAPTAIN: ${team.captain}</div>
                            </div>
                        </div>

                        <h4 class="font-orbitron" style="font-size: 12px; color: var(--text-white); margin-bottom: 6px;">SQUAD BIO</h4>
                        <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 25px;">${team.description}</p>

                        <h4 class="font-orbitron" style="font-size: 12px; color: var(--neon-yellow); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ACTIVE SQUAD ROSTER (4-MAN)</h4>
                        <div style="display: grid; gap: 10px;">
                            ${team.members.map((m, idx) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 10px 15px; border-radius: 4px;">
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <span class="font-orbitron" style="color: var(--text-dim); font-size: 11px; font-family:var(--font-header);">#0${idx + 1}</span>
                                        <div>
                                            <div style="font-weight: 700; color: #fff; font-size: 13px;">${m.name}</div>
                                            <div style="font-size: 10px; color: var(--text-dim);">${m.real_name || m.realName || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 11px; color: var(--neon-cyan); font-weight: 800; font-family: var(--font-header);">${m.role}</div>
                                        <div style="font-size: 9px; color: var(--text-dim);">${m.game_uid || m.gameUid}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Invitation / Confirms and Tourneys -->
                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        <!-- Pending Invites / Confirmations Box -->
                        <div class="glass-panel" style="border-color: var(--neon-orange-border); background: rgba(255,94,0,0.02);">
                            <h3 class="font-orbitron" style="font-size: 16px; color: var(--neon-orange); margin-bottom: 15px;"><i class="fa-solid fa-bell"></i> PENDING TICKET SIGN-JOINS</h3>
                            
                            ${pendingConfirmations.length === 0 ? `
                                <div style="text-align: center; padding: 30px 10px; color: var(--text-dim);">
                                    <i class="fa-solid fa-clipboard-check" style="font-size: 38px; color: rgba(255,255,255,0.03); margin-bottom: 10px;"></i>
                                    <p style="font-size: 12px;">No pending team joins found for your gamertag.</p>
                                </div>
                            ` : `
                                <div style="display: grid; gap: 12px;">
                                    ${pendingConfirmations.map(inv => `
                                        <div style="border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 10px;">
                                            <div>
                                                <div style="font-size: 13px; font-weight: 700; color: #fff;">${inv.tournamentName}</div>
                                                <div style="font-size: 10px; color: var(--text-dim); margin-top: 3px;">Ticket Code: ${inv.regId}</div>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                                                <span style="font-size: 11px; color: var(--neon-yellow); font-weight: 700; font-family: var(--font-header);">STAGE 1: ROSTER CONFIRMATION</span>
                                                <button class="cta-button btn-neon-yellow btn-confirm-invite" data-reg-id="${inv.regId}" style="padding: 6px 14px; font-size: 10px; color: #000 !important; font-weight: 800;">
                                                    <i class="fa-solid fa-circle-check"></i> CONFIRM JOIN
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Bind Confirm join button
        document.querySelectorAll('.btn-confirm-invite').forEach(btn => {
            btn.onclick = async function() {
                const regId = this.dataset.regId;
                if (!regId) return;

                if (window.strikzPlayClickSound) window.strikzPlayClickSound();

                try {
                    const res = await window.strikzDb.confirmJoin(regId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Roster join invitation confirmed successfully!");
                    renderMyTeam(container); // Refresh dashboard
                } catch (err) {
                    alert("Roster confirmation failed: " + err.message);
                }
            };
        });
    }

    // Attach to global window
    window.renderMyTeam = renderMyTeam;
})();
