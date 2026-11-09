/* 기록지 세 화면 공용 (2026-11-09 은정님)
 *   ① 보기 전용 — 주소 끝 &view=1 · 「종결 아동 기록지」 · 「지난 기록지」에서 엶
 *      칸을 잠그고 저장 · 고치기 단추를 감춤 (인쇄만) · 아동 책갈피 감춤
 *   ② 책갈피 접기 — 끝난 지 두 달 안의 종결 아동은 「종결 ○명 ▸」 아래로 (처음엔 접힘)
 *      고칠 것이 남은 아동(빨강) · 지금 보는 아동은 접어도 위에
 *   ③ 지난 기록지 — 다시 다니는 아동의 옛 수업 기록지 (새 담당 선생님도 보기만)
 */
(function (w) {
  var VIEW = new URLSearchParams(location.search).get('view') === '1';
  function todayKst() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ── ① 보기 전용 ──
  function roCss() {
    if (document.getElementById('nlRoCss')) return;
    var st = document.createElement('style'); st.id = 'nlRoCss';
    st.textContent =
        '#nlKidTabs,#kbBox,#kbBack,.kidpickwrap,#pLoad,#nlPastBtn,#btnSave,.sheetsave,.btn-save{display:none !important;}'
      + 'body.nl-has-tabs{padding-right:0 !important;}'
      + 'button.nl-ro-hide{display:none !important;}'
      + '#nlRoBar{position:sticky;top:0;z-index:40;background:#FFF4E5;border-bottom:1px solid #F0D9B5;color:#7E5530;'
      + 'font-size:13px;font-weight:600;padding:8px 16px;}'
      + '@media print{#nlRoBar{display:none !important;}}';
    document.head.appendChild(st);
  }
  function okBtn(b) {
    if (b.closest('#nlTopBar, #nlMenuPanel, #nlMenu, .nl-menu, #nlRoBar')) return true;
    if (b.classList.contains('btn-print') || b.id === 'pIntake') return true;
    var t = (b.textContent || '') + ' ' + (b.getAttribute('onclick') || '');
    return /인쇄|print/i.test(t);
  }
  function lockAll() {
    var main = document.getElementById('mainBox') || document.body;
    main.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (el.closest('#nlTopBar')) return;
      if (!el.disabled) el.disabled = true;
    });
    main.querySelectorAll('button').forEach(function (b) {
      if (!okBtn(b)) b.classList.add('nl-ro-hide');
    });
  }
  function startRo() {
    roCss();
    var bar = document.createElement('div'); bar.id = 'nlRoBar';
    bar.textContent = '보기 전용 — 지난 기록지입니다. 고치거나 저장할 수 없습니다 (인쇄만 됩니다).';
    document.body.insertBefore(bar, document.body.firstChild);
    var busy = false;
    new MutationObserver(function () { if (busy) return; busy = true; requestAnimationFrame(function () { lockAll(); busy = false; }); })
      .observe(document.body, { childList: true, subtree: true });
    lockAll();
    // 칸이 아닌 곳(달력 칸 등)을 눌러 고치는 창이 뜨지 않게 — 기록지 안의 누름은 인쇄 · 링크만
    document.addEventListener('click', function (e) {
      var t = e.target; if (!t || !t.closest) return;
      if (t.closest('#nlTopBar, #nlMenuPanel, #nlRoBar, a, summary')) return;
      var b = t.closest('button'); if (b && okBtn(b)) return;
      if (!t.closest('#mainBox, .container')) return;
      e.stopPropagation(); e.preventDefault();
    }, true);
    w.addEventListener('beforeunload', function (e) { e.stopImmediatePropagation(); }, true);
  }
  if (VIEW) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRo); else startRo();
  }

  // ── ② 책갈피 접기 ──
  var FOLD_KEY = 'nl_tab_fold_open';
  function foldOpen() { try { return sessionStorage.getItem(FOLD_KEY) === '1'; } catch (e) { return false; } }
  // live: nl_live_rows 의 줄들 중 이 아동(이 칸)의 줄 — 하나라도 오늘까지 살아 있으면 종결 아님
  function rowAlive(r) { return !r.live_to || String(r.live_to).slice(0, 10) >= todayKst(); }
  // items: [{ html, fold }] — 차례대로 · fold = 접을 종결 아동 (빨강 · 지금 보는 아동은 fold 를 false 로 넘김)
  function tabsHtml(head, items) {
    var up = [], down = [];
    (items || []).forEach(function (o) { (o.fold ? down : up).push(o.html); });
    var h = head + up.join('');
    if (down.length) {
      var op = foldOpen();
      h += '<button type="button" class="nltab nlfold" title="끝난 지 두 달 안의 종결 아동">종결 ' + down.length + '명 ' + (op ? '▾' : '▸') + '</button>';
      if (op) h += down.join('');
    }
    if (!up.length && !down.length) h += '<div class="nltabhd">아동 없음</div>';
    return h;
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#nlKidTabs button.nlfold');
    if (!b) return;
    e.stopPropagation();
    try { sessionStorage.setItem(FOLD_KEY, foldOpen() ? '0' : '1'); } catch (x) {}
    if (typeof w.NLRecRedraw === 'function') w.NLRecRedraw();
  }, true);
  (function () {
    var st = document.createElement('style');
    st.textContent = '#nlKidTabs button.nltab.nlfold{background:#F5F4F2 !important;color:#8A817A !important;border-style:dashed !important;font-weight:500 !important;}';
    (document.head || document.documentElement).appendChild(st);
  })();

  // ── ③ 지난 기록지 ──
  //   o = { sb, cid, sups:[사업번호], page:'record-develop.html', name: 번호→선생님 이름, extra(log) → 주소에 더할 글 }
  //   옛 수업 = 오늘 전에 끝난 수업 · 그 수업 기간의 기록지 중 지금 수업이 시작하기 전 달만
  var PAST_REQ = 0;
  async function pastLogs(o) {
    var req = ++PAST_REQ;
    var btn = document.getElementById('nlPastBtn');
    if (VIEW) return;
    if (!btn) {
      var anchor = document.getElementById('pIntake'); if (!anchor) return;
      btn = document.createElement('button'); btn.type = 'button'; btn.id = 'nlPastBtn';
      btn.setAttribute('style', 'background:#F5F4F2;color:#5A514B;border:1px solid #D8D2CB;border-radius:7px;font-weight:600;margin-left:6px;width:auto !important;margin-top:0 !important;');
      anchor.parentNode.insertBefore(btn, anchor.nextSibling);
      btn.addEventListener('click', function () { showPast(btn._list || []); });
    }
    btn.style.display = 'none'; btn._list = [];
    if (!o || !o.cid) return;
    try {
      var td = todayKst();
      var r1 = await o.sb.from('nl_therapies').select('id, support_type_id, started_on, ended_on')
        .eq('child_id', o.cid).in('support_type_id', o.sups);
      if (r1.error) return;
      var th = r1.data || [];
      // 이어지는 수업(끝난 날 다음 7일 안에 같은 갈래 새 수업)은 뺀다 — 원래 화면에서 보고 고칠 수 있음
      var day7 = function (d) { var x = new Date(String(d).slice(0, 10) + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 7); return x.toISOString().slice(0, 10); };
      var goesOn = function (t) { return th.some(function (u) { return u.id !== t.id && u.started_on
        && String(u.started_on).slice(0, 10) >= String(t.started_on || '0000-00-00').slice(0, 10)
        && String(u.started_on).slice(0, 10) <= day7(t.ended_on); }); };
      var ended = th.filter(function (t) { return t.ended_on && String(t.ended_on).slice(0, 10) < td && !goesOn(t); });
      if (!ended.length) return;
      var cur = th.filter(function (t) { return !t.ended_on || String(t.ended_on).slice(0, 10) >= td; });
      var curStart = cur.length ? cur.map(function (t) { return String(t.started_on || '0000-00').slice(0, 7); }).sort()[0] : '9999-99';
      var r2 = await o.sb.from('nl_session_logs').select('id, month_key, support_type_id, therapist_id, therapy_id')
        .eq('child_id', o.cid).in('support_type_id', o.sups).order('month_key', { ascending: false }).range(0, 999);
      if (r2.error || req !== PAST_REQ) return;
      var list = (r2.data || []).filter(function (l) {
        if (String(l.month_key) >= curStart) return false;
        return ended.some(function (t) {
          if (l.therapy_id != null && String(l.therapy_id) !== String(t.id)) return false;
          if (Number(l.support_type_id) !== Number(t.support_type_id)) return false;
          var a = String(t.started_on || '0000-00').slice(0, 7), z = String(t.ended_on).slice(0, 7);
          return String(l.month_key) >= a && String(l.month_key) <= z;
        });
      });
      if (!list.length) return;
      list.forEach(function (l) { l._href = o.page + '?c=' + o.cid + '&m=' + l.month_key + (o.extra ? o.extra(l) : '') + '&view=1'; l._th = (o.name && o.name(l.therapist_id)) || ''; l._sup = (o.sup && o.sup(l.support_type_id)) || ''; });
      btn._list = list;
      btn.textContent = '지난 기록지 ' + list.length;
      btn.style.display = '';
    } catch (e) {}
  }
  function showPast(list) {
    var old = document.getElementById('nlPastBox'); if (old) old.remove();
    var bg = document.createElement('div'); bg.id = 'nlPastBox';
    bg.setAttribute('style', 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;');
    var rows = list.map(function (l) {
      return '<a href="' + esc(l._href) + '" target="_blank" rel="noopener" style="display:flex;gap:10px;align-items:center;padding:9px 10px;border-bottom:1px solid #F0EEEA;color:#2F2926;text-decoration:none;">'
        + '<b style="min-width:72px;">' + esc(l.month_key.slice(0, 4) + '년 ' + Number(l.month_key.slice(5, 7)) + '월') + '</b>'
        + '<span style="color:#7E5530;">' + esc(l._sup) + '</span>'
        + '<span style="color:#8A817A;">' + esc(l._th ? l._th + ' 선생님' : '') + '</span>'
        + '<span style="margin-left:auto;color:#B07A4A;">보기 ↗</span></a>';
    }).join('');
    bg.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:460px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 10px 30px rgba(0,0,0,.2);">'
      + '<div style="padding:12px 14px;background:#F8F1E8;border-bottom:1px solid #C9A27E;font-weight:700;color:#7E5530;">지난 기록지 · 보기만</div>'
      + '<div style="padding:8px 14px;font-size:12px;color:#8A817A;">이 아동이 전에 다니던 수업의 기록지입니다. 새 탭으로 열리고 고칠 수 없습니다.</div>'
      + rows
      + '<div style="padding:10px 14px;text-align:right;"><button type="button" id="nlPastClose" style="width:auto !important;margin:0 !important;">닫기</button></div></div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function (e) { if (e.target === bg || (e.target.id === 'nlPastClose')) bg.remove(); });
  }

  w.NLRec = { VIEW: VIEW, rowAlive: rowAlive, tabsHtml: tabsHtml, pastLogs: pastLogs, today: todayKst };
})(window);
