import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './database';
import OpenRouterService from './openrouter';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


const openRouterService = new OpenRouterService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));




app.post('/api/chat', async (req, res) => {
  try {
    const { user_id, message } = req.body;


    if (!user_id || !message) {
      return res.status(400).json({
        error: 'Missing required fields: user_id and message are required'
      });
    }

    if (typeof user_id !== 'number' || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid data types: user_id must be a number and message must be a string'
      });
    }


    const reply = await openRouterService.generateReply(message, user_id);

    res.json({ reply });

  } catch (error) {
    console.error('❌ Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});


const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server will not start.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};


process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});


startServer();

export default app;
