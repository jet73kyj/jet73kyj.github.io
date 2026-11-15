// ─────────────────────────────────────────────
// 기록지에 적던 글 잠깐 모아 두기 (2026-11-12 은정님)
//   91번처럼 저장 전에 창이 닫혀도, 다시 열면 「저장하지 않은 글이 있습니다」 → 되살리기
//   · 이 컴퓨터 브라우저(localStorage)에만 모아 둔다 — 서버에는 안 올라감
//   · 서버 「저장」이 끝나면 바로 지운다 · 7일이 지나도 지운다
//   쓰는 법 (화면마다)
//     NLDraft.init({ page:'rd', sel:'textarea.st_result, …', scope:()=>el, key:()=>'91|2026-10' })
//     불러오기가 끝난 뒤  NLDraft.check()
//     저장이 끝난 뒤      NLDraft.clear()
// ─────────────────────────────────────────────
(function () {
  const PRE = 'nl_draft:';
  const KEEP_MS = 7 * 24 * 3600 * 1000;
  let O = null, KEY = null, BASE = null, PENDING = null, TIMER = null;

  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  // 7일 지난 것 지우기
  function purge() {
    try {
      const now = Date.now();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k || k.indexOf(PRE) !== 0) continue;
        const v = read(k);
        if (!v || !v.at || now - v.at > KEEP_MS) localStorage.removeItem(k);
      }
    } catch (e) {}
  }

  // 칸마다 이름 — id 가 있으면 id, 없으면 「class 이름 · 몇째」
  function fields() {
    const root = O && O.scope ? O.scope() : document;
    if (!root) return [];
    const els = [...root.querySelectorAll(O.sel)].filter(el => !el.readOnly && !el.disabled);
    const cnt = {};
    return els.map(el => {
      let n;
      if (el.id) n = '#' + el.id;
      else {
        const c = (el.className || '').split(/\s+/).filter(Boolean)[0] || el.tagName;
        cnt[c] = (cnt[c] || 0) + 1;
        n = c + '|' + cnt[c];
      }
      return [n, el];
    });
  }
  function snap() { const m = {}; fields().forEach(([n, el]) => { m[n] = el.value; }); return m; }
  function fullKey() { const k = O && O.key ? O.key() : null; return k ? PRE + O.page + ':' + k : null; }

  // 적은 것 모으기 — 처음 불러온 값과 다른 칸만
  function save() {
    TIMER = null;
    if (!O || !KEY || !BASE || PENDING) return;
    if (fullKey() !== KEY) return;          // 그 사이 다른 아동 · 달
    const now = snap(), diff = {};
    let n = 0;
    Object.keys(now).forEach(k => {
      if (now[k] !== (BASE[k] == null ? '' : BASE[k]) && String(now[k]).trim() !== '') { diff[k] = now[k]; n++; }
    });
    store(KEY, n ? { at: Date.now(), vals: diff } : null);
  }
  function soon() { if (TIMER) clearTimeout(TIMER); TIMER = setTimeout(save, 1500); }

  function hideBar() { const b = document.getElementById('nlDraftBar'); if (b) b.remove(); }

  function showBar(d) {
    hideBar();
    const root = O.scope ? O.scope() : null;
    if (!root || !root.parentNode) return;
    const t = new Date(d.at);
    const hh = t.getHours(), ap = hh < 12 ? '오전' : '오후', h12 = (hh % 12) || 12;
    const when = (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + ap + ' ' + h12 + ':' + String(t.getMinutes()).padStart(2, '0');
    const n = Object.keys(d.vals).length;
    const bar = document.createElement('div');
    bar.id = 'nlDraftBar';
    bar.className = 'no-print';
    bar.style.cssText = 'background:#FAEEDA;border:1px solid #EF9F27;border-radius:8px;padding:9px 14px;margin:0 0 12px;'
      + 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#633806;font-size:14px';
    bar.innerHTML = '<span style="flex:1;min-width:240px"><b>저장하지 않은 글이 있습니다</b> · ' + when
      + '에 이 컴퓨터에서 적던 것 (글 칸 ' + n + '개)</span>'
      + '<button type="button" data-a="ok" style="width:auto!important;margin:0!important;padding:6px 14px;border:1px solid #BA7517;background:#fff;color:#633806;border-radius:6px;cursor:pointer;font-size:13px">되살리기</button>'
      + '<button type="button" data-a="no" style="width:auto!important;margin:0!important;padding:6px 14px;border:1px solid #D3D1C7;background:#fff;color:#5F5E5A;border-radius:6px;cursor:pointer;font-size:13px">버리기</button>';
    root.parentNode.insertBefore(bar, root);
    bar.querySelector('[data-a="ok"]').onclick = () => {
      const map = {};
      fields().forEach(([nm, el]) => { map[nm] = el; });
      let put = 0;
      Object.keys(d.vals).forEach(k => {
        const el = map[k];
        if (!el) return;
        el.value = d.vals[k];
        el.dispatchEvent(new Event('input', { bubbles: true }));   // 「저장 전」으로 바뀜
        put++;
      });
      PENDING = null; hideBar();
      store(KEY, { at: Date.now(), vals: d.vals });                 // 저장할 때까지 계속 남김
      const miss = n - put;
      alert('글 칸 ' + put + '개를 되살렸습니다.' + (miss ? '\n(' + miss + '칸은 지금 화면에 같은 자리가 없어 넣지 못했습니다)' : '')
        + '\n\n확인한 뒤 「저장」을 눌러 주세요.');
    };
    bar.querySelector('[data-a="no"]').onclick = () => {
      if (!confirm('적던 글을 버릴까요? 되살릴 수 없습니다.')) return;
      PENDING = null; hideBar(); store(KEY, null);
    };
  }

  window.NLDraft = {
    init(o) {
      O = o; purge();
      document.addEventListener('input', e => {
        if (!O || !e.target || !e.target.matches || !e.target.matches(O.sel)) return;
        soon();
      }, true);
      setInterval(() => { if (KEY && BASE && !PENDING) save(); }, 5000);
      window.addEventListener('pagehide', () => { if (KEY && BASE && !PENDING) save(); });
    },
    // 불러오기가 끝난 뒤 — 지금 값을 기준으로 삼고, 모아 둔 글이 있으면 띠를 띄움
    check() {
      if (!O) return;
      if (TIMER) { clearTimeout(TIMER); TIMER = null; }
      hideBar(); PENDING = null;
      KEY = fullKey();
      BASE = KEY ? snap() : null;
      if (!KEY) return;
      const d = read(KEY);
      if (!d || !d.vals) return;
      if (Date.now() - d.at > KEEP_MS) { store(KEY, null); return; }
      // 지금 화면과 같은 글뿐이면 띄울 것 없음
      const real = {};
      Object.keys(d.vals).forEach(k => { if ((BASE[k] == null ? '' : BASE[k]) !== d.vals[k]) real[k] = d.vals[k]; });
      if (!Object.keys(real).length) { store(KEY, null); return; }
      PENDING = { at: d.at, vals: real };
      showBar(PENDING);
    },
    // 서버 저장이 끝난 뒤 — 띠가 떠 있으면(되살릴지 아직 안 고름) 남김
    clear() {
      if (!O || PENDING) return;
      const k = fullKey();
      if (k) store(k, null);
      KEY = k; BASE = k ? snap() : null;
    }
  };
})();
