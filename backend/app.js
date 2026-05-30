import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './src/config/passport.js';
import authRouter from './src/routes/auth.js';
import chatRouter from './src/routes/chat.js';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/chats', chatRouter);

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

app.get('/user', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).send('User not authenticated');
});

app.get('/', (req, res) => res.send('Hello World!'));

export default app;
