require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'brain.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to brain.db');
  }
});

// API Endpoints
app.get('/api/knowledge', (req, res) => {
  db.all('SELECT * FROM knowledge ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/business', (req, res) => {
  db.all('SELECT * FROM business ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/brand-voice', (req, res) => {
  db.all('SELECT * FROM brand_voice ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin endpoint (basic example)
app.get('/admin', (req, res) => {
  res.send('<h1>Admin Dashboard</h1><p>Welcome to your Second Brain Admin Panel. (Future MCP connection point)</p>');
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
