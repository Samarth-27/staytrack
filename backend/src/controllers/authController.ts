import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ status: 'error', message: 'Account is deactivated' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        token: generateToken(user._id.toString(), user.role),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
};

// Create initial owner/warden (Development only utility, remove in prod)
export const createInitialUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;
    
    const exists = await User.findOne({ username });
    if (exists) {
      res.status(400).json({ status: 'error', message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      passwordHash,
      role,
      isFirstLogin: false
    });

    res.status(201).json({ status: 'success', message: 'User created', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
