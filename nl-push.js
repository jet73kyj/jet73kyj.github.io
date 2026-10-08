/* 푸시 알림 동의 · 등록 (2026-10-05) — 직원(nl-login.js 가 부름) · 학부모(parent.html 이 부름)
 *   NLPush.start({ sb, kind: 'staff' | 'parent', who })  — 그 기기에서 아직 답하지 않았으면 동의 창
 *   NLPush.settings({ sb, kind, who })                    — 알림 설정 창 (켜기 · 끄기)
 *   동의 · 거절 · 철회는 안내문 전문 · 판 번호 · 기기와 함께 서버(nl_push_consent)에 남김 · 고치거나 지울 수 없음
 */
(function (w) {
  var PUB = 'BAK9_QCW939h_reN3R__sNq9pQOi-tV3ggvquec8d4flQewR6jBOki29P2DQyTi2reLHzjqUI94zPcUIi3-zyDk';
  var TEXT = {
    parent: { ver: '학부모-1', title: '자라는나무 알림 받기',
      body: '자라는나무는 아래 내용을 이 휴대폰 알림으로 보내 드립니다.\n'
          + '· 교육비(본인부담금) 안내와 납부 확인\n'
          + '· 결석 · 보강 요청의 확정 · 반려 결과\n'
          + '· 휴무 · 일정 변경 등 중요한 공지\n\n'
          + '광고나 홍보는 보내지 않습니다.\n'
          + '알림은 언제든 앱의 「알림 설정」에서 끌 수 있습니다.\n'
          + '동의 · 거절 · 끄기는 날짜와 기기 정보와 함께 기록되어 보관됩니다.' },
    staff: { ver: '직원-1', title: '나무링크 업무 알림 받기',
      body: '학부모 결석 · 보강 요청, 발추 일정 요청, 급여명세서 · 정산 안내 등 업무 알림을 이 기기로 보내 드립니다.\n'
          + '알림은 언제든 「알림 설정」에서 끌 수 있으며, 동의 · 거절 · 끄기는 날짜와 기기 정보와 함께 기록됩니다.' }
  };
  var AGREE_LINE = '위 내용을 읽었으며 알림 받기에 동의합니다';
  function ok() { return ('serviceWorker' in navigator) && ('PushManager' in w) && ('Notification' in w); }
  function key(o) { return 'nl_push_ans_' + o.kind + '_' + o.who; }
  function b64(s) { var p = '='.repeat((4 - s.length % 4) % 4); var r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
    var a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function ab(buf) { var s = '', b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function ua() { return String(navigator.userAgent || '').slice(0, 300); }
  function fullText(o) { var t = TEXT[o.kind]; return t.title + '\n\n' + t.body + '\n\n☑ ' + AGREE_LINE; }
  async function reg() { return navigator.serviceWorker.register('sw.js'); }
  async function subscribe(o) {
    var r = await reg();
    await navigator.serviceWorker.ready;
    var s = await r.pushManager.getSubscription();
    if (!s) s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(PUB) });
    var j = s.toJSON();
    var res = await o.sb.rpc('nl_push_register', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_ua: ua() });
    if (res.error) throw res.error;
  }
  async function record(o, action) {
    var t = TEXT[o.kind];
    var res = await o.sb.rpc('nl_push_consent_add', { p_action: action, p_ver: t.ver,
      p_body: action === '동의' ? fullText(o) : t.title + '\n\n' + t.body, p_perm: (w.Notification && Notification.permission) || '', p_ua: ua() });
    if (res.error) throw res.error;
  }
  function modal(html) {
    var bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(47,41,38,.45);display:flex;align-items:center;justify-content:center;padding:16px;';
    bg.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:440px;width:100%;overflow:hidden;font-family:-apple-system,\'Malgun Gothic\',sans-serif;color:#2F2926;box-shadow:0 12px 32px rgba(0,0,0,.2);">' + html + '</div>';
    document.body.appendChild(bg);
    return bg;
  }
  function askBox(o, done) {
    var t = TEXT[o.kind];
    var bg = modal('<div style="background:#F8F1E8;border-bottom:2px solid #C9A27E;padding:12px 16px;font-weight:600;font-size:15px;">' + t.title + '</div>'
      + '<div style="padding:14px 16px;font-size:14px;line-height:1.75;white-space:pre-wrap;">' + t.body.replace(/</g, '&lt;') + '</div>'
      + '<label style="display:flex;gap:8px;align-items:flex-start;padding:0 16px 12px;font-size:14px;cursor:pointer;"><input type="checkbox" id="nlpAg" style="width:18px;height:18px;margin:2px 0 0;flex:none;"><span>' + AGREE_LINE + '</span></label>'
      + '<div id="nlpMsg" style="padding:0 16px;font-size:12.5px;color:#C2553A;min-height:4px;"></div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #ECE8E3;">'
      + '<button type="button" id="nlpNo" style="width:auto;margin:0;padding:8px 14px;font-size:14px;background:#fff;color:#4A433F;border:1px solid #E4E0DA;border-radius:8px;">받지 않기</button>'
      + '<button type="button" id="nlpYes" disabled style="width:auto;margin:0;padding:8px 14px;font-size:14px;background:#B07A4A;color:#fff;border:1px solid #B07A4A;border-radius:8px;opacity:.45;">동의하고 알림 받기</button></div>');
    var yes = bg.querySelector('#nlpYes'), no = bg.querySelector('#nlpNo'), ag = bg.querySelector('#nlpAg'), msg = bg.querySelector('#nlpMsg');
    ag.onchange = function () { yes.disabled = !ag.checked; yes.style.opacity = ag.checked ? '1' : '.45'; };
    no.onclick = async function () {
      no.disabled = true;
      try { await record(o, '거절'); localStorage.setItem(key(o), 'no'); bg.remove(); done && done(false); }
      catch (e) { msg.textContent = '기록하지 못했습니다. 다시 눌러 주세요 · ' + (e.message || ''); no.disabled = false; }
    };
    yes.onclick = async function () {
      yes.disabled = true; yes.textContent = '설정 중…';
      try {
        var p = await Notification.requestPermission();
        await record(o, '동의');
        localStorage.setItem(key(o), 'yes');
        if (p === 'granted') { await subscribe(o); bg.remove(); done && done(true); }
        else { msg.textContent = '휴대폰(브라우저)에서 알림이 꺼져 있습니다. 설정 → 알림에서 자라는나무(나무링크)를 허용해 주세요.'; yes.textContent = '닫기'; yes.disabled = false; yes.onclick = function () { bg.remove(); }; }
      } catch (e) { msg.textContent = '설정하지 못했습니다 · ' + (e.message || ''); yes.disabled = false; yes.textContent = '동의하고 알림 받기'; }
    };
  }
  // 로그아웃하면 이 기기 등록을 멈춤 (2026-10-05) — 여러 사람이 번갈아 쓰는 기기에 앞사람 알림이 가지 않게
  //   동의 기록은 그대로 · 같은 사람이 다시 로그인하면 저절로 다시 등록
  function guardLogout(sb) {
    if (!sb || !sb.auth || sb.auth.__nlPushGuard) return;
    var orig = sb.auth.signOut.bind(sb.auth);
    sb.auth.signOut = async function (opt) {
      try {
        if (ok()) {
          var r = await navigator.serviceWorker.getRegistration();
          var s = r && await r.pushManager.getSubscription();
          if (s) await sb.rpc('nl_push_unregister', { p_endpoint: s.endpoint });
        }
        if (navigator.clearAppBadge) navigator.clearAppBadge().catch(function () {});
      } catch (e) {}
      return orig(opt);
    };
    sb.auth.__nlPushGuard = true;
  }
  w.NLPush = {
    supported: ok,
    guardLogout: guardLogout,
    start: async function (o) {
      if (o && o.sb) guardLogout(o.sb);
      if (!ok() || !o || !o.sb || !o.who) return;
      var a = null; try { a = localStorage.getItem(key(o)); } catch (e) {}
      if (a === 'yes') { if (Notification.permission === 'granted') { try { await subscribe(o); } catch (e) {} } return; }
      if (a === 'no') return;
      askBox(o);
    },
    settings: async function (o) {
      if (!ok()) { alert('이 기기(브라우저)는 알림을 받을 수 없습니다.\n아이폰은 사파리에서 「홈 화면에 추가」한 앱으로 열어 주세요.'); return; }
      var on = false; try { on = localStorage.getItem(key(o)) === 'yes' && Notification.permission === 'granted'; } catch (e) {}
      if (!on) { askBox(o); return; }
      if (!confirm('알림을 끌까요?\n(끄기도 날짜와 함께 기록됩니다)')) return;
      try {
        var r = await navigator.serviceWorker.getRegistration('sw.js') || await reg();
        var s = r && await r.pushManager.getSubscription();
        if (s) { await o.sb.rpc('nl_push_unregister', { p_endpoint: s.endpoint }); await s.unsubscribe(); }
        await record(o, '철회');
        localStorage.setItem(key(o), 'no');
        alert('알림을 껐습니다.');
      } catch (e) { alert('끄지 못했습니다 · ' + (e.message || '')); }
    }
  };
})(window);
