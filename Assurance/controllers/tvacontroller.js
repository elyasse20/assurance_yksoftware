import TVAMODEL from '../models/TvaModel.js';

export const getTVA = async (req, res) => {
    try {
        res.status(200).json(await TVAMODEL.find());
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const addTVA = async (req, res) => {
    try {
        const { rate, isActive } = req.body;
        if (isActive) await TVAMODEL.updateMany({}, { $set: { isActive: false } });
        const TVA = await TVAMODEL.create({ rate, isActive });
        res.status(201).json(TVA);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteTVA = async (req, res) => {
    try {
        await TVAMODEL.findByIdAndDelete(req.params.id);
        res.status(200).json("deleted successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateTVA = async (req, res) => {
    try {
        const { rate, isActive } = req.body;
        if (isActive) await TVAMODEL.updateMany({}, { $set: { isActive: false } });
        await TVAMODEL.findByIdAndUpdate({ _id: req.params.id }, { rate, isActive });
        res.status(200).json("updated successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const getACtiveTVA = async (req, res) => {
    try {
        const activeTva = await TVAMODEL.findOne({ isActive: true });
        res.status(200).json(activeTva);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
