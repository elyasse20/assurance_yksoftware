import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['particulier', 'societe'],
    required: true
  },
  cin: {
    type: String,
    required: function () { return this.type === 'particulier'; }
  },
  nom: { 
    type: String, 
    required: true,
    trim: true,
    index: true 
  },
  prenom: {
    type: String,
    required: function () { return this.type === 'particulier'; },
    trim: true
  },
  tel: { 
    type: String, 
    required: true,
    trim: true
  },
  adresse: { 
    type: String, 
    required: true,
    trim: true
  },
  doc: { 
    type: String, 
    required: true 
  },
  ice: {
    type: String,
    required: function () { return this.type === 'societe'; },
    match: [/^\d{15}$/, 'ICE must have 15 digits']
  },
  if: {
    type: String,
    required: function () { return this.type === 'societe'; },
    match: [/^\d+$/, 'IF must be numeric']
  },
  rc: {
    type: String,
    required: function () { return this.type === 'societe'; },
    match: [/^\d+$/, 'RC must be numeric']
  },
  date_debut: {
    required: true,
    type: Date,
    default: Date.now
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: { 
    type: Number, 
    default: 0,
    min: 0
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Client', clientSchema);

