// A regular cross-origin fetch cannot read an Apps Script response reliably.
// A hidden form + iframe lets Apps Script acknowledge a saved row via postMessage.
export function submitToSheet(payload, endpoint, timeoutMs = 25000) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(endpoint)) {
    return Promise.reject(new Error('Chưa cấu hình URL Google Apps Script hợp lệ.'));
  }
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    const name = `invite_sheet_${payload.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    frame.name = name;
    frame.title = 'Gửi câu trả lời';
    frame.style.display = 'none';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;
    form.target = name;
    form.style.display = 'none';
    for (const [key, value] of Object.entries(payload)) {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = value;
      form.append(input);
    }
    let done = false;
    const finish = (error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove(); form.remove();
      error ? reject(error) : resolve();
    };
    const onMessage = (event) => {
      // Apps Script runs user HTML inside a nested Google iframe; its source is
      // not the outer form target frame, so authenticate via origin + random id.
      if (!/^https:\/\/([a-z0-9-]+\.)*googleusercontent\.com$/.test(event.origin)) return;
      if (event.data?.type !== 'invite-chan-result' || event.data?.id !== payload.id) return;
      finish(event.data.ok ? null : new Error('Google Sheets chưa lưu được câu trả lời.'));
    };
    const timer = setTimeout(() => finish(new Error('Hết thời gian chờ Google Sheets. Vui lòng thử lại.')), timeoutMs);
    window.addEventListener('message', onMessage);
    document.body.append(frame, form);
    form.submit();
  });
}
