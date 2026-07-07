import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, UserRole } from './src/models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack-v2';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const ownerPassword = await bcrypt.hash('owner@123', salt);
    const wardenPassword = await bcrypt.hash('warden@123', salt);

    await User.deleteMany({ username: { $in: ['owner', 'warden'] } });

    await User.create({
      username: 'owner',
      passwordHash: ownerPassword,
      role: UserRole.OWNER,
      isFirstLogin: false
    });
    console.log('✅ Owner seeded');

    await User.create({
      username: 'warden',
      passwordHash: wardenPassword,
      role: UserRole.WARDEN,
      isFirstLogin: false
    });
    console.log('✅ Warden seeded');

    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });
