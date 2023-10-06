
const mongoose = require('mongoose');
const jwtmiddleware = require('./jwtmiddleware');

const bcrypt = require('bcrypt');

const sequelize = require('../models/mongoose');

const User = require('../models/User');

const ForgetPasswordRequest = require('../models/ForgetPasswordRequest');





const passwordreset = async (req, res) => {
    try {
      const url = req.url;
  
      console.log(url);
  
      // Split the URL by forward slashes
      const segments = url.split('/');
  
      // Get the last segment
      const get_method_uuid = segments[segments.length - 1];
  
      console.log(get_method_uuid);
  
      // Check if the UUID exists and is active using Sequelize
      const forgetPasswordRequest = await ForgetPasswordRequest.findOne({
        uuid: get_method_uuid,
        isactive: true,
      });
  
      if (forgetPasswordRequest) {
        // Redirect to the password reset page
        res.redirect('/updatepassword.html');
      } else {
        console.log('UUID not found or inactive');
        // Handle the case where the UUID is not found or inactive
        // You might want to show an error message or redirect to an error page
      }
    } catch (error) {
      console.error(error);
      // Handle the error appropriately and send an error response to the client.
      res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  };
  







  const updatepassword = async (req, res) => {
    const { newpassword, jwttoken } = req.body;
  
    try {
      const decodedjwttoken = jwtmiddleware.jwt_decode(jwttoken);
      const userid = decodedjwttoken.userId;
  
      // Hash the password before updating it in the database
      const hashedPassword = await bcrypt.hash(newpassword, 10); // 10 is the number of bcrypt rounds
  
      try {
        // Update password
        await User.updateOne({ _id: userid }, { $set: { password: hashedPassword } });
  
        // Update isactive in the ForgetPasswordRequest collection
        await ForgetPasswordRequest.updateOne({ userid: userid }, { $set: { isactive: false }})  
        
  
        console.log('User password and isactive updated successfully');
        return res.status(200).json({ message: 'Password and isactive updated successfully' });
      } catch (error) {
       
        console.error('Error updating password: ', error);
        return res.status(500).json({ error: 'Error updating password' });
      }
    } catch (error) {
      console.error('Error updating password: ', error);
      return res.status(500).json({ error: 'Error updating password' });
    }
  };





module.exports = {
    passwordreset,
    updatepassword,
}