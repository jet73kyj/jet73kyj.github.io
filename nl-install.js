/* 홈 화면에 앱으로 두기 안내 (2026-10-18 · 나무링크 · 자라는나무 링크 jl-install.js 와 같은 글)
 *   안드로이드 크롬 — 「홈 화면에 추가」 단추를 누르면 핸드폰이 바로 설치 창을 띄움 (beforeinstallprompt)
 *   아이폰 — 애플이 바로 추가를 막아 두어, 단추를 누르면 「공유 → 홈 화면에 추가」 그림 안내 창
 *   안 보이는 때 — 이미 홈 화면 앱으로 열었을 때 · 컴퓨터 · 카카오톡 등 앱 안 화면 ·
 *                  ✕ 를 누른 뒤 30일 · 안드로이드에서 크롬이 설치 창을 내주지 않을 때(이미 설치됨 등)
 */
(function () {
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  if (!ios && !android) return;
  if (/KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|; wv\)/i.test(ua)) return;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) return;
  var KEY = 'app_install_off:' + location.pathname;
  try { var t = Number(localStorage.getItem(KEY) || 0); if (t && Date.now() - t < 30 * 864e5) return; } catch (e) {}

  var deferred = null;
  var FONT = 'Pretendard,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';

  function bar() {
    if (document.getElementById('appInstallBar') || document.getElementById('jlInapp')) return;
    var b = document.createElement('div');
    b.id = 'appInstallBar';
    b.style.cssText = 'position:sticky;top:0;z-index:99997;background:#F8F1E8;color:#5c3d22;border-bottom:1px solid #E6D3BE;'
      + 'padding:9px 12px;font:14px/1.5 ' + FONT + ';display:flex;gap:8px;align-items:center;';
    var tx = document.createElement('span');
    tx.style.cssText = 'flex:1 1 auto;min-width:0;';
    tx.textContent = '📱 홈 화면에 앱으로 두면 알림을 받을 수 있어요';
    var go = document.createElement('button');
    go.type = 'button'; go.textContent = '홈 화면에 추가';
    go.style.cssText = 'flex:none;width:auto;margin:0;height:34px;padding:0 12px;border-radius:9px;border:1px solid #B07A4A;background:#B07A4A;color:#fff;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;';
    var x = document.createElement('button');
    x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', '안내 닫기');
    x.style.cssText = 'flex:none;width:auto;margin:0;height:34px;padding:0 8px;border:none;background:none;color:#8a6a4e;font:inherit;font-size:16px;cursor:pointer;';
    x.onclick = function () { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} b.remove(); };
    go.onclick = async function () {
      if (deferred) {
        try {
          deferred.prompt();
          var r = await deferred.userChoice;
          deferred = null;
          if (r && r.outcome === 'accepted') b.remove();
        } catch (e) {}
      } else if (ios) {
        guide();
      }
    };
    b.append(tx, go, x);
    document.body.insertBefore(b, document.body.firstChild);
  }

  function guide() {
    var bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(47,41,38,.5);display:flex;align-items:flex-end;justify-content:center;padding:16px;';
    var step = function (n, t, s) {
      return '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid #ECE8E3;">'
        + '<b style="flex:none;width:26px;height:26px;border-radius:50%;background:#B07A4A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;">' + n + '</b>'
        + '<div><div style="font-size:15px;font-weight:600;">' + t + '</div><div style="font-size:13px;color:#6E6660;">' + s + '</div></div></div>';
    };
    var share = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/></svg>';
    bg.innerHTML = '<div role="dialog" aria-modal="true" style="background:#fff;border-radius:16px;max-width:420px;width:100%;padding:16px 18px 14px;font-family:' + FONT.replace(/"/g, '&quot;') + ';color:#2F2926;">'
      + '<div style="font-size:16px;font-weight:700;margin-bottom:8px;">아이폰 홈 화면에 추가하기</div>'
      + step(1, '사파리 아래쪽 ' + share + ' 공유 단추', '네모에서 화살표가 위로 나온 모양 (아이패드는 위쪽)')
      + step(2, '「홈 화면에 추가」', '목록을 위로 밀면 보입니다')
      + step(3, '오른쪽 위 「추가」', '홈 화면에 생긴 아이콘으로 열어 주세요')
      + '<div style="font-size:12.5px;color:#A39C95;margin-top:6px;">사파리가 아닌 앱(크롬 등)에서 열었다면, 주소를 복사해 사파리로 열어 주세요.</div>'
      + '<button type="button" id="appGuideX" style="width:100%;margin:12px 0 0;height:44px;border-radius:10px;border:1px solid #ECE8E3;background:#fff;color:#2F2926;font:inherit;font-size:15px;cursor:pointer;">닫기</button></div>';
    document.body.appendChild(bg);
    var close = function () { bg.remove(); };
    bg.querySelector('#appGuideX').onclick = close;
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
  }

  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); }
  if (android) {
    // 크롬이 설치 창을 내주려면 알림 받는 곳(sw.js)이 걸려 있어야 함 — 없으면 걸어 둠 (푸시와 같은 파일)
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {}
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; ready(bar); });
  } else {
    ready(function () { setTimeout(bar, 300); });
  }
  window.addEventListener('appinstalled', function () { var b = document.getElementById('appInstallBar'); if (b) b.remove(); });
})();
