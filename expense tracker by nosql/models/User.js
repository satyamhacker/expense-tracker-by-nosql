const mongoose = require('mongoose');




const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  ispremium: {
    type: Boolean,
    default: false,
  },
  totalexpense: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'userssignup'  // Specify the correct lowercase collection name
});

const User = mongoose.model('User', userSchema);

module.exports = User;
