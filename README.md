# 🏠 RealEstate — Full Stack App

A full-stack real estate platform built with **React**, **Node.js/Express**, and **MySQL**.

---

## 📁 Project Structure

```
realestate-project/
├── frontend/                  ← React app (Create React App)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js           ← React entry point
│   │   └── App.jsx            ← All components + pages
│   └── package.json
│
├── backend/                   ← Node.js + Express API
│   ├── server.js              ← Express app entry point
│   ├── .env.example           ← Copy to .env and fill in values
│   ├── package.json
│   ├── config/
│   │   ├── db.js              ← MySQL connection pool
│   │   └── schema.sql         ← Run this to create DB & table
│   ├── routes/
│   │   └── authRoutes.js      ← /api/auth/* route definitions
│   ├── controllers/
│   │   └── authController.js  ← register, login, getMe logic
│   └── middleware/
│       └── authMiddleware.js  ← JWT verifyToken + requireRole
│
└── README.md
```

---

## ⚡ Quick Start

### 1. Set up MySQL Database

Open MySQL and run:
```sql
source backend/config/schema.sql
```

Or paste the contents of `schema.sql` into MySQL Workbench / phpMyAdmin.

---

### 2. Configure the Backend

```bash
cd backend

# Copy the example env file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=realestate_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
```

Install dependencies and start:
```bash
npm install
node server.js
# → Server running on http://localhost:5000
```

---

### 3. Start the Frontend

```bash
cd frontend
npm install
npm start
# → App running on http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT token |
| GET | `/api/auth/me` | ✅ Bearer token | Get current user profile |

### Register example
```json
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "buyer"
}
```

### Login example
```json
POST /api/auth/login
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response:
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "name": "Jane Doe", "email": "...", "role": "buyer" }
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'buyer', 'seller') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 How Authentication Works

```
Register → bcrypt hashes password → saves to MySQL
Login    → bcrypt compares password → generates JWT
Frontend → stores JWT in localStorage
Dashboard → sends JWT in Authorization header → backend verifies → returns user from MySQL
Logout   → clears localStorage
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS (no external UI library) |
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2 driver) |
| Auth | bcryptjs (hashing) + jsonwebtoken (JWT) |
| State | React useState / localStorage |
