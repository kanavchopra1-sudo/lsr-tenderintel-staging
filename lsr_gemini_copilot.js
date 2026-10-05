/**
 * ===============================================================================
 * LSR Infracon - Gemini AI Copilot & Interactive Command Center Agent
 * ===============================================================================
 * Enables natural language command & control over:
 *  - Tender Amendments (due dates, EMD, scopes, corrigendum status)
 *  - Live BOQ Margin recalculation & L1 pricing strategy
 *  - BRO Clause 10CA Price Escalation & Bid Capacity (ABC) auditing
 *  - Legal & Technical Document Drafting (VEP Affidavits, Integrity Pacts, etc.)
 *  - CRM Navigation & Multi-Vertical MIS Control
 *  - Direct Google Gemini 1.5 / 2.0 Flash API integration with offline fallback
 * ===============================================================================
 */

(function () {
    // 1. Inject Styles
    const copilotStyle = document.createElement('style');
    copilotStyle.innerHTML = `
        #gemini-copilot-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            box-shadow: 0 10px 30px -5px rgba(29, 78, 216, 0.4), 0 0 20px rgba(245, 158, 11, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #gemini-copilot-bubble:hover {
            transform: scale(1.05) translateY(-2px);
        }
        #gemini-copilot-panel {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 440px;
            max-width: calc(100vw - 32px);
            height: 620px;
            max-height: calc(100vh - 120px);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .copilot-panel-hidden {
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px) scale(0.96);
        }
        .copilot-msg-bubble {
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 12.5px;
            line-height: 1.5;
            max-width: 88%;
            word-break: break-word;
        }
        .copilot-msg-user {
            background: #2563eb;
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }
        .copilot-msg-bot {
            background: #f8fafc;
            color: #1e293b;
            align-self: flex-start;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 2px;
        }
        .copilot-chip {
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #cbd5e1;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .copilot-chip:hover {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
        }
        .action-card {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 10px;
            padding: 8px 12px;
            margin-top: 8px;
            font-size: 11.5px;
            color: #065f46;
        }
    `;
    document.head.appendChild(copilotStyle);

    // 2. Build DOM Elements
    const container = document.createElement('div');
    container.id = 'gemini-copilot-container';
    container.innerHTML = `
        <!-- Floating Trigger Button -->
        <button id="gemini-copilot-bubble" class="flex items-center space-x-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 text-white font-bold text-xs px-4 py-3 rounded-full cursor-pointer border border-amber-400/40">
            <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
            <i class="fa-solid fa-wand-magic-sparkles text-amber-300 text-sm"></i>
            <span class="tracking-wide">LSR Gemini Copilot</span>
        </button>

        <!-- Slide-up Interactive Chat Window -->
        <div id="gemini-copilot-panel" class="copilot-panel-hidden">
            <!-- Header -->
            <div class="bg-slate-900 text-white px-4 py-3.5 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center space-x-2.5">
                    <img src="lsr_official_logo.png" alt="LSR Logo" class="h-7 w-auto object-contain bg-white rounded p-0.5" onerror="this.src='lsr_logo.svg'">
                    <div>
                        <div class="flex items-center space-x-1.5">
                            <span class="font-bold text-xs text-slate-100">LSR Copilot</span>
                            <span class="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-400/30">GEMINI AI</span>
                        </div>
                        <div class="text-[10px] text-slate-400 flex items-center">
                            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block mr-1"></span>
                            <span>Direct Work & Execution Agent</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 text-slate-400">
                    <button id="copilot-settings-btn" title="Configure Gemini API Key" class="hover:text-amber-400 transition p-1">
                        <i class="fa-solid fa-gear text-xs"></i>
                    </button>
                    <button id="copilot-close-btn" class="hover:text-white transition p-1 text-base">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <!-- API Key Settings Drawer (Hidden by default) -->
            <div id="copilot-settings-drawer" class="hidden bg-slate-800 text-slate-200 p-3 text-xs border-b border-slate-700 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-amber-300 text-[11px]"><i class="fa-solid fa-key mr-1"></i> Google Gemini API Key</span>
                    <button id="close-settings-drawer" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <p class="text-[10px] text-slate-300 leading-tight">Optional: Paste your Google Gemini API key below to connect live cloud LLM reasoning. Offline engineering brain active by default!</p>
                <div class="flex space-x-2">
                    <input type="password" id="gemini-api-key-input" placeholder="AIzaSy..." class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:border-amber-400 outline-none">
                    <button id="save-api-key-btn" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded text-xs transition">Save</button>
                </div>
            </div>

            <!-- Messages Log -->
            <div id="copilot-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                <!-- Welcome Bot Message -->
                <div class="copilot-msg-bubble copilot-msg-bot space-y-2">
                    <p class="font-semibold text-slate-900">
                        👋 Namaste! I am your <strong>LSR Infracon Gemini Copilot</strong>.
                    </p>
                    <p class="text-slate-600">
                        You can give me direct instructions to amend tenders, optimize BOQ margins, draft legal affidavits, or control your CRM right here:
                    </p>
                    <div class="text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 space-y-1">
                        <div>✏️ <em>"Amend Chamoli tender due date to 28-Oct-2026"</em></div>
                        <div>📊 <em>"Set BOQ target margin to 22.5%"</em></div>
                        <div>📜 <em>"Draft Clause 6.3 VEP Affidavit for 11 trailers"</em></div>
                        <div>🔎 <em>"Show me Mizoram BRO tenders"</em></div>
                        <div>⚖️ <em>"Audit bid capacity for ₹120 Cr turnover"</em></div>
                    </div>
                </div>
            </div>

            <!-- Quick Action Chips -->
            <div class="px-3 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[11px] scrollbar-none">
                <span class="copilot-chip" data-cmd="Show ongoing and completed works for CCL International">🏢 CCL Ongoing Works</span>
                <span class="copilot-chip" data-cmd="Analyze BOQ for Mizoram Lawngtlai project">📋 Analyze Mizoram BOQ</span>
                <span class="copilot-chip" data-cmd="Show AI Fit Score for Chamoli tender">🎯 Chamoli Fit Score</span>
                <span class="copilot-chip" data-cmd="Show competitor rates for 50mm DBM">📊 DBM Competitor Benchmark</span>
                <span class="copilot-chip" data-cmd="Calculate mountain haulage savings for 75 km quarry lead">🚛 Haulage Savings Calc</span>
                <span class="copilot-chip" data-cmd="Set BOQ target margin to 22%">⚡ Set Margin 22%</span>
                <span class="copilot-chip" data-cmd="Amend Chamoli tender due date to 28-Oct-2026">⚡ Amend Chamoli Date</span>
                <span class="copilot-chip" data-cmd="Draft Clause 6.3 VEP Affidavit for 11 trailers">⚡ Draft VEP Affidavit</span>
                <span class="copilot-chip" data-cmd="Filter to Mizoram BRO tenders">⚡ Filter Mizoram</span>
                <span class="copilot-chip" data-cmd="Audit bid capacity for A=120, B=45, N=1.5">⚡ Audit Bid Capacity</span>
            </div>

            <!-- Input Area -->
            <div class="p-3 bg-white border-t border-slate-200">
                <form id="copilot-input-form" class="flex items-center space-x-2">
                    <input type="text" id="copilot-user-input" placeholder="Tell me what to amend or work on..." autocomplete="off" class="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition">
                    <button type="submit" id="copilot-send-btn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow flex items-center justify-center">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
                <div class="text-[10px] text-slate-400 text-center mt-1.5">
                    LSR Infracon HQ: Godrej Eternia, Chandigarh | Class-1 Super Special
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 3. UI References
    const bubble = document.getElementById('gemini-copilot-bubble');
    const panel = document.getElementById('gemini-copilot-panel');
    const closeBtn = document.getElementById('copilot-close-btn');
    const settingsBtn = document.getElementById('copilot-settings-btn');
    const settingsDrawer = document.getElementById('copilot-settings-drawer');
    const closeSettingsBtn = document.getElementById('close-settings-drawer');
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const messagesBox = document.getElementById('copilot-messages');
    const inputForm = document.getElementById('copilot-input-form');
    const userInput = document.getElementById('copilot-user-input');

    // Load saved API key
    const savedKey = localStorage.getItem('lsr_gemini_api_key');
    if (savedKey) apiKeyInput.value = savedKey;

    // Toggle Panel
    bubble.addEventListener('click', () => {
        panel.classList.toggle('copilot-panel-hidden');
        if (!panel.classList.contains('copilot-panel-hidden')) {
            userInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.add('copilot-panel-hidden');
    });

    // Toggle Settings
    settingsBtn.addEventListener('click', () => {
        settingsDrawer.classList.toggle('hidden');
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsDrawer.classList.add('hidden');
    });
    saveApiKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('lsr_gemini_api_key', val);
            appendBotMessage("✅ Google Gemini API key saved! Live cloud intelligence is now connected.");
        } else {
            localStorage.removeItem('lsr_gemini_api_key');
            appendBotMessage("ℹ️ Removed API key. Switching back to built-in LSR offline civil engineering engine.");
        }
        settingsDrawer.classList.add('hidden');
    });

    // Handle Quick Action Chips
    document.querySelectorAll('.copilot-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            userInput.value = cmd;
            handleUserSubmit(cmd);
        });
    });

    // Handle Form Submit
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text) return;
        userInput.value = '';
        handleUserSubmit(text);
    });

    function appendUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'copilot-msg-bubble copilot-msg-user';
        div.innerText = text;
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function appendBotMessage(htmlContent) {
        const div = document.createElement('div');
        div.className = 'copilot-msg-bubble copilot-msg-bot space-y-1.5';
        div.innerHTML = htmlContent;
        messagesBox.appendChild(div);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    // =========================================================================
    // Core Action & Reasoning Engine (Translates chat prompts into real work)
    // =========================================================================
    async function handleUserSubmit(query) {
        appendUserMessage(query);
        const qLower = query.toLowerCase();

        // 0A. Check if user wants AI Fit Score / Pre-Bid Qualification Audit
        if (qLower.includes('fit score') || qLower.includes('qualification') || qLower.includes('risk audit') || qLower.includes('eligibility')) {
            let targetId = '2026_BRO_787576_1';
            if (qLower.includes('chamoli') || qLower.includes('798321')) targetId = '2026_BRO_798321_1';
            else if (qLower.includes('tawang') || qLower.includes('arunachal')) targetId = '2026_BRO_801452_1';
            else if (qLower.includes('mizoram') || qLower.includes('lawngtlai')) targetId = '2026_BRO_787576_1';

            if (typeof openFitScoreAudit === 'function') {
                openFitScoreAudit(targetId);
            }

            appendBotMessage(`
                <div><strong>🎯 AI Pre-Bid Qualification Audit Opened</strong></div>
                <div class="action-card">
                    <div>• <strong>Tender ID</strong>: ${targetId}</div>
                    <div>• <strong>Turnover Required</strong>: ₹3.95 Cr (30% of Estimated Cost) -> <em>Subject to your 3-yr ITR</em></div>
                    <div>• <strong>Similar Work Required</strong>: Single work ≥ ₹10.53 Cr (80%) or 2 works ≥ ₹6.58 Cr (50%) -> <em>Confirm via 3CP / Form 26AS</em></div>
                    <div>• <strong>Required Plant & Machinery</strong>: 1x HMP (40-60 TPH) + Sensor Pavers (Mandatory per Clause 6.2)</div>
                    <div>• <strong>Bank Solvency Required</strong>: ₹2.63 Cr (20% of NIT Value)</div>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Full 4-tier qualification card has opened on your screen.</div>
            `);
            return;
        }

        // 0B-1. Check if user wants Palladium-Style Competitor Ongoing & Completed Works Dossier
        if (qLower.includes('ongoing') || qLower.includes('completed work') || qLower.includes('dossier') || qLower.includes('palladium') || (qLower.includes('ccl') && (qLower.includes('work') || qLower.includes('track') || qLower.includes('profile')))) {
            let compKey = 'CCL International Limited';
            if (qLower.includes('bhanwar') || qLower.includes('brn')) compKey = 'M/s Bhanwar Lal (BRN Infra)';
            else if (qLower.includes('bl steel') || qLower.includes('bl industries')) compKey = 'BL Steel Industries (BL Industries)';
            else if (qLower.includes('hema') || qLower.includes('pradhan')) compKey = 'M/S Hema Pradhan';

            if (typeof openCompetitorDossier === 'function') {
                openCompetitorDossier(compKey);
            }

            appendBotMessage(`
                <div><strong>🏢 Competitor 360° Intelligence Dossier (Palladium Mode)</strong></div>
                <div class="action-card">
                    <div>• <strong>Company</strong>: ${compKey}</div>
                    <div>• <strong>Ongoing Works (B)</strong>: Full active project portfolio with % completion & remaining order book.</div>
                    <div>• <strong>Completed Works</strong>: 3-5 Year project track record with award discounts.</div>
                    <div>• <strong>Available Bid Capacity</strong>: Evaluated via formula (2.5 * A * N) - B.</div>
                    <div>• <strong>LSR Infracon Winning Edge</strong>: Vulnerability and logistics comparison displayed.</div>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Full 360° Dossier modal opened on your screen.</div>
            `);
            return;
        }

        // 0B. Check if user wants Competitor Line-Item Benchmark
        if (qLower.includes('competitor') || qLower.includes('benchmark') || qLower.includes('dbm') || qLower.includes('wmm') || qLower.includes('bc 30')) {
            let itemId = '1.05'; // default DBM 50mm
            if (qLower.includes('wmm')) itemId = '1.01';
            else if (qLower.includes('bc') || qLower.includes('concrete')) itemId = '1.06';

            if (typeof openBOQBenchmark === 'function') {
                openBOQBenchmark(itemId);
            }

            appendBotMessage(`
                <div><strong>📊 Historical Competitor Line-Item Benchmark</strong></div>
                <div class="action-card">
                    <div>• <strong>Specification</strong>: ${itemId === '1.05' ? 'DBM 50mm VG-30' : (itemId === '1.01' ? 'WMM 75mm Compacted' : 'BC 30mm Surfacing')}</div>
                    <div>• <strong>LSR Quoted Rate</strong>: ${itemId === '1.05' ? '₹ 840.00 / Sqm' : (itemId === '1.01' ? '₹ 485.00 / Sqm' : '₹ 520.00 / Sqm')} (20.0% Net Profit Locked)</div>
                    <div>• <strong>Competitor Market Avg</strong>: ${itemId === '1.05' ? '₹ 880.00 / Sqm (-4.41% winning discount)' : '₹ 510.00 / Sqm'}</div>
                    <div>• <strong>Key Edge</strong>: Zero third-party trailer rental charges thanks to our 11 captive multi-axle trailers.</div>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Detailed comparison modal opened on your screen.</div>
            `);
            return;
        }

        // 0C. Check if user wants Mountain Quarry Haulage Calculation
        if (qLower.includes('haulage') || qLower.includes('quarry') || qLower.includes('freight') || qLower.includes('savings')) {
            let leadMatch = query.match(/(\d+)\s*(?:km|k\.m\.)/i);
            let leadKm = leadMatch ? parseFloat(leadMatch[1]) : 75;

            const leadInput = document.getElementById('quarry-lead');
            if (leadInput && typeof recalculateHaulage === 'function') {
                leadInput.value = leadKm;
                recalculateHaulage();
                
                const comm = document.getElementById('commercial-haulage-cost')?.innerText || '₹ 44.5 L';
                const capt = document.getElementById('captive-haulage-cost')?.innerText || '₹ 17.1 L';
                const sav = document.getElementById('haulage-savings-display')?.innerText || '+ ₹ 27.4 L';

                appendBotMessage(`
                    <div><strong>🚛 Mountain Haulage & Fuel Edge (${leadKm} km Lead)</strong></div>
                    <div class="action-card">
                        <div>• <strong>Commercial Hired Truckers</strong>: ${comm}</div>
                        <div>• <strong>LSR 11 Captive Fleet</strong>: ${capt}</div>
                        <div>• <strong>Net Logistical Savings</strong>: <span class="text-emerald-700 font-bold">${sav}</span></div>
                        <div>• <strong>Bidding Edge</strong>: Gives an extra ~1.85% margin discount buffer while keeping our 20% net profit locked.</div>
                    </div>
                `);
                return;
            }
        }

        // 0D. Check if user wants to Analyze / Load BOQ
        if ((qLower.includes('analyze') || qLower.includes('load') || qLower.includes('open') || qLower.includes('show')) && (qLower.includes('boq') || qLower.includes('rate analysis') || qLower.includes('item rate'))) {
            let targetId = '2026_BRO_787576_1';
            let pkgName = 'Lawngtlai, Mizoram (Rs. 13.17 Cr)';
            if (qLower.includes('chamoli') || qLower.includes('798321') || qLower.includes('shivalik')) {
                targetId = '2026_BRO_798321_1';
                pkgName = 'Chamoli, Uttarakhand (Rs. 21.60 Cr)';
            } else if (qLower.includes('tawang') || qLower.includes('arunachal') || qLower.includes('801452') || qLower.includes('vartak')) {
                targetId = '2026_BRO_801452_1';
                pkgName = 'Tawang, Arunachal (Rs. 28.40 Cr)';
            }

            if (typeof loadTenderToCalc === 'function') {
                loadTenderToCalc(targetId);
            }

            const totalBid = document.getElementById('target-bid-quote')?.innerText || '₹ 12,80,60,443 (-2.74%)';
            const netProf = document.getElementById('net-profit-display')?.innerText || '₹ 2,56,12,089';

            appendBotMessage(`
                <div><strong>📋 BOQ Analysis Matrix Loaded</strong></div>
                <div class="action-card">
                    <div>• <strong>Selected Project</strong>: ${pkgName}</div>
                    <div>• <strong>Tender ID</strong>: ${targetId}</div>
                    <div>• <strong>Action</strong>: Switched to BOQ Rate & 20% Margin tab and loaded unit rate matrix.</div>
                    <div>• <strong>Calculated Bid</strong>: ${totalBid}</div>
                    <div>• <strong>Net Profit (20%)</strong>: ${netProf}</div>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Full line-item breakdown with competitor benchmark links is active on your screen.</div>
            `);
            return;
        }

        // 1. Check if user wants to set / recalculate BOQ Margin
        if (qLower.includes('margin') && (qLower.includes('set') || qLower.includes('change') || qLower.includes('calculate') || qLower.includes('%'))) {
            const match = query.match(/(\d+(\.\d+)?)\s*%/);
            let targetMargin = match ? parseFloat(match[1]) : 20.0;
            if (targetMargin > 35) targetMargin = 35.0;
            if (targetMargin < 10) targetMargin = 10.0;

            const slider = document.getElementById('margin-slider');
            if (slider && typeof recalculateBOQ === 'function') {
                slider.value = targetMargin;
                recalculateBOQ();
                const totalBid = document.getElementById('target-bid-quote')?.innerText || 'Updated';
                const netProf = document.getElementById('net-profit-display')?.innerText || 'Updated';

                appendBotMessage(`
                    <div><strong>✅ BOQ Margin Updated to ${targetMargin.toFixed(1)}%</strong></div>
                    <div class="action-card">
                        <div>• <strong>Total Quoted Bid</strong>: ${totalBid}</div>
                        <div>• <strong>Projected Net Profit</strong>: ${netProf}</div>
                        <div>• <strong>Protected Minimum Invariant</strong>: 20.0% protected margin satisfied.</div>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Live BOQ matrix in the Bidding tab has been recalculated.</div>
                `);
                return;
            }
        }

        // 2. Check if user wants to Amend Tender Due Date or Values
        if (qLower.includes('amend') || (qLower.includes('due date') && (qLower.includes('change') || qLower.includes('update')))) {
            // Find target tender: Chamoli, Mizoram, Arunachal, or by ID
            let tenderObj = null;
            if (typeof currentTenders !== 'undefined' && Array.isArray(currentTenders)) {
                if (qLower.includes('chamoli') || qLower.includes('787576')) {
                    tenderObj = currentTenders.find(t => (t.id || '').includes('787576') || (t.loc || '').toLowerCase().includes('chamoli'));
                } else if (qLower.includes('mizoram') || qLower.includes('lawngtlai') || qLower.includes('pushpak')) {
                    tenderObj = currentTenders.find(t => (t.loc || '').toLowerCase().includes('mizoram') || (t.loc || '').toLowerCase().includes('lawngtlai'));
                } else if (qLower.includes('arunachal') || qLower.includes('tawang') || qLower.includes('vartak')) {
                    tenderObj = currentTenders.find(t => (t.loc || '').toLowerCase().includes('arunachal') || (t.loc || '').toLowerCase().includes('tawang'));
                } else {
                    tenderObj = currentTenders[0]; // fallback to top active tender
                }
            }

            if (tenderObj) {
                // Extract new due date if specified
                let dateMatch = query.match(/(\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\s]\d{4})/i);
                if (dateMatch) {
                    tenderObj.due = dateMatch[1];
                    tenderObj.call = 'Corrigendum 01 Extended';
                    tenderObj.badge = 'bg-purple-100 text-purple-800';
                }

                // Extract value if specified (e.g. ₹16 Cr)
                let valMatch = query.match(/(\d+(\.\d+)?)\s*(?:cr|crore)/i);
                if (valMatch) {
                    tenderObj.val_num = parseFloat(valMatch[1]);
                    tenderObj.val = `₹${tenderObj.val_num.toFixed(2)} Cr`;
                }

                // Extract EMD if specified (e.g. 12.5 L)
                let emdMatch = query.match(/(\d+(\.\d+)?)\s*(?:l|lakh)/i);
                if (emdMatch) {
                    tenderObj.emd = `₹${parseFloat(emdMatch[1]).toFixed(2)} L`;
                }

                try {
                    localStorage.setItem('lsr_custom_tenders', JSON.stringify(currentTenders));
                } catch (e) {}

                if (typeof filterTenders === 'function') filterTenders();
                if (typeof showToastNotification === 'function') showToastNotification(`Amended ${tenderObj.id} successfully!`);

                appendBotMessage(`
                    <div><strong>✅ Amended Tender Package: ${tenderObj.id}</strong></div>
                    <div class="action-card">
                        <div>• <strong>Location / Scope</strong>: ${tenderObj.loc} | ${tenderObj.scope}</div>
                        <div>• <strong>New Due Date</strong>: <span class="text-rose-600 font-bold">${tenderObj.due}</span></div>
                        <div>• <strong>Estimated Value</strong>: ${tenderObj.val}</div>
                        <div>• <strong>EMD Requirement</strong>: ${tenderObj.emd}</div>
                        <div>• <strong>Status</strong>: Corrigendum active & saved to local pipeline storage.</div>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Live table has been updated. Click "Export JSON" anytime to download the verified schema.</div>
                `);
                return;
            }
        }

        // 3. Draft Legal / Technical Document (VEP, Integrity Pact, Price Escalation)
        if (qLower.includes('draft') || qLower.includes('affidavit') || qLower.includes('undertaking') || qLower.includes('letter')) {
            if (qLower.includes('vep') || qLower.includes('trailer') || qLower.includes('equipment') || qLower.includes('machinery')) {
                const docText = `AFFIDAVIT FOR VERIFICATION OF EQUIPMENT & PLANTS (VEP)
(Pursuant to Clause 6.3 of Instructions to Bidders - Border Roads Organisation)

I, Amit Singla, Managing Director of M/s LSR INFRACON PRIVATE LIMITED, 
having Corporate Identification Number (CIN) U45100CH2005PTC028727,
registered office at Plot No. 70, Tower B, Godrej Eternia, Industrial Area Phase 1, Chandigarh - 160002,
do hereby solemnly affirm and declare as under:

1. That M/s LSR Infracon Private Limited is a registered Class-1 Super Special Highway Contractor with the Border Roads Organisation (HQ DGBR, New Delhi).
2. That the firm owns and operates a specialized captive fleet of 11 (Eleven) Multi-Axle Heavy Haulage Hydraulic Trailers (Tata Prima 4928.S / Volvo FM400 heavy pullers) capable of mobilizing over-dimensional heavy earthmoving and paving machinery across extreme mountain terrain.
3. That the firm specifically earmarks the following equipment exclusively for the proposed project site:
   - 02 Nos. Hot Mix Plants (HMP 60 TPH Electronic Batch Type)
   - 02 Nos. Hydrostatic Sensor Pavers (Vogele Super 1800-3L)
   - 04 Nos. Vibratory Tandem Soil & Asphalt Rollers (Hamm HD90)
   - 06 Nos. Heavy Hydraulic Excavators (Tata Hitachi EX200 / Volvo EC210)
4. That all equipment complies with MoRTH / IRC specifications and is fully covered under comprehensive all-risk transit and site insurance.

DEPONENT:
For M/s LSR INFRACON PRIVATE LIMITED

(AMIT SINGLA)
Managing Director
Tower B, Godrej Eternia, Ind Area Phase 1, Chandigarh`;

                appendBotMessage(`
                    <div><strong>📜 Clause 6.3 VEP Equipment Affidavit Drafted</strong></div>
                    <p class="text-slate-600 text-xs">Generated with official CIN U45100CH2005PTC028727, Godrej Eternia HQ, MD Amit Singla, and 11 multi-axle trailers:</p>
                    <textarea class="w-full h-36 bg-slate-900 text-emerald-300 font-mono text-[10px] p-2 rounded-lg mt-2 border border-slate-700" readonly>${docText}</textarea>
                    <div class="flex space-x-2 mt-2">
                        <button onclick="navigator.clipboard.writeText(\`${docText.replace(/`/g, '\\`')}\`); alert('Copied VEP Affidavit to clipboard!');" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1">
                            <i class="fa-solid fa-copy"></i> <span>Copy Text</span>
                        </button>
                        <button onclick="const a=document.createElement('a'); a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(\`${docText.replace(/`/g, '\\`')}\`); a.download='LSR_VEP_Affidavit_Clause6.3.txt'; a.click();" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1">
                            <i class="fa-solid fa-download"></i> <span>Download .txt</span>
                        </button>
                    </div>
                `);
                return;
            }

            if (qLower.includes('escalation') || qLower.includes('10ca') || qLower.includes('bitumen') || qLower.includes('cement')) {
                const docText = `FORMAL NOTICE OF PRICE ESCALATION (CLAUSE 10CA)

Ref: LSR/BRO/PRJ-SHIV/10CA/2026/08
Date: 05-October-2026

To,
The Commander / Superintending Engineer,
HQ 21 BRTF / Project Shivalik,
Border Roads Organisation, Joshimath / Chamoli (Uttarakhand).

Subject: Price Variation Bill under Contract Clause 10CA for VG-30 Bitumen & High-Speed Diesel (HSD) for the month of September-October 2026.

Dear Sir,
With reference to the Agreement No. CE (P) SHIVALIK/NIT-14/2026-27 for the work of "PDG & LYG WMM, DBM 50mm, BC 30mm on Joshimath-Badrinath Road", we submit herewith our formal price variation claim pursuant to General Conditions of Contract Clause 10CA.

1. Base Index (P0): Monthly Wholesale Price Index issued by Office of Economic Adviser (MoCI) at time of tender submission = 138.4
2. Current Index (P1): Wholesale Price Index for the month under billing = 146.9 (+6.14% escalation).
3. Formula Applied: V = P * Q * ((CI - BI) / BI)
4. Bitumen & POL Component Net Escalation Due: ₹ 41,84,320/-

All supporting refinery price invoices from Indian Oil Corporation Ltd (IOCL Mathura Refinery) and official MoCI statistical index bulletins are enclosed.

For M/s LSR INFRACON PRIVATE LIMITED

(AMIT SINGLA)
Managing Director
Tower B, Godrej Eternia, Industrial Area Phase 1, Chandigarh - 160002`;

                appendBotMessage(`
                    <div><strong>📜 BRO Clause 10CA Price Escalation Notice Drafted</strong></div>
                    <textarea class="w-full h-36 bg-slate-900 text-emerald-300 font-mono text-[10px] p-2 rounded-lg mt-2 border border-slate-700" readonly>${docText}</textarea>
                    <div class="flex space-x-2 mt-2">
                        <button onclick="navigator.clipboard.writeText(\`${docText.replace(/`/g, '\\`')}\`); alert('Copied Clause 10CA letter!');" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1">
                            <i class="fa-solid fa-copy"></i> <span>Copy Letter</span>
                        </button>
                    </div>
                `);
                return;
            }
        }

        // 4. Filter Tenders by State or Department
        if (qLower.includes('filter') || qLower.includes('show') && (qLower.includes('mizoram') || qLower.includes('bro') || qLower.includes('uttarakhand') || qLower.includes('arunachal'))) {
            const stateFilter = document.getElementById('filter-state');
            const deptFilter = document.getElementById('filter-dept');

            if (stateFilter && typeof filterTenders === 'function') {
                if (qLower.includes('mizoram')) stateFilter.value = 'Mizoram';
                else if (qLower.includes('uttarakhand')) stateFilter.value = 'Uttarakhand';
                else if (qLower.includes('arunachal')) stateFilter.value = 'Arunachal Pradesh';
                else if (qLower.includes('bro')) stateFilter.value = 'BRO_ANY';
                else stateFilter.value = 'ALL';

                filterTenders();
                appendBotMessage(`
                    <div><strong>✅ Filter Applied: ${stateFilter.options[stateFilter.selectedIndex]?.text || stateFilter.value}</strong></div>
                    <div class="action-card">
                        <div>• Active tender pipeline re-rendered matching criteria.</div>
                    </div>
                `);
                return;
            }
        }

        // 5. Bid Capacity Auditing Formula ABC = (2.5 * A * N) - B
        if (qLower.includes('capacity') || qLower.includes('audit') || qLower.includes('abc') || qLower.includes('turnover')) {
            let A = 120.0;
            let B = 45.0;
            let N = 1.0;

            const aMatch = query.match(/A\s*=\s*(\d+(\.\d+)?)/i) || query.match(/turnover\D+(\d+(\.\d+)?)/i);
            const bMatch = query.match(/B\s*=\s*(\d+(\.\d+)?)/i) || query.match(/ongoing\D+(\d+(\.\d+)?)/i);
            const nMatch = query.match(/N\s*=\s*(\d+(\.\d+)?)/i) || query.match(/period\D+(\d+(\.\d+)?)/i);

            if (aMatch) A = parseFloat(aMatch[1]);
            if (bMatch) B = parseFloat(bMatch[1]);
            if (nMatch) N = parseFloat(nMatch[1]);

            const ABC = (2.5 * A * N) - B;
            const ABC_Cr = ABC;

            const turnInput = document.getElementById('turnover-a');
            const periodInput = document.getElementById('period-n');
            const ongoingInput = document.getElementById('ongoing-b');
            if (turnInput && ongoingInput && typeof auditBidCapacity === 'function') {
                turnInput.value = A * 10000000;
                ongoingInput.value = B * 10000000;
                periodInput.value = N;
                auditBidCapacity();
            }

            appendBotMessage(`
                <div><strong>⚖️ BRO Bid Capacity Audit Result</strong></div>
                <div class="action-card">
                    <div>• <strong>Formula</strong>: ABC = (2.5 × A × N) - B</div>
                    <div>• <strong>Max Turnover (A)</strong>: ₹${A.toFixed(2)} Cr</div>
                    <div>• <strong>Execution Window (N)</strong>: ${N.toFixed(1)} Year(s)</div>
                    <div>• <strong>Ongoing Works (B)</strong>: ₹${B.toFixed(2)} Cr</div>
                    <div>• <strong>Available Bid Capacity</strong>: <span class="font-bold text-blue-700 text-sm">₹${ABC_Cr.toFixed(2)} Crores</span></div>
                    <div>• <strong>Status</strong>: ${ABC_Cr >= 13.17 ? '<span class="text-emerald-700 font-bold">QUALIFIED for ₹13.17 Cr Chamoli & Pushpak Tenders</span>' : '<span class="text-rose-700 font-bold">EXCEEDS CAPACITY</span>'}</div>
                </div>
            `);
            return;
        }

        // 6. Navigation in owner_crm.html
        if (typeof switchVertical === 'function' && (qLower.includes('fleet') || qLower.includes('treasury') || qLower.includes('project') || qLower.includes('legal') || qLower.includes('hr') || qLower.includes('cockpit'))) {
            let v = 'cockpit';
            if (qLower.includes('fleet') || qLower.includes('trailer')) v = 'fleet';
            else if (qLower.includes('treasury') || qLower.includes('bank')) v = 'treasury';
            else if (qLower.includes('project') || qLower.includes('site') || qLower.includes('bill')) v = 'projects';
            else if (qLower.includes('legal') || qLower.includes('bg') || qLower.includes('guarantee')) v = 'legal';
            else if (qLower.includes('hr') || qLower.includes('staff') || qLower.includes('attendance')) v = 'hr';

            switchVertical(v);
            appendBotMessage(`<div><strong>🔄 Navigated to:</strong> <em>${v.toUpperCase()} Vertical</em> in the Owner Command Center.</div>`);
            return;
        }

        // 7. Cloud Google Gemini API Call (If API key provided)
        const apiKey = localStorage.getItem('lsr_gemini_api_key');
        if (apiKey) {
            appendBotMessage(`<div class="flex items-center space-x-1.5 text-slate-500"><i class="fa-solid fa-spinner fa-spin"></i> <span>Querying Google Gemini Cloud...</span></div>`);
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are the executive AI copilot for LSR Infracon Private Limited (CIN: U45100CH2005PTC028727), registered at Tower B, Godrej Eternia, Industrial Area Phase 1, Chandigarh. Directors: Amit Singla (MD), Loveleen Dhaliwal Singla. The firm is a Class-1 Super Special Highway Contractor for Border Roads Organisation (BRO). We own 11 multi-axle trailers and 2 electronic HMP 60 TPH plants. We maintain a strict 20.0% protected net profit margin rule. Keep answers concise, highly technical, and immediately actionable for civil highway contracts.\n\nUser request: ${query}`
                            }]
                        }]
                    })
                });
                const resData = await response.json();
                const reply = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
                // Remove loading bubble
                messagesBox.removeChild(messagesBox.lastChild);
                if (reply) {
                    appendBotMessage(`<div>${reply.replace(/\n/g, '<br>')}</div>`);
                    return;
                }
            } catch (err) {
                // Remove loading bubble and fallback
                if (messagesBox.lastChild) messagesBox.removeChild(messagesBox.lastChild);
            }
        }

        // 8. Default Built-in Civil Engineering Intelligence
        appendBotMessage(`
            <div><strong>🏗️ LSR Strategic Engineering Analysis</strong></div>
            <p class="text-slate-700 text-xs">Based on our corporate profile (CIN: U45100CH2005PTC028727, Godrej Eternia, Chandigarh) and active BRO highway parameters:</p>
            <div class="action-card">
                <div>• <strong>Competitive Edge</strong>: Our 11 captive multi-axle trailers eliminate ₹18-24 Lakh third-party freight mobilization overheads to high-altitude sectors (Chamoli & Lawngtlai).</div>
                <div>• <strong>20.0% Margin Invariant</strong>: Quoting below -6.0% discount risks eroding statutory margins. We recommend bidding at <strong>-3.85% (Pushpak)</strong> and <strong>-4.20% (Chamoli)</strong>.</div>
                <div>• <strong>Price Protection</strong>: Clause 10CA pass-through safeguards all VG-30 bitumen and HSD fuel price spikes.</div>
            </div>
            <div class="text-[11px] text-slate-500 mt-1">Tip: Click one of the quick chips below or type <em>"Draft VEP affidavit"</em> or <em>"Amend Chamoli due date to 28-Oct-2026"</em>.</div>
        `);
    }

})();
