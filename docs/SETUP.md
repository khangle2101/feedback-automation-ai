# Setup Guide

Hướng dẫn chi tiết cài đặt hệ thống Feedback Automation.

## Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt n8n](#cài-đặt-n8n)
3. [Cài đặt ngrok](#cài-đặt-ngrok)
4. [Tạo Google Form](#tạo-google-form)
5. [Cấu hình Google Sheets](#cấu-hình-google-sheets)
6. [Tạo Telegram Bot](#tạo-telegram-bot)
7. [Lấy OpenRouter API Key](#lấy-openrouter-api-key)
8. [Import n8n Workflow](#import-n8n-workflow)
9. [Cài đặt Google Apps Script](#cài-đặt-google-apps-script)
10. [Kiểm tra hệ thống](#kiểm-tra-hệ-thống)

---

## Yêu cầu hệ thống

- Windows/Mac/Linux
- Docker Desktop
- Tài khoản Google (Gmail)
- Tài khoản Telegram
- Kết nối Internet

---

## Cài đặt n8n

### Bước 1: Cài Docker Desktop

Tải và cài đặt từ: https://www.docker.com/products/docker-desktop

### Bước 2: Khởi động n8n

```bash
cd docker
docker-compose up -d
```

### Bước 3: Truy cập n8n

Mở trình duyệt: http://localhost:5678

Tạo tài khoản admin khi được yêu cầu.

---

## Cài đặt ngrok

### Bước 1: Tạo tài khoản

Đăng ký tại: https://ngrok.com/

### Bước 2: Tải ngrok

Tải file exe/binary phù hợp với hệ điều hành.

### Bước 3: Cấu hình auth token

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Bước 4: Chạy ngrok

```bash
ngrok http 5678
```

**Lưu ý quan trọng:** 
- URL ngrok thay đổi mỗi lần restart (bản miễn phí)
- Ghi lại URL để cập nhật vào Apps Script

---

## Tạo Google Form

### Các trường cần có:

| Thứ tự | Tên trường | Loại | Bắt buộc |
|--------|------------|------|----------|
| 1 | Email | Short answer | ✅ |
| 2 | Họ và tên | Short answer | ✅ |
| 3 | Số điện thoại | Short answer | ❌ |
| 4 | Nội dung phản hồi | Paragraph | ✅ |
| 5 | Mức độ hài lòng | Multiple choice (1-5) | ✅ |
| 6 | Loại phản hồi | Multiple choice | ✅ |

### Các lựa chọn cho "Loại phản hồi":
- Khiếu nại
- Góp ý
- Khen ngợi
- Hỗ trợ kỹ thuật
- Khác

### Liên kết với Sheets:
1. Click "Responses" tab
2. Click biểu tượng Google Sheets
3. Chọn "Create a new spreadsheet"

---

## Cấu hình Google Sheets

### Thêm các sheet:

1. **Dashboard** - Thống kê tổng quan
2. **System_Logs** - Log hệ thống
3. **Backup_Log** - Lịch sử backup

### Thêm cột vào "Form Responses 1":

| Cột | Tên | Mục đích |
|-----|-----|----------|
| H | AI_Classification | Kết quả phân loại AI |
| I | AI_Sentiment_Score | Điểm sentiment (1-10) |
| J | Processing_Status | Trạng thái xử lý |

---

## Tạo Telegram Bot

### Bước 1: Tạo bot

1. Mở Telegram, tìm @BotFather
2. Gửi lệnh `/newbot`
3. Đặt tên và username cho bot
4. Lưu lại **Bot Token**

### Bước 2: Lấy Chat ID

1. Nhắn tin cho bot của bạn (bất kỳ tin nhắn nào)
2. Mở URL sau trong trình duyệt:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Tìm giá trị `"chat":{"id":XXXXXXXX}`
4. Lưu lại **Chat ID**

---

## Lấy OpenRouter API Key

1. Truy cập: https://openrouter.ai/
2. Đăng ký/Đăng nhập
3. Vào Settings > API Keys
4. Tạo API key mới
5. Lưu lại **API Key**

**Model sử dụng:** `stepfun/step-3.5-flash:free` (miễn phí 100%)

---

## Import n8n Workflow

### Bước 1: Mở n8n

Truy cập http://localhost:5678

### Bước 2: Import workflow

1. Click "Add workflow"
2. Click menu (...) > Import from file
3. Chọn file `workflows/n8n-workflow.json`

### Bước 3: Cập nhật credentials

**Node "AI Analysis":**
- Tìm `YOUR_OPENROUTER_API_KEY_HERE`
- Thay bằng OpenRouter API Key của bạn

**Node "Send Telegram":**
- Tìm `YOUR_TELEGRAM_BOT_TOKEN_HERE`
- Thay bằng Bot Token của bạn
- Tìm `YOUR_TELEGRAM_CHAT_ID_HERE`
- Thay bằng Chat ID của bạn

### Bước 4: Publish workflow

Click nút **"Publish"** (góc trên bên phải)

---

## Cài đặt Google Apps Script

### Bước 1: Mở Apps Script

1. Mở Google Sheet
2. Extensions > Apps Script

### Bước 2: Copy code

1. Xóa code mặc định
2. Copy toàn bộ nội dung từ `src/google-apps-script.js`
3. Paste vào editor

### Bước 3: Cập nhật CONFIG

```javascript
const CONFIG = {
  N8N_WEBHOOK_URL: 'https://YOUR_NGROK_URL.ngrok-free.dev/webhook/feedback-webhook',
  // ...
  COMPANY_NAME: 'Tên Công Ty Của Bạn',
  SUPPORT_EMAIL: 'support@company.com',
};
```

### Bước 4: Chạy setup

1. Chọn function `setupAllTriggers`
2. Click "Run"
3. Cấp quyền khi được hỏi (Gmail, Drive, Sheets)

---

## Kiểm tra hệ thống

### Test 1: Webhook connection

```javascript
// Trong Apps Script, chạy:
testWebhookConnection()
```

Kết quả mong đợi: "Webhook connection successful!"

### Test 2: Email

```javascript
testConfirmationEmail()
```

Kiểm tra email đã nhận được chưa.

### Test 3: End-to-end

1. Mở Google Form
2. Submit một feedback test
3. Kiểm tra:
   - Google Sheet có cập nhật cột H, I, J không?
   - Telegram có nhận được thông báo không?
   - Email xác nhận có được gửi không?

---

## Xử lý sự cố

### Webhook lỗi

- Kiểm tra ngrok đang chạy
- Cập nhật URL mới vào CONFIG
- Kiểm tra n8n workflow đã Publish chưa

### Email không gửi

- Chạy lại `setupAllTriggers()`
- Cấp quyền Gmail

### Telegram không nhận

- Kiểm tra Bot Token
- Kiểm tra Chat ID
- Đảm bảo đã nhắn tin cho bot trước

---

## Hoàn thành!

Hệ thống đã sẵn sàng sử dụng. Mọi feedback mới sẽ được xử lý tự động.
