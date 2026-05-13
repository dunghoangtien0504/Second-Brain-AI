require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'brain.db');
const resend = new Resend(process.env.RESEND_API_KEY);

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

// CRM: Lead Submission
app.post('/api/submit-lead', async (req, res) => {
  const { name, email, phone } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Vui lòng điền đủ tên và email.' });
  }

  // 1. Save to CRM (Database)
  db.run(
    'INSERT INTO leads (name, email, phone) VALUES (?, ?, ?)',
    [name, email, phone],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // 2. Send Automation Email via Resend
      try {
        await resend.emails.send({
          from: 'Second Brain AI <onboarding@resend.dev>',
          to: email,
          subject: 'Chào mừng bạn đến với Second Brain AI 🧠',
          html: `
            <h1>Chào ${name}!</h1>
            <p>Cảm ơn bạn đã quan tâm đến hệ thống Second Brain AI.</p>
            <p>Mình đã nhận được thông tin của bạn. Trong vòng 15 phút tới, mình sẽ gửi tài liệu chi tiết qua email này.</p>
            <p>Nếu cần hỗ trợ gấp, hãy nhắn Zalo cho mình qua số điện thoại trên web nhé.</p>
            <br>
            <p>Trân trọng,</p>
            <p><strong>Dũng Hoàng - Second Brain AI</strong></p>
          `
        });
        res.json({ success: true, message: 'Đã lưu thông tin và gửi email xác nhận!' });
      } catch (emailErr) {
        console.error('Email error:', emailErr);
        res.json({ success: true, message: 'Đã lưu thông tin, nhưng gửi email gặp lỗi.', warning: emailErr.message });
      }
    }
  );
});

// Admin endpoint: List Leads
app.get('/admin', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).send('Database error');
    
    let rowsHtml = rows.map(r => `
      <tr>
        <td style="border:1px solid #444;padding:8px">${r.created_at}</td>
        <td style="border:1px solid #444;padding:8px">${r.name}</td>
        <td style="border:1px solid #444;padding:8px">${r.email}</td>
        <td style="border:1px solid #444;padding:8px">${r.phone || '-'}</td>
        <td style="border:1px solid #444;padding:8px">${r.status}</td>
      </tr>
    `).join('');

    res.send(\`
      <body style="background:#0c0c0c;color:#eee;font-family:sans-serif;padding:40px">
        <h1>CRM - Danh sách khách hàng mới</h1>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <thead>
            <tr style="background:#222">
              <th style="border:1px solid #444;padding:8px">Ngày</th>
              <th style="border:1px solid #444;padding:8px">Tên</th>
              <th style="border:1px solid #444;padding:8px">Email</th>
              <th style="border:1px solid #444;padding:8px">SĐT</th>
              <th style="border:1px solid #444;padding:8px">Trạng thái</th>
            </tr>
          </thead>
          <tbody>\${rowsHtml}</tbody>
        </table>
        <br>
        <a href="/" style="color: #ffd600"> Quay lại Website</a>
      </body>
    \`);
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
