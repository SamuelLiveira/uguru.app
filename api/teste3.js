export default async function handler(req, res) {
    const userId = process.env.ASTRO_USER_ID;
    const apiKey = process.env.ASTRO_API_KEY;
    
    // Testa ordem 1: userId:apiKey
    const auth1 = Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const res1 = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth1}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day:13, month:10, year:1992, hour:20, min:45, lat:-10.18, lon:-48.33, tzone:-2 })
    });
    const data1 = await res1.json();

    // Testa ordem 2: apiKey:userId
    const auth2 = Buffer.from(`${apiKey}:${userId}`).toString('base64');
    const res2 = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST",
        headers: { "Authorization": `Basic ${auth2}`, "Content-Type": "application/json" },
        body: JSON.stringify({ day:13, month:10, year:1992, hour:20, min:45, lat:-10.18, lon:-48.33, tzone:-2 })
    });
    const data2 = await res2.json();

    return res.status(200).json({
        ordem1_userId_apiKey: { status: res1.status, resultado: data1 },
        ordem2_apiKey_userId: { status: res2.status, resultado: data2 }
    });
}
