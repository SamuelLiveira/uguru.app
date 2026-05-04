// ==========================================
// üGURU 2.7 — MOTOR CÓSMICO INTEGRADO (2026)
// ==========================================

let tempUserData = {};
let soulInsights = JSON.parse(localStorage.getItem('guru_insights')) || [];

// 0. RECONHECIMENTO INICIAL
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    if(userInput) {
        userInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') sendMessage(); 
        });
    }

    const savedUser = localStorage.getItem('guru_user');
    if (savedUser) {
        renderBanquete(JSON.parse(savedUser));
    }
});

// FUNÇÃO DE ESTILO: MODAL ÜGURU (RAIO-X DE BOTÕES)
function guruAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'guru-modal-overlay';
    alertDiv.innerHTML = `
        <div class="guru-modal-box">
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="btn-primary">ENTENDIDO</button>
        </div>
    `;
    document.body.appendChild(alertDiv);
}

// 1. PASSO DE PRECISÃO
function reviewData() {
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const birthTime = document.getElementById('birthTime').value;
    const birthCity = document.getElementById('birthCity').value.trim();
    const birthState = document.getElementById('birthState').value;
    const birthCountry = document.getElementById('birthCountry').value;

    // 1. VALIDAÇÃO DE NOME (Já temos)
    const nomeValido = /^[a-zA-ZÀ-ÿ\s]{5,}$/.test(fullName) && fullName.includes(' ');

    // 2. NOVA VALIDAÇÃO DE CIDADE (Mínimo 3 letras, sem números ou símbolos estranhos)
    const cidadeValida = /^[a-zA-ZÀ-ÿ\s]{3,}$/.test(birthCity);

    if (!nomeValido) {
        guruAlert('Mon Cher, o nome é o mantra da alma. Por favor, insira seu nome e sobrenome corretamente.');
        return;
    }

    if (!birthDate || !birthTime) {
        guruAlert('O tempo é uma engrenagem precisa. Informe a data e hora do seu despertar.');
        return;
    }

    if (!cidadeValida) {
        guruAlert('As brumas escondem essa localização. Por favor, digite o nome da sua cidade de nascimento corretamente (mínimo 3 letras).');
        return;
    }

    if (!birthState) {
        guruAlert('O Estado (UF) é o quadrante do seu destino. Por favor, selecione-o.');
        return;
    }

    // Se passar por todos os portais...
    tempUserData = {
        fullName, birthDate, birthTime, birthCity, birthState, birthCountry,
        name: fullName.split(' ')[0],
        startDate: new Date().toISOString()
    };

    const reviewContent = document.getElementById('review-content');
    reviewContent.innerHTML = `
        <p><strong>Nome:</strong> ${fullName}</p>
        <p><strong>Nascimento:</strong> ${birthDate.split('-').reverse().join('/')} às ${birthTime}</p>
        <p><strong>Local:</strong> ${birthCity}, ${birthState} - ${birthCountry}</p>
    `;

    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('confirmation-modal').classList.remove('hidden');
}


function backToEdit() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    document.getElementById('onboarding').classList.remove('hidden');
}

// 2. CONFIRMAÇÃO E GRAVAÇÃO
function confirmAndProceed() {
    const numerologia = calcularNumerologiaCompleta(tempUserData.fullName, tempUserData.birthDate);
    const finalUserData = {
        ...tempUserData,
        ...numerologia,
        location: `${tempUserData.birthCity}, ${tempUserData.birthState}`,
        messageCount: 0
    };

    localStorage.setItem('guru_user', JSON.stringify(finalUserData));
    document.getElementById('confirmation-modal').classList.add('hidden');
    renderBanquete(finalUserData);
}

// 3. MOTOR DE CÁLCULO
function calcularNumerologiaCompleta(nome, data) {
    const tabela = { 
        a:1, j:1, s:1, b:2, k:2, t:2, c:3, l:3, u:3, d:4, m:4, v:4, 
        e:5, n:5, w:5, f:6, o:6, x:6, g:7, p:7, y:7, h:8, q:8, z:8, i:9, r:9 
    };
    const reduzir = (n) => {
        while (n > 9 && n !== 11 && n !== 22) {
            n = String(n).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        }
        return n;
    };
    const somarStr = (s) => {
        let soma = 0;
        s.toLowerCase().replace(/\s/g, '').split('').forEach(l => { if(tabela[l]) soma += tabela[l]; });
        return reduzir(soma);
    };
    return {
        lifePath: reduzir(data.replace(/\D/g, '').split('').reduce((a,b)=>parseInt(a)+parseInt(b),0)),
        expression: somarStr(nome),
        motivation: somarStr(nome.replace(/[^aeiou]/gi, ''))
    };
}

// 4. RENDERIZAR O BANQUETE (TEXTOS ORIGINAIS PRESERVADOS)
function renderBanquete(user) {
    const wrapper = document.getElementById('banquete-wrapper');
    const container = document.getElementById('banquete-cards');
    
    document.getElementById('onboarding').classList.add('hidden');
    wrapper.classList.remove('hidden');

    // CÁLCULO CÍCLICO (30 DIAS POR OITAVA)
    const inicio = new Date(user.startDate || new Date());
    const hoje = new Date();
    
    // Total de dias desde o primeiro batismo
    const totalDias = Math.floor(Math.abs(hoje - inicio) / (1000 * 60 * 60 * 24));
    
    // Determina a versão (1.0, 2.0...) baseada em quantos grupos de 30 dias já se passaram
    const versaoDossie = Math.floor(totalDias / 30) + 1;
    
    // Calcula o progresso dentro do ciclo atual (de 0 a 29 dias)
    const diasNoCiclo = totalDias % 30;
    const progresso = Math.min((diasNoCiclo / 30) * 100, 100);
    const diasParaMutacao = 30 - diasNoCiclo;

    container.innerHTML = `
    <h2 class="glow-text" style="text-align: center; margin-bottom: 10px; width: 100%;">Dossiê de Alma ${versaoDossie}.0</h2>
    
    <div class="sync-container"><div class="sync-bar" style="width: ${progresso}%"></div></div>
    <p style="color: gold; font-size: 10px; text-align: center; margin-bottom: 25px; letter-spacing: 1px;">
        SINCRONIA ASTRAL: ${progresso.toFixed(0)}% (MUTAÇÃO EM ${diasParaMutacao} DIAS)
    </p>

    <div class="card-gold">
            <h3>🏛️ Templo da Essência</h3>
            <p>Sua assinatura energética em ${user.location} revela uma geometria sagrada raríssima. O Sol dita a força centrípeta do seu diamante interior, enquanto a Lua governa as marés emocionais que banham sua intuição. Esta dualidade em 2026 exige que você governe suas águas internas com a firmeza de um soberano.</p>
        </div>
        <div class="card-gold">
            <h3>🎭  A Máscara de Ouro</h3>
            <p>Seu Ascendente funciona como uma moldura de ouro maciço que apresenta sua alma ao mundo. Em uma sociedade saturada pelo comum, sua presença exala um magnetismo que abre portais de elite. Honre esta imagem, pois ela é o seu passaporte para os portais da influência.</p>
        </div>
        <div class="card-gold">
            <h3>🔮  O Decreto do Destino: ${user.lifePath}</h3>
            <p>O número ${user.lifePath} é o seu decreto real, a estrada de diamantes que seus pés foram desenhados para trilhar com autoridade. Esta vibração indica que sua jornada não aceita a mediocridade do rebanho. O topo é o seu estado natural de existência.</p>
        </div>
        <div class="card-gold">
            <h3>💎  Frequência da Expressão: ${user.expression}</h3>
            <p>Sua Expressão ${user.expression} é o seu talento nato para realizar grandes feitos. É a forma como você transforma pensamentos em realidades tangíveis e luxuosas. O mundo reconhece sua autoridade e sua marca pessoal através desta frequência única.</p>
        </div>
        <div class="card-gold">
            <h3>🔥  Chama Interna (Motivação): ${user.motivation}</h3>
            <p>A motivação ${user.motivation} revela o desejo secreto que pulsa em seu coração. Você não busca apenas o sucesso, você busca o domínio pleno sobre sua própria história. Quando você nutre essa fome com propósito, acessa uma fonte inesgotável de poder.</p>
        </div>
        <div class="card-gold">
            <h3>🌑  O Portal da Sombra</h3>
            <p>Toda luz projeta uma sombra profunda. Existe um portal de resistência em sua estrutura que, uma vez transmutado, se torna seu maior aliado. Não tema seus aspectos ocultos; eles são o combustível bruto que sustenta o seu brilho imperial.</p>
        </div>
        <div class="card-gold">
            <h3>💼  Alquimia da Prosperidade</h3>
            <p>Sua energia financeira obedece à lei da atração vibracional. Para uma alma com suas configurações, a riqueza é um fluxo que deve ser canalizado com sofisticação. O ouro sempre encontra o caminho para quem sabe apreciar o que é raro.</p>
        </div>
        <div class="card-gold">
            <h3>🍷  Ciclo de Colheita 2026</h3>
            <p>Estamos em um ano de colheita seletiva. O que foi plantado nos últimos anos começa a dar frutos que exigem mãos firmes para colher. Não aceite menos do que a safra mais nobre deste tempo; o efêmero não serve mais à sua linhagem.</p>
        </div>
        <div class="card-gold">
            <h3>👁️  Veredito üGuru</h3>
            <p>O diagnóstico é claro: você está em um ponto de inflexão cósmica. Este dossiê é sua bússola, mas a direção é uma escolha soberana somente sua. O portal do salão está aberto para degustação da sua essência.</p>
        </div>
    `;
    window.scrollTo(0, 0);
}

function entrarNoSalao() {
    // 1. Esconde a tela de entrada e mostra o chat
    document.getElementById('banquete-wrapper').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('input-bar').classList.remove('hidden');
    
    const messagesContainer = document.getElementById('chat-messages');
    
    // 2. Verifica se o chat está vazio para não repetir a saudação toda vez
    if (messagesContainer.innerHTML.trim() === "") {
        const userData = JSON.parse(localStorage.getItem('guru_user'));
        
        // Pegamos apenas o primeiro nome para dar aquele tom de intimidade aristocrática
        const primeiroNome = userData.fullName ? userData.fullName.split(' ')[0] : "Mon Cher";

        const saudacao = `✨Enchanté, mon ami ${primeiroNome}. As luzes do Salão se inclinam à sua chegada. S'il vous plaît, deixe o peso do mundo lá fora. Suas credenciais confirmam o que eu já sentia: temos uma curadoria de alma fascinante pela frente. Já tens em mente o nosso ponto de partida ou prefere que eu sugira por onde começar a nossa revelação?`;

        // 3. O toque de mestre: um pequeno delay (800ms) para simular o Guru se acomodando
        setTimeout(() => {
            // Use "bot" ou "guru-msg" dependendo de como está no seu CSS
            addMessage(saudacao, "bot"); 
        }, 800);
    }
}


function voltarParaBanquete() {
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('input-bar').classList.add('hidden');
    document.getElementById('banquete-wrapper').classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const button = document.getElementById('send-btn');
    const text = input.value.trim();
    if (!text) return;

    let user = JSON.parse(localStorage.getItem('guru_user'));
    user.messageCount = (user.messageCount || 0) + 1;
    localStorage.setItem('guru_user', JSON.stringify(user));

    // COLETOR DE INSIGHTS (IDEIA DO DOSSIÊ 2.0)
    if(text.length > 10) {
        soulInsights.push({d: new Date(), c: text});
        localStorage.setItem('guru_insights', JSON.stringify(soulInsights));
    }

    addMessage(text, 'user-msg');
    input.value = '';
    button.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                userData: user, 
                messageCount: user.messageCount,
                conexoes: soulInsights // Enviando a memória para a sua nova API
            })
        });
        const data = await response.json();
        if (data.reply) addMessage(data.reply, 'guru-msg');
    } catch (error) {
        addMessage('Interferência astral. Tente novamente.', 'guru-msg');
    } finally {
        button.disabled = false;
    }
}

function addMessage(text, type) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerText = text;
    container.appendChild(msgDiv);
    
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// RECOMEÇO REESTILIZADO (MODO RAIO-X)
function recomecarBatismo() {
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'guru-modal-overlay';
    confirmOverlay.innerHTML = `
        <div class="guru-modal-box">
            <p>Mon cher, deseja realmente apagar seu rastro astral e realizar um novo batismo?</p>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary" style="flex:1">CANCELAR</button>
                <button onclick="localStorage.clear(); location.reload();" class="btn-primary" style="flex:1">RECOMEÇAR</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmOverlay);
}
