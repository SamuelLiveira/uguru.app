// ==========================================
// üGURU — ROTA DE SINASTRIA
// Rota: /api/sinastria
// Calcula o mapa astral da segunda alma
// ==========================================

async function calcularAstral(date, time, city) {
    let lat = -15.78;
    let lon = -47.93;
    let tzone = -3;
    let cidadeConhecida = false;

    if (city) {
        try {
            const geoResponse = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city + ', Brasil')}&key=${process.env.OPENCAGE_API_KEY}&language=pt&countrycode=br&limit=1`
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
            console.warn("[uGuru Sinastria] Geocoding falhou, usando coordenadas centrais.");
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
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(astroPayload)
        });
        if (astroResponse.ok) {
            const astroData = await astroResponse.json();
            sol = astroData.find(p => p.name === "Sun")?.sign || "Desconhecido";
            lua = astroData.find(p => p.name === "Moon")?.sign || "Desconhecida";
            if (cidadeConhecida) {
                asc = astroData.find(p => p.name === "Ascendant")?.sign || "Desconhecido";
            }
        }
    } catch(e) {
        console.warn("[uGuru Sinastria] Astrology API falhou.");
    }

    return { sol, lua, asc, cidadeConhecida };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    const { secondUserData } = req.body;

    if (!secondUserData || !secondUserData.name || !secondUserData.date) {
        return res.status(400).json({ error: 'Dados insuficientes para o cálculo.' });
    }

    try {
        const { sol, lua, asc, cidadeConhecida } = await calcularAstral(
            secondUserData.date,
            secondUserData.time,
            secondUserData.city
        );

        return res.status(200).json({
            sol, lua,
            ascendente: asc,
            ascendenteConfiavel: cidadeConhecida
        });

    } catch (error) {
        console.error("[uGuru Sinastria] Erro:", error);
        return res.status(500).json({ error: "Falha no cálculo da segunda alma." });
    }
}
