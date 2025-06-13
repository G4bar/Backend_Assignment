# Backend Assignment
Progettazione e Produzione Multimediale - Multimedia Design and Production 2024/2025

**Autore**: Gabriele Berti  
**Matricola**: 7073786

**API URL:**: https://polls-api-production.up.railway.app
**CLIENT URL:**: https://polling-app-production-3be4.up.railway.app/index.html

## Client Application
The client is a completely static web application built with HTML, CSS, and JavaScript. It is hosted separately from the backend and communicates with the Flask API exclusively through RESTful endpoints. The client handles user authentication, poll creation, voting, and result visualization entirely on the frontend, making API calls as needed to persist and retrieve data.

# Polling application API

![Built with Flask](https://img.shields.io/badge/Built%20with-Flask-000000?logo=flask)
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)

A RESTful API for creating and managing polls. Users can register, create polls with multiple options, vote on polls, and view poll results.

### Railway Deployment

This application is configured for deployment on Railway.

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the configuration in `railway.json` and deploy the application
3. Set up the required environment variables in Railway project settings:
   - `SECRET_KEY`: For JWT and application security
   - `DATABASE_URL`: Your database connection string
   - `ADMIN_SECRET`: Secret key for admin user creation

The application will automatically deploy when you push changes to your repository.

## Local Development

To run the application locally, please checkout the **DEV** branch which contains the necessary configuration for local development

## API Documentation

### Authentication Endpoints

#### Register a new user

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "username": "example_user",
    "password": "secure_password"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "msg": "User created"
  }
  ```
- **Error Response**: `409 Conflict` if username already exists
  ```json
  {
    "msg": "User already exists"
  }
  ```

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request body**:
  ```json
  {
    "username": "example_user",
    "password": "secure_password"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Response**: `401 Unauthorized` if credentials are invalid
  ```json
  {
    "msg": "Invalid credentials"
  }
  ```

### Poll Endpoints

#### Create a new poll

- **URL**: `/polls/create`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Request body**:
  ```json
  {
    "title": "Favorite Programming Language",
    "description": "Which programming language do you prefer?",
    "options": ["Python", "JavaScript", "Java", "C++"]
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "msg": "Poll created successfully",
    "poll_id": 1,
    "options_count": 4
  }
  ```
- **Error Response**: `400 Bad Request` if required fields are missing

#### Get a specific poll

- **URL**: `/polls/get/{poll_id}`
- **Method**: `GET`
- **Auth required**: No
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "title": "Favorite Programming Language",
    "description": "Which programming language do you prefer?",
    "created_at": "2023-09-20T15:30:45.123456",
    "creator_id": 1,
    "creator_name": "example_user",
    "is_active": true,
    "options": [
      {
        "id": 1,
        "text": "Python",
        "votes": 5
      },
      {
        "id": 2,
        "text": "JavaScript",
        "votes": 3
      },
      {
        "id": 3,
        "text": "Java",
        "votes": 2
      },
      {
        "id": 4,
        "text": "C++",
        "votes": 1
      }
    ]
  }
  ```
- **Error Response**: `404 Not Found` if poll doesn't exist

#### Vote on a poll

- **URL**: `/polls/vote`
- **Method**: `POST`
- **Auth required**: Yes (JWT token in Authorization header)
- **Request body**:
  ```json
  {
    "poll_id": 1,
    "option_id": 2
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "msg": "Vote recorded successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` if user already voted or inputs are invalid
  - `403 Forbidden` if poll is not active
  - `404 Not Found` if poll doesn't exist

#### Get all polls

- **URL**: `/polls/`
- **Method**: `GET`
- **Auth required**: No
- **Success Response**: `200 OK`
  ```json
  {
    "polls": [
      {
        "id": 1,
        "title": "Favorite Programming Language",
        "description": "Which programming language do you prefer?",
        "user_id": 1,
        "creator_name": "example_user"
      },
      {
        "id": 2,
        "title": "Best Web Framework",
        "description": "What's your preferred web framework?",
        "user_id": 2,
        "creator_name": "another_user"
      }
    ],
    "count": 2
  }
  ```

#### Get my polls

- **URL**: `/polls/my-polls`
- **Method**: `GET`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: `200 OK`
  ```json
  {
    "user_id": 1,
    "polls": [
      {
        "id": 1,
        "title": "Favorite Programming Language",
        "description": "Which programming language do you prefer?",
        "user_id": 1,
        "creator_name": "example_user"
      }
    ],
    "count": 1
  }
  ```

#### Delete a poll

- **URL**: `/polls/delete/{poll_id}`
- **Method**: `DELETE`
- **Auth required**: Yes (JWT token in Authorization header)
- **Success Response**: `200 OK`
  ```json
  {
    "msg": "Poll deleted successfully"
  }
  ```
- **Error Responses**:
  - `403 Forbidden` if user is not the poll creator
  - `404 Not Found` if poll doesn't exist

### Admin Endpoints

#### Create an admin user

- **URL**: `/auth/create-admin`
- **Method**: `POST`
- **Auth required**: No (but requires admin secret)
- **Request body**:
  ```json
  {
    "username": "admin_user",
    "password": "secure_password",
    "admin_secret": "YOUR_ADMIN_SECRET_HERE"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "msg": "Admin user created"
  }
  ```
- **Error Response**: 
  - `403 Forbidden` if admin secret is incorrect
  - `409 Conflict` if username already exists

## Admin Privileges

Admin users have the following privileges:
- Can delete polls created by any user

## Authentication

Most endpoints require authentication. To authenticate:

1. Login to get the JWT access token
2. Include the token in the Authorization header for subsequent requests:
   - `Authorization: Bearer {access_token}`

## Error Handling

All errors return a JSON object with a `msg` field describing the error.
