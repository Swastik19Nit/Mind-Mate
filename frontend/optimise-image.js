import sharp from "sharp";
const inputPath = 'public/background.jpg';
const outputPath = 'public/background-optimized.jpg';

sharp(inputPath)
  .jpeg({ quality: 80 }) // Adjust quality to 80%
  .toFile(outputPath)
  .then(() => console.log('Image optimized successfully!'))
  .catch((err) => console.error('Error processing image:', err));
