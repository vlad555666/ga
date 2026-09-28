const c = document.querySelector("#gameCanvas"),
  x = c.getContext("2d"),
  P = [
    [-30, 160],
    [170, 160],
    [245, 225],
    [245, 405],
    [425, 405],
    [505, 330],
    [720, 330],
    [810, 420],
    [1090, 420],
  ],
  S = {
    pen: ["Ручка", 35, 118, 13, "#4d78ca"],
    pencil: ["Карандаш", 50, 175, 31, "#e4a633"],
    eraser: ["Ластик", 40, 105, 8, "#e67d88"],
  };
let gold = 80,
  life = 20,
  wave = 1,
  sel = "pen",
  run = 0,
  spawn = 0,
  es = [],
  ts = [],
  chosen,
  mouse = { x: -1, y: -1 };
const $ = (id) => document.querySelector(id),
  sync = () => {
    $("#money").textContent = gold;
    $("#lives").textContent = life;
    $("#wave").textContent = wave + " / 5";
    card();
  },
  stat = (t) => ({
    r: S[t.k][2] + (t.l - 1) * 12,
    d: S[t.k][3] + (t.l - 1) * 7,
  }),
  note = (s) => {
    $("#toast").textContent = s;
    $("#toast").classList.add("show");
    setTimeout(() => $("#toast").classList.remove("show"), 1400);
  };
function card() {
  let q = $("#upgradeCard");
  q.hidden = !chosen;
  if (!chosen) return;
  let z = chosen.l == 5;
  $("#upgradeTitle").textContent = S[chosen.k][0];
  $("#towerLevel").textContent = chosen.l + " / 5";
  $("#upgradeCost").textContent = z ? "МАКС." : 25 + chosen.l * 25 + " ✦";
  $("#upgradeBtn").disabled = z || gold < 25 + chosen.l * 25;
  $("#abilityBtn").disabled = !z || Date.now() < chosen.cd;
  $("#abilityBtn").textContent = !z
    ? "СПОСОБНОСТЬ ОТКРОЕТСЯ НА 5 УР."
    : Date.now() < chosen.cd
      ? "ПЕРЕЗАРЯДКА"
      : "АКТИВИРОВАТЬ: " +
        {
          pen: "КРАСНАЯ ПАСТА",
          pencil: "ТРОЙНОЙ ВЫСТРЕЛ",
          eraser: "СТАН ВСЕХ",
        }[chosen.k];
  $("#upgradeHint").textContent = z
    ? "Способность готова!"
    : "Урон и радиус растут на каждом уровне.";
}
$(".tower").onclick = () => {};
document.querySelectorAll(".tower").forEach(
  (b) =>
    (b.onclick = () => {
      sel = b.dataset.tower;
      document
        .querySelectorAll(".tower")
        .forEach((z) => z.classList.toggle("active", z == b));
    }),
);
$("#upgradeBtn").onclick = () => {
  let n = 25 + chosen.l * 25;
  if (gold >= n && chosen.l < 5) {
    gold -= n;
    chosen.l++;
    sync();
    note("Уровень повышен!");
  }
};
$("#abilityBtn").onclick = () => {
  let t = chosen;
  if (!t || Date.now() < t.cd) return;
  t.cd = Date.now() + { pen: 16000, pencil: 18000, eraser: 25000 }[t.k];
  if (t.k === "pen") {
    let e = es.find((e) => Math.hypot(e.x - t.x, e.y - t.y) < stat(t).r);
    if (e) e.mark = 10000;
    note("Красная метка на 10 сек.");
  }
  if (t.k === "pencil") {
    t.triple = 5000;
    note("Тройной выстрел на 5 сек.");
  }
  if (t.k === "eraser") {
    es.forEach((e) => (e.stun = 3000));
    note("Все учебники в стане 3 сек.");
  }
  card();
};
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
c.onmousemove = (e) => {
  let r = c.getBoundingClientRect();
  mouse = {
    x: ((e.clientX - r.left) * 1060) / r.width,
    y: ((e.clientY - r.top) * 600) / r.height,
  };
};
c.onclick = (e) => {
  let r = c.getBoundingClientRect(),
    p = {
      x: ((e.clientX - r.left) * 1060) / r.width,
      y: ((e.clientY - r.top) * 600) / r.height,
    },
    hit = ts.find((t) => dist(t, p) < 30);
  if (hit) {
    chosen = hit;
    sync();
    return;
  }
  if (gold < S[sel][1]) return note("Не хватает канцелярии");
  gold -= S[sel][1];
  ts.push({ x: p.x, y: p.y, k: sel, l: 1, cd: 0, triple: 0 });
  sync();
};
$("#startWave").onclick = () => {
  if (run) return;
  run = 1;
  spawn = 0;
  $("#startWave").style.display = "none";
};
function add() {
  let type =
      wave == 5 && spawn == 9
        ? "boss"
        : spawn % 5 == 3
          ? "tank"
          : spawn % 5 == 4
            ? "fast"
            : "normal",
    a = {
      normal: [1, 1, "#fd8e81"],
      tank: [3.3, 0.5, "#7768af"],
      fast: [0.48, 2, "#5bb9a6"],
      boss: [13, 0.6, "#d65c6b"],
    }[type],
    hp = (50 + wave * 12) * a[0];
  es.push({
    x: -20,
    y: 160,
    i: 0,
    p: 0,
    h: hp,
    m: hp,
    v: (45 + wave * 5) * a[1],
    type,
    col: a[2],
    mark: 0,
    stun: 0,
  });
}
let tick = 0;
function upd(d) {
  if (run && (tick -= d) < 0 && spawn < (wave == 5 ? 10 : 8)) {
    add();
    spawn++;
    tick = 650;
  }
  es.forEach((e) => {
    e.mark -= d;
    e.stun -= d;
    if (e.stun > 0) return;
    let z = (e.v * d) / 1000,
      a = P[e.i],
      b = P[e.i + 1],
      l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    e.p += z;
    if (e.p >= l) {
      e.p = 0;
      e.i++;
      if (e.i == P.length - 1) {
        e.dead = 1;
        life--;
      }
    }
    a = P[Math.min(e.i, P.length - 2)];
    b = P[Math.min(e.i + 1, P.length - 1)];
    l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    e.x = a[0] + ((b[0] - a[0]) * e.p) / l;
    e.y = a[1] + ((b[1] - a[1]) * e.p) / l;
  });
  ts.forEach((t) => {
    t.triple -= d;
    let e = es.find((e) => dist(t, e) < stat(t).r);
    if (e && (t.cool = (t.cool || 0) - d) < 0) {
      let hit = (q) => {
        q.h -= stat(t).d + (q.mark > 0 ? 12 : 0);
        if (q.h <= 0) {
          q.dead = 1;
          gold += q.type === "boss" ? 100 : 10;
        }
      };
      hit(e);
      if (t.triple > 0)
        es.filter((q) => q != e && dist(t, q) < stat(t).r)
          .slice(0, 2)
          .forEach(hit);
      t.cool = 420;
    }
  });
  es = es.filter((e) => !e.dead);
  if (run && spawn >= (wave == 5 ? 10 : 8) && !es.length) {
    run = 0;
    if (wave++ < 5) {
      gold += 35;
      $("#startWave").style.display = "block";
    } else note("Победа!");
  }
  sync();
}
function draw() {
  x.clearRect(0, 0, 1060, 600);
  x.beginPath();
  x.moveTo(...P[0]);
  P.slice(1).forEach((p) => x.lineTo(...p));
  x.lineWidth = 40;
  x.strokeStyle = "#fff2c7";
  x.stroke();
  let h = ts.find((t) => dist(t, mouse) < 30) || chosen;
  if (h) {
    x.beginPath();
    x.arc(h.x, h.y, stat(h).r, 0, 7);
    x.fillStyle = S[h.k][4] + "22";
    x.fill();
    x.strokeStyle = S[h.k][4];
    x.setLineDash([5, 5]);
    x.stroke();
    x.setLineDash([]);
  }
  ts.forEach((t) => {
    x.fillStyle = S[t.k][4];
    x.beginPath();
    x.arc(t.x, t.y, 18, 0, 7);
    x.fill();
    x.fillStyle = "#fff";
    x.font = "bold 11px Arial";
    x.fillText(t.l, t.x - 3, t.y + 4);
  });
  es.forEach((e) => {
    x.fillStyle = e.mark > 0 ? "#e43d49" : e.col;
    x.fillRect(
      e.x - 13,
      e.y - 18,
      e.type === "boss" ? 38 : 26,
      e.type === "boss" ? 50 : 36,
    );
    x.fillStyle = "#fff";
    x.fillRect(e.x - 16, e.y - 27, 35, 4);
    x.fillStyle = "#65bd99";
    x.fillRect(e.x - 16, e.y - 27, (35 * e.h) / e.m, 4);
    if (e.stun > 0) {
      x.fillStyle = "#315da5";
      x.fillText("✦", e.x, e.y - 35);
    }
  });
}
let last = 0;
function f(n) {
  let d = Math.min(40, n - last || 16);
  last = n;
  upd(d);
  draw();
  requestAnimationFrame(f);
}
sync();
requestAnimationFrame(f);
