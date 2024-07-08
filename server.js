const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());  // Enable CORS

require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));


const User=require("./models/User"); 

// Endpoint to fetch all users
app.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, 'firstName lastName email isSuperAdmin'); // Fetch only necessary fields
        // Fetch the current user's details including isSuperAdmin field
        const currentUser = await User.findById(req.user.userId, 'firstName lastName email isSuperAdmin');

        if (!currentUser) {
            return res.status(404).send({ message: 'Current user not found' });
        }
        res.json({ currentUser, users });
    } catch (error) {
        res.status(500).send({ message: 'Error fetching users', error: error.message });
    }
});

const axios = require('axios');

const MESIBO_API_URL = 'https://api.mesibo.com/backend/';
const MESIBO_APP_TOKEN = 'eslrd5k52tqddof1i7b60s9abdt76b5nffqsnrfp0myv6sqb63hahf0o7im2wph7'; // Replace with your Mesibo API key

async function createMesiboUser(userId, userName) {
    try {
        const response = await axios.post(MESIBO_API_URL, {
            op: 'useradd',
            token: MESIBO_APP_TOKEN,
            user: {
                address: userId,
                name: userName,
                token: {
                    appid: 'com.mesibo.chatapp',
                    expiry: 525600
                }
            }
        });

        return response.data.user.token;
    } catch (error) {
        console.error('Error creating Mesibo user:', error);
        throw error;
    }
}
// Register route
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, email, password: hashedPassword });
        // await user.save();

        // Create Mesibo user and generate token
        const mesiboToken = await createMesiboUser(email, `${firstName} ${lastName}`);
        user.mesiboToken = mesiboToken;
        await user.save();

        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error registering user', error: error.message });
    }
});

// Create a super admin user manually (one-time setup)
app.post('/create-superadmin', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isSuperAdmin: true // Set this user as super admin
    });
        const mesiboToken = await createMesiboUser(email, `${firstName} ${lastName}`);
        user.mesiboToken = mesiboToken;
        await user.save();
        res.status(201).send({ message: 'Super admin created successfully' });
    } catch (error) {
        res.status(400).send({ message: 'Error creating super admin', error: error.message });
    }
});


// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret);

        res.send({ token, mesiboToken: user.mesiboToken, email: user.email });
    } catch (error) {
        res.status(500).send({ message: 'Error logging in', error: error.message });
    }
});


// Logout route
app.post('/logout', (req, res) => {
    // Typically, no action needed on server-side for JWT token, it's stateless
    res.send({ message: 'Logout successful' });
});

const Message = require('./models/Message');

// Endpoint to save a message
app.post('/message', authenticateToken, async (req, res) => {
    const { sender, receiver, message } = req.body;
    const newMessage = new Message({ sender, receiver, message });
    try {
        await newMessage.save();
        res.status(201).send({ message: 'Message saved successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error saving message', error: error.message });
    }
});


// Endpoint to fetch messages between two users
app.get('/messages', authenticateToken, async (req, res) => {
    const { user1, user2 } = req.query;
    try {
        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching messages', error: error.message });
    }
});



// Middleware to verify token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).send({ message: 'Access denied, no token provided' });

    const token = authHeader.split(' ')[1]; // Extract token after 'Bearer '
    if (!token) return res.status(401).send({ message: 'Access denied, no token provided' });

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) return res.status(401).send({ message: 'Invalid token' });

        req.user = decoded;
        next();
    });
}



// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
    res.send({ message: 'This is a protected route' });
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
