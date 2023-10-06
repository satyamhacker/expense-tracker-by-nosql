const mongoose = require('mongoose');
const User = require('../models/User');

 const Expense = require('../models/Expense');

 const bcrypt = require('bcrypt');
 const Razorpay = require('razorpay');

 const jwtmiddleware = require('./jwtmiddleware');


const razorpay = new Razorpay({
  key_id:'rzp_test_lVpET9yffy8mj1',                        //'YOUR_KEY_ID',
  key_secret:'whOWwGojLx4AeVELq9NmOAST',                   //'YOUR_KEY_SECRET',
});


// ////for razorpay;


const createorder = async (req, res) => {
  try {
    const options = {
      amount: 1000, // Amount in paise (example: 1000 paise = ₹10)
      currency: 'INR',
      receipt: 'order_receipt_123',
    };
    
    const order = await razorpay.orders.create(options);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
}



const updateorderstatus = async (req, res) => {
  try {
    const { orderId, status, jwttoken } = req.body;
    const decodedjwttoken = jwtmiddleware.jwt_decode(jwttoken);

    //console.log(decodedjwttoken.userId);

    if (status === 'success') {
      const ispremium = 1;
      await make_user_premium(decodedjwttoken.userId, ispremium);
    }

    // Update the order status in your database or perform other actions as needed
    // For demonstration purposes, we'll simply respond with the updated status
    const updatedStatus = 'updated'; // Modify this based on your implementation

    res.json({ status: updatedStatus });
  } catch (error) {
    console.error('Error updating order status: ', error);
    res.status(500).json({ error: 'Error updating order status' });
  }
};

async function make_user_premium(userid, ispremium) {
  try {
    // Update user's ispremium using Mongoose
    const user = await User.findOneAndUpdate(
      { _id: userid },
      { ispremium: ispremium },
      { new: true }
    );

    if (user) {
      console.log('User became premium');
    } else {
      console.error('User not found');
    }
  } catch (error) {
    console.error('Error updating user data: ', error);
    throw new Error('Error updating user data');
  }
}




const check_user_is_premium = async (req, res) => {
  try {
    const { jwttoken } = req.body;
    const jwt_decoded_token = jwtmiddleware.jwt_decode(jwttoken);

    const user = await User.findById(jwt_decoded_token.userId, {
      ispremium: 1,
      _id: 0,
    });

    if (!user) {
      console.error('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'test', results: user });
  } catch (error) {
    console.error('Error fetching user data: ', error);
    return res.status(500).json({ error: 'Error fetching user data' });
  }
};




// for signup;

const signupcreate = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    console.log('User created successfully');
    return res.status(201).json({ message: 'User created', insertedId: newUser._id }); // Access _id property for the inserted document
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Error creating user' });
  }
};

///for login;

// var loginuserid;

 const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input: Check if both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email
     const user = await User.findOne({ email: email });

    // Check if the user was found in the database
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the stored hashed password using bcrypt
    const passwordMatches = await bcrypt.compare(password, user.password);

    // If passwords do not match, return an unauthorized status
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    // If login is successful, log a message and return the user's id
    console.log('Login successful');
    const userId = user.id;

    const ispremium = user.ispremium;

    const encoded_jwt_token = jwtmiddleware.jwt_encode(userId, ispremium);

    return res.status(200).json({ message: 'Login successful', encoded_jwt_token });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Error during login' });
  }
};



const addExpense = async (req, res) => {
  const { expenseamount, description, category, jwt_encoded_token } = req.body;

  try {
    const jwt_decoded_token = jwtmiddleware.jwt_decode(jwt_encoded_token);

    // Validate request payload
    if (!expenseamount || !description || !category) {
      return res.status(400).json({ error: 'Expense amount, description, and category are required fields' });
    }

    // Create the new expense
    const newExpense = new Expense({
      expenseamount,
      description,
      category,
      loginuserid: jwt_decoded_token.userId, // Assuming userId is stored in the decoded JWT token
    });

    // Save the new expense to the database
    await newExpense.save();

    // Update the user's total expense
    await User.findOneAndUpdate(
      { _id: jwt_decoded_token.userId },
      { $inc: { totalexpense: expenseamount } },
      { new: true }
    );

    console.log('Expense added and user updated successfully');
    return res.status(201).json({ message: 'Expense added and user updated' });
  } catch (error) {
    console.error('Error during adding expense and updating user:', error);
    return res.status(500).json({ error: 'Error during adding expense and updating user' });
  }
};

// // Fetch all expenses for a user

const fetchExpenses = async (req, res) => {
  const {clickCount, expense_size_start_limit,expense_size_end_limit ,jwt_encoded_token } = req.body;

  try {
    const jwt_decoded_token = jwtmiddleware.jwt_decode(jwt_encoded_token);

    const loginuserid = jwt_decoded_token.userId;

    ////Fetch all expenses for the user within the specified limit

   

    ////test B;

    console.log(clickCount);
    console.log(expense_size_start_limit);
    console.log(expense_size_end_limit);

    const expenseSizeStartLimit = Number(expense_size_start_limit);
    const expenseSizeEndLimit = Number(expense_size_end_limit);

    if(clickCount=='1')
    {
      var expenses = await Expense.find({ loginuserid: loginuserid })
      .limit(expenseSizeStartLimit);
    }
    else
    {
      var expenses = await Expense.find({ loginuserid: loginuserid })
    .skip(expenseSizeStartLimit) // Skip the specified number of documents
    .limit(expenseSizeEndLimit - expenseSizeStartLimit); // Limit the number of returned documents


    }

    ////test A;

    console.log('Expenses fetched successfully');
    return res.status(200).json({ expenses });
  } catch (error) {
    console.error('Error during fetching expenses:', error);
    return res.status(500).json({ error: 'Error during fetching expenses' });
  }
};



const deleteuserexpense = async (req, res) => {
  const { id } = req.params;

  //console.log(req.params)

  try {
    
    try {
      // Find the expense and user within the session
      const expense = await Expense.findById(id);
      if (!expense) {
        throw new Error('Expense not found');
      }

      const userId = expense.loginuserid;
      const expenseAmount = expense.expenseamount;

      // Delete the expense
      await expense.deleteOne();

      // Update the user's total expense
      await User.findByIdAndUpdate(userId, { $inc: { totalexpense: -expenseAmount } });

      console.log('Expense deleted successfully');
      return res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
      // Rollback the transaction on error
      
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Error deleting expense' });
    }
  } catch (error) {
    console.error('Error starting transaction:', error);
    return res.status(500).json({ error: 'Error starting transaction' });
  }

};



























module.exports = {
  signupcreate,
  login,
  addExpense,
  fetchExpenses,
   deleteuserexpense,
   createorder,
   updateorderstatus,
  check_user_is_premium,
};

