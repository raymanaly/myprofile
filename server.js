const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware: This allows your server to understand JSON data from your form
app.use(cors());
app.use(express.json());

// 1. Setup the Connection Pool (The bridge to Neon)
// Vercel automatically provides the DATABASE_URL when you connect Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon/Vercel security
  }
});

// 2. The "Post Office" Route (Receives your messages)
app.post('/api/send-message', async (req, res) => {
  const { username, email, message } = req.body;

  try {
    const queryText = 'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, email, message];
    
    const result = await pool.query(queryText, values);
    
    console.log('Message saved:', result.rows[0]);
    res.status(200).json({ success: true, message: 'Message stored in Neon!' });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ success: false, error: 'Failed to save message' });
  }
});

// 3. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});