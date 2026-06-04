export default async function handler(req, res) {
    const token = process.env.ASTRO_API_KEY;
    const userId = process.env.ASTRO_USER_ID;
    
    const payload = { day:13, month:10, year:1992, hour:20, min:45, lat:-10.18, lon:-48.33, tzone:-2 };

    // Testa Bearer Token
    const res1 = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data1 = await res1.json();

    // Testa Bearer com userId no header
    const res2 = await fetch("https://json.astrologyapi.com/v1/planets", {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "X-User-ID": userId,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload)
    });
    const data2 = await res2.json();

    return res.status(200).json({
        bearer_token: { status: res1.status, resultado: Array.isArray(data1) ? `OK - ${data1.length} planetas` : data1 },
        bearer_com_userid: { status: res2.status, resultado: Array.isArray(data2) ? `OK - ${data2.length} planetas` : data2 }
    });
}
