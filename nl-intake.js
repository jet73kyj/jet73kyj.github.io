// 초기 상담지 — 신규 아동 관리(inquiry) · 아동 목록(children-new) 함께 씀 (2026-11-09)
//   두 화면 모두 이 파일 하나만 고친다 · 쓰기는 8 · 19번
//   화면은 NLIntake.init({ sb, me, kid(번호) }) 를 부르고, 아동을 열 때 NLIntake.load(번호)
//   상자(ikBox · ikLinkBtn · ikNewBtn · ikList)가 화면에 없으면 NLIntake.box() 글을 넣어 쓴다
const IKC = { ready: Promise.resolve(), sb: null, me: null, kid: () => null, _thrs: [], _all: [], thrs() { return this._thrs; } };
function ik$(id) { return document.getElementById(id); }
function ikKst() {
  const d = new Date(Date.now() + 9 * 3600000);
  return d.toISOString().slice(0, 10);
}
const IK_WIN_HTML = `
<div id="ikBg" style="display:none;position:fixed;inset:0;background:rgba(47,41,38,.35);z-index:900;overflow:auto;">
  <div id="ikWin" style="background:#fff;max-width:760px;margin:30px auto;border-radius:12px;overflow:hidden;border:1px solid #ECE8E3;">
    <div style="background:#F8F1E8;border-bottom:2px solid #C9A27E;padding:12px 16px;">
      <div id="ikTitle" style="font-size:15px;font-weight:600;color:#2F2926;"></div>
      <div id="ikSub" style="font-size:12.5px;color:#A39C95;margin-top:3px;"></div>
    </div>
    <div style="padding:14px 16px;" id="ikBody"></div>
    <div style="padding:10px 16px 16px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid #ECE8E3;">
      <button type="button" id="ikDel" class="tab ikwb" style="color:#c62828;margin-right:auto;">지우기</button>
      <button type="button" id="ikClose" class="tab ikwb">닫기</button>
      <button type="button" id="ikSave" class="tab ikwb ikbtn-save" style="font-weight:bold;">💾 저장 전</button>
    </div>
    <div id="ikMsg" class="out" style="padding:0 16px 12px;white-space:pre-line;"></div>
  </div>
</div>
<style>
  .ikq { padding:8px 0; border-bottom:1px solid #F1EEEA; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .ikq .t { flex:1 1 300px; font-size:13.5px; line-height:1.6; }
  .ikq .b { display:flex; gap:4px; }
  .ikq .b button { width:auto; margin:0; font-size:12.5px; padding:5px 11px; border-radius:7px;
    border:1px solid #E4E0DA; background:#fff; color:#5F5E5A; cursor:pointer; }
  .ikq .b button.on.c1 { background:#EAF3DE; border-color:#97C459; color:#27500A; font-weight:600; }
  .ikq .b button.on.c2 { background:#FAEEDA; border-color:#E0B260; color:#854F0B; font-weight:600; }
  .ikq .b button.on.c3 { background:#FBE4DE; border-color:#E59A86; color:#993C1D; font-weight:600; }
  .iksec { font-size:13.5px; font-weight:600; color:#B07A4A; margin:14px 0 4px; padding-bottom:4px; border-bottom:1px solid #F0E4D6; }
  .iklab { font-size:12.5px; color:#5F5E5A; margin:10px 0 4px; }
  #ikBody textarea, #ikBody input, #ikBody select { font:inherit; font-size:14px; padding:8px 10px;
    border:1px solid #ECE8E3; border-radius:8px; width:100%; box-sizing:border-box; background:#fff; margin:0; }
  #ikBody textarea { resize:vertical; line-height:1.6; min-height:60px; }
  .ikrow { display:flex; gap:6px; align-items:center; flex-wrap:wrap; padding:6px 0; border-bottom:1px solid #F1EEEA; }
  .ikrow button, .ikbx button, .ikwb { width:auto !important; margin:0 !important; font-size:12.5px; padding:4px 11px; }
  .ikwb { background:#fff; color:#4A433F; border:1px solid #DDD6CE; border-radius:7px; cursor:pointer; }
  .ikbtn-save { background:#fff; color:#2F2926; }
  .ikbtn-save.done { background:#2e7d32; color:#fff; border-color:#2e7d32; }
  .iktag { font-size:11.5px; padding:1px 8px; border-radius:9px; background:#F1EFEA; color:#5F5E5A; }
  .iktag.p { background:#FBEAF0; color:#993556; } .iktag.g { background:#E6F1FB; color:#185FA5; }
  @media (max-width:640px) { #ikWin { margin:0; border-radius:0; min-height:100%; } }
</style>`;
// ═══════════════ 초기 상담지 (2026-10-08 은정님) ═══════════════
//   서식(nl_intake_forms) · 문항(nl_intake_items) · 상담 일지(nl_intake_notes) · 답(nl_intake_answers)
//   학부모 링크(nl_intake_links) — 14일 · 한 번 제출하면 닫힘 · 학부모 화면 intake-form.html
// 학부모가 적은 글이 칸 값(value="…")에 들어가므로 따옴표까지 바꾼다 (2026-10-08 점검)
function ikEsc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
let IK_FORMS = null, IK_ITEMS = {}, IK_CID = null, IK_NOTES = [], IK_LINKS = [];
let IK_CUR = null, IK_DIRTY = false, IK_SAVING = false;
const IK_CHOICE = ['가능', '부분', '어려움'];
const IK_AREAS = ['사회정서', '언어', '인지', '운동'];
const IK_DAYS = 14;
function ikCanWrite() { return IKC.me && [8, 19].indexOf(Number(IKC.me.id)) >= 0; }
function ikMonths(birth, at) {
  if (!birth) return null;
  const d = new Date(String(birth).slice(0, 10) + 'T00:00:00');
  const n = at ? new Date(String(at).slice(0, 10) + 'T00:00:00') : new Date();
  if (isNaN(d) || isNaN(n)) return null;
  let m = (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
  if (n.getDate() < d.getDate()) m--;
  return m < 0 ? null : m;
}
function ikAgeTxt(m) { return m == null ? '' : '만 ' + Math.floor(m / 12) + '년 ' + (m % 12) + '개월 (' + m + '개월)'; }
function ikFormFor(m) {
  if (m == null || !IK_FORMS) return null;
  return IK_FORMS.find(f => f.active && m >= f.min_month && m <= f.max_month) || null;
}
function ikShort(f) { return f ? String(f.name).replace(' 초기 상담지', '') : ''; }
function ikDayKo(s) { const p = String(s || '').slice(0, 10).split('-'); return p.length === 3 ? Number(p[1]) + '월 ' + Number(p[2]) + '일' : ''; }
function ikToday() { return ikKst(); }
function ikAddDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

async function ikReadForms() {
  if (IK_FORMS) return true;
  const [f, i] = await Promise.all([
    IKC.sb.from('nl_intake_forms').select('*').order('sort_no'),
    IKC.sb.from('nl_intake_items').select('*').order('sort_no')
  ]);
  if (f.error || i.error) return false;
  IK_FORMS = f.data || [];
  IK_ITEMS = {};
  (i.data || []).forEach(x => { if (x.active !== false) (IK_ITEMS[x.form_id] = IK_ITEMS[x.form_id] || []).push(x); });
  return true;
}

async function ikLoad(cid) {
  IK_CID = cid;
  const wr = ikCanWrite();
  ik$('ikLinkBtn').style.display = wr ? '' : 'none';
  ik$('ikNewBtn').style.display = wr ? '' : 'none';
  ik$('ikList').innerHTML = '<span style="color:#A39C95;">불러오는 중…</span>';
  const okF = await ikReadForms();
  await IKC.ready;
  const [n, l] = await Promise.all([
    IKC.sb.from('nl_intake_notes').select('*').eq('child_id', cid).order('consult_on', { ascending: false }),
    wr ? IKC.sb.from('nl_intake_links').select('*').eq('child_id', cid).order('id', { ascending: false })
       : Promise.resolve({ data: [] })
  ]);
  if (IK_CID !== cid) return;   // 그 사이 다른 아동을 열었으면 그리지 않음
  if (!okF || n.error || l.error) {
    ik$('ikList').innerHTML = '<span style="color:#993C1D;">초기 상담지를 읽지 못했습니다.</span>'; return;
  }
  IK_NOTES = n.data || [];
  IK_LINKS = l.data || [];
  let cnt = {};
  if (IK_NOTES.length) {
    const a = await IKC.sb.from('nl_intake_answers').select('note_id, choice').in('note_id', IK_NOTES.map(x => x.id));
    (a.data || []).forEach(x => {
      if (!x.choice) return;
      const c = cnt[x.note_id] = cnt[x.note_id] || {};
      c[x.choice] = (c[x.choice] || 0) + 1;
    });
  }
  ikDrawList(cnt);
}

function ikDrawList(cnt) {
  const td = ikToday();
  let html = '';
  IK_LINKS.filter(x => !x.used_at).forEach(x => {
    const live = x.expires_on >= td;
    const f = IK_FORMS.find(y => y.id === x.form_id);
    html += '<div class="ikrow"><span class="iktag p">학부모 링크</span>'
      + '<span>' + ikEsc(ikShort(f)) + ' · ' + (live ? ikEsc(ikDayKo(x.expires_on)) + '까지 · 아직 안 씀'
                                                    : '<span style="color:#993C1D;">기한 지남</span>') + '</span>'
      + '<span style="flex:1 1 auto;"></span>'
      + '<button type="button" class="tab" data-ikdrop="' + x.id + '" style="color:#c62828;"'
      + ' title="잘못 보낸 링크를 못 쓰게 막습니다">링크 막기</button></div>';
  });
  IK_NOTES.forEach(x => {
    const f = IK_FORMS.find(y => y.id === x.form_id);
    const c = cnt[x.id] || {};
    const who = x.source === '학부모' ? '<span class="iktag p">학부모 작성</span>'
              : x.source === '구글' ? '<span class="iktag g">구글</span>' : '<span class="iktag">센터 작성</span>';
    const th = x.counselor_id ? (IKC._all.find(t => t.id === x.counselor_id) || {}).name : x.counselor_name;
    html += '<div class="ikrow">' + who
      + '<span>' + ikEsc(x.consult_on || '') + ' · ' + ikEsc(ikShort(f))
      + (th ? ' · 상담 ' + ikEsc(th) : '')
      + (c['어려움'] ? ' · 어려움 ' + c['어려움'] : '') + (c['부분'] ? ' · 부분 ' + c['부분'] : '') + '</span>'
      + '<span style="flex:1 1 auto;"></span>'
      + '<button type="button" class="tab" data-ikopen="' + x.id + '">열기</button></div>';
  });
  ik$('ikList').innerHTML = html || '<span style="color:#A39C95;">아직 초기 상담지가 없습니다.</span>';
  ik$('ikList').querySelectorAll('[data-ikopen]').forEach(b => b.onclick = () => ikOpen(Number(b.dataset.ikopen)));
  ik$('ikList').querySelectorAll('[data-ikdrop]').forEach(b => b.onclick = () => ikDropLink(Number(b.dataset.ikdrop)));
}

function ikKid() { return IKC.kid(IK_CID) || {}; }
function ikLinkUrl(key) { return new URL('intake-form.html?k=' + key, location.href).href; }
function ikLinkText(x, kidRow) {
  const k = kidRow || ikKid();
  return '안녕하세요^^\n자라는 나무 입니다\n\n'
    + (k.name || '') + ' 아동 초기 상담 질문지입니다.\n'
    + '아래 링크를 눌러 초기 상담지를 작성해 주세요.\n'
    + '너무 오래되어 기억나지 않는 부분은 비워 두셔도 됩니다.\n'
    + '마지막에 「제출」 버튼까지 꼭 눌러 주세요.\n'
    + '(' + ikDayKo(x.expires_on) + '까지)\n'
    + ikLinkUrl(x.link_key) + '\n\n'
    + '궁금하신 점은 편하게 연락 주세요\n042-488-6011';
}
async function ikCopyText(t, btn) {
  try { await navigator.clipboard.writeText(t); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }
  if (btn) { const o = btn.textContent; btn.textContent = '복사됨'; setTimeout(() => btn.textContent = o, 1300); }
}
async function ikDropLink(id) {
  if (!confirm('이 질문지 링크를 막을까요?\n잘못 보낸 링크일 때 씁니다. 막으면 그 링크로는 더 이상 열 수 없습니다.')) return;
  const { data, error } = await IKC.sb.from('nl_intake_links').delete().eq('id', id).is('used_at', null).select('id');
  if (error || !data || !data.length) { alert('링크를 막지 못했습니다.' + (error ? '\n' + error.message : '\n(이미 제출되었을 수 있습니다)')); }
  ikLoad(IK_CID);
}

let IK_LINKING = false;
function ikBindBox() {
ik$('ikLinkBtn').onclick = async () => {
  if (!IK_CID || IK_LINKING) return;
  if (!(await ikReadForms())) { alert('질문지 서식을 읽지 못했습니다.'); return; }
  const k = ikKid();
  if (!k.birth) { alert('생년월일이 없어 질문지를 고를 수 없습니다.\n아동 생년월일을 먼저 넣어 주세요.'); return; }
  const m = ikMonths(k.birth);
  const f = ikFormFor(m);
  if (!f) { alert('해당 연령(' + m + '개월)의 질문지가 없습니다.'); return; }
  const td = ikToday();
  // 아직 안 쓴 링크가 있으면 새로 만들지 않고 그 링크로 문자 글을 복사한다 (2026-10-08 은정님)
  const open = IK_LINKS.find(x => !x.used_at && x.expires_on >= td && x.form_id === f.id);   // 개월이 넘어 서식이 바뀌면 새 링크
  if (open) {
    await ikCopyText(ikLinkText(open));
    alert('문자 글이 복사되었습니다 (' + ikDayKo(open.expires_on) + '까지 쓰는 링크).\n학부모께 문자로 붙여 보내 주세요.');
    return;
  }
  IK_LINKING = true; ik$('ikLinkBtn').disabled = true;
  try {
    const { data, error } = await IKC.sb.from('nl_intake_links').insert({
      child_id: IK_CID, form_id: f.id, expires_on: ikAddDays(IK_DAYS), created_by: IKC.me ? IKC.me.id : null
    }).select().single();
    if (error) throw error;
    if (!data) throw new Error('만든 링크를 돌려받지 못했습니다.');
    IK_LINKS.unshift(data);
    await ikCopyText(ikLinkText(data));
    alert(ikShort(f) + ' 질문지 링크를 만들고 문자 글을 복사했습니다.\n학부모께 문자로 붙여 보내 주세요.');
    ikLoad(IK_CID);
  } catch (e) {
    alert('링크를 만들지 못했습니다.\n' + e.message);
  } finally {
    IK_LINKING = false; ik$('ikLinkBtn').disabled = false;
  }
};

ik$('ikNewBtn').onclick = async () => {
  if (!IK_CID) return;
  if (!(await ikReadForms())) { alert('질문지 서식을 읽지 못했습니다.'); return; }
  const k = ikKid();
  const m = ikMonths(k.birth);
  const f = ikFormFor(m);
  if (!f) { alert('해당 연령' + (m == null ? '' : '(' + m + '개월)') + '의 상담지가 없습니다.'); return; }
  ikShow({ id: null, child_id: IK_CID, form_id: f.id, consult_on: ikToday(),
           counselor_id: IKC.me ? IKC.me.id : null, source: '나무링크' }, []);
};
}

async function ikOpen(id) {
  const n = IK_NOTES.find(x => x.id === id); if (!n) return;
  const { data, error } = await IKC.sb.from('nl_intake_answers').select('*').eq('note_id', id);
  if (error) { alert('답을 읽지 못했습니다.\n' + error.message); return; }
  ikShow(n, data || []);
}

function ikShow(note, answers) {
  IK_CUR = { note: note, ans: {} };
  answers.forEach(a => IK_CUR.ans[a.item_id] = { id: a.id, c: a.choice || '', t: a.text_val || '' });
  const wr = ikCanWrite();
  const k = ikKid();
  const f = IK_FORMS.find(x => x.id === note.form_id);
  const items = IK_ITEMS[note.form_id] || [];
  ik$('ikTitle').textContent = '초기 상담지 — ' + IK_CID + '번 ' + (k.name || '') + ' · ' + ikAgeTxt(ikMonths(k.birth, note.consult_on));
  ik$('ikSub').textContent = (f ? f.name : '') + ' · '
    + (note.source === '학부모' ? '학부모가 적음' : note.source === '구글' ? '구글 자료' : '센터에서 적음')
    + (note.created_at ? ' · ' + ikDayKo(note.created_at) : '');

  const dis = wr ? '' : ' disabled';
  const thList = IKC.thrs().slice();
  if (note.counselor_id && !thList.some(t => t.id === note.counselor_id))
    thList.push({ id: note.counselor_id, name: (note.counselor_id + '번 (그만둔 직원)') });   // 그만둔 직원도 지워지지 않게
  const thOpt = '<option value="">— 상담자 —</option>' + thList.map(t =>
    '<option value="' + t.id + '"' + (t.id === note.counselor_id ? ' selected' : '') + '>' + ikEsc(t.name) + '</option>').join('');
  let h = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;">'
    + '<div><div class="iklab">상담일</div><input type="date" id="ik_on" value="' + ikEsc(note.consult_on || '') + '"' + dis + '></div>'
    + '<div><div class="iklab">상담자' + (note.counselor_name && !note.counselor_id ? ' (구글: ' + ikEsc(note.counselor_name) + ')' : '') + '</div>'
    + '<select id="ik_th"' + dis + '>' + thOpt + '</select></div></div>'
    + '<div class="iklab">유입경로</div><input type="text" id="ik_ch" maxlength="100" value="' + ikEsc(note.channel || '') + '"' + dis + '>'
    + (note.log_text ? '<div class="iklab">구글 「상담 일지」 칸</div><div style="font-size:13px;color:#5F5E5A;">' + ikEsc(note.log_text) + '</div>' : '')
    + '<div class="iklab">주 호소문제</div><textarea id="ik_chief" maxlength="2000"' + dis + '>' + ikEsc(note.chief || '') + '</textarea>';
  IK_AREAS.forEach(a => {
    const qs = items.filter(x => x.area === a && x.kind === '3단계');
    if (!qs.length) return;
    h += '<div class="iksec">' + ikEsc(a) + '</div>';
    qs.forEach(x => {
      h += '<div class="ikq"><div class="t">' + ikEsc(x.question) + '</div><div class="b" data-ikq="' + x.id + '">'
        + IK_CHOICE.map((c, i) => '<button type="button" class="c' + (i + 1) + '" data-c="' + c + '"' + dis + '>' + c + '</button>').join('')
        + '</div></div>';
    });
  });
  const txt = items.filter(x => x.kind === '글');
  if (txt.length) h += '<div class="iksec">특이사항 · 공통확인</div>';
  txt.forEach(x => {
    h += '<div class="iklab">' + ikEsc(x.question) + '</div><textarea data-ikt="' + x.id + '" maxlength="2000"' + dis + '>'
      + ikEsc((IK_CUR.ans[x.id] || {}).t || '') + '</textarea>';
  });
  h += '<div class="iksec">종합 메모 및 추천 방향 (센터)</div><textarea id="ik_total" maxlength="4000"' + dis + '>'
    + ikEsc(note.total_memo || '') + '</textarea>';
  ik$('ikBody').innerHTML = h;
  ikPaint();

  ik$('ikBody').querySelectorAll('[data-ikq] button').forEach(b => {
    b.onclick = () => {
      const q = Number(b.parentNode.dataset.ikq), c = b.dataset.c;
      const cur = IK_CUR.ans[q] || {};
      IK_CUR.ans[q] = Object.assign({}, cur, { c: cur.c === c ? '' : c });   // 한 번 더 누르면 풀림
      ikPaint(); ikDirty();
    };
  });
  ik$('ikBody').querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', ikDirty); el.addEventListener('change', ikDirty);
  });
  ik$('ikSave').style.display = wr ? '' : 'none';
  ik$('ikDel').style.display = wr && note.id ? '' : 'none';
  IK_DIRTY = !note.id;
  ikBtn(note.id ? 'done' : 'before');
  ik$('ikMsg').textContent = '';
  ik$('ikBg').style.display = 'block';
  ik$('ikBg').scrollTop = 0;
}
function ikPaint() {
  ik$('ikBody').querySelectorAll('[data-ikq]').forEach(g => {
    const c = (IK_CUR.ans[g.dataset.ikq] || {}).c;
    g.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === c));
  });
}
function ikDirty() { if (IK_SAVING) return; IK_DIRTY = true; ikBtn('before'); }
function ikBtn(st) {
  const b = ik$('ikSave');
  b.classList.toggle('done', st === 'done');
  b.disabled = st === 'saving';
  b.textContent = st === 'saving' ? '저장 중…' : st === 'done' ? '✓ 저장됨' : '💾 저장 전';
}
function ikHide() { ik$('ikBg').style.display = 'none'; IK_CUR = null; IK_DIRTY = false; }
function ikBindWin() {
ik$('ikClose').onclick = () => {
  if (IK_DIRTY && ikCanWrite() && !confirm('저장하지 않은 내용이 있습니다.\n그래도 닫을까요?')) return;
  ikHide();
};

ik$('ikSave').onclick = async () => {
  if (!IK_CUR || IK_SAVING || !ikCanWrite()) return;
  const n = IK_CUR.note;
  const row = {
    child_id: n.child_id, form_id: n.form_id,
    consult_on: ik$('ik_on').value || null,
    counselor_id: ik$('ik_th').value ? Number(ik$('ik_th').value) : null,
    channel: ik$('ik_ch').value.trim() || null,
    chief: ik$('ik_chief').value.trim() || null,
    total_memo: ik$('ik_total').value.trim() || null,
    updated_at: new Date().toISOString()
  };
  ik$('ikBody').querySelectorAll('[data-ikt]').forEach(t => {
    const q = Number(t.dataset.ikt);
    IK_CUR.ans[q] = Object.assign({}, IK_CUR.ans[q], { t: t.value });
  });
  IK_SAVING = true; ikBtn('saving');
  try {
    let nid = n.id;
    if (nid) {
      const { data, error } = await IKC.sb.from('nl_intake_notes').update(row).eq('id', nid).select('id');
      if (error) throw error;
      if (!data || !data.length) throw new Error('고친 줄이 없습니다.');
    } else {
      row.source = '나무링크'; row.created_by = IKC.me ? IKC.me.id : null;
      const { data, error } = await IKC.sb.from('nl_intake_notes').insert(row).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('넣은 줄을 돌려받지 못했습니다.');
      nid = data.id; IK_CUR.note = data;
    }
    // 답 — 있는 것은 덮어쓰고, 비운 것은 지운다
    const put = [], drop = [];
    Object.keys(IK_CUR.ans).forEach(q => {
      const a = IK_CUR.ans[q];
      const c = a.c || null, t = String(a.t || '').trim() || null;
      if (c || t) put.push({ note_id: nid, item_id: Number(q), choice: c, text_val: t });
      else if (a.id) drop.push(a.id);
    });
    if (put.length) {
      const { data, error } = await IKC.sb.from('nl_intake_answers')
        .upsert(put, { onConflict: 'note_id,item_id' }).select('id, item_id');
      if (error) throw error;
      if (!data || data.length !== put.length) throw new Error('답이 다 저장되지 않았습니다.');
      data.forEach(d => { IK_CUR.ans[d.item_id] = Object.assign({}, IK_CUR.ans[d.item_id], { id: d.id }); });
    }
    if (drop.length) {
      const { error } = await IKC.sb.from('nl_intake_answers').delete().in('id', drop);
      if (error) throw error;
      Object.keys(IK_CUR.ans).forEach(q => { if (drop.indexOf(IK_CUR.ans[q].id) >= 0) delete IK_CUR.ans[q].id; });
    }
    IK_DIRTY = false; ikBtn('done');
    ik$('ikDel').style.display = '';
    ik$('ikMsg').className = 'out ok'; ik$('ikMsg').textContent = '';
    ikLoad(IK_CID);
  } catch (e) {
    ikBtn('before');
    ik$('ikMsg').className = 'out err'; ik$('ikMsg').textContent = '❌ 저장하지 못했습니다.\n' + e.message;
  } finally {
    IK_SAVING = false;
  }
};

ik$('ikDel').onclick = async () => {
  if (!IK_CUR || !IK_CUR.note.id || !ikCanWrite()) return;
  if (!confirm('이 초기 상담지를 지울까요?\n질문과 답이 함께 지워지고 되돌릴 수 없습니다.')) return;
  const { data, error } = await IKC.sb.from('nl_intake_notes').delete().eq('id', IK_CUR.note.id).select('id');
  if (error || !data || !data.length) { alert('지우지 못했습니다.' + (error ? '\n' + error.message : '')); return; }
  ikHide(); ikLoad(IK_CID);
};
}

window.addEventListener('beforeunload', e => {
  if (!IK_DIRTY || !IK_CUR || !ikCanWrite()) return;
  e.preventDefault(); e.returnValue = '';
});



window.NLIntake = {
  init(o) {
    IKC.sb = o.sb; IKC.me = o.me || null; IKC.kid = o.kid || (() => null);
    if (!ik$('ikBg')) document.body.insertAdjacentHTML('beforeend', IK_WIN_HTML);
    ikBindWin();
    if (ik$('ikLinkBtn')) ikBindBox();
    IKC.ready = (async () => {
      try {
        const r = await IKC.sb.from('nl_therapists').select('id, name, role, active').order('id');
        IKC._all = r.data || [];
        IKC._thrs = IKC._all.filter(t => (t.active && t.role === '치료사') || (IKC.me && t.id === Number(IKC.me.id)));
      } catch (e) {}
    })();
  },
  bindBox() { ikBindBox(); },
  load(cid) { return ikLoad(cid); },
  canWrite() { return ikCanWrite(); },
  box() {
    return '<div class="logbox ikbx" id="ikBox">'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">'
      + '<span style="font-size:12.5px;font-weight:700;color:#2c5c37;">📋 초기 상담지</span>'
      + '<span style="flex:1 1 auto;"></span>'
      + '<button type="button" id="ikLinkBtn" class="tab ikwb">📨 질문지 문자 안내</button>'
      + '<button type="button" id="ikNewBtn" class="tab ikwb">✏️ 직접 쓰기</button></div>'
      + '<div id="ikList" style="font-size:13.5px;line-height:1.8;"></div></div>';
  }
};
