const mongoose = require('mongoose');

// User schema and model
const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    mesiboToken: String,
    isSuperAdmin: { type: Boolean, default: false } 
});

const User = mongoose.model('User', UserSchema);

module.exports=User;