import Parametre from '../models/parametreModel.js';

export const getParametres = async (req, res) => {
    try {
        res.status(200).json(await Parametre.find());
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const addParametre = async (req, res) => {
    try {
        const { name } = req.body;
        const parametre = await Parametre.create({ name });
        res.status(201).json(parametre);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteParametre = async (req, res) => {
    try {
        await Parametre.findByIdAndDelete(req.params.id);
        res.status(200).json("deleted successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const showParametre = async (req, res) => {
    try {
        const p = await Parametre.findOne({ _id: req.params.id });
        res.status(200).json(p);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateParametre = async (req, res) => {
    try {
        const { name } = req.body;
        await Parametre.findByIdAndUpdate({ _id: req.params.id }, { name });
        res.status(200).json("updated successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
