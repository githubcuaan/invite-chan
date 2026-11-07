import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, canContinueFood, reviewRows, submission } from './flow.js';

const id = '12345678-1234-1234-1234-123456789abc';

test('a custom food requires a name', () => {
  const state = initialState();
  state.food = 'Tuỳ chọn';
  assert.equal(canContinueFood(state), false);
  state.customFood = '   ';
  assert.equal(canContinueFood(state), false);
  state.customFood = ' Bún bò ';
  assert.equal(canContinueFood(state), true);
});

test('decline only sends first answer and reason', () => {
  const state = { ...initialState(), invite: 'No', reason: ' Bận mất rồi ', food: 'Mì cay', drink: 'Yes' };
  assert.deepEqual(submission(state, id), { id, invite: 'No', reason: 'Bận mất rồi', food: '', customFood: '', drink: '' });
  assert.equal(reviewRows(state).length, 2);
});

test('acceptance includes selected food and drink', () => {
  const state = { ...initialState(), invite: 'Yes', food: 'Tuỳ chọn', customFood: ' Sushi ', drink: 'No' };
  assert.deepEqual(submission(state, id), { id, invite: 'Yes', reason: '', food: 'Tuỳ chọn', customFood: 'Sushi', drink: 'No' });
  assert.equal(reviewRows(state)[1][1], 'Sushi');
});

test('incomplete answers cannot be submitted', () => {
  assert.throws(() => submission(initialState(), id));
  assert.throws(() => submission({ ...initialState(), invite: 'No', reason: ' ' }, id));
  assert.throws(() => submission({ ...initialState(), invite: 'Yes', food: 'Mì cay' }, id));
  assert.throws(() => submission({ ...initialState(), invite: 'Yes', food: 'Mì cay', drink: 'Yes' }, 'bad-id'));
});
