SOLVERS.nhau = function (input) {
  const n = input.n;                  // đã kiểm tra là số nguyên dương trước khi gọi hàm
  if (n * n > GIOI_HAN_BUOC) kiemTraSoBuoc({ length: GIOI_HAN_BUOC });   // bàn cờ quá lớn
  const tatCa = input.timKiem === "Tất cả lời giải";
  const rutGon = input.cheDo === "Chỉ các lần đặt / gỡ hậu";

  const hau = new Array(n + 1).fill(0);            // hau[1..n]
  const cot = new Array(n + 1).fill(false);         // cột j đã có hậu chưa
  const cheoHieu = {}, cheoTong = {};               // đường chéo i−j và i+j đã có hậu chưa
  const loiGiai = [];                                // các lời giải tìm được
  const steps = [];
  let dung = false;                                  // đã tìm đủ (chế độ "lời giải đầu tiên")

  function ghiBuoc(line, msg, them = {}, quanTrong = false) {
    if (rutGon && !quanTrong) return;
    kiemTraSoBuoc(steps);
    steps.push({ line, msg, state: { n, hau: hau.slice(1), loiGiai, soLG: loiGiai.length, ...them } });
  }

  function hauChan(i, j) {
    for (let r = 1; r < i; r++) {
      const c = hau[r];
      if (c && (c === j || r - c === i - j || r + c === i + j)) {
        const lyDo = c === j ? "cùng cột" : "cùng đường chéo";
        return { r, c, lyDo };
      }
    }
    return null;
  }

  function Try(i) {
    ghiBuoc(0, `Gọi Try(${i}): tìm chỗ đặt quân hậu ở hàng ${i}.`, { hang: i });
    for (let j = 1; j <= n && !dung; j++) {
      ghiBuoc(1, `Thử ô (hàng ${i}, cột ${j}).`, { hang: i, thu: { r: i, c: j } });
      if (cot[j] || cheoHieu[i - j] || cheoTong[i + j]) {
        const chan = hauChan(i, j);
        ghiBuoc(2, `Không đặt được: ô (${i}, ${j}) bị quân hậu ở (${chan.r}, ${chan.c}) ăn (${chan.lyDo}).`,
                { hang: i, thu: { r: i, c: j, ok: false }, chan });
        continue;
      }
      ghiBuoc(2, `Ô (${i}, ${j}) an toàn: cột ${j} và 2 đường chéo đều trống.`, { hang: i, thu: { r: i, c: j, ok: true } });

      hau[i] = j; cot[j] = true; cheoHieu[i - j] = true; cheoTong[i + j] = true;
      ghiBuoc(3, `Đặt quân hậu tại (${i}, ${j}).`, { hang: i, vuaDat: { r: i, c: j } }, true);

      if (i === n) {
        loiGiai.push(hau.slice(1).join(" "));
        ghiBuoc(4, `Đã đặt đủ ${n} quân hậu: tìm được lời giải thứ ${loiGiai.length} (${hau.slice(1).join(", ")}).`,
                { hang: i, vuaTim: true }, true);
        if (!tatCa) { dung = true; return; }
      } else {
        ghiBuoc(5, `Hàng ${i} xong, gọi Try(${i + 1}) cho hàng tiếp theo.`, { hang: i });
        Try(i + 1);
        if (dung) return;
      }

      hau[i] = 0; cot[j] = false; cheoHieu[i - j] = false; cheoTong[i + j] = false;
      ghiBuoc(6, `Quay lui: gỡ quân hậu ở (${i}, ${j}), thử cột tiếp theo của hàng ${i}.`, { hang: i, vuaGo: { r: i, c: j } }, true);
    }
  }

  ghiBuoc(null, `Bắt đầu: bàn cờ ${n}×${n} trống. Mỗi hàng sẽ đặt đúng 1 quân hậu.`, {}, true);
  Try(1);
  ghiBuoc(null, tatCa
    ? `Hoàn thành! Bàn cờ ${n}×${n} có tất cả ${loiGiai.length} lời giải.`
    : loiGiai.length ? `Hoàn thành! Đã tìm được lời giải đầu tiên: (${loiGiai[0].split(" ").join(", ")}).`
                     : `Hoàn thành! Bàn cờ ${n}×${n} không có lời giải nào.`, { xong: true }, true);
  return steps;
};

// HÀM VẼ: bàn cờ
function hinhHau(x, y, o, mau) {
  const k = o / 50;
  const p = [[-13, 10], [-16, -8], [-6, 0], [0, -14], [6, 0], [16, -8], [13, 10]]
    .map(([a, b]) => `${x + a * k},${y + b * k}`).join(" ");
  return `<polygon points="${p}" fill="${mau}"/><rect x="${x - 13 * k}" y="${y + 11 * k}" width="${26 * k}" height="${5 * k}" rx="${2 * k}" fill="${mau}"/>`;
}

VE.nhau = function (step) {
  const s = step.state, n = s.n, o = 50, W = n * o;

  // Ô bị các quân hậu đã đặt khống chế
  const biAn = (i, j) => s.hau.some((c, k) => {
    const r = k + 1;
    return c && r !== i && (c === j || r - c === i - j || r + c === i + j);
  });

  let svg = "";
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      const x = (j - 1) * o, y = (i - 1) * o;
      svg += `<rect x="${x}" y="${y}" width="${o}" height="${o}" fill="${(i + j) % 2 ? "#cfd8cc" : "#f4f6f1"}"/>`;
      if (!s.hau[i - 1] && biAn(i, j)) svg += `<rect x="${x}" y="${y}" width="${o}" height="${o}" fill="#d9694f" opacity=".18"/>`;
    }
  }
  // Ô đang thử
  if (s.thu) {
    const x = (s.thu.c - 1) * o, y = (s.thu.r - 1) * o;
    const mau = s.thu.ok === false ? "#c92a2a" : s.thu.ok ? "#2b8a3e" : "#e8a33d";
    svg += `<rect x="${x + 2}" y="${y + 2}" width="${o - 4}" height="${o - 4}" fill="none" stroke="${mau}" stroke-width="4" rx="4"/>`;
    if (s.thu.ok == null || s.thu.ok) svg += hinhHau(x + o / 2, y + o / 2, o, "rgba(52,64,58,.35)");
  }
  // Đường nối tới quân hậu đang chặn
  if (s.chan && s.thu) {
    svg += `<line x1="${(s.thu.c - .5) * o}" y1="${(s.thu.r - .5) * o}" x2="${(s.chan.c - .5) * o}" y2="${(s.chan.r - .5) * o}"
              stroke="#c92a2a" stroke-width="3" stroke-dasharray="6 5"/>`;
  }
  // Các quân hậu đã đặt
  s.hau.forEach((c, k) => {
    if (!c) return;
    const r = k + 1, moi = s.vuaDat && s.vuaDat.r === r;
    svg += hinhHau((c - .5) * o, (r - .5) * o, o, s.vuaTim ? "#2b8a3e" : moi ? "#b8860b" : "#1f2a14");
  });
  // Quân hậu vừa gỡ: hiện mờ
  if (s.vuaGo) svg += hinhHau((s.vuaGo.c - .5) * o, (s.vuaGo.r - .5) * o, o, "rgba(201,42,42,.35)");
  // Số hàng, số cột
  let nhan = "";
  for (let k = 1; k <= n; k++) {
    nhan += `<text x="${(k - .5) * o}" y="-8" text-anchor="middle" class="ban-co-nhan">${k}</text>`;
    nhan += `<text x="-12" y="${(k - .5) * o + 5}" text-anchor="middle" class="ban-co-nhan">${k}</text>`;
  }

  const ds = s.loiGiai.slice(0, s.soLG);
  return `
    <div class="hanoi-info">
      <span class="pill">Lời giải đã tìm: <b>${s.soLG}</b></span>
      ${s.thu ? `<span class="pill ${s.thu.ok === false ? "loi" : "hl"}">Đang thử ô (${s.thu.r}, ${s.thu.c})</span>` : ""}
    </div>
    <svg class="ban-co" viewBox="-26 -26 ${W + 32} ${W + 32}" role="img" aria-label="Bàn cờ ${n} x ${n}">
      ${svg}<rect x="0" y="0" width="${W}" height="${W}" fill="none" stroke="#34403a" stroke-width="2"/>${nhan}
    </svg>
    <div class="kq-list">${ds.length
      ? ds.slice(-40).map((g, k, arr) => `<span class="kq-chip ${k === arr.length - 1 && s.vuaTim ? "moi" : ""}">(${g})</span>`).join("")
      : `<span class="viz-note">Chưa có lời giải. Ô tô đỏ nhạt là ô đang bị các quân hậu khống chế.</span>`}</div>`;
};

// Lý thuyết
ALGORITHMS.find(a => a.id === "nhau").lyThuyet = `
  <p><b>Bài toán:</b> đặt n quân hậu lên bàn cờ n×n sao cho không có 2 quân nào ăn được nhau,
     tức là không có 2 quân cùng hàng, cùng cột hay cùng đường chéo.</p>
  <p><b>Biểu diễn lời giải:</b> vì mỗi hàng có đúng 1 quân hậu, lời giải là dãy (x₁, ..., xₙ)
     với xᵢ là cột của quân hậu ở hàng i. Tập đề cử của xᵢ là {1, ..., n}.</p>
  <p><b>Điều kiện chấp nhận ô (i, j):</b> cột j chưa có hậu, đường chéo có cùng <code>i − j</code>
     và đường chéo có cùng <code>i + j</code> đều chưa có hậu. Dùng 3 mảng đánh dấu nên kiểm tra chỉ mất O(1).</p>
  <p><b>Quay lui:</b> nếu ở hàng i không còn cột nào đặt được, thuật toán quay về hàng i − 1,
     gỡ quân hậu ở đó và thử cột tiếp theo.</p>
  <p><b>Số lời giải:</b> n = 4 có 2, n = 5 có 10, n = 6 có 4, n = 7 có 40, n = 8 có 92 lời giải.</p>`;
