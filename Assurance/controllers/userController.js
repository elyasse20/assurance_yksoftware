import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/* --------------------------- REGISTER USER (ADMIN) --------------------------- */
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role || 'user'
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ------------------------------- GET USERS ------------------------------- */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ------------------------------ UPDATE USER ------------------------------ */
export const updateUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const updateData = { username, email, role };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    }).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Updated successfully', updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ------------------------------ DELETE USER ------------------------------ */
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ------------------------------- LOGIN USER ------------------------------- */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
