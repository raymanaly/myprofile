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

// 2. Database Connection (Render PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// 3. Auto-Create Table Logic
const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Database table is ready!");
    } catch (err) {
        console.error("❌ Table creation failed:", err);
    }
};
createTable();

// 4. The Home Route (Shows your HTML when someone visits your link)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. The Message Route (Saves form data)
app.post('/api/send-message', async (req, res) => {
  const { username, email, message } = req.body;

  try {
    const queryText = 'INSERT INTO contact_messages (username, email, message) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, email, message];
    
    const result = await pool.query(queryText, values);
    
    console.log('Message saved:', result.rows[0]);
    res.status(200).json({ success: true, message: 'Message stored in Render Database!' });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ success: false, error: 'Failed to save message' });
  }
});

// 6. The Secret Dashboard Route (MUST be above app.listen)
app.get('/system-admin-logs-888', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Logs</title>
                <style>
                    body { background: #121212; color: #BB86FC; font-family: 'VT323', monospace; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #333; }
                    th, td { padding: 12px; border: 1px solid #333; text-align: left; }
                    th { background: #1f1f1f; color: #03DAC6; }
                    tr:hover { background: #1a1a1a; }
                    h1 { border-bottom: 2px solid #03DAC6; display: inline-block; }
                </style>
            </head>
            <body>
                <h1>[SECRET_MESSAGES_LOG]</h1>
                <table>
                    <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Message</th>
                    </tr>
        `;

        result.rows.forEach(msg => {
            html += `
                <tr>
                    <td>${new Date(msg.created_at).toLocaleString()}</td>
                    <td>${msg.username}</td>
                    <td>${msg.email}</td>
                    <td>${msg.message}</td>
                </tr>
            `;
        });

        html += `
                </table>
            </body>
            </html>
        `;
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not load messages.");
    }
});

// 7. Start the Server (ALWAYS keep this as the very last line)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});
