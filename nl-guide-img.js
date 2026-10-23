/* 업무 안내서 그림 (2026-10-23 은정님) — work-guides.html · tasks.html 가 함께 씀
 *   저장소 nl-guides (비공개 · 그림만 · 5MB) · 보기 8 · 19 · 10 · 11번 / 올리기 · 지우기 원장님만
 *   안내서 글(body)에는 「[그림:파일이름]」으로 담고, 쓰는 칸에서는 「[그림 1]」로 보여 줌
 *   그리기 — NLGImg.html(글) 로 글을 그린 뒤 NLGImg.fill(sb, 상자) 가 5분짜리 주소를 채움
 */
(function (w) {
  var BUCKET = 'nl-guides';
  var RE = /\[그림:([A-Za-z0-9._-]+)\]/g;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function paths(body) { var out = [], m; RE.lastIndex = 0; while ((m = RE.exec(String(body || '')))) out.push(m[1]); return out; }
  // 읽는 화면 — 글은 그대로, 그림 자리는 빈 그림 상자
  function html(body) {
    var s = String(body || ''), out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      out += esc(s.slice(last, m.index));
      out += '<img class="gimg" data-gp="' + esc(m[1]) + '" alt="그림" style="display:block;max-width:100%;max-height:520px;margin:6px 0;border:1px solid #ECE8E3;border-radius:8px;cursor:zoom-in;background:#FAF8F5;min-height:40px">';
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  async function fill(sb, root) {
    var imgs = Array.prototype.slice.call((root || document).querySelectorAll('img.gimg[data-gp]:not([src])'));
    if (!imgs.length) return;
    var ps = imgs.map(function (i) { return i.getAttribute('data-gp'); });
    var uniq = ps.filter(function (p, i) { return ps.indexOf(p) === i; });
    var r = await sb.storage.from(BUCKET).createSignedUrls(uniq, 300);
    var map = {};
    (r.data || []).forEach(function (x) { if (x && x.signedUrl) map[x.path] = x.signedUrl; });
    imgs.forEach(function (i) {
      var u = map[i.getAttribute('data-gp')];
      if (u) { i.src = u; i.onclick = function () { big(u); }; }
      else { i.alt = '그림을 열지 못했습니다'; i.style.minHeight = '0'; }
    });
  }
  function big(u) {
    var bg = document.createElement('div');
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
    bg.innerHTML = '<img src="' + esc(u) + '" style="max-width:96vw;max-height:94vh;border-radius:6px;background:#fff">';
    bg.onclick = function () { bg.remove(); };
    document.body.appendChild(bg);
  }
  // 올리기 — 긴 쪽 1,600픽셀 · JPEG
  function shrink(file) {
    return new Promise(function (ok, no) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : no(new Error('그림을 줄이지 못했습니다')); }, 'image/jpeg', 0.9);
      };
      img.onerror = function () { URL.revokeObjectURL(url); no(new Error('그림 파일을 읽지 못했습니다')); };
      img.src = url;
    });
  }
  async function upload(sb, file) {
    if (!file || !/^image\//.test(file.type || '')) throw new Error('그림 파일만 넣을 수 있습니다');
    var blob = await shrink(file);
    var name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    var r = await sb.storage.from(BUCKET).upload(name, blob, { contentType: 'image/jpeg', upsert: false });
    if (r.error) throw r.error;
    return name;
  }
  async function remove(sb, list) {
    list = (list || []).filter(Boolean);
    if (!list.length) return { error: null };
    return sb.storage.from(BUCKET).remove(list);
  }
  // 쓰는 칸 — 저장 글 「[그림:이름]」 ↔ 칸 글 「[그림 1]」
  function toEdit(body, map) {
    return String(body || '').replace(RE, function (_, p) {
      var n = map.indexOf(p); if (n < 0) { map.push(p); n = map.length - 1; }
      return '[그림 ' + (n + 1) + ']';
    });
  }
  function toStore(text, map) {
    return String(text || '').replace(/\[그림 (\d+)\]/g, function (all, n) {
      var p = map[Number(n) - 1]; return p ? '[그림:' + p + ']' : all;
    });
  }
  w.NLGImg = { paths: paths, html: html, fill: fill, upload: upload, remove: remove, toEdit: toEdit, toStore: toStore, big: big };
})(window);
