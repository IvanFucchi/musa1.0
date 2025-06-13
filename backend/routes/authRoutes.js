import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import { protect, admin } from '../middleware/auth.js';

import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  verifyToken,
} from '../controllers/authController.js';

const router = express.Router();

// Registrazione e login tradizionali
router.post('/register', registerUser);
router.post('/login', loginUser);

// Verifica token *************
router.get('/verify', verifyToken);

// Logout
router.get('/logout', logoutUser);

// Verifica email !!!!!!!
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Reset password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Profilo utente (protetto)
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    try {
      // Genera JWT token
      const token = req.user.generateAuthToken();

      // Reindirizza al frontend con il token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/oauth-callback?token=${token}`);
    } catch (error) {
      console.error('Errore nella generazione del token:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);


export default router;
