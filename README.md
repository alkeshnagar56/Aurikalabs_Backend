# Aurika Labs – Backend

    This is the backend server for Aurika Labs, a real-time chat and project management application.

# Tech Stack

    Node.js

    Express.js

    MongoDB (MongoDB Atlas)

    Mongoose

    Socket.io

    JWT Authentication



# Features

    User signup and login

    JWT-based authentication

    Project and task management

    Real-time chat using Socket.io

    REST APIs





# Folder Structure
    backend/
    │── controllers/
    │── models/
    │── routes/
    │── middleware/
    │── server.js
    │── package.json
    │── .env





# Environment Variables

    Create a .env file in the backend root:


        PORT=5000
        DB_URL=mongourl
        JWT_SECRET=secretekey
        client_origin= client_url



# Run Project Locally

    Install dependencies:

        npm install


    Start server:

        npm start


    Server will run on:

        http://localhost:5000


Socket.io

    Socket.io is used for real-time messaging between users.
    CORS origin should be updated after frontend deployment.


Deployment

    Backend hosted on Render


Database hosted on MongoDB Atlas

Frontend hosted on Netlify / Vercel




Author

Alkesh Nagar
GitHub: https://github.com/alkeshnagar56