const DE_QUY = "Đệ quy thường (vét cạn)";
const TOP_DOWN = "QHĐ top-down (có bảng nhớ)";
const BOTTOM_UP = "QHĐ bottom-up (vòng lặp)";

function fibSo(n) {
  let truoc = 1n, hienTai = 1n;
  for (let i = 3; i <= n; i++) [truoc, hienTai] = [hienTai, truoc + hienTai];
  return hienTai;
}

// Hàm giải
SOLVERS.fibonacci = function (input) {
  const n = input.n;
  const mode = input.mode;
  if (mode === BOTTOM_UP) return giaiBottomUp(n);

  // Báo trước nếu quá nhiều bước, khỏi chạy rồi mới biết
  if (mode === DE_QUY) {
    if (n > 40 || Number(fibSo(n)) * 4 > GIOI_HAN_BUOC)
      loiDuLieu("n", `Đệ quy thường với n = ${n} phải gọi hàm ${(2n * fibSo(n) - 1n).toLocaleString("vi-VN")} lần, trình duyệt sẽ bị treo. `
        + `Hãy nhập n ≤ 20, hoặc chọn cách QHĐ để thấy QHĐ nhanh hơn thế nào.`);
  } else if (n > 5000) {
    loiDuLieu("n", "Với n > 5000, đệ quy top-down lồng nhau quá sâu, trình duyệt không chạy được. Hãy dùng cách bottom-up (không đệ quy).");
  }
  return giaiDeQuy(n, mode === TOP_DOWN);
};

function giaiDeQuy(n, coNho) {
  const steps = [];
  const cay = [];
  const dem = {};                // dem[k] = số lần fib(k) được gọi
  const nho = {};                // bảng nhớ (chỉ dùng cho top-down)
  let soXong = 0;
  let soLanGoi = 0;
  const nganXep = [];

  function ghi(line, msg, nut, them = {}) {
    kiemTraSoBuoc(steps);
    steps.push({
      line, msg,
      state: {
        loai: "cay", n, coNho, cay, nut,
        soNut: cay.length, soXong, soLanGoi,
        dem: { ...dem },
        nho: coNho ? { ...nho } : null,
        nganXep: [...nganXep],
        ...them
      }
    });
  }

  function fib(k, cha) {
    const id = cay.length;
    cay.push({ id, cha, k, giaTri: null, xong: null, nho: false, sau: cha < 0 ? 0 : cay[cha].sau + 1 });
    dem[k] = (dem[k] || 0) + 1;
    soLanGoi++;
    nganXep.push(`fib(${k})`);
    ghi(0, `Gọi fib(${k}). Đây là lần gọi thứ ${soLanGoi}${dem[k] > 1 ? `, fib(${k}) đã bị gọi ${dem[k]} lần` : ""}.`, id);

    let kq;
    if (k <= 2) {
      kq = 1n;
      xong(id, kq);
      ghi(1, `n = ${k} ≤ 2: trả về 1 (điều kiện dừng).`, id);
    } else if (coNho && nho[k] != null) {
      kq = nho[k];
      cay[id].nho = true;
      xong(id, kq);
      ghi(2, `fib(${k}) đã có trong bảng nhớ = ${kq}. Lấy ra dùng luôn, KHÔNG gọi đệ quy nữa.`, id);
    } else {
      if (coNho) ghi(2, `fib(${k}) chưa có trong bảng nhớ, phải tính: gọi fib(${k - 1}) rồi fib(${k - 2}).`, id);
      else ghi(2, `Cần fib(${k - 1}) + fib(${k - 2}): gọi fib(${k - 1}) trước.`, id);
      const x = fib(k - 1, id);
      const y = fib(k - 2, id);
      kq = x + y;
      if (coNho) nho[k] = kq;
      xong(id, kq);
      ghi(coNho ? 3 : 2, `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${x} + ${y} = ${kq}`
        + (coNho ? `. Lưu vào bảng nhớ: nho[${k}] = ${kq}.` : "."), id);
      if (coNho) ghi(4, `Trả về nho[${k}] = ${kq}.`, id);
    }
    nganXep.pop();
    return kq;
  }
  function xong(id, giaTri) { cay[id].giaTri = giaTri; cay[id].xong = soXong++; }

  ghi(null, `Bắt đầu tính f(${n}) bằng ${coNho ? "quy hoạch động top-down: đệ quy nhưng có bảng nhớ" : "đệ quy thường (vét cạn)"}.`, -1);
  const kq = fib(n, -1);
  const ketLuan = coNho
    ? `Xong! f(${n}) = ${kq}. Chỉ cần ${soLanGoi} lần gọi hàm vì mỗi fib(k) chỉ phải TÍNH 1 lần, các lần sau lấy từ bảng nhớ.`
    : `Xong! f(${n}) = ${kq}. Cần tới ${soLanGoi} lần gọi hàm vì cùng một fib(k) bị tính đi tính lại nhiều lần`
      + (n > 3 ? ` (VD fib(2) bị gọi ${dem[2]} lần).` : ".")
      + (n > 3 ? ` Thử chọn "QHĐ top-down" để so sánh.` : "");
  ghi(null, ketLuan, -1, { ketQua: String(kq) });
  return steps;
}

// Bottom-up: điền bảng F[1..n] từ nhỏ đến lớn, không đệ quy
function giaiBottomUp(n) {
  if (n * 2 + 5 > GIOI_HAN_BUOC) kiemTraSoBuoc({ length: GIOI_HAN_BUOC });
  const steps = [];
  const F = [];                           // F[i] dạng chuỗi (BigInt -> chuỗi để chép nhanh)
  let truoc = 1n, hienTai = 1n;

  function ghi(line, msg, i, them = {}) {
    kiemTraSoBuoc(steps);
    steps.push({ line, msg, state: { loai: "bang", n, F: F.slice(), i, soPhepCong: Math.max(0, F.length - 3), ...them } });
  }

  ghi(0, `Bắt đầu tính f(${n}) bằng quy hoạch động bottom-up: tính từ bài toán con nhỏ nhất lên.`, null);
  F[1] = "1";
  if (n >= 2) F[2] = "1";
  ghi(1, n >= 2 ? `Điền 2 giá trị đầu: F[1] = 1, F[2] = 1.` : `F[1] = 1.`, n >= 2 ? 2 : 1);
  for (let i = 3; i <= n; i++) {
    ghi(2, `i = ${i}: tính F[${i}] từ 2 ô ngay trước nó.`, i);
    [truoc, hienTai] = [hienTai, truoc + hienTai];
    F[i] = String(hienTai);
    ghi(3, `F[${i}] = F[${i - 1}] + F[${i - 2}] = ${F[i - 1]} + ${F[i - 2]} = ${F[i]}`, i);
  }
  ghi(4, `Xong! f(${n}) = F[${n}] = ${F[n]}. Chỉ cần ${Math.max(0, n - 2)} phép cộng, không gọi đệ quy lần nào.`,
      n, { ketQua: F[n] });
  return steps;
}

// Hàm vẽ
const FIB_SO_NUT_TOI_DA = 70;

VE.fibonacci = function (step) {
  const s = step.state;
  return s.loai === "bang" ? veBangFib(s) : veCayFib(s);
};

function veCayFib(s) {
  const tongNut = s.cay.length;
  let cayHTML;
  if (tongNut > FIB_SO_NUT_TOI_DA) {
    cayHTML = `<p class="viz-note">Cây có ${tongNut} lời gọi, quá lớn để vẽ. Xem bảng đếm số lần gọi bên dưới.</p>`;
  } else {
    const { x: viTriX, soLa, doSau } = boTriCay(s.cay);
    const duongDi = new Set();
    for (let id = s.nut; id >= 0; id = s.cay[id].cha) duongDi.add(id);

    const kc = 40, ht = 58, r = 15;
    const W = Math.max(soLa * kc, 220), H = (doSau + 1) * ht + 6;
    const px = id => viTriX[id] * kc + kc / 2 + (W - soLa * kc) / 2;
    const py = id => s.cay[id].sau * ht + r + 4;
    let canh = "", nut = "";
    for (let id = 1; id < tongNut; id++) {
      const daGoi = id < s.soNut;
      canh += `<line x1="${px(s.cay[id].cha)}" y1="${py(s.cay[id].cha)}" x2="${px(id)}" y2="${py(id)}"
                 class="cay-canh ${!daGoi ? "chua" : duongDi.has(id) ? "tren" : "da"}"/>`;
    }
    for (let id = 0; id < tongNut; id++) {
      const nd = s.cay[id];
      const daGoi = id < s.soNut;
      const daXong = nd.xong != null && nd.xong < s.soXong;
      const lop = !daGoi ? "chua"
        : id === s.nut ? "hien-tai"
        : daXong && nd.nho ? "nho"
        : daXong ? "xong"
        : duongDi.has(id) ? "tren" : "da";
      const lap = !s.coNho && daGoi && s.cay.some(o => o.id < id && o.k === nd.k && o.k > 2) ? " lap" : "";
      nut += `<g class="cay-nut ${lop}${lap}"><circle cx="${px(id)}" cy="${py(id)}" r="${r}"/>
              <text x="${px(id)}" y="${py(id) + 4}">${nd.k}</text>
              ${daXong ? `<text class="gia-tri" x="${px(id)}" y="${py(id) + r + 12}">=${nd.giaTri}</text>` : ""}</g>`;
    }
    cayHTML = `<svg class="cay-svg fib-svg" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="Cây lời gọi fib">${canh}${nut}</svg>
      <div class="chu-thich">
        <span><i class="cham hien-tai"></i>đang xét</span>
        <span><i class="cham tren"></i>đang chờ kết quả</span>
        <span><i class="cham xong"></i>đã tính xong</span>
        ${s.coNho ? `<span><i class="cham nho"></i>lấy từ bảng nhớ</span>` : `<span><i class="cham lap"></i>bị tính lại</span>`}
      </div>`;
  }

  const dsK = [];
  for (let k = s.n; k >= 1; k--) dsK.push(k);
  const maxDem = Math.max(1, ...dsK.map(k => s.dem[k] || 0));
  const bangDem = dsK.length <= 30 ? `
    <div class="dem-goi">
      <span class="dem-tieu-de">Số lần gọi từng fib(k)</span>
      ${dsK.map(k => {
        const d = s.dem[k] || 0;
        return `<div class="dem-hang"><code>fib(${k})</code>
          <span class="dem-thanh"><i style="width:${(d / maxDem) * 100}%" class="${d > 1 ? "nhieu" : ""}"></i></span>
          <b>${d}</b></div>`;
      }).join("")}
    </div>` : "";

  // Bảng nhớ (top-down)
  const bangNho = s.nho ? `
    <div class="bang-nho">
      <span class="dem-tieu-de">Bảng nhớ nho[k]</span>
      <div class="slots">${Object.keys(s.nho).length
        ? Object.keys(s.nho).sort((a, b) => a - b).slice(-14).map(k => `<div class="slot"><small>nho[${k}]</small><b>${s.nho[k]}</b></div>`).join("")
        : `<span class="viz-note">(trống)</span>`}</div>
    </div>` : "";

  return `
    <div class="hanoi-info">
      <span class="pill">Số lần gọi hàm: <b>${s.soLanGoi}</b></span>
      ${s.ketQua ? `<span class="pill hl">f(${s.n}) = <b>${s.ketQua}</b></span>` : ""}
    </div>
    ${cayHTML}
    <div class="fib-duoi">${bangDem}${bangNho}</div>
    <div class="hanoi-stack"><span>Ngăn xếp lời gọi đệ quy</span>
      <ol>${s.nganXep.length ? [...s.nganXep].reverse().slice(0, 12).map((g, i) => `<li class="${i === 0 ? "top" : ""}">${g}</li>`).join("")
        + (s.nganXep.length > 12 ? `<li class="empty">… còn ${s.nganXep.length - 12} lời gọi</li>` : "")
        : `<li class="empty">(trống)</li>`}</ol></div>`;
}

function veBangFib(s) {
  // n lớn thì chỉ vẽ khoảng 16 ô quanh ô đang tính
  const tu = s.n <= 16 ? 1 : Math.max(1, Math.min((s.i || 1) - 10, s.n - 15));
  const den = Math.min(s.n, tu + 15);
  let o = "";
  for (let i = tu; i <= den; i++) {
    const lop = i === s.i ? "dang-xet" : (s.i && (i === s.i - 1 || i === s.i - 2) && s.i >= 3) ? "nguon" : "";
    const v = s.F[i] ?? "";
    o += `<div class="slot ${lop}"><small>F[${i}]</small><b class="${v.length > 6 ? "dai" : ""}" title="${v}">${v.length > 12 ? v.slice(0, 10) + "…" : v}</b></div>`;
  }
  return `
    <div class="hanoi-info">
      <span class="pill">Số phép cộng: <b>${s.soPhepCong}</b></span>
      <span class="pill">Số lần gọi đệ quy: <b>0</b></span>
      ${s.ketQua ? `<span class="pill hl">f(${s.n}) = <b>${s.ketQua.length > 30 ? s.ketQua.slice(0, 28) + "…" : s.ketQua}</b></span>` : ""}
    </div>
    ${tu > 1 ? `<p class="viz-note">… (ẩn F[1] đến F[${tu - 1}])</p>` : ""}
    <div class="slots fib-bang">${o}</div>
    ${den < s.n ? `<p class="viz-note">… còn đến F[${s.n}]</p>` : ""}
    <p class="viz-note">Ô vàng: ô đang tính. Ô xanh: 2 ô được cộng lại. Mỗi ô chỉ tính đúng 1 lần.</p>`;
}

// Lý thuyết
ALGORITHMS.find(a => a.id === "fibonacci").lyThuyet = `
  <p><b>Dãy Fibonacci:</b> 1, 1, 2, 3, 5, 8, 13, ... Mỗi số bằng tổng hai số đứng trước:
     f(1) = f(2) = 1 và f(n) = f(n − 1) + f(n − 2). Ví dụ f(6) = f(5) + f(4) = 5 + 3 = 8.</p>

  <h3>Cách 1: Đệ quy thường (vét cạn), O(2ⁿ)</h3>
  <p>Viết thẳng theo công thức. Nhược điểm: cùng một giá trị bị tính lại rất nhiều lần.
     Với n = 6: fib(4) bị gọi 2 lần, fib(3) 3 lần, fib(2) 5 lần, fib(1) 3 lần, tổng cộng 15 lần gọi.
     Số lần gọi tăng gần gấp đôi mỗi khi n tăng 1.</p>

  <h3>Cách 2: Quy hoạch động top-down (đệ quy có bảng nhớ), O(n)</h3>
  <p>Vẫn đệ quy, nhưng mỗi khi tính xong fib(k) thì <b>lưu vào bảng nhớ</b>. Lần sau cần fib(k) thì lấy ra dùng
     luôn, không gọi đệ quy nữa. Mỗi giá trị chỉ phải tính 1 lần.</p>

  <h3>Cách 3: Quy hoạch động bottom-up (vòng lặp), O(n)</h3>
  <p>Đi theo chiều ngược lại: tính từ bài toán con nhỏ nhất F[1], F[2] rồi lần lượt F[3], F[4], ..., F[n].
     Không dùng đệ quy nên không tốn ngăn xếp lời gọi, chạy nhanh hơn top-down.
     Nếu chỉ lưu 2 số cuối thay vì cả bảng thì bộ nhớ chỉ còn O(1).</p>

  <h3>Hai dấu hiệu dùng được quy hoạch động</h3>
  <ul>
    <li><b>Bài toán con gối nhau:</b> cùng một bài toán con (fib(3)) xuất hiện nhiều lần.</li>
    <li><b>Cấu trúc con tối ưu:</b> lời giải bài lớn ghép được từ lời giải các bài con (f(n) từ f(n − 1) và f(n − 2)).</li>
  </ul>

  <table class="table">
    <thead><tr><th>n</th><th>Đệ quy thường (số lần gọi)</th><th>Top-down (số lần gọi)</th><th>Bottom-up (số phép cộng)</th></tr></thead>
    <tbody>
      <tr><td>6</td><td>15</td><td>9</td><td>4</td></tr>
      <tr><td>10</td><td>109</td><td>17</td><td>8</td></tr>
      <tr><td>20</td><td>13 529</td><td>37</td><td>18</td></tr>
      <tr><td>40</td><td>204 668 309</td><td>77</td><td>38</td></tr>
    </tbody>
  </table>`;
