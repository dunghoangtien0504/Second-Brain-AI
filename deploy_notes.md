# Hướng dẫn Deploy Website lên VPS

## 1. Biến môi trường (.env) cần thiết trên VPS
Bạn cần tạo file `.env` tại thư mục `/opt/my-website` trên VPS với các giá trị sau:

```env
PORT=3000
BANK_ID=MB
BANK_ACCOUNT_NO=333303838
BANK_ACCOUNT_NAME=HOANG TIEN DUNG
MAILERLITE_API_KEY=...
MAILERLITE_GROUP_ID=...
```

## 2. Cổng lắng nghe
Server sẽ chạy mặc định tại cổng **3000**.

## 3. Lệnh khởi chạy
- Cài đặt thư viện: `npm install`
- Khởi chạy (production): `npm start`
- Khởi chạy với PM2 (khuyên dùng): `pm2 start server.js --name "my-website"`

## 4. Lưu ý quan trọng
- File `brain.db` không được đưa lên GitHub (đã nằm trong .gitignore). Bạn cần upload file này thủ công lên VPS bằng lệnh `scp`.
- Website sẽ được phục vụ qua Express server thay vì mở trực tiếp file HTML.
