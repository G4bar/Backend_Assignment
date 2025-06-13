# Backend Assignment
Progettazione e Produzione Multimediale - Multimedia Design and Production 2024/2025

**Autore**: Gabriele Berti  
**Matricola**: 7073786

# Polling application API

A RESTful API for creating and managing polls. Users can register, create polls with multiple options, vote on polls, and view poll results.

## Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Edit `.env` with your secure settings
   - For production, generate strong secret keys (see below)
4. Run the application: `python run.py`

The API will be available at `http://localhost:5000/`

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
        "description": "Which programming language do you prefer?"
      },
      {
        "id": 2,
        "title": "Best Web Framework",
        "description": "What's your preferred web framework?"
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
    "polls": [
      {
        "id": 1,
        "title": "Favorite Programming Language",
        "description": "Which programming language do you prefer?"
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

## Authentication

Most endpoints require authentication. To authenticate:

1. Login to get the JWT access token
2. Include the token in the Authorization header for subsequent requests:
   - `Authorization: Bearer {access_token}`

## Error Handling

All errors return a JSON object with a `msg` field describing the error.
