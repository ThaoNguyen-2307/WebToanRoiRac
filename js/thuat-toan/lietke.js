/* =========================================================
   lietke.js — LIỆT KÊ BẰNG THUẬT TOÁN QUAY LUI
   3 bài toán dùng chung 1 khuôn quay lui, chỉ khác "tập đề cử" và "điều kiện chấp nhận":
     - Dãy nhị phân n bit : x[i] ∈ {0, 1}, luôn chấp nhận
     - Hoán vị n phần tử  : x[i] ∈ {1..n}, chấp nhận nếu j chưa dùng
     - Tổ hợp chập m của n: x[i] ∈ {x[i-1]+1 .. n-m+i}, luôn chấp nhận (dãy tăng dần)

   Mã giả (trong data.js), đánh số dòng từ 0:
     0  Try(i):
     1    for j in tập đề cử của x[i]:
     2      if j được chấp nhận:
     3        x[i] = j
     4        if i == n: in cấu hình x
     5        else: Try(i + 1)
     6        bỏ ghi nhận j  // quay lui
   ========================================================= */

SOLVERS.lietke = function (input) {
  const loai = input.type || "Dãy nhị phân n bit";
  const laNhiPhan = loai.startsWith("Dãy nhị phân");
  const laHoanVi = loai.startsWith("Hoán vị");
  const laToHop = loai.startsWith("Tổ hợp");
  const chiKetQua = input.cheDo === "Chỉ các cấu hình tìm được";

  // n, m đã được kiểm tra là số nguyên dương trước khi gọi hàm này
  const n = input.n;
  if (laToHop && input.m > n) loiDuLieu("m", `Tổ hợp chập m của n cần m ≤ n (bạn nhập m = ${input.m}, n = ${n}).`);
  const m = laToHop ? input.m : n;   // độ dài cấu hình

  // Ước lượng số cấu hình trước khi chạy: quá lớn thì báo ngay, khỏi làm treo máy
  let uocLuong = 1;
  for (let k = 1; k <= m && uocLuong <= GIOI_HAN_BUOC; k++)
    uocLuong = laNhiPhan ? uocLuong * 2 : laHoanVi ? uocLuong * k : uocLuong * (n - m + k) / k;
  if (uocLuong > GIOI_HAN_BUOC) kiemTraSoBuoc({ length: GIOI_HAN_BUOC });

  const x = new Array(m + 1).fill(null);   // x[1..m], bỏ x[0]
  const daDung = new Array(n + 1).fill(false);
  const ketQua = [];                       // các cấu hình đã in (dùng chung cho mọi bước)
  const cay = [{ id: 0, cha: -1, nhan: "", sau: 0 }];   // cây tìm kiếm, nút 0 là gốc
  const steps = [];

  // Tập đề cử của vị trí i
  function deCu(i) {
    if (laNhiPhan) return [0, 1];
    if (laHoanVi) return Array.from({ length: n }, (_, k) => k + 1);
    const tu = i === 1 ? 1 : x[i - 1] + 1;                        // tổ hợp: tăng dần
    return Array.from({ length: n - m + i - tu + 1 }, (_, k) => tu + k);
  }
  const chapNhan = j => !laHoanVi || !daDung[j];

  function ghiBuoc(line, msg, them = {}, batBuoc = false) {
    if (chiKetQua && !batBuoc) return;
    kiemTraSoBuoc(steps);
    steps.push({
      line, msg,
      state: { loai, n, m, x: x.slice(1), soNut: cay.length, cay, ketQua, soKQ: ketQua.length, ...them }
    });
  }

  function Try(i, nutCha) {
    ghiBuoc(0, `Gọi Try(${i}): chọn giá trị cho x[${i}].`, { viTri: i, nut: nutCha });
    for (const j of deCu(i)) {
      ghiBuoc(1, `Thử j = ${j} cho x[${i}].`, { viTri: i, nut: nutCha, thu: j });
      if (!chapNhan(j)) {
        ghiBuoc(2, `j = ${j} đã được dùng ở vị trí trước, bỏ qua.`, { viTri: i, nut: nutCha, thu: j, tuChoi: true });
        continue;
      }
      ghiBuoc(2, `j = ${j} được chấp nhận.`, { viTri: i, nut: nutCha, thu: j });
      x[i] = j;
      if (laHoanVi) daDung[j] = true;
      const nut = cay.length;
      cay.push({ id: nut, cha: nutCha, nhan: String(j), sau: i });
      ghiBuoc(3, `Gán x[${i}] = ${j}.`, { viTri: i, nut });

      if (i === m) {
        ketQua.push(x.slice(1).join(laNhiPhan ? "" : " "));
        ghiBuoc(4, `i = ${m}: đủ ${m} phần tử, in cấu hình thứ ${ketQua.length}: (${x.slice(1).join(", ")}).`,
                { viTri: i, nut, vuaIn: true }, true);
      } else {
        ghiBuoc(5, `i = ${i} < ${m}: chưa đủ, gọi Try(${i + 1}).`, { viTri: i, nut });
        Try(i + 1, nut);
      }

      if (laHoanVi) daDung[j] = false;
      x[i] = null;
      ghiBuoc(6, `Quay lui: bỏ x[${i}] = ${j}, thử giá trị tiếp theo.`, { viTri: i, nut: nutCha });
    }
  }

  const tenBai = laNhiPhan ? `dãy nhị phân ${n} bit` : laHoanVi ? `hoán vị của ${n} phần tử` : `tổ hợp chập ${m} của ${n}`;
  ghiBuoc(null, `Bắt đầu liệt kê các ${tenBai}.`, { nut: 0 }, true);
  Try(1, 0);
  ghiBuoc(null, `Hoàn thành! Có tất cả ${ketQua.length} ${tenBai}.`, { nut: 0, xong: true }, true);
  return steps;
};

/* ---------- HÀM VẼ: cây tìm kiếm + các ô x[i] + danh sách kết quả ---------- */
const SO_LA_TOI_DA = 32;   // cây có quá nhiều lá thì không vẽ (sẽ rối)

// Tính vị trí các nút của cây (chỉ tính 1 lần, lưu lại)
function boTriCay(cay) {
  if (cay.boTri && cay.boTri.soNut === cay.length) return cay.boTri;
  const con = cay.map(() => []);
  cay.forEach(nut => { if (nut.cha >= 0) con[nut.cha].push(nut.id); });
  const x = [], doSau = Math.max(...cay.map(n => n.sau));
  let la = 0;
  (function dat(id) {                       // lá xếp lần lượt từ trái sang, nút cha nằm giữa các con
    if (!con[id].length) { x[id] = la++; return; }
    con[id].forEach(dat);
    x[id] = (x[con[id][0]] + x[con[id][con[id].length - 1]]) / 2;
  })(0);
  cay.boTri = { x, soLa: la, doSau, soNut: cay.length };
  return cay.boTri;
}

VE.lietke = function (step) {
  const s = step.state;
  const { x: viTriX, soLa, doSau } = boTriCay(s.cay);

  // Các nút trên đường từ gốc đến nút hiện tại
  const duongDi = new Set();
  for (let id = s.nut ?? 0; id >= 0; id = s.cay[id].cha) duongDi.add(id);

  let cayHTML;
  if (soLa > SO_LA_TOI_DA) {
    cayHTML = `<p class="viz-note">Cây tìm kiếm có ${soLa} lá, quá lớn để vẽ. Xem các ô x[i] và danh sách kết quả bên dưới.</p>`;
  } else {
    const kc = 34, ht = 54, r = 13;                             // khoảng cách lá, khoảng cách tầng, bán kính nút
    const W = Math.max(soLa * kc, 200), H = (doSau + 1) * ht;
    const px = id => viTriX[id] * kc + kc / 2 + (W - soLa * kc) / 2;
    const py = id => s.cay[id].sau * ht + r + 6;
    let canh = "", nut = "";
    for (let id = 1; id < s.cay.length; id++) {
      const daTham = id < s.soNut, tren = duongDi.has(id);
      canh += `<line x1="${px(s.cay[id].cha)}" y1="${py(s.cay[id].cha)}" x2="${px(id)}" y2="${py(id)}"
                 class="cay-canh ${daTham ? (tren ? "tren" : "da") : "chua"}"/>`;
    }
    for (let id = 0; id < s.cay.length; id++) {
      const daTham = id < s.soNut, tren = duongDi.has(id);
      const laKetQua = s.cay[id].sau === s.m && daTham;
      const lop = !daTham ? "chua" : id === s.nut ? "hien-tai" : tren ? "tren" : laKetQua ? "kq" : "da";
      nut += `<g class="cay-nut ${lop}"><circle cx="${px(id)}" cy="${py(id)}" r="${r}"/>
              <text x="${px(id)}" y="${py(id) + 4}">${id === 0 ? "•" : s.cay[id].nhan}</text></g>`;
    }
    cayHTML = `<svg class="cay-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cây tìm kiếm quay lui">${canh}${nut}</svg>`;
  }

  // Các ô x[1..m]
  const o = s.x.map((v, k) => {
    const i = k + 1, dangXet = i === s.viTri;
    const hienThi = dangXet && s.thu != null && v == null ? s.thu : v ?? "";
    return `<div class="slot ${dangXet ? "dang-xet" : ""} ${dangXet && s.tuChoi ? "tu-choi" : ""}">
              <small>x[${i}]</small><b>${hienThi}</b></div>`;
  }).join("");

  // Danh sách kết quả (tối đa 60 cái gần nhất)
  const kq = s.ketQua.slice(0, s.soKQ);
  const kqHTML = kq.length
    ? kq.slice(-60).map((c, k, arr) => `<span class="kq-chip ${k === arr.length - 1 && s.vuaIn ? "moi" : ""}">${c}</span>`).join("")
    : `<span class="viz-note">Chưa có cấu hình nào.</span>`;

  return `
    <div class="hanoi-info"><span class="pill">Đã tìm được: <b>${s.soKQ}</b> cấu hình</span></div>
    ${cayHTML}
    <div class="slots">${o}</div>
    <div class="kq-list">${kq.length > 60 ? `<span class="viz-note">… và ${kq.length - 60} cấu hình trước đó</span>` : ""}${kqHTML}</div>`;
};

/* ---------- LÝ THUYẾT ---------- */
ALGORITHMS.find(a => a.id === "lietke").lyThuyet = `
  <p><b>Thuật toán quay lui</b> xây dựng từng cấu hình (x₁, x₂, ..., xₙ) theo từng thành phần.
     Với mỗi vị trí i, lần lượt thử mọi giá trị j trong <b>tập đề cử</b>:</p>
  <ul>
    <li>Nếu j được chấp nhận: gán x[i] = j. Nếu đã đủ n thành phần thì in cấu hình, nếu chưa thì đi tiếp đến vị trí i + 1.</li>
    <li>Sau khi thử xong nhánh đó, <b>bỏ ghi nhận j (quay lui)</b> để thử giá trị tiếp theo.</li>
  </ul>
  <p>Quá trình này tạo thành một <b>cây tìm kiếm</b>: gốc là cấu hình rỗng, mỗi tầng là một vị trí, mỗi lá là một cấu hình hoàn chỉnh.</p>
  <table class="table">
    <thead><tr><th>Bài toán</th><th>Tập đề cử của x[i]</th><th>Điều kiện chấp nhận</th><th>Số cấu hình</th></tr></thead>
    <tbody>
      <tr><td>Dãy nhị phân n bit</td><td>{0, 1}</td><td>Luôn chấp nhận</td><td>2ⁿ</td></tr>
      <tr><td>Hoán vị n phần tử</td><td>{1, 2, ..., n}</td><td>j chưa xuất hiện ở các vị trí trước</td><td>n!</td></tr>
      <tr><td>Tổ hợp chập m của n</td><td>{x[i−1]+1, ..., n−m+i}</td><td>Luôn chấp nhận (dãy tăng dần)</td><td>C(n, m)</td></tr>
    </tbody>
  </table>`;
