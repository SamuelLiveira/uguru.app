// ==========================================
// üGURU — GERADOR DE DOSSIÊ (OPENCAGE + ASTROLOGY API + GROQ)
// [GEOCODING DINÂMICO: QUALQUER CIDADE DO BRASIL]
// ==========================================

function reduzirNumerologia(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
        num = String(num).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return num;
}

function calcularNumerologia(nome, dataStr) {
    const pitagoras = {
        a:1, b:2, c:3, d:4, e:5, f:6, g:7, h:8, i:9,
        j:1, k:2, l:3, m:4, n:5, o:6, p:7, q:8, r:9,
        s:1, t:2, u:3, v:4, w:5, x:6, y:7, z:8
    };

    const digitosData = dataStr.replace(/\D/g, '');
    let somaData = 0;
    for(let char of digitosData) somaData += parseInt(char);
    const destino = reduzirNumerologia(somaData);

    const nomeLimpo = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    let somaNome = 0;
    for(let char of nomeLimpo) somaNome += pitagoras[char] || 0;
    const expressao = reduzirNumerologia(somaNome);

    const missao = reduzirNumerologia(destino + expressao);

    return { destino, expressao, missao };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });

    const { userData } = req.body;

    try {
        // --- 1. CÁLCULO NUMEROLÓGICO ---
        const numeros = calcularNumerologia(userData.name, userData.date);

        // --- 2. GEOCODING: cidade + estado → lat, lon, fuso ---
        const cidadeQuery = `${userData.city}, ${userData.state}, Brasil`;
        const geoResponse = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cidadeQuery)}&key=${process.env.OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`
        );

        let lat = -15.78;
        let lon = -47.93;
        let tzone = -3;

        if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            if (geoData.results && geoData.results.length > 0) {
                const resultado = geoData.results[0];
                lat = resultado.geometry.lat;
                lon = resultado.geometry.lng;
                // OpenCage retorna o offset do fuso em segundos
                const offsetSegundos = resultado.annotations?.timezone?.offset_sec || -10800;
                tzone = offsetSegundos / 3600;
            }
        }

        // --- 3. ASTROLOGY API: mapa astral com coordenadas reais ---
        const [ano, mes, dia] = userData.date.split('-');
        const [hora, min] = userData.time.split(':');

        const authString = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        const astroPayload = {
            day: parseInt(dia),
            month: parseInt(mes),
            year: parseInt(ano),
            hour: parseInt(hora),
            min: parseInt(min),
            lat: lat,
            lon: lon,
            tzone: tzone
        };

        const astroResponse = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(astroPayload)
        });

        let sol = "Desconhecido";
        let lua = "Desconhecida";
        let asc = "Desconhecido";
        let astrologia = "Aguardando alinhamento estelar.";

        if (astroResponse.ok) {
            const astroData = await astroResponse.json();
            sol = astroData.find(p => p.name === "Sun")?.sign || "Desconhecido";
            lua = astroData.find(p => p.name === "Moon")?.sign || "Desconhecida";
            asc = astroData.find(p => p.name === "Ascendant")?.sign || "Desconhecido";
            astrologia = `Sol em ${sol}, Lua em ${lua}, Ascendente em ${asc}.`;
        }

        // --- 4. GROQ: geração dos cards ---
        const promptGerador = `
Você é o üGuru, um Oráculo de Luxo, dândi digital e profundo.
Sua missão é redigir 7 cards para o usuário ${userData.name}, nascido em ${userData.city}.

AQUI ESTÃO OS DADOS MATEMÁTICOS EXATOS DELE (NÃO INVENTE, USE ESTES):
Astrologia: ${astrologia}
Numerologia Pitagórica: Destino ${numeros.destino}, Expressão ${numeros.expressao}, Missão ${numeros.missao}.

REGRAS RÍGIDAS DE REDAÇÃO E TAMANHO:
- Tom aristocrático, esotérico, implacável.
- Cards 1 a 3 (Astrologia): Fale do Sol, Lua e Ascendente listados acima. Devem ter cerca de 10 linhas de texto contínuo.
- Cards 4 a 6 (Numerologia): Fale EXATAMENTE dos números de Destino, Expressão e Missão passados acima. Cerca de 10 linhas.
- Card 7 (Dossiê de Alma): O Veredito final conectando os astros e os números. Texto longo, denso e revelador, com cerca de 25 linhas.

Formato OBRIGATÓRIO de saída (Estritamente JSON, sem blocos de código):
{
  "cards": [
    { "title": "🌟 O Sol em sua Essência", "content": "texto aqui..." },
    { "title": "🌙 Refúgio Lunar", "content": "texto aqui..." },
    { "title": "🔥 Ascendente Estelar", "content": "texto aqui..." },
    { "title": "💎 A Vibração do Nome (Expressão)", "content": "texto sobre o número ${numeros.expressao}..." },
    { "title": "🗝️ A Frequência do Destino", "content": "texto sobre o número ${numeros.destino}..." },
    { "title": "🌀 O Nó Kármico (Missão)", "content": "texto sobre o número ${numeros.missao}..." },
    { "title": "👁️ O Dossiê de Alma (Veredito)", "content": "texto denso de 25 linhas aqui..." }
  ]
}`;

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: promptGerador }],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        const groqData = await groqResponse.json();
        const jsonResult = JSON.parse(groqData.choices[0].message.content);

        // 5. RETORNO: cards + dados astrológicos para o frontend salvar no state
        res.status(200).json({
            cards: jsonResult.cards,
            astroData: {
                sol: sol,
                lua: lua,
                ascendente: asc,
                destino: numeros.destino,
                expressao: numeros.expressao,
                missao: numeros.missao
            }
        });

    } catch (error) {
        console.error("[uGuru_Debug] Erro ao gerar cards:", error);
        res.status(500).json({ error: "Falha na alquimia do sistema." });
    }
}
