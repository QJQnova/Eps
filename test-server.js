const express = require('express');
const app = express();

app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', time: new Date().toISOString() });
});

// Test auth endpoint
app.post('/api/test-auth', (req, res) => {
  console.log('Received auth request:', req.body);
  res.json({ success: true, received: req.body });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});