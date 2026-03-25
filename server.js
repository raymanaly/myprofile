const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Serve static files (Makes your CSS and Images work on Render)
app.use(express.static(path.join(__dirname)));

// 2. Database Connection (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// 3. The Home Route (Shows your HTML when someone visits your link)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. The Message Route (Saves form data to Neon)
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

// 5. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});
