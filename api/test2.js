export default function handler(req, res) {
    return res.status(200).json({
        OPENCAGE_API_KEY: process.env.OPENCAGE_API_KEY ? 'OK' : 'VAZIO',
        CHAVE_API_OPENCAGE: process.env.CHAVE_API_OPENCAGE ? 'OK' : 'VAZIO',
        ASTRO_USER_ID: process.env.ASTRO_USER_ID ? 'OK' : 'VAZIO',
        ID_USUARIO_ASTRO: process.env['ID_USUÁRIO_ASTRO'] ? 'OK' : 'VAZIO',
        ASTRO_API_KEY: process.env.ASTRO_API_KEY ? 'OK' : 'VAZIO',
        GROQ_API_KEY: process.env.GROQ_API_KEY ? 'OK' : 'VAZIO'
    });
}
