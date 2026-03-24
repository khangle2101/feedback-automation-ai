// ============================================
// FEEDBACK AUTOMATION SYSTEM - GOOGLE APPS SCRIPT v4
// Compatible with n8n workflow v7
// Features: Gmail integration + Google Drive backup
// ============================================

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  // Webhook Configuration
  // Replace with your ngrok URL when running
  N8N_WEBHOOK_URL: 'https://YOUR_NGROK_URL.ngrok-free.dev/webhook/feedback-webhook',
  
  // Sheet Names
  SHEET_NAME: 'Form Responses 1',
  LOG_SHEET: 'System_Logs',
  BACKUP_SHEET: 'Backup_Log',
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  
  // Email Configuration
  COMPANY_NAME: 'Your Company Name',           // UPDATE THIS
  SUPPORT_EMAIL: 'support@yourcompany.com',    // UPDATE THIS
  ENABLE_CONFIRMATION_EMAIL: true,
  ENABLE_DRAFT_RESPONSE: true,
  
  // Drive Backup Configuration
  BACKUP_FOLDER_NAME: 'Feedback_Automation_Backups',
  ENABLE_AUTO_BACKUP: true
};

// ============================================
// EMAIL TEMPLATES
// ============================================

const EMAIL_TEMPLATES = {
  // Template email xác nhận khi nhận feedback
  confirmation: {
    subject: '[{COMPANY}] Xác nhận tiếp nhận phản hồi - #{TICKET_ID}',
    body: `Kính gửi Quý khách {CUSTOMER_NAME},

Cảm ơn Quý khách đã dành thời gian gửi phản hồi đến {COMPANY}.

Chúng tôi xin xác nhận đã tiếp nhận phản hồi của Quý khách với thông tin chi tiết như sau:

------------------------------------------------------------
THÔNG TIN PHẢN HỒI
------------------------------------------------------------
Mã phản hồi:        #{TICKET_ID}
Thời gian tiếp nhận: {TIMESTAMP}
Loại phản hồi:      {FEEDBACK_TYPE}
Mức độ hài lòng:    {SATISFACTION}/5
------------------------------------------------------------

NỘI DUNG PHẢN HỒI:
"{FEEDBACK_CONTENT}"

------------------------------------------------------------

Phản hồi của Quý khách đã được chuyển đến bộ phận chuyên trách. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ làm việc.

Mọi thắc mắc xin vui lòng liên hệ:
- Email: {SUPPORT_EMAIL}
- Hotline: 1800-XXX-XXX (miễn phí)

Trân trọng cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của {COMPANY}.

------------------------------------------------------------
{COMPANY}
Customer Support Team
------------------------------------------------------------
* Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp.
`
  },
  
  // Template draft response cho NEGATIVE feedback
  negative_response: {
    subject: 'RE: [{COMPANY}] Phản hồi khiếu nại của Quý khách - #{TICKET_ID}',
    body: `Kính gửi Quý khách {CUSTOMER_NAME},

Trước tiên, thay mặt {COMPANY}, chúng tôi xin gửi lời xin lỗi chân thành đến Quý khách về trải nghiệm không tốt mà Quý khách đã gặp phải.

Chúng tôi đã tiếp nhận phản hồi của Quý khách:
"{FEEDBACK_CONTENT}"

------------------------------------------------------------
PHƯƠNG ÁN GIẢI QUYẾT
------------------------------------------------------------

Sau khi xem xét kỹ lưỡng, chúng tôi xin đề xuất phương án giải quyết như sau:

1. [Mô tả phương án giải quyết cụ thể]

2. [Các bước thực hiện tiếp theo]

3. [Thời gian hoàn thành dự kiến]

------------------------------------------------------------

Chúng tôi cam kết sẽ cải thiện chất lượng dịch vụ để mang đến trải nghiệm tốt hơn cho Quý khách trong tương lai.

Nếu Quý khách cần hỗ trợ thêm, vui lòng liên hệ trực tiếp với chúng tôi qua hotline 1800-XXX-XXX hoặc email {SUPPORT_EMAIL}.

Một lần nữa, chúng tôi xin chân thành cáo lỗi và cảm ơn Quý khách đã phản hồi để chúng tôi có cơ hội khắc phục.

Trân trọng,

[Họ và tên nhân viên]
[Chức vụ]
{COMPANY} - Customer Support Team
Email: {SUPPORT_EMAIL}
Hotline: 1800-XXX-XXX
`
  },
  
  // Template draft response cho POSITIVE feedback
  positive_response: {
    subject: 'RE: [{COMPANY}] Cảm ơn phản hồi tích cực từ Quý khách - #{TICKET_ID}',
    body: `Kính gửi Quý khách {CUSTOMER_NAME},

Chúng tôi vô cùng trân trọng và biết ơn những lời nhận xét tích cực mà Quý khách đã dành cho {COMPANY}.

Phản hồi của Quý khách:
"{FEEDBACK_CONTENT}"

Sự hài lòng của Quý khách là động lực to lớn để đội ngũ {COMPANY} tiếp tục nỗ lực và hoàn thiện dịch vụ mỗi ngày.

------------------------------------------------------------
ƯU ĐÃI DÀNH RIÊNG CHO QUÝ KHÁCH
------------------------------------------------------------

Để tri ân Quý khách đã tin tưởng và ủng hộ, chúng tôi xin gửi tặng:

- [Mã giảm giá / Ưu đãi đặc biệt cho lần mua tiếp theo]
- [Thông tin chương trình khách hàng thân thiết]

------------------------------------------------------------

Chúng tôi hy vọng sẽ tiếp tục được phục vụ Quý khách trong thời gian tới.

Trân trọng,

[Họ và tên nhân viên]
[Chức vụ]
{COMPANY} - Customer Support Team
Email: {SUPPORT_EMAIL}
Hotline: 1800-XXX-XXX
`
  },
  
  // Template draft response cho NEUTRAL feedback
  neutral_response: {
    subject: 'RE: [{COMPANY}] Phản hồi ý kiến của Quý khách - #{TICKET_ID}',
    body: `Kính gửi Quý khách {CUSTOMER_NAME},

Cảm ơn Quý khách đã dành thời gian chia sẻ ý kiến với {COMPANY}.

Phản hồi của Quý khách:
"{FEEDBACK_CONTENT}"

Mỗi ý kiến đóng góp từ Quý khách đều là nguồn thông tin quý giá giúp chúng tôi cải thiện và nâng cao chất lượng dịch vụ.

------------------------------------------------------------
PHẢN HỒI TỪ {COMPANY}
------------------------------------------------------------

[Nội dung phản hồi chi tiết theo từng vấn đề Quý khách nêu ra]

1. [Vấn đề 1]: [Giải đáp / Hướng xử lý]

2. [Vấn đề 2]: [Giải đáp / Hướng xử lý]

------------------------------------------------------------

Nếu Quý khách có bất kỳ thắc mắc nào thêm, vui lòng liên hệ với chúng tôi. Đội ngũ {COMPANY} luôn sẵn sàng hỗ trợ Quý khách.

Trân trọng,

[Họ và tên nhân viên]
[Chức vụ]
{COMPANY} - Customer Support Team
Email: {SUPPORT_EMAIL}
Hotline: 1800-XXX-XXX
`
  }
};

// ============================================
// MAIN TRIGGER FUNCTION
// ============================================

/**
 * Trigger chính - Được gọi khi có form submission mới
 */
function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = sheet.getSheetByName(CONFIG.SHEET_NAME);
  const lastRow = responseSheet.getLastRow();
  
  try {
    // Lấy dữ liệu từ form submission
    const data = extractFormData(e, lastRow);
    
    // Log bắt đầu xử lý
    logAction('FORM_SUBMIT', 'PROCESSING', `Row ${lastRow}: ${data.email}`);
    
    // Đánh dấu đang xử lý
    updateProcessingStatus(responseSheet, lastRow, 'PROCESSING');
    
    // Bước 1: Gửi email xác nhận cho khách hàng
    if (CONFIG.ENABLE_CONFIRMATION_EMAIL) {
      sendConfirmationEmail(data);
    }
    
    // Bước 2: Gửi đến n8n webhook để AI phân tích
    const result = sendToN8nWebhook(data);
    
    if (result.success) {
      // Cập nhật kết quả AI vào sheet
      updateAIResults(responseSheet, lastRow, result.aiResult);
      updateProcessingStatus(responseSheet, lastRow, 'COMPLETED');
      
      // Bước 3: Tạo draft email phản hồi dựa trên AI classification
      if (CONFIG.ENABLE_DRAFT_RESPONSE) {
        createDraftResponse(data, result.aiResult);
      }
      
      // Backup dữ liệu
      backupData(data, result.aiResult);
      
      logAction('WEBHOOK_SUCCESS', 'COMPLETED', `Row ${lastRow}: ${result.aiResult.classification}, Score: ${result.aiResult.sentimentScore}`);
    } else {
      updateProcessingStatus(responseSheet, lastRow, 'FAILED');
      logAction('WEBHOOK_ERROR', 'FAILED', result.error);
    }
    
  } catch (error) {
    logAction('SYSTEM_ERROR', 'ERROR', error.toString());
    updateProcessingStatus(responseSheet, lastRow, 'ERROR');
  }
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

/**
 * Gửi email xác nhận cho khách hàng
 */
function sendConfirmationEmail(data) {
  try {
    const ticketId = generateTicketId(data.rowNumber);
    const template = EMAIL_TEMPLATES.confirmation;
    
    const subject = fillTemplate(template.subject, data, ticketId);
    const body = fillTemplate(template.body, data, ticketId);
    
    // Gửi email
    GmailApp.sendEmail(data.email, subject, body, {
      name: CONFIG.COMPANY_NAME + ' - Customer Support',
      replyTo: CONFIG.SUPPORT_EMAIL
    });
    
    logAction('EMAIL_SENT', 'SUCCESS', `Confirmation email sent to ${data.email}, Ticket: ${ticketId}`);
    
    return { success: true, ticketId: ticketId };
  } catch (error) {
    logAction('EMAIL_ERROR', 'FAILED', `Failed to send confirmation to ${data.email}: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Tạo draft email phản hồi dựa trên AI classification
 */
function createDraftResponse(data, aiResult) {
  try {
    const ticketId = generateTicketId(data.rowNumber);
    const classification = (aiResult.classification || 'NEUTRAL').toUpperCase();
    
    // Chọn template dựa trên classification
    let template;
    switch (classification) {
      case 'NEGATIVE':
        template = EMAIL_TEMPLATES.negative_response;
        break;
      case 'POSITIVE':
        template = EMAIL_TEMPLATES.positive_response;
        break;
      default:
        template = EMAIL_TEMPLATES.neutral_response;
    }
    
    const subject = fillTemplate(template.subject, data, ticketId);
    const body = fillTemplate(template.body, data, ticketId);
    
    // Tạo draft email
    GmailApp.createDraft(data.email, subject, body, {
      name: CONFIG.COMPANY_NAME + ' - Customer Support',
      replyTo: CONFIG.SUPPORT_EMAIL
    });
    
    logAction('DRAFT_CREATED', 'SUCCESS', `Draft created for ${data.email}, Classification: ${classification}`);
    
    return { success: true };
  } catch (error) {
    logAction('DRAFT_ERROR', 'FAILED', `Failed to create draft for ${data.email}: ${error.toString()}`);
    return { success: false, error: error.toString() };
  }
}

/**
 * Fill template với dữ liệu thực tế
 */
function fillTemplate(template, data, ticketId) {
  return template
    .replace(/{COMPANY}/g, CONFIG.COMPANY_NAME)
    .replace(/{CUSTOMER_NAME}/g, data.fullName || 'Quý khách')
    .replace(/{EMAIL}/g, data.email)
    .replace(/{PHONE}/g, data.phone || 'N/A')
    .replace(/{FEEDBACK_CONTENT}/g, data.feedbackContent)
    .replace(/{FEEDBACK_TYPE}/g, data.feedbackType || 'Phản hồi chung')
    .replace(/{SATISFACTION}/g, data.satisfactionLevel || '3')
    .replace(/{TIMESTAMP}/g, data.timestamp)
    .replace(/{TICKET_ID}/g, ticketId)
    .replace(/{SUPPORT_EMAIL}/g, CONFIG.SUPPORT_EMAIL);
}

/**
 * Tạo Ticket ID unique
 */
function generateTicketId(rowNumber) {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
  return `FB${dateStr}-${String(rowNumber).padStart(4, '0')}`;
}

// ============================================
// GOOGLE DRIVE BACKUP FUNCTIONS
// ============================================

/**
 * Backup dữ liệu lên Google Drive (chạy theo lịch hoặc thủ công)
 */
function backupToGoogleDrive() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const backupFolder = getOrCreateBackupFolder();
    
    // Tạo tên file với timestamp
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd_HH-mm-ss');
    const fileName = `Feedback_Backup_${timestamp}`;
    
    // Export spreadsheet to PDF
    const pdfBlob = spreadsheet.getAs(MimeType.PDF);
    pdfBlob.setName(fileName + '.pdf');
    backupFolder.createFile(pdfBlob);
    
    // Export to Excel
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheet.getId()}/export?format=xlsx`;
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const xlsxBlob = response.getBlob().setName(fileName + '.xlsx');
    backupFolder.createFile(xlsxBlob);
    
    // Log backup
    logAction('DRIVE_BACKUP', 'SUCCESS', `Backup created: ${fileName}.pdf, ${fileName}.xlsx`);
    
    // Cleanup old backups (keep last 10)
    cleanupOldBackups(backupFolder, 10);
    
    return { success: true, fileName: fileName };
  } catch (error) {
    logAction('DRIVE_BACKUP', 'FAILED', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Lấy hoặc tạo folder backup trên Google Drive
 */
function getOrCreateBackupFolder() {
  const folders = DriveApp.getFoldersByName(CONFIG.BACKUP_FOLDER_NAME);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    // Tạo folder mới
    const folder = DriveApp.createFolder(CONFIG.BACKUP_FOLDER_NAME);
    logAction('FOLDER_CREATED', 'SUCCESS', `Created backup folder: ${CONFIG.BACKUP_FOLDER_NAME}`);
    return folder;
  }
}

/**
 * Xóa các backup cũ, giữ lại n backup mới nhất
 */
function cleanupOldBackups(folder, keepCount) {
  const files = folder.getFiles();
  const fileList = [];
  
  while (files.hasNext()) {
    const file = files.next();
    fileList.push({
      file: file,
      date: file.getDateCreated()
    });
  }
  
  // Sort by date descending
  fileList.sort((a, b) => b.date - a.date);
  
  // Delete old files
  const deleteCount = Math.max(0, fileList.length - keepCount);
  for (let i = fileList.length - 1; i >= fileList.length - deleteCount && i >= 0; i--) {
    fileList[i].file.setTrashed(true);
  }
  
  if (deleteCount > 0) {
    logAction('BACKUP_CLEANUP', 'SUCCESS', `Deleted ${deleteCount} old backup files`);
  }
}

/**
 * Thiết lập trigger backup hàng tuần - CHẠY 1 LẦN
 */
function setupWeeklyBackupTrigger() {
  // Xóa trigger cũ nếu có
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'backupToGoogleDrive') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Tạo trigger mới - chạy vào 2:00 AM Chủ Nhật hàng tuần
  ScriptApp.newTrigger('backupToGoogleDrive')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
  
  Logger.log('Weekly backup trigger created (Sunday 2:00 AM)');
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Trích xuất dữ liệu từ form submission
 */
function extractFormData(e, rowNumber) {
  const timestamp = e.values[0];
  const email = e.values[1];
  const fullName = e.values[2];
  const phone = e.values[3] || '';
  const feedbackContent = e.values[4];
  const satisfactionLevel = e.values[5];
  const feedbackType = e.values[6];
  
  return {
    rowNumber: rowNumber,
    timestamp: timestamp,
    email: email,
    fullName: fullName,
    phone: phone,
    feedbackContent: feedbackContent,
    satisfactionLevel: parseInt(satisfactionLevel) || 3,
    feedbackType: feedbackType,
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}

/**
 * Gửi dữ liệu đến n8n Webhook với retry logic
 */
function sendToN8nWebhook(data) {
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  let lastError = '';
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(CONFIG.N8N_WEBHOOK_URL, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      Logger.log(`Attempt ${attempt}: HTTP ${responseCode}`);
      Logger.log(`Response Text: ${responseText}`);
      
      if (responseCode === 200) {
        // Parse response - n8n trả về JSON
        let classification = 'UNKNOWN';
        let sentimentScore = 0;
        
        try {
          const responseData = JSON.parse(responseText);
          classification = responseData.classification || 'UNKNOWN';
          sentimentScore = responseData.sentimentScore || 0;
          
          Logger.log(`Parsed: classification=${classification}, score=${sentimentScore}`);
        } catch (parseError) {
          Logger.log(`Parse error: ${parseError.toString()}`);
          // Fallback: dựa vào satisfaction level
          const satisfaction = data.satisfactionLevel || 3;
          if (satisfaction <= 2) {
            classification = 'NEGATIVE';
            sentimentScore = satisfaction * 2;
          } else if (satisfaction >= 4) {
            classification = 'POSITIVE';
            sentimentScore = satisfaction * 2;
          } else {
            classification = 'NEUTRAL';
            sentimentScore = 5;
          }
        }
        
        return {
          success: true,
          aiResult: {
            classification: classification,
            sentimentScore: sentimentScore
          }
        };
      } else {
        lastError = `HTTP ${responseCode}: ${responseText}`;
      }
    } catch (error) {
      lastError = error.toString();
      Logger.log(`Attempt ${attempt} error: ${lastError}`);
    }
    
    // Đợi trước khi retry
    if (attempt < CONFIG.MAX_RETRIES) {
      Utilities.sleep(CONFIG.RETRY_DELAY_MS);
    }
  }
  
  return {
    success: false,
    error: `Failed after ${CONFIG.MAX_RETRIES} attempts. Last error: ${lastError}`
  };
}

/**
 * Cập nhật kết quả AI vào Google Sheet
 */
function updateAIResults(sheet, row, aiResult) {
  if (!sheet || !row) {
    Logger.log('updateAIResults: Missing sheet or row');
    return;
  }
  
  const classification = aiResult.classification || 'UNKNOWN';
  const score = aiResult.sentimentScore || 0;
  
  // Cột H: AI_Classification
  sheet.getRange(row, 8).setValue(classification);
  // Cột I: AI_Sentiment_Score
  sheet.getRange(row, 9).setValue(score);
  
  // Force flush để đảm bảo ghi ngay
  SpreadsheetApp.flush();
  
  Logger.log(`Updated row ${row}: classification=${classification}, score=${score}`);
}

/**
 * Cập nhật trạng thái xử lý
 */
function updateProcessingStatus(sheet, row, status) {
  if (!sheet || !row) {
    Logger.log('updateProcessingStatus: Missing sheet or row');
    return;
  }
  
  // Cột J: Processing_Status
  sheet.getRange(row, 10).setValue(status);
}

/**
 * Backup dữ liệu vào sheet Backup_Log
 */
function backupData(data, aiResult) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.BACKUP_SHEET);
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        data.timestamp,
        data.email,
        data.feedbackContent,
        JSON.stringify(aiResult)
      ]);
    }
  } catch (error) {
    Logger.log('Backup error: ' + error.toString());
  }
}

/**
 * Ghi log vào sheet System_Logs
 */
function logAction(action, status, details) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.LOG_SHEET);
    if (sheet) {
      sheet.appendRow([
        new Date().toISOString(),
        action,
        status,
        details
      ]);
    }
  } catch (error) {
    Logger.log('Log error: ' + error.toString());
  }
}

// ============================================
// UTILITY & TEST FUNCTIONS
// ============================================

/**
 * Test webhook connection (chạy thủ công để test)
 */
function testWebhookConnection() {
  const testData = {
    rowNumber: 0,
    timestamp: new Date().toISOString(),
    email: 'test@example.com',
    fullName: 'Test User',
    phone: '0123456789',
    feedbackContent: 'Đây là feedback test để kiểm tra kết nối webhook.',
    satisfactionLevel: 3,
    feedbackType: 'Góp ý',
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    isTest: true
  };
  
  const result = sendToN8nWebhook(testData);
  
  if (result.success) {
    Logger.log('Webhook connection successful!');
    Logger.log('Classification: ' + result.aiResult.classification);
    Logger.log('Sentiment Score: ' + result.aiResult.sentimentScore);
  } else {
    Logger.log('Webhook connection failed!');
    Logger.log('Error: ' + result.error);
  }
  
  return result;
}

/**
 * Test gửi email xác nhận
 */
function testConfirmationEmail() {
  const testData = {
    rowNumber: 999,
    timestamp: new Date().toISOString(),
    email: Session.getActiveUser().getEmail(), // Gửi đến email của chính mình
    fullName: 'Test Customer',
    phone: '0123456789',
    feedbackContent: 'Đây là feedback test để kiểm tra hệ thống email tự động.',
    satisfactionLevel: 4,
    feedbackType: 'Góp ý'
  };
  
  const result = sendConfirmationEmail(testData);
  
  if (result.success) {
    Logger.log('Test confirmation email sent successfully!');
    Logger.log('Ticket ID: ' + result.ticketId);
  } else {
    Logger.log('Failed to send test email: ' + result.error);
  }
  
  return result;
}

/**
 * Test tạo draft email phản hồi
 */
function testDraftResponse() {
  const testData = {
    rowNumber: 999,
    timestamp: new Date().toISOString(),
    email: 'customer@example.com',
    fullName: 'Nguyễn Văn Test',
    phone: '0123456789',
    feedbackContent: 'Sản phẩm giao hàng bị hỏng, tôi rất thất vọng!',
    satisfactionLevel: 1,
    feedbackType: 'Khiếu nại'
  };
  
  const aiResult = {
    classification: 'NEGATIVE',
    sentimentScore: 2
  };
  
  const result = createDraftResponse(testData, aiResult);
  
  if (result.success) {
    Logger.log('Test draft created successfully! Check your Gmail Drafts.');
  } else {
    Logger.log('Failed to create draft: ' + result.error);
  }
  
  return result;
}

/**
 * Test backup lên Google Drive
 */
function testDriveBackup() {
  const result = backupToGoogleDrive();
  
  if (result.success) {
    Logger.log('Backup successful! File: ' + result.fileName);
  } else {
    Logger.log('Backup failed: ' + result.error);
  }
  
  return result;
}

/**
 * Setup trigger tự động - CHẠY 1 LẦN DUY NHẤT
 */
function setupFormSubmitTrigger() {
  // Xóa tất cả trigger cũ
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Tạo trigger mới
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  
  Logger.log('Form submit trigger created successfully!');
}

/**
 * Setup tất cả triggers (Form + Weekly Backup)
 */
function setupAllTriggers() {
  setupFormSubmitTrigger();
  setupWeeklyBackupTrigger();
  Logger.log('All triggers have been set up!');
}

/**
 * Xem tất cả triggers đang có
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger, index) => {
    Logger.log(`Trigger ${index + 1}: ${trigger.getHandlerFunction()} - ${trigger.getEventType()}`);
  });
  
  if (triggers.length === 0) {
    Logger.log('No triggers found. Run setupAllTriggers() to create them.');
  }
}

/**
 * Xử lý lại row cuối cùng (để test)
 */
function processLastRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(lastRow, 1, 1, 7).getValues()[0];
  
  const rowData = {
    rowNumber: lastRow,
    timestamp: data[0],
    email: data[1],
    fullName: data[2],
    phone: data[3] || '',
    feedbackContent: data[4],
    satisfactionLevel: parseInt(data[5]) || 3,
    feedbackType: data[6],
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
  
  Logger.log('Processing row ' + lastRow + ': ' + JSON.stringify(rowData));
  
  updateProcessingStatus(sheet, lastRow, 'REPROCESSING');
  
  // Gửi email xác nhận
  if (CONFIG.ENABLE_CONFIRMATION_EMAIL) {
    sendConfirmationEmail(rowData);
  }
  
  // Gửi đến webhook
  const result = sendToN8nWebhook(rowData);
  
  if (result.success) {
    updateAIResults(sheet, lastRow, result.aiResult);
    updateProcessingStatus(sheet, lastRow, 'COMPLETED');
    
    // Tạo draft response
    if (CONFIG.ENABLE_DRAFT_RESPONSE) {
      createDraftResponse(rowData, result.aiResult);
    }
    
    Logger.log('Row ' + lastRow + ' processed: ' + result.aiResult.classification + ', Score: ' + result.aiResult.sentimentScore);
  } else {
    updateProcessingStatus(sheet, lastRow, 'FAILED');
    Logger.log('Row ' + lastRow + ' failed: ' + result.error);
  }
}

/**
 * Xử lý lại các row bị lỗi hoặc UNKNOWN
 */
function reprocessFailedRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  let reprocessed = 0;
  
  for (let i = 1; i < data.length; i++) {
    const classification = data[i][7]; // Cột H (index 7)
    const status = data[i][9]; // Cột J (index 9)
    
    // Xử lý lại nếu UNKNOWN, FAILED, ERROR hoặc trống
    if (!classification || classification === 'UNKNOWN' || status === 'FAILED' || status === 'ERROR') {
      const rowData = {
        rowNumber: i + 1,
        timestamp: data[i][0],
        email: data[i][1],
        fullName: data[i][2],
        phone: data[i][3] || '',
        feedbackContent: data[i][4],
        satisfactionLevel: parseInt(data[i][5]) || 3,
        feedbackType: data[i][6],
        spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
      };
      
      Logger.log('Reprocessing row ' + (i + 1));
      updateProcessingStatus(sheet, i + 1, 'REPROCESSING');
      
      const result = sendToN8nWebhook(rowData);
      
      if (result.success) {
        updateAIResults(sheet, i + 1, result.aiResult);
        updateProcessingStatus(sheet, i + 1, 'COMPLETED');
        reprocessed++;
        Logger.log('Row ' + (i + 1) + ': ' + result.aiResult.classification);
      } else {
        updateProcessingStatus(sheet, i + 1, 'FAILED');
        Logger.log('Row ' + (i + 1) + ' failed');
      }
      
      // Delay giữa các request
      Utilities.sleep(1000);
    }
  }
  
  Logger.log(`Reprocessed ${reprocessed} rows.`);
}

/**
 * Hiển thị hướng dẫn sử dụng
 */
function showHelp() {
  const help = `
============================================
FEEDBACK AUTOMATION SYSTEM v4 - HELP
============================================

SETUP FUNCTIONS (chạy 1 lần):
- setupFormSubmitTrigger(): Tạo trigger cho form submission
- setupWeeklyBackupTrigger(): Tạo trigger backup hàng tuần
- setupAllTriggers(): Tạo tất cả triggers

TEST FUNCTIONS:
- testWebhookConnection(): Test kết nối n8n webhook
- testConfirmationEmail(): Test gửi email xác nhận
- testDraftResponse(): Test tạo draft phản hồi
- testDriveBackup(): Test backup lên Google Drive

UTILITY FUNCTIONS:
- processLastRow(): Xử lý lại row cuối cùng
- reprocessFailedRows(): Xử lý lại các row lỗi
- listAllTriggers(): Xem danh sách triggers
- backupToGoogleDrive(): Backup thủ công

CONFIG OPTIONS:
- ENABLE_CONFIRMATION_EMAIL: Bật/tắt email xác nhận
- ENABLE_DRAFT_RESPONSE: Bật/tắt tạo draft phản hồi
- ENABLE_AUTO_BACKUP: Bật/tắt backup tự động

============================================
  `;
  
  Logger.log(help);
}
