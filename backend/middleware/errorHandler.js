// Middleware per la gestione degli errori
export const errorHandler = (err, req, res, next) => {
  // Se lo status code è già stato impostato, usalo, altrimenti imposta 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log dell'errore
  console.error(`${err.message}`);
  console.error(err.stack);
  
  // Invia la risposta di errore
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// Middleware per gestire le route non trovate
export const notFound = (req, res, next) => {
  const error = new Error(`Risorsa non trovata - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware per gestire errori di validazione
export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Errore di validazione',
      errors: messages
    });
  }
  next(err);
};

// Middleware per gestire errori di autenticazione
export const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Sessione non valida o scaduta, effettua nuovamente il login'
    });
  }
  next(err);
};
