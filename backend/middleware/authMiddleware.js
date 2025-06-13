// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

/**
 * Verifica il JWT inviato nel header Authorization:
 *  - Se valido: attacca `req.user = payload` e chiama next()
 *  - Se mancante o non valido: risponde con 401
 */
export function verifyToken(req, res, next) {
  // 1. Prendi l’header “Authorization”
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token mancante' });
  }

  // 2. L’header è nel formato “Bearer <token>”
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Formato Authorization non valido' });
  }

  const token = parts[1];

  // 3. Verifica il token con la tua chiave segreta
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token non valido' });
    }

    // 4. Se tutto ok, salva il payload (es. userId) e procedi
    req.user = payload; 
    next();
  });
}
