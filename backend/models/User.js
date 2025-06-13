import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Inserisci un indirizzo email valido']
  },
  password: {
    type: String,
    required: function() {
      // La password è richiesta solo se non si sta usando l'autenticazione OAuth
      return !this.googleId;
    },
    minlength: [6, 'La password deve essere di almeno 6 caratteri']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  // Campi per OAuth Google
  googleId: {
    type: String,
    unique: true,
    sparse: true // Permette valori null/undefined e mantiene l'unicità solo per valori esistenti
  },
  // Campi per verifica email
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  confirmationToken: {
    type: String
  },
  confirmationTokenExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
  type: String
},
resetPasswordExpires: {
  type: Date
}
}, {
  timestamps: true
});

// Rimuovi la password dai risultati JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Metodo per generare token JWT
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Metodo per confrontare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) {
    return false; // Se non c'è password (utente OAuth), non può fare match
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Metodo per generare token di conferma email
userSchema.methods.generateConfirmationToken = function() {
  this.confirmationToken = crypto.randomBytes(32).toString('hex');
  this.confirmationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
  return this.confirmationToken;
};

// Middleware pre-save per hash della password
userSchema.pre('save', async function(next) {
  // Esegui hash solo se la password è stata modificata
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
