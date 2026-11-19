const TSP_NHANH_CAN = "Nhánh cận";
const TSP_VET_CAN = "Vét cạn (quay lui, không cắt nhánh)";
const TSP_THAM_LAM = "Láng giềng gần nhất (tham lam)";
const TSP_SO_NUT_VE = 90;          // cây tìm kiếm nhiều nút hơn thì không vẽ

function tspToiUu(mt, s) {
  const n = mt.length;
  if (n > 13) return null;
  const F = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity));
  F[1 << s][s] = 0;
  for (let tap = 0; tap < 1 << n; tap++) {
    if (!(tap & (1 << s))) continue;
    for (let u = 0; u < n; u++) {
      if (F[tap][u] === Infinity) continue;
      for (let v = 0; v < n; v++)
        if (!(tap & (1 << v)) && mt[u][v] > 0)
          F[tap | (1 << v)][v] = Math.min(F[tap | (1 << v)][v], F[tap][u] + mt[u][v]);
    }
  }
  let kq = Infinity;
  for (let u = 0; u < n; u++) if (u !== s && mt[u][s] > 0) kq = Math.min(kq, F[(1 << n) - 1][u] + mt[u][s]);
  return kq;
}

const tenHanhTrinh = x => x.map(c => c + 1).join(" → ");

// Hàm giải
SOLVERS.tsp = function (input) {
  const mt = docMaTran(input.matrix);
  const n = mt.length;
  const s = input.start - 1;
  kiemTraDinh(input.start, n, "start", "Thành phố xuất phát");
  if (input.mode === TSP_THAM_LAM) return tspThamLam(mt, s);

  const nhanhCan = input.mode !== TSP_VET_CAN;
  const rutGon = input.cheDo === "Chỉ các nút trên cây tìm kiếm";

  let cmin = Infinity;
  mt.forEach((hang, i) => hang.forEach((c, j) => { if (i !== j && c > 0) cmin = Math.min(cmin, c); }));
  if (cmin === Infinity) loiDuLieu("matrix", "Ma trận toàn số 0: không có đường đi nào giữa các thành phố.");

  // Vét cạn: báo trước nếu quá nhiều trường hợp
  let soNutDayDu = 0;
  for (let k = 0, t = 1; k < n; k++) { soNutDayDu += t; t *= n - 1 - k; }
  if (!nhanhCan && soNutDayDu * (rutGon ? 2 : 4) > GIOI_HAN_BUOC)
    loiDuLieu("matrix", `Vét cạn với ${n} thành phố phải xét ${soNutDayDu.toLocaleString("vi-VN")} hành trình bộ phận, trình duyệt sẽ bị treo. Hãy dùng tối đa ${n > 8 ? 7 : n - 1} thành phố, hoặc chọn cách "Nhánh cận".`);

  const steps = [];
  const x = [s];                          // hành trình đang xây (chỉ số từ 0)
  const daDi = Array(n).fill(false); daDi[s] = true;
  let S = 0, kyLuc = Infinity, toiUu = null, soCat = 0, suKien = 0;
  const cay = [{ id: 0, cha: -1, nhan: s + 1, sau: 0, dau: null }];
  const BO_QUA_KHI_RUT_GON = new Set([1, 6, 7, 9]);

  function ghi(line, msg, nut, them = {}) {
    if (rutGon && BO_QUA_KHI_RUT_GON.has(line)) return;
    if (steps.length >= GIOI_HAN_BUOC)
      loiDuLieu("matrix", `Quá nhiều bước (hơn ${GIOI_HAN_BUOC.toLocaleString("vi-VN")}), trình duyệt sẽ bị treo. Hãy giảm số thành phố.`);
    steps.push({
      line, msg,
      state: { loai: "tsp", n, mt, s, nhanhCan, x: x.slice(), S, kyLuc, toiUu: toiUu && toiUu.slice(),
               cay, soNut: cay.length, nut, suKien, soCat, cmin, ...them }
    });
  }
  function danhDau(id, loai) { cay[id].dau = { loai, luc: ++suKien }; }

  ghi(null, `Xuất phát từ thành phố ${s + 1}: x[1] = ${s + 1}, S = 0, kỷ lục = ∞.`
    + (nhanhCan ? ` cmin = ${cmin} (chi phí nhỏ nhất giữa 2 thành phố), dùng để tính cận dưới.` : ""), 0);

  function Try(i, chaId) {                 // i: vị trí đang chọn (chỉ số từ 0), đã có i thành phố
    const u = x[i - 1];
    for (let j = 0; j < n; j++) {
      if (daDi[j]) continue;
      const c = mt[u][j];
      if (!(c > 0)) { ghi(1, `Không có đường từ ${u + 1} đến ${j + 1} (chi phí 0), bỏ qua.`, chaId); continue; }
      ghi(1, `Thử đi tiếp đến thành phố ${j + 1} (chưa đi).`, chaId, { thu: [u, j] });

      x[i] = j; daDi[j] = true; S += c;
      const id = cay.length;
      cay.push({ id, cha: chaId, nhan: j + 1, sau: i, dau: null });
      ghi(2, `x[${i + 1}] = ${j + 1}: đi ${u + 1} → ${j + 1} mất ${c}, tổng S = ${S}.`, id);

      if (i === n - 1) {
        const ve = mt[j][s];
        if (!(ve > 0)) {
          danhDau(id, "xau");
          ghi(4, `Đã đi đủ ${n} thành phố nhưng không có đường từ ${j + 1} quay về ${s + 1}: hành trình không hợp lệ.`, id);
        } else {
          const T = S + ve;
          ghi(4, `Đã đi đủ ${n} thành phố. Quay về ${s + 1}: T = S + c[${j + 1}][${s + 1}] = ${S} + ${ve} = ${T}.`, id, { quayVe: true, T });
          if (T < kyLuc) {
            const cu = kyLuc;
            kyLuc = T; toiUu = [...x];
            danhDau(id, "ky-luc");
            ghi(5, `T = ${T} < kỷ lục ${soHoacVoCung(cu)}: cập nhật kỷ lục = ${T}, hành trình ${tenHanhTrinh([...x, s])}.`, id, { quayVe: true, T });
          } else {
            danhDau(id, "xau");
            ghi(5, `T = ${T} ≥ kỷ lục ${kyLuc}: không tốt hơn, bỏ qua.`, id, { quayVe: true, T });
          }
        }
      } else if (nhanhCan) {
        const conLai = n - i;                // số cạnh còn phải đi (kể cả cạnh quay về)
        const g = S + conLai * cmin;
        ghi(6, `Cận dưới g = S + ${conLai} × cmin = ${S} + ${conLai} × ${cmin} = ${g}. (Còn ${conLai} cạnh, mỗi cạnh tốn ít nhất ${cmin}.)`, id, { g });
        if (g < kyLuc) {
          ghi(7, `g = ${g} < kỷ lục ${soHoacVoCung(kyLuc)}: nhánh này còn có thể tốt hơn, đi tiếp Try(${i + 2}).`, id, { g });
          Try(i + 1, id);
        } else {
          soCat++;
          danhDau(id, "cat");
          ghi(8, `g = ${g} ≥ kỷ lục ${kyLuc}: dù đi tiếp thế nào cũng không rẻ hơn kỷ lục → CẮT NHÁNH.`, id, { g });
        }
      } else {
        ghi(6, `Chưa đi hết, gọi Try(${i + 2}).`, id);
        Try(i + 1, id);
      }

      S -= c; daDi[j] = false; x.length = i;
      ghi(9, `Quay lui: bỏ thành phố ${j + 1} khỏi hành trình, S = ${S}.`, chaId);
    }
  }
  Try(1, 0);

  const soSanh = nhanhCan
    ? ` Cây tìm kiếm có ${cay.length} nút, đã cắt ${soCat} nhánh. Vét cạn sẽ phải xét ${soNutDayDu} nút.`
    : ` Vét cạn đã xét toàn bộ ${cay.length} nút của cây tìm kiếm. Thử chọn "Nhánh cận" để thấy số nút giảm.`;
  ghi(null, toiUu
    ? `Xong! Hành trình tốt nhất: ${tenHanhTrinh([...toiUu, s])}, chi phí ${kyLuc}.` + soSanh
    : `Không có hành trình nào đi qua đủ ${n} thành phố rồi quay về.`, -1, { xong: true, soNutDayDu });
  return steps;
};

function tspThamLam(mt, s) {
  const n = mt.length;
  const steps = [];
  const x = [s], daDi = Array(n).fill(false); daDi[s] = true;
  let S = 0, u = s;
  const ghi = (line, msg, them = {}) =>
    steps.push({ line, msg, state: { loai: "tsp", thamLam: true, n, mt, s, x: x.slice(), S, u, ...them } });

  ghi(0, `Xuất phát từ thành phố ${s + 1}.`);
  for (let i = 1; i < n; i++) {
    ghi(1, `Chọn thành phố thứ ${i + 1} của hành trình.`);
    let j = -1;
    for (let v = 0; v < n; v++) if (!daDi[v] && mt[u][v] > 0 && (j < 0 || mt[u][v] < mt[u][j])) j = v;
    if (j < 0) {
      ghi(2, `Từ ${u + 1} không còn đường đến thành phố nào chưa đi: cách tham lam bị kẹt, không tìm được hành trình.`, { xong: true });
      return steps;
    }
    const ungVien = [];
    for (let v = 0; v < n; v++) if (!daDi[v] && mt[u][v] > 0) ungVien.push(`${v + 1} (${mt[u][v]})`);
    ghi(2, `Các thành phố chưa đi từ ${u + 1}: ${ungVien.join(", ")}. Gần nhất là ${j + 1}.`, { thu: [u, j] });
    S += mt[u][j]; x.push(j); daDi[j] = true;
    ghi(3, `Đi ${u + 1} → ${j + 1} mất ${mt[u][j]}, S = ${S}.`);
    u = j;
  }
  if (!(mt[u][s] > 0)) {
    ghi(4, `Không có đường từ ${u + 1} quay về ${s + 1}: không tìm được hành trình.`, { xong: true });
    return steps;
  }
  S += mt[u][s];
  ghi(4, `Quay về ${s + 1}: S = S + c[${u + 1}][${s + 1}] = ${S}.`, { quayVe: true });
  const tot = tspToiUu(mt, s);
  ghi(5, `Xong! Hành trình tham lam: ${tenHanhTrinh([...x, s])}, chi phí ${S}. `
    + (tot == null ? "" : tot === S ? `Lần này trùng với chi phí tối ưu (${tot}).`
      : `Nhưng chi phí tối ưu thật sự là ${tot}: cách tham lam nhanh nhưng KHÔNG đảm bảo tối ưu.`),
    { quayVe: true, xong: true, toiUuThat: tot });
  return steps;
}

// Hàm vẽ
VE.tsp = function (step) {
  const s = step.state;
  const { n, mt } = s;
  const doiXung = laDoiXung(mt);

  // Cạnh trên hành trình đang xây và hành trình kỷ lục
  const tren = new Set(), totNhat = new Set();
  for (let k = 1; k < s.x.length; k++) tren.add(s.x[k - 1] + "-" + s.x[k]);
  if (s.quayVe && s.x.length === n) tren.add(s.x[n - 1] + "-" + s.s);
  if (s.toiUu) {
    for (let k = 1; k < n; k++) totNhat.add(s.toiUu[k - 1] + "-" + s.toiUu[k]);
    totNhat.add(s.toiUu[n - 1] + "-" + s.s);
  }
  const co = (set, u, v) => set.has(u + "-" + v) || (doiXung && set.has(v + "-" + u));
  const lopCanh = (u, v) =>
    s.thu && ((s.thu[0] === u && s.thu[1] === v) || (doiXung && s.thu[0] === v && s.thu[1] === u)) ? "dang-xet"
    : co(tren, u, v) ? "duong"
    : co(totNhat, u, v) ? "toi-uu" : "";
  const thuTu = new Map(s.x.map((c, k) => [c, k + 1]));
  const doThi = veDoThi({
    n, mt, coHuong: !doiXung,
    nhanCanh: doiXung && n <= 6,
    chiCanhTo: n > 6 || !doiXung,
    lopDinh: i => (i === s.x[s.x.length - 1] && !s.xong ? "hien-tai" : thuTu.has(i) ? "da-tham" : ""),
    phuDinh: i => (thuTu.has(i) ? `#${thuTu.get(i)}` : ""),
    lopCanh
  });

  // Ma trận chi phí, tô ô đang dùng
  const oDangDung = s.thu ? s.thu[0] + "-" + s.thu[1] : "";
  const bang = n <= 10 ? `
    <table class="bang-mt">
      <tr><th></th>${mt.map((_, j) => `<th>${j + 1}</th>`).join("")}</tr>
      ${mt.map((hang, i) => `<tr><th>${i + 1}</th>${hang.map((c, j) =>
        `<td class="${i === j ? "cheo" : oDangDung === i + "-" + j ? "dang-xet" : tren.has(i + "-" + j) ? "duong" : ""}">${i === j ? "–" : c || "·"}</td>`).join("")}</tr>`).join("")}
    </table>` : "";

  // Cây tìm kiếm (nhánh cận / vét cạn)
  let cayHTML = "";
  if (s.cay) {
    const tong = s.cay.length;
    if (tong > TSP_SO_NUT_VE) {
      cayHTML = `<p class="viz-note">Cây tìm kiếm có ${tong} nút, quá lớn để vẽ.</p>`;
    } else {
      const { x: viTriX, soLa, doSau } = boTriCay(s.cay);
      const duongDi = new Set();
      for (let id = s.nut; id >= 0; id = s.cay[id].cha) duongDi.add(id);
      const kc = 30, ht = 50, r = 12;
      const W = Math.max(soLa * kc, 200), H = (doSau + 1) * ht + 8;
      const px = id => viTriX[id] * kc + kc / 2 + (W - soLa * kc) / 2;
      const py = id => s.cay[id].sau * ht + r + 6;
      let canh = "", nut = "";
      for (let id = 1; id < tong; id++) {
        const daCo = id < s.soNut;
        canh += `<line x1="${px(s.cay[id].cha)}" y1="${py(s.cay[id].cha)}" x2="${px(id)}" y2="${py(id)}"
                   class="cay-canh ${!daCo ? "chua" : duongDi.has(id) ? "tren" : "da"}"/>`;
      }
      for (let id = 0; id < tong; id++) {
        const nd = s.cay[id], daCo = id < s.soNut;
        const dau = nd.dau && nd.dau.luc <= s.suKien ? nd.dau.loai : "";
        const lop = !daCo ? "chua" : id === s.nut ? "hien-tai" : dau === "cat" ? "cat" : dau === "ky-luc" ? "kq"
          : duongDi.has(id) ? "tren" : "da";
        nut += `<g class="cay-nut ${lop}"><circle cx="${px(id)}" cy="${py(id)}" r="${r}"/>
                <text x="${px(id)}" y="${py(id) + 4}">${nd.nhan}</text>
                ${daCo && dau === "cat" ? `<text class="dau-cat" x="${px(id)}" y="${py(id) + r + 12}">✂</text>` : ""}</g>`;
      }
      cayHTML = `<div class="tsp-cay"><span class="dem-tieu-de">Cây tìm kiếm (mỗi nút là 1 thành phố được chọn)</span>
        <svg class="cay-svg" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="Cây tìm kiếm">${canh}${nut}</svg>
        <div class="chu-thich"><span><i class="cham hien-tai"></i>đang xét</span><span><i class="cham tren"></i>hành trình đang xây</span>
        <span><i class="cham xong"></i>lập kỷ lục</span>${s.nhanhCan ? `<span><i class="cham cat"></i>bị cắt nhánh ✂</span>` : ""}</div></div>`;
    }
  }

  return `
    <div class="hanoi-info">
      <span class="pill">Hành trình: <b>${tenHanhTrinh(s.quayVe ? [...s.x, s.s] : s.x)}</b></span>
      <span class="pill">S = <b>${s.T ?? s.S}</b></span>
      ${s.g != null ? `<span class="pill">Cận dưới g = <b>${s.g}</b></span>` : ""}
      ${!s.thamLam ? `<span class="pill hl">Kỷ lục: <b>${soHoacVoCung(s.kyLuc)}</b></span>` : ""}
      ${s.nhanhCan ? `<span class="pill">Đã cắt: <b>${s.soCat}</b> nhánh</span>` : ""}
    </div>
    <div class="dt-hang">${doThi}${bang}</div>
    ${s.toiUu ? `<p class="viz-note">Nét đứt xanh lá: hành trình kỷ lục hiện tại ${tenHanhTrinh([...s.toiUu, s.s])} (${s.kyLuc}).</p>` : ""}
    ${cayHTML}`;
};

// Lý thuyết
ALGORITHMS.find(a => a.id === "tsp").lyThuyet = `
  <p><b>Bài toán (slide):</b> có n thành phố 1, 2, ..., n. Người du lịch xuất phát từ một thành phố, muốn đi thăm tất cả
     các thành phố, mỗi thành phố đúng một lần, rồi quay về thành phố xuất phát. Biết c[i][j] là chi phí đi từ i đến j.
     Tìm hành trình có tổng chi phí nhỏ nhất.</p>
  <p>Mỗi hành trình ứng với một hoán vị của n − 1 thành phố còn lại, nên có (n − 1)! hành trình.
     Với n = 11 đã có hơn 3,6 triệu hành trình, vét cạn rất chậm. TSP thuộc lớp bài toán NP-khó.</p>

  <h3>Phương pháp nhánh cận</h3>
  <p>Dùng thuật toán quay lui để xây hành trình x[1], x[2], ..., x[n] với x[1] là thành phố xuất phát, đồng thời ghi nhớ:</p>
  <ul>
    <li><b>S:</b> chi phí của hành trình bộ phận đang xây.</li>
    <li><b>Kỷ lục:</b> chi phí của hành trình tốt nhất đã tìm được (ban đầu là ∞).</li>
    <li><b>Cận dưới g:</b> ước lượng chi phí nhỏ nhất có thể đạt được nếu đi tiếp theo nhánh hiện tại.</li>
  </ul>
  <p>Gọi cmin là chi phí nhỏ nhất giữa hai thành phố khác nhau. Khi đã chọn được i thành phố, còn phải đi thêm
     n − i + 1 đoạn đường (kể cả đoạn quay về), mỗi đoạn tốn ít nhất cmin, nên:</p>
  <p style="text-align:center"><b>g = S + (n − i + 1) × cmin</b></p>
  <p>Nếu g ≥ kỷ lục thì mọi hành trình mở rộng từ nhánh này đều không thể rẻ hơn kỷ lục, nên <b>cắt bỏ</b> cả nhánh,
     không cần duyệt tiếp. Cận càng sát thực tế thì càng cắt được nhiều nhánh.</p>

  <h3>Phương pháp láng giềng gần nhất (tham lam)</h3>
  <p>Đang ở thành phố nào thì đi tới thành phố gần nhất chưa đi. Chỉ cần O(n²) phép tính nên rất nhanh,
     nhưng kết quả <b>không đảm bảo tối ưu</b>. Thường dùng để có ngay một hành trình khá tốt, hoặc làm kỷ lục ban đầu cho nhánh cận.</p>

  <h3>So sánh quy hoạch động và nhánh cận</h3>
  <table class="table">
    <thead><tr><th></th><th>Quy hoạch động</th><th>Nhánh cận</th></tr></thead>
    <tbody>
      <tr><td>Ý tưởng</td><td>Chia thành bài toán con, lưu kết quả để dùng lại</td><td>Quay lui, dùng cận để loại bớt nhánh không triển vọng</td></tr>
      <tr><td>Kết quả</td><td>Luôn tối ưu</td><td>Luôn tối ưu</td></tr>
      <tr><td>Thời gian</td><td>Xác định trước, VD ba lô O(n·b)</td><td>Phụ thuộc dữ liệu và độ tốt của cận; xấu nhất vẫn O(n!)</td></tr>
      <tr><td>Bộ nhớ</td><td>Tốn bộ nhớ cho bảng phương án</td><td>Ít bộ nhớ, chỉ lưu hành trình đang xây và kỷ lục</td></tr>
      <tr><td>Phù hợp khi</td><td>Bài toán con gối nhau, số trạng thái không quá lớn</td><td>Tìm được hàm cận tốt, dễ tính</td></tr>
      <tr><td>Ví dụ trong đề tài</td><td>Fibonacci, xếp ba lô</td><td>Người du lịch</td></tr>
    </tbody>
  </table>`;
