import { Router } from 'express';
import passport from '../config/passport.js';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('Redirect URI received:', req.originalUrl);
    next();
  },
  passport.authenticate('google', { failureRedirect: '/', failureMessage: true, session: true }),
  (req, res) => {
    req.session.user = req.user;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/');
      }
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/app`);
    });
  }
);

router.get('/check', (req, res) => {
  res.json({ user: req.isAuthenticated() && req.user ? req.user : null });
});

export default router;
