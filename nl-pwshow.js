// ── 비밀번호 보기 · 감추기 (2026-11-08 은정님) ──
//   대문자 · 한글로 쳐서 로그인이 안 되는 일이 잦아, 친 글자를 눈으로 보며 칠 수 있게
//   모든 비밀번호 칸 오른쪽에 눈 그림 단추 — 누르면 보임(눈 뜸) ↔ 감춤(눈 감음)
//   · 화면을 열 때는 늘 감춤 · 로그인 단추를 누르면 다시 감춤 (옆 사람이 보지 않게)
//   · 화면 코드는 고칠 것 없음 — 비밀번호 칸을 찾아 저절로 붙임 (나중에 생긴 칸도)
(function () {
  if (window.__nlPwShow) return; window.__nlPwShow = true;

  var EYE_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_SHUT = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10c2.2 3 5.4 5 9 5s6.8-2 9-5"/><path d="M5.5 13.2 4 15.5M9.3 14.7 8.7 17.3M14.7 14.7l.6 2.6M18.5 13.2l1.5 2.3"/></svg>';

  function setShown(inp, btn, on) {
    inp.type = on ? 'text' : 'password';
    btn.innerHTML = on ? EYE_OPEN : EYE_SHUT;
    btn.title = on ? '비밀번호 감추기' : '비밀번호 보기';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function attach(inp) {
    if (inp.dataset.pwshow) return;
    inp.dataset.pwshow = '1';
    var cs = getComputedStyle(inp);
    var par = inp.parentNode;
    var full = cs.display === 'block' || (par && par.clientWidth && inp.offsetWidth >= par.clientWidth - parseFloat(getComputedStyle(par).paddingLeft || 0) - parseFloat(getComputedStyle(par).paddingRight || 0) - 2);
    var wrap = document.createElement('span');
    wrap.className = 'nl-pwwrap';
    wrap.style.cssText = 'position:relative !important;margin:0 !important;padding:0 !important;' +
      (full ? 'display:block !important;width:100% !important;' : 'display:inline-block !important;');
    par.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    var pr = parseFloat(cs.paddingRight) || 0;
    if (pr < 40) inp.style.setProperty('padding-right', '40px', 'important');
    inp.style.setProperty('box-sizing', 'border-box', 'important');
    if (full) inp.style.setProperty('width', '100%', 'important');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.className = 'nl-pweye';
    btn.style.cssText = 'position:absolute !important;right:4px !important;top:50% !important;transform:translateY(-50%) !important;' +
      'width:34px !important;height:34px !important;min-width:0 !important;margin:0 !important;padding:0 !important;' +
      'border:0 !important;background:transparent !important;box-shadow:none !important;color:#8a8079 !important;' +
      'cursor:pointer !important;display:flex !important;align-items:center !important;justify-content:center !important;line-height:0 !important;';
    wrap.appendChild(btn);
    setShown(inp, btn, false);
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });   // 칸에서 커서가 빠지지 않게
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var on = inp.type === 'password';
      setShown(inp, btn, on);
      try { var n = inp.value.length; inp.focus(); inp.setSelectionRange(n, n); } catch (_) {}
    });
    // 로그인 · 정하기를 누르면 다시 감춤
    var form = inp.form;
    if (form) form.addEventListener('submit', function () { setShown(inp, btn, false); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') setTimeout(function () { setShown(inp, btn, false); }, 0);
    });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('button') : null;
      if (t && t !== btn && !t.classList.contains('nl-pweye') && inp.type === 'text') setShown(inp, btn, false);
    }, true);
  }

  function scan(root) {
    (root || document).querySelectorAll('input[type="password"]').forEach(attach);
  }
  function start() {
    scan();
    try {
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches('input[type="password"]')) attach(n);
            else if (n.querySelectorAll) scan(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
