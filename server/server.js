const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');


const PORT = process.env.PORT || 4000;

// ✅ Enable CORS for your React app
app.use(cors({
  origin: "http://localhost:5173", // allow frontend origin
  methods: ["GET"],
  allowedHeaders: ["Content-Type"]
}));

// Serve static assets first
app.use(express.static(path.join(__dirname, 'public')));

// Serve React build
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Wildcard (Express v5 safe)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
