const OMT_N_MIN = 2;       // ít nhất 2 đỉnh
const OMT_N_MAX = 12;
const OMT_GIA_TRI_MAX = 999;

function docChuMaTran(chu) {
  const dong = String(chu).split("\n").map(d => d.trim()).filter(Boolean);   // bỏ các dòng trống
  if (!dong.length) return { loi: "Ma trận đang trống. Mỗi dòng là 1 hàng, các số cách nhau bởi dấu cách." };
  const mt = [];
  for (let i = 0; i < dong.length; i++) {
    const so = dong[i].split(/\s+/);
    const hang = [];
    for (let j = 0; j < so.length; j++) {
      const t = so[j];
      const viTri = `Hàng ${i + 1}, cột ${j + 1}`;
      if (/^\d+$/.test(t)) { hang.push(Number(t)); continue; }
      if (/^-\d+$/.test(t)) return { loi: `${viTri} là số âm (${t}). Chỉ được nhập số ≥ 0.`, i, j };
      if (/[,;]/.test(t)) return { loi: `${viTri} có dấu phẩy "${t}". Các số phải cách nhau bởi dấu cách, không dùng dấu phẩy.`, i, j };
      if (/^\d*[.]\d+$/.test(t)) return { loi: `${viTri} là số thập phân (${t}). Chỉ được nhập số nguyên.`, i, j };
      return { loi: `${viTri} "${t}" không phải là số. Không được nhập chữ hay ký tự đặc biệt.`, i, j };
    }
    mt.push(hang);
  }
  const n = mt.length;
  if (n < OMT_N_MIN) return { loi: "Ma trận cần ít nhất 2 hàng (2 đỉnh)." };
  const hangLech = mt.findIndex(h => h.length !== n);
  if (hangLech >= 0)
    return { loi: `Ma trận phải vuông n × n: có ${n} hàng nhưng hàng ${hangLech + 1} có ${mt[hangLech].length} số.` };
  return { mt };
}

const chuMaTran = mt => mt.map(h => h.join(" ")).join("\n");
const doiXungMT = mt => mt.every((h, i) => h.every((x, j) => i === j || x === mt[j][i]));

function oMaTranHTML(inp) {
  const goiY = inp.hint ? `<small class="hint">${inp.hint}</small>` : "";
  return `
    <div class="field o-ma-tran" data-key="${inp.key}">
      <span>${inp.label}</span>
      <div class="omt-thanh">
        <span class="omt-n">Số đỉnh
          <button type="button" class="omt-nut-nho" data-omt="bot" aria-label="Bớt 1 đỉnh">−</button>
          <b class="omt-so">?</b>
          <button type="button" class="omt-nut-nho" data-omt="them" aria-label="Thêm 1 đỉnh">+</button>
        </span>
        <label class="omt-chk" title="Sửa ô (i, j) thì ô (j, i) tự đổi theo: đồ thị vô hướng">
          <input type="checkbox" data-omt="doixung"> Đối xứng</label>
      </div>
      <div class="omt-khung-luoi"><table class="omt-luoi"></table></div>
      <textarea name="${inp.key}" rows="6" spellcheck="false" hidden>${inp.value}</textarea>
      <div class="omt-nut">
        <button type="button" class="btn sm" data-omt="ngaunhien">🎲 Ngẫu nhiên</button>
        <button type="button" class="btn sm" data-omt="xoa">Xóa hết</button>
        <button type="button" class="btn sm" data-omt="chu">✎ Nhập dạng chữ</button>
      </div>
      <small class="hint omt-goi-y-chu" hidden>Mỗi dòng là 1 hàng, các số cách nhau bởi dấu cách. Có thể dán cả ma trận vào đây.</small>
      ${goiY}
      <div class="omt-xem"></div>
    </div>`;
}

function ganOMaTran(algo) {
  document.querySelectorAll("#inputForm .o-ma-tran").forEach(khung => {
    const inp = algo.inputs.find(x => x.key === khung.dataset.key);
    const oChu = khung.querySelector("textarea");
    const st = { mt: null, cheDoChu: false, doiXung: true };   // trạng thái của ô này
    khung._omt = st;
    const $ = sel => khung.querySelector(sel);

    const baoLoi = (loi, oSai) => setTimeout(() => {
      baoLoiNhap(loi ? { key: inp.key, loi } : null);
      khung.querySelectorAll(".omt-o.sai").forEach(o => o.classList.remove("sai"));
      if (oSai) oSai.classList.add("sai");
    }, 0);

    function ghiXuong() {
      oChu.value = chuMaTran(st.mt);
      khung.closest("form").dispatchEvent(new Event("input", { bubbles: true }));
      veXemTruoc();
    }

    function veLuoi() {
      const n = st.mt.length;
      $(".omt-so").textContent = n;
      $('[data-omt="bot"]').disabled = n <= OMT_N_MIN;
      $('[data-omt="them"]').disabled = n >= OMT_N_MAX;
      $('[data-omt="doixung"]').checked = st.doiXung;
      $(".omt-luoi").innerHTML =
        `<tr><th></th>${st.mt.map((_, j) => `<th>${j + 1}</th>`).join("")}</tr>` +
        st.mt.map((hang, i) => `<tr><th>${i + 1}</th>${hang.map((x, j) => i === j
          ? `<td><input class="omt-o cheo" value="–" disabled aria-label="Ô (${i + 1}, ${j + 1}) đường chéo"></td>`
          : `<td><input class="omt-o ${x ? "co" : ""}" data-i="${i}" data-j="${j}" value="${x}" inputmode="numeric"
                 maxlength="3" autocomplete="off" aria-label="Hàng ${i + 1}, cột ${j + 1}"></td>`).join("")}</tr>`).join("");
    }

    function veXemTruoc() {
      const xem = $(".omt-xem");
      const kq = st.cheDoChu ? docChuMaTran(oChu.value) : { mt: st.mt };
      if (!kq.mt || typeof veDoThi !== "function") { xem.innerHTML = ""; return; }
      const mt = kq.mt, n = mt.length;
      xem.innerHTML = `<span class="omt-xem-tieu-de">Xem trước đồ thị (${n} đỉnh${doiXungMT(mt) ? ", vô hướng" : ", có hướng"})</span>` +
        veDoThi({ n, mt, coHuong: !doiXungMT(mt), nhanCanh: inp.ngauNhien?.kieu !== "01" && n <= 7,
                  chiCanhTo: false, lopCanh: () => "" });
    }

    function chuyenCheDo(chu) {
      st.cheDoChu = chu;
      $(".omt-thanh").hidden = chu;
      $(".omt-khung-luoi").hidden = chu;
      $('[data-omt="ngaunhien"]').hidden = chu;
      $('[data-omt="xoa"]').hidden = chu;
      oChu.hidden = !chu;
      $(".omt-goi-y-chu").hidden = !chu;
      $('[data-omt="chu"]').textContent = chu ? "▦ Nhập dạng bảng" : "✎ Nhập dạng chữ";
      if (chu) oChu.rows = Math.min(14, Math.max(4, (st.mt?.length || 4) + 1));
    }

    st.napLai = function () {
      const kq = docChuMaTran(oChu.value);
      if (kq.mt && kq.mt.length <= OMT_N_MAX) {
        st.mt = kq.mt.map((h, i) => h.map((x, j) => (i === j ? 0 : x)));
        st.doiXung = doiXungMT(st.mt);
        chuyenCheDo(false);
        veLuoi();
      } else {
        if (!st.mt) st.mt = [[0, 0], [0, 0]];
        chuyenCheDo(true);
      }
      veXemTruoc();
    };

    // Gõ vào 1 ô của bảng
    khung.addEventListener("input", ev => {
      const o = ev.target;
      if (o === oChu) {                                          // đang ở dạng chữ
        const kq = docChuMaTran(oChu.value);
        baoLoi(kq.loi || null);
        veXemTruoc();
        return;
      }
      if (!o.classList.contains("omt-o")) return;
      ev.stopPropagation();                                      // ghiXuong() sẽ báo cho form sau
      const i = +o.dataset.i, j = +o.dataset.j;
      const goc = o.value;
      let sach = goc.replace(/[^0-9]/g, "");                    // chỉ giữ chữ số
      if (sach.length > 1) sach = sach.replace(/^0+(?=\d)/, ""); // "007" -> "7"
      if (sach !== goc) o.value = sach;

      let loi = null;
      if (/[a-zA-ZÀ-ỹ]/.test(goc)) loi = `Hàng ${i + 1}, cột ${j + 1}: không được nhập chữ. Chỉ nhập số nguyên từ 0 đến ${OMT_GIA_TRI_MAX}.`;
      else if (goc.includes("-")) loi = `Hàng ${i + 1}, cột ${j + 1}: không được nhập số âm. Chỉ nhập số từ 0 đến ${OMT_GIA_TRI_MAX}.`;
      else if (/[.,]/.test(goc)) loi = `Hàng ${i + 1}, cột ${j + 1}: chỉ nhập số nguyên (không có dấu chấm, dấu phẩy).`;
      else if (sach !== goc.trim() && goc.trim() !== "") loi = `Hàng ${i + 1}, cột ${j + 1}: chỉ được nhập chữ số 0–9.`;

      const so = sach === "" ? 0 : Number(sach);
      st.mt[i][j] = so;
      o.classList.toggle("co", so > 0);
      if (st.doiXung) {
        st.mt[j][i] = so;
        const doiDien = khung.querySelector(`.omt-o[data-i="${j}"][data-j="${i}"]`);
        if (doiDien) { doiDien.value = sach === "" ? "0" : sach; doiDien.classList.toggle("co", so > 0); }
      }
      ghiXuong();
      if (loi) st.loiO = { o, loi };
      if (st.loiO && st.loiO.o === o) baoLoi(st.loiO.loi, o);
      else { st.loiO = null; baoLoi(null); }
    });

    // Ô để trống rồi rời đi -> tự điền 0
    khung.addEventListener("focusout", ev => {
      const o = ev.target;
      if (!o.classList?.contains("omt-o")) return;
      if (o.value === "") o.value = "0";
      if (st.loiO?.o === o) { st.loiO = null; o.classList.remove("sai"); }   // rời ô: thôi tô đỏ ô đó
    });

    // Chọn sẵn cả số trong ô khi bấm vào, gõ là thay luôn
    khung.addEventListener("focusin", ev => { if (ev.target.classList?.contains("omt-o")) ev.target.select(); });

    // Mũi tên lên/xuống, Enter: di chuyển giữa các ô
    khung.addEventListener("keydown", ev => {
      const o = ev.target;
      if (!o.classList?.contains("omt-o")) return;
      const i = +o.dataset.i, j = +o.dataset.j, n = st.mt.length;
      const di = { ArrowUp: [-1, 0], ArrowDown: [1, 0], Enter: [1, 0],
                   ArrowLeft: o.selectionStart === 0 ? [0, -1] : null,
                   ArrowRight: o.selectionEnd === o.value.length ? [0, 1] : null }[ev.key];
      if (!di) return;
      ev.preventDefault();
      let a = i, b = j;
      do { a += di[0]; b += di[1]; } while (a === b && a >= 0 && a < n);   // bỏ qua ô đường chéo
      khung.querySelector(`.omt-o[data-i="${a}"][data-j="${b}"]`)?.focus();
    });

    // Dán cả ma trận (nhiều số) vào 1 ô -> điền cả bảng
    khung.addEventListener("paste", ev => {
      const o = ev.target;
      if (!o.classList?.contains("omt-o")) return;
      const chu = ev.clipboardData.getData("text");
      if (!/\s/.test(chu.trim())) return;                       // dán 1 số thì để trình duyệt tự xử lý
      ev.preventDefault();
      const kq = docChuMaTran(chu);
      if (kq.loi) return baoLoi("Không dán được: " + kq.loi);
      if (kq.mt.length > OMT_N_MAX) return baoLoi(`Ma trận dán vào có ${kq.mt.length} đỉnh, bảng chỉ hiện tối đa ${OMT_N_MAX}. Hãy dùng "Nhập dạng chữ".`);
      oChu.value = chuMaTran(kq.mt);
      st.napLai();
      ghiXuong();
      baoLoi(null);
    });

    // Các nút
    khung.addEventListener("click", ev => {
      const nut = ev.target.closest("[data-omt]");
      if (!nut || nut.tagName === "INPUT") return;
      const lenh = nut.dataset.omt;
      const n = st.mt.length;

      if (lenh === "them" && n < OMT_N_MAX) {
        st.mt.forEach(h => h.push(0));
        st.mt.push(Array(n + 1).fill(0));
      } else if (lenh === "bot" && n > OMT_N_MIN) {
        st.mt.pop();
        st.mt.forEach(h => h.pop());
      } else if (lenh === "xoa") {
        st.mt = st.mt.map(h => h.map(() => 0));
      } else if (lenh === "ngaunhien") {
        st.mt = maTranNgauNhien(n, inp.ngauNhien || { kieu: "trongSo", max: 20 });
        st.doiXung = true;
      } else if (lenh === "chu") {
        if (!st.cheDoChu) { oChu.value = chuMaTran(st.mt); chuyenCheDo(true); oChu.focus(); return; }
        // Từ dạng chữ quay về bảng: phải đúng định dạng
        const kq = docChuMaTran(oChu.value);
        if (kq.loi) return baoLoi(kq.loi);
        if (kq.mt.length > OMT_N_MAX)
          return baoLoi(`Ma trận có ${kq.mt.length} đỉnh, bảng chỉ hiện tối đa ${OMT_N_MAX} đỉnh. Hãy tiếp tục nhập dạng chữ.`);
        st.napLai();
        ghiXuong();
        return;
      } else return;
      veLuoi();
      ghiXuong();
      baoLoi(null);
    });

    // Bật "Đối xứng": chép nửa trên xuống nửa dưới
    $('[data-omt="doixung"]').addEventListener("change", ev => {
      ev.stopPropagation();
      st.doiXung = ev.target.checked;
      if (st.doiXung) {
        st.mt.forEach((h, i) => h.forEach((x, j) => { if (j > i) st.mt[j][i] = x; }));
        veLuoi();
        ghiXuong();
      }
    });

    st.napLai();
  });
}

function dongBoOMaTran() {
  document.querySelectorAll("#inputForm .o-ma-tran").forEach(k => k._omt?.napLai());
}

function maTranNgauNhien(n, { kieu, max = 20 }) {
  const mt = Array.from({ length: n }, () => Array(n).fill(0));
  const giaTri = () => (kieu === "01" ? 1 : 1 + Math.floor(Math.random() * max));
  const noi = (u, v) => { mt[u][v] = mt[v][u] = giaTri(); };
  if (kieu === "dayDu") {
    for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) noi(u, v);
    return mt;
  }
  const thuTu = [...Array(n).keys()].sort(() => Math.random() - 0.5);
  for (let k = 1; k < n; k++) noi(thuTu[k], thuTu[Math.floor(Math.random() * k)]);
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (!mt[u][v] && Math.random() < 0.3) noi(u, v);
  return mt;
}
