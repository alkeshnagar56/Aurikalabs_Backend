# Aurika Labs – Backend

Backend server for **Aurika Labs**, a collaborative project management and real-time communication platform designed for teams to manage projects, tasks, discussions, and activities efficiently.

---

## Tech Stack

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* Socket.IO
* JSON Web Tokens (JWT)
* bcrypt.js

---

## Core Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes

### Project Management

* Create Projects
* Update Projects
* Delete Projects
* Project Member Management
* Role-Based Permissions

### Task Management

* Create Tasks
* Update Tasks
* Delete Tasks
* Task Assignment
* Task Priorities
* Task Status Tracking
* Kanban Workflow

### Real-Time Collaboration

* Real-Time Chat
* Typing Indicators
* Read Receipts
* Online Presence
* Socket.IO Integration

### Comments System

* Task Comments
* Real-Time Comment Updates
* Comment Deletion
* User-Based Comment Permissions

### Activity Tracking

* Task Created Activities
* Task Updated Activities
* Task Deleted Activities
* Task Movement Tracking
* Comment Activities
* Real-Time Activity Feed

---

## Folder Structure

backend/

├── controllers/

├── middleware/

├── models/

├── routes/

├── sockets/

├── utils/

├── server.js

├── package.json

└── .env

---

## Environment Variables

Create a `.env` file in the backend root directory:

PORT=5000

DB_URL=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_ORIGIN=http://localhost:5173

---

## Installation

Clone the repository:

```bash
git clone https://github.com/alkeshnagar56/Aurika-Labs.git
```

Navigate to backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm start
```

Server will run on:

```text
http://localhost:5000
```

---

## API Features

### Authentication APIs

* Signup
* Login
* Logout
* Get User Profile

### Project APIs

* Create Project
* Update Project
* Delete Project
* Add Members
* Remove Members
* Get Project Details

### Task APIs

* Create Task
* Update Task
* Delete Task
* Fetch Tasks
* Assigned Tasks

### Comment APIs

* Create Comment
* Get Task Comments
* Delete Comment

### Activity APIs

* Create Activity
* Fetch Project Activities
* Real-Time Activity Updates

### Chat APIs

* Create Conversation
* Send Messages
* Fetch Messages
* Real-Time Messaging

---

## Socket.IO Events

### Project Events

* projectCreated
* projectUpdated
* projectDeleted

### Task Events

* taskCreated
* taskUpdated
* taskDeleted

### Comment Events

* commentCreated
* commentDeleted

### Activity Events

* activityCreated

### Chat Events

* message
* typing
* messagesRead
* presence

---

## Deployment

### Backend

Hosted on Render

### Database

Hosted on MongoDB Atlas

### Frontend

Hosted on Vercel

---

## Author

**Alkesh Nagar**

GitHub:
https://github.com/alkeshnagar56

---

## License

This project is developed for educational, learning, and portfolio purposes.
