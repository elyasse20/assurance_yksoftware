import Nature from '../models/natureModel.js';

export const getNatures = async (req, res) => {
    try {
        res.status(200).json(await Nature.find());
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const addNature = async (req, res) => {
    try {
        const { name } = req.body;
        const nature = await Nature.create({ name });
        res.status(201).json(nature);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteNature = async (req, res) => {
    try {
        await Nature.findByIdAndDelete(req.params.id);
        res.status(200).json("deleted successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateNature = async (req, res) => {
    try {
        const { name } = req.body;
        await Nature.findByIdAndUpdate({ _id: req.params.id }, { name });
        res.status(200).json("updated successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
