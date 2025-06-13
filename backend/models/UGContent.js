import mongoose from 'mongoose';

const ugContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['review', 'comment', 'photo'],
    required: [true, 'Il tipo di contenuto è obbligatorio']
  },
  spot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spot',
    required: [true, 'Lo spot associato è obbligatorio']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utente è obbligatorio']
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'review' || this.type === 'comment';
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.type === 'review';
    }
  },
  imageUrl: {
    type: String,
    required: function() {
      return this.type === 'photo';
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indice per trovare rapidamente tutti i contenuti di uno spot
ugContentSchema.index({ spot: 1, type: 1 });

// Indice per trovare rapidamente tutti i contenuti di un utente
ugContentSchema.index({ user: 1, type: 1 });

// Indice per ricerca testuale
ugContentSchema.index({ content: 'text', tags: 'text' });

// Metodo per verificare se un utente ha messo like
ugContentSchema.methods.isLikedByUser = function(userId) {
  return this.likedBy.some(id => id.toString() === userId.toString());
};

const UGContent = mongoose.model('UGContent', ugContentSchema);

export default UGContent;
