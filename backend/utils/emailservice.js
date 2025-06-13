// backend/utils/emailService.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configura SendGrid con la tua API key
const apiKey = process.env.SENDGRID_API_KEY;
console.log('Inizializzazione SendGrid con API key che termina con:', apiKey ? apiKey.substring(apiKey.length - 4) : 'API KEY MANCANTE');
sgMail.setApiKey(apiKey);

/**
 * Invia un'email di conferma all'utente registrato
 * @param {Object} user - Oggetto utente con email e token di conferma
 * @returns {Promise} - Promise che si risolve quando l'email è stata inviata
 */
export const sendConfirmationEmail = async (user) => {
  try {
    console.log('=== INVIO EMAIL DI CONFERMA ===');
    console.log('Utente:', {
      id: user._id,
      email: user.email,
      name: user.name,
      hasToken: !!user.confirmationToken,
      tokenLength: user.confirmationToken ? user.confirmationToken.length : 0,
      tokenExpires: user.confirmationTokenExpires
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    console.log('Frontend URL:', frontendUrl );
    /**** */
    const confirmationUrl = `${frontendUrl}/verify-email/${user.confirmationToken}`;
    console.log('URL di conferma:', confirmationUrl);
    
    const fromEmail = process.env.EMAIL_FROM;
    console.log('Valore effettivo di EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('Email mittente:', fromEmail);

    if (!fromEmail) {
  console.error('ERRORE: EMAIL_FROM non è definito nel file .env!');
  throw new Error('EMAIL_FROM non è definito. Impossibile inviare email.');
}
    
    const msg = {
      to: user.email,
      from: fromEmail, // Email verificata in SendGrid
      subject: 'Conferma la tua email - MUSA App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Benvenuto su MUSA!</h2>
          <p>Grazie per esserti registrato. Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
              Conferma la tua email
            </a>
          </div>
          <p>Se non hai creato tu questo account, puoi ignorare questa email.</p>
          <p>Grazie,<br>Il team di MUSA</p>
        </div>
      `
    };
    
    console.log('Configurazione email completata, tentativo di invio...');
    const result = await sgMail.send(msg);
    
    console.log('Risposta SendGrid:', {
      statusCode: result[0].statusCode,
      headers: result[0].headers,
      body: result[0].body
    });
    
    console.log('Email inviata con successo a:', user.email);
    return true;
  } catch (error) {
    console.error('=== ERRORE NELL\'INVIO DELL\'EMAIL ===');
    console.error('Tipo di errore:', error.name);
    console.error('Messaggio di errore:', error.message);
    
    if (error.response) {
      console.error('Dettagli risposta SendGrid:');
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
      console.error('Headers:', error.response.headers);
    }
    
    if (error.code === 'EENVELOPE') {
      console.error('Errore nell\'envelope dell\'email. Verifica che l\'indirizzo email sia valido.');
    }
    
    if (error.code === 'EAUTH') {
      console.error('Errore di autenticazione. Verifica la tua API key di SendGrid.');
    }
    
    if (error.code === 'ESOCKET') {
      console.error('Errore di connessione. Verifica la tua connessione internet.');
    }
    
    console.error('Stack trace:', error.stack);
    return false;
  }
};

/**
 * Invia un'email di reset password
 * @param {Object} user - Oggetto utente con email e token di reset
 * @returns {Promise} - Promise che si risolve quando l'email è stata inviata
 */
export const sendPasswordResetEmail = async (user) => {
  try {
    console.log('=== INVIO EMAIL DI RESET PASSWORD ===');
    console.log('Utente:', {
      id: user._id,
      email: user.email,
      name: user.name,
      hasToken: !!user.resetPasswordToken,
      tokenLength: user.resetPasswordToken ? user.resetPasswordToken.length : 0,
      tokenExpires: user.resetPasswordExpires
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    console.log('Frontend URL:', frontendUrl );
    
    const resetUrl = `${frontendUrl}/reset-password?token=${user.resetPasswordToken}`;
    console.log('URL di reset:', resetUrl);
    
    const fromEmail = process.env.EMAIL_FROM;
    console.log('Email mittente:', fromEmail);
    
    const msg = {
      to: user.email,
      from: fromEmail,
      subject: 'Reset della password - MUSA App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset della password</h2>
          <p>Hai richiesto il reset della password. Clicca sul pulsante qui sotto per impostare una nuova password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Se non hai richiesto tu il reset della password, puoi ignorare questa email.</p>
          <p>Grazie,<br>Il team di MUSA</p>
        </div>
      `
    };
    
    console.log('Configurazione email completata, tentativo di invio...');
    const result = await sgMail.send(msg);
    
    console.log('Risposta SendGrid:', {
      statusCode: result[0].statusCode,
      headers: result[0].headers,
      body: result[0].body
    });
    
    console.log('Email di reset password inviata con successo a:', user.email);
    return true;
  } catch (error) {
    console.error('=== ERRORE NELL\'INVIO DELL\'EMAIL DI RESET PASSWORD ===');
    console.error('Tipo di errore:', error.name);
    console.error('Messaggio di errore:', error.message);
    
    if (error.response) {
      console.error('Dettagli risposta SendGrid:');
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
      console.error('Headers:', error.response.headers);
    }
    
    if (error.code === 'EENVELOPE') {
      console.error('Errore nell\'envelope dell\'email. Verifica che l\'indirizzo email sia valido.');
    }
    
    if (error.code === 'EAUTH') {
      console.error('Errore di autenticazione. Verifica la tua API key di SendGrid.');
    }
    
    if (error.code === 'ESOCKET') {
      console.error('Errore di connessione. Verifica la tua connessione internet.');
    }
    
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Funzione di test per verificare la configurazione di SendGrid
export const testSendGridConnection = async () => {
  try {
    console.log('=== TEST CONNESSIONE SENDGRID ===');
    console.log('API Key configurata:', !!process.env.SENDGRID_API_KEY);
    console.log('Email mittente configurata:', process.env.EMAIL_FROM);
    
    // Verifica la connessione a SendGrid
    const msg = {
      to: 'test@example.com', // Email di test
      from: process.env.EMAIL_FROM,
      subject: 'Test connessione SendGrid',
      text: 'Questo è un test di connessione a SendGrid.',
      html: '<p>Questo è un test di connessione a SendGrid.</p>'
    };
    
    console.log('Tentativo di connessione a SendGrid...');
    
    try {
      // Non inviamo realmente l'email, ma verifichiamo solo la connessione
      await sgMail.send(msg, false);
      console.log('Connessione a SendGrid riuscita!');
      return true;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('=== ERRORE NEL TEST DI CONNESSIONE SENDGRID ===');
    console.error('Tipo di errore:', error.name);
    console.error('Messaggio di errore:', error.message);
    
    if (error.response) {
      console.error('Dettagli risposta SendGrid:');
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
      console.error('Headers:', error.response.headers);
    }
    
    console.error('Stack trace:', error.stack);
    return false;
  }
};

export default {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  testSendGridConnection
};
