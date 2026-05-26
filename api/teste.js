// Teste isolado da Astrology API
// Cole esse arquivo como api/test.js temporariamente na Vercel

export default async function handler(req, res) {
    const auth = Buffer.from(`${process.env.ASTRO_USER_ID}:${process.env.ASTRO_API_KEY}`).toString('base64');
    
    // Teste 1: timezone_with_dst
    const geoRes = await fetch("https://json.astrologyapi.com/v1/timezone_with_dst", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ city: "Palmas", country: "BR", state: "TO" })
    });
    const geoData = await geoRes.json();
    
    // Teste 2: planets com dados fixos de Palmas
    const astroRes = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST", 
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day: 13, month: 10, year: 1992, hour: 20, min: 45, lat: -10.18, lon: -48.33, tzone: -2 })
    });
    const astroData = await astroRes.json();

    return res.status(200).json({
        geocoding_status: geoRes.status,
        geocoding_data: geoData,
        planets_status: astroRes.status,
        planets_data: astroData
    });
}
