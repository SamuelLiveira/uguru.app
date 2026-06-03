// ==========================================
// üGURU — SINASTRIA (VERSÃO FINAL)
// [OPENCAGE → timezone_with_dst → planets]
// ==========================================

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    const { secondUserData } = req.body;
    if (!secondUserData?.name || !secondUserData?.date) return res.status(400).json({ error: 'Dados insuficientes.' });

    try {
        const [ano, mes, dia] = secondUserData.date.split('-');
        const [hora, min] = (secondUserData.time || '12:00').split(':');
        const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        // PASSO 1: OpenCage → lat, lon
        let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;
        if (secondUserData.city) {
            try {
                const geoRes = await fetch(
                    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(secondUserData.city + ', Brasil')}&key=${process.env.OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`
                );
                const geoData = await geoRes.json();
                if (geoData.results?.length > 0) {
                    lat = geoData.results[0].geometry.lat;
                    lon = geoData.results[0].geometry.lng;
                    cidadeConhecida = true;
                }
            } catch(e) { console.warn("[uGuru Sinastria] OpenCage falhou:", e.message); }
        }

        // PASSO 2: timezone_with_dst → fuso histórico
        try {
            const tzRes = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
                method: "POST",
                headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
                body: JSON.stringify({ latitude: lat, longitude: lon, date: `${dia}/${mes}/${ano}` })
            });
            const tzData = await tzRes.json();
            if (typeof tzData.timezone === 'number') tzone = tzData.timezone;
            else if (typeof tzData.offset === 'number') tzone = tzData.offset;
            else {
                const temDST = parseInt(ano) >= 1985 && parseInt(ano) <= 2019 && (parseInt(mes) >= 10 || parseInt(mes) <= 2);
                tzone = temDST ? -2 : -3;
            }
        } catch(e) {
            const temDST = parseInt(ano) >= 1985 && parseInt(ano) <= 2019 && (parseInt(mes) >= 10 || parseInt(mes) <= 2);
            tzone = temDST ? -2 : -3;
        }

        // PASSO 3: planets
        const astroRes = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify({ day: parseInt(dia), month: parseInt(mes), year: parseInt(ano), hour: parseInt(hora), min: parseInt(min), lat, lon, tzone })
        });
        if (!astroRes.ok) throw new Error(`Astrology API: ${astroRes.status}`);
        const planetas = await astroRes.json();
        if (!Array.isArray(planetas)) throw new Error("Planets não é array");
        const get = (nome) => planetas.find(p => p.name === nome)?.sign || "N/A";

        return res.status(200).json({
            sol: get("Sun"), lua: get("Moon"),
            ascendente: cidadeConhecida ? get("Ascendant") : "Indefinido*",
            ascendenteConfiavel: cidadeConhecida
        });
    } catch (error) {
        console.error("[uGuru Sinastria] Erro:", error.message);
        return res.status(500).json({ error: "Falha no cálculo da segunda alma." });
    }
}
