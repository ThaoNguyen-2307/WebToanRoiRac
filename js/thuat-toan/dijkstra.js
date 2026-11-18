/* =========================================================
   dijkstra.js — ĐƯỜNG ĐI NGẮN NHẤT DIJKSTRA
   Ma trận trọng số: ô (u, v) > 0 là độ dài cạnh u -> v, 0 = không có cạnh.
   Ma trận đối xứng -> đồ thị vô hướng; không đối xứng -> có hướng.

   Mã giả (data.js, đánh số từ 0):
     0 d[s] = 0; d[v] = ∞ với v ≠ s
     1 while còn đỉnh chưa chốt:
     2   u = chưa chốt, d[u] nhỏ nhất
     3   if d[u] == ∞: dừng
     4   chốt u
     5   for v kề u, v chưa chốt:
     6     if d[u] + w(u,v) < d[v]:
     7       d[v] = d[u] + w(u,v)
     8       truoc[v] = u
     9 truy vết từ t về s qua truoc[]
   ========================================================= */

SOLVERS.dijkstra = function (input) {
  const mt = docMaTran(input.matrix);
  const n = mt.length;
  kiemTraDinh(input.start, n, "start", "Đỉnh đầu");
  kiemTraDinh(input.end, n, "end", "Đỉnh cuối");
  const s = input.start - 1, t = input.end - 1;
  const coHuong = !laDoiXung(mt);

  const steps = [];
  const d = Array(n).fill(Infinity);
  const truoc = Array(n).fill(-1);
  const chot = Array(n).fill(false);

  const fmt = x => soHoacVoCung(x);
  function ghi(line, msg, them = {}) {
    kiemTraSoBuoc(steps);
    steps.push({ line, msg, state: { n, mt, coHuong, s, t, d: d.slice(), truoc: truoc.slice(), chot: chot.slice(), ...them } });
  }

  d[s] = 0;
  ghi(0, `Khởi tạo: d[${s + 1}] = 0 (đỉnh đầu), các đỉnh khác d = ∞ (chưa biết đường đi).`);
  for (let lan = 0; lan < n; lan++) {
    const chuaChot = [];
    for (let v = 0; v < n; v++) if (!chot[v]) chuaChot.push(v);
    ghi(1, `Còn ${chuaChot.length} đỉnh chưa chốt: ${chuaChot.map(v => v + 1).join(", ")}.`);

    let u = -1;
    for (const v of chuaChot) if (u < 0 || d[v] < d[u]) u = v;
    ghi(2, `So sánh d của các đỉnh chưa chốt: ${chuaChot.map(v => `d[${v + 1}] = ${fmt(d[v])}`).join(", ")}. Nhỏ nhất là ${u + 1}.`, { u });
    if (d[u] === Infinity) {
      ghi(3, `d[${u + 1}] = ∞: các đỉnh còn lại không có đường đi từ ${s + 1}, dừng.`, { u });
      break;
    }
    chot[u] = true;
    ghi(4, `Chốt đỉnh ${u + 1}: d[${u + 1}] = ${d[u]} là độ dài đường ngắn nhất từ ${s + 1} đến ${u + 1}, sẽ không thay đổi nữa.`
      + (u === t ? ` (Đây chính là đỉnh cuối ${t + 1}.)` : ""), { u });

    for (const v of dinhKe(mt, u)) {
      if (chot[v]) continue;
      const w = mt[u][v];
      ghi(5, `Xét cạnh ${u + 1} → ${v + 1}, trọng số ${w}.`, { u, v });
      const moi = d[u] + w;
      if (moi < d[v]) {
        ghi(6, `d[${u + 1}] + w = ${d[u]} + ${w} = ${moi} < d[${v + 1}] = ${fmt(d[v])}: đi qua ${u + 1} ngắn hơn.`, { u, v });
        d[v] = moi;
        ghi(7, `Cập nhật d[${v + 1}] = ${moi}.`, { u, v, moi: v });
        truoc[v] = u;
        ghi(8, `Ghi nhớ truoc[${v + 1}] = ${u + 1} (đến ${v + 1} thì đi từ ${u + 1}).`, { u, v, moi: v });
      } else {
        ghi(6, `d[${u + 1}] + w = ${moi} ≥ d[${v + 1}] = ${d[v]}: không tốt hơn, giữ nguyên.`, { u, v });
      }
    }
  }

  // Truy vết đường đi từ t ngược về s
  if (d[t] === Infinity) {
    ghi(9, `Không có đường đi từ ${s + 1} đến ${t + 1}.`, { xong: true, duong: [] });
  } else {
    const duong = [];
    for (let v = t; v !== -1; v = truoc[v]) duong.unshift(v);
    ghi(9, `Truy vết từ ${t + 1}: ${[...duong].reverse().map(v => v + 1).join(" ← ")}. `
      + `Đường đi ngắn nhất ${s + 1} → ${t + 1}: ${duong.map(v => v + 1).join(" → ")}, độ dài ${d[t]}.`,
      { xong: true, duong });
  }
  return steps;
};

/* ---------- HÀM VẼ ---------- */
VE.dijkstra = function (step) {
  const s = step.state;
  const trenDuong = new Set();
  if (s.duong) for (let k = 1; k < s.duong.length; k++) trenDuong.add(s.duong[k - 1] + "-" + s.duong[k]);
  const doThi = veDoThi({
    n: s.n, mt: s.mt, coHuong: s.coHuong,
    lopDinh: i => i === s.u && !s.xong ? "hien-tai" : i === s.v ? "dang-xet"
      : s.duong && s.duong.includes(i) ? "tren-duong" : s.chot[i] ? "da-tham" : "",
    phuDinh: i => soHoacVoCung(s.d[i]),
    lopCanh: (a, b) => (a === s.u && b === s.v) ? "dang-xet"
      : trenDuong.has(a + "-" + b) ? "duong"
      : (!s.xong && s.truoc[b] === a) ? "cay" : ""
  });

  const bang = `
    <table class="bang-mt bang-d">
      <tr><th>Đỉnh</th>${s.d.map((_, i) => `<th class="${i === s.s ? "dau" : i === s.t ? "cuoi" : ""}">${i + 1}</th>`).join("")}</tr>
      <tr><th>d</th>${s.d.map((x, i) => `<td class="${i === s.moi ? "dang-xet" : s.chot[i] ? "chot" : ""}">${soHoacVoCung(x)}</td>`).join("")}</tr>
      <tr><th>trước</th>${s.truoc.map((x, i) => `<td class="${s.chot[i] ? "chot" : ""}">${x < 0 ? "–" : x + 1}</td>`).join("")}</tr>
      <tr><th>chốt</th>${s.chot.map(c => `<td class="${c ? "chot" : ""}">${c ? "✓" : ""}</td>`).join("")}</tr>
    </table>`;

  return `
    <div class="hanoi-info">
      <span class="pill">Từ đỉnh <b>${s.s + 1}</b> đến đỉnh <b>${s.t + 1}</b></span>
      ${s.xong && s.duong && s.duong.length ? `<span class="pill hl">Ngắn nhất: <b>${s.duong.map(v => v + 1).join(" → ")}</b> = ${s.d[s.t]}</span>` : ""}
    </div>
    <div class="dt-hang">${doThi}<div class="dt-ben">${bang}
      <p class="viz-note">Số nhỏ cạnh mỗi đỉnh là d: độ dài đường ngắn nhất tìm được đến lúc này.</p></div></div>
    <div class="chu-thich">
      <span><i class="cham hien-tai"></i>u: vừa chọn / chốt</span>
      <span><i class="cham dang-xet"></i>v: đang xét</span>
      <span><i class="cham xong"></i>đã chốt</span>
      <span><i class="vach"></i>cạnh theo truoc[]</span>
    </div>`;
};

/* ---------- LÝ THUYẾT ---------- */
ALGORITHMS.find(a => a.id === "dijkstra").lyThuyet = `
  <p><b>Bài toán:</b> cho đồ thị có trọng số <b>không âm</b> (ma trận trọng số, 0 = không có cạnh), tìm đường đi ngắn nhất
     từ đỉnh s đến các đỉnh còn lại (trong web: đến đỉnh t).</p>

  <h3>Ý tưởng</h3>
  <p>Mỗi đỉnh v có nhãn <b>d[v]</b>: độ dài đường đi ngắn nhất từ s đến v tìm được đến hiện tại (ban đầu d[s] = 0, còn lại ∞),
     và <b>truoc[v]</b>: đỉnh đứng ngay trước v trên đường đi đó. Lặp lại:</p>
  <ol>
    <li>Chọn đỉnh u <b>chưa chốt</b> có d[u] nhỏ nhất, rồi <b>chốt</b> u: d[u] chắc chắn là đường ngắn nhất.</li>
    <li>Với mỗi đỉnh v kề u chưa chốt, nếu đi qua u ngắn hơn (d[u] + w(u, v) &lt; d[v]) thì cập nhật d[v] và truoc[v] = u.
        Thao tác này gọi là <b>nới lỏng cạnh</b>.</li>
  </ol>
  <p>Khi đã chốt hết (hoặc các đỉnh còn lại đều có d = ∞), truy vết ngược từ t theo truoc[] để được đường đi.</p>

  <h3>Vì sao phải có trọng số không âm?</h3>
  <p>Đỉnh u được chốt vì d[u] nhỏ nhất trong các đỉnh chưa chốt. Mọi đường khác đến u đều phải đi qua một đỉnh chưa chốt
     có d ≥ d[u], rồi cộng thêm các cạnh không âm, nên không thể ngắn hơn. Nếu có cạnh âm, lập luận này sai.</p>

  <h3>Độ phức tạp</h3>
  <p>Mỗi lần lặp tìm đỉnh nhỏ nhất mất O(n) và có n lần lặp, nên với ma trận kề là <b>O(n²)</b>.
     Dùng hàng đợi ưu tiên (heap) với danh sách kề thì giảm còn O((V + E) log V).</p>`;
