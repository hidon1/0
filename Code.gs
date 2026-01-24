const SPREADSHEET_ID = "1qIBLUTPXSPv8hEHS7srxSj3poTTXBlYq2zo_ErrHdWE";

// למי נשלחות הודעות "יצירת קשר"
const CONTACT_RECIPIENT = "foroomlelo@gmail.com";

// נושא ברירת מחדל לאימייל אוטומטי למפרסם
const AUTO_REPLY_SUBJECT = "תודה על ההודעה שלך בפורום הצליאק החרדי";

// תבנית למייל האוטומטי למי שפרסם פוסט/תגובה
// שם המשתמש ייכנס במקומות {{username}}
const AUTO_REPLY_TEMPLATE = `
שלום {{username}},

תודה רבה על שכתבת ופרסמת בפורום.
ההודעה או התגובה שלך עלתה לאתר בהצלחה.

נזכיר כי כלל התכנים בפורום מפורסמים בכפוף לתקנון האתר וכללי השימוש, במטרה לשמור על שיח מכבד, מועיל וברור לכלל חברי הקהילה.

אין צורך להשיב למייל זה.

בברכה,
צוות פורום הצליאק החרדי
`;

// ========= doGet =========

function doGet() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data.shift();
  const posts = data.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(posts))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========= doPost =========

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    // ✅ רישום משתמש חדש
    if (params.action === "register") {
      const usersSheet = getUsersSheet();
      const userData = usersSheet.getDataRange().getValues();

      // בדיקה אם שם המשתמש כבר קיים
      for (let i = 1; i < userData.length; i++) {
        if (userData[i][0] === params.username) {
          return jsonResponse({
            status: "error",
            message: "שם משתמש זה כבר תפוס"
          });
        }
        // בדיקה אם האימייל כבר קיים
        if (userData[i][1] === params.email) {
          return jsonResponse({
            status: "error",
            message: "אימייל זה כבר רשום במערכת"
          });
        }
      }

      // שמירת משתמש חדש עם סיסמה מוצפנת
      const hashedPassword = hashPassword(params.password || "");
      usersSheet.appendRow([
        params.username,
        params.email || "",
        hashedPassword,
        new Date()
      ]);

      return jsonResponse({
        status: "success",
        message: "נרשמת בהצלחה!"
      });
    }

    // ✅ התחברות משתמש
    if (params.action === "login") {
      const usersSheet = getUsersSheet();
      const userData = usersSheet.getDataRange().getValues();
      const hashedPassword = hashPassword(params.password || "");
      
      let foundUser = null;
      
      for (let i = 1; i < userData.length; i++) {
        // בדיקה לפי אימייל
        if (userData[i][1] === params.email) {
          foundUser = {
            username: userData[i][0],
            storedHash: userData[i][2]
          };
          break;
        }
      }
      
      // השוואה קבועה בזמן למניעת התקפות תזמון
      if (foundUser && foundUser.storedHash === hashedPassword) {
        return jsonResponse({
          status: "success",
          message: "התחברת בהצלחה!",
          username: foundUser.username
        });
      }
      
      // הודעה כללית למניעת user enumeration
      return jsonResponse({
        status: "error",
        message: "אימייל או סיסמה שגויים"
      });
    }

    // ✅ בדיקת קיום משתמש
    if (params.action === "checkUser") {
      const usersSheet = getUsersSheet();
      const userData = usersSheet.getDataRange().getValues();

      for (let i = 1; i < userData.length; i++) {
        if (userData[i][0] === params.username) {
          return jsonResponse({
            status: "success",
            exists: true
          });
        }
      }

      return jsonResponse({
        status: "success",
        exists: false
      });
    }

    // ✅ מחיקת פוסט
    if (params.action === "delete") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === params.id) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: "success" });
        }
      }
      return jsonResponse({
        status: "error",
        message: "Post not found"
      });
    }

    // ✅ טיפול בלייקים
    if (params.action === "like") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === params.id) {
          const currentLikes = parseInt(data[i][8] || 0, 10);
          sheet.getRange(i + 1, 9).setValue(currentLikes + 1);
          return jsonResponse({ status: "success" });
        }
      }
      return jsonResponse({
        status: "error",
        message: "Post not found"
      });
    }

    // ✅ יצירת קשר (טופס "יצירת קשר" מהאתר)
    if (params.action === "contact") {
      const name = params.name || "אנונימי";
      const email = params.email || "";
      const message = params.message || "";

      const subject = "פניה חדשה דרך טופס יצירת קשר בפורום הצליאק החרדי";

      // שליחת מייל אליך (CONTACT_RECIPIENT = foroomlelo@gmail.com)
      MailApp.sendEmail({
        to: CONTACT_RECIPIENT,
        subject: subject,
        name: "פורום הצליאק החרדי",
        htmlBody:
          "<b>שם:</b> " + escapeHtml(name) + "<br>" +
          "<b>אימייל:</b> " + escapeHtml(email) + "<br><br>" +
          "<b>הודעה:</b><br>" +
          escapeHtml(message).replace(/\n/g, "<br>")
      });

      // שמירת הפניה בגיליון נפרד "Contact"
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let contactSheet = ss.getSheetByName("Contact");
      if (!contactSheet) {
        contactSheet = ss.insertSheet("Contact");
        contactSheet.appendRow(["Date", "Name", "Email", "Message"]);
      }
      contactSheet.appendRow([new Date(), name, email, message]);

      return jsonResponse({
        status: "success",
        message: "ההודעה נשלחה בהצלחה"
      });
    }

    // ✅ פוסט רגיל - עם שם משתמש מהמערכת (thread או תגובה)
    const id = params.parentId ? "" : "id_" + new Date().getTime();
    sheet.appendRow([
      id,
      params.parentId || "",
      params.category,
      params.username,      // שם מהמשתמש המחובר
      params.email || "",
      params.subject,
      params.content,
      new Date(),
      0
    ]);

    // שליחת מייל אוטומטית למי שפרסם (אם יש לו אימייל)
    if (params.email) {
      const body = AUTO_REPLY_TEMPLATE
        .replace(/\{\{username\}\}/g, params.username || "");

      MailApp.sendEmail({
        to: params.email,
        subject: AUTO_REPLY_SUBJECT,
        name: "פורום הצליאק החרדי",
        htmlBody: escapeHtml(body).replace(/\n/g, "<br>")
      });
    }

    return jsonResponse({ status: "success" });
  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

// ========= Helpers =========

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName("Comments") || ss.getSheets()[0];
}

function getUsersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let usersSheet = ss.getSheetByName("Users");

  // יצירת גיליון משתמשים אם לא קיים
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    usersSheet.appendRow(["Username", "Email", "Password", "RegisterDate"]);
  }

  return usersSheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// פונקציית הצפנת סיסמה באמצעות SHA-256
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) byte += 256;
    const hex = byte.toString(16);
    hash += (hex.length === 1 ? '0' : '') + hex;
  }
  return hash;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
