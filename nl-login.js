/* 나무링크 — 로그인 보관 방식
 *
 * 기본은 「탭 안에서만」 유지한다. 탭을 닫으면 로그인이 끊긴다.
 * 센터 공용 컴퓨터에 로그인이 남지 않게 하기 위함이다.
 *
 * 다만 아래 두 경우는 브라우저에 남긴다.
 *   1) 대표(8번) — 화면 파일을 자주 바꾸시는데 그때마다 다시 로그인하기 번거롭다
 *   2) 휴대폰·태블릿에서 연 경우 — 개인 기기로 보고 30일 동안 유지한다
 *      바탕화면 아이콘으로 여실 때 매번 번호를 치지 않으셔도 된다
 *
 * 30일이 지나면 한 번 다시 로그인해야 한다.
 * 휴대폰을 잃어버렸을 때는 관리자가 그 계정 비밀번호를 바꾸면 끊긴다.
 *
 * 쓰는 법 — 화면 파일에서
 *   1) <script src="nl-login.js"></script> 를 supabase-js 다음에 넣는다
 *   2) createClient 의 storage 를 window.sessionStorage → nlStore 로 바꾼다
 *   3) 로그인해서 누구인지 알아낸 뒤 nlKeep(me.id) 를 부른다
 *   4) 로그아웃할 때 nlKeepOff() 를 부른다
 */
(function (w) {
  var KEEP = 'nl_keep_login';      // '1' 이면 브라우저에 남긴다
  var TILL = 'nl_keep_until';      // 언제까지 남길지 (밀리초)
  var BOSS = 8;                    // 대표(은정님) 번호
  var DAYS = 30;                   // 휴대폰에서 로그인을 유지하는 날 수

  // 휴대폰·태블릿인가
  //   화면 너비와 손가락으로 만지는 기기인지를 함께 본다
  w.nlIsMobile = function () {
    try {
      var ua = String(w.navigator.userAgent || '');
      var touch = ('ontouchstart' in w) || (w.navigator.maxTouchPoints > 0);
      var small = Math.min(w.screen.width, w.screen.height) <= 1024;
      var phone = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
      return phone && touch && small;
    } catch (e) { return false; }
  };

  function on() {
    try {
      if (w.localStorage.getItem(KEEP) !== '1') return false;
      // 기한이 지났으면 끊는다
      var till = Number(w.localStorage.getItem(TILL) || 0);
      if (till && Date.now() > till) { w.nlKeepOff(); return false; }
      return true;
    } catch (e) { return false; }
  }

  // supabase 가 쓸 보관함
  w.nlStore = {
    getItem: function (k) {
      if (on()) {
        try { var v = w.localStorage.getItem(k); if (v != null) return v; } catch (e) {}
      }
      try { return w.sessionStorage.getItem(k); } catch (e) { return null; }
    },
    setItem: function (k, v) {
      try { w.sessionStorage.setItem(k, v); } catch (e) {}
      if (on()) { try { w.localStorage.setItem(k, v); } catch (e) {} }
    },
    removeItem: function (k) {
      try { w.sessionStorage.removeItem(k); } catch (e) {}
      try { w.localStorage.removeItem(k); } catch (e) {}
    }
  };

  // 센터 컴퓨터에서만 쓸 수 있는 직원 번호
  //   행정(9번) 화면에는 납부·보호자 연락처가 다 있어
  //   휴대폰에서도, 열쇠가 없는 컴퓨터에서도 열리지 않게 한다
  // 2026-10-05 — 행정 업무 계정 19번으로 옮김 (9번은 개인 계정 · 휴대폰 됨 · 내 급여명세서만)
  var PC_ONLY = [19];
  var PCKEY   = 'nl_office_pc';    // 이 컴퓨터가 센터 컴퓨터라는 표시

  // 이 컴퓨터에 열쇠가 심어져 있는가
  w.nlHasPcKey = function () {
    try { return w.localStorage.getItem(PCKEY) === '1'; } catch (e) { return false; }
  };
  // 열쇠 심기 / 빼기 (관리자가 그 컴퓨터에서 한 번만 한다)
  w.nlSetPcKey = function (on) {
    try {
      if (on) w.localStorage.setItem(PCKEY, '1');
      else    w.localStorage.removeItem(PCKEY);
    } catch (e) {}
  };

  // 센터 컴퓨터가 아니면 화면을 막고 로그인을 끊는다
  //   ① 휴대폰·태블릿이거나  ② 열쇠가 안 심어진 컴퓨터
  function blockIfMobile(id) {
    if (PC_ONLY.indexOf(Number(id)) < 0) return false;
    if (!w.nlIsMobile() && w.nlHasPcKey()) return false;
    w.nlKeepOff();
    try {
      for (var i = w.sessionStorage.length - 1; i >= 0; i--) {
        var k = w.sessionStorage.key(i);
        if (k && k.indexOf('sb-') === 0) w.sessionStorage.removeItem(k);
      }
    } catch (e) {}
    try {
      document.body.innerHTML =
        '<div style="max-width:420px;margin:60px auto;padding:28px;'
        + 'background:#fff;border:1px solid #e8ebe4;border-radius:14px;'
        + 'font-family:-apple-system,\'Malgun Gothic\',sans-serif;'
        + 'color:#1c1f1a;line-height:1.8;text-align:center;">'
        + '<div style="font-size:36px;margin-bottom:12px;">🌿</div>'
        + '<div style="font-size:17px;font-weight:600;margin-bottom:14px;">'
        + '센터 컴퓨터에서 이용해 주세요</div>'
        + '<div style="font-size:14px;color:#5a6156;">'
        + '이 화면에는 아동과 보호자의 개인정보가 담겨 있어<br>'
        + '센터 컴퓨터에서만 열 수 있습니다.<br><br>'
        + '휴대폰이나 집 컴퓨터에서는 열리지 않습니다.<br>'
        + '센터 컴퓨터에서 로그인해 주세요.</div>'
        + '</div>';
    } catch (e) {}
    return true;
  }

  // 퇴사 뒤 14일 — 기록지 화면만 (2026-10-03)
  //   홈(index.html)이 로그인할 때 「nl_left_mode = 번호|퇴사일」을 남긴다
  //   그 직원이면 기록지 · 홈 말고는 홈으로 돌려보낸다 (15일째부터는 서버가 자료를 막음)
  function leftGate(id) {
    try {
      var v = String(w.localStorage.getItem('nl_left_mode') || '');
      if (!v || v.split('|')[0] !== String(id)) return false;
      var f = String(w.location.pathname || '').split('/').pop() || 'index.html';
      // 내 급여명세서도 열림 — 퇴사한 직원도 자기 명세서는 봐야 함 (2026-10-08)
      if (/^record-/.test(f) || f === 'my-salary.html' || f === 'index.html' || f === '') return false;
      w.alert('퇴사 처리된 계정입니다.\n기록지 화면만 열 수 있습니다.');
      w.location.replace('index.html');
      return true;
    } catch (e) { return false; }
  }

  // 로그인해서 누구인지 알아낸 뒤 부른다
  w.nlKeep = function (id) {
    if (leftGate(id)) return;
    if (blockIfMobile(id)) return;
    var keep = (Number(id) === BOSS) || w.nlIsMobile();
    if (!keep) { w.nlKeepOff(); return; }
    try {
      w.localStorage.setItem(KEEP, '1');
      // 대표는 기한 없이, 휴대폰은 30일
      if (Number(id) === BOSS) w.localStorage.removeItem(TILL);
      else w.localStorage.setItem(TILL,
             String(Date.now() + DAYS * 24 * 60 * 60 * 1000));
      // 이미 탭에 담긴 로그인 정보를 브라우저 쪽으로 옮겨 둔다
      for (var i = 0; i < w.sessionStorage.length; i++) {
        var k = w.sessionStorage.key(i);
        if (k && k.indexOf('sb-') === 0) {
          w.localStorage.setItem(k, w.sessionStorage.getItem(k));
        }
      }
    } catch (e) {}
  };

  // 로그아웃할 때 부른다
  w.nlKeepOff = function () {
    try {
      w.localStorage.removeItem(KEEP);
      w.localStorage.removeItem(TILL);
      var kill = [];
      for (var i = 0; i < w.localStorage.length; i++) {
        var k = w.localStorage.key(i);
        if (k && k.indexOf('sb-') === 0) kill.push(k);
      }
      kill.forEach(function (k) { w.localStorage.removeItem(k); });
    } catch (e) {}
  };
})(window);

/* 새로고침 단추 (2026-10-01) — 이 파일을 쓰는 직원 화면 모두
 *   「처음으로」 단추 왼쪽에 같은 모양으로 끼운다. 「처음으로」가 없으면 「로그아웃」 왼쪽
 *   화면이 머리를 나중에 그려도 붙도록 지켜보다가, 없어지면 다시 붙인다
 *   저장 안 한 칸이 있는 화면은 브라우저가 「나가시겠습니까?」를 묻는다 (화면마다 원래 규칙)
 */
(function (w) {
  var busy = false;
  function findRef() {
    var els = document.querySelectorAll('button, a');
    var home = null, out = null;
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').trim();
      if (!home && (t === '처음으로' || t === '홈')) home = els[i];
      if (!out && t === '로그아웃') out = els[i];
      if (home) break;
    }
    return home || out;
  }
  // ‹ 단추는 2026-10-05 은정님 뜻으로 뺌 (☰ 메뉴가 그 일을 함)
  // 「처음으로」 단추 이름을 「홈」으로 (2026-10-05 은정님 · 화면 파일은 그대로 두고 여기서 바꿈)
  function homeName() {
    var els = document.querySelectorAll('button, a');
    for (var i = 0; i < els.length; i++) { if ((els[i].textContent || '').trim() === '처음으로') els[i].textContent = '홈'; }
  }
  function put() {
    homeName();
    if (document.getElementById('nlReload')) return;
    var ref = findRef();
    if (!ref || !ref.parentNode) return;
    var b = document.createElement(ref.tagName === 'A' ? 'a' : 'button');
    b.id = 'nlReload';
    b.className = ref.className;
    if (b.tagName === 'A') { b.href = '#'; b.setAttribute('role', 'button'); } else { b.type = 'button'; }
    b.textContent = '새로고침';
    b.title = '화면을 새로 읽기';
    b.style.marginRight = '6px';
    b.onclick = function (ev) { ev.preventDefault(); w.location.reload(); };
    ref.parentNode.insertBefore(b, ref);
  }
  function soon() {
    if (busy) return;
    busy = true;
    w.requestAnimationFrame(function () { busy = false; put(); });
  }
  function start() {
    put();
    try {
      new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);

/* 날짜 칸 (2026-10-05 은정님) — 자라는나무 링크 app.js 와 같은 것 */
// ── 날짜 칸 (2026-10-05 은정님) — 숫자 8자리만 치면 「-」가 저절로 · 커서를 옮기지 않아도 됨 ──
//   크롬 날짜 칸은 한 자리만 치고 옮기면 0001-01-01 처럼 채워 버려서, 모든 날짜 칸을 글 칸으로 바꿔 보여 줌
//   · 원래 날짜 칸(id · 값 · 이벤트)은 그대로 두고 숨김 → 화면 코드는 고칠 것 없음
//   · 「20261013」 → 2026-10-13 · 범위(처음 1900-01-01 ~ 2099-12-31) 밖이거나 없는 날이면 빨간 테두리 · 값 비움
//   · 오른쪽 달력 그림을 누르면 크롬 달력이 열림
(function () {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const css = document.createElement('style');
  css.textContent =
    '.nlDate{display:inline-flex;flex-wrap:nowrap;align-items:stretch;position:relative;max-width:100%;vertical-align:middle}' +
    '.nlDate input.nlDt{flex:1 1 auto;min-width:0;width:100%;font-variant-numeric:tabular-nums}' +
    '.nlDate input.nlDt.bad{border-color:#C2553A !important;box-shadow:0 0 0 2px #FBEDE6 !important}' +
    '.nlDate .nlDb{flex:0 0 auto;margin-left:4px;border:1px solid #E4E0DA;background:#fff;border-radius:6px;padding:0 8px;cursor:pointer;color:#7E5530;height:auto;font-size:14px}' +
    '.nlDate .nlDb:disabled{opacity:.5;cursor:default}' +
    '.nlDate input[type=date]{position:absolute;right:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0}';
  document.head.appendChild(css);
  const okDate = v => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false; const d = new Date(v + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === v; };
  function fmt(digits) { const d = digits.slice(0, 8); return d.length > 6 ? d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6) : d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d; }
  function wrap(el) {
    if (el.dataset.nld) return; el.dataset.nld = '1';
    // 처음 범위 — 직원 생년월일도 들어가게 넓게 · 화면 · 서버가 더 좁게 다시 따짐
    if (!el.min) el.min = '1900-01-01';
    if (!el.max) el.max = '2099-12-31';
    const box = document.createElement('span'); box.className = 'nlDate';
    if (el.style.width) box.style.width = el.style.width;
    const tx = document.createElement('input');
    tx.type = 'text'; tx.className = (el.className ? el.className + ' ' : '') + 'nlDt';
    tx.inputMode = 'numeric'; tx.placeholder = 'YYYY-MM-DD'; tx.maxLength = 10; tx.autocomplete = 'off';
    tx.setAttribute('aria-label', el.getAttribute('aria-label') || '날짜 (숫자 8자리)');
    tx.style.cssText = el.style.cssText; tx.style.width = '100%';
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'nlDb'; bt.textContent = '📅'; bt.setAttribute('aria-label', '달력에서 고르기');
    // 칸 넓이 — 원래 날짜 칸이 칸을 꽉 채우던 자리(제목 + 칸 하나)면 꽉 채우고, 아니면 날짜만큼
    const sibs = [...el.parentNode.children].filter(x => x !== el && x.tagName !== 'LABEL' && x.tagName !== 'SPAN');
    if (!el.style.width) box.style.width = sibs.length ? '150px' : '100%';
    el.parentNode.insertBefore(box, el); box.append(tx, bt, el);
    // 원래 칸은 감춤 — 화면의 꾸밈(아이디 선택자)이 이기지 않게 칸에 직접 !important
    ['position:absolute', 'right:0', 'bottom:0', 'width:1px', 'height:1px', 'opacity:0', 'pointer-events:none', 'border:0', 'padding:0', 'margin:0', 'min-width:0']
      .forEach(r => { const [k, v] = r.split(':'); el.style.setProperty(k, v, 'important'); });
    // 화면 전체에 걸린 input · button 꾸밈(넓이 100% · 위 여백 20px · 초록 바탕 등)이 붙지 않게
    [['width', 'auto'], ['margin', '0 0 0 4px'], ['padding', '0 9px'], ['height', 'auto'], ['min-height', '0'], ['background', '#fff'], ['color', '#7E5530'], ['border', '1px solid #E4E0DA'], ['border-radius', '6px'], ['flex', '0 0 auto'], ['font-size', '14px'], ['line-height', '1']]
      .forEach(([k, v]) => bt.style.setProperty(k, v, 'important'));
    [['margin', '0'], ['flex', '1 1 auto'], ['min-width', '0'], ['display', 'block']].forEach(([k, v]) => tx.style.setProperty(k, v, 'important'));
    const fire = () => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    // 코드가 값을 넣으면 글 칸도 따라감
    Object.defineProperty(el, 'value', { configurable: true, get() { return desc.get.call(el); }, set(v) { desc.set.call(el, v); tx.value = v || ''; tx.classList.remove('bad'); } });
    tx.value = desc.get.call(el) || '';
    tx.addEventListener('input', () => {
      const dg = tx.value.replace(/[^0-9]/g, '');
      const f = fmt(dg);
      if (f !== tx.value) { tx.value = f; }
      if (dg.length === 8) {
        const inRange = okDate(f) && (!el.min || f >= el.min) && (!el.max || f <= el.max);
        tx.classList.toggle('bad', !inRange);
        const nv = inRange ? f : '';
        if (desc.get.call(el) !== nv) { desc.set.call(el, nv); fire(); }
      } else {
        tx.classList.remove('bad');
        if (desc.get.call(el)) { desc.set.call(el, ''); fire(); }
      }
    });
    tx.addEventListener('blur', () => { const dg = tx.value.replace(/[^0-9]/g, ''); if (dg && dg.length < 8) tx.classList.add('bad'); });
    el.addEventListener('change', () => { tx.value = desc.get.call(el) || ''; tx.classList.remove('bad'); });
    bt.onclick = () => { try { el.showPicker(); } catch (e) { tx.focus(); } };
    const sync = () => { tx.disabled = el.disabled; bt.disabled = el.disabled || el.readOnly; tx.readOnly = el.readOnly; };
    sync(); new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('input[type=date]') : []).forEach(wrap); }
  const start = () => {
    scan(document);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches('input[type=date]')) wrap(n); else scan(n);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* ☰ 메뉴 · 모든 화면 알림 (2026-10-05 은정님)
 *   ① 어느 화면에서든 「☰ 메뉴」로 홈과 같은 목록을 펼쳐 바로 이동 (목록은 nl-menu.js 한 곳)
 *   ② 결석 · 보강 요청 알림 창(nl-live-alert.js)을 이 파일을 쓰는 모든 직원 화면에서 켬
 *      화면이 이미 nl-live-alert.js 를 붙여 스스로 켜는 곳은 건드리지 않음 (두 번 켜지 않게)
 *   화면이 로그인 뒤 nlKeep(번호)를 부를 때 함께 돈다
 */
(function (w) {
  var ME = null;
  function getSb() { try { return (typeof sb !== 'undefined') ? sb : null; } catch (e) { return null; } }
  function loadScript(src, cb) {
    var s = document.createElement('script'); s.src = src;
    s.onload = function () { try { cb(); } catch (e) {} };
    document.head.appendChild(s);
  }
  function isHome() { var p = w.location.pathname; return /\/$|\/index\.html$/.test(p); }
  function menuItems() {
    var out = [];
    (w.NL_MENU || []).forEach(function (g) {
      if (g.boss && ME.id !== 8) return;
      var its = (g.items || []).filter(function (it) { return (it.roles || []).indexOf(ME.role) >= 0; });
      if (its.length) out.push({ grp: g.grp, items: its });
    });
    return out;
  }
  // 묶음 색 — 홈 카드와 같게 (index.html GCOLOR)
  var GC = { '일정': ['#C9A27E', '#7E5530'], '아동': ['#8FB39A', '#4F7A5C'], '납부': ['#8AA6C1', '#4F6F8F'], '학부모': ['#D6A3B2', '#8E4F62'],
             '소식': ['#D4B266', '#85692A'], '정산': ['#C98B73', '#9A5A44'], '치료 기록지': ['#A99BC9', '#62558A'] };
  function plain(h) { return String(h || '').split(/<br\s*\/?>/i)[0].replace(/<[^>]+>/g, '').trim(); }
  function closePanel() { var p = document.getElementById('nlMenuPanel'); if (p) p.remove(); }
  // ‹ 뒤로 가기로 돌아온 화면에 판이 열린 채 남지 않게 (크롬이 떠난 화면을 붙들어 둠 · 2026-10-07)
  w.addEventListener('pageshow', closePanel);
  function openPanel(btn) {
    if (document.getElementById('nlMenuPanel')) { closePanel(); return; }
    var groups = menuItems();
    var file = w.location.pathname.split('/').pop(), hash = w.location.hash;
    var p = document.createElement('div');
    p.id = 'nlMenuPanel';
    var wide = w.innerWidth >= 700;
    p.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1px solid #ECE8E3;border-radius:12px;overflow:hidden;'
      + 'box-shadow:0 12px 32px rgba(47,41,38,.18);width:' + (wide ? '580px' : 'calc(100vw - 20px)') + ';max-height:78vh;display:flex;flex-direction:column;'
      + 'font-family:-apple-system,"Malgun Gothic",sans-serif;color:#2F2926;';
    var head = '<div style="background:#F8F1E8;border-bottom:2px solid #C9A27E;padding:9px 14px;display:flex;align-items:center;gap:8px;">'
      + '<b style="font-size:14px;font-weight:600;">바로 가기</b><span style="font-size:11.5px;color:#A39C95;">Ctrl + 클릭 = 새 탭</span>'
      + '<button type="button" id="nlPushSet" style="margin-left:auto;width:auto;margin-top:0;padding:2px 10px;font-size:12.5px;background:#fff;color:#7E5530;border:1px solid #D9C3A7;border-radius:6px;cursor:pointer;">🔔 알림 설정</button>'
      + '<button type="button" id="nlMenuX" style="margin-left:6px;width:auto;margin-top:0;padding:2px 10px;font-size:13px;background:#fff;color:#4A433F;border:1px solid #E4E0DA;border-radius:6px;cursor:pointer;">✕</button></div>';
    var body = '<div style="padding:12px 14px;overflow:auto;display:grid;grid-template-columns:' + (wide ? 'repeat(2,minmax(0,1fr))' : '1fr') + ';gap:12px 16px;">'
      + groups.map(function (g) {
          var c = GC[g.grp] || ['#C9A27E', '#7E5530'];
          return '<div><div style="font-size:12px;font-weight:600;color:' + c[1] + ';border-left:3px solid ' + c[0] + ';padding-left:7px;margin-bottom:4px;">' + g.grp + '</div>'
            + g.items.map(function (it) {
                var f = it.f.split('#')[0], hh = it.f.indexOf('#') >= 0 ? '#' + it.f.split('#')[1] : '';
                var on = (f === file || (it.also || []).indexOf(file) >= 0) && (hh === hash);
                return '<a href="' + it.f + '" class="nlmi" style="display:block;padding:6px 8px;border-radius:7px;text-decoration:none;'
                  + (on ? 'background:#FBF5EE;' : '') + '">'
                  + '<div style="font-size:13.5px;' + (on ? 'color:' + c[1] + ';font-weight:600;' : 'color:#2F2926;font-weight:500;') + '">' + (on ? '● ' : '') + it.nm + '</div>'
                  + '</a>';
              }).join('') + '</div>';
        }).join('') + '</div>';
    p.innerHTML = head + body;
    document.body.appendChild(p);
    var r = btn.getBoundingClientRect();
    p.style.left = Math.max(10, Math.min(r.right - p.offsetWidth, w.innerWidth - p.offsetWidth - 10)) + 'px';
    p.style.top = (r.bottom + 6) + 'px';
    p.querySelectorAll('a.nlmi').forEach(function (a) {
      var base = a.style.background;
      // 고르면 판을 바로 닫는다 (2026-10-07 은정님 — ✕ 누르기 번거로움)
      a.addEventListener('click', function () { closePanel(); });
      a.addEventListener('mouseenter', function () { if (!base) a.style.background = '#FAF9F7'; });
      a.addEventListener('mouseleave', function () { a.style.background = base; });
    });
    document.getElementById('nlMenuX').onclick = closePanel;
    document.getElementById('nlPushSet').onclick = function () {
      closePanel();
      var c = getSb();
      var go = function () { if (w.NLPush && c && ME) NLPush.settings({ sb: c, kind: 'staff', who: ME.id }); };
      if (w.NLPush) go(); else loadScript('nl-push.js', go);
    };
    setTimeout(function () {
      document.addEventListener('click', function off(ev) {
        if (!document.getElementById('nlMenuPanel')) { document.removeEventListener('click', off); return; }
        if (!p.contains(ev.target) && ev.target !== btn) { closePanel(); document.removeEventListener('click', off); }
      });
    }, 0);
  }
  function findRef() {
    var b = document.getElementById('nlReload');
    if (b) return b;
    var els = document.querySelectorAll('button, a');
    for (var i = 0; i < els.length; i++) { var t = (els[i].textContent || '').trim(); if (t === '처음으로' || t === '홈' || t === '로그아웃') return els[i]; }
    return null;
  }
  function putMenu() {
    if (!ME || isHome() || document.getElementById('nlMenuBtn') || !menuItems().length) return;
    var ref = findRef(); if (!ref || !ref.parentNode) return;
    var b = document.createElement('button');
    b.id = 'nlMenuBtn'; b.type = 'button'; b.className = ref.className; b.textContent = '☰ 메뉴'; b.title = '다른 화면으로 바로 이동';
    b.style.marginRight = '6px'; b.style.width = 'auto'; b.style.marginTop = '0';
    try { var hh = ref.getBoundingClientRect().height; if (hh) b.style.height = hh + 'px'; } catch (e) {}
    b.onclick = function (ev) { ev.preventDefault(); ev.stopPropagation(); openPanel(b); };
    ref.parentNode.insertBefore(b, ref);
  }
  function startLive(client) {
    if (typeof NLLive !== 'undefined') return;   // 화면이 스스로 켜는 곳
    loadScript('nl-live-alert.js', function () { if (typeof NLLive !== 'undefined') NLLive.start(client, ME.id, {}); });
  }
  function after(id) {
    var client = getSb(); if (!client || ME) return;
    client.from('nl_therapists').select('id, role').eq('id', id).maybeSingle().then(function (r) {
      if (!r || !r.data) return;
      ME = { id: Number(id), role: String(r.data.role || '').trim() };
      if (w.NL_MENU) putMenu(); else loadScript('nl-menu.js', putMenu);
      try { new MutationObserver(function () { if (!document.getElementById('nlMenuBtn')) putMenu(); })
              .observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
      startLive(client);
      // 푸시 알림 동의 · 등록 (2026-10-05) — 그 기기에서 아직 답하지 않았으면 동의 창
      var go = function () { try { if (w.NLPush) NLPush.start({ sb: client, kind: 'staff', who: ME.id }); } catch (e) {} };
      if (w.NLPush) go(); else loadScript('nl-push.js', go);
      // 앱 아이콘 숫자 = 안 읽은 알림 수 (2026-10-05) — 화면을 열 때 · 다시 볼 때 맞춤
      var badge = function () {
        if (!navigator.setAppBadge) return;
        client.from('nl_alerts').select('id', { count: 'exact', head: true }).eq('to_therapist_id', ME.id).is('read_at', null)
          .then(function (r) { if (r.error) return; var n = r.count || 0; (n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(function () {}); });
      };
      badge();
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') badge(); });
    }, function () {});
  }
  var orig = w.nlKeep;
  if (typeof orig === 'function') {
    w.nlKeep = function (id) {
      var r = orig.apply(this, arguments);
      try { setTimeout(function () { after(id); }, 0); } catch (e) {}
      return r;
    };
  }
})(window);

/* 금액 칸 쉼표 (2026-10-08 은정님) — data-won 이 붙은 칸만
 *   · 숫자만 쳐도 「53,000」처럼 쉼표가 저절로 붙음 (앞에 - 는 그대로 · 이월 등)
 *   · 화면 코드가 칸 값을 읽으면 쉼표 없는 「53000」이 나옴 → 화면마다 읽는 코드는 고칠 것 없음
 *   · 코드가 값을 넣어도(53000 또는 "53,000") 쉼표 모양으로 보임
 *   · type="number" 칸은 쉼표를 못 담아 글 칸(숫자 자판)으로 바꿈
 *   ※ 회기 수 · 분 · 승인번호 · 계좌 · 전화번호에는 붙이지 말 것
 */
(function () {
  var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  function raw(v) {
    var s = String(v == null ? '' : v).replace(/[^0-9-]/g, '');
    var neg = s.charAt(0) === '-';
    s = s.replace(/-/g, '').replace(/^0+(?=\d)/, '');
    return (neg ? '-' : '') + s;
  }
  function show(r) {
    if (r === '' || r === '-') return r;
    var neg = r.charAt(0) === '-', d = neg ? r.slice(1) : r;
    return (neg ? '-' : '') + d.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function wrap(el) {
    if (el.dataset.nlw) return; el.dataset.nlw = '1';
    if (el.type === 'number') { var v0 = desc.get.call(el); el.type = 'text'; desc.set.call(el, v0); }
    el.inputMode = 'numeric'; el.autocomplete = 'off';
    Object.defineProperty(el, 'value', { configurable: true,
      get: function () { return raw(desc.get.call(el)); },
      set: function (v) { desc.set.call(el, show(raw(v))); } });
    desc.set.call(el, show(raw(desc.get.call(el))));
    el.addEventListener('input', function () {
      var cur = desc.get.call(el), pos = el.selectionStart == null ? cur.length : el.selectionStart;
      var before = cur.slice(0, pos).replace(/[^0-9-]/g, '').length;
      var nv = show(raw(cur));
      if (nv === cur) return;
      desc.set.call(el, nv);
      var i = 0, n = 0;
      while (i < nv.length && n < before) { if (/[0-9-]/.test(nv.charAt(i))) n++; i++; }
      try { el.setSelectionRange(i, i); } catch (e) {}
    });
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('input[data-won]') : []).forEach(wrap); }
  var start = function () {
    scan(document);
    new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches('input[data-won]')) wrap(n); else scan(n);
    }); }); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
