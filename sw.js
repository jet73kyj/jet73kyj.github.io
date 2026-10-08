/* 나무링크 · 자라는나무 푸시 알림 받는 곳 (2026-10-05)
 *   서버 함수 push-send 가 보낸 알림을 휴대폰 · 컴퓨터 알림으로 띄우고, 누르면 그 화면을 연다
 *   이 파일은 사이트 맨 위 폴더(namu-link/)에 있어야 모든 화면을 맡는다
 */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  var jobs = [self.registration.showNotification(d.title || '자라는나무', {
    body: d.body || '',
    icon: d.icon || 'img/nl-icon-192.png',
    badge: 'img/nl-icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || './' }
  })];
  // 아이콘 숫자 (되는 기기만)
  if (typeof d.badge === 'number' && self.navigator && self.navigator.setAppBadge) {
    jobs.push(d.badge > 0 ? self.navigator.setAppBadge(d.badge).catch(function () {}) : self.navigator.clearAppBadge().catch(function () {}));
  }
  e.waitUntil(Promise.all(jobs));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  // 이미 열린 나무링크 탭이 있으면 그 탭을 그 화면으로 바꿔 앞으로 (2026-10-05) · 없으면 새 창
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var mine = list.filter(function (c) { return c.url.indexOf(self.registration.scope) === 0; });
    for (var i = 0; i < mine.length; i++) { if (mine[i].url === url) return mine[i].focus(); }
    if (mine.length && 'navigate' in mine[0]) {
      return mine[0].navigate(url).then(function (c) { return (c || mine[0]).focus(); })
        .catch(function () { return self.clients.openWindow(url); });
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
