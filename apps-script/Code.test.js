import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function setup() {
  const rows = [];
  let locked = false;
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (row) => rows.push(row),
    getRange: (_row, _column, count) => ({ getValues: () => rows.slice(1, count + 1).map((row) => [row[0]]) })
  };
  const context = vm.createContext({
    console: { error() {} },
    LockService: { getScriptLock: () => ({ waitLock: () => { locked = true; }, hasLock: () => locked, releaseLock: () => { locked = false; } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }) },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
      createHtmlOutput: (html) => ({ html, setXFrameOptionsMode(mode) { this.mode = mode; return this; } })
    }
  });
  vm.runInContext(readFileSync(new URL('./Code.gs', import.meta.url), 'utf8'), context);
  return { context, rows };
}

const id = '12345678-1234-1234-1234-123456789abc';

test('sheet appends a single accepted answer even after retry', () => {
  const { context, rows } = setup();
  const data = { id, invite: 'Yes', food: 'Tuỳ chọn', customFood: '=SUM(1,1)', drink: 'No' };
  const response = context.doPost({ parameter: data });
  context.doPost({ parameter: data });
  assert.equal(response.mode, 'ALLOWALL');
  assert.match(response.html, /window\.top\.postMessage/);
  assert.match(response.html, /"ok":true/);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][5], "'=SUM(1,1)");
  assert.equal(rows[1][6], 'No');
});

test('decline skips food and drink and invalid requests do not write', () => {
  const { context, rows } = setup();
  context.doPost({ parameter: { id, invite: 'No', reason: ' Bận ' } });
  assert.equal(rows[1][3], "'Bận");
  assert.equal(rows[1][4], '');
  assert.equal(rows[1][6], '');
  const invalid = context.doPost({ parameter: { id: 'another-valid-id-1234', invite: 'Yes', food: 'Mì cay' } });
  assert.match(invalid.html, /"ok":false/);
  assert.equal(rows.length, 2);
});
