import mongoose from 'mongoose';

const spotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Il nome dello spot è obbligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descrizione è obbligatoria']
  },
  type: {
    type: String,
    required: [true, 'Il tipo di spot è obbligatorio'],
    enum: ['artwork', 'venue', 'event', 'collection'],
    default: 'artwork'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Le coordinate sono obbligatorie'],
      index: '2dsphere'
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    }
  }],
  category: {
    type: String,
    enum: ['painting', 'sculpture', 'photography', 'architecture', 'installation', 'street_art', 'performance', 'digital', 'mixed', 'other'],
    default: 'other'
  },
  mood: {
    type: [String],
    enum: [
      'engaged', 
      'romantic', 
      'upbeat', 
      'glamour', 
      'spiritual', 
      'hedonist', 
      'humour', 
      'shocking', 
      'melancholy', 
      'mellow'
    ]
  },
  musicGenres: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  // Per eventi
  dateRange: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  // Per opere in collezioni o luoghi
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spot'
  },
  // Per luoghi o collezioni che contengono altre opere
  childrenCount: {
    type: Number,
    default: 0
  },
  // Informazioni di contatto
  contactInfo: {
    website: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    openingHours: {
      type: String,
      default: ''
    }
  },
  // Metadati
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indice per ricerca geografica
spotSchema.index({ 'location.coordinates': '2dsphere' });

// Indice per ricerca testuale
spotSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  'location.city': 'text',
  'location.country': 'text'
});

// Virtual per recensioni
spotSchema.virtual('reviews', {
  ref: 'UGContent',
  localField: '_id',
  foreignField: 'spot',
  justOne: false,
  match: { type: 'review' }
});

// Virtual per figli (opere in una collezione o luogo)
spotSchema.virtual('children', {
  ref: 'Spot',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false
});

// Metodo per calcolare la distanza da un punto
spotSchema.methods.getDistanceFrom = function(lat, lng) {
  // Implementazione del calcolo della distanza usando la formula di Haversine
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Raggio della Terra in km
  
  const dLat = toRad(lat - this.location.coordinates[1]);
  const dLon = toRad(lng - this.location.coordinates[0]);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(this.location.coordinates[1])) * Math.cos(toRad(lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

const Spot = mongoose.model('Spot', spotSchema);

// Alla fine dello schema, prima di esportare il modello
spotSchema.index({ coordinates: '2dsphere' });


export default Spot;
