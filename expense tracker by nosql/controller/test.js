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