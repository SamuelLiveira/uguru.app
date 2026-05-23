// ==========================================
// üGURU — GERADOR DE DOSSIÊ
// [ASTROLOGY API NATIVA: timezone_with_dst + birth_details]
// ==========================================

function reduzirNumerologia(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
        num = String(num).split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return num;
}

function calcularNumerologia(nome, dataStr) {
    const p = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8 };
    const digits = dataStr.replace(/\D/g,'');
    const destino = reduzirNumerologia([...digits].reduce((a,c) => a + parseInt(c), 0));
    const limpo = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z]/g,"");
    const expressao = reduzirNumerologia([...limpo].reduce((a,c) => a + (p[c]||0), 0));
    const missao = reduzirNumerologia(destino + expressao);
    return { destino, expressao, missao };
}

async function geocodificar(city, state) {
    const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');
    const response = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ city, country: "BR", state })
    });
    if (!response.ok) throw new Error("Geocoding falhou");
    const data = await response.json();
    return { lat: data.latitude, lon: data.longitude, tzone: data.timezone };
}

async function calcularAstral(date, time, city, state) {
    const [ano, mes, dia] = date.split('-');
    const [hora, min] = (time || '12:00').split(':');
    const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

    let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;

    if (city) {
        try {
            const geo = await geocodificar(city, state || '');
            lat = geo.lat; lon = geo.lon; tzone = geo.tzone;
            cidadeConhecida = true;
        } catch(e) { console.warn("[uGuru] Geocoding falhou, usando fallback."); }
    }

    const astroResponse = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day: parseInt(dia), month: parseInt(mes), year: parseInt(ano), hour: parseInt(hora), min: parseInt(min), lat, lon, tzone })
    });

    let sol = "Desconhecido", lua = "Desconhecida", asc = cidadeConhecida ? "Desconhecido" : "Indefinido*";
    if (astroResponse.ok) {
        const astroData = await astroResponse.json();
        sol = astroData.find(p => p.name === "Sun")?.sign || sol;
        lua = astroData.find(p => p.name === "Moon")?.sign || lua;
        if (cidadeConhecida) asc = astroData.find(p => p.name === "Ascendant")?.sign || asc;
    }
    return { sol, lua, asc, cidadeConhecida };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });
    const { userData } = req.body;

    try {
        const numeros = calcularNumerologia(userData.name, userData.date);
        const { sol, lua, asc, cidadeConhecida } = await calcularAstral(userData.date, userData.time, userData.city, userData.state);
        const astrologia = `Sol em ${sol}, Lua em ${lua}, Ascendente em ${asc}${!cidadeConhecida ? ' (aproximação)' : ''}.`;

        const prompt = `Você é o üGuru, Oráculo de Luxo aristocrático.
Redija 7 cards para ${userData.name}, nascido em ${userData.city || 'local não informado'}.

DADOS EXATOS (USE ESTES, NÃO INVENTE):
Astrologia: ${astrologia}
Numerologia: Destino ${numeros.destino}, Expressão ${numeros.expressao}, Missão ${numeros.missao}.

Cards 1-3: Sol, Lua, Ascendente (~10 linhas cada). Cards 4-6: Destino, Expressão, Missão (~10 linhas). Card 7: Veredito final (~25 linhas).
Tom: aristocrático, esotérico, implacável.

JSON obrigatório:
{"cards":[{"title":"🌟 O Sol em sua Essência","content":"..."},{"title":"🌙 Refúgio Lunar","content":"..."},{"title":"🔥 Ascendente Estelar","content":"..."},{"title":"💎 A Vibração do Nome (Expressão)","content":"..."},{"title":"🗝️ A Frequência do Destino","content":"..."},{"title":"🌀 O Nó Kármico (Missão)","content":"..."},{"title":"👁️ O Dossiê de Alma (Veredito)","content":"..."}]}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: prompt }], response_format: { type: "json_object" }, temperature: 0.7 })
        });

        const groqData = await groqRes.json();
        const result = JSON.parse(groqData.choices[0].message.content);

        res.status(200).json({
            cards: result.cards,
            astroData: { sol, lua, ascendente: asc, ascendenteConfiavel: cidadeConhecida, destino: numeros.destino, expressao: numeros.expressao, missao: numeros.missao }
        });
    } catch (error) {
        console.error("[uGuru] Erro ao gerar cards:", error);
        res.status(500).json({ error: "Falha na alquimia do sistema." });
    }
}
