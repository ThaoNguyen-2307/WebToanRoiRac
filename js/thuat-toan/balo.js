const BALO_2 = "Ba lô 2 (mỗi vật lấy tối đa m lần)";

// "3, 4, 5" -> [3, 4, 5]. Sai thì báo lỗi dưới đúng ô nhập
function docDanhSach(chuoi, key, ten) {
  const phan = String(chuoi ?? "").split(/[,;\s]+/).filter(Boolean);
  if (!phan.length) loiDuLieu(key, `Hãy nhập ${ten}, các số cách nhau bởi dấu phẩy. VD: 3, 4, 5`);
  return phan.map(p => {
    if (!/^-?\d+$/.test(p)) loiDuLieu(key, `${ten} chỉ gồm số nguyên, "${p}" không hợp lệ.`);
    const so = Number(p);
    if (so < 1) loiDuLieu(key, `${ten} phải là số dương (lớn hơn 0), bạn nhập ${so}.`);
    return so;
  });
}

// Hàm giải
SOLVERS.balo = function (input) {
  const b = input.b;
  const a = docDanhSach(input.a, "a", "Trọng lượng");
  const c = docDanhSach(input.c, "c", "Giá trị");
  if (a.length !== c.length)
    loiDuLieu("c", `Có ${a.length} trọng lượng nhưng ${c.length} giá trị. Mỗi đồ vật cần đủ cả trọng lượng và giá trị.`);
  const n = a.length;
  const loai2 = input.loai === BALO_2;
  const m = loai2 ? input.m : 1;
  const rutGon = input.cheDo === "Chỉ kết quả từng ô";

  // Ước lượng số bước trước khi chạy
  const uocLuong = n * (b + 1) * (rutGon ? 1 : 2 + 2 * Math.min(m, b));
  if (uocLuong > GIOI_HAN_BUOC)
    loiDuLieu("b", `Dữ liệu quá lớn: bảng ${n + 1} × ${b + 1} ô cần khoảng ${uocLuong.toLocaleString("vi-VN")} bước mô phỏng. Hãy giảm b hoặc số đồ vật.`);

  const F = [Array(b + 1).fill(0)];
  const K = [Array(b + 1).fill(0)];
  for (let i = 1; i <= n; i++) { F.push(Array(b + 1).fill(null)); K.push(Array(b + 1).fill(0)); }

  const steps = [];
  let tienDo = b + 1, giaTriO = null;
  function ghi(line, msg, them = {}, batBuoc = false) {
    if (rutGon && !batBuoc) return;
    kiemTraSoBuoc(steps);
    steps.push({
      line, msg,
      state: { n, b, a, c, m, loai2, F, tienDo, giaTriO, ...them }
    });
  }

  const tenVat = i => `vật ${i} (a=${a[i - 1]}, c=${c[i - 1]})`;
  ghi(null, `Bắt đầu: ${n} đồ vật, ba lô chứa tối đa b = ${b}. Hàng 0 toàn số 0 vì chưa có vật nào.`, {}, true);

  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1], ci = c[i - 1];
    ghi(0, `Xét ${tenVat(i)}: điền hàng ${i} của bảng.`, { i });
    for (let w = 0; w <= b; w++) {
      tienDo = i * (b + 1) + w; giaTriO = null;
      ghi(1, `Ô F[${i}][${w}]: dùng các vật 1..${i}, ba lô chứa tối đa ${w}.`, { i, w });
      F[i][w] = giaTriO = F[i - 1][w];
      K[i][w] = 0;
      ghi(2, `${loai2 ? "Lấy 0 cái" : "Không lấy"} vật ${i}: F[${i}][${w}] = F[${i - 1}][${w}] = ${F[i][w]}.`,
          { i, w, nguon: [[i - 1, w]] });

      if (!loai2) {
        if (ai <= w) {
          ghi(3, `a[${i}] = ${ai} ≤ ${w}: vật ${i} bỏ vừa ba lô, thử lấy nó.`, { i, w });
          const lay = F[i - 1][w - ai] + ci;
          ghi(4, `Lấy vật ${i}: lay = F[${i - 1}][${w - ai}] + c[${i}] = ${F[i - 1][w - ai]} + ${ci} = ${lay}.`,
              { i, w, nguon: [[i - 1, w - ai]] });
          if (lay > F[i][w]) { F[i][w] = giaTriO = lay; K[i][w] = 1; }
          ghi(5, lay > F[i - 1][w]
            ? `${lay} > ${F[i - 1][w]} nên lấy vật ${i} tốt hơn: F[${i}][${w}] = ${F[i][w]}.`
            : `${lay} ≤ ${F[i - 1][w]} nên không lấy vật ${i}: F[${i}][${w}] giữ nguyên ${F[i][w]}.`,
            { i, w, nguon: [[i - 1, w], [i - 1, w - ai]] });
        } else {
          ghi(3, `a[${i}] = ${ai} > ${w}: vật ${i} nặng hơn sức chứa ${w}, không lấy được.`, { i, w });
        }
      } else {
        for (let k = 1; k <= m && k * ai <= w; k++) {
          ghi(3, `Thử lấy k = ${k} cái vật ${i} (nặng ${k}×${ai} = ${k * ai} ≤ ${w}).`, { i, w });
          const lay = F[i - 1][w - k * ai] + k * ci;
          ghi(4, `lay = F[${i - 1}][${w - k * ai}] + ${k}×${ci} = ${F[i - 1][w - k * ai]} + ${k * ci} = ${lay}.`,
              { i, w, nguon: [[i - 1, w - k * ai]] });
          const cu = F[i][w];
          if (lay > cu) { F[i][w] = giaTriO = lay; K[i][w] = k; }
          ghi(5, lay > cu ? `${lay} > ${cu}: cập nhật F[${i}][${w}] = ${lay} (lấy ${k} cái).`
                          : `${lay} ≤ ${cu}: giữ nguyên F[${i}][${w}] = ${cu}.`,
              { i, w, nguon: [[i - 1, w - k * ai]] });
        }
      }
      if (rutGon) ghi(5, `F[${i}][${w}] = ${F[i][w]}` + (K[i][w] ? ` (lấy ${loai2 ? K[i][w] + " cái " : ""}vật ${i}).` : ` (không lấy vật ${i}).`),
                      { i, w, nguon: K[i][w] ? [[i - 1, w - K[i][w] * ai]] : [[i - 1, w]] }, true);
    }
  }

  tienDo = Infinity;
  let w = b;
  const x = Array(n + 1).fill(0);
  const duong = [[n, b]];
  ghi(6, `Bảng đã điền xong. Giá trị lớn nhất là F[${n}][${b}] = ${F[n][b]}. Truy vết ngược để biết chọn những vật nào, bắt đầu với w = ${b}.`,
      { truyVet: true, duong: duong.slice(), x: x.slice() }, true);
  for (let i = n; i >= 1; i--) {
    ghi(7, `Xét vật ${i}, w = ${w}.`, { truyVet: true, i, w, duong: duong.slice(), x: x.slice() });
    const k = K[i][w];
    x[i] = k;
    const wCu = w;
    w -= k * a[i - 1];
    duong.push([i - 1, w]);
    const msg = loai2
      ? `F[${i}][${wCu}] lấy ${k} cái vật ${i}: x[${i}] = ${k}, w = ${wCu} − ${k}×${a[i - 1]} = ${w}.`
      : k ? `F[${i}][${wCu}] = ${F[i][wCu]} ≠ F[${i - 1}][${wCu}] = ${F[i - 1][wCu]}: CHỌN vật ${i}, w = ${wCu} − ${a[i - 1]} = ${w}.`
          : `F[${i}][${wCu}] = F[${i - 1}][${wCu}] = ${F[i][wCu]}: không chọn vật ${i}, w giữ nguyên ${w}.`;
    ghi(k ? 9 : 8, msg, { truyVet: true, i, w: wCu, duong: duong.slice(), x: x.slice() }, true);
  }

  const chon = x.map((k, i) => [i, k]).filter(([i, k]) => i > 0 && k > 0);
  const tongA = chon.reduce((t, [i, k]) => t + k * a[i - 1], 0);
  const tongC = chon.reduce((t, [i, k]) => t + k * c[i - 1], 0);
  ghi(10, chon.length
    ? `Kết quả: chọn ${chon.map(([i, k]) => (k > 1 ? `${k} × ` : "") + `vật ${i}`).join(", ")}. `
      + `Tổng trọng lượng ${tongA} ≤ ${b}, tổng giá trị lớn nhất = ${tongC}.`
    : `Không vật nào bỏ vừa ba lô, giá trị lớn nhất = 0.`,
    { truyVet: true, xong: true, duong: duong.slice(), x: x.slice(), tongA, tongC }, true);
  return steps;
};

// HÀM VẼ: bảng F + danh sách đồ vật
VE.balo = function (step) {
  const s = step.state;
  const laNguon = new Set((s.nguon || []).map(([i, w]) => i + "," + w));
  const tren = new Set((s.duong || []).map(([i, w]) => i + "," + w));

  const giaTri = (i, w) => {
    const thuTu = i * (s.b + 1) + w;
    return i === 0 || thuTu < s.tienDo ? s.F[i][w] : thuTu === s.tienDo ? s.giaTriO : null;
  };

  // b lớn thì chỉ vẽ khoảng 25 cột quanh cột đang xét
  const SO_COT = 25;
  const cotGiua = s.w ?? s.b;
  const tuW = s.b < SO_COT ? 0 : Math.max(0, Math.min(cotGiua - 12, s.b - SO_COT + 1));
  const denW = Math.min(s.b, tuW + SO_COT - 1);
  const dsW = [];
  for (let w = tuW; w <= denW; w++) dsW.push(w);

  let bang = `<tr><th class="goc">i \\ w</th>${dsW.map(w =>
    `<th class="${!s.truyVet && w === s.w ? "cot-xet" : ""}">${w}</th>`).join("")}</tr>`;
  for (let i = 0; i <= s.n; i++) {
    const nhan = i === 0 ? `<b>0</b><small>không vật</small>`
      : `<b>${i}</b><small>a=${s.a[i - 1]}, c=${s.c[i - 1]}</small>`;
    bang += `<tr class="${i === s.i ? "hang-xet" : ""} ${s.x && s.x[i] ? "hang-chon" : ""}"><th>${nhan}</th>`;
    for (const w of dsW) {
      const v = giaTri(i, w);
      const k = i + "," + w;
      const lop = (i === s.i && w === s.w) ? "dang-tinh"
        : laNguon.has(k) ? "nguon"
        : s.truyVet && tren.has(k) ? "truy-vet"
        : v == null ? "trong" : "";
      bang += `<td class="${lop}">${v ?? ""}</td>`;
    }
    bang += `</tr>`;
  }

  const vat = s.a.map((ai, k) => {
    const i = k + 1, so = s.x ? s.x[i] : 0;
    return `<div class="vat ${so ? "chon" : ""} ${i === s.i ? "xet" : ""}">
      <b>Vật ${i}</b><small>nặng ${ai} · giá trị ${s.c[k]}</small>${so ? `<em>${s.loai2 ? "× " + so : "✓ chọn"}</em>` : ""}</div>`;
  }).join("");

  return `
    <div class="hanoi-info">
      <span class="pill">Sức chứa b = <b>${s.b}</b></span>
      ${s.loai2 ? `<span class="pill">Mỗi vật tối đa <b>${s.m}</b> cái</span>` : ""}
      ${s.xong ? `<span class="pill hl">Giá trị lớn nhất: <b>${s.tongC}</b> (nặng ${s.tongA})</span>` : ""}
    </div>
    ${tuW > 0 || denW < s.b ? `<p class="viz-note">Bảng rộng nên chỉ hiện cột w = ${tuW} đến ${denW}.</p>` : ""}
    <div class="bang-qhd-khung"><table class="bang-qhd">${bang}</table></div>
    <div class="ds-vat">${vat}</div>
    <p class="viz-note">${s.truyVet ? "Ô xanh đậm: đường truy vết từ F[n][b] ngược về hàng 0." : "Ô vàng: ô đang tính. Ô xanh: các ô ở hàng trên được dùng để tính."}</p>`;
};

// Lý thuyết
ALGORITHMS.find(a => a.id === "balo").lyThuyet = `
  <p><b>Bài toán (slide):</b> có 1 chiếc ba lô mang được không quá trọng lượng b. Có n đồ vật, vật i có trọng lượng
     aᵢ và giá trị cᵢ. Chọn những vật nào để tổng giá trị lớn nhất?</p>
  <ul>
    <li><b>Ba lô 1:</b> mỗi vật chọn không quá 1 lần, xᵢ ∈ {0, 1}.</li>
    <li><b>Ba lô 2:</b> mỗi vật có thể lấy từ 0 đến m lần, xᵢ ∈ {0, 1, ..., m}.</li>
  </ul>
  <p>Hàm mục tiêu f(x) = Σ xᵢ·cᵢ → lớn nhất, với điều kiện Σ xᵢ·aᵢ ≤ b.</p>

  <h3>Ý tưởng quy hoạch động</h3>
  <p>Gọi <b>F[i][w]</b> là giá trị lớn nhất khi chỉ được dùng các vật 1..i và ba lô chứa tối đa w.
     Khi xét vật i có 2 lựa chọn:</p>
  <ul>
    <li><b>Không lấy vật i:</b> giá trị là F[i−1][w].</li>
    <li><b>Lấy vật i</b> (nếu aᵢ ≤ w): còn chỗ w − aᵢ cho các vật 1..i−1, giá trị là F[i−1][w − aᵢ] + cᵢ.</li>
  </ul>
  <p><b>Công thức truy hồi:</b> F[i][w] = max(F[i−1][w], F[i−1][w − aᵢ] + cᵢ), với F[0][w] = 0.
     Với ba lô 2: F[i][w] = max của F[i−1][w − k·aᵢ] + k·cᵢ với k = 0..m và k·aᵢ ≤ w.</p>
  <p>Điền bảng từ hàng 1 đến hàng n, đáp án nằm ở ô <b>F[n][b]</b>. Sau đó <b>truy vết</b> ngược:
     nếu F[i][w] ≠ F[i−1][w] thì vật i đã được chọn, trừ w đi aᵢ rồi xét vật i−1.</p>

  <h3>So sánh với vét cạn (quay lui)</h3>
  <p>Vét cạn thử hết 2ⁿ cách chọn (ba lô 1). Với n = 30 là hơn 1 tỷ cách. Quy hoạch động chỉ cần điền
     (n + 1) × (b + 1) ô, mỗi ô tính trong O(1), nên độ phức tạp là <b>O(n·b)</b>.
     Bù lại QHĐ cần bộ nhớ cho cả bảng, và chỉ hiệu quả khi b không quá lớn.</p>`;
