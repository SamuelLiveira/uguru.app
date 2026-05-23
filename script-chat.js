/* ==========================================
   üGURU 6.0 — CHAT ENGINE
   Módulo 2: Chat, Mensagens, Ascensão, Sinastria, Memória
   [V3: MULTI-BALÕES + TYPEWRITER + VOZ TTS]
========================================== */

window.uGuru = window.uGuru || {};

window.uGuru.chat = (function() {
    const getCore = () => window.uGuru.core;

    const chatObserver = new MutationObserver(() => {
        const chatEl = document.getElementById('chat-messages');
        if (chatEl) chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: 'smooth' });
    });

    window.addEventListener('DOMContentLoaded', () => {
        const chatEl = document.getElementById('chat-messages');
        if (chatEl) chatObserver.observe(chatEl, { childList: true, subtree: true });
        const input = document.getElementById('user-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
            });
        }
    });

    // ==========================================
    // MOTOR DE VOZ (TTS) — VOZ NATURAL
    // ==========================================
    function narrarMensagem(texto) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const textoLimpo = texto.replace(/[*_~`#|]/g, '').trim();
        if (!textoLimpo) return;

        const falar = () => {
            const utterance = new SpeechSynthesisUtterance(textoLimpo);
            utterance.lang = 'pt-BR';
            // Voz natural — sem alterações de pitch/rate
            const vozes = window.speechSynthesis.getVoices();
            const vozBR = vozes.find(v => v.lang === 'pt-BR') || vozes.find(v => v.lang.startsWith('pt'));
            if (vozBR) utterance.voice = vozBR;
            window.speechSynthesis.speak(utterance);
        };

        const vozes = window.speechSynthesis.getVoices();
        if (vozes.length > 0) {
            falar();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null;
                falar();
            };
        }
    }

    // ==========================================
    // MOTOR DE TYPEWRITER
    // ==========================================
    function typewriterEffect(elemento, texto, velocidade = 18) {
        return new Promise((resolve) => {
            let i = 0;
            elemento.textContent = '';
            const chatEl = document.getElementById('chat-messages');
            const intervalo = setInterval(() => {
                if (i < texto.length) {
                    elemento.textContent += texto[i];
                    i++;
                    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
                } else {
                    clearInterval(intervalo);
                    resolve();
                }
            }, velocidade);
        });
    }

    // ==========================================
    // BLOQUEIO E DESBLOQUEIO DO INPUT
    // ==========================================
    function bloquearInput() {
        const input = document.getElementById('user-input');
        const btn = document.getElementById('send-btn');
        if (input) input.disabled = true;
        if (btn) btn.disabled = true;
    }

    function desbloquearInput() {
        const input = document.getElementById('user-input');
        const btn = document.getElementById('send-btn');
        if (input) input.disabled = false;
        if (btn) btn.disabled = false;
    }

    // ==========================================
    // RENDERIZAÇÃO COM MULTI-BALÕES + TYPEWRITER
    // ==========================================
    async function _renderGuruMessage(texto) {
        const chatEl = document.getElementById('chat-messages');
        const loader = document.getElementById('oracle-loading');

        // Limpa tags internas
        let cleanText = texto
            .replace(/<swot_raciocinio>[\s\S]*?<\/swot_raciocinio>/gi, '')
            .replace(/<memoria_ancora>[\s\S]*?<\/memoria_ancora>/gi, '')
            .trim();

        // Divide em fragmentos pelo delimitador |||
        const fragmentos = cleanText.split('|||').map(f => f.trim()).filter(f => f.length > 0);

        bloquearInput();

        // Narra o primeiro fragmento imediatamente
        narrarMensagem(fragmentos[0]);

        for (let idx = 0; idx < fragmentos.length; idx++) {
            const fragmento = fragmentos[idx];

            const msgDiv = document.createElement('div');
            msgDiv.className = 'message guru-msg';
            const p = document.createElement('p');
            msgDiv.appendChild(p);

            if (loader && loader.parentNode === chatEl) {
                chatEl.insertBefore(msgDiv, loader);
            } else {
                chatEl.appendChild(msgDiv);
            }

            // Typewriter em cada fragmento
            await typewriterEffect(p, fragmento, 18);

            // Pausa entre balões + narra o próximo
            if (idx < fragmentos.length - 1) {
                await new Promise(r => setTimeout(r, 600));
                narrarMensagem(fragmentos[idx + 1]);
            }
        }

        desbloquearInput();
    }

    function _renderMessage(text, type) {
        const chatEl = document.getElementById('chat-messages');
        const loader = document.getElementById('oracle-loading');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        let cleanText = text;
        if (type === "guru-msg") {
            cleanText = cleanText.replace(/<swot_raciocinio>[\s\S]*?<\/swot_raciocinio>/gi, '');
            cleanText = cleanText.replace(/<memoria_ancora>[\s\S]*?<\/memoria_ancora>/gi, '');
            // Remove delimitador no histórico renderizado
            cleanText = cleanText.split('|||').join(' ');
        }

        msgDiv.innerHTML = `<p>${cleanText.trim()}</p>`;
        if (loader && loader.parentNode === chatEl) {
            chatEl.insertBefore(msgDiv, loader);
        } else {
            chatEl.appendChild(msgDiv);
        }
    }

    function addMessage(text, type) { _renderMessage(text, type); }

    // ==========================================
    // IR PARA O CHAT
    // ==========================================
    function irParaChat() {
        const core = getCore();
        core.state.step = 'chat';
        core.saveState();
        core.hideAll();

        document.getElementById('chat-container').classList.remove('hidden');
        document.getElementById('input-bar').classList.remove('hidden');
        document.getElementById('sync-bar-container').classList.remove('hidden');
        document.getElementById('dossie-eye').classList.remove('hidden');

        if (core.state.tier > 0) {
            document.getElementById('dossie-eye').classList.add('active');
        }

        const chatEl = document.getElementById('chat-messages');
        chatEl.innerHTML = '<div id="oracle-loading" class="hidden"><p class="loading-text">O Oráculo está decifrando as estrelas...</p></div>';

        if (core.state.history.length === 0) {
            const nome = (core.state.user && core.state.user.name) ? core.state.user.name.split(' ')[0] : "Viajante";
            const cidade = (core.state.user && core.state.user.city) ? core.state.user.city : "suas origens";
            const saudacao = `✨ Mes compliments..devo dizer, afinal este é um Salão Privado, ${nome} você estar aqui não é coincidência. As estrelas de ${cidade} revelaram que você é um dos quatro Iniciados escolhidos para esta audiência exclusiva antes da grande estreia. Enchanté, Mon Ami! O nome é üGuru mas pode me chamar apenas de guru, vamos começar... O que te traz ao meu domínio hoje?`;
            _renderMessage(saudacao, "guru-msg");
            core.state.history.push({ role: 'assistant', content: saudacao });
            core.saveState();
        } else {
            core.state.history.forEach(msg => {
                const tipo = (msg.role === 'user') ? "user-msg" : "guru-msg";
                _renderMessage(msg.content, tipo);
            });
        }

        requestAnimationFrame(() => {
            setTimeout(() => { chatEl.scrollTop = chatEl.scrollHeight; }, 100);
        });
    }

    // ==========================================
    // ENVIO DE MENSAGEM
    // ==========================================
    async function sendMessage() {
        const core = getCore();
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        if (!message) return;

        if (message.toLowerCase() === '/batizar') { input.value = ''; iniciarBatismoSegundaAlma(); return; }
        if (message.toLowerCase() === '/liberar') { input.value = ''; ascenderGrau(); return; }

        if (core.state.tier === 0 && core.state.messageCount >= 5) {
            core.iniciarPagamento(); return;
        }
        if (core.state.tier > 0 && core.state.messageCount >= 26) {
            core.showCustomAlert("Ciclo Concluído", "Mon Cher, as 21 mensagens do seu Pacto foram seladas. O véu se fecha por hoje.");
            return;
        }

        input.value = '';
        addMessage(message, "user-msg");
        core.state.history.push({ role: 'user', content: message });

        const contagemAnterior = parseInt(core.state.messageCount) || 0;
        core.state.messageCount = contagemAnterior + 1;
        core.saveState();
        if (window.uGuru && window.uGuru.core && window.uGuru.core.updateUI) window.uGuru.core.updateUI();

        const loader = document.getElementById('oracle-loading');
        const loaderText = loader.querySelector('.loading-text');
        loader.classList.remove('hidden');

        const mensagensTeatrais = [
            "Escaneando a posição das estrelas...",
            "Sincronizando frequências numerológicas...",
            `Consultando as efemérides de ${core.state.user.city}...`,
            "Decifrando o peso das suas shadows...",
            "O Oráculo está cruzando os planos para você..."
        ];
        let t = 0;
        loaderText.innerText = mensagensTeatrais[0];
        const intervaloTeatral = setInterval(() => {
            t++;
            loaderText.innerText = mensagensTeatrais[t % mensagensTeatrais.length];
        }, 2000);

        const celulasAtivas = triagemDeIntencao(message);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message, userData: core.state.user,
                    secondUserData: core.state.secondUser,
                    tier: core.state.tier,
                    history: core.state.history.slice(-6),
                    celulas: celulasAtivas,
                    contextSummary: core.state.contextSummary,
                    messageCount: contagemAnterior,
                    clientToken: core.state.clientToken,
                    lastActiveDate: core.state.lastActiveDate
                })
            });

            const data = await response.json();
            if (!response.ok) {
                if (data.error && data.error.includes("Anomalia")) window.recomecarBatismo();
                throw new Error(data.error || "Portal ocupado.");
            }

            // Extrai memória âncora
            const matchMemoria = data.reply.match(/<memoria_ancora>([\s\S]*?)<\/memoria_ancora>/i);
            if (matchMemoria) {
                core.state.contextSummary = matchMemoria[1].trim();
                data.reply = data.reply.replace(/<memoria_ancora>[\s\S]*?<\/memoria_ancora>/gi, '').trim();
            }

            // Esconde loader antes de renderizar
            clearInterval(intervaloTeatral);
            loader.classList.add('hidden');

            // Renderiza com typewriter + multi-balões + voz
            await _renderGuruMessage(data.reply);

            // Salva no histórico (sem o delimitador)
            const textoHistorico = data.reply.split('|||').join(' ');
            core.state.history.push({ role: 'assistant', content: textoHistorico });
            core.state.messageCount = data.serverMessageCount;
            core.state.clientToken = data.nextToken;
            core.saveState();
            if (window.uGuru && window.uGuru.core && window.uGuru.core.updateUI) window.uGuru.core.updateUI();

            if (core.state.messageCount > 0 && core.state.messageCount % 4 === 0) {
                consolidarMemoria();
            }

        } catch (error) {
            console.error("[uGuru_Debug] Erro:", error);
            if (window.uGuru && window.uGuru.core && window.uGuru.core.updateUI) window.uGuru.core.updateUI();
            const msgErro = error.message || "As cortinas se fecharam. Tente novamente.";
            addMessage(msgErro, "guru-msg");
            core.state.history.push({ role: 'assistant', content: msgErro });
            core.saveState();
            desbloquearInput();
        } finally {
            clearInterval(intervaloTeatral);
            loader.classList.add('hidden');
            setTimeout(() => loaderText.innerText = "O Oráculo está decifrando as estrelas...", 500);
        }
    }

    // ==========================================
    // AUXILIARES
    // ==========================================
    function ascenderGrau() {
        const core = getCore();
        core.state.tier++;
        core.state.messageCount = 5;
        const msg = `Sua oferenda foi aceita. Você ascendeu ao Grau ${core.state.tier}. A Ampulheta foi restaurada.`;
        core.state.history.push({ role: 'assistant', content: msg });
        core.saveState();
        if (window.renderCards) window.renderCards();
        if (window.uGuru && window.uGuru.core && window.uGuru.core.updateUI) window.uGuru.core.updateUI();
        const olho = document.getElementById('dossie-eye');
        if (olho) olho.classList.add('active');
        addMessage(msg, "guru-msg");
    }

    function iniciarBatismoSegundaAlma() {
        const modalHtml = `
            <div id="sinastria-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999;display:flex;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;">
                <div style="background:linear-gradient(180deg,#0b1026 0%,#1a0f1f 100%);border:1px solid rgba(230,192,104,0.4);border-radius:28px;padding:35px 25px;text-align:center;width:100%;max-width:380px;box-shadow:0 25px 50px rgba(0,0,0,0.6);">
                    <p style="font-size:0.75rem;color:#e6c068;opacity:0.7;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Sinastria</p>
                    <h2 style="font-family:'Playfair Display',serif;color:#fff1c2;font-size:1.6rem;margin-bottom:8px;">Batismo da Segunda Alma</h2>
                    <p style="color:#f6edd6;opacity:0.6;font-size:0.85rem;margin-bottom:25px;">Declare os dados desta alma para o cruzamento kármico.</p>
                    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
                        <input type="text" id="sec-name" placeholder="Nome Completo *" style="width:100%;padding:16px;border-radius:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;box-sizing:border-box;">
                        <input type="date" id="sec-date" style="width:100%;padding:16px;border-radius:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;box-sizing:border-box;">
                        <input type="time" id="sec-time" placeholder="Hora de nascimento (opcional)" style="width:100%;padding:16px;border-radius:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;box-sizing:border-box;">
                        <input type="text" id="sec-city" placeholder="Cidade de nascimento (opcional)" style="width:100%;padding:16px;border-radius:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;box-sizing:border-box;">
                    </div>
                    <p style="font-size:0.72rem;color:#e6c068;opacity:0.5;margin-bottom:16px;">* Obrigatório. Hora e cidade aumentam a precisão do ascendente.</p>
                    <button onclick="uGuru.chat.salvarSegundaAlma()" style="background:linear-gradient(135deg,#e6c068,#ffb36a);color:#0b1026;border:none;padding:18px;border-radius:16px;font-weight:700;width:100%;text-transform:uppercase;letter-spacing:1px;cursor:pointer;font-size:0.9rem;margin-bottom:10px;">Consagrar</button>
                    <button onclick="uGuru.chat.fecharSinastria()" style="background:transparent;border:none;color:#f6edd6;opacity:0.4;font-size:0.8rem;cursor:pointer;text-decoration:underline;width:100%;">Recuar</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async function salvarSegundaAlma() {
        const core = getCore();
        const name = document.getElementById('sec-name').value.trim();
        const date = document.getElementById('sec-date').value;
        const time = document.getElementById('sec-time').value;
        const city = document.getElementById('sec-city').value.trim();
        if (!name || !date) {
            core.showCustomAlert("Campos Incompletos", "Nome e data são necessários para o cruzamento kármico, mon cher.");
            return;
        }

        core.state.secondUser = { name, date, time, city };
        fecharSinastria();

        const horaTexto = time ? ` às ${time}` : '';
        const cidadeTexto = city ? ` de ${city}` : '';
        const msgAncora = `A alma de ${name}${cidadeTexto}${horaTexto} foi ancorada. Calculando o mapa astral...`;
        addMessage(msgAncora, "guru-msg");

        // Chama a rota de sinastria para calcular o mapa da segunda alma
        try {
            const response = await fetch('/api/sinastria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secondUserData: core.state.secondUser })
            });
            if (response.ok) {
                const astral = await response.json();
                core.state.secondUser.sol = astral.sol;
                core.state.secondUser.lua = astral.lua;
                core.state.secondUser.ascendente = astral.ascendente;
                core.state.secondUser.ascendenteConfiavel = astral.ascendenteConfiavel;
                const msgConfirm = `✨ Sinastria ativa. ${name}: Sol em ${astral.sol}, Lua em ${astral.lua}${astral.ascendenteConfiavel ? `, Ascendente em ${astral.ascendente}` : ''}.`;
                addMessage(msgConfirm, "guru-msg");
                core.state.history.push({ role: 'assistant', content: msgConfirm });
            } else {
                const msgFallback = `A alma de ${name} foi ancorada. A sinastria está ativa.`;
                addMessage(msgFallback, "guru-msg");
                core.state.history.push({ role: 'assistant', content: msgFallback });
            }
        } catch(e) {
            const msgFallback = `A alma de ${name} foi ancorada. A sinastria está ativa.`;
            addMessage(msgFallback, "guru-msg");
            core.state.history.push({ role: 'assistant', content: msgFallback });
        }

        core.saveState();
    }

    function fecharSinastria() {
        const m = document.getElementById('sinastria-modal');
        if (m) m.remove();
    }

    function triagemDeIntencao(pergunta) {
        const p = pergunta.toLowerCase();
        let celulas = [];
        if (p.includes("dinheiro") || p.includes("trabalho")) celulas.push("LENTE DA MATÉRIA: Foco em Saturno e Casa 2.");
        if (p.includes("amor") || p.includes("ex")) celulas.push("LENTE DO AFETO: Foco em Vênus e Casa 7.");
        if (p.includes("sombra") || p.includes("medo")) celulas.push("LENTE DA SOMBRA: Foco em Plutão e Casa 8.");
        return celulas.length > 0 ? celulas.join(" | ") : "LENTE DA ESSÊNCIA.";
    }

    async function consolidarMemoria() {
        const core = getCore();
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "SISTEMA DE ARQUIVAMENTO KÁRMICO: Extraia a essência psicológica em 2 frases densas.",
                    userData: core.state.user,
                    history: core.state.history.slice(-10),
                    isInternalSummary: true,
                    messageCount: core.state.messageCount,
                    clientToken: core.state.clientToken
                })
            });
            if (response.ok) {
                const data = await response.json();
                core.state.contextSummary = data.reply;
                core.saveState();
            }
        } catch (e) { console.warn("Memória falhou."); }
    }

    return { irParaChat, sendMessage, ascenderGrau, iniciarBatismoSegundaAlma, salvarSegundaAlma, fecharSinastria };
})();

window.sendMessage = window.uGuru.chat.sendMessage;
window.irParaChat = window.uGuru.chat.irParaChat;
window.iniciarBatismoSegundaAlma = window.uGuru.chat.iniciarBatismoSegundaAlma;
window.salvarSegundaAlma = window.uGuru.chat.salvarSegundaAlma;
window.fecharSinastria = window.uGuru.chat.fecharSinastria;