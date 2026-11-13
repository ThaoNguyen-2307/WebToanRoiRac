/* =========================================================
   hanoi.js — THÁP HÀ NỘI
   1. SOLVERS.hanoi : chạy thuật toán đệ quy, ghi lại từng bước
   2. VE.hanoi      : vẽ 3 cọc, các đĩa và ngăn xếp lời gọi đệ quy
   3. Lý thuyết     : nội dung tab "Lý thuyết"

   Mã giả (trong data.js), đánh số dòng từ 0:
     0  hanoi(n, A, B, C):
     1    if n == 1:
     2      chuyển đĩa A -> C; return
     3    hanoi(n-1, A, C, B)
     4    chuyển đĩa A -> C
     5    hanoi(n-1, B, A, C)
   ========================================================= */

const TEN_COC = ["A", "B", "C"];

/* ---------- 1. HÀM GIẢI ----------
   Cọc được lưu bằng mảng, phần tử cuối là đĩa trên cùng.
   VD 3 đĩa: coc = [[3, 2, 1], [], []]  (đĩa 1 nhỏ nhất, nằm trên cùng cọc A)        */
SOLVERS.hanoi = function (input) {
  const n = input.n;                  // đã kiểm tra là số nguyên dương trước khi gọi hàm
  if (2 ** n > GIOI_HAN_BUOC) kiemTraSoBuoc({ length: GIOI_HAN_BUOC });   // báo trước, khỏi chạy
  const chiChuyen = input.cheDo === "Chỉ các lần chuyển đĩa";
  const tongSoLan = 2 ** n - 1;

  const coc = [[], [], []];
  for (let d = n; d >= 1; d--) coc[0].push(d);

  const steps = [];
  const nganXep = [];        // các lời gọi hanoi(...) đang chạy dở
  let soLan = 0;             // số lần đã chuyển đĩa

  // Chụp lại trạng thái hiện tại thành 1 bước
  function ghiBuoc(line, msg, chuyen = null, batBuoc = false) {
    if (chiChuyen && !chuyen && !batBuoc) return;     // chế độ rút gọn: chỉ giữ các lần chuyển đĩa
    kiemTraSoBuoc(steps);
    steps.push({
      line, msg,
      state: {
        coc: coc.map(c => [...c]),     // sao chép, để bước sau không làm thay đổi bước trước
        chuyen, soLan, tongSoLan, n,
        nganXep: [...nganXep]
      }
    });
  }

  function chuyenDia(tu, den, line, msg) {
    const dia = coc[tu].pop();
    coc[den].push(dia);
    soLan++;
    ghiBuoc(line, `${msg ? msg + " " : ""}Chuyển đĩa ${dia} từ cọc ${TEN_COC[tu]} sang cọc ${TEN_COC[den]} (lần ${soLan}/${tongSoLan}).`,
            { tu, den, dia });
  }

  // Thuật toán đệ quy: chuyển k đĩa từ cọc a sang cọc c, dùng cọc b làm trung gian
  function hanoi(k, a, b, c) {
    const A = TEN_COC[a], B = TEN_COC[b], C = TEN_COC[c];
    nganXep.push(`hanoi(${k}, ${A}, ${B}, ${C})`);
    ghiBuoc(0, `Gọi hanoi(${k}, ${A}, ${B}, ${C}): cần chuyển ${k} đĩa từ ${A} sang ${C}, dùng ${B} làm trung gian.`);

    if (k === 1) {
      ghiBuoc(1, `n = 1: chỉ còn 1 đĩa, chuyển thẳng là xong (điều kiện dừng).`);
      chuyenDia(a, c, 2, "");
    } else {
      ghiBuoc(1, `n = ${k} > 1: chia thành bài toán nhỏ hơn.`);
      ghiBuoc(3, `Dời ${k - 1} đĩa phía trên từ ${A} sang ${B} để nhường đường cho đĩa lớn nhất.`);
      hanoi(k - 1, a, c, b);
      chuyenDia(a, c, 4, `Đĩa lớn nhất (đĩa ${k}) đã lộ ra.`);
      ghiBuoc(5, `Dời ${k - 1} đĩa từ ${B} sang ${C}, đặt lên trên đĩa ${k}.`);
      hanoi(k - 1, b, a, c);
    }
    nganXep.pop();
  }

  ghiBuoc(null, `Bắt đầu: ${n} đĩa nằm ở cọc A. Mục tiêu: chuyển hết sang cọc C, cần ${tongSoLan} lần chuyển.`, null, true);
  hanoi(n, 0, 1, 2);
  ghiBuoc(null, `Hoàn thành! Đã chuyển ${n} đĩa sang cọc C sau ${tongSoLan} lần (đúng bằng 2^${n} − 1).`, null, true);
  return steps;
};

/* ---------- 2. HÀM VẼ ---------- */
const MAU_DIA = ["#e8a33d", "#d9694f", "#b35c8a", "#6f6bb8", "#4f8fc0", "#4fa38a", "#8aa04f"];

VE.hanoi = function (step) {
  const s = step.state;
  const W = 600, day = 300, cao = 28;                    // khung rộng, vị trí mặt đế, chiều cao 1 đĩa
  const xCoc = [110, 300, 490];
  const rongMax = 170, rongMin = 44;
  const rong = d => rongMin + (rongMax - rongMin) * (s.n === 1 ? 1 : (d - 1) / (s.n - 1));
  const caoCoc = (s.n + 1) * cao + 16;

  let svg = "";
  // Mặt đế và 3 cọc
  svg += `<rect x="20" y="${day}" width="${W - 40}" height="10" rx="5" fill="#8b8f86"/>`;
  xCoc.forEach((x, i) => {
    const dangDung = s.chuyen && (s.chuyen.tu === i || s.chuyen.den === i);
    svg += `<rect x="${x - 4}" y="${day - caoCoc}" width="8" height="${caoCoc}" rx="4" fill="${dangDung ? "#5c6157" : "#a7aba1"}"/>`;
    svg += `<text x="${x}" y="${day + 30}" text-anchor="middle" font-size="16" font-weight="700" fill="#34403a">Cọc ${TEN_COC[i]}</text>`;
  });

  // Các đĩa
  s.coc.forEach((dsDia, i) => {
    dsDia.forEach((d, tang) => {
      const w = rong(d), x = xCoc[i] - w / 2, y = day - (tang + 1) * cao;
      const vuaChuyen = s.chuyen && s.chuyen.dia === d;
      svg += `<rect x="${x}" y="${y + 1}" width="${w}" height="${cao - 2}" rx="10" fill="${MAU_DIA[(d - 1) % MAU_DIA.length]}"
                ${vuaChuyen ? `stroke="#1f2a14" stroke-width="3"` : ""}/>`;
      svg += `<text x="${xCoc[i]}" y="${y + cao / 2 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${d}</text>`;
    });
  });

  // Mũi tên chỉ lần chuyển vừa rồi
  if (s.chuyen) {
    const x1 = xCoc[s.chuyen.tu], x2 = xCoc[s.chuyen.den], yTren = day - caoCoc - 14;
    svg += `<path d="M${x1} ${yTren + 10} C${x1} ${yTren - 30}, ${x2} ${yTren - 30}, ${x2} ${yTren + 4}"
              fill="none" stroke="#1f2a14" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#muiTen)"/>`;
  }

  // Ngăn xếp lời gọi: lời gọi mới nhất ở trên cùng
  const nganXep = s.nganXep.length
    ? [...s.nganXep].reverse().map((g, i) => `<li class="${i === 0 ? "top" : ""}">${g}</li>`).join("")
    : `<li class="empty">(trống)</li>`;

  return `
    <div class="hanoi-info">
      <span class="pill">Lần chuyển: <b>${s.soLan} / ${s.tongSoLan}</b></span>
      ${s.chuyen ? `<span class="pill hl">Đĩa ${s.chuyen.dia}: ${TEN_COC[s.chuyen.tu]} → ${TEN_COC[s.chuyen.den]}</span>` : ""}
    </div>
    <svg class="hanoi-svg" viewBox="0 ${day - caoCoc - 60} ${W} ${caoCoc + 100}" role="img" aria-label="Ba cọc tháp Hà Nội">
      <defs><marker id="muiTen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="#1f2a14"/></marker></defs>
      ${svg}
    </svg>
    <div class="hanoi-stack">
      <span>Ngăn xếp lời gọi đệ quy</span>
      <ol>${nganXep}</ol>
    </div>`;
};

/* ---------- 3. LÝ THUYẾT ---------- */
ALGORITHMS.find(a => a.id === "hanoi").lyThuyet = `
  <p><b>Bài toán:</b> có 3 cọc A, B, C. Cọc A có n đĩa, đĩa to ở dưới, đĩa nhỏ ở trên.
     Hãy chuyển hết sang cọc C với 2 luật: mỗi lần chỉ chuyển 1 đĩa (đĩa trên cùng)
     và không bao giờ đặt đĩa to lên trên đĩa nhỏ.</p>
  <p><b>Ý tưởng đệ quy:</b> muốn chuyển n đĩa từ A sang C:</p>
  <ol>
    <li>Chuyển n − 1 đĩa phía trên từ A sang B (dùng C làm trung gian).</li>
    <li>Chuyển đĩa lớn nhất từ A sang C.</li>
    <li>Chuyển n − 1 đĩa từ B sang C (dùng A làm trung gian).</li>
  </ol>
  <p>Bước 1 và 3 lại chính là bài Tháp Hà Nội nhưng ít hơn 1 đĩa, nên giải bằng cách gọi lại chính hàm đó.
     <b>Điều kiện dừng:</b> khi chỉ còn 1 đĩa thì chuyển thẳng.</p>
  <p><b>Số lần chuyển:</b> gọi T(n) là số lần chuyển n đĩa, ta có T(1) = 1 và T(n) = 2·T(n − 1) + 1,
     suy ra <b>T(n) = 2ⁿ − 1</b>. Ví dụ 3 đĩa cần 7 lần, 10 đĩa cần 1023 lần.</p>`;
