import mongoose from 'mongoose';

const natureSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

export default mongoose.model('Nature', natureSchema);

