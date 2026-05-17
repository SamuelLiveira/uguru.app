/* ==========================================
   üGURU 6.0 — CORE ENGINE
   Módulo 1: Estado, Onboarding, Cards, Banquete
   [SPLIT + CORREÇÕES GADÚ - MODAL SWIPE & AUTO-ROLL]
========================================== */

let state = JSON.parse(localStorage.getItem('uguru_state')) ||
{
    step: 'onboarding',
    user: null,
    secondUser: null,
    messageCount: 0,
    tier: 0,
    history: [],
    cardsData: null,
    lastActiveDate: null,
    contextSummary: "",
    termoAceito: false
};

// Retrocompatibilidade para testes passados
if (state.isPaid && state.tier === 0) state.tier = 1;

window.onload = () => {
    verificarRegeneracaoDiaria();

    if (state.user && state.step !== 'onboarding') {
        if (state.step === 'banquete') showBanquete();
        else if (state.step === 'chat') {
            if (typeof irParaChat === "function") {
                irParaChat();
            }
        }
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
    if (state.messageCount > 0) { 
        if (state.lastActiveDate) {
            const now = new Date().getTime();
            const diffTime = Math.abs(now - state.lastActiveDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 1) {
                // Subtrai os dias ausentes da contagem de mensagens
                let novaContagem = state.messageCount - diffDays;

                // Trava de Arquitetura Gadú: 
                // Camponeses (Tier 0) podem esvaziar até o 0.
                // VIPs (Tier 1+) têm a barra travada no 5 (que representa os 15% de base deles).
                const pisoMinimo = state.tier === 0 ? 0 : 5;

                // Aplica a nova contagem respeitando o piso
                state.messageCount = Math.max(pisoMinimo, novaContagem);
            }
        }
    }
}


// ==========================================
// ONBOARDING
// ==========================================

function reviewData() {
    const fields = {
        name: document.getElementById('userName').value.trim(),
        fullName: document.getElementById('userName').value.trim(),
        date: document.getElementById('birthDate').value,
        time: document.getElementById('birthTime').value,
        city: document.getElementById('birthCity').value.trim(),
        state: document.getElementById('birthState').value
    };

    // Mantendo seu alerta personalizado
    if (!fields.name || !fields.date || !fields.time || !fields.city || !fields.state) {
        showCustomAlert("Trajes Inadequados", "Para cruzar o portal, preciso de cada detalhe do seu batismo. Não deixe campos vazios, mon cher.");
        return;
    }

    state.user = fields;
    
    // Aqui injetamos o aviso legal SEM quebrar a estrutura
    document.getElementById('review-content').innerHTML = `
        <p><b>Nome:</b> ${fields.name}</p>
        <p><b>Origem:</b> ${fields.city}/${fields.state}</p>
        <p><b>Portal:</b> ${fields.date} às ${fields.time}</p>
        <p style="font-size: 11px; opacity: 0.7; margin-top: 15px; border-top: 1px solid rgba(230,192,104,0.3); padding-top: 10px;">
            Ao confirmar, você aceita o <span style="color:#e6c068; cursor:pointer;"
            onclick="abrirModalTermos()">Contrato de Iniciação</span> e o uso de dados (LGPD).
        </p>
    `;

    saveState(); // ← adiciona essa linha
if (typeof hideAll === "function") hideAll();
document.getElementById('confirmation-modal').classList.remove('hidden');
}

function backToEdit() {
    if (typeof hideAll === "function") hideAll();
    document.getElementById('onboarding').classList.remove('hidden');
}

async function confirmAndProceed() {
    // Salvando que o termo foi aceito no estado global
    state.step = 'banquete';
    state.termoAceito = true; 
    
    if (typeof saveState === "function") saveState();
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

    if (!state.cardsData || state.cardsData.length === 0) {
        await fetchCardsFromBackend();
    } else {
        renderCards();
    }
}

function obterArquetipoZero() {
    return [
        { title: "🌟 Ascendente Estelar", content: `Calculando o horizonte de ${state.user.city}... No momento exato do seu batismo físico, a constelação que se erguia no leste cravou em sua essência uma máscara social magnética. Esta camada externa é o seu escudo e o seu cartão de visitas kármico. O seu ascendente dita como o mundo o percebe antes mesmo de você proferir a primeira palavra. É o filtro pelo qual sua alma se projeta na realidade densa da matéria. Entender esta vibração é dominar a arte da primeira impressão e o ritmo de sua jornada terrestre.` },
        { title: "🌙 Refúgio Lunar", content: `Mapeando as marés emocionais de ${state.user.name}... A lua governa aquilo que você esconde a portas fechadas. Suas reações instintivas, seus medos mais profundos e sua necessidade de segurança estão ancorados na posição lunar de seu nascimento. É o seu santuário privado, o útero de sua intuição. Ao decifrarmos este quadrante, expomos o arquétipo da sua criança interior e o que realmente nutre o seu espírito quando o sol se põe e as luzes do mundo se apagam. É a sua verdade nua.` },
        { title: "🔥 Impulso de Marte", content: `A força motriz de sua jornada... Marte rege a sua espada, o seu desejo e o seu fogo. Como você luta por suas ambições e como conquista o que o seu coração almeja. A análise profunda deste guerreiro interior mostrará onde reside a sua coragem inabalável e também onde você pode se ferir em batalhas desnecessárias. É a faísca que incendeia a sua determinação e a energia bruta que você precisa aprender a canalizar para construir o seu império pessoal.` },
        { title: "💎 Número de Expressão", content: `Decifrando a frequência do seu nome... A numerologia pitagórica nos ensina que seu registo original não foi obra do acaso. O Número de Expressão dita a voz que sua alma usa para se comunicar com o universo. É o seu dom inato, aquilo que flui de você sem esforço. Ao calcularmos as vogais e consoantes de seu batismo, traduzimos a essência verdadeira do seu talento. Esta é a frequência que atrai as pessoas certas e as oportunidades de ouro para o seu caminho.` },
        { title: "🗝️ Caminho de Destino", content: `A frequência sagrada de sua data de chegada... O destino não é um local estático, mas uma trilha sonora que você precisa aprender a dançar para prosperar. A soma de seu nascimento revela os obstáculos que o universo programou para o seu crescimento e as recompensas que o aguardam na linha de chegada. A matemática divina é impiedosa e justa. Sintonizar-se com este número é parar de nadar contra a correnteza e começar a navegar com o vento das estrelas a seu favor.` },
        { title: "🌀 Missão de Alma", content: `O nó kármico que você veio desatar nesta encarnação... O karma não é uma punição, mas uma sala de aula de alto luxo. Este card traz a lição que sua alma escolheu repetir até que você a domine completamente. Ele expõe as armadilhas emocionais e os ciclos repetitivos que o prendem a versões antigas de si mesmo. Compreender a sua missão é o único caminho para a libertação definitiva e para a conquista da paz que transcende o entendimento comum dos homens.` },
        { title: "👁️ O Dossiê de Alma (Veredito)", content: `A conexão entre os planos sofreu oscilações no momento do seu batismo, mas sua essência foi capturada. Esta é a síntese definitiva das forças que regem sua existência. São linhas de um diagnóstico cirúrgico, sem filtros ou ilusões de ego. Uma leitura profunda sobre as sombras que você ignora e a luz que você tem medo de brilhar. Este veredito revela o que exatamente está bloqueando o seu ápice financeiro, amoroso e espiritual, oferecendo o exato próximo passo que você deve dar para sair do labirinto e assumir o trono de sua própria história de vida.` }
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
// Salva os dados astrológicos no state para o chat usar
if (data.astroData) {
    state.user.sol = data.astroData.sol;
    state.user.lua = data.astroData.lua;
    state.user.ascendente = data.astroData.ascendente;
    state.user.destino = data.astroData.destino;
    state.user.expressao = data.astroData.expressao;
    state.user.missao = data.astroData.missao;
}
saveState();
    } catch (error) {
        console.warn("[uGuru] Conexão instável. Usando Arquétipo Zero...");
        state.cardsData = obterArquetipoZero();
        saveState();
    }

    renderCards();
    if (btnChat) btnChat.classList.remove('hidden');
}

// ==========================================
// RENDER CARDS — INJECÇÃO DO CARD MAJESTOSO
// ==========================================

function renderCards() {
    const container = document.getElementById('cards-container');
    if (!state.cardsData || state.cardsData.length === 0) return;

    // Atualiza conteúdo do card 7 conforme o tier
    const card7 = state.cardsData[6];
    if (state.tier === 1) {
        card7.title = "👁️ O Dossiê de Alma (Veredito)";
    } else if (state.tier === 2) {
        card7.title = "👁️ Os Trânsitos Kármicos (Grau 2)";
        card7.content = "Sua ascensão permitiu decifrar os próximos ciclos. As constelações se movem e revelam que os próximos 6 meses exigirão de você uma reestruturação profunda. O universo cobrará as dívidas pendentes, mas também abrirá as portas para colheitas inesperadas. Esteja preparado para o fluxo.";
    } else if (state.tier === 3) {
        card7.title = "👁️ A Sombra Oculta (Grau 3)";
        card7.content = "No terceiro grau, os véus caem completamente. A sua maior autossabotagem não é o que você pensa, mas o que você esconde de si mesmo no silêncio da noite. Este é o ciclo da cura profunda.";
    } else if (state.tier > 3) {
        card7.title = `👁️ O Oráculo Supremo (Grau ${state.tier})`;
        card7.content = "Você atingiu esferas de alta densidade kármica. O conhecimento agora flui não através das estrelas, mas através da sua própria intuição blindada. Você e a engrenagem do destino agora são um só.";
    }

    // Renderiza cards 1–6
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `<div class="card"><h3>${state.cardsData[i].title}</h3><p>${state.cardsData[i].content}</p></div>`;
    }

    // Card 7: Tratamento de Luxo e Majestade
    let contentCard7 = '';
    let classeCard7 = state.tier === 0 ? 'locked' : 'unlocked-majestoso';

    if (state.tier > 0) {
        contentCard7 = `
            <div style="font-size: 0.75rem; color: var(--gold-bright); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; opacity: 0.9;">Honraria Kármica</div>
            <p>${card7.content}</p>
            <button class="btn-primary btn-dossie-baixar" onclick="gerarDossieLuxo()">📥 Baixar Dossiê Autêntico</button>
        `;
    } else {
        contentCard7 = `
            <p class="card7-locked-text">O Dossiê Final está bloqueado.
            Aguardando a Oferenda de Passagem para desvelar as 25 linhas do seu destino oculto...</p>
        `;
    }

    html += `
        <div id="card-7" class="card card-7 ${classeCard7}">
            <h3>${card7.title}</h3>
            ${contentCard7}
        </div>
    `;
    container.innerHTML = html;
}

// ==========================================
// TOGGLE DOSSIÊ (botão olho)
// ==========================================

function toggleDossie() {
    const bWrapper = document.getElementById('banquete-wrapper');
    if (bWrapper.classList.contains('hidden')) {
        showBanquete();
    } else {
        if (typeof irParaChat === "function") irParaChat();
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function hideAll() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('confirmation-modal').classList.add('hidden');
    document.getElementById('banquete-wrapper').classList.add('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('input-bar').classList.add('hidden');
    document.getElementById('sync-bar-container').classList.add('hidden');
    document.getElementById('dossie-eye').classList.add('hidden');
}

function recomecarBatismo() {
    showCustomAlert(
        "Apagar os Registos?",
        "Isto destruirá o seu dossiê actual e fará as estrelas esquecerem TODO o seu progresso. Tem certeza absoluta?",
        true,
        () => {
            localStorage.removeItem('uguru_state');
            location.reload();
        }
    );
}

function showCustomAlert(title, message, isConfirm = false, onConfirm = null) {
    const modal = document.getElementById('custom-alert');
    const titleEl = document.getElementById('alert-title');
    const messageEl = document.getElementById('alert-message');
    const buttonArea = document.getElementById('alert-buttons');

    if (!modal) return;

    titleEl.innerText = title;
    messageEl.innerText = message;
    buttonArea.innerHTML = '';

    if (isConfirm) {
        buttonArea.innerHTML = `
            <button class="btn-secondary" onclick="closeAlert()">Recuar</button>
            <button class="btn-primary" id="confirm-ok">Prosseguir</button>
        `;
        document.getElementById('confirm-ok').onclick = () => {
            if (onConfirm) onConfirm();
            closeAlert();
        };
    } else {
        buttonArea.innerHTML = `<button class="btn-primary" onclick="closeAlert()">Entendido</button>`;
    }
    modal.classList.remove('hidden');
}

function closeAlert() {
    const modal = document.getElementById('custom-alert');
    if (modal) modal.classList.add('hidden');
}

function updateUI() {
    const paywallPopup = document.getElementById('paywall-popup');
    const limitMessage = document.getElementById('limit-message');
    const inputBar = document.getElementById('input-bar');
    const syncBarContainer = document.getElementById('sync-bar-container');
    const barFill = document.getElementById('sync-bar-fill');

    // GUARD: esconde sync-bar em qualquer tela que não seja o chat
    if (syncBarContainer) syncBarContainer.classList.add('hidden');

    // 1. Controle de Limites — só aplica se estiver no chat
    const limiteTier0 = 5;
    const limiteTier1 = 21;

    if (state.step !== 'chat') {
        if (inputBar) inputBar.classList.add('hidden');
        if (paywallPopup) paywallPopup.classList.add('hidden');
        return;
    }

    // A partir daqui: só executa dentro do chat
    if (state.tier === 0 && state.messageCount >= limiteTier0) {
        if (inputBar) inputBar.classList.add('hidden');
        if (paywallPopup) paywallPopup.classList.remove('hidden');
    } else if (state.tier === 1 && state.messageCount >= limiteTier1) {
        if (inputBar) inputBar.classList.add('hidden');
        if (limitMessage) limitMessage.classList.remove('hidden');
    } else {
        if (inputBar) inputBar.classList.remove('hidden');
        if (paywallPopup) paywallPopup.classList.add('hidden');
    }

    // 2. BARRA DE PROGRESSO (só no chat)
    if (syncBarContainer) syncBarContainer.classList.remove('hidden');
    if (barFill) {
        const mensagensGastas = parseInt(state.messageCount) || 0;
        let porcentagem = 0;
        if (state.tier === 0) {
            porcentagem = (mensagensGastas / 5) * 100;
        } else {
            porcentagem = (mensagensGastas / 26) * 100;
        }
        if (porcentagem > 100) porcentagem = 100;
        barFill.style.width = `${porcentagem}%`;
    }
}

// ==========================================
// POPUP E PAYWALL
// ==========================================

function iniciarPagamento() {
    const proximoGrau = state.tier + 1;
    showCustomAlert(
        "Oferenda de Passagem",
        `O ciclo fechou-se. Para desvelar seu novo ciclo do Grau ${proximoGrau} e ganhar mais 21 interacções com o Oráculo, uma nova Oferenda é necessária. (Use /liberar no chat para testar a ascensão).`
    );
    const popup = document.getElementById('paywall-popup');
    if (popup) popup.classList.add('hidden');
}

window.fecharPopUpDourado = function () {
    const paywall = document.getElementById('paywall-popup');
    if (paywall) paywall.classList.add('hidden');
};

window.irParaVeredito = function () {
    fecharPopUpDourado();
    showBanquete();
};

// ==========================================
// GERAÇÃO DO DOSSIÊ DIGITAL (MODAL BOTTOM SHEET)
// ==========================================

window.gerarDossieLuxo = function () {
    const modal = document.getElementById('dossie-modal');
    const contentDiv = document.getElementById('dossie-content');

    let sealText = "AUTÊNTICO";
    let sealColor = "var(--gold)";
    if (state.tier === 2) {
        sealText = "MESTRE";
        sealColor = "#b0c4de";
    } else if (state.tier >= 3) {
        sealText = "GRAU 33";
        sealColor = "#e0115f";
    }

    let dossieContent = `
        <div style="text-align: center; margin-bottom: 30px; margin-top: 15px;">
            <h2 style="font-family: 'Playfair Display', serif; color: var(--gold); font-size: 26px; margin-bottom: 5px;">Dossiê de Essência</h2>
            <p style="font-size: 13px; color: #f6edd6; opacity: 0.6; letter-spacing: 2px; text-transform: uppercase;">${state.user.name}</p>
            <div style="width: 50px; height: 1px; background: var(--gold); margin: 20px auto;"></div>
        </div>
    `;

// INJEÇÃO GADÚ: Matriz de Expansão Algorítmica
    const matrizExpansao = [
        { luz: "As constelações favorecem um magnetismo silencioso. O que você buscar agora, virá com facilidade.", sombra: "Cuidado com o ego inflamado. A precipitação e a arrogância podem queimar as pontes certas.", ritual: "Tome um copo de água mentalizando a sua meta financeira antes de dormir." },
        { luz: "Sua intuição está afiada como uma lâmina de prata. Confie nas mensagens dos seus sonhos.", sombra: "O medo da rejeição pode paralisar suas decisões. Não ceda às ilusões do passado.", ritual: "Escreva o nome da sua maior trava num papel e queime-o para liberar o karma." },
        { luz: "Um ciclo de prosperidade bruta se abre. Há uma energia de construção e colheita ao seu redor.", sombra: "A avareza emocional o deixará isolado. Não negue afeto a quem lhe estende a mão.", ritual: "Doe uma moeda ou um item antigo nas próximas 24h para abrir espaço no destino." }
    ];

    state.cardsData.forEach((card, index) => {
        // Usa o índice do card para cruzar com a matriz, gerando um dossiê único e robusto
        const exp = matrizExpansao[index % matrizExpansao.length];
        
        dossieContent += `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(230, 192, 104, 0.2); padding: 22px; margin-bottom: 18px; border-radius: 20px;">
                <h3 style="color: var(--gold-bright); font-family: 'Playfair Display', serif; margin-bottom: 12px; font-size: 1.15rem; text-align: left;">${card.title}</h3>
                <p style="text-align: left; line-height: 1.6; font-size: 0.95rem; color: #f6edd6; opacity: 0.9; margin-bottom: 18px;">${card.content}</p>
                
                <div style="background: rgba(255, 241, 194, 0.03); border-left: 2px solid var(--gold-bright); padding: 10px 14px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
                    <span style="display:block; font-size: 0.75rem; color: var(--gold-bright); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">✨ Camada de Luz</span>
                    <p style="font-size: 0.85rem; color: rgba(246, 237, 214, 0.85); line-height: 1.4; text-align: left;">${exp.luz}</p>
                </div>
                
                <div style="background: rgba(224, 17, 95, 0.05); border-left: 2px solid #e0115f; padding: 10px 14px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
                    <span style="display:block; font-size: 0.75rem; color: #e0115f; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">🌑 Camada de Sombra</span>
                    <p style="font-size: 0.85rem; color: rgba(246, 237, 214, 0.85); line-height: 1.4; text-align: left;">${exp.sombra}</p>
                </div>
                
                <div style="background: rgba(176, 196, 222, 0.05); border-left: 2px solid #b0c4de; padding: 10px 14px; border-radius: 0 8px 8px 0;">
                    <span style="display:block; font-size: 0.75rem; color: #b0c4de; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">🗝️ Ação Prática</span>
                    <p style="font-size: 0.85rem; color: rgba(246, 237, 214, 0.85); line-height: 1.4; text-align: left;">${exp.ritual}</p>
                </div>
            </div>
        `;
    });

    dossieContent += `
        <div style="margin-top: 40px; text-align: center; padding-bottom: 20px;">
            <div style="font-family: 'Playfair Display', serif; font-size: 28px; color: var(--gold); margin-bottom: 8px;">üGuru👁️</div>
            <div style="font-size: 11px; opacity: 0.5; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 3px;">Sabedoria Selada</div>
            <div style="display: inline-block; padding: 8px 16px; border: 1px solid ${sealColor}; color: ${sealColor}; border-radius: 4px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
                SELO: ${sealText}
            </div>
        </div>
    `;

        contentDiv.innerHTML = dossieContent;
    modal.classList.remove('hidden');
    // GADÚ FIX: Aguarda o display renderizar para ativar a subida da camada suavemente
    setTimeout(() => modal.classList.add('show'), 10);
    // Previne rolagem do body quando o modal está aberto
    document.body.style.overflow = 'hidden'; 
};

window.fecharModalDossie = function () {
    const modal = document.getElementById('dossie-modal');
    modal.style.transform = ''; // GADÚ FIX: Reseta a "escova" do dedo para evitar travamentos
    modal.classList.remove('show'); // GADÚ FIX: Desce a camada
    
    // GADÚ FIX: Aguarda a animação de saída (400ms) terminar antes de aplicar o display: none
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 400);
    
    // Restaura rolagem do body
    document.body.style.overflow = '';
};


// COMPORTAMENTO SWIPE DOWN (Gadú Injection)
(function initSwipeDown() {
    const modalDossie = document.getElementById('dossie-modal');
    if (modalDossie) {
        let touchStartY = 0;
        let touchCurrentY = 0;
        let isDragging = false;
        let dossieContent = null;

        modalDossie.addEventListener('touchstart', (e) => {
            if (e.target.closest('#dossie-content')) {
                touchStartY = e.touches[0].clientY;
                dossieContent = document.getElementById('dossie-content');
                // Se o conteúdo já está scrollado para baixo, não iniciamos o drag da folha toda
                if (dossieContent && dossieContent.scrollTop > 0) {
                    isDragging = false;
                } else {
                    isDragging = true;
                }
            } else {
                // Clique/toque fora do conteúdo central pode fechar o modal
                touchStartY = e.touches[0].clientY;
                isDragging = true;
            }
        }, { passive: true });

        modalDossie.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            dossieContent = document.getElementById('dossie-content');
            touchCurrentY = e.touches[0].clientY;
            let deltaY = touchCurrentY - touchStartY;
            
            // LÓGICA DE CHAINING: Se o conteúdo interno está no topo absoluto e o dedo puxa para baixo
            if (dossieContent && dossieContent.scrollTop <= 0 && deltaY > 0) {
                isDragging = true;
                modalDossie.style.transition = 'none'; // Retira a transição para colar ao dedo
                modalDossie.style.transform = `translateY(${deltaY}px)`;
             
                // Evita que o fundo do ecrã faça scroll ao mesmo tempo
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
    
        }, { passive: false }); // Falso para permitir o preventDefault()

        modalDossie.addEventListener('touchend', (e) => {
            if (isDragging) {
                let deltaY = touchCurrentY - touchStartY;
                modalDossie.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                
                // Se arrastou mais de 100px, compreende a intenção de fechar
                if (deltaY > 100) {
                    fecharModalDossie();
                } else {
                    // Desistiu, o modal regressa ao topo
                    modalDossie.style.transform = 'translateY(0)';
                    setTimeout(() => { modalDossie.style.transform = ''; }, 400);
                }
                isDragging = false;
            }
            
            touchStartY = 0;
            touchCurrentY = 0;
        });
    }
})();

// ==========================================
// üGURU — GESTÃO DE PRIVACIDADE & CONTRATOS
// ==========================================

window.abrirModalTermos = function() {
    // Caso o modal já exista, evita duplicar
    if (document.getElementById('modal-termos')) return;

    const modalHtml = `
        <div id="modal-termos" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5, 8, 20, 0.98); z-index:20000; display:flex; justify-content:center; align-items:center; padding:20px; backdrop-filter: blur(10px);">
            <div style="background:#0b1026; border:1px solid #e6c068; padding:30px; border-radius:15px; max-width:500px; width:100%; max-height:80vh; overflow-y:auto; position:relative; box-shadow: 0 0 40px rgba(0,0,0,0.8);">
                <h2 style="font-family:'Playfair Display', serif; color:#e6c068; text-align:center; margin-top:0; font-size:22px; letter-spacing:1px;">CONTRATO DE INICIAÇÃO</h2>
                <div style="font-family:'Inter', sans-serif; color:#f6edd6; line-height:1.6; font-size:13px; margin-top:20px; opacity:0.9;">
                    <p>Ao adentrar este espaço, você concorda com os termos inegociáveis do nosso pacto:</p>
                    <p><strong>1. A Ilusão do Controle:</strong> O üGuru não prevê o futuro estático, ele lê tendências. As ações e decisões após a leitura são de responsabilidade exclusiva do Iniciado.</p>
                    <p><strong>2. O Tratamento de Sombras (Dados Sensíveis e LGPD):</strong> Para alinhar os astros, coletamos dados de nascimento. Sob a LGPD, estes são dados sensíveis. Ao prosseguir, você concede consentimento livre e informado para que estes dados sejam processados exclusivamente para a sua experiênca.</p>
                    <p><strong>3. O Cofre de Cronos (Armazenamento Local):</strong> Suas conversas e dados residem no <em>localStorage</em> do seu navegador. Nós não mantemos um banco de dados centralizado com sua identidade. Você é o guardião da sua própria chave.</p>
                    <p><strong>4. Fronteiras Internacionais:</strong> Para processar a sabedoria em alta velocidade, seus dados são transmitidos de forma anônima para servidores de IA localizados fora do território nacional (EUA/Groq).</p>
                    <p><strong>5. O Direito ao Esquecimento:</strong> A qualquer momento, você pode invocar o <strong>"Novo Batismo"</strong>. Esta ação apaga instantaneamente todos os registros no seu dispositivo.</p>
                    <p><strong>6. Elegibilidade:</strong> Este salão é estritamente reservado para maiores de 18 anos.</p>
                </div>
                <button onclick="document.getElementById('modal-termos').remove()" style="display:block; width:100%; margin-top:25px; background:transparent; border:1px solid #e6c068; color:#e6c068; padding:12px; font-family:'Playfair Display', serif; cursor:pointer; text-transform:uppercase; letter-spacing:2px; transition: 0.3s;"
                onmouseover="this.style.background='#e6c068'; this.style.color='#0b1026'" onmouseout="this.style.background='transparent'; this.style.color='#e6c068'">
                    Selar Pacto
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ==========================================
// PONTE DE REATIVIDADE GADÚ - NÃO TOQUE NAS FUNÇÕES ACIMA
// ==========================================
window.uGuru = window.uGuru || {};

window.uGuru.core = {
    // O 'get' faz com que toda vez que o chat pedir o state, 
    // ele pegue a versão VIVA e ATUAL do core.
    get state() { return state; }, 
    saveState: saveState,
    hideAll: hideAll,
    showCustomAlert: typeof showCustomAlert === "function" ? showCustomAlert : function(){},
    iniciarPagamento: typeof iniciarPagamento === "function" ? iniciarPagamento : function(){},
    // 'get' reativo: garante que sempre chama a função viva, nunca uma cópia estática
    get updateUI() { return typeof updateUI === "function" ? updateUI : function(){}; }
};