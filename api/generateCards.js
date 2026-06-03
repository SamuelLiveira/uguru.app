// ==========================================
// üGURU — GERADOR DE DOSSIÊ (VERSÃO FINAL)
// [OPENCAGE → timezone_with_dst → planets]
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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Acesso negado.' });
    const { userData } = req.body;

    try {
        const numeros = calcularNumerologia(userData.name, userData.date);
        const [ano, mes, dia] = userData.date.split('-');
        const [hora, min] = (userData.time || '12:00').split(':');
        const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        // PASSO 1: OpenCage → lat, lon
        let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;
        try {
            const opencageKey = process.env.OPENCAGE_API_KEY;
            const query = userData.state
                ? `${userData.city}, ${userData.state}, Brasil`
                : `${userData.city}, Brasil`;
            const geoRes = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${opencageKey}&language=pt&countrycode=br&limit=1`
            );
            const geoData = await geoRes.json();
            if (geoData.results?.length > 0) {
                lat = geoData.results[0].geometry.lat;
                lon = geoData.results[0].geometry.lng;
                console.log(`[uGuru] OpenCage OK: lat=${lat} lon=${lon}`);
                cidadeConhecida = true;
            }
        } catch(e) {
            console.warn("[uGuru] OpenCage falhou:", e.message);
        }

        // PASSO 2: timezone_with_dst → fuso histórico correto para a data
        try {
            const tzRes = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
                method: "POST",
                headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lon,
                    date: `${dia}/${mes}/${ano}`
                })
            });
            const tzData = await tzRes.json();
            console.log("[uGuru] timezone_with_dst:", JSON.stringify(tzData));
            if (typeof tzData.timezone === 'number') {
                tzone = tzData.timezone;
            } else if (typeof tzData.offset === 'number') {
                tzone = tzData.offset;
            } else {
                // Fallback DST histórico manual
                const temDST = parseInt(ano) >= 1985 && parseInt(ano) <= 2019
                    && (parseInt(mes) >= 10 || parseInt(mes) <= 2);
                tzone = temDST ? -2 : -3;
                console.warn(`[uGuru] timezone_with_dst sem número, DST manual: ${tzone}`);
            }
            console.log(`[uGuru] Fuso histórico: ${tzone}`);
        } catch(e) {
            const temDST = parseInt(ano) >= 1985 && parseInt(ano) <= 2019
                && (parseInt(mes) >= 10 || parseInt(mes) <= 2);
            tzone = temDST ? -2 : -3;
            console.warn(`[uGuru] timezone_with_dst falhou, DST manual: ${tzone}`, e.message);
        }

        // PASSO 3: planets → mapa astral completo
        const astroPayload = {
            day: parseInt(dia), month: parseInt(mes), year: parseInt(ano),
            hour: parseInt(hora), min: parseInt(min),
            lat, lon, tzone
        };
        console.log("[uGuru] Payload planets:", JSON.stringify(astroPayload));

        const astroRes = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify(astroPayload)
        });
        const astroText = await astroRes.text();
        console.log("[uGuru] Planets response:", astroText.substring(0, 400));
        if (!astroRes.ok) throw new Error(`Astrology API planets: ${astroRes.status} - ${astroText}`);
        const planetas = JSON.parse(astroText);

        if (!Array.isArray(planetas)) throw new Error(`Planets não é array: ${JSON.stringify(planetas)}`);

        const get = (nome) => planetas.find(p => p.name === nome)?.sign || "N/A";
        const sol = get("Sun"), lua = get("Moon");
        const mercurio = get("Mercury"), venus = get("Venus"), marte = get("Mars");
        const jupiter = get("Jupiter"), saturno = get("Saturn");
        const urano = get("Uranus"), netuno = get("Neptune"), plutao = get("Pluto");
        const asc = cidadeConhecida ? get("Ascendant") : "Indefinido*";

        const mapaTexto = `Sol:${sol}|Lua:${lua}|Asc:${asc}|Mercúrio:${mercurio}|Vênus:${venus}|Marte:${marte}|Júpiter:${jupiter}|Saturno:${saturno}|Urano:${urano}|Netuno:${netuno}|Plutão:${plutao}`;
        console.log("[uGuru] Mapa final:", mapaTexto);

        // PASSO 4: Groq — cards
        const prompt = `Você é o üGuru, Oráculo aristocrático.
Redija 7 cards para ${userData.name}, nascido em ${userData.city || 'local não informado'}.
MAPA ASTRAL REAL (use exatamente, não invente): ${mapaTexto}
Numerologia: Destino ${numeros.destino}|Expressão ${numeros.expressao}|Missão ${numeros.missao}
Cards 1-3: Sol, Lua, Ascendente (~10 linhas). Cards 4-6: Destino, Expressão, Missão (~10 linhas). Card 7: Veredito (~25 linhas). Tom aristocrático.
JSON sem blocos: {"cards":[{"title":"🌟 O Sol em sua Essência","content":"..."},{"title":"🌙 Refúgio Lunar","content":"..."},{"title":"🔥 Ascendente Estelar","content":"..."},{"title":"💎 A Vibração do Nome","content":"..."},{"title":"🗝️ A Frequência do Destino","content":"..."},{"title":"🌀 O Nó Kármico","content":"..."},{"title":"👁️ O Dossiê de Alma","content":"..."}]}`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: prompt }], response_format: { type: "json_object" }, temperature: 0.7 })
        });
        const groqData = await groqRes.json();
        const result = JSON.parse(groqData.choices[0].message.content);

        return res.status(200).json({
            cards: result.cards,
            astroData: { sol, lua, ascendente: asc, mercurio, venus, marte, jupiter, saturno, urano, netuno, plutao, ascendenteConfiavel: cidadeConhecida, destino: numeros.destino, expressao: numeros.expressao, missao: numeros.missao }
        });

    } catch (error) {
        console.error("[uGuru] ERRO CRÍTICO:", error.message);
        return res.status(500).json({ error: "Falha na alquimia.", detalhe: error.message });
    }
}
