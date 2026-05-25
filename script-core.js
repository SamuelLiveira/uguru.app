/* ==========================================
   üGURU — CORE ENGINE
   Módulo 1: Estado, Onboarding, Cards, Banquete
========================================== */

let state = JSON.parse(localStorage.getItem('uguru_state')) || {
    step: 'onboarding', user: null, secondUser: null,
    messageCount: 0, tier: 0, history: [], cardsData: null,
    lastActiveDate: null, contextSummary: "", termoAceito: false
};

if (state.isPaid && state.tier === 0) state.tier = 1;

window.onload = () => {
    verificarRegeneracaoDiaria();
    // Força um save para garantir que o lastActiveDate está atualizado
    if (state.user) saveState();
    
    if (state.user && state.step !== 'onboarding') {
        if (state.step === 'banquete') showBanquete();
        else if (state.step === 'chat' && typeof irParaChat === "function") irParaChat();
    } else {
        document.getElementById('onboarding').classList.remove('hidden');
    }
    updateUI();
};

function saveState() {
    state.lastActiveDate = new Date().getTime();
    localStorage.setItem('uguru_state', JSON.stringify(state));
}

function verificarRegeneracaoDiaria() {
    if (!state.messageCount || !state.lastActiveDate) return;
    const diffDays = Math.floor(Math.abs(new Date().getTime() - state.lastActiveDate) / 86400000);
    if (diffDays >= 1) {
        const piso = state.tier === 0 ? 0 : 5;
        state.messageCount = Math.max(piso, state.messageCount - diffDays);
    }
}

// ==========================================
// ONBOARDING
// ==========================================

function reviewData() {
    const fields = {
        name: document.getElementById('userName').value.trim(),
        date: document.getElementById('birthDate').value,
        time: document.getElementById('birthTime').value,
        city: document.getElementById('birthCity').value.trim(),
        state: document.getElementById('birthState').value
    };

    if (!fields.name || !fields.date || !fields.time || !fields.city || !fields.state) {
        showCustomAlert("Trajes Inadequados", "Para cruzar o portal, preciso de cada detalhe do seu batismo. Não deixe campos vazios, mon cher.");
        return;
    }

    state.user = fields;
    document.getElementById('review-content').innerHTML = `
        <p><b>Nome:</b> ${fields.name}</p>
        <p><b>Origem:</b> ${fields.city}/${fields.state}</p>
        <p><b>Portal:</b> ${fields.date} às ${fields.time}</p>
        <p style="font-size:12px;color:#e6c068;opacity:0.8;margin-top:10px;text-align:left;">
            ⏰ A hora exata é essencial para o Ascendente. Se não souber, use a hora aproximada.
        </p>
        <p style="font-size:11px;opacity:0.7;margin-top:15px;border-top:1px solid rgba(230,192,104,0.3);padding-top:10px;">
            Ao confirmar, você aceita o <span style="color:#e6c068;cursor:pointer;" onclick="abrirModalTermos()">Contrato de Iniciação</span> e o uso de dados (LGPD).
        </p>
    `;
    saveState();
    if (typeof hideAll === "function") hideAll();
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function backToEdit() {
    if (typeof hideAll === "function") hideAll();
    document.getElementById('onboarding').classList.remove('hidden');
}

async function confirmAndProceed() {
    state.step = 'banquete';
    state.termoAceito = true;
    saveState();
    if (typeof showBanquete === "function") await showBanquete();
}

// ==========================================
// BANQUETE / CARDS
// ==========================================

async function showBanquete() {
    state.step = 'banquete';
    saveState();
    hideAll();
    document.getElementById('banquete-wrapper').classList.remove('hidden');
    document.getElementById('dossie-eye').classList.remove('hidden');
    if (!state.cardsData || state.cardsData.length === 0) await fetchCardsFromBackend();
    else renderCards();
}

function obterArquetipoZero() {
    const c = state.user.city;
    const n = state.user.name;
    return [
        { title: "🌟 Ascendente Estelar", content: `No momento exato do seu nascimento em ${c}, a constelação que se erguia no leste cravou em sua essência uma máscara social magnética. Seu ascendente dita como o mundo o percebe antes de você proferir a primeira palavra — é o filtro pelo qual sua alma se projeta na matéria.` },
        { title: "🌙 Refúgio Lunar", content: `A lua governa o que você esconde a portas fechadas, ${n}. Suas reações instintivas e necessidade de segurança estão ancorados na posição lunar de seu nascimento. É o útero da sua intuição — sua verdade mais nua.` },
        { title: "🔥 Impulso de Marte", content: `Marte rege sua espada, seu desejo e seu fogo. Como você luta por suas ambições e conquista o que almeja. Este guerreiro interior mostrará onde reside sua coragem e onde você pode se ferir em batalhas desnecessárias.` },
        { title: "💎 Número de Expressão", content: `Seu nome não foi obra do acaso. O Número de Expressão dita a voz que sua alma usa para se comunicar com o universo — seu dom inato, aquilo que flui sem esforço. Esta frequência atrai as pessoas certas e as oportunidades de ouro.` },
        { title: "🗝️ Caminho de Destino", content: `A soma do seu nascimento revela os obstáculos que o universo programou para seu crescimento e as recompensas que aguardam na linha de chegada. Sintonizar-se com este número é navegar com o vento das estrelas a seu favor.` },
        { title: "🌀 Missão de Alma", content: `O karma não é punição — é uma sala de aula de alto luxo. Este card expõe as armadilhas emocionais e os ciclos repetitivos que o prendem a versões antigas de si mesmo. Compreender sua missão é o único caminho para a libertação definitiva.` },
        { title: "👁️ O Dossiê de Alma (Veredito)", content: `Sua essência foi capturada. Esta é a síntese definitiva das forças que regem sua existência — um diagnóstico cirúrgico sem filtros. O veredito revela o que bloqueia seu ápice financeiro, amoroso e espiritual, e o exato próximo passo para assumir o trono da sua história.` }
    ];
}

async function fetchCardsFromBackend() {
    const container = document.getElementById('cards-container');
    const btnChat = document.querySelector('[onclick="irParaChat()"]');
    container.innerHTML = `<div id="loading-cards"><p class="loading-text">As constelações estão sendo mapeadas...</p></div>`;
    if (btnChat) btnChat.classList.add('hidden');

    try {
        const response = await fetch('/api/generateCards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userData: state.user })
        });
        if (!response.ok) throw new Error("Portal ocupado.");
        const data = await response.json();
        state.cardsData = data.cards;
        if (data.astroData) {
            state.user.sol        = data.astroData.sol;
            state.user.lua        = data.astroData.lua;
            state.user.ascendente = data.astroData.ascendente;
            state.user.mercurio   = data.astroData.mercurio;
            state.user.venus      = data.astroData.venus;
            state.user.marte      = data.astroData.marte;
            state.user.jupiter    = data.astroData.jupiter;
            state.user.saturno    = data.astroData.saturno;
            state.user.urano      = data.astroData.urano;
            state.user.netuno     = data.astroData.netuno;
            state.user.plutao     = data.astroData.plutao;
            state.user.destino    = data.astroData.destino;
            state.user.expressao  = data.astroData.expressao;
            state.user.missao     = data.astroData.missao;
        }
        // Salva imediatamente após receber os dados astrais
        saveState();
    } catch (error) {
        console.warn("[uGuru] Usando Arquétipo Zero:", error.message);
        state.cardsData = obterArquetipoZero();
        saveState();
    }
    renderCards();
    if (btnChat) btnChat.classList.remove('hidden');
}

function renderCards() {
    const container = document.getElementById('cards-container');
    if (!state.cardsData || state.cardsData.length === 0) return;

    const card7 = state.cardsData[6];
    const card7Titulos = {
        1: "👁️ O Dossiê de Alma (Veredito)",
        2: "👁️ Os Trânsitos Kármicos (Grau 2)",
        3: "👁️ A Sombra Oculta (Grau 3)"
    };
    const card7Conteudos = {
        2: "Sua ascensão permitiu decifrar os próximos ciclos. As constelações revelam que os próximos 6 meses exigirão reestruturação profunda. O universo cobrará dívidas pendentes, mas abrirá portas para colheitas inesperadas.",
        3: "No terceiro grau, os véus caem completamente. Sua maior autossabotagem não é o que você pensa, mas o que esconde de si mesmo no silêncio da noite."
    };

    if (state.tier >= 1) card7.title = card7Titulos[state.tier] || `👁️ O Oráculo Supremo (Grau ${state.tier})`;
    if (state.tier >= 2) card7.content = card7Conteudos[state.tier] || "Você atingiu esferas de alta densidade kármica. O conhecimento flui através da sua própria intuição blindada.";

    let html = state.cardsData.slice(0, 6).map(c =>
        `<div class="card"><h3>${c.title}</h3><p>${c.content}</p></div>`
    ).join('');

    const classeCard7 = state.tier === 0 ? 'locked' : 'unlocked-majestoso';
    const contentCard7 = state.tier > 0 ? `
        <div style="font-size:0.75rem;color:var(--gold-bright);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;opacity:0.9;">Honraria Kármica</div>
        <p>${card7.content}</p>
        <button class="btn-primary btn-dossie-baixar" onclick="gerarDossieLuxo()">📥 Baixar Dossiê Autêntico</button>
    ` : `<p class="card7-locked-text">O Dossiê Final está bloqueado. Aguardando a Oferenda de Passagem para desvelar as 25 linhas do seu destino oculto...</p>`;

    html += `<div id="card-7" class="card card-7 ${classeCard7}"><h3>${card7.title}</h3>${contentCard7}</div>`;
    container.innerHTML = html;
}

function toggleDossie() {
    const bWrapper = document.getElementById('banquete-wrapper');
    if (bWrapper.classList.contains('hidden')) showBanquete();
    else if (typeof irParaChat === "function") irParaChat();
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function hideAll() {
    ['onboarding','confirmation-modal','banquete-wrapper','chat-container','input-bar','sync-bar-container','dossie-eye']
        .forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function recomecarBatismo() {
    showCustomAlert("Apagar os Registos?", "Isto destruirá o seu dossiê actual e fará as estrelas esquecerem TODO o seu progresso. Tem certeza absoluta?", true, () => {
        localStorage.removeItem('uguru_state');
        location.reload();
    });
}

function showCustomAlert(title, message, isConfirm = false, onConfirm = null) {
    const modal = document.getElementById('custom-alert');
    if (!modal) return;
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    const buttonArea = document.getElementById('alert-buttons');
    buttonArea.innerHTML = isConfirm
        ? `<button class="btn-secondary" onclick="closeAlert()">Recuar</button><button class="btn-primary" id="confirm-ok">Prosseguir</button>`
        : `<button class="btn-primary" onclick="closeAlert()">Entendido</button>`;
    if (isConfirm) document.getElementById('confirm-ok').onclick = () => { onConfirm?.(); closeAlert(); };
    modal.classList.remove('hidden');
}

function closeAlert() {
    document.getElementById('custom-alert')?.classList.add('hidden');
}

function updateUI() {
    const syncBarContainer = document.getElementById('sync-bar-container');
    const inputBar = document.getElementById('input-bar');
    const paywallPopup = document.getElementById('paywall-popup');
    const barFill = document.getElementById('sync-bar-fill');

    if (syncBarContainer) syncBarContainer.classList.add('hidden');

    if (state.step !== 'chat') {
        if (inputBar) inputBar.classList.add('hidden');
        if (paywallPopup) paywallPopup.classList.add('hidden');
        return;
    }

    if (state.tier === 0 && state.messageCount >= 5) {
        if (inputBar) inputBar.classList.add('hidden');
        if (paywallPopup) paywallPopup.classList.remove('hidden');
    } else if (state.tier >= 1 && state.messageCount >= 21) {
        if (inputBar) inputBar.classList.add('hidden');
    } else {
        if (inputBar) inputBar.classList.remove('hidden');
        if (paywallPopup) paywallPopup.classList.add('hidden');
    }

    if (syncBarContainer) syncBarContainer.classList.remove('hidden');
    if (barFill) {
        const pct = Math.min((state.messageCount / (state.tier === 0 ? 5 : 26)) * 100, 100);
        barFill.style.width = `${pct}%`;
    }
}

// ==========================================
// PAYWALL
// ==========================================

function iniciarPagamento() {
    showCustomAlert("Oferenda de Passagem", `O ciclo fechou-se. Para o Grau ${state.tier + 1} e mais 21 interacções, uma nova Oferenda é necessária. (Use /liberar para testar a ascensão).`);
    document.getElementById('paywall-popup')?.classList.add('hidden');
}

window.fecharPopUpDourado = () => document.getElementById('paywall-popup')?.classList.add('hidden');
window.irParaVeredito = () => { window.fecharPopUpDourado(); showBanquete(); };

// ==========================================
// DOSSIÊ DIGITAL
// ==========================================

window.gerarDossieLuxo = function () {
    const modal = document.getElementById('dossie-modal');
    const contentDiv = document.getElementById('dossie-content');

    const selos = { 1: ["AUTÊNTICO", "var(--gold)"], 2: ["MESTRE", "#b0c4de"], 3: ["GRAU 33", "#e0115f"] };
    const [sealText, sealColor] = selos[Math.min(state.tier, 3)] || selos[1];

    const matriz = [
        { luz: "As constelações favorecem um magnetismo silencioso. O que você buscar agora, virá com facilidade.", sombra: "Cuidado com o ego inflamado. A precipitação pode queimar as pontes certas.", ritual: "Tome um copo de água mentalizando sua meta financeira antes de dormir." },
        { luz: "Sua intuição está afiada como uma lâmina de prata. Confie nas mensagens dos seus sonhos.", sombra: "O medo da rejeição pode paralisar suas decisões. Não ceda às ilusões do passado.", ritual: "Escreva o nome da sua maior trava num papel e queime-o para liberar o karma." },
        { luz: "Um ciclo de prosperidade bruta se abre. Há energia de construção e colheita ao seu redor.", sombra: "A avareza emocional o deixará isolado. Não negue afeto a quem lhe estende a mão.", ritual: "Doe uma moeda ou item antigo nas próximas 24h para abrir espaço no destino." }
    ];

    const cardsHtml = state.cardsData.map((card, i) => {
        const exp = matriz[i % 3];
        return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(230,192,104,0.2);padding:22px;margin-bottom:18px;border-radius:20px;">
            <h3 style="color:var(--gold-bright);font-family:'Playfair Display',serif;margin-bottom:12px;font-size:1.15rem;">${card.title}</h3>
            <p style="line-height:1.6;font-size:0.95rem;color:#f6edd6;opacity:0.9;margin-bottom:18px;">${card.content}</p>
            <div style="background:rgba(255,241,194,0.03);border-left:2px solid var(--gold-bright);padding:10px 14px;margin-bottom:10px;border-radius:0 8px 8px 0;">
                <span style="display:block;font-size:0.75rem;color:var(--gold-bright);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">✨ Camada de Luz</span>
                <p style="font-size:0.85rem;color:rgba(246,237,214,0.85);line-height:1.4;">${exp.luz}</p>
            </div>
            <div style="background:rgba(224,17,95,0.05);border-left:2px solid #e0115f;padding:10px 14px;margin-bottom:10px;border-radius:0 8px 8px 0;">
                <span style="display:block;font-size:0.75rem;color:#e0115f;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">🌑 Camada de Sombra</span>
                <p style="font-size:0.85rem;color:rgba(246,237,214,0.85);line-height:1.4;">${exp.sombra}</p>
            </div>
            <div style="background:rgba(176,196,222,0.05);border-left:2px solid #b0c4de;padding:10px 14px;border-radius:0 8px 8px 0;">
                <span style="display:block;font-size:0.75rem;color:#b0c4de;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">🗝️ Ação Prática</span>
                <p style="font-size:0.85rem;color:rgba(246,237,214,0.85);line-height:1.4;">${exp.ritual}</p>
            </div>
        </div>`;
    }).join('');

    contentDiv.innerHTML = `
        <div style="text-align:center;margin-bottom:30px;margin-top:15px;">
            <h2 style="font-family:'Playfair Display',serif;color:var(--gold);font-size:26px;margin-bottom:5px;">Dossiê de Essência</h2>
            <p style="font-size:13px;color:#f6edd6;opacity:0.6;letter-spacing:2px;text-transform:uppercase;">${state.user.name}</p>
            <div style="width:50px;height:1px;background:var(--gold);margin:20px auto;"></div>
        </div>
        ${cardsHtml}
        <div style="margin-top:40px;text-align:center;padding-bottom:20px;">
            <div style="font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);margin-bottom:8px;">üGuru👁️</div>
            <div style="font-size:11px;opacity:0.5;margin-bottom:20px;text-transform:uppercase;letter-spacing:3px;">Sabedoria Selada</div>
            <div style="display:inline-block;padding:8px 16px;border:1px solid ${sealColor};color:${sealColor};border-radius:4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">SELO: ${sealText}</div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
};

window.fecharModalDossie = function () {
    const modal = document.getElementById('dossie-modal');
    modal.style.transform = '';
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 400);
    document.body.style.overflow = '';
};

// SWIPE DOWN NO DOSSIÊ
(function initSwipeDown() {
    const modal = document.getElementById('dossie-modal');
    if (!modal) return;
    let startY = 0, currentY = 0, dragging = false;

    modal.addEventListener('touchstart', (e) => {
        const content = document.getElementById('dossie-content');
        startY = e.touches[0].clientY;
        dragging = !content || content.scrollTop <= 0;
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const delta = currentY - startY;
        const content = document.getElementById('dossie-content');
        if (content?.scrollTop <= 0 && delta > 0) {
            modal.style.transition = 'none';
            modal.style.transform = `translateY(${delta}px)`;
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    modal.addEventListener('touchend', () => {
        if (!dragging) return;
        const delta = currentY - startY;
        modal.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        if (delta > 100) { fecharModalDossie(); }
        else { modal.style.transform = 'translateY(0)'; setTimeout(() => { modal.style.transform = ''; }, 400); }
        dragging = false; startY = 0; currentY = 0;
    });
})();


// ==========================================
// MODAL DE TERMOS
// ==========================================

window.abrirModalTermos = function() {
    if (document.getElementById('modal-termos')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="modal-termos" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(5,8,20,0.98);z-index:20000;display:flex;justify-content:center;align-items:center;padding:20px;backdrop-filter:blur(10px);">
            <div style="background:#0b1026;border:1px solid #e6c068;padding:30px;border-radius:15px;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,0.8);">
                <h2 style="font-family:'Playfair Display',serif;color:#e6c068;text-align:center;margin-top:0;font-size:22px;letter-spacing:1px;">CONTRATO DE INICIAÇÃO</h2>
                <div style="font-family:'Inter',sans-serif;color:#f6edd6;line-height:1.6;font-size:13px;margin-top:20px;opacity:0.9;">
                    <p>Ao adentrar este espaço, você concorda com os termos inegociáveis do nosso pacto:</p>
                    <p><strong>1. A Ilusão do Controle:</strong> O üGuru lê tendências, não prevê o futuro estático. As decisões após a leitura são de responsabilidade exclusiva do Iniciado.</p>
                    <p><strong>2. Dados Sensíveis e LGPD:</strong> Coletamos dados de nascimento com seu consentimento livre e informado, processados exclusivamente para a sua experiência.</p>
                    <p><strong>3. O Cofre de Cronos:</strong> Suas conversas residem no localStorage do seu navegador. Não mantemos banco de dados centralizado com sua identidade.</p>
                    <p><strong>4. Fronteiras Internacionais:</strong> Seus dados são transmitidos anonimamente para servidores de IA fora do território nacional (EUA/Groq).</p>
                    <p><strong>5. O Direito ao Esquecimento:</strong> "Novo Batismo" apaga instantaneamente todos os registros no seu dispositivo.</p>
                    <p><strong>6. Elegibilidade:</strong> Reservado para maiores de 18 anos.</p>
                </div>
                <button onclick="document.getElementById('modal-termos').remove()" style="display:block;width:100%;margin-top:25px;background:transparent;border:1px solid #e6c068;color:#e6c068;padding:12px;font-family:'Playfair Display',serif;cursor:pointer;text-transform:uppercase;letter-spacing:2px;transition:0.3s;" onmouseover="this.style.background='#e6c068';this.style.color='#0b1026'" onmouseout="this.style.background='transparent';this.style.color='#e6c068'">Selar Pacto</button>
            </div>
        </div>
    `);
};

// ==========================================
// PONTE DE REATIVIDADE
// ==========================================
window.uGuru = window.uGuru || {};
window.uGuru.core = {
    get state() { return state; },
    saveState,
    hideAll,
    showCustomAlert: typeof showCustomAlert === "function" ? showCustomAlert : function(){},
    iniciarPagamento: typeof iniciarPagamento === "function" ? iniciarPagamento : function(){},
    get updateUI() { return typeof updateUI === "function" ? updateUI : function(){}; }
};