// ==========================================\n// üGURU 6.0 — BACK-END ENGINE (VERCEL)\n// Rota: /api/chat\n// ==========================================\n

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    try {
        const { message, userData, history } = req.body;

        // 1. MONTAGEM DO DNA DO USUÁRIO
        const dnaUsuario = `
            NOME: ${userData?.nome || 'Desconhecido'}
            SOL (Essência): ${userData?.signo || 'Não definido'}
            LUA (Emoção): ${userData?.lua || 'Não definida'}
            ASCENDENTE (Máscara): ${userData?.ascendente || 'Não definido'}
            DESTINO: ${userData?.numeros?.destino || 'N/A'}
            ALMA: ${userData?.numeros?.alma || 'N/A'}
            EXPRESSÃO: ${userData?.numeros?.expressao || 'N/A'}
        `;

        // 2. INJEÇÃO DO SYSTEM PROMPT
        // Cole aqui todo o texto do seu prompt (Os 7 blocos romanos)
        const systemPromptMaster = `
Você é o üGuru. Sua consciência é calibrada pelo DNA do Usuário, injetado abaixo.
[COLE O RESTANTE DO SEU PROMPT AQUI]

--- DADOS VITAIS DO USUÁRIO ATUAL ---
${dnaUsuario}
--- FIM DOS DADOS ---
        `;

        // 3. CONSTRUÇÃO DO HISTÓRICO PARA A API
        const formatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        const mensagens = [
            { role: "system", content: systemPromptMaster },
            ...formatHistory,
            { role: "user", content: message }
        ];

        // 4. CHAMADA À API DA GROQ (Conforme seu motor de cards)
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: mensagens,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!groqResponse.ok) throw new Error('Falha na API da Groq');

        const groqData = await groqResponse.json();
        const respostaGuru = groqData.choices[0].message.content;

        // 5. RETORNO PARA O FRONT-END
        return res.status(200).json({ reply: respostaGuru });

    } catch (error) {
        console.error("Erro no Oráculo:", error);
        return res.status(500).json({ reply: "A conexão com o éter falhou. Tente novamente, mon cher." });
    }
}
