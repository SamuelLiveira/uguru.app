// api/batismo.js
export default async function handler(req, res) {
    const { birthDate, birthTime, birthCity, birthState } = req.body;

    // Quebrando a data para o formato da API
    const [year, month, day] = birthDate.split('-');
    const [hour, min] = birthTime.split(':');

    // CONFIGURAÇÃO DE AUTENTICAÇÃO (Pegando das variáveis que você salvou!)
    const userId = process.env.ASTROLOGY_USER_ID;
    const apiKey = process.env.ASTROLOGY_API_KEY;
    const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');

    try {
        const response = await fetch("https://json.astrologyapi.com/v1/astro_details", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                hour: parseInt(hour),
                min: parseInt(min),
                lat: -23.5505, // O ideal é integrar uma API de Geo aqui depois!
                lon: -46.6333, // Exemplo: São Paulo
                tzone: -3.0
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao conectar com as estrelas." });
    }
}
