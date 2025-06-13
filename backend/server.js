import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import passport from './config/passport.js';
import session from 'express-session';
// import authRoutes from './routes/authRoutes.js';
import morgan from 'morgan';
import suggestionsRoutes from './routes/suggestionsRoutes.js';


import { notFound, errorHandler, validationErrorHandler, authErrorHandler } from './middleware/errorHandler.js';

/*
// Test temporaneo per OpenAI
import { aiGeneratedSpots } from './utils/openaiService.js';

const testOpenAI = async () => {
  try {
    console.log('Testando aiGeneratedSpots...');
    console.log('OPENAI_API_KEY presente:', process.env.OPENAI_API_KEY ? 'Sì' : 'No');
    
    const spots = await aiGeneratedSpots('arte roma', {});
    console.log('Risultati:', JSON.stringify(spots, null, 2));
  } catch (error) {
    console.error('Errore nel test:', error);
  }
};

// Esegui il test
testOpenAI();

*/

// Import routes
import authRoutes from './routes/authRoutes.js';
import spotRoutes from './routes/spotRoutes.js';
import ugcRoutes from './routes/ugcRoutes.js';


dotenv.config();

connectDB();

const app = express();

// Configurazione CORS avanzata
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://tuo-dominio-produzione.com'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 ore in secondi
  optionsSuccessStatus: 200
};

// Applica CORS prima di qualsiasi altro middleware che gestisce le richieste
app.use(cors(corsOptions ));

// Middleware di base
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));



// Configurazione sessione per Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'musa-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Inizializza Passport
app.use(passport.initialize());
app.use(passport.session());






// Logging in modalità sviluppo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Middleware di sicurezza di base
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Rotta di health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotte API
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/ugc', ugcRoutes);

// Rotta base
app.get('/', (req, res) => {
  res.json({
    message: 'Benvenuto nell\'API di MUSA',
    version: '1.0.0',
    status: 'online',
    documentation: '/api-docs',
    environment: process.env.NODE_ENV
  });
});

// Middleware per la gestione degli errori (devono essere ultimi)
app.use(validationErrorHandler);
app.use(authErrorHandler);
app.use(notFound);
app.use(errorHandler);

// Porta del server
const PORT = process.env.PORT || 5000;

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiusura in corso...');
  process.exit(0);
});

// Avvio del server
connectDB()
  .then(() => {
    console.log('Database MongoDB connesso con successo');
  })
  .catch((error) => {
    console.error('Errore di connessione al database:', error);
    process.exit(1);
  });
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in esecuzione in modalità ${process.env.NODE_ENV} sulla porta ${PORT}`);
});

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.error('Errore non catturato:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa non gestita:', promise, 'motivo:', reason);
  process.exit(1);
});


// per suggerimenti nuova barra di ricerca
app.use('/api/suggestions', suggestionsRoutes);


export default app;
