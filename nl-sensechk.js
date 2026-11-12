/* nl-sensechk.js — 초기 상담 「상담 내용」 연령별 체크리스트 (2026-11-12 은정님)
 *
 *   NLChk.attach(textarea, { birth: () => 'YYYY-MM-DD' })
 *   NLChk.refresh(textarea)   — 생년월일이나 글을 코드로 바꾼 뒤 부름
 *
 *   상담자가 보호자께 문항을 읽어 드리고 0 · 1 · 2 를 누름 → 추천 · 이유 · 보호자 안내가 바로 나옴
 *   누를 때마다 「기타 :」 줄 끝 [체크리스트] 뒤만 바뀜 · 앞의 직원 글은 그대로
 *     기타 : 직원 메모 / [체크리스트] 만 2~4세 → 감각통합 (미술2 감통9 심리3) · 점수 210201-00120100 · R없음
 *   다시 열면 「점수」 · 「R」 을 읽어 되살림 · 저장은 화면의 원래 저장 그대로
 *
 *   추천 차례 (4줄)
 *     1 R1~R5 하나라도 → 정밀평가 먼저
 *     2 촉각 문항 「자주(2)」 2개 이상 → 촉각 점수를 감통으로 옮겨 셈 (아니면 미술)
 *     3 세 수업 모두 3점 이하 → 추천 없음
 *     4 1위가 2위보다 3점 이상 → 1위 / 2점 차이 안 → 두 수업 + 초기평가
 *   이름표  t 촉각(미술 · 심하면 감통) · e 표현(미술) · b 균형(감통) · m 정서(심리)
 */
(function (w) {
  'use strict';
  var BANDS = [
    { from: 24, to: 59, name: '만 2~4세', tag: 'tbmtbmebmtbmebm', q: [
      '손에 물감·풀·모래가 묻으면 싫어하고 바로 닦아달라고 해요',
      '또래보다 자주 넘어지거나 부딪혀요',
      '낯선 곳에서 엄마와 떨어지지 못하고 오래 울어요',
      '처음 보는 재료(점토, 밀가루)를 만지기 전에 오래 망설여요',
      '계단을 오르내릴 때 꼭 손을 잡아야 해요',
      '떼쓰기가 잦고 한번 시작하면 진정까지 오래 걸려요',
      '크레파스로 끄적이거나 색칠하는 걸 거의 하지 않아요',
      '그네·미끄럼틀을 무서워하거나, 반대로 빙글빙글 돌기만 좋아해요',
      '동생 출생이나 이사 같은 변화 뒤로 행동이 달라졌어요',
      '맨발로 잔디·모래를 밟는 걸 싫어해요',
      '안아 올리거나 발이 땅에서 떨어지는 걸 싫어해요',
      '때리기·물기 같은 행동이 자주 나와요',
      '원하는 걸 말이나 몸짓보다 울음으로 먼저 표현해요',
      '앉아 있을 때 자세가 금방 무너지고 기대거나 누워요',
      '잠들기 어렵거나 자다가 자주 깨요'] },
    { from: 60, to: 95, name: '만 5~7세', tag: 'tbmtbmebmebmtbm', q: [
      '물감·점토처럼 손에 묻는 미술 활동을 피해요',
      '한 발 서기, 선 따라 걷기가 또래보다 어려워요',
      '“~하면 어떡해” 같은 걱정 질문을 반복해요',
      '친구가 살짝 스치기만 해도 예민하게 반응해요',
      '보조바퀴 자전거·킥보드를 배우기 힘들어해요',
      '유치원 가기를 자주 거부해요',
      '그리기·만들기를 금방 그만두거나 흥미가 적어요',
      '계속 뛰거나 부딪히는 놀이만 찾아요',
      '게임에서 지면 크게 화내고 규칙을 받아들이기 어려워해요',
      '속상한 마음을 말로 못 하고 떼나 울음으로 드러내요',
      '옷 입기·단추 채우기처럼 순서가 있는 동작이 서툴러요',
      '친구와 자주 다투거나 어울리지 못해요',
      '끈적이거나 젖은 촉감 때문에 놀이에 참여하지 않아요',
      '놀이터 기구를 무서워하거나 피해요',
      '특별한 이유 없이 배나 머리가 아프다고 해요'] },
    { from: 96, to: 155, name: '만 8~12세', tag: 'tbmebmebmebmtbm', q: [
      '특정 촉감 때문에 활동을 거부해요',
      '줄넘기·공놀이 같은 체육 활동을 힘들어하고 피해요',
      '학교·학원 가기 싫다는 말을 자주 해요',
      '실수할까 봐 그림·만들기를 시작하지 못하고 망설여요',
      '오래 앉아 있으면 몸을 흔들거나 책상에 엎드려요',
      '"나는 못해", "바보야" 같은 말을 스스로에게 해요',
      '자기 감정을 말로 설명하기 어려워해요',
      '새로운 운동 동작을 익히는 데 오래 걸려요',
      '사소한 일에도 짜증이나 화가 폭발해요',
      '손을 쓰는 활동보다 화면 보는 활동만 고집해요',
      '글씨를 쓸 때 힘 조절이 어려워요(너무 세게 또는 약하게)',
      '친구 관계 때문에 힘들어 보이는데 말을 잘 안 해요',
      '악수나 어깨 두드림 같은 신체 접촉을 불편해해요',
      '멀미가 심하거나, 반대로 아무리 돌아도 어지러워하지 않아요',
      '잠이나 식사 패턴이 눈에 띄게 달라졌어요'] }
  ];
  var RQ = [
    '할 수 있던 말이나 행동을 다시 못 하게 되었어요',
    '이름을 불러도 반응이 적고 눈을 잘 맞추지 않아요',
    '머리를 박거나 스스로를 때리는 행동이 있어요',
    '"죽고 싶다", "사라지고 싶다" 같은 말을 해요',
    '먹는 음식 종류가 아주 적거나 체중이 줄고 있어요'];
  var TAGN = { t: '촉각', e: '표현', b: '균형', m: '정서' };
  var CLS = { art: '퍼포먼스미술', si: '감각통합', psy: '심리·놀이' };
  var GUIDE = {
    art: '아이는 다양한 촉감을 경험하고 마음을 표현하는 활동이 도움이 될 것 같아요.\n퍼포먼스미술치료에서 몸과 재료로 편안하게 표현하는 경험을 쌓아볼 수 있어요.',
    si: '아이는 몸의 균형을 잡고 움직임을 조절하는 부분에서 도움이 필요해 보여요.\n감각통합치료에서 놀이를 통해 몸을 안정적으로 쓰는 연습을 해볼 수 있어요.',
    psy: '아이는 마음속 걱정이나 감정을 다루는 데 도움이 필요해 보여요.\n놀이치료에서 안전하게 마음을 표현하고 조절하는 힘을 키워볼 수 있어요.',
    two: '두 가지 부분이 함께 보여서, 먼저 평가로 아이의 모습을 자세히 확인한 뒤 수업을 정하는 게 좋겠어요.',
    eval: '체크해 주신 부분 중에 전문가와 먼저 자세히 확인하면 좋을 모습이 있어요.\n수업을 시작하기 전에 정밀평가를 받아보시길 권해드려요.',
    none: '지금 체크해 주신 모습으로는 수업을 바로 권해 드릴 만큼은 아니에요.\n지내는 모습을 조금 더 지켜보시고 걱정되시면 다시 상담해 주세요.'
  };
  var MARK = '[체크리스트]';

  function monthsOf(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    var n = new Date(), v = (n.getFullYear() - +m[1]) * 12 + (n.getMonth() + 1 - +m[2]);
    if (n.getDate() < +m[3]) v--;
    return v < 0 ? null : v;
  }
  function bandOf(mon) {
    if (mon == null) return null;
    for (var i = 0; i < BANDS.length; i++) if (mon >= BANDS[i].from && mon <= BANDS[i].to) return BANDS[i];
    return null;
  }
  function bandByName(nm) { for (var i = 0; i < BANDS.length; i++) if (BANDS[i].name === nm) return BANDS[i]; return null; }

  // 셈 — 점수 배열(null = 아직 안 누름) · R 배열 → 결과
  function judge(band, v, r) {
    var s = { t: 0, e: 0, b: 0, m: 0 }, t2 = [], hi = [];
    v.forEach(function (x, i) {
      var g = band.tag[i]; s[g] += (x || 0);
      if (x === 2) { hi.push(band.q[i]); if (g === 't') t2.push(i + 1); }
    });
    var tHeavy = t2.length >= 2;
    var sc = { art: s.e + (tHeavy ? 0 : s.t), si: s.b + (tHeavy ? s.t : 0), psy: s.m };
    var rs = []; r.forEach(function (on, i) { if (on) rs.push('R' + (i + 1)); });
    var o = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; });
    var res = { sc: sc, tHeavy: tHeavy, t2: t2, hi: hi, rs: rs, top: [], kind: '' };
    if (rs.length) { res.kind = 'eval'; res.title = '정밀평가 먼저'; }
    else if (sc[o[0]] <= 3) { res.kind = 'none'; res.title = '추천 없음 · 지켜보기'; }
    else if (sc[o[0]] - sc[o[1]] >= 3) { res.kind = o[0]; res.top = [o[0]]; res.title = CLS[o[0]]; }
    else { res.kind = 'two'; res.top = [o[0], o[1]]; res.title = CLS[o[0]] + ' + ' + CLS[o[1]] + ' · 초기평가 권유'; }
    var why = [];
    if (rs.length) why.push('위험 신호 ' + rs.join(' · ') + ' — 수업 추천 보류' + (r[3] ? ' (R4: 오늘 보호자와 바로 상의)' : ''));
    if (tHeavy) why.push('촉각이 심함 (' + t2.join(' · ') + '번 자주) — 촉각 점수를 감각통합으로 셈');
    else if (s.t) why.push('촉각이 가벼움 — 촉각 점수를 퍼포먼스미술로 셈');
    hi.forEach(function (q) { why.push('자주 — ' + q); });
    if (!hi.length && !rs.length) why.push('「자주(2)」로 체크한 문항 없음');
    res.why = why;
    res.guide = res.kind === 'two' ? GUIDE.two : GUIDE[res.kind] || '';
    if (res.kind === 'two') res.guide = GUIDE[o[0]] + '\n' + GUIDE.two;
    return res;
  }

  // 글 → { lines, idx, prefix, staff, band, v, r }
  function parse(text) {
    var lines = String(text || '').split('\n'), idx = -1;
    for (var i = 0; i < lines.length; i++) if (/^\s*기타\s*:/.test(lines[i])) { idx = i; break; }
    var p = { lines: lines, idx: idx, prefix: '기타 : ', staff: '', band: null, v: null, r: [0, 0, 0, 0, 0] };
    if (idx < 0) return p;
    var line = lines[idx], pm = line.match(/^\s*기타\s*:\s?/);
    p.prefix = /\s$/.test(pm[0]) ? pm[0] : pm[0] + ' ';
    var rest = line.slice(p.prefix.length), mi = rest.indexOf(MARK);
    if (mi < 0) { p.staff = rest; return p; }
    p.staff = rest.slice(0, mi).replace(/\s*\/\s*$/, '');
    var t = rest.slice(mi + MARK.length);
    var bm = t.match(/만 \d+~\d+세/); if (bm) p.band = bandByName(bm[0]);
    var sm = t.match(/점수 ([0-2-]{15})/);
    if (sm) p.v = sm[1].split('').map(function (c) { return c === '-' ? null : +c; });
    var rm = t.match(/R([1-5]+)\b/);
    if (rm) rm[1].split('').forEach(function (c) { p.r[+c - 1] = 1; });
    return p;
  }
  function build(p, band, v, r) {
    var any = v.some(function (x) { return x != null; }) || r.some(Boolean);
    var tail = '';
    if (any) {
      var j = judge(band, v, r), rr = '';
      r.forEach(function (on, i) { if (on) rr += (i + 1); });
      tail = MARK + ' ' + band.name + ' → ' + j.title.replace(' · 초기평가 권유', '')
        + ' (미술' + j.sc.art + ' 감통' + j.sc.si + ' 심리' + j.sc.psy + ')'
        + ' · 점수 ' + v.map(function (x) { return x == null ? '-' : x; }).join('')
        + ' · ' + (rr ? 'R' + rr : 'R없음');
    }
    var staff = p.staff;
    var line = p.prefix + (any ? (staff.trim() ? staff.replace(/\s+$/, '') + ' / ' : '') + tail : staff);
    var lines = p.lines.slice();
    if (p.idx >= 0) lines[p.idx] = line;
    else if (any) {
      if (lines.length === 1 && lines[0] === '') lines[0] = line;
      else if (lines[lines.length - 1] === '') lines[lines.length - 1] = line;
      else lines.push(line);
    }
    return lines.join('\n');
  }

  var REG = [];
  function css() {
    if (document.getElementById('nlChkCss')) return;
    var st = document.createElement('style'); st.id = 'nlChkCss';
    st.textContent = '.nlchk{margin:4px 0 8px;padding:10px 12px;border:1px solid #E6E2DD;border-left:3px solid #B07A4A;border-radius:8px;background:#FBF7F2;font-size:13px;}'
      + '.nlchk .hd{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;color:#7E5530;cursor:pointer;}'
      + '.nlchk .hd span{font-weight:400;color:#999;font-size:12px;}'
      + '.nlchk .it{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid #EFEAE4;line-height:1.45;}'
      + '.nlchk .it.sk .q{color:#aaa;}'
      + '.nlchk .no{color:#B07A4A;font-weight:700;margin-right:4px;}'
      + '.nlchk .sb{flex:none;display:flex;gap:4px;}'
      + '.nlchk button{width:auto !important;margin:0 !important;min-width:34px;padding:4px 0 !important;border:1px solid #D9D2C9 !important;background:#fff !important;color:#555 !important;border-radius:6px !important;font-size:13px !important;cursor:pointer;}'
      + '.nlchk button.on{background:#B07A4A !important;border-color:#B07A4A !important;color:#fff !important;}'
      + '.nlchk button.ron{background:#D8684A !important;border-color:#D8684A !important;color:#fff !important;}'
      + '.nlchk .rr{display:flex;align-items:center;gap:6px;padding:4px 0;}.nlchk .rr button{min-width:44px;}'
      + '.nlchk .sub{margin:8px 0 4px;font-size:12.5px;color:#777;font-weight:700;}'
      + '.nlchk .res{margin-top:10px;padding:10px 12px;background:#fff;border:1px solid #E6E2DD;border-radius:8px;}'
      + '.nlchk .res .tt{font-size:16px;font-weight:700;color:#7E5530;}'
      + '.nlchk .res .tt.ev{color:#C04A30;}'
      + '.nlchk .res .sc{color:#666;margin-top:3px;}'
      + '.nlchk .res ul{margin:6px 0 0 18px;padding:0;color:#444;}'
      + '.nlchk .gd{margin-top:8px;padding:8px 10px;background:#F7F4EF;border-radius:6px;white-space:pre-line;color:#444;}'
      + '.nlchk .gb{display:flex;justify-content:space-between;align-items:center;margin-top:6px;color:#999;font-size:12px;}';
    document.head.appendChild(st);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function draw(r) {
    var bd = r.birth ? r.birth() : '', mon = monthsOf(bd), band = bandOf(mon);
    var p = parse(r.ta.value);
    if (!band && p.band) band = p.band;   // 저장된 체크리스트가 있으면 그 연령으로 보여 줌
    if (!band) {
      r.band = null;
      if (mon == null) { r.box.style.display = 'none'; r.box.innerHTML = ''; return; }
      r.box.innerHTML = '<div class="hd">연령별 체크리스트<span>' + mon + '개월 — 만 2~12세(24~155개월)만 문항이 있습니다</span></div>';
      r.box.style.display = ''; return;
    }
    if (p.band && p.band !== band) band = p.band;   // 저장한 연령 그대로
    r.band = band;
    r.v = (p.v && p.band === band) ? p.v : band.q.map(function () { return null; });
    r.r = p.r;
    var done = r.v.filter(function (x) { return x != null; }).length;
    var h = '<div class="hd" data-k="fold">연령별 체크리스트 · ' + band.name
      + '<span>' + (mon != null ? mon + '개월 · ' : '') + done + '/15 문항 · 0 거의 없음 · 1 가끔 · 2 자주 · ' + (r.open ? '접기 ▲' : '펼치기 ▼') + '</span></div>';
    if (r.open) {
      band.q.forEach(function (q, i) {
        h += '<div class="it' + (r.v[i] == null ? '' : ' sk') + '"><span class="q"><span class="no">' + (i + 1) + '</span>' + esc(q) + '</span><span class="sb">'
          + [0, 1, 2].map(function (n) { return '<button type="button" data-i="' + i + '" data-n="' + n + '"' + (r.v[i] === n ? ' class="on"' : '') + '>' + n + '</button>'; }).join('')
          + '</span></div>';
      });
      h += '<div class="sub">공통 확인 — 해당하면 누르기</div>';
      RQ.forEach(function (q, i) {
        h += '<div class="rr"><button type="button" data-r="' + i + '"' + (r.r[i] ? ' class="ron"' : '') + '>R' + (i + 1) + '</button><span>' + esc(q) + '</span></div>';
      });
    }
    var j = judge(band, r.v, r.r);
    h += '<div class="res"><div class="tt' + (j.kind === 'eval' ? ' ev' : '') + '">추천 — ' + esc(j.title) + '</div>'
      + '<div class="sc">점수 — 퍼포먼스미술 ' + j.sc.art + ' · 감각통합 ' + j.sc.si + ' · 심리·놀이 ' + j.sc.psy + '</div>'
      + '<ul>' + j.why.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
      + '<div class="gd">' + esc(j.guide) + '</div>'
      + '<div class="gb"><span>누를 때마다 아래 「기타 :」 줄 끝에 결과가 적힙니다 (직원 글은 그대로)</span><button type="button" data-k="copy" style="min-width:110px">안내 문장 복사</button></div></div>';
    r.box.innerHTML = h; r.box.style.display = '';
    r.box.onclick = function (e) {
      var b = e.target.closest('[data-i],[data-r],[data-k]'); if (!b) return;
      if (b.dataset.k === 'fold') { r.open = !r.open; draw(r); return; }
      if (b.dataset.k === 'copy') {
        var g = judge(r.band, r.v, r.r).guide;
        (navigator.clipboard ? navigator.clipboard.writeText(g) : Promise.reject()).then(function () { b.textContent = '복사했습니다'; setTimeout(function () { b.textContent = '안내 문장 복사'; }, 1500); }, function () { prompt('복사해 주세요', g); });
        return;
      }
      if (r.ta.readOnly || r.ta.disabled) return;
      if (b.dataset.i != null) { var i = +b.dataset.i, n = +b.dataset.n; r.v[i] = r.v[i] === n ? null : n; }
      if (b.dataset.r != null) { var k = +b.dataset.r; r.r[k] = r.r[k] ? 0 : 1; }
      var q = parse(r.ta.value);
      r.ta.value = build(q, r.band, r.v, r.r);
      r.inner = true; r.ta.dispatchEvent(new Event('input', { bubbles: true })); r.inner = false;   // 「저장 전」 · 칸 높이 맞춤
      draw(r);
    };
  }
  function find(ta) { for (var i = 0; i < REG.length; i++) if (REG[i].ta === ta) return REG[i]; return null; }

  w.NLChk = {
    attach: function (ta, opt) {
      if (!ta || find(ta)) return;
      css();
      var box = document.createElement('div'); box.className = 'nlchk'; box.style.display = 'none';
      ta.parentNode.insertBefore(box, ta);
      var r = { ta: ta, box: box, birth: opt && opt.birth, band: null, open: true, inner: false };
      REG.push(r);
      ta.addEventListener('input', function () { if (!r.inner) draw(r); });
      draw(r);
    },
    refresh: function (ta) { var r = find(ta); if (r) draw(r); },
    _parse: parse, _build: build, _judge: judge, _bands: BANDS
  };
})(window);
