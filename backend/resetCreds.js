const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staytrack')
  .then(async () => {
    console.log('Connected to DB, resetting credentials...');
    
    // We cannot use raw updateOne because of the password pre-save hash hook in Mongoose.
    // We need to fetch/create the user and call .save()

    let owner = await User.findOne({ username: 'owner' });
    if (!owner) {
      owner = new User({ username: 'owner', role: 'owner', name: 'StayTrack Owner' });
    }
    owner.password = 'owner@123';
    await owner.save();
    console.log('Owner reset successful.');

    let warden = await User.findOne({ username: 'warden' });
    if (!warden) {
      warden = new User({ username: 'warden', role: 'warden', name: 'StayTrack Warden' });
    }
    warden.password = 'warden@123';
    await warden.save();
    console.log('Warden reset successful.');

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
