import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import messageRoutes from './routes/message.routes.js'
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import commentRoutes from './routes/comment.routes.js';
import userRoutes from './routes/user.routes.js';
import http from 'node:http';
import { Server } from 'socket.io';
import { registerSocketHandler } from './sockets/index.js';

const app = express();

app.use(express.json());
app.use('/uploads',express.static(('uploads')))
app.use('/api/auth',authRoutes);
app.use('/api/posts/:postId/comments',commentRoutes);
app.use('/api/posts',postRoutes);
app.use('/api/users',userRoutes);
app.use('/api/messages', messageRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image too large (max 10MB)' });
    }
    return res.status(400).json({ error: 'Upload failed' });
  }

  console.error('unhandled error:', err);
  return res.status(500).json({ error: 'Something went wrong' });
});

const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });
app.use(express.static('public'));  

registerSocketHandler(io);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});