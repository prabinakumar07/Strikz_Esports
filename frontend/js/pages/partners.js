/* ==========================================================================
   STRIKZ ESPORTS - PARTNERS PAGE RENDERER
   ========================================================================== */

(function() {
    function renderPartners(container) {
        const db = window.strikzDb.get();
        const sponsors = db.sponsors || [];

        // Group sponsors by tier
        const titleSponsors = sponsors.filter(s => s.tier === 'Title');
        const platinumSponsors = sponsors.filter(s => s.tier === 'Platinum');
        const goldSponsors = sponsors.filter(s => s.tier === 'Gold');

        container.innerHTML = `
            <!-- Partners Hero / Heading -->
            <section class="container reveal" style="margin-top: 50px; margin-bottom: 50px;">
                <div class="section-header">
                    <span class="section-subtitle">CHAMPIONSHIP COLLABORATIONS</span>
                    <h2 class="section-title">OFFICIAL <span>PARTNERS</span></h2>
                    <div class="section-divider"></div>
                </div>
                
                <p class="text-center" style="max-width: 700px; margin: 0 auto 50px auto; color: var(--text-silver); font-size: 15px;">
                    We collaborate with the world's leading technology, beverage, and gaming brands to deliver the highest caliber of Free Fire Max esports events. Meet the sponsors making the dream possible.
                </p>
            </section>

            <!-- Sponsors Boards -->
            <section class="container reveal" style="margin-bottom: 80px;">
                <!-- Title Tier -->
                ${titleSponsors.length > 0 ? `
                <div style="margin-bottom: 60px;">
                    <h3 class="font-orbitron text-center" style="font-size: 18px; color: var(--neon-cyan); letter-spacing: 0.2em; margin-bottom: 25px; text-shadow: 0 0 8px var(--neon-cyan-border);">TITLE PARTNERS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
                        ${titleSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 260px; text-align: center; padding: 40px 20px; border: 1.5px solid var(--neon-cyan); box-shadow: 0 0 20px rgba(212, 175, 55, 0.15); background: rgba(212, 175, 55, 0.02);">
                                <div class="font-orbitron" style="font-size: 24px; font-weight: 900; letter-spacing: 0.1em; color: #fff; text-shadow: 0 0 8px rgba(255, 255, 255, 0.2); min-height: 50px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 50px; max-width: 190px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 10px; color: var(--neon-cyan); letter-spacing: 0.15em; font-weight: 800; margin-top: 15px; font-family: var(--font-header);">OFFICIAL TITLE SPONSOR</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Platinum Tier -->
                ${platinumSponsors.length > 0 ? `
                <div style="margin-bottom: 60px;">
                    <h3 class="font-orbitron text-center" style="font-size: 16px; color: var(--neon-orange); letter-spacing: 0.2em; margin-bottom: 25px; text-shadow: 0 0 8px var(--neon-orange-glow);">PLATINUM SPONSORS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 25px;">
                        ${platinumSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 220px; text-align: center; padding: 30px 20px; border-color: var(--neon-orange-border); background: rgba(255, 230, 0, 0.01);">
                                <div class="font-orbitron" style="font-size: 20px; font-weight: 800; letter-spacing: 0.08em; color: #fff; min-height: 40px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 40px; max-width: 150px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 9px; color: var(--neon-orange); letter-spacing: 0.12em; font-weight: 800; margin-top: 10px; font-family: var(--font-header);">PLATINUM PARTNER</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Gold Tier -->
                ${goldSponsors.length > 0 ? `
                <div>
                    <h3 class="font-orbitron text-center" style="font-size: 14px; color: var(--text-dim); letter-spacing: 0.2em; margin-bottom: 25px;">GOLD SPONSORS</h3>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
                        ${goldSponsors.map(sp => `
                            <div class="glass-panel" style="min-width: 190px; text-align: center; padding: 25px 15px; border-color: rgba(255,255,255,0.05);">
                                <div class="font-orbitron" style="font-size: 16px; font-weight: 700; color: var(--text-silver); min-height: 35px; display: flex; align-items: center; justify-content: center;">
                                    ${sp.logo ? `<img src="${sp.logo}" style="max-height: 35px; max-width: 120px; object-fit: contain;">` : sp.logoText}
                                </div>
                                <div style="font-size: 8px; color: var(--text-dim); letter-spacing: 0.1em; font-weight: 700; margin-top: 8px; font-family: var(--font-header);">GOLD SPONSOR</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </section>

            <!-- B2B Partnership Inquiry Form -->
            <section class="container reveal" style="margin-bottom: 80px; max-width: 750px;">
                <div class="glass-panel" style="padding: 40px; border-color: var(--neon-orange-border);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h3 class="font-orbitron" style="font-size: 22px; color: #fff; margin-bottom: 8px; letter-spacing: 0.05em;">BECOME AN OFFICIAL PARTNER</h3>
                        <p style="font-size: 13px; color: var(--text-silver);">Pitch your brand, collaborate on active arenas, and connect with millions of gaming fans.</p>
                    </div>

                    <div id="partner-inquiry-status" class="hidden" style="margin-bottom: 25px; padding: 15px; border-radius: 6px; text-align: center;"></div>

                    <form id="partner-inquiry-form" class="reveal-stagger" style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="profile-form-row-2">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">COMPANY NAME *</label>
                                <input type="text" id="partner-company" required placeholder="Garena Corp..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">CONTACT PERSON *</label>
                                <input type="text" id="partner-contact" required placeholder="John Doe..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                            </div>
                        </div>

                        <div class="profile-form-row-2">
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">WORK EMAIL *</label>
                                <input type="email" id="partner-email" required placeholder="partnerships@company.com..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                            </div>
                            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">CONTACT PHONE</label>
                                <input type="tel" id="partner-phone" placeholder="+1 234 567 8900..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                            </div>
                        </div>

                        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">INSTAGRAM USERNAME (OPTIONAL)</label>
                            <input type="text" id="partner-instagram" placeholder="e.g. @company_insta..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                        </div>

                        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">TIER OF INTEREST *</label>
                            <select id="partner-tier" required style="background: #101010; border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; cursor: pointer; transition: border 0.3s;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'">
                                <option value="Gold">Gold Sponsor</option>
                                <option value="Platinum">Platinum Sponsor</option>
                                <option value="Title">Title Sponsor</option>
                                <option value="General">General Partner / Vendor</option>
                            </select>
                        </div>

                        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-family: var(--font-header); font-size: 10px; letter-spacing: 0.1em; color: var(--text-silver); font-weight: 700;">COLLABORATION DETAILS *</label>
                            <textarea id="partner-message" required rows="5" placeholder="Tell us how you would like to collaborate..." style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 4px; color: #fff; transition: border 0.3s; resize: vertical;" onfocus="this.style.borderColor='var(--neon-orange)'" onblur="this.style.borderColor='var(--glass-border)'"></textarea>
                        </div>

                        <button type="submit" class="cta-button btn-neon-orange w-full" style="padding: 15px; margin-top: 10px;">SUBMIT PARTNERSHIP INQUIRY</button>
                    </form>
                </div>
            </section>
        `;

        // Handle B2B form submission
        const form = document.getElementById('partner-inquiry-form');
        const statusBox = document.getElementById('partner-inquiry-status');

        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const company = document.getElementById('partner-company').value.trim();
                const contact = document.getElementById('partner-contact').value.trim();
                const email = document.getElementById('partner-email').value.trim();
                const phone = document.getElementById('partner-phone').value.trim();
                const instagram = document.getElementById('partner-instagram').value.trim();
                const tier = document.getElementById('partner-tier').value;
                const message = document.getElementById('partner-message').value.trim();

                if (!company || !contact || !email || !message) {
                    showStatus('Please fill in all required fields.', false);
                    return;
                }

                const inquiry = {
                    company,
                    contact,
                    email,
                    phone,
                    instagram,
                    tier,
                    message
                };

                try {
                    await window.strikzDb.addPartnerInquiry(inquiry);
                    
                    // Success sound hook
                    if (window.strikzPlaySuccessSound) {
                        window.strikzPlaySuccessSound();
                    }

                    showStatus(`Thank you, ${contact}! Your partnership inquiry for ${company} has been received. Our relations team will contact you at ${email} shortly.`, true);
                    form.reset();
                } catch (err) {
                    console.error("Inquiry Error:", err);
                    showStatus('System error saving inquiry. Please try again.', false);
                }
            });
        }

        function showStatus(msg, isSuccess) {
            if (!statusBox) return;
            statusBox.textContent = msg;
            statusBox.className = isSuccess ? 'notice-item' : 'notice-item';
            statusBox.style.background = isSuccess ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.08)';
            statusBox.style.borderColor = isSuccess ? 'var(--neon-yellow-border)' : 'rgba(255, 230, 0, 0.2)';
            statusBox.style.borderLeftColor = isSuccess ? 'var(--neon-yellow)' : 'var(--neon-orange)';
            statusBox.classList.remove('hidden');
            statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Attach to global window object
    window.renderPartners = renderPartners;
})();
