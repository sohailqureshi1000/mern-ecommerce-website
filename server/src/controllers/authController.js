import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'An account with that email already exists' });
  }

  const user = await User.create({ name, email, password });
  return res.status(201).json({
    token: signToken(user._id),
    user: user.toPublicJSON(),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    token: signToken(user._id),
    user: user.toPublicJSON(),
  });
}

export async function me(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
}
