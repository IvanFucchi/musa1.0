// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware per proteggere le route che richiedono autenticazione
export const protect = async (req, res, next) => {
  try {
    let token;

    // Verifica se il token è presente nell'header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Non autorizzato, token non presente' });
    }

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trova l'utente dal token decodificato e rimuovi la password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utente non trovato' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth protect error:', error);
    return res.status(401).json({ message: 'Non autorizzato, token non valido' });
  }
};

// Middleware per verificare se l'utente è admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Non autorizzato, privilegi di admin richiesti' });
};

// Middleware per verificare se l'utente è proprietario o admin
export const ownerOrAdmin = (resourceModel) => async (req, res, next) => {
  try {
    const resource = await resourceModel.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Risorsa non trovata' });
    }
    const isOwner =
      (resource.user && resource.user.toString() === req.user._id.toString()) ||
      (resource.creator && resource.creator.toString() === req.user._id.toString());
    if (isOwner || req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Non autorizzato, accesso negato' });
  } catch (err) {
    console.error('OwnerOrAdmin error:', err);
    return res.status(500).json({ message: 'Errore interno' });
  }
};
