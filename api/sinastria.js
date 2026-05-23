// ==========================================
// üGURU — ROTA DE SINASTRIA
// [ASTROLOGY API NATIVA: sem OpenCage]
// ==========================================

async function geocodificar(city, state) {
    const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');
    const response = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ city, country: "BR", state: state || '' })
    });
    if (!response.ok) throw new Error("Geocoding falhou");
    const data = await response.json();
    return { lat: data.latitude, lon: data.longitude, tzone: data.timezone };
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
                const geo = await geocodificar(secondUserData.city, '');
                lat = geo.lat; lon = geo.lon; tzone = geo.tzone;
                cidadeConhecida = true;
            } catch(e) { console.warn("[uGuru Sinastria] Geocoding falhou."); }
        }

        const astroResponse = await fetch("https://json.astrologyapi.com/v1/planets", {
            method: "POST",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify({ day: parseInt(dia), month: parseInt(mes), year: parseInt(ano), hour: parseInt(hora), min: parseInt(min), lat, lon, tzone })
        });

        let sol = "Desconhecido", lua = "Desconhecida", asc = cidadeConhecida ? "Desconhecido" : "Indefinido*";
        if (astroResponse.ok) {
            const d = await astroResponse.json();
            sol = d.find(p => p.name === "Sun")?.sign || sol;
            lua = d.find(p => p.name === "Moon")?.sign || lua;
            if (cidadeConhecida) asc = d.find(p => p.name === "Ascendant")?.sign || asc;
        }

        return res.status(200).json({ sol, lua, ascendente: asc, ascendenteConfiavel: cidadeConhecida });
    } catch (error) {
        console.error("[uGuru Sinastria] Erro:", error);
        return res.status(500).json({ error: "Falha no cálculo da segunda alma." });
    }
}
