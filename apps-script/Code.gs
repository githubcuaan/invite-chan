// Create a Google Sheet, then add this file to its bound Apps Script project.
const HEADERS = ['Mã gửi', 'Thời gian gửi', 'Lời mời đầu tiên', 'Lý do từ chối', 'Món ăn', 'Món tự chọn', 'Đi uống nước'];

function doPost(e) {
  const data = e.parameter || {};
  const id = /^[a-zA-Z0-9-]{16,80}$/.test(data.id || '') ? data.id : '';
  let ok = false;
  const lock = LockService.getScriptLock();
  try {
    if (!id) throw new Error('Invalid id');
    if (data.invite === 'No') {
      if (!(data.reason || '').trim()) throw new Error('Missing reason');
    } else if (data.invite === 'Yes') {
      if (!['Mì cay', 'Cơm nhật / Ramen', 'Jolibee', 'Tuỳ chọn'].includes(data.food) ||
          (data.food === 'Tuỳ chọn' && !(data.customFood || '').trim()) ||
          !['Yes', 'No'].includes(data.drink)) throw new Error('Incomplete answer');
    } else throw new Error('Invalid invite');

    lock.waitLock(15000);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat() : [];
    if (!ids.includes(id)) {
      // A leading apostrophe forces user input to remain text, not spreadsheet formulas.
      const text = (value) => "'" + String(value || '').trim().slice(0, 1000);
      const accepted = data.invite === 'Yes';
      sheet.appendRow([id, new Date(), data.invite,
        accepted ? '' : text(data.reason),
        accepted ? data.food : '',
        accepted && data.food === 'Tuỳ chọn' ? text(data.customFood) : '',
        accepted ? data.drink : '']);
    }
    ok = true;
  } catch (error) {
    console.error(error);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
  // HtmlService wraps this document in another iframe; the app is at window.top,
  // not window.parent. The app verifies Google's origin and the random request id.
  const message = JSON.stringify({ type: 'invite-chan-result', id, ok });
  return HtmlService.createHtmlOutput('<script>window.top.postMessage(' + message + ',"*");</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
