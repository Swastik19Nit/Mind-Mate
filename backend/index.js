import app from './app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
});
