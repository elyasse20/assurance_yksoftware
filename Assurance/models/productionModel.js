import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema({
  natureOperation: { 
    type: String, 
    required: true,
    trim: true
  },
  client: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  dateEff: { 
    type: Date, 
    required: true 
  },
  moisDem: { 
    type: String, 
    required: true,
    trim: true
  },
  compagne: {
    type: String, 
    required: true,
    trim: true
  },
  tvaRate: {
    type: Number,
    default: 0,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  numpolice: {
    type: String, 
    required: true,
    trim: true,
    index: true,
    unique: true
  },
  parameters: [
    {
      name: { 
        type: String, 
        required: true,
        trim: true
      },
      primes: { 
        type: Number,
        default: 0,
        min: 0
      },
      taxe: { 
        type: Number,
        default: 0,
        min: 0
      },
      taxepara: { 
        type: Number,
        default: 0,
        min: 0
      },
      accessoire: { 
        type: Number,
        default: 0,
        min: 0
      },
      cnpc: { 
        type: Number,
        default: 0,
        min: 0
      },
      _id: false
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual to calculate total TTC (Toutes Taxes Comprises)
 * Sum of all parameters: primes + taxes + taxepara + accessoire + cnpc
 */
productionSchema.virtual('montantTotal').get(function() {
  if (!this.parameters || !this.parameters.length) return 0;
  return this.parameters.reduce((sum, p) => {
    return sum + 
      (p.primes || 0) + 
      (p.taxe || 0) + 
      (p.taxepara || 0) + 
      (p.accessoire || 0) + 
      (p.cnpc || 0);
  }, 0);
});

export default mongoose.model('Production', productionSchema);


