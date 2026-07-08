import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Vérifier si l'admin existe déjà
    const existing = await User.findOne({ email: 'admin@assurance.ma' });
    if (existing) {
      console.log('ℹ️  Admin déjà existant.');
      console.log('📧 Email    : admin@assurance.ma');
      console.log('🔑 Password : Admin@1234');
      await mongoose.disconnect();
      return;
    }

    const hashed = await bcrypt.hash('Admin@1234', 10);
    await User.create({
      username: 'Admin',
      email: 'admin@assurance.ma',
      password: hashed,
      role: 'admin',
    });

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email    : admin@assurance.ma');
    console.log('🔑 Password : Admin@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
