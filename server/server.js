const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');


const PORT = process.env.PORT || 4000;


app.use(cors({
  origin: "https://modi-ji.vercel.app", 
  methods: ["GET"],
  allowedHeaders: ["Content-Type"]
}));


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));


app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
