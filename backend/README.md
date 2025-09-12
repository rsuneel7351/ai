# Agent Backend

Express.js server with PostgreSQL database and OpenRouter API integration for chat functionality.

## Features

- 🚀 Express.js server with TypeScript
- 🐘 PostgreSQL database integration
- 🤖 OpenRouter API integration (GPT-4o)
- 💬 Chat API with conversation history
- 🔒 CORS enabled for frontend communication
- 🛡️ Security middleware (Helmet)
- 📊 Request logging (Morgan)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
SITE_URL=http://localhost:3000
SITE_NAME=Agent App

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE agent_db;
```

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Chat
- **POST** `/api/chat` - Send a message and get AI response
  - Request body:
    ```json
    {
      "user_id": 101,
      "message": "How many attempts I used in taxation exam?"
    }
    ```
  - Response:
    ```json
    {
      "reply": "I don't have access to your specific exam records..."
    }
    ```

### History
- **GET** `/api/chat/history/:userId` - Get user's conversation history
  - Response:
    ```json
    {
      "history": [
        {
          "message": "Hello",
          "reply": "Hi there! How can I help you?",
          "created_at": "2024-01-01T12:00:00.000Z"
        }
      ]
    }
    ```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

## Error Handling

The server includes comprehensive error handling:
- Input validation
- Database connection errors
- OpenRouter API errors
- Graceful shutdown handling

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (development)
- `http://localhost:5173` (Vite dev server)
- Production domains (configure in environment)

## Security

- Helmet.js for security headers
- Input validation and sanitization
- Error message sanitization in production
- CORS protection
