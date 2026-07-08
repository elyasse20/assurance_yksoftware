import Compagne from '../models/compagneModel.js';

// Create Compagne
export const createCompagne = async (req, res) => {
  try {
    const existsingCompagne = await Compagne.findOne({ compagneName: req.body.compagneName });
    if (existsingCompagne) {
      existsingCompagne.categories.push(...req.body.categories);
      await existsingCompagne.save();
      return res.status(200).json(existsingCompagne);
    }
    const compagne = await Compagne.create(req.body);
    res.status(201).json(compagne);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all Compagnes
export const getAllCompagnes = async (req, res) => {
  try {
    const compagnes = await Compagne.find();
    res.status(200).json(compagnes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single Compagne by ID
export const getCompagneById = async (req, res) => {
  try {
    const compagne = await Compagne.findById(req.params.id);
    if (!compagne) return res.status(404).json({ message: 'Compagne not found' });
    res.status(200).json(compagne);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Compagne
export const updateCompagne = async (req, res) => {
  try {
    const compagne = await Compagne.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!compagne) return res.status(404).json({ message: 'Compagne not found' });
    res.status(200).json(compagne);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Compagne
export const deleteCompagne = async (req, res) => {
  try {
    const compagne = await Compagne.findByIdAndDelete(req.params.id);
    if (!compagne) return res.status(404).json({ message: 'Compagne not found' });
    res.status(200).json({ message: 'Compagne deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
