/* ==========================================================================
   STRIKZ ESPORTS - CONTACT US PAGE RENDERER
   ========================================================================== */

(function() {
    function renderContact(container) {
        const settings = window.strikzDb.getSettings();

        container.innerHTML = `
            <section class="container reveal" style="padding-top: 40px; margin-bottom: 80px;">
                <div class="section-header">
                    <span class="section-subtitle">COMMUNITY & HELP</span>
                    <h2 class="section-title">GET IN <span>TOUCH</span></h2>
                    <div class="section-divider"></div>
                </div>

                <div class="grid-2 reveal-stagger">
                    <!-- Contact Form -->
                    <div class="glass-panel" style="border-color: var(--neon-cyan-border);">
                        <h3 class="font-orbitron" style="font-size: 18px; color: var(--neon-cyan); margin-bottom: 25px;"><i class="fa-solid fa-paper-plane"></i> SEND A MESSAGE</h3>
                        
                        ${(function() {
                            const user = window.strikzAuth && window.strikzAuth.getUser();
                            const defaultName = user ? user.displayName : '';
                            const defaultEmail = user ? user.email : '';
                            return `
                            <form id="contact-us-form" onsubmit="return false;">
                                <div class="form-group">
                                    <label for="contact-name">Your Full Name</label>
                                    <input type="text" id="contact-name" placeholder="E.g. Aarav Sharma" value="${defaultName}" required>
                                </div>
                                <div class="form-group">
                                    <label for="contact-email">Email Address</label>
                                    <input type="email" id="contact-email" placeholder="E.g. aarav@gmail.com" value="${defaultEmail}" required>
                                </div>
                            `;
                        })()}
                            <div class="form-group">
                                <label for="contact-subject">Topic / Subject</label>
                                <select id="contact-subject">
                                    <option value="Sponsorship">Sponsorship Inquiry</option>
                                    <option value="Tournament">Tournament Query</option>
                                    <option value="Roster">Roster Recruitment</option>
                                    <option value="General">General / Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="contact-msg">Your Message</label>
                                <textarea id="contact-msg" placeholder="Write details here..." rows="5" required style="width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 4px; padding: 12px 16px; color: #fff;"></textarea>
                            </div>

                            <button type="submit" class="cta-button btn-neon-cyan w-full" id="contact-submit-btn" style="margin-top: 10px;">
                                <span class="btn-text">SEND INTEL</span>
                            </button>
                        </form>
                    </div>

                    <!-- Side Channels & Discord Invite -->
                    <div style="display: flex; flex-direction: column; gap: 30px;">
                        <!-- Discord Card -->
                        <div class="glass-panel text-center" style="border-color: var(--neon-orange-border); box-shadow: 0 0 20px rgba(255, 94, 0, 0.05); padding: 40px 30px;">
                            <i class="fa-brands fa-discord" style="font-size: 60px; color: #5865F2; filter: drop-shadow(0 0 15px rgba(88, 101, 242, 0.4)); margin-bottom: 20px;"></i>
                            <h3 class="font-orbitron" style="font-size: 20px; margin-bottom: 8px;">JOIN THE DISCORD</h3>
                            <p style="color: var(--text-silver); font-size: 14px; margin-bottom: 25px; max-width: 380px; margin-left: auto; margin-right: auto;">Get access to live announcements, find scrimmage team mates, interact with players, and get direct moderator assistance.</p>
                            <a href="${settings.discordLink}" target="_blank" class="cta-button btn-neon-orange" style="background: #5865F2; border-color: #5865F2; color: #fff;">JOIN DISCORD ARENA</a>
                        </div>

                        <!-- Direct Contacts Info -->
                        <div class="glass-panel" style="padding: 24px;">
                            <h4 class="font-orbitron" style="font-size: 14px; color: var(--text-white); margin-bottom: 15px;">DIRECT COMMUNICATIONS</h4>
                            <div style="display: flex; flex-direction: column; gap: 15px; font-size: 14px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fa-solid fa-envelope" style="color: var(--neon-cyan); width: 16px;"></i>
                                    <span>${settings.supportEmail}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fa-solid fa-handshake" style="color: var(--neon-orange); width: 16px;"></i>
                                    <span>${settings.partnerEmail}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fa-solid fa-location-dot" style="color: var(--neon-cyan); width: 16px;"></i>
                                    <span>${settings.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Bind form submit
        const form = document.getElementById('contact-us-form');
        const submitBtn = document.getElementById('contact-submit-btn');

        form.onsubmit = function(e) {
            if (e) e.preventDefault();
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-msg').value.trim();

            if (!name || !email || !message) return false;

            // Submit ticket to database
            window.strikzDb.addChatbotTicket({
                senderName: name,
                senderEmail: email,
                message: `[Contact Form - ${subject}] ${message}`
            }).then(() => {
                // Play success SFX
                if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();

                // Render Success Box
                const parentPanel = form.parentElement;
                parentPanel.innerHTML = `
                    <div class="text-center" style="padding: 60px 0;">
                        <i class="fa-solid fa-circle-check" style="font-size: 64px; color: var(--neon-green); filter: drop-shadow(0 0 15px rgba(255, 230, 0, 0.4)); margin-bottom: 20px;"></i>
                        <h3 class="font-orbitron" style="font-size: 24px; color: #fff; margin-bottom: 12px;">INTEL SENT!</h3>
                        <p style="color: var(--text-silver); font-size: 14px; max-width: 320px; margin: 0 auto 30px auto;">Thank you for contacting us, <strong>${name}</strong>. Our administrators will review your query and reply via email within 24 hours.</p>
                        <button class="cta-button btn-neon-cyan" onclick="window.location.reload();">SEND ANOTHER MESSAGE</button>
                    </div>
                `;
            }).catch(err => {
                alert("Failed to dispatch support message: " + err.message);
            });

            return false;
        };
    }

    // Attach to global window
    window.renderContact = renderContact;
})();
