import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurazione della strategia Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Cerca l'utente nel database tramite googleId
      let user = await User.findOne({ googleId: profile.id });
      
      // Se l'utente non esiste, cerca per email
      if (!user && profile.emails && profile.emails.length > 0) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        // Se esiste un utente con questa email ma senza googleId, aggiorna il suo profilo
        if (user) {
          user.googleId = profile.id;
          if (profile.photos && profile.photos.length > 0) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        }
      }
      
      // Se l'utente non esiste ancora, crealo
      if (!user) {
        user = await User.create({
          name: profile.displayName || 'Utente Google',
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `user-${profile.id}@google.com`,
          googleId: profile.id,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          // Non impostiamo password per gli utenti Google
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Errore nell\'autenticazione Google:', error);
      return done(error, null);
    }
  }
));

// Serializzazione dell'utente per la sessione
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione dell'utente dalla sessione
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
