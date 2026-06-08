# RealEstate Platform

Full-stack real estate app built with React, Node.js/Express, MySQL, Socket.IO, optional MongoDB, and report exports.

## What Is Included

- Property listings with filters, images, amenities, favorites, and view tracking
- Viewings, offers, transactions, reviews, agencies, agents, plans, subscriptions, and payments webhook
- Messaging with Socket.IO events
- Reports with CSV, Excel, PDF export and Recharts preview charts
- MySQL migrations and seed data for a demo database
- Optional MongoDB models for property view logs and archives
- Postman collection and Swagger annotation source

## Requirements

- Node.js 18+
- npm
- MySQL 8+
- MongoDB optional
- VS Code optional, but recommended

## Beginner MySQL Setup In VS Code

This project uses MySQL, not SQLite. If you installed a VS Code extension named something like SQLite, that extension is not enough for this project.

Install these tools first:

1. Install Node.js LTS from `https://nodejs.org/`
2. Install MySQL Community Server from `https://dev.mysql.com/downloads/mysql/`
3. Install MySQL Workbench from `https://dev.mysql.com/downloads/workbench/`
4. Install VS Code from `https://code.visualstudio.com/`

During MySQL installation:

- Keep the default port `3306`.
- Create or remember the MySQL `root` password.
- If it asks for authentication method, choose the recommended/default option.

Recommended VS Code extension:

- Search Extensions for `MySQL` or `SQLTools`.
- Install `SQLTools` and the `SQLTools MySQL/MariaDB Driver`, or install another MySQL client extension.
- Do not use a SQLite-only extension for this project.

Create a MySQL connection in VS Code:

```text
Host: localhost
Port: 3306
User: root
Password: your_mysql_password
Database: realestate_db
```

If `realestate_db` does not appear yet, run the database setup command in the next section first.

Check MySQL from terminal:

```bash
mysql -u root -p
```

Enter your MySQL password. If you see `mysql>`, it works. Exit with:

```sql
exit;
```

If the `mysql` command is not found, use MySQL Workbench to connect with the same host, port, user, and password.

## Quick Start

From the project root:

```bash
cd "/path/to/lab-2"
```

### 1. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` if your MySQL user, password, or host are different.

Default backend URL:

```text
http://localhost:5001
```

### 2. Create And Seed Database

Run this from the project root:

```bash
mysql -u root -p < database/run-all.sql
```

If your MySQL root user has no password:

```bash
mysql -u root < database/run-all.sql
```

This creates `realestate_db`, applies all migrations, and loads demo seed data.

### 3. Start Backend

```bash
cd backend
npm install
npm run dev
```

Health check:

```text
http://localhost:5001/api
```

### 4. Configure Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Frontend URL:

```text
http://localhost:3000
```

## Demo Accounts

These are created by `database/schema.sql`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@realestate.local` | `Admin123!` |
| Buyer | `buyer@realestate.local` | `Buyer123!` |
| Seller | `seller@realestate.local` | `Seller123!` |

Seeded sellers and agents use the seller password hash from the demo seller account.

## Optional MongoDB

The app runs without MongoDB. If MongoDB is not configured, the backend logs the fallback and continues with SQL.

To enable Mongo locally:

```env
MONGO_URI=mongodb://localhost:27017/realestate
MONGO_ARCHIVE_ENABLED=true
MONGO_ARCHIVE_CRON=0 3 * * *
```

More details are in [NOSQL.md](./NOSQL.md).

## API Testing

Import this file into Postman:

```text
docs/postman-collection.json
```

Set collection variables:

- `baseUrl`: `http://localhost:5001/api`
- `token`: JWT returned by `POST /api/auth/login`

Swagger annotations live in:

```text
backend/docs/fadilSwaggerAnnotations.js
```

## Useful Docs

- [DATABASE.md](./DATABASE.md)
- [NOSQL.md](./NOSQL.md)
- [AGENCIES_AGENTS_MODULE_SUMMARY.md](./AGENCIES_AGENTS_MODULE_SUMMARY.md)

## Common Issues

If the frontend shows failed API requests, confirm:

- backend is running on port `5001`
- `frontend/.env` has `REACT_APP_API_BASE=http://localhost:5001/api`
- MySQL has the seeded `realestate_db`

If protected API calls fail, log in again and update the Postman `token` variable.
