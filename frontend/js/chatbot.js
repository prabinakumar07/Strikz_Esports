/* ==========================================================================
   STRIKZ ESPORTS - FLOATING AI CHATBOT (KELLY)
   ========================================================================== */

(function() {
    // Welcoming messages
    const welcomeText = "Greetings, survivor! I am KELLY, your Strikz Esports tactical assistant. I can help you register for Free Fire Max scrims, check tournament schedules, or escalate issues to our administrators. How can I help you today?";

    const faqResponses = {
        rules: "All Free Fire Max tournaments follow standard tournament settings. Roster size is 4 main players (with optional 1 substitute). Emulators are strictly banned. Emulators detected during play result in immediate team disqualification.",
        registration: "To register, head over to the #/registration section using the menu. You can choose to register as a Solo Player (to match with others) or register a complete 4-Man Team. You'll need the exact Free Fire Max UIDs of all players.",
        tournaments: "We currently have active scrims and championships! The featured tournament is the Free Fire Max World Series (FFWS) 2026 with a $500,000 USD prize pool, and the national Free Fire Max India Championship (FFIC) with $200,000 USD.",
        prize: "Prize pools are distributed directly to the team captain's bank/UPI within 7 days of the tournament completion. The FFWS has a massive $500,000 USD pool, and the Clash Squad Showdown has a $50,000 USD pool!"
    };

    function initChatbot() {
        const container = document.getElementById('chatbot-container');
        if (!container) return;

        // Render Chatbot HTML
        container.innerHTML = `
            <div class="chatbot-widget">
                <!-- Floating Trigger Button -->
                <div class="chatbot-trigger" id="chat-trigger" title="Kelly - AI Assistant">
                    <i class="fa-solid fa-headset"></i>
                </div>
                <!-- Chat Window -->
                <div class="chatbot-window" id="chat-window">
                    <div class="chatbot-header">
                        <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Kelly&backgroundColor=ff5e00" alt="Kelly Avatar" class="chatbot-logo">
                        <div class="chatbot-header-info">
                            <h4 class="font-orbitron">TACTICAL BOT KELLY</h4>
                            <span>ONLINE</span>
                        </div>
                    </div>
                    <!-- Message Stream -->
                    <div class="chatbot-chat-area" id="chat-messages">
                        <!-- Messages go here -->
                    </div>
                    <!-- Quick Option Buttons -->
                    <div class="chatbot-options" id="chat-options">
                        <button class="chatbot-opt-btn" data-action="tourneys">Tournaments</button>
                        <button class="chatbot-opt-btn" data-action="how-to">How to Register?</button>
                        <button class="chatbot-opt-btn" data-action="check-status">Check Status</button>
                        <button class="chatbot-opt-btn" data-action="escalate">Talk to Admin</button>
                    </div>
                    <!-- Text Input Row -->
                    <div class="chatbot-input-bar">
                        <input type="text" id="chat-input" placeholder="Ask Kelly (e.g. REG-98124, rules)..." autocomplete="off">
                        <button id="chat-send" class="chatbot-send-btn">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Bind DOM references
        const trigger = document.getElementById('chat-trigger');
        const windowEl = document.getElementById('chat-window');
        const messagesContainer = document.getElementById('chat-messages');
        const inputField = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const optionsContainer = document.getElementById('chat-options');

        // Toggle Expand
        trigger.addEventListener('click', () => {
            windowEl.classList.toggle('active');
            trigger.classList.toggle('active');
            if (windowEl.classList.contains('active')) {
                // If message area is empty, load welcome
                if (messagesContainer.children.length === 0) {
                    addBotMessage(welcomeText);
                }
                setTimeout(() => inputField.focus(), 150);
            }
        });

        // Click Option Buttons
        optionsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.chatbot-opt-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            const text = btn.textContent;
            
            addUserMessage(text);
            
            setTimeout(() => {
                handleAction(action);
            }, 500);
        });

        // Input Send (Enter key / click button)
        sendBtn.addEventListener('click', handleSend);
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });

        // Helper: Add User message
        function addUserMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg msg-user';
            msg.textContent = text;
            messagesContainer.appendChild(msg);
            scrollToBottom();
        }

        // Helper: Add Bot message
        function addBotMessage(htmlContent) {
            const msg = document.createElement('div');
            msg.className = 'chat-msg msg-bot';
            msg.innerHTML = htmlContent;
            messagesContainer.appendChild(msg);
            scrollToBottom();
        }

        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Action Handlers
        function handleAction(action) {
            if (action === 'tourneys') {
                const db = window.strikzDb.get();
                const active = db.tournaments.filter(t => t.status === 'Open');
                let reply = "<strong>Active Free Fire Max scrims:</strong><br>";
                active.forEach(t => {
                    reply += `• <strong>${t.name}</strong> (${t.prizePool}) - Reg closes ${t.regCloseDate}. <a href='#/registration' style='color: var(--neon-cyan); text-decoration: underline;'>Register</a><br>`;
                });
                addBotMessage(reply);
            } 
            else if (action === 'how-to') {
                addBotMessage(faqResponses.registration + "<br><br>" + faqResponses.rules);
            } 
            else if (action === 'check-status') {
                addBotMessage("To check your registration status instantly, type your Registration Ticket ID (e.g. <strong>REG-98124</strong>) here, or go to the <a href='#/registration' style='color: var(--neon-cyan); text-decoration: underline;'>Registration Portal</a>.");
            } 
            else if (action === 'escalate') {
                addBotMessage("Please fill out this ticket form to notify our game admins:");
                
                // Render form in bot message
                const formMsg = document.createElement('div');
                formMsg.className = 'chat-msg msg-bot';
                formMsg.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <input type="text" id="chat-esc-name" placeholder="Your Name" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 6px; border-radius: 4px; font-size: 12px; color: #fff;">
                        <input type="email" id="chat-esc-email" placeholder="Your Email" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 6px; border-radius: 4px; font-size: 12px; color: #fff;">
                        <select id="chat-esc-type" style="background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); padding: 6px; border-radius: 4px; font-size: 12px; color: #fff; outline: none; cursor: pointer;">
                            <option value="Player" style="background: #101015; color: #fff;">Player / Gamer Enquiry</option>
                            <option value="Partner" style="background: #101015; color: #fff;">Partner / Sponsor Enquiry</option>
                        </select>
                        <textarea id="chat-esc-msg" placeholder="Describe your issue..." rows="3" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 6px; border-radius: 4px; font-size: 12px; color: #fff; resize: none;"></textarea>
                        <button id="chat-esc-submit" style="background: var(--neon-orange); color: #000; padding: 6px; border-radius: 4px; font-size: 12px; font-weight: 800; cursor: pointer;">SUBMIT TICKET</button>
                    </div>
                `;
                messagesContainer.appendChild(formMsg);
                scrollToBottom();

                // Bind Submit Event
                document.getElementById('chat-esc-submit').onclick = async function() {
                    const name = document.getElementById('chat-esc-name').value.trim();
                    const email = document.getElementById('chat-esc-email').value.trim();
                    const type = document.getElementById('chat-esc-type').value;
                    const issue = document.getElementById('chat-esc-msg').value.trim();

                    if (!name || !email || !issue) {
                        alert("Please fill all details to escalate.");
                        return;
                    }

                    try {
                        const ticket = await window.strikzDb.addChatbotTicket({
                            senderName: name,
                            senderEmail: email,
                            message: issue,
                            type: type
                        });

                        formMsg.innerHTML = `<span style="color: var(--neon-green); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Ticket Submitted Successfully!</span><br>Ticket ID: <strong>${ticket.id}</strong>. An administrator will review your message in the dashboard panel.`;
                        
                        if (window.strikzPlaySuccessSound) window.strikzPlaySuccessSound();
                    } catch (err) {
                        console.error(err);
                        alert("Failed to submit support ticket: " + err.message);
                    }
                };
            }
        }

        // Custom Input Send Handler
        function handleSend() {
            const query = inputField.value.trim();
            if (!query) return;

            addUserMessage(query);
            inputField.value = '';

            setTimeout(() => {
                processMessage(query);
            }, 600);
        }

        // Process custom user questions
        function processMessage(text) {
            const cleanText = text.toLowerCase();

            // Match Ticket ID Regex (REG-12345)
            const ticketMatch = text.match(/REG-\d{5}/i);
            if (ticketMatch) {
                const ticketId = ticketMatch[0].toUpperCase();
                const db = window.strikzDb.get();
                const reg = db.registrations.find(r => r.id === ticketId);
                
                if (reg) {
                    const statusClass = reg.status === 'Approved' ? 'status-approved' : (reg.status === 'Pending' ? 'status-pending' : 'status-rejected');
                    const details = reg.type === 'Team' 
                        ? `Team: <strong>${reg.teamName}</strong> (Captain: ${reg.captainName})`
                        : `Solo Player: <strong>${reg.playerName}</strong>`;

                    addBotMessage(`
                        <strong>Ticket Found!</strong><br>
                        ID: <strong>${reg.id}</strong><br>
                        Tournament: ${reg.tournamentName}<br>
                        ${details}<br>
                        Status: <span class="badge-status ${statusClass}">${reg.status}</span>
                    `);
                } else {
                    addBotMessage(`We couldn't find any registration matching Ticket ID <strong>${ticketId}</strong>. Please check the spelling or verify inside the admin registrations page.`);
                }
                return;
            }

            // Keyword processing
            if (cleanText.includes('hello') || cleanText.includes('hi') || cleanText.includes('hey')) {
                addBotMessage("Greetings, soldier! Let me know if you need registration details or tournament info.");
            } 
            else if (cleanText.includes('rule') || cleanText.includes('emulator') || cleanText.includes('ban')) {
                addBotMessage(faqResponses.rules);
            } 
            else if (cleanText.includes('register') || cleanText.includes('solo') || cleanText.includes('team') || cleanText.includes('apply')) {
                addBotMessage(faqResponses.registration);
            } 
            else if (cleanText.includes('tournament') || cleanText.includes('match') || cleanText.includes('scrim')) {
                handleAction('tourneys');
            } 
            else if (cleanText.includes('prize') || cleanText.includes('pool') || cleanText.includes('money') || cleanText.includes('dollar')) {
                addBotMessage(faqResponses.prize);
            } 
            else if (cleanText.includes('admin') || cleanText.includes('help') || cleanText.includes('contact') || cleanText.includes('support')) {
                handleAction('escalate');
            } 
            else {
                addBotMessage("I'm sorry, I didn't quite catch that. You can try typing <strong>REG-98124</strong> to look up your status, or type <strong>rules</strong>, <strong>prize</strong>, <strong>register</strong>, or click one of the quick options below.");
            }
        }
    }

    // Attach to global window
    window.initChatbot = initChatbot;
})();
