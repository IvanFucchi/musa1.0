// backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendConfirmationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// @desc    Registra un nuovo utente
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('Utente già registrato');
    }

    // Crea il nuovo utente
    const user = await User.create({
      name,
      email,
      password // La password viene hashata automaticamente nel pre-save hook
    });

    if (user) {
      // Genera token di conferma
      const confirmationToken = user.generateConfirmationToken();
      await user.save();

      // Invia email di conferma
      await sendConfirmationEmail(user);

      res.status(201).json({
        success: true,
        message: 'Utente registrato con successo. Controlla la tua email per confermare l\'account.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
          // Non inviamo il token JWT qui perché l'utente deve prima verificare l'email
        }
      });
    } else {
      res.status(400);
      throw new Error('Dati utente non validi');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Autentica utente e genera token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verifica se l'utente esiste
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Email o password non validi');
    }

    // Verifica la password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Email o password non validi');
    }

    // Verifica se l'email è stata confermata (salta per utenti Google)
    if (!user.isEmailVerified && !user.googleId) {
      res.status(401);
      throw new Error('Per favore, verifica la tua email prima di accedere');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: user.generateAuthToken()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verifica email utente
// @route   GET /api/auth/verify-email/:token
// @access  Public
// controllers/authController.js

export const verifyEmail = async (req, res) => {
  // 1) Prendi il token da req.params
  const token = req.params.token;
  console.log('>>> verifyEmail token:', token);

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token mancante' });
  }

  try {
    // 2) Trova l'utente che ha questo confirmationToken
    const user = await User.findOne({ confirmationToken: token });
    console.log('>>> user trovato:', user ? user.email : null);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token non valido' });
    }

    // 3) Controlla la scadenza
    if (user.confirmationTokenExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Token scaduto' });
    }

    // 4) Segna l'utente come verificato e pulisci i campi
    user.isVerified = true;
    user.confirmationToken = undefined;
    user.confirmationTokenExpires = undefined;
    await user.save();

    console.log('>>> Email verificata per:', user.email);
    return res.json({ success: true, message: 'Email verificata' });

  } catch (err) {
    console.error('>>> Errore interno verifyEmail:', err);
    return res.status(500).json({ success: false, message: 'Errore interno' });
  }
};


// @desc    Richiedi nuovo token di verifica email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('Utente non trovato');
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error('Email già verificata');
    }

    // Genera nuovo token di conferma
    const confirmationToken = user.generateConfirmationToken();
    await user.save();

    // Invia email di conferma
    await sendConfirmationEmail(user);

    res.json({
      success: true,
      message: 'Email di verifica inviata con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Richiedi reset password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('Utente non trovato');
    }

    // Genera token di reset password
    user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 ora
    await user.save();

    // Invia email di reset password
    await sendPasswordResetEmail(user);

    res.json({
      success: true,
      message: 'Email di reset password inviata con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Token di reset password non valido o scaduto');
    }

    // Aggiorna password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni profilo utente
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          bio: user.bio,
          avatar: user.avatar,
          googleId: user.googleId,
          isEmailVerified: user.isEmailVerified
        }
      });
    } else {
      res.status(404);
      throw new Error('Utente non trovato');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;

      // Se l'email è cambiata, richiedi una nuova verifica
      if (req.body.email && req.body.email !== user.email) {
        user.email = req.body.email;
        user.isEmailVerified = false;

        // Genera token di conferma
        const confirmationToken = user.generateConfirmationToken();

        // Invia email di conferma
        await sendConfirmationEmail(user);
      }

      user.bio = req.body.bio || user.bio;
      user.avatar = req.body.avatar || user.avatar;

      // Aggiorna la password solo se:
      // 1. È stata fornita una nuova password
      // 2. Non è un account Google (o l'utente vuole impostare una password locale)
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
          googleId: updatedUser.googleId,
          isEmailVerified: updatedUser.isEmailVerified,
          token: updatedUser.generateAuthToken()
        }
      });
    } else {
      res.status(404);
      throw new Error('Utente non trovato');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Gestisce il logout (principalmente per frontend)
// @route   GET /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};

// @desc    Verifica token JWT
// @route   GET /api/auth/verify
// @access  Public
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token non fornito'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        avatar: user.avatar || '',
        googleId: user.googleId,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }
    next(error);
  }
};



