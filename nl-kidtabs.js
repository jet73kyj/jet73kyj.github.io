/* 기록지 아동 책갈피 (2026-11-05 은정님)
 *   선생님 계정 — 기록지 오른쪽 옆면에 맡은 아동 이름을 서식 책갈피처럼 세로로 늘어놓음
 *   색은 셋뿐 — 고칠 것이 있으면 빨강 · 없으면 흰색 · 지금 보는 아동은 옅은 회색
 *   화면이 좁으면(휴대폰) 기록지 위에 가로로
 *   단추 모양 · 누르면 하는 일은 화면마다 정함 (이 파일은 그리기만)
 *     NLKidTabs.show(html)  — html 은 <button class="nltab [red] [on]" …>이름<small>…</small></button> 들
 *     NLKidTabs.hide()
 */
(function (w) {
  function css() {
    if (document.getElementById('nlKidTabsCss')) return;
    var st = document.createElement('style'); st.id = 'nlKidTabsCss';
    st.textContent =
        '#nlKidTabs{position:fixed;right:0;top:120px;bottom:16px;width:52px;overflow-y:auto;overflow-x:hidden;'
      + 'display:flex;flex-direction:column;gap:4px;padding:4px 0 4px 0;z-index:35;scrollbar-width:thin;}'
      + '#nlKidTabs button.nltab{writing-mode:vertical-rl;text-orientation:upright;width:42px !important;min-height:64px;'
      + 'margin:0 !important;padding:10px 4px !important;border:1px solid #E4E0DA !important;border-right:none !important;'
      + 'border-radius:10px 0 0 10px !important;background:#fff !important;color:#4A433F !important;'
      + 'font-size:13px !important;font-weight:600 !important;letter-spacing:1px;line-height:1.1;cursor:pointer;'
      + 'box-shadow:none !important;flex:0 0 auto;align-self:flex-end;}'
      + '#nlKidTabs button.nltab small{font-size:10px;font-weight:500;color:inherit;opacity:.8;margin-top:4px;letter-spacing:0;}'
      + '#nlKidTabs button.nltab.red{background:#D93A2B !important;border-color:#D93A2B !important;color:#fff !important;}'
      + '#nlKidTabs button.nltab.on{background:#E6E3DF !important;border-color:#CFC9C2 !important;color:#2F2926 !important;width:48px !important;}'
      + '#nlKidTabs button.nltab.red.on{box-shadow:inset 3px 0 0 #D93A2B !important;}'
      + '#nlKidTabs .nltabhd{font-size:11px;font-weight:700;color:#A39C95;align-self:flex-end;width:42px;text-align:center;'
      + 'padding:2px 0 4px;white-space:nowrap;}'
      + 'body.nl-has-tabs{padding-right:56px !important;}'
      + '@media (max-width:900px){'
      + '#nlKidTabs{position:sticky;top:0;right:auto;bottom:auto;width:auto;flex-direction:row;overflow-x:auto;overflow-y:hidden;'
      + 'background:#F5F4F2;padding:6px 8px;border-bottom:1px solid #ECE8E3;}'
      + '#nlKidTabs button.nltab{writing-mode:horizontal-tb;width:auto !important;min-height:0;padding:6px 10px !important;'
      + 'border-right:1px solid #E4E0DA !important;border-radius:8px !important;white-space:nowrap;align-self:auto;}'
      + '#nlKidTabs button.nltab.on{width:auto !important;}'
      + '#nlKidTabs button.nltab small{margin:0 0 0 4px;}'
      + '#nlKidTabs .nltabhd{writing-mode:horizontal-tb;padding:0 4px;align-self:center;white-space:nowrap;}'
      + 'body.nl-has-tabs{padding-right:0 !important;}}'
      + '@media print{#nlKidTabs{display:none !important;} body.nl-has-tabs{padding-right:0 !important;}}';
    document.head.appendChild(st);
  }
  function box() {
    var b = document.getElementById('nlKidTabs');
    if (b) return b;
    b = document.createElement('div'); b.id = 'nlKidTabs'; b.className = 'no-print';
    var bar = document.getElementById('nlTopBar');
    // 좁은 화면에서는 위쪽 단추 띠 바로 아래에 가로로
    if (bar && bar.parentNode) bar.parentNode.insertBefore(b, bar.nextSibling);
    else document.body.insertBefore(b, document.body.firstChild);
    return b;
  }
  w.NLKidTabs = {
    show: function (html) {
      css();
      var b = box();
      var y = b.scrollTop, x = b.scrollLeft;
      b.innerHTML = html;
      b.scrollTop = y; b.scrollLeft = x;
      b.style.display = '';
      document.body.classList.add('nl-has-tabs');
      var on = b.querySelector('button.nltab.on');
      if (on && on.scrollIntoView) { try { on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} }
    },
    hide: function () {
      var b = document.getElementById('nlKidTabs');
      if (b) b.style.display = 'none';
      document.body.classList.remove('nl-has-tabs');
    }
  };
})(window);
