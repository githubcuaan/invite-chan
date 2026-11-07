export const FOODS = ['Mì cay', 'Cơm nhật / Ramen', 'Jolibee', 'Tuỳ chọn'];

export function initialState() {
  return { step: 'closed', invite: '', reason: '', food: '', customFood: '', drink: '', dodges: 0 };
}

export function canContinueFood(state) {
  return FOODS.includes(state.food) && (state.food !== 'Tuỳ chọn' || state.customFood.trim().length > 0);
}

export function reviewRows(state) {
  if (state.invite === 'No') return [['Lời mời tối nay', 'Không đi được rồi'], ['Lý do', state.reason.trim()]];
  return [
    ['Lời mời tối nay', 'Tất nhiên rồi!'],
    ['Món ăn', state.food === 'Tuỳ chọn' ? state.customFood.trim() : state.food],
    ['Đi uống nước', state.drink === 'Yes' ? 'Có, đi chứ!' : 'Để lần khác nha']
  ];
}

export function submission(state, id) {
  if (!id || !/^[a-zA-Z0-9-]{16,80}$/.test(id)) throw new Error('Mã gửi không hợp lệ');
  if (state.invite === 'No') {
    if (!state.reason.trim()) throw new Error('Vui lòng nhập lý do');
    return { id, invite: 'No', reason: state.reason.trim(), food: '', customFood: '', drink: '' };
  }
  if (state.invite !== 'Yes' || !canContinueFood(state) || !['Yes', 'No'].includes(state.drink)) {
    throw new Error('Vui lòng hoàn thành các câu trả lời');
  }
  return {
    id, invite: 'Yes', reason: '', food: state.food,
    customFood: state.food === 'Tuỳ chọn' ? state.customFood.trim() : '', drink: state.drink
  };
}
