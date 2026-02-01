/************************************************************
 * Base Config
 ************************************************************/
const SPREADSHEET_ID = "1qIBLUTPXSPv8hEHS7srxSj3poTTXBlYq2zo_ErrHdWE";
const SEND_FROM_EMAIL = "zm0548407450@gmail.com"; // must be an alias on the executing account
const CONTACT_RECIPIENT = "zm0548407450@gmail.com";

const AUTO_REPLY_SUBJECT = "תודה על ההודעה שלך בפורום הצליאק החרדי";
const AUTO_REPLY_TEMPLATE = `
שלום {{username}},
תודה רבה על שכתבת ופרסמת בפורום.
ההודעה או התגובה שלך עלתה לאתר בהצלחה.
בברכה, צוות הפורום.
`;

/************************************************************
 * HTTP Entrypoints
 ************************************************************/
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "list";
    let result;
    if (action === "contact") {
      const params = {
        name: e.parameter.name || "",
        email: e.parameter.email || "",
        message: e.parameter.message || ""
      };
      result = handleContactObj(params);
    } else if (action === "list") {
      result = listPostsObj();
    } else if (action === "checkUser") {
      result = handleCheckUserObj({ username: e.parameter.username || "" });
    } else {
      result = { status: "error", message: "פעולה לא נתמכת ב-GET: " + action };
    }
    return jsonOrJsonp(result, e);
  } catch (err) {
    return jsonOrJsonp({ status: "error", message: String(err) }, e);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "No post data received" });
    }
    const params = JSON.parse(e.postData.contents || "{}");
    const action = params.action || "post";
    let result;
    if (action === "register") result = handleRegisterObj(params);
    else if (action === "checkUser") result = handleCheckUserObj(params);
    else if (action === "delete") result = handleDeleteObj(params);
    else if (action === "like") result = handleLikeObj(params);
    else if (action === "contact") result = handleContactObj(params);
    else if (action === "post") result = handlePostOrReplyObj(params);
    else if (action === "list") result = listPostsObj();
    else result = { status: "error", message: "פעולה לא נתמכת: " + action };
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: "error", message: "doPost Error: " + String(err) });
  }
}

/************************************************************
 * Handlers returning objects
 ************************************************************/
function handleContactObj(params) {
  const name = (params.name || "אנונימי").trim();
  const email = (params.email || "").trim();
  const message = (params.message || "").trim();
  const subject = "פניה חדשה מיצירת קשר - פורום";

  const textBody =
    "שם: " + name + "\n" +
    "אימייל: " + email + "\n\n" +
    "הודעה:\n" + message;

  const htmlBody =
    "<b>שם:</b> " + escapeHtml(name) + "<br>" +
    "<b>אימייל:</b> " + escapeHtml(email) + "<br><br>" +
    "<b>הודעה:</b><br>" + escapeHtml(message).replace(/\n/g, "<br>");

  try {
    sendEmailSafe(CONTACT_RECIPIENT, subject, textBody, htmlBody, email || CONTACT_RECIPIENT);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Contact") || ss.insertSheet("Contact");
    if (sheet.getLastRow() === 0) sheet.appendRow(["Date", "Name", "Email", "Message"]);
    sheet.appendRow([new Date(), name, email, message]);
    return { status: "success", message: "ההודעה נשלחה בהצלחה" };
  } catch (err) {
    console.error("handleContact sendEmail error:", err);
    return { status: "error", message: "שגיאה בשליחת מייל: " + String(err) };
  }
}

function handlePostOrReplyObj(params) {
  const sheet = getCommentsSheet();
  const parentId = String(params.parentId || "").trim();
  const username = (params.username || "").trim();
  const email = (params.email || "").trim();
  const subject = params.subject || "";
  const content = params.content || "";
  const category = params.category || "";
  const now = new Date().getTime();
  const id = parentId ? parentId + "_" + now : String(now);
  sheet.appendRow([id, parentId, category, username, email, subject, content, new Date(), 0]);
  const userEmail = email || getUserEmail(username);
  if (userEmail) {
    try {
      const body = AUTO_REPLY_TEMPLATE.replace("{{username}}", username || "משתמש");
      const textBody = body;
      const htmlBody = escapeHtml(body).replace(/\n/g, "<br>");
      sendEmailSafe(userEmail, AUTO_REPLY_SUBJECT, textBody, htmlBody, CONTACT_RECIPIENT);
    } catch (e) {
      console.error("Auto-reply failed:", e);
    }
  }
  return { status: "success", id: id };
}

function handleRegisterObj(params) {
  const username = (params.username || "").trim();
  const email = (params.email || "").trim();
  if (!username) return { status: "error", message: "שם משתמש חובה" };
  const usersSheet = getUsersSheet();
  if (usersSheet.getLastRow() === 0) usersSheet.appendRow(["Username", "Email", "Date"]);
  usersSheet.appendRow([username, email, new Date()]);
  return { status: "success", message: "נרשמת בהצלחה!" };
}

function handleCheckUserObj(params) {
  const username = (params.username || "").trim();
  const usersSheet = getUsersSheet();
  const data = usersSheet.getDataRange().getValues();
  const exists = data.some((row, idx) => idx > 0 && String(row[0]).trim() === username);
  return { status: "success", exists: exists };
}

function handleDeleteObj(params) {
  const id = String(params.id || "");
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { status: "success" };
    }
  }
  return { status: "error", message: "לא נמצא" };
}

function handleLikeObj(params) {
  const id = String(params.id || "");
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const currentLikes = parseInt(data[i][8] || 0, 10);
      sheet.getRange(i + 1, 9).setValue(currentLikes + 1);
      return { status: "success" };
    }
  }
  return { status: "error", message: "לא נמצא" };
}

/************************************************************
 * Safe Gmail sending
 ************************************************************/
function getSafeFromAddress() {
  try {
    const aliases = GmailApp.getAliases();
    return aliases.includes(SEND_FROM_EMAIL) ? SEND_FROM_EMAIL : null;
  } catch (e) {
    return null;
  }
}

function sendEmailSafe(to, subject, textBody, htmlBody, replyTo) {
  if (!to) throw new Error("כתובת נמען חסרה");
  const safeTextBody = String(textBody || "").trim();
  if (!safeTextBody) throw new Error("גוף הודעה טקסטואלי לא יכול להיות ריק (כולל רווחים בלבד)");
  const options = { name: "פורום הצליאק החרדי", replyTo: replyTo || CONTACT_RECIPIENT };
  if (htmlBody) options.htmlBody = htmlBody;
  const safeFrom = getSafeFromAddress();
  if (safeFrom) options.from = safeFrom;
  GmailApp.sendEmail(to, subject, safeTextBody, options);
}

/************************************************************
 * JSON / JSONP helpers
 ************************************************************/
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonp(obj, e) {
  const callback = e && e.parameter && e.parameter.callback;
  if (!callback) return jsonResponse(obj);
  const out = ContentService.createTextOutput(`${callback}(${JSON.stringify(obj)})`);
  return out.setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/************************************************************
 * Sheets helpers
 ************************************************************/
function getCommentsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Comments") || ss.getSheetByName("גיליון1") || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "parentId", "category", "username", "email", "subject", "content", "date", "likes"]);
  }
  return sheet;
}

function listPostsObj() {
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getUsersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  return sheet;
}

function getUserEmail(username) {
  const data = getUsersSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(username).trim()) {
      return data[i][1] || "";
    }
  }
  return "";
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function checkAliases() {
  Logger.log(GmailApp.getAliases());
}
