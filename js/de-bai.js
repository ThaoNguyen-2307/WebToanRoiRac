/* =========================================================
   de-bai.js — ĐỀ BÀI TỰ SINH TỪ DỮ LIỆU ĐANG NHẬP
   Người dùng chỉ nhập dữ liệu ở cột trái. Khu vực mô phỏng sẽ "đọc lại" dữ liệu đó
   thành đề bài cụ thể bằng tiếng Việt, đổi ngay khi sửa ô nhập hoặc chọn ví dụ.
   Khi đang mô phỏng, đề bài thu gọn thành 1 dòng phía trên hình vẽ.

   DE_BAI[id](input) trả về:
     { tom:   câu đề bài ngắn (1 dòng, dùng khi thu gọn),
       noiDung: đề bài đầy đủ (HTML),
       them:  phần minh họa thêm, VD danh sách đồ vật, hình đồ thị (HTML, không bắt buộc),
       canTim: cần tìm gì (HTML) }
   ========================================================= */

const DE_BAI = {};
const so = x => Number(x).toLocaleString("vi-VN");
const giaiThua = n => { let k = 1; for (let i = 2; i <= n; i++) k *= i; return k; };
const toHop = (n, m) => { let k = 1; for (let i = 1; i <= m; i++) k = (k * (n - m + i)) / i; return Math.round(k); };

// Vài cấu hình đầu và cuối, VD "000, 001, 010, …, 111"
function vaiCauHinh(ds, tong) {
  if (tong <= 8) return ds.join(", ");
  return ds.slice(0, 3).join(", ") + ", …, " + ds[ds.length - 1];
}

/* ---------- Liệt kê ---------- */
DE_BAI.lietke = ({ type, n, m }) => {
  if (type === "Hoán vị của n phần tử") {
    const tong = giaiThua(n);
    const dau = [], cuoi = [];
    // vài hoán vị đầu theo thứ tự từ điển + hoán vị cuối (giảm dần)
    const tang = Array.from({ length: n }, (_, i) => i + 1);
    dau.push(tang.join(""));
    if (n >= 2) dau.push([...tang.slice(0, n - 2), tang[n - 1], tang[n - 2]].join(""));
    cuoi.push([...tang].reverse().join(""));
    const vd = tong <= 6 ? null : [...dau, "…", ...cuoi].join(", ");
    return {
      tom: `Liệt kê tất cả hoán vị của {1, 2, …, ${n}}.`,
      noiDung: `Liệt kê tất cả các cách <b>sắp xếp thứ tự</b> ${n} số {${tang.join(", ")}}, mỗi số dùng đúng 1 lần.`,
      canTim: `Có <b>${n}! = ${so(tong)}</b> hoán vị` + (vd ? `: ${vd}` : n <= 3 ? `: ${hoanViNho(n).join(", ")}` : "") + "."
    };
  }
  if (type === "Tổ hợp chập m của n") {
    if (m > n) return { tom: "", loi: true, noiDung: `Cần chọn ${m} phần tử từ ${n} phần tử: không thể vì <b>m phải ≤ n</b>.`, canTim: "Hãy sửa lại m hoặc n ở cột bên trái." };
    const tap = Array.from({ length: n }, (_, i) => i + 1);
    const tong = toHop(n, m);
    const dau = tap.slice(0, m).join(""), cuoi = tap.slice(n - m).join("");
    return {
      tom: `Liệt kê các cách chọn ${m} phần tử từ {1, …, ${n}}.`,
      noiDung: `Liệt kê tất cả các cách <b>chọn ra ${m} phần tử</b> từ tập {${tap.join(", ")}} (không quan tâm thứ tự: chọn 1, 2 cũng là chọn 2, 1).`,
      canTim: `Có <b>C(${n}, ${m}) = ${so(tong)}</b> tổ hợp` + (tong > 1 ? `: ${dau}, …, ${cuoi}` : `: ${dau}`) + "."
    };
  }
  const tong = 2 ** n;
  const ds = [];
  for (let k = 0; k < Math.min(tong, 8); k++) ds.push(k.toString(2).padStart(n, "0"));
  if (tong > 8) ds.push("1".repeat(n));
  return {
    tom: `Liệt kê tất cả các dãy nhị phân độ dài ${n}.`,
    noiDung: `Liệt kê tất cả các dãy gồm <b>${n}</b> chữ số, mỗi chữ số là <b>0 hoặc 1</b>.`,
    canTim: `Có <b>2<sup>${n}</sup> = ${so(tong)}</b> dãy: ${vaiCauHinh(ds, tong)}.`
  };
};
function hoanViNho(n) {
  const kq = [];
  const go = (x, con) => { if (!con.length) return kq.push(x.join("")); con.forEach((v, k) => go([...x, v], con.filter((_, j) => j !== k))); };
  go([], Array.from({ length: n }, (_, i) => i + 1));
  return kq;
}

/* ---------- Xếp hậu ---------- */
const SO_LOI_GIAI_HAU = [null, 1, 0, 0, 2, 10, 4, 40, 92, 352, 724, 2680, 14200];
DE_BAI.nhau = ({ n, timKiem }) => {
  const soLG = SO_LOI_GIAI_HAU[n];
  const tatCa = timKiem === "Tất cả lời giải";
  return {
    tom: `Đặt ${n} quân hậu lên bàn cờ ${n}×${n} không ăn nhau.`,
    noiDung: `Đặt <b>${n}</b> quân hậu lên bàn cờ <b>${n} × ${n}</b> sao cho không có 2 quân nào ăn được nhau,
      tức là không có 2 quân nào nằm <b>cùng hàng, cùng cột hoặc cùng đường chéo</b>.`,
    canTim: (tatCa ? "<b>Tất cả</b> các cách đặt." : "<b>Một</b> cách đặt (lời giải đầu tiên tìm được).")
      + (soLG === 0 ? ` Bàn cờ ${n}×${n} <b>không có</b> cách đặt nào, hãy xem máy thử hết mọi khả năng.`
        : soLG != null ? ` Bàn cờ ${n}×${n} có tất cả <b>${so(soLG)}</b> lời giải.` : "")
  };
};

/* ---------- Tháp Hà Nội ---------- */
DE_BAI.hanoi = ({ n }) => ({
  tom: `Chuyển ${n} đĩa từ cọc A sang cọc C.`,
  noiDung: `Có 3 cọc A, B, C. Cọc A đang có <b>${n}</b> đĩa, đĩa lớn ở dưới, đĩa nhỏ ở trên.
    Chuyển toàn bộ sang cọc C, mỗi lần chỉ chuyển <b>1 đĩa</b> và <b>không được đặt đĩa lớn lên trên đĩa nhỏ</b>. Cọc B dùng làm trung gian.`,
  canTim: `Thứ tự các lần chuyển. Cần ít nhất <b>2<sup>${n}</sup> − 1 = ${so(2 ** n - 1)}</b> lần chuyển.`
});

/* ---------- Fibonacci ---------- */
DE_BAI.fibonacci = ({ n, mode }) => {
  const kq = n <= 1000 ? String(fibSo(n)) : null;     // n quá lớn thì không tính sẵn (tốn thời gian)
  const ghi = mode.startsWith("Đệ quy")
    ? (n <= 70 ? ` Cách đệ quy thường sẽ phải gọi hàm <b>${so(Number(2n * fibSo(n) - 1n))}</b> lần.` : "")
    : mode.includes("top-down") ? ` Cách top-down chỉ cần khoảng <b>${so(Math.max(1, 2 * n - 3))}</b> lần gọi hàm.`
      : ` Cách bottom-up chỉ cần <b>${so(Math.max(0, n - 2))}</b> phép cộng.`;
  return {
    tom: `Tính số Fibonacci thứ ${n}.`,
    noiDung: `Dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13, … (mỗi số bằng tổng 2 số đứng trước, f(1) = f(2) = 1).
      Tính số thứ <b>${n}</b> của dãy, tức f(${n}).`,
    canTim: (kq ? `f(${n}) = <b>${kq.length > 40 ? kq.slice(0, 38) + "…" : kq}</b>.` : "") + ghi
  };
};

/* ---------- Xếp ba lô ---------- */
DE_BAI.balo = input => {
  const loai2 = input.loai.startsWith("Ba lô 2");
  const a = String(input.a).split(/[,;\s]+/).filter(Boolean).map(Number);
  const c = String(input.c).split(/[,;\s]+/).filter(Boolean).map(Number);
  const n = Math.min(a.length, c.length);
  const bang = n && n <= 12 ? `
    <table class="bang-mt de-bai-bang">
      <tr><th>Vật</th>${a.slice(0, n).map((_, i) => `<th>${i + 1}</th>`).join("")}</tr>
      <tr><th>Nặng (kg)</th>${a.slice(0, n).map(x => `<td>${x}</td>`).join("")}</tr>
      <tr><th>Giá trị</th>${c.slice(0, n).map(x => `<td>${x}</td>`).join("")}</tr>
    </table>` : "";
  return {
    tom: `Ba lô chứa tối đa ${input.b} kg, chọn trong ${n} đồ vật để tổng giá trị lớn nhất.`,
    noiDung: `Một chiếc ba lô chỉ mang được tối đa <b>${input.b} kg</b>. Có <b>${n}</b> đồ vật như bảng dưới.
      ${loai2 ? `Mỗi vật được lấy <b>từ 0 đến ${input.m} cái</b>.` : "Mỗi vật chỉ được <b>lấy hoặc không lấy</b> (tối đa 1 cái)."}`,
    them: bang,
    canTim: "Chọn những vật nào để <b>tổng giá trị lớn nhất</b> mà tổng khối lượng không vượt quá sức chứa ba lô?"
  };
};

/* ---------- Đồ thị: hình xem trước dùng chung ---------- */
function hinhDeBai(mt, coTrongSo, lopDinh = () => "") {
  return `<div class="de-bai-hinh">${veDoThi({ n: mt.length, mt, coHuong: !laDoiXung(mt), nhanCanh: coTrongSo && mt.length <= 8, lopDinh })}</div>`;
}
const loaiDoThi = mt => (laDoiXung(mt) ? "vô hướng" : "có hướng (cạnh có mũi tên chỉ chiều đi)");
const soCanh = mt => { let k = 0; mt.forEach((h, i) => h.forEach((x, j) => { if (i !== j && x > 0) k++; })); return laDoiXung(mt) ? k / 2 : k; };

/* ---------- Người du lịch ---------- */
DE_BAI.tsp = ({ matrix: mt, start, mode }) => {
  const n = mt.length;
  const vd = mt[0][1] > 0 ? ` (VD đi từ 1 đến 2 tốn ${mt[0][1]})` : "";
  return {
    tom: `Đi qua ${n} thành phố, mỗi nơi 1 lần, xuất phát và quay về thành phố ${start}, tổng chi phí nhỏ nhất.`,
    noiDung: `Một người du lịch xuất phát từ <b>thành phố ${start}</b>, muốn đi qua tất cả <b>${n}</b> thành phố,
      mỗi thành phố <b>đúng 1 lần</b>, rồi quay về thành phố ${start}. Chi phí đi giữa 2 thành phố là số ghi trên đường nối${vd}.`,
    them: hinhDeBai(mt, true, i => (i === start - 1 ? "hien-tai" : "")),
    canTim: `Hành trình có <b>tổng chi phí nhỏ nhất</b>. Có tất cả (n − 1)! = ${so(giaiThua(n - 1))} hành trình để chọn`
      + (mode.startsWith("Láng") ? "; cách tham lam chỉ đi theo thành phố gần nhất nên rất nhanh nhưng có thể không tối ưu." : ".")
  };
};

/* ---------- BFS / DFS ---------- */
DE_BAI.bfsdfs = ({ matrix: mt, start, mode }) => {
  const bfs = mode.startsWith("BFS");
  return {
    tom: `${bfs ? "BFS" : "DFS"}: thăm các đỉnh của đồ thị, bắt đầu từ đỉnh ${start}.`,
    noiDung: `Cho đồ thị <b>${mt.length}</b> đỉnh, <b>${soCanh(mt)}</b> cạnh, ${loaiDoThi(mt)}.
      Bắt đầu từ <b>đỉnh ${start}</b>, đi theo các cạnh để thăm tất cả các đỉnh đi tới được, mỗi đỉnh 1 lần,
      theo kiểu ${bfs ? "<b>chiều rộng</b>: thăm các đỉnh gần trước, xa sau" : "<b>chiều sâu</b>: đi sâu theo 1 nhánh đến cùng rồi mới quay lại"}.`,
    them: hinhDeBai(mt, false, i => (i === start - 1 ? "hien-tai" : "")),
    canTim: "<b>Thứ tự thăm</b> các đỉnh (khi có nhiều đỉnh kề, xét đỉnh số nhỏ trước)."
  };
};

/* ---------- Dijkstra ---------- */
DE_BAI.dijkstra = ({ matrix: mt, start, end }) => ({
  tom: `Tìm đường đi ngắn nhất từ đỉnh ${start} đến đỉnh ${end}.`,
  noiDung: `Cho đồ thị <b>${mt.length}</b> đỉnh, <b>${soCanh(mt)}</b> cạnh, ${loaiDoThi(mt)}. Số ghi trên mỗi cạnh là <b>độ dài</b> của cạnh đó.`,
  them: hinhDeBai(mt, true, i => (i === start - 1 ? "hien-tai" : i === end - 1 ? "tren-duong" : "")),
  canTim: `<b>Đường đi ngắn nhất</b> từ đỉnh <b>${start}</b> (vàng) đến đỉnh <b>${end}</b> (xanh đậm) và độ dài của nó.`
});

/* =========================================================
   HIỂN THỊ
   ========================================================= */
// Đọc dữ liệu hiện tại -> đề bài. Dữ liệu đang sai thì trả về null (lỗi sẽ hiện khi bấm chạy)
function layDeBai() {
  const tao = DE_BAI[currentAlgo?.id];
  if (!tao || !document.getElementById("inputForm")) return null;
  try { return kiemTraDuLieu(currentAlgo) ? null : tao(readInputs()); }
  catch (e) { return null; }
}

/* Gọi khi dữ liệu đổi hoặc khi chưa có mô phỏng: hiện đề bài đầy đủ trong khu vực mô phỏng */
function veDeBai() {
  if (sim.steps.length) return;                         // đang mô phỏng thì để yên hình vẽ
  const viz = document.getElementById("viz");
  if (!viz) return;
  const d = layDeBai();
  viz.innerHTML = d ? `
    <div class="de-bai">
      <span class="de-bai-nhan">Đề bài</span>
      <p>${d.noiDung}</p>
      ${d.them || ""}
      <p class="de-bai-tim"><b>${d.loi ? "Lưu ý" : "Cần tìm"}:</b> ${d.canTim}</p>
      <p class="de-bai-goi-y" ${d.loi ? "hidden" : ""}>Bấm <b>▶ Bắt đầu mô phỏng</b> (hoặc phím →) để xem máy giải từng bước.
        Sửa dữ liệu ở cột bên trái thì đề bài đổi theo.</p>
    </div>`
    : `<p class="viz-empty">Khu vực mô phỏng<br><small>Dữ liệu đang chưa hợp lệ, hãy sửa lại ở cột bên trái</small></p>`;
}

/* Khi đang mô phỏng: 1 dòng đề bài thu gọn đặt trên hình vẽ */
function dongDeBai() {
  const d = layDeBai();
  return d?.tom ? `<div class="de-bai-gon" title="Đề bài"> ${d.tom}</div>` : "";
}
