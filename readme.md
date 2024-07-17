# Chat Application

This is a chat application built with Mesibo API. The frontend is developed using HTML, CSS, and JavaScript, and the backend uses Node.js, Express.js, and MongoDB. The application allows users to register, log in, and chat with an admin user. Only the admin can broadcast messages to all users.

## Features

- User registration and login
- Admin can send messages to all users
- Users can send messages only to the admin
- Mesibo API integration for messaging
- User list display similar to WhatsApp Web
- Chat messages stored in MongoDB

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v14 or later)
- [MongoDB](https://www.mongodb.com/) (local)
- [Git](https://git-scm.com/)

## Getting Started

Follow these steps to set up and run the application on your local machine.

### 1. Clone the Repository


git clone https://github.com/ramkrishna07/mesibo_chat_app
cd mesibo_chat_app

### 2. Install Dependencies

npm install


### 3. Set Up Environment Variables
Create a .env file in the root directory and add the following environment variables:


JWT_SECRET=your_jwt_secret

Replace your_jwt_secret with a secret key for JWT 

### 4. Start MongoDB
If you are using a local MongoDB instance, make sure MongoDB is running:

### 5. Start the Application
Start the application using nodemon to automatically restart the server on file changes:

npm start

The server will start on http://localhost:3000.

### 6. Start the Frontend

Now open the index.html right click on it and open with live server


### 7. Create a Super Admin

Use the /create-superadmin endpoint to create a super admin user. This is a one-time setup to create the super admin.

1.Open Postman or any API testing tool.
2.Make a POST request to http://localhost:3000/create-superadmin with the following JSON body:

{
  "firstName": "Super",
  "lastName": "Admin",
  "email": "superadmin@example.com",
  "password": "password123"
}

If successful, the response will be:

{
  "message": "Super admin created successfully"
}


### Additional Notes
Ensure the Mesibo API integration is properly set up by referring to the Mesibo Documentation.
Customize the UI as needed by modifying the HTML and CSS files


### Important Instruction

const MESIBO_APP_TOKEN = 'your Mesibo API key'; // Replace with your Mesibo API key in the server.js code
token: {
            appid: 'com.mesibo.chatapp',   // Replace with your Mesibo App Name in the server.js code
            expiry: 525600
        }