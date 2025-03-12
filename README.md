# Job Listing API

This is a Node.js and Express-based backend API for a job listing platform. It uses SQLite as the database and includes user authentication, job listing management, and bookmarking functionalities.

This is the backend for the Job Station application, deployed on Render.

**Backend Deployment Link:** ``` https://markanthony-backend-jobstation.onrender.com```

## Features
- User authentication (Signup, Login) with password hashing and JWT-based authentication.
- CRUD operations for job listings.
- Bookmarking job listings for later reference.
- SQLite database for data storage.
- Seed default users and job listings on startup.

## Technologies Used
- Node.js
- Express.js
- SQLite3
- bcrypt for password hashing
- JSON Web Token (JWT) for authentication
- CORS for cross-origin requests

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/seshu362/MarkAnthony-backend-JobStation.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   node server.js
   ```

## API Endpoints
### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with credentials

### Jobs
- `GET /api/jobs` - Fetch all jobs
- `POST /api/jobs` - Add a new job
- `GET /api/jobs/:id` - Fetch a single job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job

## Database Schema
- **Users**: Stores user information (id, name, email, password, etc.)
- **Jobs**: Stores job details (id, title, description, company, location, etc.)
  
---

### User Authentication

#### Signup
**Endpoint:** `POST /signup`
**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### Login
**Endpoint:** `POST /login`
**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:** JWT Token
```json
{
  "token": "your.jwt.token"
}
```

### Job Listings

#### Get All Jobs
**Endpoint:** `GET /jobs`

#### Create Job Listing
**Endpoint:** `POST /jobs`
**Authentication:** Bearer Token required
**Request Body:**
```json
{
  "companyName": "Tech Corp",
  "companyLogoUrl": "https://logo.clearbit.com/techcorp.com",
  "jobPosition": "Frontend Developer",
  "monthlySalary": 50000,
  "jobType": "Full-Time",
  "remote": "Remote",
  "location": "Hyderabad",
  "jobDescription": "Exciting opportunity for a frontend developer!",
  "aboutCompany": "Tech Corp is an innovative software company.",
  "skillsRequired": "React, JavaScript, CSS, HTML",
  "additionalInfo": "Experience with TypeScript is a plus"
}
```

#### Delete Job Listing
**Endpoint:** `DELETE /jobs/:id`
**Authentication:** Bearer Token required

### Bookmarks

#### Bookmark a Job
**Endpoint:** `POST /bookmarks`
**Authentication:** Bearer Token required
**Request Body:**
```json
{
  "jobId": 1
}
```

#### Get Bookmarked Jobs
**Endpoint:** `GET /bookmarks`
**Authentication:** Bearer Token required

## Database Schema
### Users Table
| Column     | Type    | Constraints      |
|------------|--------|-----------------|
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT |
| username   | TEXT    | NOT NULL        |
| email      | TEXT    | UNIQUE, NOT NULL |
| password   | TEXT    | NOT NULL        |
| createdAt  | TEXT    | DEFAULT CURRENT_TIMESTAMP |

### Job Listings Table
| Column         | Type    | Constraints      |
|---------------|--------|-----------------|
| id            | INTEGER | PRIMARY KEY AUTOINCREMENT |
| companyName   | TEXT    | NOT NULL        |
| companyLogoUrl | TEXT    | NULLABLE        |
| jobPosition   | TEXT    | NOT NULL        |
| monthlySalary | INTEGER | NULLABLE        |
| jobType       | TEXT    | CHECK(jobType IN ('Internship', 'Full-Time', 'Part-Time', 'Contractual')) |
| remote        | TEXT    | CHECK(remote IN ('Remote', 'In-Office')) |
| location      | TEXT    | NULLABLE        |
| jobDescription | TEXT    | NULLABLE        |
| aboutCompany  | TEXT    | NULLABLE        |
| skillsRequired | TEXT    | NULLABLE        |
| additionalInfo | TEXT    | NULLABLE        |
| userId        | INTEGER | FOREIGN KEY REFERENCES users(id) |
| createdAt     | TEXT    | DEFAULT CURRENT_TIMESTAMP |

### Bookmarks Table
| Column   | Type    | Constraints |
|----------|--------|-------------|
| id       | INTEGER | PRIMARY KEY AUTOINCREMENT |
| jobId    | INTEGER | FOREIGN KEY REFERENCES job_listings(id) |
| userId   | INTEGER | FOREIGN KEY REFERENCES users(id) |
| createdAt | TEXT   | DEFAULT CURRENT_TIMESTAMP |


