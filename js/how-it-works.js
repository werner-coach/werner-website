/* How It Works: a seven-step click-through of a charter trip (index.html #how-it-works).
   Plain inline SVG drawn by code, no libraries. Each step is one scene function of time;
   the frame loop runs only while a scene is playing and stops on its last frame.
   Reduced motion: every step shows one still frame and nothing moves.
   Vehicle facts the art keeps right: three axles, passenger door on the right front (curb side),
   driver on the left. dir=1 shows the curb side (front to the right, door visible);
   dir=-1 shows the driver's side (front to the left, driver's window, no door). */
(function () {
  'use strict';
  var root = document.getElementById('hiwPlayer');
  if (!root) return;
  var ui = root.querySelector('.hiw-ui');
  var sceneEl = document.getElementById('hiwScene');
  var items = root.querySelectorAll('.hiw-list li');
  if (!ui || !sceneEl || !items.length) return;

  // ---------- Palette (site navy and gold) ----------
  var C = { navy: '#0B1D3A', navy2: '#142a4f', navy3: '#33497a', gold: '#B8965A', gold2: '#e3c88c', goldD: '#9a7a42',
    white: '#ffffff', sky: '#e4ecf5', sky2: '#d5e0ee', pave: '#d3d7de', pave2: '#bcc2cd',
    glass: '#bccadd', glassD: '#33466e', skin: '#d9ae8c', skin2: '#b98a68', skin3: '#8a5a3c',
    grey2: '#aeb5c2', dark: '#0a1226', wall: '#f1ece2', wall2: '#ded6c6', green: '#9db8a4', green2: '#84a48d',
    brick: '#b5523b', teal: '#3f7d6e', plum: '#6b5b95', amber: '#d98c4a' };

  var W = 900, H = 540, GY = 430, BY = 464, S = 0.8;
  var COACH_X = 300, DOOR_X = COACH_X + 294 * S, DRIVER_X = 642;
  var SPOTS = [694, 746, 798, 848];
  var GROUP = [
    { shirt: C.brick, pants: '#4a5468', skin: C.skin },
    { shirt: C.teal, pants: '#3b3f4a', skin: C.skin3 },
    { shirt: C.amber, pants: '#566077', skin: C.skin2 },
    { shirt: C.plum, pants: '#4a5468', skin: C.skin }
  ];
  var SEATS = [199, 101, 3, -95];

  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, x) { return a + (b - a) * x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(x) { return x * x * (3 - 2 * x); }
  function eout(x) { return 1 - Math.pow(1 - x, 3); }
  function back(x) { var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function rnd(n) { return +n.toFixed(2); }
  function wrapX(v, period) { return ((v % period) + period) % period; }

  // ---------- Motorcoach, side view. Origin = ground under the center. ----------
  function coachSide(o) {
    var x = o.x, y = o.y, dir = o.dir || 1, s = o.s || S, door = o.door || 0, wheel = o.wheel || 0;
    var flash = o.flash === undefined ? null : o.flash;
    var g = '<g transform="translate(' + rnd(x) + ' ' + rnd(y) + ') scale(' + (dir * s) + ' ' + s + ')">';
    g += '<ellipse cx="0" cy="2" rx="372" ry="9" fill="#000" opacity=".12"/>';
    g += '<path d="M 330 -192 Q 372 -196 378 -170" stroke="' + C.navy + '" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="371" y="-172" width="15" height="46" rx="5" fill="' + C.navy + '"/>';
    g += '<path d="M -360 -36 L -360 -172 Q -360 -196 -336 -196 L 306 -196 Q 340 -196 350 -160 L 368 -80 Q 372 -36 344 -36 Z" fill="' + C.navy + '"/>';
    g += '<rect x="-340" y="-178" width="590" height="62" rx="8" fill="' + C.glassD + '"/>';
    for (var wx = -242; wx < 250; wx += 98) g += '<rect x="' + wx + '" y="-178" width="7" height="62" fill="' + C.navy + '"/>';
    g += '<path d="M 330 -186 Q 340 -184 345 -160 L 356 -110 L 332 -110 Z" fill="' + C.glass + '"/>';
    g += '<rect x="-360" y="-108" width="718" height="8" fill="' + C.gold + '"/>';
    if (dir === 1) {
      if (door > 0.01) {
        g += '<rect x="262" y="-180" width="64" height="142" rx="6" fill="' + C.dark + '"/>';
        g += '<rect x="' + rnd(262 + 64 * door * 0.92) + '" y="-180" width="' + rnd(Math.max(6, 64 * (1 - door * 0.9))) + '" height="142" rx="4" fill="' + C.glass + '"/>';
      } else {
        g += '<rect x="262" y="-180" width="64" height="142" rx="6" fill="' + C.glass + '"/><rect x="292" y="-180" width="4" height="142" fill="' + C.navy + '"/>';
      }
    } else {
      g += '<rect x="262" y="-180" width="66" height="72" rx="6" fill="' + C.dark + '"/>';
      g += '<path d="M 268 -108 Q 288 -138 310 -108 Z" fill="' + C.wall + '"/><circle cx="290" cy="-146" r="15" fill="' + C.skin + '"/><path d="M 275 -149 A 15.5 15.5 0 0 1 305 -149 Z" fill="' + C.navy + '"/><rect x="298" y="-151" width="19" height="4.5" rx="2" fill="' + C.navy + '"/>';
      g += '<rect x="262" y="-180" width="66" height="72" rx="4" fill="' + C.glass + '" opacity=".28"/>';
      g += '<rect x="262" y="-108" width="66" height="4" fill="' + C.gold + '"/>';
    }
    var wheels = [232, -172, -262];
    for (var i = 0; i < 3; i++) {
      var cx = wheels[i];
      g += '<circle cx="' + cx + '" cy="-34" r="44" fill="' + C.dark + '"/><circle cx="' + cx + '" cy="-34" r="34" fill="#1e2740"/><circle cx="' + cx + '" cy="-34" r="17" fill="' + C.grey2 + '"/>';
      g += '<g transform="rotate(' + rnd(wheel) + ' ' + cx + ' -34)"><rect x="' + (cx - 3) + '" y="-49" width="6" height="30" rx="3" fill="' + C.gold + '"/><rect x="' + (cx - 15) + '" y="-37" width="30" height="6" rx="3" fill="' + C.gold + '"/></g>';
    }
    if (flash !== null) {
      if (flash) g += '<circle cx="-358" cy="-132" r="30" fill="' + C.gold2 + '" opacity=".45"/><circle cx="360" cy="-72" r="26" fill="' + C.gold2 + '" opacity=".5"/>';
      g += '<rect x="-364" y="-150" width="9" height="36" rx="3" fill="' + (flash ? C.gold2 : C.goldD) + '"/><rect x="352" y="-84" width="14" height="22" rx="4" fill="' + (flash ? C.gold2 : C.goldD) + '"/>';
    }
    if (o.letter !== 0) g += '<g opacity="' + rnd(o.letter === undefined ? 1 : o.letter) + '" transform="translate(25 -60) scale(' + dir + ' 1)"><text x="0" y="0" text-anchor="middle" font-size="30" font-weight="700" letter-spacing="2" fill="' + C.gold + '">WERNER COACH</text></g>';
    return g + '</g>';
  }
  function wheelDeg(dist, s) { return dist / (44 * (s || S)) * 180 / Math.PI; }

  // Riders seen through the side windows. seats = [{lx, shirt, skin, o}]
  function riders(x, y, dir, seats, s) {
    s = s || S;
    var g = '<g transform="translate(' + rnd(x) + ' ' + rnd(y) + ') scale(' + (dir * s) + ' ' + s + ')">';
    for (var i = 0; i < seats.length; i++) {
      var r = seats[i]; if (r.o <= 0.01) continue;
      g += '<g opacity="' + rnd(r.o) + '"><path d="M ' + (r.lx - 21) + ' -116 Q ' + r.lx + ' -140 ' + (r.lx + 21) + ' -116 Z" fill="' + r.shirt + '"/>';
      g += '<circle cx="' + r.lx + '" cy="-144" r="13" fill="' + r.skin + '"/><path d="M ' + (r.lx - 13.5) + ' -145 A 13.5 13.5 0 0 1 ' + (r.lx + 13.5) + ' -145 Z" fill="#3b3f4a"/></g>';
    }
    return g + '</g>';
  }
  function seated(n, op) {
    var a = [];
    for (var i = 0; i < GROUP.length; i++) a.push({ lx: SEATS[i], shirt: GROUP[i].shirt, skin: GROUP[i].skin, o: op ? op(i) : (i < n ? 1 : 0) });
    return a;
  }

  // Luggage bay under the floor, curb side. open 0..1, bags = how many are stowed (may be fractional while one slides in).
  function bay(x, y, open, bags) {
    if (open <= 0.01) return '';
    var g = '<g transform="translate(' + rnd(x) + ' ' + rnd(y) + ') scale(' + S + ')">';
    var h = 50 * open;
    g += '<rect x="-64" y="-96" width="214" height="' + rnd(h) + '" rx="5" fill="' + C.dark + '"/>';
    if (open > 0.9) {
      var cols = [C.brick, C.teal, C.amber];
      for (var i = 0; i < 3; i++) {
        var o = clamp(bags - i);
        if (o > 0.01) g += '<rect x="' + (-44 + i * 62) + '" y="-84" width="46" height="34" rx="6" fill="' + cols[i] + '" opacity="' + rnd(o) + '"/>';
      }
    }
    return g + '</g>';
  }
  function bag(x, y, col, o) {
    return '<g transform="translate(' + rnd(x) + ' ' + rnd(y) + ')" opacity="' + rnd(o === undefined ? 1 : o) + '"><rect x="-9" y="-40" width="18" height="12" rx="4" fill="none" stroke="' + C.navy + '" stroke-width="3"/><rect x="-15" y="-30" width="30" height="30" rx="5" fill="' + col + '"/></g>';
  }

  // ---------- Person, side view. Origin = between the feet. About 110 units tall at s=1. ----------
  function person(o) {
    var kinds = {
      driver: { shirt: C.wall, pants: C.navy2, skin: C.skin, cap: C.navy },
      crew: { shirt: C.gold, pants: C.navy, skin: C.skin2, cap: C.gold2 },
      ped: { shirt: C.grey2, pants: '#566077', skin: C.skin2, cap: null }
    };
    var k = kinds[o.kind || 'ped'];
    var col = { shirt: o.shirt || k.shirt, pants: o.pants || k.pants, skin: o.skin || k.skin, cap: k.cap };
    var pose = o.pose || 'stand', ph = o.ph || 0, s = o.s || S, dir = o.dir || 1;
    var sw = pose === 'walk' ? Math.sin(ph) * 0.55 : 0.07;
    function foot(a) { return [Math.sin(a) * 50, -50 + Math.cos(a) * 50]; }
    var f1 = foot(sw), f2 = foot(-sw);
    function arm(e, h) {
      return '<polyline points="0,-84 ' + rnd(e[0]) + ',' + rnd(e[1]) + ' ' + rnd(h[0]) + ',' + rnd(h[1]) + '" fill="none" stroke="' + col.shirt + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + rnd(h[0]) + '" cy="' + rnd(h[1]) + '" r="5.5" fill="' + col.skin + '"/>';
    }
    var a1, a2, wave = Math.sin(ph) * 7;
    if (pose === 'walk') {
      var q = -sw, r = sw;
      a1 = arm([Math.sin(q) * 20, -84 + Math.cos(q) * 20], [Math.sin(q * 1.2) * 38, -84 + Math.cos(q * 1.2) * 38]);
      a2 = arm([Math.sin(r) * 20, -84 + Math.cos(r) * 20], [Math.sin(r * 1.2) * 38, -84 + Math.cos(r * 1.2) * 38]);
    } else if (pose === 'cheer') {
      var w2 = Math.sin(ph) * 9;
      a1 = arm([20, -100], [26 + w2, -128]); a2 = arm([-20, -100], [-26 + w2, -128]);
    } else if (pose === 'wave') {
      a1 = arm([4, -66], [5, -48]); a2 = arm([-14, -98], [-20 + wave, -124]);
    } else if (pose === 'welcome') {
      a1 = arm([20, -78], [40, -72]); a2 = arm([-4, -66], [-5, -48]);
    } else if (pose === 'thumb') {
      a1 = arm([17, -72], [30, -84]) + '<line x1="30" y1="-86" x2="30" y2="-96" stroke="' + col.skin + '" stroke-width="5" stroke-linecap="round"/>';
      a2 = arm([-3, -66], [-5, -48]);
    } else {
      a1 = arm([4, -66], [5, -48]); a2 = arm([-4, -66], [-5, -48]);
    }
    var g = '<g transform="translate(' + rnd(o.x) + ' ' + rnd(o.y) + ') scale(' + (dir * s) + ' ' + s + ')" opacity="' + rnd(o.o === undefined ? 1 : o.o) + '">';
    g += '<ellipse cx="0" cy="1" rx="24" ry="4" fill="#000" opacity=".14"/>';
    g += a2;
    g += '<line x1="-3" y1="-50" x2="' + rnd(f2[0]) + '" y2="' + rnd(f2[1]) + '" stroke="' + col.pants + '" stroke-width="10" stroke-linecap="round"/>';
    g += '<line x1="3" y1="-50" x2="' + rnd(f1[0]) + '" y2="' + rnd(f1[1]) + '" stroke="' + col.pants + '" stroke-width="10" stroke-linecap="round"/>';
    g += '<rect x="-12" y="-90" width="24" height="46" rx="9" fill="' + col.shirt + '"/>';
    if (o.kind === 'crew') g += '<rect x="-12" y="-76" width="24" height="5" fill="#fff"/><rect x="-12" y="-62" width="24" height="5" fill="#fff"/>';
    if (o.kind === 'driver') g += '<path d="M -4 -90 L 0 -70 L 4 -90 Z" fill="' + C.navy + '"/>';
    g += '<circle cx="0" cy="-104" r="12.5" fill="' + col.skin + '"/><circle cx="12" cy="-103" r="2.6" fill="' + col.skin + '"/>';
    if (col.cap) g += '<path d="M -13 -106 A 13 13 0 0 1 13 -106 Z" fill="' + col.cap + '"/><rect x="3" y="-108" width="17" height="4" rx="2" fill="' + col.cap + '"/>';
    else g += '<path d="M -13 -104 A 13 13 0 0 1 12 -110 Q 0 -112 -13 -104 Z" fill="#3b3f4a"/>';
    g += a1;
    return g + '</g>';
  }
  function rider(i, o) {
    var p = GROUP[i];
    o.kind = 'ped'; o.shirt = p.shirt; o.pants = p.pants; o.skin = p.skin;
    return person(o);
  }

  // ---------- Scenery ----------
  function sky(fill, haze) {
    return '<rect width="' + W + '" height="' + H + '" fill="' + fill + '"/>' + (haze ? '<rect y="' + (GY - 150) + '" width="' + W + '" height="150" fill="' + haze + '" opacity=".6"/>' : '');
  }
  function ground(fill, line) {
    return '<rect y="' + GY + '" width="' + W + '" height="' + (H - GY) + '" fill="' + fill + '"/><rect y="' + GY + '" width="' + W + '" height="4" fill="' + line + '"/>';
  }
  function cloud(x, y, s, o) {
    return '<g transform="translate(' + rnd(x) + ' ' + y + ') scale(' + s + ')" opacity="' + (o || 0.95) + '" fill="#fff"><ellipse cx="0" cy="0" rx="46" ry="17"/><ellipse cx="-20" cy="-13" rx="24" ry="17"/><ellipse cx="16" cy="-17" rx="28" ry="20"/></g>';
  }
  function hill(x, w, h, fill) { return '<ellipse cx="' + rnd(x) + '" cy="' + GY + '" rx="' + w + '" ry="' + h + '" fill="' + fill + '"/>'; }
  function tree(x, s, c1, c2, trunk) {
    return '<g transform="translate(' + rnd(x) + ' ' + GY + ') scale(' + s + ')"><rect x="-5" y="-52" width="10" height="52" rx="3" fill="' + (trunk || '#8a735c') + '"/><circle cx="0" cy="-78" r="34" fill="' + c1 + '"/><circle cx="-14" cy="-60" r="22" fill="' + c2 + '"/><circle cx="16" cy="-58" r="20" fill="' + c2 + '"/></g>';
  }
  function sun(x, y, r) {
    return '<circle cx="' + x + '" cy="' + rnd(y) + '" r="' + (r * 1.7) + '" fill="' + C.gold2 + '" opacity=".28"/><circle cx="' + x + '" cy="' + rnd(y) + '" r="' + r + '" fill="' + C.gold2 + '"/>';
  }
  function stars(t, o) {
    var pts = [[60, 60], [150, 120], [250, 50], [340, 105], [430, 40], [540, 90], [620, 45], [820, 150], [870, 60], [110, 190], [480, 150]];
    var g = '<g fill="#fff" opacity="' + rnd(o) + '">';
    for (var i = 0; i < pts.length; i++) g += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (i % 3 ? 2 : 2.8) + '" opacity="' + rnd(0.55 + 0.45 * Math.sin(t * 1.6 + i * 1.9)) + '"/>';
    return g + '</g>';
  }
  function moon(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="52" fill="#fff" opacity=".1"/><circle cx="' + x + '" cy="' + y + '" r="30" fill="#f6eed8"/><circle cx="' + (x - 9) + '" cy="' + (y - 6) + '" r="6" fill="#e6dcc0"/><circle cx="' + (x + 10) + '" cy="' + (y + 9) + '" r="4" fill="#e6dcc0"/>';
  }
  // Werner garage. The coach is drawn first, so it rolls out from behind the right wall.
  function garage() {
    var g = '<rect x="-10" y="' + (GY - 236) + '" width="262" height="236" fill="' + C.wall + '"/>';
    g += '<rect x="240" y="' + (GY - 236) + '" width="12" height="236" fill="' + C.wall2 + '"/>';
    g += '<rect x="-10" y="' + (GY - 256) + '" width="272" height="26" rx="4" fill="' + C.navy + '"/>';
    g += '<rect x="18" y="' + (GY - 214) + '" width="206" height="46" rx="6" fill="' + C.navy + '"/>';
    g += '<text x="121" y="' + (GY - 184) + '" text-anchor="middle" font-size="21" font-weight="700" letter-spacing="1.5" fill="' + C.gold + '">WERNER COACH</text>';
    g += '<rect x="34" y="' + (GY - 146) + '" width="174" height="146" rx="4" fill="' + C.pave + '"/>';
    for (var k = 1; k < 6; k++) g += '<rect x="34" y="' + (GY - 146 + k * 24) + '" width="174" height="3" fill="' + C.pave2 + '"/>';
    return g;
  }
  // The group's own place: pickup spot and the place they come home to.
  function hall(lit) {
    var x = 650, wl = lit ? '#a9a3a6' : C.wall, tr = lit ? '#8f898e' : C.wall2, wn = lit ? '#f2d58c' : C.glass;
    var g = '<rect x="' + x + '" y="' + (GY - 170) + '" width="270" height="170" fill="' + wl + '"/>';
    g += '<path d="M ' + (x - 14) + ' ' + (GY - 170) + ' L ' + (x + 135) + ' ' + (GY - 236) + ' L ' + (x + 284) + ' ' + (GY - 170) + ' Z" fill="' + (lit ? '#2a3557' : C.navy3) + '"/>';
    g += '<circle cx="' + (x + 135) + '" cy="' + (GY - 194) + '" r="13" fill="' + wn + '"/>';
    for (var i = 0; i < 4; i++) { if (i === 1) continue; g += '<rect x="' + (x + 24 + i * 62) + '" y="' + (GY - 140) + '" width="36" height="50" rx="4" fill="' + wn + '"/>'; }
    g += '<rect x="' + (x + 78) + '" y="' + (GY - 104) + '" width="52" height="104" rx="5" fill="' + (lit ? '#3a4568' : C.navy3) + '"/>';
    g += '<rect x="' + x + '" y="' + (GY - 8) + '" width="270" height="8" fill="' + tr + '"/>';
    return g;
  }
  function lamp(x) {
    return '<circle cx="' + x + '" cy="' + (GY - 150) + '" r="60" fill="#f2d58c" opacity=".2"/><rect x="' + (x - 3) + '" y="' + (GY - 146) + '" width="6" height="146" rx="3" fill="#2a3557"/><circle cx="' + x + '" cy="' + (GY - 150) + '" r="12" fill="#f6e2a6"/>';
  }
  function skyline() {
    var b = [[0, 70, 150], [78, 54, 210], [140, 80, 120], [230, 60, 250], [298, 90, 170], [396, 64, 130], [468, 76, 220], [552, 60, 160], [820, 90, 190]];
    var g = '';
    for (var i = 0; i < b.length; i++) g += '<rect x="' + b[i][0] + '" y="' + (GY - b[i][2]) + '" width="' + b[i][1] + '" height="' + b[i][2] + '" fill="' + (i % 2 ? '#c3cfe0' : '#cfd9e7') + '"/>';
    return g;
  }
  function museum() {
    var x = 640, g = '';
    g += '<rect x="' + x + '" y="' + (GY - 150) + '" width="250" height="150" fill="' + C.wall2 + '"/>';
    g += '<path d="M ' + (x - 12) + ' ' + (GY - 150) + ' L ' + (x + 125) + ' ' + (GY - 212) + ' L ' + (x + 262) + ' ' + (GY - 150) + ' Z" fill="' + C.wall + '" stroke="' + C.wall2 + '" stroke-width="4"/>';
    g += '<rect x="' + (x - 12) + '" y="' + (GY - 154) + '" width="274" height="14" fill="' + C.wall + '"/>';
    for (var i = 0; i < 5; i++) g += '<rect x="' + (x + 14 + i * 52) + '" y="' + (GY - 140) + '" width="20" height="124" rx="4" fill="' + C.wall + '"/>';
    g += '<rect x="' + (x - 14) + '" y="' + (GY - 16) + '" width="278" height="8" fill="' + C.wall + '"/><rect x="' + (x - 24) + '" y="' + (GY - 8) + '" width="298" height="8" fill="' + C.wall2 + '"/>';
    return g;
  }
  function pin(x, y, sc, o) {
    return '<g transform="translate(' + x + ' ' + rnd(y) + ') scale(' + rnd(sc) + ')" opacity="' + rnd(o) + '"><path d="M 0 0 C -16 -22 -24 -34 -24 -46 A 24 24 0 1 1 24 -46 C 24 -34 16 -22 0 0 Z" fill="' + C.gold + '" stroke="' + C.navy + '" stroke-width="3"/><circle cx="0" cy="-46" r="9" fill="' + C.navy + '"/></g>';
  }
  function checkMark(x, y, r, o, sc) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + rnd(sc) + ')" opacity="' + rnd(o) + '"><circle r="' + (r + 5) + '" fill="#fff" opacity=".9"/><circle r="' + r + '" fill="' + C.gold + '"/><polyline points="' + rnd(-r * 0.45) + ',' + rnd(r * 0.02) + ' ' + rnd(-r * 0.1) + ',' + rnd(r * 0.38) + ' ' + rnd(r * 0.5) + ',' + rnd(-r * 0.36) + '" fill="none" stroke="' + C.navy + '" stroke-width="' + rnd(r * 0.2) + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }
  function ferris(cx, cy, r, rot) {
    var g = '<path d="M ' + (cx - 70) + ' ' + GY + ' L ' + cx + ' ' + cy + ' L ' + (cx + 70) + ' ' + GY + '" fill="none" stroke="' + C.navy3 + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + C.navy + '" stroke-width="6"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 18) + '" fill="none" stroke="' + C.navy3 + '" stroke-width="3"/>';
    var cols = [C.gold, C.brick, C.teal, C.amber];
    for (var k = 0; k < 8; k++) {
      var a = (rot + k * 45) * Math.PI / 180, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + rnd(px) + '" y2="' + rnd(py) + '" stroke="' + C.navy3 + '" stroke-width="3"/>';
      g += '<path d="M ' + rnd(px - 15) + ' ' + rnd(py + 6) + ' h 30 v 12 a 8 8 0 0 1 -8 8 h -14 a 8 8 0 0 1 -8 -8 Z" fill="' + cols[k % 4] + '"/><path d="M ' + rnd(px - 17) + ' ' + rnd(py + 6) + ' Q ' + rnd(px) + ' ' + rnd(py - 12) + ' ' + rnd(px + 17) + ' ' + rnd(py + 6) + ' Z" fill="' + C.navy + '"/>';
    }
    return g + '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="' + C.gold + '" stroke="' + C.navy + '" stroke-width="4"/>';
  }
  function bunting(x1, y1, x2, y2, t) {
    var n = 9, g = '<path d="M ' + x1 + ' ' + y1 + ' Q ' + ((x1 + x2) / 2) + ' ' + (Math.max(y1, y2) + 46) + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + C.navy + '" stroke-width="2.5"/>';
    var cols = [C.gold, C.brick, C.navy3, C.teal];
    for (var i = 1; i < n; i++) {
      var u = i / n, mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 46;
      var bx = (1 - u) * (1 - u) * x1 + 2 * u * (1 - u) * mx + u * u * x2, by = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * my + u * u * y2;
      g += '<path d="M -10 0 L 10 0 L 0 22 Z" transform="translate(' + rnd(bx) + ' ' + rnd(by) + ') rotate(' + rnd(Math.sin(t * 2 + i) * 7) + ')" fill="' + cols[i % 4] + '"/>';
    }
    return g;
  }
  function balloon(x, y, col, len) {
    return '<path d="M ' + rnd(x) + ' ' + rnd(y + 22) + ' q 6 ' + (len / 2) + ' 0 ' + len + '" fill="none" stroke="' + C.navy3 + '" stroke-width="1.6"/><ellipse cx="' + rnd(x) + '" cy="' + rnd(y) + '" rx="17" ry="21" fill="' + col + '"/><ellipse cx="' + rnd(x - 6) + '" cy="' + rnd(y - 8) + '" rx="4" ry="6" fill="#fff" opacity=".45"/>';
  }

  // ---------- The seven scenes. Each returns SVG for time t (seconds since the step opened). ----------
  var SCENES = [
    { // 1 Depot: the coach rolls out of the Werner garage as the sun comes up.
      dur: 4.4,
      draw: function (t) {
        var m = eio(seg(t, 0.5, 3.2)), x = lerp(-80, 566, m), up = eout(seg(t, 0, 3.6));
        var g = sky(C.sky, C.sky2) + sun(770, lerp(GY - 10, 120, up), 34);
        g += cloud(420 + t * 5, 96, 1) + cloud(640 + t * 3, 200, 0.7, 0.8);
        g += hill(600, 300, 70, C.green) + hill(900, 260, 100, C.green2) + ground(C.pave, C.pave2);
        g += coachSide({ x: x, y: BY, dir: 1, wheel: wheelDeg(x) });
        g += garage();
        g += person({ x: 150, y: BY + 6, kind: 'crew', dir: 1, pose: t > 1 && t < 4.2 ? 'wave' : 'thumb', ph: t * 7 });
        return g;
      }
    },
    { // 2 Pickup: the coach pulls up where the group is waiting.
      dur: 4.6,
      draw: function (t) {
        var m = eout(seg(t, 0, 2.1)), x = lerp(-330, COACH_X, m), door = eio(seg(t, 2.2, 2.7));
        var g = sky(C.sky, C.sky2) + sun(120, 100, 30) + cloud(330 + t * 4, 90, 1) + cloud(560 + t * 3, 150, 0.7, 0.8);
        g += hill(180, 280, 80, C.green) + tree(600, 0.9, C.green2, C.green) + tree(80, 0.8, C.green2, C.green) + hall(false) + ground(C.pave, C.pave2);
        g += coachSide({ x: x, y: BY, dir: 1, wheel: wheelDeg(x), door: door });
        var dv = seg(t, 2.8, 3.3);
        if (dv > 0) g += person({ x: lerp(DOOR_X + 4, DRIVER_X, eio(seg(t, 2.9, 3.7))), y: BY, kind: 'driver', dir: 1, o: dv, pose: t < 3.7 ? 'walk' : (t < 4.5 ? 'wave' : 'welcome'), ph: t * 9 });
        for (var i = 0; i < 4; i++) {
          var hail = (i === 0 && t > 0.3 && t < 2.2) || (i === 2 && t > 0.9 && t < 2.2);
          g += rider(i, { x: SPOTS[i], y: BY + (i % 2 ? 4 : 0), dir: -1, pose: hail ? 'wave' : 'stand', ph: t * 8 + i });
        }
        g += bag(SPOTS[1] - 26, BY + 8, C.brick) + bag(SPOTS[2] - 26, BY + 4, C.amber) + bag(SPOTS[3] - 26, BY + 8, C.teal);
        return g;
      }
    },
    { // 3 Boarding: bags go underneath, the group climbs aboard one by one.
      dur: 6.4, still: 3.1,
      draw: function (t) {
        var g = sky(C.sky, C.sky2) + sun(120, 100, 30) + cloud(350 + t * 4, 90, 1) + cloud(575 + t * 3, 150, 0.7, 0.8);
        g += hill(180, 280, 80, C.green) + tree(600, 0.9, C.green2, C.green) + tree(80, 0.8, C.green2, C.green) + hall(false) + ground(C.pave, C.pave2);
        var closing = seg(t, 4.2, 4.8);
        g += coachSide({ x: COACH_X, y: BY, dir: 1, door: 1, letter: seg(closing, 0.5, 1) });
        var arrive = [], walkers = '';
        for (var i = 0; i < 4; i++) {
          var t0 = 0.5 + i * 0.85, d = SPOTS[i] - DOOR_X, t1 = t0 + d / 125, u = seg(t, t0, t1), px = SPOTS[i] - d * u;
          arrive.push(t1);
          var fade = 1 - seg(px, DOOR_X + 26, DOOR_X + 2) * (u > 0 ? 1 : 0);
          if (fade > 0.01) walkers += rider(i, { x: px, y: BY + (i % 2 ? 4 : 0) * (1 - u) - 12 * seg(px, DOOR_X + 30, DOOR_X), dir: -1, pose: u > 0 && u < 1 ? 'walk' : 'stand', ph: (SPOTS[i] - px) / 11, o: fade });
        }
        g += riders(COACH_X, BY, 1, seated(0, function (i) { return seg(t, arrive[i] + 0.25, arrive[i] + 0.6); }));
        g += bay(COACH_X, BY, 1 - closing, 3 * seg(t, 0.4, 2.8));
        var cols = [C.brick, C.amber, C.teal];
        for (var b = 0; b < 3; b++) {
          var k = eio(seg(t, 0.3 + b * 0.8, 1.1 + b * 0.8));
          if (k < 1) g += bag(lerp(250 + b * 44, COACH_X - 20 + b * 50, k), lerp(BY + 14, BY - 36, k), cols[b], 1 - seg(k, 0.7, 1));
        }
        g += walkers;
        g += person({ x: DRIVER_X, y: BY, kind: 'driver', dir: -1, pose: t > 5.4 ? 'thumb' : 'welcome' });
        return g;
      }
    },
    { // 4 Destination: the coach arrives and the group steps off at the door.
      dur: 5.9,
      draw: function (t) {
        var m = eout(seg(t, 0, 1.9)), x = lerp(-330, COACH_X, m), door = eio(seg(t, 2.0, 2.5));
        var g = sky(C.sky, C.sky2) + sun(450, 80, 30) + cloud(180 + t * 4, 70, 0.9) + cloud(700 + t * 3, 110, 0.7, 0.8);
        g += skyline() + museum() + tree(596, 0.75, C.green2, C.green) + ground(C.pave, C.pave2);
        g += coachSide({ x: x, y: BY, dir: 1, wheel: wheelDeg(x), door: door });
        var out = [], walkers = '';
        for (var i = 0; i < 4; i++) {
          var t0 = 2.7 + i * 0.6, tx = SPOTS[3 - i], d = tx - DOOR_X, t1 = t0 + d / 135, u = seg(t, t0, t1), px = DOOR_X + d * u;
          out.push(t0);
          var o = seg(t, t0, t0 + 0.25);
          if (o > 0.01) walkers += rider(i, { x: px, y: BY - 12 * (1 - seg(px, DOOR_X, DOOR_X + 30)) + ((3 - i) % 2 ? 4 : 0) * u, dir: 1, o: o, pose: u < 1 ? 'walk' : (i === 0 && t > 4.9 ? 'welcome' : 'stand'), ph: (px - DOOR_X) / 11 });
        }
        g += riders(x, BY, 1, seated(0, function (i) { return 1 - seg(t, out[i] - 0.3, out[i]); }));
        g += walkers;
        var p = seg(t, 4.7, 5.5);
        if (p > 0) g += pin(765, lerp(GY - 330, GY - 222, back(p)), 1, seg(t, 4.7, 4.95));
        return g;
      }
    },
    { // 5 Fun: the group enjoys the day while the coach waits.
      dur: 9,
      draw: function (t) {
        var g = sky(C.sky, C.sky2) + sun(120, 90, 32) + cloud(330 + t * 4, 70, 1) + cloud(60 + t * 3, 170, 0.6, 0.8);
        g += hill(250, 330, 60, C.green) + hill(760, 300, 44, C.green2);
        g += ferris(690, 214, 132, 150 * eout(seg(t, 0, 9)));
        g += ground('#c9dcc4', '#b2cbb0');
        g += tree(52, 0.9, C.green2, C.green) + coachSide({ x: 222, y: GY + 10, dir: 1, s: 0.44 });
        g += bunting(30, 70, 500, 96, t < 8.6 ? t : 8.6);
        var cols = [C.brick, C.gold, C.teal];
        for (var b = 0; b < 3; b++) {
          var rise = eout(seg(t, 0.4 + b * 0.5, 7 + b * 0.5));
          g += balloon(520 + b * 46 + Math.sin(t * 1.3 + b * 2) * 8 * (1 - rise), lerp(GY - 40, 150 - b * 34, rise), cols[b], 34);
        }
        var xs = [352, 420, 484, 546, 616], who = [0, 1, 2, 3, 0], ph = t < 8.4 ? t * 7 : 8.4 * 7;
        for (var i = 0; i < 5; i++) {
          var kid = i === 2, hop = Math.abs(Math.sin(ph * 0.5 + i * 1.3)) * (kid ? 9 : 5) * (t < 8.4 ? 1 : 0);
          g += rider(who[i], { x: xs[i], y: BY + 30 - hop, s: kid ? 0.62 : 1, dir: i < 3 ? 1 : -1, pose: i === 1 ? 'wave' : 'cheer', ph: ph + i * 1.7 });
        }
        g += '<path d="M ' + (xs[2] + 16) + ' ' + rnd(BY - 40) + ' Q ' + (xs[2] + 26) + ' ' + (BY - 90) + ' ' + (xs[2] + 22) + ' ' + (BY - 128) + '" fill="none" stroke="' + C.navy3 + '" stroke-width="1.6"/><ellipse cx="' + (xs[2] + 22) + '" cy="' + (BY - 148) + '" rx="17" ry="21" fill="' + C.amber + '"/>';
        return g;
      }
    },
    { // 6 Return: evening, the coach carries everyone back.
      dur: 7,
      draw: function (t) {
        var d = 900 * eout(seg(t, 0, 7)), x = lerp(1240, 470, eout(seg(t, 0, 2.2)));
        var g = '<rect width="' + W + '" height="' + H + '" fill="url(#hiwDusk)"/>' + stars(t < 6.8 ? t : 6.8, 0.9) + moon(740, 96);
        for (var i = 0; i < 4; i++) g += hill(wrapX(i * 380 + d * 0.18, 1520) - 260, 260, 70 + (i % 2) * 34, i % 2 ? '#5d668f' : '#6c7399');
        for (var k = 0; k < 5; k++) g += tree(wrapX(k * 260 + 90 + d * 0.5, 1300) - 150, 0.85 + (k % 2) * 0.2, '#48527a', '#3c456b', '#343c5e');
        g += ground('#8d91a6', '#777c93');
        for (var j = 0; j < 7; j++) g += '<rect x="' + rnd(wrapX(j * 170 + d, 1190) - 140) + '" y="' + (BY + 44) + '" width="80" height="6" rx="3" fill="#c9ccd8"/>';
        var fx = x - 362 * S;
        g += '<path d="M ' + rnd(fx) + ' ' + (BY - 66) + ' L ' + rnd(fx - 250) + ' ' + (BY - 20) + ' L ' + rnd(fx - 250) + ' ' + (BY + 12) + ' L ' + rnd(fx) + ' ' + (BY - 50) + ' Z" fill="' + C.gold2 + '" opacity=".4"/>';
        g += coachSide({ x: x, y: BY, dir: -1, wheel: wheelDeg(d + (1240 - x)), flash: true });
        g += riders(x, BY, -1, seated(4));
        for (var z = 0; z < 3; z++) {
          var p = wrapX((t < 6.8 ? t : 6.8) * 0.45 + z / 3, 1);
          g += '<text x="' + rnd(x + 40 + z * 22 + p * 18) + '" y="' + rnd(BY - 176 - p * 54) + '" font-size="' + (20 + z * 5) + '" font-weight="700" font-style="italic" fill="#fff" opacity="' + rnd(Math.sin(p * Math.PI) * 0.85 * seg(t, 2, 2.6)) + '">z</text>';
        }
        return g;
      }
    },
    { // 7 Home: back where the trip began, everyone steps off and waves.
      dur: 6.2,
      draw: function (t) {
        var m = eout(seg(t, 0, 1.9)), x = lerp(-330, COACH_X, m), door = eio(seg(t, 2.0, 2.5));
        var g = '<rect width="' + W + '" height="' + H + '" fill="url(#hiwNight)"/>' + stars(t < 6 ? t : 6, 1) + moon(130, 92);
        g += hill(180, 280, 80, '#4d5780') + tree(600, 0.9, '#48527a', '#3c456b', '#343c5e') + tree(80, 0.8, '#48527a', '#3c456b', '#343c5e') + hall(true) + lamp(660) + ground('#8d91a6', '#777c93');
        g += coachSide({ x: x, y: BY, dir: 1, wheel: wheelDeg(x), door: door, flash: true });
        var out = [], walkers = '';
        for (var i = 0; i < 4; i++) {
          var t0 = 2.7 + i * 0.55, tx = SPOTS[3 - i], d = tx - DOOR_X, t1 = t0 + d / 135, u = seg(t, t0, t1), px = DOOR_X + d * u;
          out.push(t0);
          var o = seg(t, t0, t0 + 0.25), done = u >= 1;
          if (o > 0.01) walkers += rider(i, { x: px, y: BY - 12 * (1 - seg(px, DOOR_X, DOOR_X + 30)) + ((3 - i) % 2 ? 4 : 0) * u, dir: done ? -1 : 1, o: o, pose: done ? (t < 6 && i !== 2 ? 'wave' : 'stand') : 'walk', ph: done ? t * 8 + i : (px - DOOR_X) / 11 });
        }
        g += riders(x, BY, 1, seated(0, function (i) { return 1 - seg(t, out[i] - 0.3, out[i]); }));
        g += walkers;
        var c = seg(t, 5.2, 5.8);
        if (c > 0) g += checkMark(450, 150, 40, seg(t, 5.2, 5.4), back(c));
        return g;
      }
    }
  ];

  // ---------- Player ----------
  var steps = [];
  for (var n = 0; n < items.length && n < SCENES.length; n++) {
    var nm = items[n].querySelector('strong'), tx = items[n].querySelector('span');
    if (!nm || !tx) return;
    steps.push({ name: nm.textContent.trim(), text: tx.textContent.trim() });
  }
  var total = steps.length, cur = 0, raf = 0, t0 = 0, played = false, onScreen = false;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function still() { return !!(mq && mq.matches); }

  var elCount = root.querySelector('.hiw-count'), elName = root.querySelector('.hiw-name'), elText = root.querySelector('.hiw-text');
  var btnBack = root.querySelector('.hiw-back'), btnNext = root.querySelector('.hiw-next'), lnkQuote = root.querySelector('.hiw-quote');
  var dotsEl = root.querySelector('.hiw-dots'), stageEl = root.querySelector('.hiw-stage'), dots = [];
  if (!elCount || !elName || !elText || !btnBack || !btnNext || !lnkQuote || !dotsEl || !stageEl) return;
  var inited = false, swapAt = 0;

  for (var i = 0; i < total; i++) {
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.className = 'hiw-dot';
    b.innerHTML = '<span class="hiw-dot-mark" aria-hidden="true"></span><span class="hiw-dot-lbl" aria-hidden="true"></span>';
    b.lastChild.textContent = steps[i].name;
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ' of ' + total + ': ' + steps[i].name);
    b.addEventListener('click', (function (k) { return function () { go(k); }; })(i));
    li.appendChild(b); dotsEl.appendChild(li); dots.push(b);
  }

  function paint(t) {
    var sc = SCENES[cur];
    sceneEl.innerHTML = '<g opacity="' + rnd(still() ? 1 : seg(t, 0, 0.22)) + '">' + sc.draw(t) + '</g>';
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function frame(now) {
    var sc = SCENES[cur], t = (now - t0) / 1000;
    if (t >= sc.dur) { paint(sc.dur); raf = 0; return; }
    paint(t);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    stop();
    var sc = SCENES[cur];
    if (still()) { paint(sc.still === undefined ? sc.dur : sc.still); return; }
    if (!onScreen) { paint(0.22); played = false; return; }
    played = true;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function go(k) {
    k = clamp(k, 0, total - 1);
    if (k === cur && inited) return;
    inited = true;
    var hadNext = document.activeElement === btnNext, hadQuote = document.activeElement === lnkQuote;
    cur = k;
    var last = cur === total - 1;
    elCount.textContent = 'Step ' + (cur + 1) + ' of ' + total;
    elName.textContent = steps[cur].name;
    elText.textContent = steps[cur].text;
    for (var i = 0; i < total; i++) {
      dots[i].classList.toggle('is-on', i === cur);
      dots[i].classList.toggle('is-done', i < cur);
      if (i === cur) dots[i].setAttribute('aria-current', 'step'); else dots[i].removeAttribute('aria-current');
    }
    dotsEl.style.setProperty('--hiw-fill', (total > 1 ? cur / (total - 1) : 0).toFixed(4));
    // Back stays focusable on step 1 (aria-disabled, not disabled) so keyboard focus never jumps to Next.
    if (cur === 0) btnBack.setAttribute('aria-disabled', 'true'); else btnBack.removeAttribute('aria-disabled');
    btnNext.hidden = last;
    lnkQuote.hidden = !last;
    if (last && hadNext) { swapAt = Date.now(); lnkQuote.focus(); }
    if (!last && hadQuote) btnNext.focus();
    play();
  }

  btnBack.addEventListener('click', function () { if (cur > 0) go(cur - 1); });
  // The quote link takes Next's place on the last step; swallow a click that lands in the same breath as the swap.
  lnkQuote.addEventListener('click', function (e) { if (Date.now() - swapAt < 450) e.preventDefault(); });
  btnNext.addEventListener('click', function () { go(cur + 1); });

  // Arrow keys step through while focus is in the player, or while it is on screen and nothing else has focus.
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var a = document.activeElement, inside = a && root.contains(a);
    var idle = !a || a === document.body || a === document.documentElement;
    if (!inside && !(idle && onScreen)) return;
    var k = cur + (e.key === 'ArrowRight' ? 1 : -1);
    if (k < 0 || k > total - 1) return;
    e.preventDefault();
    go(k);
    if (inside && dots.indexOf(a) !== -1) dots[cur].focus();
  });

  if (mq) {
    var onMq = function () { play(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  root.querySelector('.hiw-list').hidden = true;
  var fb = root.querySelector('.hiw-fallback'); if (fb) fb.hidden = true;
  ui.hidden = false;
  go(0);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      onScreen = en[0].isIntersecting;
      if (onScreen && !played) play();
      else if (!onScreen && raf) { stop(); played = false; }
    }, { threshold: 0.35 }).observe(stageEl);
  } else {
    onScreen = true; play();
  }
})();
