import './style.css';
import { FOODS, initialState, canContinueFood, reviewRows, submission } from './flow.js';
import { submitToSheet } from './sheet.js';
import { createMagic } from './magic.js';

const app = document.querySelector('#app');
const magic = createMagic(document.querySelector('#magic'));
const state = initialState();
let pending = false;
let requestId = null;
const endpoint = import.meta.env.VITE_SHEET_URL || '';
// SVG avoids iOS rendering U+2733 as a green emoji instead of a styled symbol.
const spark = '<svg class="spark-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 2 28 17 41 7 31 20 46 24 31 28 41 41 28 31 24 46 20 31 7 41 17 28 2 24 17 20 7 7 20 17Z" fill="currentColor"/></svg>';
const moonIcon = '<svg class="ui-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M34 5a19 19 0 1 0 9 29A19 19 0 0 1 34 5Z" fill="currentColor"/></svg>';
const mailIcon = '<svg class="ui-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="5" y="11" width="38" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="m6 14 18 14 18-14" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
const cupIcon = '<svg class="ui-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M9 17h27v12a12 12 0 0 1-12 12h-3A12 12 0 0 1 9 29V17Zm27 3h5a5 5 0 0 1 0 10h-5M17 5c-5 4 5 6 0 10m11-10c-5 4 5 6 0 10" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const checkIcon = '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const backArrow = '<svg class="back-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 5-7 7 7 7M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const header = (label, number) => `<div class="eyebrow"><span class="line"></span> ${label} <span class="tiny-star">✦</span> ${number}</div>`;
// Inline SVG stays consistent in iOS in-app browsers (Unicode arrows may become emoji).
const nextArrow = '<span class="next-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 19 19 5M7 5h12v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
const progress = (active) => `<div class="progress" aria-label="Bước ${active} trên 3"><span class="${active >= 1 ? 'active' : ''}"></span><span class="${active >= 2 ? 'active' : ''}"></span><span class="${active >= 3 ? 'active' : ''}"></span></div>`;

const views = {
  closed: () => `<section class="intro screen"><div class="intro-copy">${header('A PERSONAL INVITATION', '01 / 03')}<h1>Có một chiếc thư<br/><em>dành cho bà.</em></h1><p>Một lời mời nho nhỏ, được gói bằng một chút can đảm và rất nhiều mong chờ.</p><div class="hint"><span>${spark}</span> Psst... chạm vào chiếc thư đi!</div></div><div class="envelope-stage"><span class="stage-spark spark-one" aria-hidden="true">✦</span><span class="stage-spark spark-two" aria-hidden="true">${spark}</span><span class="stage-spark spark-three" aria-hidden="true">✧</span><button class="envelope" type="button" data-action="open" aria-label="Mở thư"><span class="envelope-back"></span><span class="envelope-paper"><span>To: Chan</span><b>${spark}</b></span><span class="envelope-front"></span><span class="envelope-flap"></span><span class="envelope-seal">${spark}</span></button></div><div class="intro-decoration" aria-hidden="true">✦</div></section>`,
  invitation: () => `<section class="letter-screen screen">${progress(1)}<div class="letter-wrap"><div class="letter-glow"></div><article class="letter">${header('CHAPTER ONE', 'THE INVITATION')}<div class="letter-icon">${spark}</div><h1>Hi người đẹp,</h1><p class="letter-lead">vẫn để lại lịch tối nay cho tôi chứ?</p><p>Do vẫn nợ bà <strong>2 ân tình</strong>, tôi xin phép nhân dịp này để trả cho bà cả 2 nha :)</p><p class="scribble">note: không bấm no được đou đừng cố :)</p><div class="letter-rule"></div><p class="question">Vậy... bà có đồng ý không?</p><div class="choice-zone" id="choice-zone"><button class="button primary" data-action="accept">Yes, đi chứ! ${nextArrow}</button><button class="button ghost dodge" id="dodge" data-action="dodge">No, để xem đã</button></div><p class="dodge-status" id="dodge-status" aria-live="polite">${state.dodges ? state.dodges < 3 ? `Né được ${state.dodges}/3 lần rồi đó 👀` : 'Được rồi, lần này bấm được nè.' : '&nbsp;'}</p></article></div><p class="under-letter">A LITTLE MAGIC IS ABOUT TO HAPPEN ✦</p></section>`,
  reason: () => `<section class="letter-screen screen">${progress(1)}<article class="letter narrow">${header('A LITTLE NOTE', 'NO PRESSURE')}<div class="letter-icon">${moonIcon}</div><h1>Không sao đâu.</h1><p class="letter-lead">Có thể cho tui biết lý do được không?</p><p>Tui chỉ muốn hiểu bà hơn thôi. Cứ nói thật lòng nha.</p><form id="reason-form"><label class="field-label" for="reason">Lý do của bà <span>*</span></label><textarea id="reason" name="reason" rows="4" maxlength="1000" required placeholder="Nói tui nghe nè...">${escapeHTML(state.reason)}</textarea><div class="form-actions"><button class="button ghost" type="button" data-action="back-invite">${backArrow} Quay lại</button><button class="button primary" type="submit">Tiếp tục ${nextArrow}</button></div></form></article></section>`,
  food: () => `<section class="food-screen screen">${progress(2)}<div class="section-heading">${header('CHAPTER TWO', 'ÂN TÌNH 01')}<div class="section-title"><div><h1>Để tui mời bà<br/><em>một bữa nha!</em></h1><p>Hôm nay bà muốn ăn gì? Chọn một món bà thích nhất nè.</p></div><span class="heading-spark" aria-hidden="true">${spark}</span></div></div><form id="food-form"><div class="food-grid">${FOODS.map((food, i) => `<label class="food-card ${state.food === food ? 'selected' : ''} ${state.food && state.food !== food ? 'dimmed' : ''}"><input type="radio" name="food" value="${escapeHTML(food)}" ${state.food === food ? 'checked' : ''} /><span class="food-image food-${i}">${i === 3 ? '<span class="custom-icon">✦<br/><small>?</small></span>' : ''}</span><span class="food-info"><span><small>0${i + 1} / MENU</small><strong>${escapeHTML(food)}</strong></span><span class="food-check">${checkIcon}</span></span></label>`).join('')}</div><div class="custom-field ${state.food === 'Tuỳ chọn' ? 'visible' : ''}" id="custom-field"><label class="field-label" for="customFood">Bà muốn ăn món gì? <span>*</span></label><input id="customFood" name="customFood" maxlength="100" placeholder="Viết tên món vào đây nha..." value="${escapeHTML(state.customFood)}" ${state.food === 'Tuỳ chọn' ? 'required' : ''}/></div><div class="bottom-actions"><button class="button ghost" type="button" data-action="back-invite">${backArrow} Quay lại</button><button class="button primary" id="food-next" type="submit" ${canContinueFood(state) ? '' : 'disabled'}>Xác nhận món ăn ${nextArrow}</button></div></form></section>`,
  drink: () => `<section class="letter-screen screen">${progress(3)}<article class="letter drink-letter">${header('CHAPTER THREE', 'ÂN TÌNH 02')}<div class="drink-illustration" aria-hidden="true"><span>${cupIcon}</span><span class="drink-stars">${spark} ✦</span></div><h1>Còn một điều nữa...</h1><p class="letter-lead">Ăn mà không uống thì phí phạm!</p><p>Tui có biết một quán nước khá chill, có <strong>board game</strong> để chơi nên sẽ không nhàm chán (chắc vậy).</p><p class="question">Do u wanna go?</p><p class="scribble">note: lần này thì bấm no được @@</p><div class="letter-rule"></div><div class="drink-actions"><button class="button primary" data-action="drink-yes">Yes, đi luôn! ${nextArrow}</button><button class="button ghost" data-action="drink-no">No, lần khác nha</button></div><button class="text-link" data-action="back-food">${backArrow} Chọn lại món ăn</button></article></section>`,
  review: () => `<section class="letter-screen screen">${progress(3)}<article class="letter review-letter">${header('ONE LAST THING', 'REVIEW')}<div class="letter-icon">${mailIcon}</div><h1>Trước khi gửi đi...</h1><p class="letter-lead">Xem lại câu trả lời của bà một chút nha.</p><div class="review-list">${reviewRows(state).map(([label, value]) => `<div class="review-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('')}</div><div class="form-actions"><button class="button ghost" data-action="edit">${backArrow} Chỉnh sửa</button><button class="button primary" id="send" data-action="send" ${pending ? 'disabled' : ''}>${pending ? 'Đang gửi...' : `Gửi câu trả lời ${nextArrow}`}</button></div><p class="send-error" id="send-error" role="alert"></p><p class="privacy-note">✦ Câu trả lời chỉ được lưu khi bà bấm gửi.</p></article></section>`,
  thanks: () => `<section class="letter-screen screen"><article class="letter thankyou">${header('LETTER DELIVERED', 'THE END')}<div class="big-star">${spark}</div><h1>${state.invite === 'Yes' ? 'Hẹn gặp bà nha!' : 'Cảm ơn bà đã nói thật.'}</h1><p class="letter-lead">${state.invite === 'Yes' ? 'Tui sẽ chuẩn bị một buổi tối thật vui. Hẹn bà sớm nhé ♡' : 'Không sao hết, mình vẫn có thể hẹn nhau dịp khác nha ♡'}</p><div class="letter-rule"></div><p class="scribble">đã nhận được câu trả lời của bà rồi ✦</p></article></section>`
};

function render() {
  app.innerHTML = views[state.step]();
  const heading = app.querySelector('h1');
  if (state.step !== 'closed' && heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function transition(step) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { state.step = step; render(); return; }
  magic.sweep();
  const shell = document.querySelector('.site-shell');
  shell.classList.add('sweeping');
  app.classList.add('transitioning');
  setTimeout(() => { state.step = step; render(); app.classList.remove('transitioning'); shell.classList.remove('sweeping'); }, 700);
}

function dodge(button) {
  if (state.dodges >= 3) { transition('reason'); return; }
  const zone = document.querySelector('#choice-zone');
  const before = button.getBoundingClientRect();
  const bounds = zone.getBoundingClientRect();
  const maxX = Math.max(0, bounds.width - button.offsetWidth);
  const maxY = Math.max(0, bounds.height - button.offsetHeight);
  let x, y, found = false;
  for (let attempts = 0; attempts < 20; attempts++) {
    x = Math.random() * maxX; y = Math.random() * maxY;
    const yes = zone.querySelector('[data-action="accept"]').getBoundingClientRect();
    const yesX = yes.left - bounds.left, yesY = yes.top - bounds.top;
    const clearOfYes = x + button.offsetWidth < yesX - 5 || x > yesX + yes.width + 5 ||
      y + button.offsetHeight < yesY - 5 || y > yesY + yes.height + 5;
    if (clearOfYes && Math.hypot(x - (before.left - bounds.left), y - (before.top - bounds.top)) > 65) { found = true; break; }
  }
  if (!found) { x = maxX; y = maxY; }
  const angry = document.createElement('span');
  angry.className = 'angry'; angry.textContent = '😤';
  angry.style.left = `${before.left - bounds.left + button.offsetWidth / 2}px`;
  angry.style.top = `${before.top - bounds.top}px`;
  zone.append(angry);
  angry.addEventListener('animationend', () => angry.remove());
  button.style.position = 'absolute'; button.style.left = `${x}px`; button.style.top = `${y}px`;
  state.dodges++;
  document.querySelector('#dodge-status').textContent = state.dodges === 3 ? 'Được rồi, lần này bấm được nè.' : `Né được ${state.dodges}/3 lần rồi đó 👀`;
}

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || pending) return;
  switch (button.dataset.action) {
    case 'open': {
      button.disabled = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        state.step = 'invitation'; render(); break;
      }
      magic.burst();
      button.classList.add('unsealing');
      button.closest('.envelope-stage').classList.add('unsealing');
      setTimeout(() => {
        magic.sweep();
        state.step = 'invitation'; render();
        app.querySelector('.letter')?.classList.add('opening');
      }, 1050);
      break;
    }
    case 'accept': state.invite = 'Yes'; state.reason = ''; requestId = null; transition('food'); break;
    case 'dodge': dodge(button); break;
    case 'back-invite': transition('invitation'); break;
    case 'back-food': transition('food'); break;
    case 'drink-yes': case 'drink-no': state.drink = button.dataset.action === 'drink-yes' ? 'Yes' : 'No'; requestId = null; transition('review'); break;
    case 'edit': transition(state.invite === 'No' ? 'reason' : 'drink'); break;
    case 'send': {
      pending = true;
      button.disabled = true; button.textContent = 'Đang gửi...';
      try {
        requestId ||= crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
        await submitToSheet(submission(state, requestId), endpoint);
        transition('thanks');
      } catch (error) {
        document.querySelector('#send-error').textContent = error.message;
        button.disabled = false; button.innerHTML = `Thử gửi lại ${nextArrow}`;
      } finally { pending = false; }
      break;
    }
  }
});

app.addEventListener('change', (event) => {
  if (event.target.name !== 'food') return;
  state.food = event.target.value;
  requestId = null;
  document.querySelectorAll('.food-card').forEach((card) => {
    const selected = card.querySelector('input').checked;
    card.classList.toggle('selected', selected);
    card.classList.toggle('dimmed', !selected);
  });
  const custom = document.querySelector('#custom-field');
  custom.classList.toggle('visible', state.food === 'Tuỳ chọn');
  custom.querySelector('input').required = state.food === 'Tuỳ chọn';
  document.querySelector('#food-next').disabled = !canContinueFood(state);
  if (state.food === 'Tuỳ chọn') custom.querySelector('input').focus();
});
app.addEventListener('input', (event) => {
  if (event.target.id === 'customFood') {
    state.customFood = event.target.value;
    requestId = null;
    document.querySelector('#food-next').disabled = !canContinueFood(state);
  }
  if (event.target.id === 'reason') { event.target.setCustomValidity(''); state.reason = event.target.value; requestId = null; }
});
app.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'food-form' && canContinueFood(state)) transition('drink');
  if (event.target.id === 'reason-form') {
    if (!state.reason.trim()) { document.querySelector('#reason').setCustomValidity('Vui lòng nhập lý do.'); document.querySelector('#reason').reportValidity(); return; }
    state.invite = 'No'; state.food = ''; state.customFood = ''; state.drink = ''; requestId = null; transition('review');
  }
});

render();
