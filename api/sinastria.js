// ==========================================
// üGURU — ROTA DE SINASTRIA (VERSÃO FINAL)
// [OPENCAGE → ASTROLOGY API]
// ==========================================

async function geocodificar(city) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city + ', Brasil')}&key=${process.env.OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenCage falhou: ${res.status}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error("Cidade não encontrada");
    const r = data.results[0];
    const offsetSec = r.annotations?.timezone?.offset_sec ?? -10800;
    return { lat: r.geometry.lat, lon: r.geometry.lng, tzone: offsetSec / 3600 };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    const { secondUserData } = req.body;
    if (!secondUserData?.name || !secondUserData?.date) {
        return res.status(400).json({ error: 'Dados insuficientes.' });
    }

    try {
        const [ano, mes, dia] = secondUserData.date.split('-');
        const [hora, min] = (secondUserData.time || '12:00').split(':');
        const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');

        let lat = -15.78, lon = -47.93, tzone = -3, cidadeConhecida = false;
        if (secondUserData.city) {
            try {
                const geo = await geocodificar(secondUserData.city);
                lat = geo.lat; lon = geo.lon; tzone = geo.tzone;
                cidadeConhecida = true;
            } catch(e) {
                console.warn("[uGuru Sinastria] Geocoding falhou:", e.message);
            }
        }

        const astroRes = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                day: parseInt(dia), month: parseInt(mes), year: parseInt(ano),
                hour: parseInt(hora), min: parseInt(min),
                lat, lon, tzone
            })
        });

        if (!astroRes.ok) throw new Error(`Astrology API: ${astroRes.status}`);
        const planetas = await astroRes.json();

        const get = (nome) => planetas.find(p => p.name === nome)?.sign || "N/A";
        const sol = get("Sun");
        const lua = get("Moon");
        const asc = cidadeConhecida ? get("Ascendant") : "Indefinido*";

        return res.status(200).json({ sol, lua, ascendente: asc, ascendenteConfiavel: cidadeConhecida });

    } catch (error) {
        console.error("[uGuru Sinastria] Erro:", error.message);
        return res.status(500).json({ error: "Falha no cálculo da segunda alma." });
    }
}
