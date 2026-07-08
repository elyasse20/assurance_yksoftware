// models/Parameter.js
import mongoose from 'mongoose';

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default mongoose.model('Parameter', parameterSchema);

