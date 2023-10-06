const mongoose = require('mongoose');

const forgetPasswordRequestSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: () => {
      const uuidv4 = require('uuid/v4');
      return uuidv4();
    },
    required: true,
    index: { unique: true },
  },
  userid: {
    type: String,
    required: true,
  },
  isactive: {
    type: Boolean,
    default: true,
    required: true,
  },
}, {
  collection: 'forgetpasswordrequests', // Specify the correct collection name
});

const ForgetPasswordRequest = mongoose.model('ForgetPasswordRequest', forgetPasswordRequestSchema);

module.exports = ForgetPasswordRequest;
