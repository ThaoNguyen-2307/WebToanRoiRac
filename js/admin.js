import { db, yeuCauAdmin, veThanhNguoiDung, e, anhDaiDien, ngayGio,
         tenCachDangNhap, loiTiengViet, thongBao } from "./firebase.js";
import { collection, collectionGroup, getDocs, doc, updateDoc, addDoc, deleteDoc,
         query, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { moDoiAnh } from "./anh-dai-dien.js";

const main = document.getElementById("adminMain");
const trangHienTai = document.body.dataset.page;

const MENU = [
  { page: "tong-quan", file: "index.html",     icon: "▤", ten: "Tổng quan" },
  { page: "tai-khoan", file: "tai-khoan.html", icon: "◎", ten: "Tài khoản" },
  { page: "vi-du",     file: "vi-du.html",     icon: "★", ten: "Ví dụ bài toán" }
];

yeuCauAdmin((user, hoSo) => {
  veThanhNguoiDung(user, hoSo);
  veMenu();
  if (trangHienTai === "tong-quan") trangTongQuan();
  if (trangHienTai === "tai-khoan") trangTaiKhoan(user);
  if (trangHienTai === "vi-du") trangViDu();
});

function veMenu() {
  document.getElementById("adminNav").innerHTML = `
    ${MENU.map(m => `
      <a href="${m.file}" class="${m.page === trangHienTai ? "active" : ""}">
        <span class="icon">${m.icon}</span>${m.ten}</a>`).join("")}
    <a href="../index.html" class="back"><span class="icon">←</span>Về trang khách</a>`;
}

const tenThuatToan = id => ALGORITHMS.find(a => a.id === id)?.name || id;

// Tổng quan
async function trangTongQuan() {
  main.innerHTML = `<h1>Tổng quan</h1><p class="dang-tai">Đang tải số liệu...</p>`;
  try {
    const [users, history, examples] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collectionGroup(db, "history")),
      getDocs(collection(db, "examples"))
    ]);

    const dsUser = users.docs.map(d => ({ uid: d.id, ...d.data() }));
    const theoUid = Object.fromEntries(dsUser.map(u => [u.uid, u]));
    const dsLuot = history.docs.map(d => ({ uid: d.ref.parent.parent.id, ...d.data() }));

    // Đếm số lượt mô phỏng của từng thuật toán
    const dem = {};
    for (const l of dsLuot) dem[l.algoId] = (dem[l.algoId] || 0) + 1;
    const xepHang = ALGORITHMS.map(a => ({ ten: a.name, so: dem[a.id] || 0 })).sort((a, b) => b.so - a.so);
    const lonNhat = Math.max(1, ...xepHang.map(x => x.so));

    const ganDay = dsLuot
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, 10);

    main.innerHTML = `
      <h1>Tổng quan</h1>
      <div class="stats">
        ${oThongKe("Tài khoản", dsUser.length)}
        ${oThongKe("Quản trị viên", dsUser.filter(u => u.vaiTro === "admin").length)}
        ${oThongKe("Bị khóa", dsUser.filter(u => u.biKhoa).length)}
        ${oThongKe("Lượt mô phỏng", dsLuot.length)}
        ${oThongKe("Ví dụ có sẵn", examples.size)}
      </div>

      <div class="admin-grid">
        <section class="panel">
          <h3>Thuật toán được mô phỏng nhiều nhất</h3>
          <div class="bars">
            ${xepHang.map(x => `
              <div class="bar-row">
                <span class="bar-label">${e(x.ten)}</span>
                <span class="bar"><span style="width:${(x.so / lonNhat) * 100}%"></span></span>
                <span class="bar-num">${x.so}</span>
              </div>`).join("")}
          </div>
        </section>

        <section class="panel">
          <h3>Lượt mô phỏng gần đây</h3>
          ${ganDay.length ? `
            <div class="table-wrap"><table class="table">
              <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Bài toán</th></tr></thead>
              <tbody>${ganDay.map(l => `
                <tr><td class="nowrap">${ngayGio(l.createdAt)}</td>
                    <td>${e(theoUid[l.uid]?.ten || theoUid[l.uid]?.email || "(đã xóa)")}</td>
                    <td>${e(l.algoName || tenThuatToan(l.algoId))}</td></tr>`).join("")}
              </tbody>
            </table></div>` : `<p class="muted">Chưa có lượt mô phỏng nào.</p>`}
        </section>
      </div>`;
  } catch (err) {
    main.innerHTML = `<h1>Tổng quan</h1><p class="alert loi">${e(loiTiengViet(err))}</p>`;
  }
}

function oThongKe(nhan, so) {
  return `<div class="stat"><span class="stat-num">${so}</span><span class="stat-label">${nhan}</span></div>`;
}

// Quản lý tài khoản
let dsTaiKhoan = [];

async function trangTaiKhoan(admin) {
  main.innerHTML = `
    <div class="page-title">
      <h1>Quản lý tài khoản</h1>
      <input class="search-box" id="timTK" type="search" placeholder="Tìm theo tên hoặc email...">
    </div>
    <div class="alert" id="tbTK" hidden></div>
    <section class="panel"><div id="bangTK"><p class="dang-tai">Đang tải...</p></div></section>
    <p class="muted note">Ghi chú: tài khoản bị khóa sẽ bị đăng xuất ngay khi mở web và không đăng nhập lại được.
      Muốn xóa hẳn tài khoản, vào Firebase Console → Authentication.</p>`;

  try {
    const snap = await getDocs(collection(db, "users"));
    dsTaiKhoan = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (b.ngayTao?.toMillis?.() || 0) - (a.ngayTao?.toMillis?.() || 0));
    veBangTaiKhoan(admin);
    document.getElementById("timTK").oninput = () => veBangTaiKhoan(admin);
  } catch (err) {
    thongBao("tbTK", loiTiengViet(err));
  }
}

function veBangTaiKhoan(admin) {
  const tu = document.getElementById("timTK").value.trim().toLowerCase();
  const ds = dsTaiKhoan.filter(u => `${u.ten} ${u.email}`.toLowerCase().includes(tu));

  document.getElementById("bangTK").innerHTML = ds.length ? `
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Người dùng</th><th>Đăng nhập bằng</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th></th></tr></thead>
      <tbody>${ds.map(u => {
        const laToi = u.uid === admin.uid;     // không cho tự đổi quyền / tự khóa chính mình
        return `<tr>
          <td><div class="user-cell">
              <button class="doi-anh nho" data-anh="${u.uid}" type="button" title="Đổi ảnh của ${e(u.ten)}">${anhDaiDien(u.anh, u.ten)}</button>
              <div><strong>${e(u.ten)}</strong>${laToi ? ` <span class="tag">Bạn</span>` : ""}<small>${e(u.email)}</small></div></div></td>
          <td>${tenCachDangNhap(u.dangNhapBang)}</td>
          <td><select data-vaitro="${u.uid}" ${laToi ? "disabled" : ""}>
                <option value="user" ${u.vaiTro !== "admin" ? "selected" : ""}>Người dùng</option>
                <option value="admin" ${u.vaiTro === "admin" ? "selected" : ""}>Quản trị viên</option>
              </select></td>
          <td>${u.biKhoa ? `<span class="tag red">Bị khóa</span>` : `<span class="tag green">Hoạt động</span>`}</td>
          <td class="nowrap">${ngayGio(u.ngayTao)}</td>
          <td><div class="actions">${laToi ? "" : `
            <button class="btn sm ${u.biKhoa ? "" : "danger"}" data-khoa="${u.uid}">
              ${u.biKhoa ? "Mở khóa" : "Khóa"}</button>`}</div></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>` : `<p class="muted">Không có tài khoản phù hợp.</p>`;

  document.querySelectorAll("[data-vaitro]").forEach(sel => sel.onchange = () =>
    capNhatTaiKhoan(admin, sel.dataset.vaitro, { vaiTro: sel.value }, "Đã đổi vai trò."));

  document.querySelectorAll("[data-anh]").forEach(btn => btn.onclick = async () => {
    const u = dsTaiKhoan.find(x => x.uid === btn.dataset.anh);
    const anhMoi = await moDoiAnh(u.anh || "", u.ten);
    if (anhMoi === null) return;
    await capNhatTaiKhoan(admin, u.uid, { anh: anhMoi },
      anhMoi ? `Đã đổi ảnh đại diện của ${u.ten}.` : `Đã xóa ảnh đại diện của ${u.ten}.`);
    if (u.uid === admin.uid) veThanhNguoiDung(admin, u);    // đổi ảnh của chính mình -> cập nhật thanh menu
  });

  document.querySelectorAll("[data-khoa]").forEach(btn => btn.onclick = () => {
    const u = dsTaiKhoan.find(x => x.uid === btn.dataset.khoa);
    const hanhDong = u.biKhoa ? "Mở khóa" : "Khóa";
    if (!confirm(`${hanhDong} tài khoản ${u.email}?`)) return;
    capNhatTaiKhoan(admin, u.uid, { biKhoa: !u.biKhoa }, `Đã ${hanhDong.toLowerCase()} tài khoản.`);
  });
}

async function capNhatTaiKhoan(admin, uid, thayDoi, loiBao) {
  try {
    await updateDoc(doc(db, "users", uid), thayDoi);
    Object.assign(dsTaiKhoan.find(u => u.uid === uid), thayDoi);
    thongBao("tbTK", loiBao, "ok");
  } catch (err) {
    thongBao("tbTK", loiTiengViet(err));
  }
  veBangTaiKhoan(admin);
}

// Quản lý ví dụ có sẵn
const SO_VI_DU_YEU_CAU = 5;      // đề tài yêu cầu ít nhất 5 ví dụ
let algoDangChon = ALGORITHMS[0].id;
let dsViDu = [];
let dangSua = null;              // id ví dụ đang sửa (null = đang thêm mới)

function trangViDu() {
  main.innerHTML = `
    <div class="page-title">
      <h1>Ví dụ bài toán</h1>
      <select id="chonAlgo" class="search-box">
        ${ALGORITHMS.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}
      </select>
    </div>
    <div class="alert" id="tbVD" hidden></div>
    <div class="admin-grid">
      <section class="panel"><div id="dsViDu"></div></section>
      <section class="panel"><div id="formViDu"></div></section>
    </div>`;

  const chon = document.getElementById("chonAlgo");
  chon.value = algoDangChon;
  chon.onchange = () => { algoDangChon = chon.value; dangSua = null; taiViDu(); };
  taiViDu();
}

async function taiViDu() {
  document.getElementById("dsViDu").innerHTML = `<p class="dang-tai">Đang tải...</p>`;
  try {
    const snap = await getDocs(query(collection(db, "examples"), where("algoId", "==", algoDangChon)));
    dsViDu = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ngayTao?.toMillis?.() || 0) - (b.ngayTao?.toMillis?.() || 0));
    veDanhSachViDu();
    veFormViDu();
  } catch (err) {
    thongBao("tbVD", loiTiengViet(err));
  }
}

function tomTatViDu(values = {}) {
  const algo = ALGORITHMS.find(a => a.id === algoDangChon);
  return algo.inputs
    .filter(inp => values[inp.key] != null && values[inp.key] !== "")
    .filter(inp => !inp.hienKhi || values[inp.hienKhi.key] === inp.hienKhi.giaTri)
    .map(inp => `${e(inp.label)} = ${e(String(values[inp.key]).replace(/\n/g, " / "))}`)
    .join(" · ");
}

function veDanhSachViDu() {
  const du = dsViDu.length >= SO_VI_DU_YEU_CAU;
  document.getElementById("dsViDu").innerHTML = `
    <h3>${e(tenThuatToan(algoDangChon))}
      <span class="tag ${du ? "green" : "red"}">${dsViDu.length}/${SO_VI_DU_YEU_CAU} ví dụ</span></h3>
    ${dsViDu.length ? `<ol class="example-list">${dsViDu.map(v => `
      <li>
        <div><strong>${e(v.tieuDe)}</strong>
          <small>${tomTatViDu(v.values)}</small></div>
        <div class="actions">
          <button class="btn sm" data-sua="${v.id}">Sửa</button>
          <button class="btn sm danger" data-xoa="${v.id}">Xóa</button>
        </div>
      </li>`).join("")}</ol>` : `<p class="muted">Chưa có ví dụ nào cho thuật toán này.</p>`}`;

  document.querySelectorAll("[data-sua]").forEach(b => b.onclick = () => { dangSua = b.dataset.sua; veFormViDu(); });
  document.querySelectorAll("[data-xoa]").forEach(b => b.onclick = async () => {
    const v = dsViDu.find(x => x.id === b.dataset.xoa);
    if (!confirm(`Xóa ví dụ "${v.tieuDe}"?`)) return;
    try {
      await deleteDoc(doc(db, "examples", v.id));
      thongBao("tbVD", "Đã xóa ví dụ.", "ok");
      if (dangSua === v.id) dangSua = null;
      taiViDu();
    } catch (err) { thongBao("tbVD", loiTiengViet(err)); }
  });
}

function veFormViDu() {
  const algo = ALGORITHMS.find(a => a.id === algoDangChon);
  const vd = dsViDu.find(v => v.id === dangSua);
  const giaTri = key => vd?.values?.[key] ?? algo.inputs.find(i => i.key === key).value ?? "";

  document.getElementById("formViDu").innerHTML = `
    <h3>${vd ? "Sửa ví dụ" : "Thêm ví dụ mới"}</h3>
    <form id="fVD" novalidate>
      <label class="field"><span>Tiêu đề</span>
        <input name="tieuDe" required maxlength="80" value="${e(vd?.tieuDe || `Ví dụ ${dsViDu.length + 1}`)}"></label>
      ${algo.inputs.map(inp => `
        <label class="field" data-key="${inp.key}"><span>${e(inp.label)}</span>
          ${inp.type === "select"
            ? `<select name="${inp.key}">${inp.options.map(o =>
                `<option ${o === giaTri(inp.key) ? "selected" : ""}>${e(o)}</option>`).join("")}</select>`
            : inp.type === "matrix"
              ? `<textarea name="${inp.key}" rows="5" spellcheck="false">${e(giaTri(inp.key))}</textarea>`
              : inp.type === "number"
                ? `<input name="${inp.key}" type="number" min="1" step="1" value="${e(giaTri(inp.key))}">`
                : `<input name="${inp.key}" type="text" value="${e(giaTri(inp.key))}">`}
          ${inp.hint ? `<small class="hint">${e(inp.hint)}</small>` : ""}
        </label>`).join("")}
      <div class="alert loi" id="loiVD" hidden></div>
      <div class="form-actions">
        <button class="btn primary">${vd ? "Lưu thay đổi" : "Thêm ví dụ"}</button>
        ${vd ? `<button type="button" class="btn" id="huySua">Hủy</button>` : ""}
      </div>
    </form>`;

  const form = document.getElementById("fVD");
  const oNhap = key => form.querySelector(`[name="${key}"]`);
  const khungO = key => form.querySelector(`.field[data-key="${key}"]`);
  const dangAn = key => khungO(key).style.display === "none";

  function capNhatOHien() {
    for (const inp of algo.inputs) {
      if (inp.hienKhi) khungO(inp.key).style.display = oNhap(inp.hienKhi.key).value === inp.hienKhi.giaTri ? "" : "none";
    }
  }
  function baoLoi(key, loi) {
    const khung = document.getElementById("loiVD");
    khung.textContent = loi || "";
    khung.hidden = !loi;
    form.querySelectorAll(".field").forEach(f => f.classList.toggle("sai", !!loi && f.dataset.key === key));
  }
  form.oninput = () => { capNhatOHien(); baoLoi(null, ""); };
  capNhatOHien();

  const huy = document.getElementById("huySua");
  if (huy) huy.onclick = () => { dangSua = null; veFormViDu(); };

  form.onsubmit = async ev => {
    ev.preventDefault();
    const tieuDe = form.elements.tieuDe.value.trim();
    if (!tieuDe) return baoLoi("tieuDe", "Vui lòng nhập tiêu đề.");

    const values = {}, input = {};
    for (const inp of algo.inputs) {
      if (dangAn(inp.key)) continue;                     // ô đang ẩn thì không lưu
      const chu = oNhap(inp.key).value.trim();
      if (inp.type === "number") {
        if (!/^-?\d+$/.test(chu)) return baoLoi(inp.key, `"${inp.label}" phải là số nguyên, không được để trống hay chứa chữ cái.`);
        if (Number(chu) < 1) return baoLoi(inp.key, `"${inp.label}" phải là số dương (lớn hơn 0), bạn nhập ${chu}.`);
        input[inp.key] = Number(chu);
      } else if (inp.type === "matrix") {
        input[inp.key] = chu.split("\n").map(hang => hang.trim().split(/\s+/).map(Number));
      } else input[inp.key] = chu;
      values[inp.key] = chu;
    }

    const giai = SOLVERS[algo.id];
    if (giai) {
      try { giai(input); }
      catch (err) { return baoLoi(err.key, err.message); }
    }

    const duLieu = { algoId: algo.id, tieuDe, values };
    try {
      if (vd) await updateDoc(doc(db, "examples", vd.id), duLieu);
      else await addDoc(collection(db, "examples"), { ...duLieu, ngayTao: serverTimestamp() });
      thongBao("tbVD", vd ? "Đã lưu thay đổi." : "Đã thêm ví dụ.", "ok");
      dangSua = null;
      taiViDu();
    } catch (err) { thongBao("tbVD", loiTiengViet(err)); }
  };
}
