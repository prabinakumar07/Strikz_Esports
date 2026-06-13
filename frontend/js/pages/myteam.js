/* ==========================================================================
   STRIKZ ESPORTS - MY TEAM PANEL & CONFIRMATION SYSTEM
   ========================================================================== */

(function() {
    let activeTab = 'squad'; // Track active tab globally within page scope

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
        
        container.innerHTML = `
            <div class="loading-screen" style="padding: 100px 0;">
                <div class="loader-spinner"></div>
                <div class="loader-text font-orbitron">GETTING SQUAD STATUS & COMMS...</div>
            </div>
        `;

        try {
            // Load both Team details and Inbox simultaneously
            const [teamRes, inboxRes] = await Promise.all([
                window.strikzDb.getMyTeam(),
                window.strikzDb.getMyTeamInbox()
            ]);

            const team = teamRes.team;
            const inbox = inboxRes.inbox || [];
            const inboxCount = inbox.length;

            // Render Page Frame with Tab Bar
            container.innerHTML = `
                <section class="container bg-section-black reveal" style="padding-top: 40px; margin-bottom: 80px; max-width: 900px;">
                    <div class="section-header" style="margin-bottom: 30px;">
                        <span class="section-subtitle">GAMER PORTAL</span>
                        <h2 class="section-title">COMMUNICATION <span>CENTER</span></h2>
                        <div class="section-divider"></div>
                    </div>

                    <!-- Comms Navigation Tabs -->
                    <div class="comms-tabs-nav font-orbitron" style="display:flex; gap:10px; margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom:12px;">
                        <button class="tab-trigger ${activeTab === 'squad' ? 'active' : ''}" id="tab-btn-squad" style="background:none; border:none; color:${activeTab === 'squad' ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-size:14px; font-weight:800; padding: 8px 16px; cursor:pointer; font-family:var(--font-header); letter-spacing:0.05em; border-bottom: 2px solid ${activeTab === 'squad' ? 'var(--neon-yellow)' : 'transparent'}; transition: all 0.3s;">
                            <i class="fa-solid fa-users-gear"></i> SQUAD PORTAL
                        </button>
                        <button class="tab-trigger ${activeTab === 'inbox' ? 'active' : ''}" id="tab-btn-inbox" style="background:none; border:none; color:${activeTab === 'inbox' ? 'var(--neon-yellow)' : 'var(--text-dim)'}; font-size:14px; font-weight:800; padding: 8px 16px; cursor:pointer; font-family:var(--font-header); letter-spacing:0.05em; display:flex; align-items:center; gap:8px; border-bottom: 2px solid ${activeTab === 'inbox' ? 'var(--neon-yellow)' : 'transparent'}; transition: all 0.3s;">
                            <i class="fa-solid fa-envelope"></i> ARENA INBOX 
                            ${inboxCount > 0 ? `<span class="inbox-badge" style="background:var(--neon-orange); color:#fff; font-size:9px; font-weight:900; padding:2px 8px; border-radius:10px; box-shadow:0 0 8px var(--neon-orange-glow); animation: pulse 2s infinite;">${inboxCount}</span>` : ''}
                        </button>
                    </div>

                    <div id="comms-tab-content"></div>
                </section>
            `;

            const tabSquadBtn = document.getElementById('tab-btn-squad');
            const tabInboxBtn = document.getElementById('tab-btn-inbox');
            const tabContentMount = document.getElementById('comms-tab-content');

            // Switch tab function
            const switchTab = (tabId) => {
                activeTab = tabId;
                if (activeTab === 'squad') {
                    tabSquadBtn.style.color = 'var(--neon-yellow)';
                    tabSquadBtn.style.borderBottom = '2px solid var(--neon-yellow)';
                    tabInboxBtn.style.color = 'var(--text-dim)';
                    tabInboxBtn.style.borderBottom = '2px solid transparent';
                    renderSquadTab(tabContentMount, user, team, container);
                } else {
                    tabInboxBtn.style.color = 'var(--neon-yellow)';
                    tabInboxBtn.style.borderBottom = '2px solid var(--neon-yellow)';
                    tabSquadBtn.style.color = 'var(--text-dim)';
                    tabSquadBtn.style.borderBottom = '2px solid transparent';
                    renderInboxTab(tabContentMount, inbox, container);
                }
                if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
                if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
            };

            tabSquadBtn.onclick = () => {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                switchTab('squad');
            };
            tabInboxBtn.onclick = () => {
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                switchTab('inbox');
            };

            // Initial Tab Render
            switchTab(activeTab);

        } catch (err) {
            container.innerHTML = `
                <div class="container text-center" style="padding: 80px 0;">
                    <h3 class="font-orbitron" style="color:var(--neon-orange);">ARENA COMMS FAULT</h3>
                    <p style="color:var(--text-silver); margin-top:10px;">${err.message}</p>
                    <button class="cta-button btn-neon-orange" onclick="window.location.reload();" style="margin-top:20px;">RETRY CONNECTION</button>
                </div>
            `;
        }

        if (window.strikzInitScrollAnimations) window.strikzInitScrollAnimations();
        if (window.strikzInitSpotlightEffect) window.strikzInitSpotlightEffect();
    }

    // SQUAD TAB VIEW RENDERING
    function renderSquadTab(mount, user, team, container) {
        if (!team) {
            // Render Create Team Form
            mount.innerHTML = `
                <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 30px;">
                    <h3 class="font-orbitron" style="font-size:18px; color:#fff; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">ESTABLISH YOUR ESPORTS SQUAD</h3>
                    <p style="font-size:13px; color:var(--text-silver); margin-bottom:25px; line-height:1.5;">
                        Create a permanent squad roster, invite your teammates using their copyable Strikz Gamer UIDs, and prepare for championship listings.
                    </p>
                    ${getCreateTeamFormHTML(user)}
                </div>
            `;
            bindCreateTeamForm(user, container);
        } else {
            // Render Squad Profile / Dashboard Details
            mount.innerHTML = `
                <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 30px;">
                    <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                        <img src="${team.logo}" alt="${team.name} Logo" style="width: 80px; height: 80px; border-radius: 4px; border: 1.5px solid var(--glass-border); padding: 5px; background: rgba(0,0,0,0.5);">
                        <div style="flex-grow: 1;">
                            <h3 class="font-orbitron" style="font-size: 22px; color: #fff; margin:0; text-shadow: 0 0 10px rgba(255,255,255,0.1);">${team.name}</h3>
                            <div style="font-size: 11px; color: var(--neon-yellow); letter-spacing: 0.1em; font-weight: 800; font-family: var(--font-header); margin-top:6px; text-transform: uppercase;">CAPTAIN: ${team.captain}</div>
                        </div>
                        <div>
                            ${team.captain_uid === user.uid ? `
                                <span class="badge-status status-approved font-orbitron" style="font-size:10px; font-weight:800; letter-spacing:0.05em; padding: 6px 14px;">CAPTAIN ACCESS</span>
                            ` : `
                                <span class="badge-status status-pending font-orbitron" style="font-size:10px; font-weight:800; letter-spacing:0.05em; padding: 6px 14px;">MEMBER ACCESS</span>
                            `}
                        </div>
                    </div>

                    <h4 class="font-orbitron" style="font-size: 12px; color: var(--text-white); margin-bottom: 6px; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">SQUAD BIO</h4>
                    <p style="font-size: 13px; color: var(--text-silver); line-height: 1.6; margin-bottom: 25px;">${team.description}</p>

                    <h4 class="font-orbitron" style="font-size: 12px; color: var(--neon-yellow); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 4px;">ACTIVE SQUAD ROSTER</h4>
                    <div style="display: grid; gap: 10px;">
                        ${(team.members || []).map((m, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 10px 15px; border-radius: 4px; gap: 15px;">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <span class="font-orbitron" style="color: var(--text-dim); font-size: 11px; font-family:var(--font-header);">#0${idx + 1}</span>
                                    <div>
                                        <div style="font-weight: 700; color: #fff; font-size: 13px; display:flex; align-items:center; gap:8px;">
                                            ${m.name}
                                            <span class="badge-status ${m.confirmed ? 'status-approved' : 'status-pending'}" style="font-size:8px; padding: 2px 6px; line-height: 1;">
                                                ${m.confirmed ? 'CONFIRMED' : 'PENDING'}
                                            </span>
                                        </div>
                                        <div style="font-size: 10px; color: var(--text-dim);">${m.real_name || m.realName || 'N/A'}</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px; text-align: right;">
                                    <div>
                                        <div style="font-size: 11px; color: var(--neon-cyan); font-weight: 800; font-family: var(--font-header);">${m.role}</div>
                                        <div style="font-size: 9px; color: var(--text-dim);">${m.game_uid || m.gameUid || m.user_uid}</div>
                                    </div>
                                    ${(team.captain_uid === user.uid && m.user_uid !== user.uid) ? `
                                        <button class="btn-kick-member font-orbitron" data-member-uid="${m.user_uid}" data-member-name="${m.name}" style="background: none; border: 1px solid rgba(255,94,0,0.3); border-radius: 3px; color: var(--neon-orange); cursor: pointer; font-size: 10px; font-weight: 800; padding: 4px 8px; transition: all 0.2s;" title="Kick player from roster">
                                            KICK
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Squad Actions -->
                    <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: 15px;">
                        ${team.captain_uid === user.uid ? `
                            <button class="cta-button btn-neon-orange" id="btn-disband-team" style="padding: 10px 22px; font-size: 12px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-burst"></i> DISBAND TEAM
                            </button>
                        ` : `
                            <button class="cta-button btn-neon-orange" id="btn-leave-team" style="padding: 10px 22px; font-size: 12px; font-weight:800; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-right-from-bracket"></i> LEAVE TEAM
                            </button>
                        `}
                    </div>
                </div>
            `;

            // Bind kick buttons
            document.querySelectorAll('.btn-kick-member').forEach(btn => {
                btn.onmouseenter = () => {
                    btn.style.borderColor = 'var(--neon-orange)';
                    btn.style.background = 'rgba(255,94,0,0.05)';
                };
                btn.onmouseleave = () => {
                    btn.style.borderColor = 'rgba(255,94,0,0.3)';
                    btn.style.background = 'transparent';
                };
                btn.onclick = async function() {
                    const memberUid = this.dataset.memberUid;
                    const memberName = this.dataset.memberName;
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm(`Are you absolutely sure you want to remove ${memberName} (${memberUid}) from your squad roster?`)) return;

                    try {
                        await window.strikzDb.kickMember(memberUid);
                        alert(`${memberName} has been removed from the team.`);
                        renderMyTeam(container); // Reload page
                    } catch (err) {
                        alert("Kick action failed: " + err.message);
                    }
                };
            });

            // Bind Leave Team button
            const leaveBtn = document.getElementById('btn-leave-team');
            if (leaveBtn) {
                leaveBtn.onclick = async function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm("Are you sure you want to leave this team roster? You will no longer belong to this squad and must be re-invited to join.")) return;

                    try {
                        await window.strikzDb.leaveTeam();
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        alert("You have left the team roster.");
                        renderMyTeam(container);
                    } catch (err) {
                        alert("Leave team failed: " + err.message);
                    }
                };
            }

            // Bind Disband Team button
            const disbandBtn = document.getElementById('btn-disband-team');
            if (disbandBtn) {
                disbandBtn.onclick = async function() {
                    if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                    if (!confirm("CRITICAL ACTION: Are you sure you want to disband your squad? This will delete the team profile and notify all roster members. This action cannot be undone!")) return;

                    try {
                        await window.strikzDb.disbandTeam();
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                        alert("Your esports squad has been disbanded.");
                        renderMyTeam(container);
                    } catch (err) {
                        alert("Disband team failed: " + err.message);
                    }
                };
            }
        }
    }

    // INBOX TAB VIEW RENDERING
    function renderInboxTab(mount, inbox, container) {
        if (inbox.length === 0) {
            mount.innerHTML = `
                <div class="glass-panel text-center" style="border-color: var(--glass-border); padding: 60px 20px;">
                    <i class="fa-solid fa-envelope-open" style="font-size: 50px; color: rgba(255,255,255,0.03); margin-bottom: 20px; filter:drop-shadow(0 0 10px rgba(255,255,255,0.01));"></i>
                    <h4 class="font-orbitron" style="font-size: 14px; color:#fff; letter-spacing:0.05em; margin-bottom:6px;">YOUR ARENA INBOX IS EMPTY</h4>
                    <p style="font-size: 12px; color: var(--text-dim); max-width:350px; margin:0 auto; line-height:1.4;">
                        Roster invites, tournament signs, and squad broadcasts will appear in this terminal channel.
                    </p>
                </div>
            `;
            return;
        }

        mount.innerHTML = `
            <div style="display: grid; gap: 15px;">
                ${inbox.map(item => {
                    if (item.type === 'team_invite') {
                        return `
                            <div class="glass-panel" style="border-color: var(--neon-yellow-border); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; background: rgba(255,230,0,0.01);">
                                <div style="display: flex; gap: 15px; align-items: center; min-width: 250px; flex: 1;">
                                    <img src="${item.metadata.logo}" alt="Logo" style="width: 50px; height: 50px; border-radius: 4px; border: 1px solid var(--glass-border); background:rgba(0,0,0,0.5); padding:3px;">
                                    <div>
                                        <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin:0;">${item.title}</h4>
                                        <div style="font-size: 11px; color: var(--neon-yellow); margin-top:4px; font-weight:700;">CAPTAIN: ${item.metadata.captainName} | ROLE: ${item.metadata.role}</div>
                                        <p style="font-size:12px; color:var(--text-dim); margin: 6px 0 0 0; line-height:1.4;">${item.metadata.description}</p>
                                        <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:6px;"><i class="fa-solid fa-clock"></i> ${new Date(item.date).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button class="cta-button btn-neon-yellow btn-inbox-accept-invite" data-team-id="${item.metadata.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800; color:#000 !important;">
                                        ACCEPT
                                    </button>
                                    <button class="cta-button btn-neon-orange btn-inbox-decline-invite" data-team-id="${item.metadata.teamId}" style="padding: 8px 16px; font-size: 11px; font-weight:800;">
                                        DECLINE
                                    </button>
                                </div>
                            </div>
                        `;
                    } else if (item.type === 'tournament_confirm') {
                        return `
                            <div class="glass-panel" style="border-color: var(--neon-orange-border); padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; background: rgba(255,94,0,0.01);">
                                <div style="min-width: 250px; flex: 1;">
                                    <h4 class="font-orbitron" style="font-size: 15px; color: #fff; margin:0; display:flex; align-items:center; gap:8px;">
                                        <i class="fa-solid fa-file-signature" style="color:var(--neon-orange)"></i> ${item.title}
                                    </h4>
                                    <p style="font-size:13px; color:var(--text-silver); margin: 8px 0 0 0; line-height:1.4;">${item.message}</p>
                                    <div style="font-size:11px; color:var(--text-dim); margin-top:5px;">Ticket Code: <strong>${item.metadata.regId}</strong></div>
                                    <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:6px;"><i class="fa-solid fa-clock"></i> ${new Date(item.date).toLocaleString()}</span>
                                </div>
                                <div>
                                    <button class="cta-button btn-neon-yellow btn-inbox-confirm-join" data-reg-id="${item.metadata.regId}" style="padding: 8px 16px; font-size: 11px; font-weight:800; color:#000 !important; white-space:nowrap;">
                                        CONFIRM JOIN
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        // General alerts / notifications from database
                        return `
                            <div class="glass-panel" style="border-color: var(--glass-border); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                                <div style="flex:1;">
                                    <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-cyan); margin:0; display:flex; align-items:center; gap:6px;">
                                        <i class="fa-solid fa-circle-info"></i> ${item.title}
                                    </h4>
                                    <p style="font-size:12px; color:var(--text-silver); margin: 6px 0 0 0; line-height:1.4;">${item.message}</p>
                                    <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:4px;"><i class="fa-solid fa-clock"></i> ${new Date(item.date).toLocaleString()}</span>
                                </div>
                                <div>
                                    <button class="btn-inbox-dismiss" data-notif-id="${item.id}" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:14px; padding:6px; transition:color 0.2s;" title="Dismiss message">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;

        // Bind Accept Team Invitation
        document.querySelectorAll('.btn-inbox-accept-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.acceptTeamInvite(teamId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Welcome to the squad! Team invitation accepted.");
                    renderMyTeam(container);
                } catch(err) {
                    alert("Accept failed: " + err.message);
                }
            };
        });

        // Bind Decline Team Invitation
        document.querySelectorAll('.btn-inbox-decline-invite').forEach(btn => {
            btn.onclick = async function() {
                const teamId = this.dataset.teamId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                if (!confirm("Are you sure you want to decline this team invitation?")) return;
                try {
                    await window.strikzDb.declineTeamInvite(teamId);
                    alert("Invitation declined.");
                    renderMyTeam(container);
                } catch(err) {
                    alert("Decline failed: " + err.message);
                }
            };
        });

        // Bind Tournament Roster Confirmation Join
        document.querySelectorAll('.btn-inbox-confirm-join').forEach(btn => {
            btn.onclick = async function() {
                const regId = this.dataset.regId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.confirmJoin(regId);
                    if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    alert("Roster join invitation confirmed successfully!");
                    renderMyTeam(container);
                } catch (err) {
                    alert("Roster confirmation failed: " + err.message);
                }
            };
        });

        // Bind Alert Dismissal
        document.querySelectorAll('.btn-inbox-dismiss').forEach(btn => {
            btn.onmouseenter = () => btn.style.color = 'var(--neon-orange)';
            btn.onmouseleave = () => btn.style.color = 'var(--text-dim)';
            btn.onclick = async function() {
                const notifId = this.dataset.notifId;
                if (window.strikzPlayClickSound) window.strikzPlayClickSound();
                try {
                    await window.strikzDb.dismissNotification(notifId);
                    renderMyTeam(container);
                } catch (err) {
                    alert("Failed to dismiss notification: " + err.message);
                }
            };
        });
    }

    // GET CREATE TEAM FORM TEMPLATE
    function getCreateTeamFormHTML(user) {
        return `
            <form id="create-team-form" onsubmit="return false;">
                <div class="form-group">
                    <label>TEAM SQUAD NAME</label>
                    <input type="text" id="new-team-name" placeholder="E.g. Odisha Overlords" required style="color:#fff;">
                </div>
                <div class="form-group">
                    <label>TEAM DESCRIPTION / BIO</label>
                    <textarea id="new-team-desc" rows="3" placeholder="Describe your team history, achievements, etc..." required style="width: 100%; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 10px; border-radius: 4px; color:#fff; font-size:13px; font-family:inherit; line-height:1.4; resize:vertical;"></textarea>
                </div>

                <h4 class="font-orbitron" style="font-size: 13px; color: var(--neon-yellow); margin: 30px 0 15px 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">ROSTER LINE-UP (4 CORE MEMBERS)</h4>
                
                <!-- Member 1 (Captain) -->
                <div style="background: rgba(255,230,0,0.02); border: 1px solid var(--neon-yellow-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                    <span class="font-orbitron" style="font-size: 11px; color: var(--neon-yellow); display: block; margin-bottom: 10px;">CORE MEMBER #1 (Captain/IGL)</span>
                    <div class="form-row" style="margin-bottom:0;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Gamer Tag (Username)</label>
                            <input type="text" class="team-member-name" value="${user.username}" readonly disabled style="color:#888; background: rgba(0,0,0,0.2);">
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Strikz Gamer UID</label>
                            <input type="text" class="team-member-strikz-uid" value="${user.uid || 'STRIKZ-XXXXXX'}" readonly disabled style="color:#888; background: rgba(0,0,0,0.2);">
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Real Name</label>
                            <input type="text" class="team-member-real" placeholder="Your Full Name" value="${user.username}" required style="color:#fff;">
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Free Fire Max UID</label>
                            <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" required style="color:#fff;">
                        </div>
                    </div>
                    <input type="hidden" class="team-member-role" value="IGL">
                </div>

                <!-- core players 2, 3, 4 -->
                ${[2, 3, 4].map(num => `
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <span class="font-orbitron" style="font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 10px;">CORE MEMBER #${num} (Invitation via UID)</span>
                        <div class="form-row" style="margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Strikz Gamer UID (STRIKZ-XXXXXX)</label>
                                <input type="text" class="team-member-strikz-uid" placeholder="STRIKZ-XXXXXX" style="color:#fff; text-transform: uppercase;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Combat Roster Role</label>
                                <select class="team-member-role">
                                    <option value="Rusher">Rusher</option>
                                    <option value="Sniper">Sniper</option>
                                    <option value="Support">Support</option>
                                    <option value="IGL">IGL</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row" style="margin-top:10px; margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Real Name</label>
                                <input type="text" class="team-member-real" placeholder="Player's Real Name" style="color:#fff;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Free Fire Max UID</label>
                                <input type="text" class="team-member-uid" placeholder="UID-XXXXXXX" style="color:#fff;">
                            </div>
                        </div>
                    </div>
                `).join('')}

                <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px; margin-top: 10px;">
                    CREATE SQUAD TERMINAL
                </button>
            </form>
        `;
    }

    // BIND CREATE TEAM FORM SUBMISSION
    function bindCreateTeamForm(user, container) {
        const form = document.getElementById('create-team-form');
        if (!form) return;

        form.onsubmit = async function(e) {
            if (e) e.preventDefault();
            const teamName = document.getElementById('new-team-name').value.trim();
            const teamDesc = document.getElementById('new-team-desc').value.trim();

            const stUids = document.querySelectorAll('.team-member-strikz-uid');
            const memberReals = document.querySelectorAll('.team-member-real');
            const memberUids = document.querySelectorAll('.team-member-uid');
            const memberRoles = document.querySelectorAll('.team-member-role');

            const members = [];
            
            // Captain details
            members.push({
                user_uid: user.uid,
                name: user.username,
                realName: memberReals[0].value.trim(),
                gameUid: memberUids[0].value.trim(),
                role: 'IGL'
            });

            // Invited members
            for (let i = 1; i <= 3; i++) {
                const uidVal = stUids[i].value.trim().toUpperCase();
                if (uidVal) {
                    const realVal = memberReals[i].value.trim();
                    const ffUidVal = memberUids[i].value.trim();
                    const roleVal = memberRoles[i].value;

                    if (!realVal || !ffUidVal) {
                        alert(`Please fill in all details (Real Name and Free Fire UID) for Member #${i+1}.`);
                        return;
                    }

                    members.push({
                        user_uid: uidVal,
                        realName: realVal,
                        gameUid: ffUidVal,
                        role: roleVal
                    });
                }
            }

            try {
                await window.strikzDb.createMyTeam({
                    name: teamName,
                    description: teamDesc,
                    members
                });

                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                alert("Esports Squad created successfully! Invitations have been sent to the members.");
                
                renderMyTeam(container);
            } catch (err) {
                alert("Failed to initialize squad: " + err.message);
            }
        };
    }

    // Attach to global window
    window.renderMyTeam = renderMyTeam;
})();
