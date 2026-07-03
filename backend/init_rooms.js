const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack').then(async () => {
  console.log('Connected to DB. Initializing rooms...');
  const rooms = [];
  for (let i = 101; i <= 118; i++) rooms.push({ roomNumber: i });
  for (let i = 201; i <= 221; i++) rooms.push({ roomNumber: i });
  
  for (let r of rooms) {
    const exists = await Room.findOne({ roomNumber: r.roomNumber });
    if (!exists) {
      await new Room({ roomNumber: r.roomNumber }).save();
      console.log('Created room', r.roomNumber);
    }
  }
  console.log('Finished initializing rooms!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
