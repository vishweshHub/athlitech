const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('AthliTech API is running 🚀');
});

app.get('/workout', (req, res) => {
  res.json({
    message: 'Workout endpoint working'
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});