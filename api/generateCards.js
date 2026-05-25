// ==========================================
// üGURU — GERADOR DE DOSSIÊ
// [ASTROLOGY API NATIVA: timezone_with_dst + planets]
// [MAPA COMPLETO: todos os planetas para a IA]
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
        body: JSON.stringify({ city, country: "BR", state: state || "" })
    });
    if (!response.ok) throw new Error(`Geocoding falhou: ${response.status}`);
    const data = await response.json();
    return {
        lat: data.latitude,
        lon: data.longitude,
        tzone: data.timezone ?? data.offset ?? -3
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });
    const { userData } = req.body;

    try {
        // 1. NUMEROLOGIA
        const numeros = calcularNumerologia(userData.name, userData.date);

        // 2. GEOCODING via Astrology API
        const [ano, mes, dia] = userData.date.split('-');
        const [hora, min] = (userData.time || '12:00').split(':');
        const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;
        try {
            const geo = await geocodificar(userData.city, userData.state);
            lat = geo.lat; lon = geo.lon; tzone = geo.tzone;
            cidadeConhecida = true;
            console.log(`[uGuru] Geocoding OK: ${userData.city} → lat:${lat} lon:${lon} tz:${tzone}`);
        } catch(e) {
            console.warn("[uGuru] Geocoding falhou, usando Brasília como fallback:", e.message);
        }

        // 3. MAPA ASTRAL COMPLETO
        const astroPayload = {
            day: parseInt(dia), month: parseInt(mes), year: parseInt(ano),
            hour: parseInt(hora), min: parseInt(min),
            lat, lon, tzone
        };

        const astroResponse = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify(astroPayload)
        });

        if (!astroResponse.ok) throw new Error(`Astrology API falhou: ${astroResponse.status}`);
        const planetas = await astroResponse.json();
        console.log("[uGuru] Planetas recebidos:", JSON.stringify(planetas));

        // Extrai todos os planetas
        const getSigno = (nome) => planetas.find(p => p.name === nome)?.sign || "Desconhecido";
        const sol        = getSigno("Sun");
        const lua        = getSigno("Moon");
        const mercurio   = getSigno("Mercury");
        const venus      = getSigno("Venus");
        const marte      = getSigno("Mars");
        const jupiter    = getSigno("Jupiter");
        const saturno    = getSigno("Saturn");
        const urano      = getSigno("Uranus");
        const netuno     = getSigno("Neptune");
        const plutao     = getSigno("Pluto");
        const asc        = cidadeConhecida ? getSigno("Ascendant") : "Indefinido*";

        const mapaTexto = `Sol em ${sol}, Lua em ${lua}, Ascendente em ${asc}, Mercúrio em ${mercurio}, Vênus em ${venus}, Marte em ${marte}, Júpiter em ${jupiter}, Saturno em ${saturno}, Urano em ${urano}, Netuno em ${netuno}, Plutão em ${plutao}.`;

        // 4. GROQ — GERAÇÃO DOS CARDS
        const promptGerador = `Você é o üGuru, Oráculo de Luxo aristocrático.
Redija 7 cards para ${userData.name}, nascido em ${userData.city || 'local não informado'}.

MAPA ASTRAL COMPLETO (USE ESTES DADOS, NÃO INVENTE):
${mapaTexto}
Numerologia Pitagórica: Destino ${numeros.destino}, Expressão ${numeros.expressao}, Missão ${numeros.missao}.

Cards 1-3: Sol, Lua, Ascendente (~10 linhas cada). Cards 4-6: Destino, Expressão, Missão (~10 linhas). Card 7: Veredito final cruzando astros e numerologia (~25 linhas).
Tom: aristocrático, esotérico, implacável. NÃO INVENTE DADOS.

JSON obrigatório sem blocos de código:
{"cards":[{"title":"🌟 O Sol em sua Essência","content":"..."},{"title":"🌙 Refúgio Lunar","content":"..."},{"title":"🔥 Ascendente Estelar","content":"..."},{"title":"💎 A Vibração do Nome","content":"..."},{"title":"🗝️ A Frequência do Destino","content":"..."},{"title":"🌀 O Nó Kármico","content":"..."},{"title":"👁️ O Dossiê de Alma","content":"..."}]}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: promptGerador }],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        const groqData = await groqRes.json();
        const result = JSON.parse(groqData.choices[0].message.content);

        // 5. RETORNO — mapa completo para o chat usar
        res.status(200).json({
            cards: result.cards,
            astroData: {
                sol, lua, ascendente: asc,
                mercurio, venus, marte, jupiter, saturno, urano, netuno, plutao,
                ascendenteConfiavel: cidadeConhecida,
                destino: numeros.destino,
                expressao: numeros.expressao,
                missao: numeros.missao
            }
        });

    } catch (error) {
        console.error("[uGuru] Erro ao gerar cards:", error);
        res.status(500).json({ error: "Falha na alquimia do sistema." });
    }
}
