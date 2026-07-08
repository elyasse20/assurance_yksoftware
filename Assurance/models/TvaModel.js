import mongoose from 'mongoose';

const TVAShema = new mongoose.Schema({
  rate: { type: Number, required: true },
  isActive: { type: Boolean, default: false }
});

export default mongoose.model('TVAMODEL', TVAShema);
