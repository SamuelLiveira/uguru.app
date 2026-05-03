// ==========================================
// üGURU — FLUXO PRINCIPAL
// ==========================================

// ONBOARDING
function saveAndProceed() {

    const name =
        document.getElementById('userName').value.trim();

    const date =
        document.getElementById('birthDate').value;

    if (!name || !date) {

        alert(
            'Mon Cher, os astros precisam do seu nome e data de nascimento.'
        );

        return;
    }

    const userData = {

        name: name,

        birthDate: date,

        location:
            document.getElementById('birthLocation').value,

        time:
            document.getElementById('birthTime').value,

        lifePath:
            calculateLifePath(date),

        chatCount: 0
    };

    // SALVAR
    localStorage.setItem(
        'guru_user',
        JSON.stringify(userData)
    );

    // RENDER
    renderNumerology(userData);
}

// ==========================================
// NUMEROLOGIA
// ==========================================

function calculateLifePath(dateString) {

    let digits =
        dateString.replace(/\D/g, '');

    let sum =
        digits
        .split('')
        .reduce((a, b) =>
            parseInt(a) + parseInt(b), 0);

    while (
        sum > 9 &&
        sum !== 11 &&
        sum !== 22
    ) {

        sum =
            sum
            .toString()
            .split('')
            .reduce((a, b) =>
                parseInt(a) + parseInt(b), 0);
    }

    return sum;
}

// ==========================================
// PREVIEW
// ==========================================

function renderNumerology(user) {

    document
        .getElementById('onboarding')
        .classList.add('hidden');

    document
        .getElementById('result-preview')
        .classList.remove('hidden');

    document
        .getElementById('welcome-user')
        .innerText =
            `Olá, ${user.name}`;

    document
        .getElementById('life-path-number')
        .innerText =
            `Seu Número de Destino é ${user.lifePath}`;
}

// ==========================================
// CHAT
// ==========================================

function goToChat() {

    document
        .getElementById('result-preview')
        .classList.add('hidden');

    document
        .getElementById('chat-container')
        .classList.remove('hidden');

    document
        .getElementById('input-bar')
        .classList.remove('hidden');

    addMessage(
        'Saudações. Eu sou o seu Oráculo Digital. O que os astros sussurram para você hoje?',
        'guru-msg'
    );
}

// ==========================================
// ADICIONAR MENSAGEM
// ==========================================

function addMessage(text, type) {

    const container =
        document.getElementById('chat-container');

    const msgDiv =
        document.createElement('div');

    msgDiv.className =
        `message ${type}`;

    msgDiv.innerText = text;

    container.appendChild(msgDiv);

    container.scrollTop =
        container.scrollHeight;
}

// ==========================================
// ENVIO DE MENSAGEM
// ==========================================

async function sendMessage() {

    const input =
        document.getElementById('user-input');

    const button =
        document.getElementById('send-btn');

    const text =
        input.value.trim();

    const user =
        JSON.parse(
            localStorage.getItem('guru_user')
        );

    if (!text) return;

    // USER MSG
    addMessage(text, 'user-msg');

    input.value = '';

    // BLOQUEAR BOTÃO
    button.disabled = true;

    try {

        const response = await fetch(
            'https://guru-project-eta.vercel.app/api/chat',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    message: text,
                    userData: user
                })
            }
        );

        const data = await response.json();

        console.log('Resposta:', data);

        // RESPOSTA
        if (data.reply) {

            addMessage(
                data.reply,
                'guru-msg'
            );

        } else if (data.error) {

            addMessage(
                `Erro no Oráculo: ${data.error}`,
                'guru-msg'
            );

            console.error(data);

        } else {

            addMessage(
                'O Oráculo entrou em silêncio...',
                'guru-msg'
            );
        }

    } catch (error) {

        console.error(error);

        addMessage(
            'Interferência astral. Não consegui conectar ao servidor.',
            'guru-msg'
        );

    } finally {

        // LIBERAR BOTÃO
        button.disabled = false;
    }
}

// ==========================================
// ENTER PARA ENVIAR
// ==========================================

document
    .addEventListener('DOMContentLoaded', () => {

        const input =
            document.getElementById('user-input');

        input.addEventListener(
            'keypress',
            function (e) {

                if (e.key === 'Enter') {

                    sendMessage();
                }
            }
        );
    });