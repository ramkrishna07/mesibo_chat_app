async function register() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
    });

    if (!response.ok) {
        const message = await response.json();
        alert(message.message);
        return;
    }

    const data = await response.json();
    alert(data.message);
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        

        if (response.ok) {
            
            // Store the JWT token and Mesibo token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('mesiboToken', data.mesiboToken);
            localStorage.setItem('email', data.email);
            window.location.href = 'home.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error.message);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('token');
    const mesiboToken = localStorage.getItem('mesiboToken');
    if (window.location.pathname.includes('home.html')) {
        if (!token || !mesiboToken) {
            alert('You are not logged in');
            window.location.href = 'register.html';
            return;
        }
        initializeMesibo(mesiboToken);
        fetchUsers(token);
    }
    

});

let mesibo;
let demo_destination = null;
let currentUser = null; // Track the current user
let messageCache = {}; // Cache to store displayed messages

async function fetchUsers(token) {
    try {
        const response = await fetch('http://localhost:3000/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        currentUser = data.currentUser;
        const users = data.users.filter(user => user._id !== currentUser._id);

        renderUserList(users,currentUser);
    } catch (error) {
        console.error('Error fetching users:', error.message);
    }
}

function renderUserList(users,currentUser) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    users.forEach(user => {
        if (currentUser.isSuperAdmin || user.isSuperAdmin) {
        const listItemHTML = `
                <li class="active" id="list">
                    <div class="d-flex bd-highlight">
                        <div class="img_cont">
                            <img src="" class="rounded-circle user_img">
                            <span class="online_icon"></span>
                        </div>
                        <div class="user_info">
                            <span>${user.firstName}</span>
                            <p>${user.email}</p>
                        </div>
                    </div>
                </li>
            `;

         // Create a temporary container for the new list item
         const tempContainer = document.createElement('div');
         tempContainer.innerHTML = listItemHTML;

         // Extract the new list item from the temporary container
         const newListItem = tempContainer.firstElementChild;

         // Add an event listener to the new list item
         newListItem.addEventListener('click', () => selectUser(user));

         // Append the new list item to the contacts list
         userList.appendChild(newListItem);
        }   
    });

}



async function selectUser(user) {
    const chatHeader = document.getElementById('chat-reciever');
    chatHeader.textContent = user.firstName;
    demo_destination=user.email;

    // Clear chat window for new conversation
    clearChatWindow();

    const token = localStorage.getItem('token');
     // Fetch messages between the current user and the selected user
     const email=user.email;
     const currentUserEmail = localStorage.getItem('email');
     try {
        const response = await fetch(`http://localhost:3000/messages?user1=${currentUserEmail}&user2=${email}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const messages = await response.json();

        // Clear the message cache for the selected user
        messageCache[email] = new Set();

        messages.forEach(message => {
            const messageType = message.sender === currentUserEmail ? 'sent' : 'received';
            if (!messageCache[email].has(message._id)) {
                displayMessage(message.message, messageType);
                messageCache[email].add(message._id);
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }

}



async function sendMessage() {
    if (!demo_destination) {
        alert('Please select a user to chat with');
        return;
    }

    // if (!currentUser.isSuperAdmin && demo_destination !== currentUser.email) {
    //     alert('You can only send messages to the super admin');
    //     return;
    // }
    
    var profile = mesibo.getProfile(demo_destination);
    console.log(profile);
    // var profile = mesibo.getProfile(demo_destination, 0);
    const messageInput = document.getElementById('message');
    const messageText=messageInput.value;

    if (messageText.trim() === '') return;

    var msg = profile.newMessage();
    msg.message = messageText;
    msg.send();

    // Save message to database
    const currentUserEmail = localStorage.getItem('email');
    try {
        const response = await fetch('http://localhost:3000/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                sender: currentUserEmail,
                receiver: demo_destination,
                message: messageText
            })
        });
        const savedMessage = await response.json();
        // Add saved message to cache to avoid duplicates
        if (!messageCache[demo_destination]) {
            messageCache[demo_destination] = new Set();
        }
        messageCache[demo_destination].add(savedMessage._id);
        
        // Display sent message
        displayMessage(messageText, 'sent');
    } catch (error) {
        console.error('Error saving message:', error);
    }

    // Display sent message
    // displayMessage(messageText, 'sent');

    messageInput.value = '';
}

function clearChatWindow() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = '';
}


function displayMessage(message,type) {
    const chatWindow = document.getElementById('chat-window');

    const messageDiv = `
    <div id="message_${type}" class="d-flex mb-4">
        <div class="img_cont_msg">
            <img src="" class="rounded-circle user_img_msg">
        </div>
        <div class="msg_cotainer ${type}">
            ${message}
            <span class="msg_time">8:40 AM, Today</span>
        </div>
    </div>
    `;



    // const messageDiv = document.createElement('div');
    // messageDiv.className = `message ${type}`;
    // messageDiv.textContent = message;
    chatWindow.innerHTML+=messageDiv;
    chatWindow.scrollTop = chatWindow.scrollHeight;
}



async function logout() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('mesiboToken');
        localStorage.removeItem('email');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error.message);
    }
}

function initializeMesibo(mesiboToken){
    function MesiboListener(o) {
        this.api = o;
    }

    // Initialize Mesibo
 mesibo = new Mesibo();
 mesibo.setAppName('com.mesibo.chatapp');
 mesibo.setAccessToken(mesiboToken);
 var listener = new MesiboListener(mesibo);
 mesibo.setListener(listener);
 // Set the name of the database
 mesibo.setDatabase("mesibo");

 // Start mesibo,
 mesibo.start();

 // Publish self profile
 const selfProfile = mesibo.getSelfProfile();
 selfProfile.setString("status", "Hey! I am using this app.");
 selfProfile.setString("name", "Raja");
 selfProfile.save();



 MesiboListener.prototype.Mesibo_onConnectionStatus = function(status, value) {
     
    console.log("Mesibo_onConnectionStatus: "  + status);
    
}

MesiboListener.prototype.Mesibo_onMessageStatus = function(msg) {
    var sender = msg.profile;
    console.log("Mesibo_onMessageStatus: to "  + sender.getNameOrAddress("") + " status: " + msg.getStatus() + " id: " + msg.mid);
}

MesiboListener.prototype.Mesibo_onMessage = function(msg) {

	if(msg.isIncoming()) {

        // displayMessage(msg.message,'received');
		var sender = msg.profile;
		if(msg.isGroupMessage()) {
			var group = msg.groupProfile;

		}

		// check if this message is realtime or read from the database
		if(msg.isRealtimeMessage()) {
			console.log("Mesibo_onMessage: from "  + sender.getNameOrAddress("") + " msg: " + msg.message);
		}

	} else if(msg.isOutgoing()) {

            /* messages you sent */
	       console.log("Mesibo_onMessage: sent a message with id: " + msg.message);
		   
		//    displayMessage({msg:msg},'sent');
        } else if(msg.isMissedCall()) {

        }
}
}
