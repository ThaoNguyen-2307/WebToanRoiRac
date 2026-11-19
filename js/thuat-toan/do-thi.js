function docMaTran(mt, key = "matrix") {
  if (!Array.isArray(mt) || !mt.length || (mt.length === 1 && mt[0].length === 1 && !mt[0][0]))
    loiDuLieu(key, "Hãy nhập ma trận: mỗi dòng là 1 hàng, các số cách nhau bởi dấu cách.");
  const n = mt.length;
  if (n < 2) loiDuLieu(key, "Ma trận cần ít nhất 2 hàng (tức là ít nhất 2 đỉnh).");
  mt.forEach((hang, i) => {
    if (hang.length !== n)
      loiDuLieu(key, `Ma trận phải vuông n × n: có ${n} hàng nhưng hàng ${i + 1} có ${hang.length} số. (Kiểm tra dòng trống hoặc dấu cách thừa.)`);
    hang.forEach((x, j) => {
      if (!Number.isFinite(x))
        loiDuLieu(key, `Hàng ${i + 1}, cột ${j + 1} không phải là số. Các số cách nhau bởi dấu cách, không dùng dấu phẩy.`);
      if (x < 0)
        loiDuLieu(key, `Hàng ${i + 1}, cột ${j + 1} là số âm (${x}). Chi phí / trọng số phải lớn hơn hoặc bằng 0.`);
    });
  });
  return mt;
}

function kiemTraDinh(v, n, key, ten) {
  if (v > n) loiDuLieu(key, `${ten} phải từ 1 đến ${n}, vì ma trận có ${n} đỉnh. Bạn nhập ${v}.`);
}

const laDoiXung = mt => mt.every((hang, i) => hang.every((x, j) => x === mt[j][i]));

const dinhKe = (mt, u) => mt[u].map((w, v) => v).filter(v => v !== u && mt[u][v] > 0);

function viTriDinh(n, W, H, R) {
  return Array.from({ length: n }, (_, i) => {
    const goc = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: W / 2 + R * Math.cos(goc), y: H / 2 + R * Math.sin(goc) };
  });
}

function veDoThi({ n, mt, coHuong, lopDinh = () => "", phuDinh = () => "", lopCanh = () => "", nhanCanh = true, chiCanhTo = false }) {
  const W = 420, H = n <= 6 ? 300 : 360, R = Math.min(W, H) / 2 - 42, r = n <= 10 ? 17 : 13;
  const p = viTriDinh(n, W, H, R);

  function duong(u, v, cong) {
    const dx = p[v].x - p[u].x, dy = p[v].y - p[u].y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const x1 = p[u].x + ux * r, y1 = p[u].y + uy * r;
    const x2 = p[v].x - ux * (r + (coHuong ? 3 : 0)), y2 = p[v].y - uy * (r + (coHuong ? 3 : 0));
    const cx = (x1 + x2) / 2 + nx * cong, cy = (y1 + y2) / 2 + ny * cong;
    // Vị trí ghi trọng số: giữa cạnh, lệch sang một bên
    const tx = (x1 + x2) / 2 + nx * (cong ? cong * 0.75 : 0), ty = (y1 + y2) / 2 + ny * (cong ? cong * 0.75 : 0);
    return { d: cong ? `M${x1},${y1} Q${cx},${cy} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`, tx, ty };
  }

  let canh = "", nhan = "";
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (u === v || !(mt[u][v] > 0)) continue;
      if (!coHuong && v < u) continue;                         // vô hướng: mỗi cặp vẽ 1 lần
      const lop = lopCanh(u, v) || (!coHuong ? lopCanh(v, u) : "");
      if (chiCanhTo && !lop) continue;
      const haiChieu = coHuong && mt[v][u] > 0;
      const { d, tx, ty } = duong(u, v, haiChieu ? 14 : 0);
      canh += `<path d="${d}" class="dt-canh ${lop}" ${coHuong ? `marker-end="url(#muiTen${lop ? "-" + lop.split(" ")[0] : ""})"` : ""}/>`;
      if (nhanCanh) nhan += `<text x="${tx}" y="${ty + 4}" class="dt-trong-so ${lop}">${mt[u][v]}</text>`;
    }
  }

  const dinh = p.map((q, i) => {
    const phu = phuDinh(i);
    // Chữ phụ đặt ra phía ngoài vòng tròn để không đè lên cạnh
    const goc = Math.atan2(q.y - H / 2, q.x - W / 2);
    const px = q.x + Math.cos(goc) * (r + 15), py = q.y + Math.sin(goc) * (r + 15) + 4;
    return `<g class="dt-dinh ${lopDinh(i)}"><circle cx="${q.x}" cy="${q.y}" r="${r}"/>
      <text x="${q.x}" y="${q.y + 5}">${i + 1}</text>
      ${phu !== "" ? `<text class="dt-phu" x="${px}" y="${py}">${phu}</text>` : ""}</g>`;
  }).join("");

  // Mũi tên cho đồ thị có hướng (mỗi màu cạnh 1 loại mũi tên)
  const muiTen = ["", "cay", "dang-xet", "duong", "toi-uu", "hien-tai"].map(ten =>
    `<marker id="muiTen${ten ? "-" + ten : ""}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
       <path d="M0,0 L10,5 L0,10 z" class="dt-mui ${ten}"/></marker>`).join("");

  return `<svg class="dt-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Đồ thị ${n} đỉnh">
    <defs>${muiTen}</defs>${canh}${nhan}${dinh}</svg>`;
}

// Hiện ∞ cho vô cùng
const soHoacVoCung = x => (x === Infinity ? "∞" : String(x));
