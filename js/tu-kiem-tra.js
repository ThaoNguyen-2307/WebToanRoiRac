const HOI = {};

function xepDapAn(lua, dung, i) {
  const k = i % lua.length;
  const moi = [...lua.slice(k), ...lua.slice(0, k)];
  const dsDung = [].concat(dung).map(d => (d - k + lua.length) % lua.length);
  return { lua: moi, dung: dsDung };
}
const khongTrung = ds => [...new Set(ds.map(String))];

// Câu hỏi của từng thuật toán
const TEN_COC_KT = ["A", "B", "C"];

HOI.hanoi = {
  cach: 0,
  tao(steps, i) {
    const s = steps[i].state, truoc = steps[i - 1]?.state;
    if (!s.chuyen || !truoc) return null;
    const hopLe = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const tren = truoc.coc[a].at(-1), duoi = truoc.coc[b].at(-1);
      if (a !== b && tren && (!duoi || duoi > tren)) hopLe.push({ a, b, dia: tren });
    }
    if (hopLe.length < 2) return null;
    return {
      hoi: `Lần chuyển thứ ${s.soLan}: chuyển đĩa nào, từ cọc nào sang cọc nào?`,
      lua: hopLe.map(m => `Đĩa ${m.dia}: ${TEN_COC_KT[m.a]} → ${TEN_COC_KT[m.b]}`),
      dung: hopLe.findIndex(m => m.a === s.chuyen.tu && m.b === s.chuyen.den)
    };
  }
};

// Xếp hậu: ô đang thử có đặt được không?
HOI.nhau = {
  cach: 1,
  tao(steps, i) {
    const st = steps[i], t = st.state.thu;
    if (st.line !== 2 || !t) return null;
    return {
      hoi: `Ô (hàng ${t.r}, cột ${t.c}) có đặt được quân hậu không?`,
      lua: ["Đặt được: ô an toàn", "Không được: bị quân hậu khác ăn"],
      dung: t.ok ? 0 : 1
    };
  }
};

// Liệt kê: cấu hình tiếp theo được in ra là gì?
HOI.lietke = {
  cach: 0,
  tao(steps, i) {
    const truoc = steps[i - 1]?.state;
    if (!truoc?.vuaIn) return null;
    const kq = steps[i].state.ketQua, k = truoc.soKQ;          // ketQua là danh sách đầy đủ các cấu hình
    if (k >= kq.length) return null;
    const hien = c => "(" + (c.includes(" ") ? c.split(" ") : c.split("")).join(", ") + ")";
    const khac = [kq[k + 1], kq[k + 2], kq[k - 2], kq[k + 3], kq[0]].filter(c => c && c !== kq[k]);
    const lua = khongTrung([kq[k], ...khac]).slice(0, 4);
    if (lua.length < 2) return null;
    return { hoi: `Vừa in cấu hình thứ ${k}. Cấu hình thứ ${k + 1} được in ra là gì?`, lua: lua.map(hien), dung: 0 };
  }
};

// Fibonacci: giá trị fib(k) / có trong bảng nhớ chưa / F[i]
HOI.fibonacci = {
  cach: 1,
  tao(steps, i) {
    const st = steps[i], s = st.state;
    if (s.loai === "bang") {
      if (st.line !== 3) return null;
      const k = s.i, dung = BigInt(s.F[k]), a = BigInt(s.F[k - 1]), b = BigInt(s.F[k - 2]);
      const lua = khongTrung([dung, a, dung + 1n, a * 2n, b]).slice(0, 4);
      return { hoi: `F[${k}] = F[${k - 1}] + F[${k - 2}] = ${a} + ${b} bằng bao nhiêu?`, lua, dung: 0 };
    }
    const ketQua = st.msg.match(/^fib\((\d+)\) = fib\(\d+\) \+ fib\(\d+\) = (\d+) \+ (\d+) = (\d+)/);
    if (ketQua) {
      const [, k, x, y, kq] = ketQua;
      const lua = khongTrung([kq, x, BigInt(kq) + 1n, BigInt(x) * 2n]).slice(0, 4);
      return { hoi: `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) bằng bao nhiêu?`, lua, dung: 0 };
    }
    const nho = st.msg.match(/^fib\((\d+)\) (đã có|chưa có) trong bảng nhớ/);
    if (nho) return {
      hoi: `fib(${nho[1]}) đã có trong bảng nhớ chưa?`,
      lua: ["Có rồi: lấy ra dùng luôn", "Chưa có: phải gọi đệ quy để tính"],
      dung: nho[2] === "đã có" ? 0 : 1
    };
    return null;
  }
};

// Xếp ba lô: ô F[i][w] bằng bao nhiêu?
HOI.balo = {
  cach: 2,
  tao(steps, i) {
    const st = steps[i], s = st.state;
    if (st.line !== 5 || s.i == null || s.truyVet) return null;
    if (s.loai2 && !st.msg.startsWith("F[")) return null;     // ba lô 2 chi tiết: mỗi k 1 bước, chỉ hỏi ở bước tổng kết
    if (!s.loai2 && !st.msg.startsWith("F[") && !/nên/.test(st.msg)) return null;
    const a = s.a[s.i - 1], c = s.c[s.i - 1];
    const khongLay = s.F[s.i - 1][s.w];
    const lay = s.w >= a ? s.F[s.i - 1][s.w - a] + c : null;
    const lua = khongTrung([s.giaTriO, khongLay, lay, s.giaTriO + c].filter(x => x != null)).slice(0, 4);
    if (lua.length < 2) return null;
    return { hoi: `F[${s.i}][${s.w}] (dùng vật 1..${s.i}, sức chứa ${s.w}) bằng bao nhiêu?`, lua, dung: 0 };
  }
};

HOI.tsp = {
  cach: 0,
  tao(steps, i) {
    const st = steps[i], s = st.state, truoc = steps[i - 1]?.state;
    if (s.thamLam) {
      if (st.line !== 2 || !s.thu) return null;
      const u = s.thu[0], daDi = new Set(truoc.x);
      const ung = s.mt[u].map((c, v) => v).filter(v => !daDi.has(v) && s.mt[u][v] > 0);
      if (ung.length < 2) return null;
      return {
        hoi: `Đang ở thành phố ${u + 1}. Theo cách tham lam, đi tiếp tới thành phố nào?`,
        lua: ung.map(v => `Thành phố ${v + 1} (chi phí ${s.mt[u][v]})`),
        dung: ung.indexOf(s.thu[1])
      };
    }
    if ((st.line === 7 || st.line === 8) && s.g != null) return {
      hoi: `Cận dưới g = ${s.g}, kỷ lục hiện tại = ${soHoacVoCung(truoc.kyLuc)}. Nhánh này sẽ thế nào?`,
      lua: ["Đi tiếp: nhánh này còn có thể tốt hơn", "Cắt nhánh: không thể rẻ hơn kỷ lục"],
      dung: st.line === 7 ? 0 : 1
    };
    if (st.line === 5 && s.T != null) return {
      hoi: `Hành trình vừa đi hết có chi phí T = ${s.T}, kỷ lục = ${soHoacVoCung(truoc.kyLuc)}. Có cập nhật kỷ lục không?`,
      lua: ["Có: T nhỏ hơn kỷ lục", "Không: T không nhỏ hơn kỷ lục"],
      dung: s.T < truoc.kyLuc ? 0 : 1
    };
    return null;
  }
};

// BFS / DFS: đỉnh nào được thăm tiếp theo?
HOI.bfsdfs = {
  cach: 0,
  tao(steps, i) {
    const st = steps[i], s = st.state, truoc = steps[i - 1]?.state;
    const laTham = s.loai === "bfs" ? st.line === 3 : st.line === 1;
    if (!laTham || !truoc || !truoc.thuTu.length) return null;   // bỏ qua đỉnh xuất phát
    const dung = s.thuTu.at(-1);
    const khac = [];
    for (let v = 0; v < s.n; v++) if (!truoc.daTham[v] && v !== dung) khac.push(v);
    if (!khac.length) return null;
    const lua = [dung, ...khac.slice(0, 3)];
    return {
      hoi: s.loai === "bfs" ? "Đỉnh nào được lấy ra khỏi hàng đợi và thăm tiếp theo?" : "DFS sẽ thăm đỉnh nào tiếp theo?",
      lua: lua.map(v => `Đỉnh ${v + 1}`), dung: 0
    };
  }
};

// Dijkstra: chọn đỉnh nào để chốt?
HOI.dijkstra = {
  cach: 0,
  tao(steps, i) {
    const st = steps[i], s = st.state;
    if (st.line !== 2 || s.u == null) return null;
    const ung = s.d.map((x, v) => v).filter(v => !s.chot[v]);
    if (ung.filter(v => s.d[v] !== Infinity).length < 2) return null;    // chỉ 1 đỉnh có d hữu hạn thì hỏi làm gì
    const lua = ung.slice(0, 5);
    if (!lua.includes(s.u)) lua[lua.length - 1] = s.u;
    const nhoNhat = Math.min(...ung.map(v => s.d[v]));
    return {
      hoi: "Đỉnh nào được chọn tiếp theo (chưa chốt, có d nhỏ nhất)?",
      lua: lua.map(v => `Đỉnh ${v + 1} (d = ${soHoacVoCung(s.d[v])})`),
      dung: lua.map((v, k) => (s.d[v] === nhoNhat ? k : -1)).filter(k => k >= 0)   // trùng d nhỏ nhất thì chọn đỉnh nào cũng đúng
    };
  }
};

// Giao diện và điều khiển
const KT = { bat: false, cauHoi: null, daTraLoi: new Map(), dung: 0, tong: 0, dangHoi: -1 };

function ktTaoCauHoi() {
  KT.cauHoi = new Map(); KT.daTraLoi = new Map(); KT.dung = 0; KT.tong = 0; KT.dangHoi = -1;
  const g = HOI[currentAlgo?.id];
  if (!g || !sim.steps.length) return ktCapNhatDiem();
  let dem = 0;
  for (let i = 1; i < sim.steps.length; i++) {
    let q = null;
    try { q = g.tao(sim.steps, i); } catch (e) { q = null; }
    if (!q || q.lua.length < 2 || [].concat(q.dung).some(d => d < 0)) continue;
    if (dem++ % (g.cach + 1) === 0) KT.cauHoi.set(i, { ...q, ...xepDapAn(q.lua.map(String), q.dung, i) });
  }
  ktCapNhatDiem();
}

function ktXoa() {
  KT.cauHoi = null; KT.daTraLoi = new Map(); KT.dung = 0; KT.tong = 0; KT.dangHoi = -1;
  ktAnHop();
  ktCapNhatDiem();
}

function ktChan(i) {
  if (!KT.bat || !KT.cauHoi || i !== sim.index + 1) return false;
  const q = KT.cauHoi.get(i);
  if (!q || KT.daTraLoi.has(i)) return false;
  stopAutoPlay();
  if (KT.dangHoi !== i) ktVeHop(i, q);
  document.querySelector("#hopHoi .kt-lua")?.focus();
  return true;
}

function ktVeHop(i, q) {
  KT.dangHoi = i;
  const hop = document.getElementById("hopHoi");
  hop.innerHTML = `
    <div class="kt-dau"><span class="kt-nhan">Tự kiểm tra</span><span class="kt-goi-y">Chọn đáp án (hoặc bấm phím 1–${q.lua.length})</span></div>
    <p class="kt-hoi">${q.hoi}</p>
    <div class="kt-ds">${q.lua.map((l, k) => `<button type="button" class="kt-lua" data-k="${k}"><b>${k + 1}</b>${l}</button>`).join("")}</div>
    <div class="kt-ket-qua" hidden></div>`;
  hop.hidden = false;
  hop.querySelectorAll(".kt-lua").forEach(nut => nut.onclick = () => ktTraLoi(i, +nut.dataset.k));
}

function ktTraLoi(i, k) {
  if (KT.daTraLoi.has(i)) return;
  const q = KT.cauHoi.get(i);
  const dung = q.dung.includes(k);
  KT.daTraLoi.set(i, dung);
  KT.tong++; if (dung) KT.dung++;
  ktCapNhatDiem();

  const hop = document.getElementById("hopHoi");
  hop.querySelectorAll(".kt-lua").forEach((nut, j) => {
    nut.disabled = true;
    if (q.dung.includes(j)) nut.classList.add("dung");
    else if (j === k) nut.classList.add("sai");
  });
  const kq = hop.querySelector(".kt-ket-qua");
  kq.hidden = false;
  kq.className = "kt-ket-qua " + (dung ? "dung" : "sai");
  kq.innerHTML = `<b>${dung ? "✓ Chính xác!" : "✗ Chưa đúng."}</b> ${sim.steps[i].msg}
    <button type="button" class="btn primary sm kt-tiep">Tiếp tục ▶</button>`;
  const tiep = kq.querySelector(".kt-tiep");
  tiep.onclick = () => goToStep(i);
  tiep.focus();
}

function ktAnHop() {
  const hop = document.getElementById("hopHoi");
  if (hop) { hop.hidden = true; hop.innerHTML = ""; }
  KT.dangHoi = -1;
}

function ktCapNhatDiem() {
  const o = document.getElementById("diemKT");
  if (!o) return;
  const soCau = KT.cauHoi ? KT.cauHoi.size : 0;
  o.hidden = !KT.bat;
  o.textContent = KT.tong ? `Đúng ${KT.dung}/${KT.tong}` + (KT.tong === soCau ? " · xong!" : "")
    : soCau ? `${soCau} câu hỏi` : (sim.steps.length ? "Không có câu hỏi" : "");
}

// Gọi sau khi vẽ trang thuật toán
function ktGan() {
  const chk = document.getElementById("chkKiemTra");
  if (!chk) return;
  const coHoi = !!HOI[currentAlgo.id];
  chk.closest("label").hidden = !coHoi;
  chk.checked = KT.bat && coHoi;
  chk.onchange = () => {
    KT.bat = chk.checked;
    if (KT.bat && sim.steps.length && !KT.cauHoi) ktTaoCauHoi();
    if (!KT.bat) ktAnHop();
    ktCapNhatDiem();
  };
  ktXoa();
}

// Phím 1–4 để chọn đáp án, Enter để tiếp tục
document.addEventListener("keydown", ev => {
  if (KT.dangHoi < 0 || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.target.closest?.("input, textarea, select")) return;
  const k = Number(ev.key) - 1;
  const q = KT.cauHoi?.get(KT.dangHoi);
  if (q && !KT.daTraLoi.has(KT.dangHoi) && k >= 0 && k < q.lua.length) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    ktTraLoi(KT.dangHoi, k);
  }
}, true);
