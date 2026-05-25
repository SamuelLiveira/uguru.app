// ==========================================
// üGURU — GERADOR DE DOSSIÊ (VERSÃO DEFINITIVA)
// [ASTROLOGY API: timezone_with_dst + planets]
// ==========================================

function reduzirNumerologia(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
        num = String(num).split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return num;
}

function calcularNumerologia(nome, dataStr) {
    const p = {a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8};
    const digits = dataStr.replace(/\D/g,'');
    const destino = reduzirNumerologia([...digits].reduce((a,c) => a + parseInt(c), 0));
    const limpo = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z]/g,"");
    const expressao = reduzirNumerologia([...limpo].reduce((a,c) => a + (p[c]||0), 0));
    const missao = reduzirNumerologia(destino + expressao);
    return { destino, expressao, missao };
}

// Converte qualquer retorno de timezone em número
function parseTzone(tzData) {
    if (typeof tzData === 'number') return tzData;
    if (typeof tzData === 'string') {
        // Tenta extrair offset numérico se vier como "America/Sao_Paulo"
        // Usa offset_dst ou offset como fallback
        return -3;
    }
    return -3;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });
    const { userData } = req.body;

    try {
        const numeros = calcularNumerologia(userData.name, userData.date);
        const [ano, mes, dia] = userData.date.split('-');
        const [hora, min] = (userData.time || '12:00').split(':');
        const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        // PASSO 1: Geocoding via timezone_with_dst
        let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;
        try {
            const geoRes = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
                method: "POST",
                headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
                body: JSON.stringify({ city: userData.city, country: "BR", state: userData.state || "" })
            });
            const geoData = await geoRes.json();
            console.log("[uGuru] timezone_with_dst response:", JSON.stringify(geoData));

            if (geoData.latitude && geoData.longitude) {
                lat = parseFloat(geoData.latitude);
                lon = parseFloat(geoData.longitude);
                // offset pode vir como número positivo/negativo em horas
                tzone = typeof geoData.timezone === 'number' ? geoData.timezone
                      : typeof geoData.offset === 'number' ? geoData.offset
                      : typeof geoData.timezone_offset === 'number' ? geoData.timezone_offset
                      : -3;
                cidadeConhecida = true;
                console.log(`[uGuru] Geocoding OK: lat=${lat} lon=${lon} tzone=${tzone}`);
            }
        } catch(e) {
            console.warn("[uGuru] Geocoding falhou, fallback Brasília:", e.message);
        }

        // PASSO 2: Mapa astral completo
        const astroPayload = {
            day: parseInt(dia), month: parseInt(mes), year: parseInt(ano),
            hour: parseInt(hora), min: parseInt(min),
            lat, lon, tzone
        };
        console.log("[uGuru] Payload astro:", JSON.stringify(astroPayload));

        const astroRes = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify(astroPayload)
        });
        const astroText = await astroRes.text();
        console.log("[uGuru] Planets response:", astroText);

        if (!astroRes.ok) throw new Error(`Astrology API: ${astroRes.status} - ${astroText}`);
        const planetas = JSON.parse(astroText);

        const get = (nome) => planetas.find(p => p.name === nome)?.sign || "N/A";
        const sol      = get("Sun");
        const lua      = get("Moon");
        const mercurio = get("Mercury");
        const venus    = get("Venus");
        const marte    = get("Mars");
        const jupiter  = get("Jupiter");
        const saturno  = get("Saturn");
        const urano    = get("Uranus");
        const netuno   = get("Neptune");
        const plutao   = get("Pluto");
        const asc      = cidadeConhecida ? get("Ascendant") : "Indefinido*";

        const mapaTexto = `Sol: ${sol} | Lua: ${lua} | Asc: ${asc} | Mercúrio: ${mercurio} | Vênus: ${venus} | Marte: ${marte} | Júpiter: ${jupiter} | Saturno: ${saturno} | Urano: ${urano} | Netuno: ${netuno} | Plutão: ${plutao}`;
        console.log("[uGuru] Mapa:", mapaTexto);

        // PASSO 3: Cards via Groq
        const prompt = `Você é o üGuru, Oráculo aristocrático.
Redija 7 cards para ${userData.name}, nascido em ${userData.city || 'local não informado'}.

MAPA ASTRAL REAL (não invente, use exatamente estes):
${mapaTexto}
Numerologia: Destino ${numeros.destino} | Expressão ${numeros.expressao} | Missão ${numeros.missao}

Cards 1-3: Sol, Lua, Ascendente (~10 linhas). Cards 4-6: Destino, Expressão, Missão (~10 linhas). Card 7: Veredito (~25 linhas).
Tom aristocrático e esotérico.

JSON sem blocos de código:
{"cards":[{"title":"🌟 O Sol em sua Essência","content":"..."},{"title":"🌙 Refúgio Lunar","content":"..."},{"title":"🔥 Ascendente Estelar","content":"..."},{"title":"💎 A Vibração do Nome","content":"..."},{"title":"🗝️ A Frequência do Destino","content":"..."},{"title":"🌀 O Nó Kármico","content":"..."},{"title":"👁️ O Dossiê de Alma","content":"..."}]}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });
        const groqData = await groqRes.json();
        const result = JSON.parse(groqData.choices[0].message.content);

        return res.status(200).json({
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
        console.error("[uGuru] ERRO CRÍTICO:", error.message);
        return res.status(500).json({ error: "Falha na alquimia do sistema.", detalhe: error.message });
    }
}
