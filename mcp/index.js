const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, '../brain.db');
const indexHtmlPath = path.join(__dirname, '../index.html');
const resend = new Resend(process.env.RESEND_API_KEY);

const server = new Server(
  {
    name: 'biz-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to get DB connection
const getDb = () => new sqlite3.Database(dbPath);

// Define Tools
server.setRequestHandler(
  require('@modelcontextprotocol/sdk/types.js').ListToolsRequestSchema,
  async () => ({
    tools: [
      {
        name: 'add_knowledge',
        description: 'Thêm bài học hoặc insight mới vào bảng knowledge',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Tiêu đề bài học' },
            content: { type: 'string', description: 'Nội dung chi tiết' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'update_hero_title',
        description: 'Sửa tiêu đề chính (h1) của landing page',
        inputSchema: {
          type: 'object',
          properties: {
            new_title: { type: 'string', description: 'Tiêu đề mới' },
          },
          required: ['new_title'],
        },
      },
      {
        name: 'list_recent_leads',
        description: 'Xem danh sách khách hàng mới đăng ký gần đây',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Số lượng lead muốn xem', default: 5 },
          },
        },
      },
      {
        name: 'send_manual_email',
        description: 'Gửi email cho một khách hàng cụ thể',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email người nhận' },
            subject: { type: 'string', description: 'Tiêu đề email' },
            body: { type: 'string', description: 'Nội dung email (HTML)' },
          },
          required: ['email', 'subject', 'body'],
        },
      },
    ],
  })
);

server.setRequestHandler(
  require('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema,
  async (request) => {
    const { name, arguments: args } = request.params;
    const db = getDb();

    try {
      if (name === 'add_knowledge') {
        return new Promise((resolve) => {
          db.run(
            'INSERT INTO knowledge (title, content) VALUES (?, ?)',
            [args.title, args.content],
            function (err) {
              if (err) resolve({ content: [{ type: 'text', text: `Lỗi: ${err.message}` }], isError: true });
              resolve({ content: [{ type: 'text', text: `✅ Đã lưu kiến thức: "${args.title}"` }] });
            }
          );
        });
      }

      if (name === 'update_hero_title') {
        let html = fs.readFileSync(indexHtmlPath, 'utf8');
        // Simple regex to replace the main headline in the Hero section
        // Note: This depends on the headline structure in index.html
        const headlineRegex = /<h2 class="section-title">([^<]*)<\/h2>/; 
        // Wait, the index.html has multiple h2.section-title. Let's find the one in hero.
        // Actually, let's use a more specific target if possible.
        // Looking at index.html: line 97 of 2Brain-Community/index.html? 
        // No, I'm using Second-Brain-AI/index.html.
        
        const newHtml = html.replace(/<div class="sun-label">([^<]*)<\/div>/, `<div class="sun-label">${args.new_title}</div>`);
        fs.writeFileSync(indexHtmlPath, newHtml);
        return { content: [{ type: 'text', text: `✅ Đã đổi tiêu đề thành: "${args.new_title}"` }] };
      }

      if (name === 'list_recent_leads') {
        const limit = args.limit || 5;
        return new Promise((resolve) => {
          db.all('SELECT * FROM leads ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
            if (err) resolve({ content: [{ type: 'text', text: `Lỗi: ${err.message}` }], isError: true });
            const text = rows.map(r => `- ${r.created_at}: ${r.name} (${r.email})`).join('\n') || 'Chưa có lead nào.';
            resolve({ content: [{ type: 'text', text: `Danh sách ${rows.length} khách gần nhất:\n${text}` }] });
          });
        });
      }

      if (name === 'send_manual_email') {
        await resend.emails.send({
          from: 'Second Brain AI <onboarding@resend.dev>',
          to: args.email,
          subject: args.subject,
          html: args.body,
        });
        return { content: [{ type: 'text', text: `✅ Đã gửi email đến ${args.email}` }] };
      }

      return { content: [{ type: 'text', text: `Tool không tồn tại: ${name}` }], isError: true };
    } catch (error) {
      return { content: [{ type: 'text', text: `Lỗi hệ thống: ${error.message}` }], isError: true };
    } finally {
      db.close();
    }
  }
);

// Express wrapper for streamable-http (SSE)
const app = express();
let transport;

app.get('/mcp', (req, res) => {
  transport = new SSEServerTransport('/mcp/messages', res);
  server.connect(transport);
});

app.post('/mcp/messages', (req, res) => {
  if (transport) {
    transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No active SSE connection');
  }
});

app.get('/health', (req, res) => {
  res.send('MCP Server is UP');
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server running on http://0.0.0.0:${PORT}/mcp`);
});
