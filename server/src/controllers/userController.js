import { User } from '../models/User.js';

export async function getProfile(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
}

export async function updateProfile(req, res) {
  const { name, email, phone, address, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    user.name = String(name).trim();
  }

  if (email !== undefined) {
    const nextEmail = String(email).trim().toLowerCase();
    if (!nextEmail) {
      return res.status(400).json({ message: 'Email cannot be empty' });
    }
    const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (taken) {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    user.email = nextEmail;
  }

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (address && typeof address === 'object') {
    user.address = {
      street: address.street ?? user.address?.street ?? '',
      city: address.city ?? user.address?.city ?? '',
      postalCode: address.postalCode ?? user.address?.postalCode ?? '',
      country: address.country ?? user.address?.country ?? '',
    };
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to set a new one' });
    }
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    user.password = newPassword;
  }

  await user.save();
  return res.json({ user: user.toPublicJSON() });
}
