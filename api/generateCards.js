// ==========================================
// üGURU — GERADOR DE DOSSIÊ (OPENCAGE + ASTROLOGY API + GROQ)
// [GEOCODING DINÂMICO + SINASTRIA COM DADOS OPCIONAIS]
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

// Função reutilizável: geocoding + astrology API
async function calcularAstral(date, time, city, state) {
    let lat = -15.78; // Brasília como fallback
    let lon = -47.93;
    let tzone = -3;
    let cidadeConhecida = false;

    // Geocoding só se tiver cidade
    if (city) {
        const cidadeQuery = state ? `${city}, ${state}, Brasil` : `${city}, Brasil`;
        try {
            const geoResponse = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cidadeQuery)}&key=${process.env.OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`
            );
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                    const resultado = geoData.results[0];
                    lat = resultado.geometry.lat;
                    lon = resultado.geometry.lng;
                    const offsetSegundos = resultado.annotations?.timezone?.offset_sec || -10800;
                    tzone = offsetSegundos / 3600;
                    cidadeConhecida = true;
                }
            }
        } catch(e) {
            console.warn("[uGuru] Geocoding falhou, usando coordenadas centrais.");
        }
    }

    const [ano, mes, dia] = date.split('-');
    const timeParts = (time || '12:00').split(':');
    const hora = timeParts[0];
    const min = timeParts[1] || '00';

    const authString = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

    const astroPayload = {
        day: parseInt(dia), month: parseInt(mes), year: parseInt(ano),
        hour: parseInt(hora), min: parseInt(min),
        lat, lon, tzone
    };

    let sol = "Desconhecido";
    let lua = "Desconhecida";
    let asc = cidadeConhecida ? "Desconhecido" : "Indefinido*";

    try {
        const astroResponse = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${authString}`, "Content-Type": "application/json" },
            body: JSON.stringify(astroPayload)
        });
        if (astroResponse.ok) {
            const astroData = await astroResponse.json();
            sol = astroData.find(p => p.name === "Sun")?.sign || "Desconhecido";
            lua = astroData.find(p => p.name === "Moon")?.sign || "Desconhecida";
            // Ascendente só é confiável se tiver cidade
            if (cidadeConhecida) {
                asc = astroData.find(p => p.name === "Ascendant")?.sign || "Desconhecido";
            }
        }
    } catch(e) {
        console.warn("[uGuru] Astrology API falhou.");
    }

    return { sol, lua, asc, cidadeConhecida };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });

    const { userData } = req.body;

    try {
        // --- 1. NUMEROLOGIA DO USUÁRIO PRINCIPAL ---
        const numeros = calcularNumerologia(userData.name, userData.date);

        // --- 2. ASTRAL DO USUÁRIO PRINCIPAL ---
        const { sol, lua, asc, cidadeConhecida } = await calcularAstral(
            userData.date, userData.time, userData.city, userData.state
        );

        const astrologia = `Sol em ${sol}, Lua em ${lua}, Ascendente em ${asc}${!cidadeConhecida ? ' (cidade não informada, aproximação central)' : ''}.`;

        // --- 3. GROQ: geração dos cards ---
        const promptGerador = `
Você é o üGuru, um Oráculo de Luxo, dândi digital e profundo.
Sua missão é redigir 7 cards para o usuário ${userData.name}, nascido em ${userData.city || 'local não informado'}.

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

        res.status(200).json({
            cards: jsonResult.cards,
            astroData: {
                sol, lua,
                ascendente: asc,
                ascendenteConfiavel: cidadeConhecida,
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
