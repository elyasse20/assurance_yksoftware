import Production from '../models/productionModel.js';
import TvaModel from '../models/TvaModel.js';

// CREATE
export const createProduction = async (req, res) => {
  try {
    let tva = await TvaModel.findOne({ isActive: true });
    if (!tva) {
      tva = { rate: 0 };
    }

    const newProduction = await Production.create({
      ...req.body,
      tvaRate: tva.rate
    });
    res.status(201).json(newProduction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ — Get all
export const getAllProductions = async (req, res) => {
  try {
    const { client } = req.query;

    let query = {};
    if (client) {
      query.client = { $regex: `^${client.trim()}$`, $options: 'i' };
    }

    const productions = await Production.find(query);
    res.status(200).json(productions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ — Get one by ID
export const getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return res.status(404).json({ message: 'Production not found' });
    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
export const updateProduction = async (req, res) => {
  try {
    const updatedProduction = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduction)
      return res.status(404).json({ message: 'Production not found' });
    res.status(200).json(updatedProduction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE
export const deleteProduction = async (req, res) => {
  try {
    const deletedProduction = await Production.findByIdAndDelete(req.params.id);
    if (!deletedProduction)
      return res.status(404).json({ message: 'Production not found' });
    res.status(200).json({ message: 'Production deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
