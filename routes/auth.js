const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
let remoteJWKS = null;
let joseModule = null;

async function authenticateJWT(req, res, next) {
    // Skip authentication for OPTIONS requests (preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Auth error - No authorization header provided');
        return res.status(401).json({ error: 'No autorizado, token requerido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        if (SUPABASE_URL) {
            if (!joseModule) joseModule = await import('jose');
            if (!remoteJWKS) {
                remoteJWKS = joseModule.createRemoteJWKSet(
                    new URL(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`)
                );
            }

            const result = await joseModule.jwtVerify(token, remoteJWKS, {
                issuer: `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1`,
            });
            req.user = result.payload;
            return next();
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Auth error - Invalid token:', err.message);
                return res.status(403).json({ error: 'Token inválido' });
            }
            req.user = user;
            next();
        });
    } catch (jwksError) {
        if (JWT_SECRET) {
            try {
                const user = jwt.verify(token, JWT_SECRET);
                req.user = user;
                return next();
            } catch (legacyError) {
                console.error('Auth error - Invalid token:', legacyError.message);
            }
        }

        console.error('Auth error - Invalid token:', jwksError.message);
        return res.status(403).json({ error: 'Token inválido' });
    }
}

module.exports = authenticateJWT;
