const mongoose = require('mongoose');
const User = require('./User'); // Import the User model if you haven't already

const expenseSchema = new mongoose.Schema({
  expenseamount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  loginuserid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  collection: 'addexpenses', // Specify the correct lowercase collection name
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
