/* =========================================================
   so-sanh.js — "📊 SO SÁNH CÁC CÁCH GIẢI" TRÊN CÙNG MỘT DỮ LIỆU
   Bấm nút ở trang thuật toán: web chạy mọi cách giải với dữ liệu đang nhập, rồi hiện
   bảng số liệu + biểu đồ cột trong một hộp thoại.

   SO_SANH[id](input) trả về:
     { tieuDe, cot: [tên các cột], hang: [[giá trị từng cột], ...],
       bieuDo: { ten, donVi, muc: [{ nhan, giaTri, ghiChu }] },   (không bắt buộc)
       nhanXet: "đoạn kết luận" }
   ========================================================= */

const SO_SANH = {};
const dinhDang = x => (typeof x === "number" ? x.toLocaleString("vi-VN") : String(x));

// Chạy thử 1 cách giải, lỗi (dữ liệu quá lớn...) thì trả về null kèm thông báo
function chayThu(id, input) {
  try { return { steps: SOLVERS[id](input) }; }
  catch (e) { return { loi: e.message }; }
}

/* ---------- Fibonacci: đệ quy thường / top-down / bottom-up ---------- */
SO_SANH.fibonacci = input => {
  const n = input.n;
  const cach = ALGORITHMS.find(a => a.id === "fibonacci").inputs.find(x => x.key === "mode").options;
  const muc = [], hang = [];
  for (const mode of cach) {
    const r = chayThu("fibonacci", { ...input, mode });
    let kq, soPhep, ghiChu = "";
    if (r.steps) {
      const s = r.steps.at(-1).state;
      kq = s.ketQua;
      soPhep = s.loai === "bang" ? s.soPhepCong : s.soLanGoi;
    } else if (mode.startsWith("Đệ quy") && n <= 70) {
      // Quá lớn để chạy: số lần gọi của đệ quy thường đúng bằng 2·f(n) − 1
      kq = String(fibSo(n));
      soPhep = Number(2n * fibSo(n) - 1n);
      ghiChu = "tính theo công thức 2·f(n) − 1, quá lớn để mô phỏng";
    } else { kq = "–"; soPhep = null; ghiChu = r.loi; }
    const donVi = mode.includes("bottom-up") ? "phép cộng" : "lần gọi hàm";
    hang.push([mode, kq, soPhep == null ? "–" : `${dinhDang(soPhep)} ${donVi}`,
      mode.startsWith("Đệ quy") ? "O(2ⁿ)" : "O(n)", ghiChu || "—"]);
    if (soPhep != null) muc.push({ nhan: mode.replace(/ \(.*\)/, ""), giaTri: soPhep, ghiChu: donVi });
  }
  const [dq, td] = muc;
  return {
    tieuDe: `So sánh 3 cách tính f(${n})`,
    cot: ["Cách giải", "Kết quả", "Khối lượng tính", "Độ phức tạp", "Ghi chú"],
    hang,
    bieuDo: { ten: "Số lần gọi hàm / phép cộng", muc },
    nhanXet: dq && td
      ? `Với n = ${n}, đệ quy thường cần ${dinhDang(dq.giaTri)} lần gọi hàm, gấp khoảng ${dinhDang(Math.round(dq.giaTri / Math.max(1, td.giaTri)))} lần top-down (${dinhDang(td.giaTri)}). `
        + `Lý do: đệ quy thường tính lại cùng một fib(k) nhiều lần, còn quy hoạch động lưu kết quả để dùng lại. Bottom-up còn không cần gọi đệ quy.`
      : ""
  };
};

/* ---------- Người du lịch: nhánh cận / vét cạn / tham lam ---------- */
SO_SANH.tsp = input => {
  const cach = ALGORITHMS.find(a => a.id === "tsp").inputs.find(x => x.key === "mode").options;
  const mt = input.matrix, n = mt.length, s = input.start - 1;
  const toiUu = n <= 13 ? tspToiUu(mt, s) : null;
  const muc = [], hang = [];
  for (const mode of cach) {
    const r = chayThu("tsp", { ...input, mode, cheDo: "Chỉ các nút trên cây tìm kiếm" });
    if (!r.steps) {
      let tong = 0;
      for (let k = 0, t = 1; k < n; k++) { tong += t; t *= n - 1 - k; }
      hang.push([mode, "–", mode.startsWith("Vét") ? `${dinhDang(tong)} nút (ước tính)` : "–", "–", "Quá lớn để mô phỏng"]);
      if (mode.startsWith("Vét")) muc.push({ nhan: "Vét cạn", giaTri: tong, ghiChu: "nút (ước tính)" });
      continue;
    }
    const st = r.steps.at(-1).state;
    if (st.thamLam) {
      const chiPhi = r.steps.at(-1).msg.match(/chi phí (\d+)/)?.[1];
      hang.push([mode, chiPhi ?? "không tìm được", `${n - 1} lần chọn`,
        chiPhi == null ? "–" : toiUu == null ? "?" : +chiPhi === toiUu ? "✓ Tối ưu" : `✗ (tối ưu là ${toiUu})`, "Nhanh, O(n²), không chắc tối ưu"]);
    } else {
      hang.push([mode, soHoacVoCung(st.kyLuc), `${dinhDang(st.cay.length)} nút`,
        st.kyLuc === Infinity ? "–" : "✓ Tối ưu", st.nhanhCan ? `Cắt ${st.soCat} nhánh` : "Xét mọi hành trình"]);
      muc.push({ nhan: st.nhanhCan ? "Nhánh cận" : "Vét cạn", giaTri: st.cay.length, ghiChu: "nút trên cây tìm kiếm" });
    }
  }
  const nc = muc.find(m => m.nhan === "Nhánh cận"), vc = muc.find(m => m.nhan === "Vét cạn");
  return {
    tieuDe: `So sánh 3 cách giải TSP với ${n} thành phố`,
    cot: ["Cách giải", "Chi phí", "Khối lượng xét", "Tối ưu?", "Ghi chú"],
    hang,
    bieuDo: { ten: "Số nút phải xét trên cây tìm kiếm", muc },
    nhanXet: nc && vc
      ? `Nhánh cận chỉ xét ${dinhDang(nc.giaTri)} nút, bằng ${Math.round((nc.giaTri / vc.giaTri) * 100)}% so với vét cạn (${dinhDang(vc.giaTri)} nút), mà vẫn ra đúng chi phí tối ưu. `
        + `Cách tham lam nhanh nhất nhưng có thể cho kết quả không tối ưu.`
      : ""
  };
};

/* ---------- Xếp ba lô: QHĐ (ba lô 1, ba lô 2) và vét cạn ---------- */
SO_SANH.balo = input => {
  const ten1 = "Ba lô 1 (mỗi vật lấy tối đa 1 lần)", ten2 = "Ba lô 2 (mỗi vật lấy tối đa m lần)";
  const m = input.m > 0 ? input.m : 2;
  const r1 = chayThu("balo", { ...input, loai: ten1, cheDo: "Chỉ kết quả từng ô" });
  if (!r1.steps) throw new Error(r1.loi);
  const s1 = r1.steps.at(-1).state;
  const { n, b, a, c } = s1;
  const soO = (n + 1) * (b + 1);
  const hang = [], muc = [];

  // Vét cạn ba lô 1: thử hết 2^n cách chọn
  let tot = 0, soPA = 2 ** n;
  if (n <= 20) for (let tap = 0; tap < soPA; tap++) {
    let w = 0, v = 0;
    for (let i = 0; i < n; i++) if (tap & (1 << i)) { w += a[i]; v += c[i]; }
    if (w <= b && v > tot) tot = v;
  }
  hang.push(["Ba lô 1 – Quy hoạch động", s1.tongC, `${dinhDang(soO)} ô bảng`, "O(n·b)"]);
  hang.push(["Ba lô 1 – Vét cạn", n <= 20 ? tot : "–", `${dinhDang(soPA)} cách chọn`, "O(2ⁿ)"]);
  muc.push({ nhan: "QHĐ (ba lô 1)", giaTri: soO, ghiChu: "ô bảng" }, { nhan: "Vét cạn (ba lô 1)", giaTri: soPA, ghiChu: "cách chọn" });

  const r2 = chayThu("balo", { ...input, loai: ten2, m, cheDo: "Chỉ kết quả từng ô" });
  if (r2.steps) {
    const s2 = r2.steps.at(-1).state;
    hang.push([`Ba lô 2 (m = ${m}) – Quy hoạch động`, s2.tongC, `${dinhDang(soO)} ô bảng`, "O(n·b·m)"]);
  }
  return {
    tieuDe: `So sánh với ${n} đồ vật, sức chứa b = ${b}`,
    cot: ["Cách giải", "Giá trị lớn nhất", "Khối lượng tính", "Độ phức tạp"],
    hang,
    bieuDo: { ten: "Số trường hợp phải xét", muc },
    nhanXet: `Quy hoạch động và vét cạn cho cùng giá trị lớn nhất (${s1.tongC}). `
      + (soPA > soO
        ? `Vét cạn phải thử 2ⁿ = ${dinhDang(soPA)} cách chọn, còn quy hoạch động chỉ điền ${dinhDang(soO)} ô. `
        : `Với ít đồ vật như thế này, vét cạn (${dinhDang(soPA)} cách chọn) còn ít hơn số ô của bảng QHĐ (${dinhDang(soO)} ô). `
          + `Nhưng mỗi khi thêm 1 vật, số cách chọn của vét cạn tăng gấp đôi, còn bảng QHĐ chỉ thêm 1 hàng. `)
      + `VD với 40 vật, vét cạn phải thử hơn 1 nghìn tỷ cách, trong khi QHĐ chỉ cần 41 × (b + 1) ô. `
      + `Ba lô 2 cho phép lấy nhiều cái mỗi vật nên giá trị có thể lớn hơn ba lô 1.`
  };
};

/* ---------- BFS và DFS ---------- */
SO_SANH.bfsdfs = input => {
  const hang = [];
  const thuTu = {};
  for (const mode of ["BFS (chiều rộng)", "DFS (chiều sâu)"]) {
    const r = chayThu("bfsdfs", { ...input, mode });
    if (!r.steps) throw new Error(r.loi);
    const s = r.steps.at(-1).state;
    const canh = s.cha.map((u, v) => (u >= 0 ? `${u + 1}–${v + 1}` : null)).filter(Boolean);
    thuTu[mode] = s.thuTu;
    hang.push([mode, s.thuTu.map(v => v + 1).join(" → "), canh.join(", ") || "–",
      mode.startsWith("BFS") ? "Hàng đợi (vào trước ra trước)" : "Đệ quy / ngăn xếp (vào sau ra trước)"]);
  }
  const giong = thuTu["BFS (chiều rộng)"].join() === thuTu["DFS (chiều sâu)"].join();
  return {
    tieuDe: `So sánh BFS và DFS, xuất phát từ đỉnh ${input.start}`,
    cot: ["Thuật toán", "Thứ tự thăm", "Cạnh của cây duyệt", "Cấu trúc dữ liệu"],
    hang,
    nhanXet: giong
      ? "Với đồ thị này, hai cách cho cùng thứ tự thăm. Thử đồ thị có nhiều nhánh hơn để thấy khác biệt."
      : "BFS thăm các đỉnh gần đỉnh xuất phát trước (theo từng lớp), còn DFS đi sâu theo một nhánh đến cùng rồi mới quay lui. "
        + "Vì vậy cây duyệt BFS thường thấp và rộng, cây DFS thường cao và hẹp."
  };
};

/* ---------- Hộp thoại hiện kết quả ---------- */
function moSoSanh() {
  const loi = kiemTraDuLieu(currentAlgo);
  baoLoiNhap(loi);
  if (loi) return;
  let kq;
  try { kq = SO_SANH[currentAlgo.id](readInputs()); }
  catch (e) { baoLoiNhap({ key: e.key, loi: e.message }); return; }

  const max = Math.max(1, ...(kq.bieuDo?.muc || []).map(m => m.giaTri));
  const bieuDo = kq.bieuDo?.muc.length ? `
    <h4>${kq.bieuDo.ten}</h4>
    <div class="ss-bieu-do">${kq.bieuDo.muc.map(m => `
      <div class="ss-hang"><span class="ss-nhan">${m.nhan}</span>
        <span class="ss-thanh"><i style="width:${Math.max(0.6, (m.giaTri / max) * 100)}%"></i></span>
        <b>${dinhDang(m.giaTri)}</b></div>`).join("")}
    </div>` : "";

  const nen = document.createElement("div");
  nen.className = "modal-nen";
  nen.innerHTML = `
    <div class="modal modal-rong" role="dialog" aria-modal="true" aria-label="${kq.tieuDe}">
      <h3>📊 ${kq.tieuDe}</h3>
      <div class="table-wrap"><table class="table ss-bang">
        <thead><tr>${kq.cot.map(c => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${kq.hang.map(h => `<tr>${h.map(o => `<td>${o}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>
      ${bieuDo}
      ${kq.nhanXet ? `<p class="ss-nhan-xet"><b>Nhận xét:</b> ${kq.nhanXet}</p>` : ""}
      <div class="modal-chan"><button class="btn primary" type="button" id="dongSoSanh">Đóng</button></div>
    </div>`;
  document.body.appendChild(nen);
  const dong = () => { nen.remove(); document.removeEventListener("keydown", phimEsc); };
  const phimEsc = ev => { if (ev.key === "Escape") dong(); };
  document.addEventListener("keydown", phimEsc);
  nen.onclick = ev => { if (ev.target === nen) dong(); };
  nen.querySelector("#dongSoSanh").onclick = dong;
  nen.querySelector("#dongSoSanh").focus();
}

// Gọi sau khi vẽ trang thuật toán: chỉ hiện nút với thuật toán có nhiều cách giải để so sánh
function ganSoSanh() {
  const nut = document.getElementById("btnSoSanh");
  if (!nut) return;
  nut.hidden = !SO_SANH[currentAlgo.id];
  nut.onclick = moSoSanh;
}
