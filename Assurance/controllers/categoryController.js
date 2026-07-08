import Category from '../models/categoryModel.js';

export const getCategories = async (req, res) => {
    try {
        res.status(200).json(await Category.find());
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await Category.create({ name });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json("deleted successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        await Category.findByIdAndUpdate({ _id: req.params.id }, { name });
        res.status(200).json("updated successfully");
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
