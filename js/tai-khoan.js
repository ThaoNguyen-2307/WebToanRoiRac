/* =========================================================
   tai-khoan.js — TRANG "TÀI KHOẢN CỦA TÔI" (người đã đăng nhập)
   - Xem hồ sơ, đổi tên hiển thị
   - Đổi mật khẩu (chỉ với tài khoản đăng ký bằng email)
   - Bài của tôi (bài đã lưu có đặt tên): mở, đổi tên, xóa
   - Lịch sử các bài đã mô phỏng: mô phỏng lại, xóa
   ========================================================= */
import { auth, db, yeuCauDangNhap, veThanhNguoiDung, e, anhDaiDien, ngayGio,
         tenCachDangNhap, loiTiengViet, thongBao } from "./firebase.js";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, updateDoc, collection, query, orderBy, limit, getDocs, deleteDoc, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { themNutMat } from "./mat-khau.js";
import { moDoiAnh } from "./anh-dai-dien.js";

const trang = document.getElementById("trang");

yeuCauDangNhap((user, hoSo) => {
  veThanhNguoiDung(user, hoSo);
  veTrang(user, hoSo || {});
  taiBaiLuu(user);
  taiLichSu(user);
});

function veTrang(user, hoSo) {
  const dungMatKhau = (hoSo.dangNhapBang || "password") === "password";
  trang.innerHTML = `
    <h1>Tài khoản của tôi</h1>

    <div class="account-grid">
      <!-- HỒ SƠ -->
      <section class="panel profile">
        <!-- Bấm vào ảnh để đổi ảnh đại diện -->
        <button class="doi-anh" id="nutDoiAnh" type="button" title="Đổi ảnh đại diện">
          <span id="anhHoSo">${anhDaiDien(hoSo.anh || user.photoURL, hoSo.ten, "avatar lon")}</span>
          <span class="doi-anh-nhan">📷 Đổi ảnh</span>
        </button>
        <div class="alert" id="tbAnh" hidden></div>
        <h2>${e(hoSo.ten)}</h2>
        <p class="muted">${e(user.email || "")}</p>
        <dl class="info-list">
          <dt>Đăng nhập bằng</dt><dd>${tenCachDangNhap(hoSo.dangNhapBang)}</dd>
          <dt>Vai trò</dt><dd>${hoSo.vaiTro === "admin" ? "Quản trị viên" : "Người dùng"}</dd>
          <dt>Ngày tham gia</dt><dd>${ngayGio(hoSo.ngayTao)}</dd>
        </dl>
        ${hoSo.vaiTro === "admin" ? `<a class="btn full" href="admin/index.html">Vào trang quản trị</a>` : ""}
      </section>

      <div class="stack">
        <!-- ĐỔI TÊN -->
        <section class="panel">
          <h3>Thông tin cá nhân</h3>
          <div class="alert" id="tbTen" hidden></div>
          <form id="formTen" class="inline-form">
            <label class="field"><span>Họ tên hiển thị</span>
              <input name="ten" value="${e(hoSo.ten)}" required maxlength="50"></label>
            <button class="btn primary">Lưu</button>
          </form>
        </section>

        <!-- ĐỔI MẬT KHẨU -->
        <section class="panel">
          <h3>Đổi mật khẩu</h3>
          ${dungMatKhau ? `
            <div class="alert" id="tbMatKhau" hidden></div>
            <form id="formMatKhau">
              <label class="field"><span>Mật khẩu hiện tại</span>
                <input type="password" name="cu" autocomplete="current-password" required></label>
              <label class="field"><span>Mật khẩu mới (ít nhất 6 ký tự)</span>
                <input type="password" name="moi" autocomplete="new-password" required></label>
              <label class="field"><span>Nhập lại mật khẩu mới</span>
                <input type="password" name="nhapLai" autocomplete="new-password" required></label>
              <button class="btn primary">Đổi mật khẩu</button>
            </form>`
          : `<p class="muted">Bạn đăng nhập bằng ${tenCachDangNhap(hoSo.dangNhapBang)}, nên mật khẩu do
             ${tenCachDangNhap(hoSo.dangNhapBang)} quản lý. Không cần đổi mật khẩu ở đây.</p>`}
        </section>
      </div>
    </div>

    <!-- BÀI CỦA TÔI -->
    <section class="panel">
      <div class="history-head"><h3>Bài của tôi</h3></div>
      <div class="alert" id="tbBaiLuu" hidden></div>
      <div id="baiLuu"><p class="muted">Đang tải...</p></div>
    </section>

    <!-- LỊCH SỬ -->
    <section class="panel">
      <!-- Tiêu đề và ô "Chọn hết" nằm cùng 1 hàng -->
      <div class="history-head">
        <h3>Lịch sử mô phỏng</h3>
        <span id="oChonHet"></span>
      </div>
      <div id="lichSu"><p class="muted">Đang tải...</p></div>
    </section>`;

  /* Đổi ảnh đại diện: lưu vào trường "anh" của users/{uid} */
  document.getElementById("nutDoiAnh").onclick = async () => {
    const anhMoi = await moDoiAnh(hoSo.anh || user.photoURL || "", hoSo.ten);
    if (anhMoi === null) return;                         // bấm Hủy
    try {
      await updateDoc(doc(db, "users", user.uid), { anh: anhMoi });
      hoSo.anh = anhMoi;
      document.getElementById("anhHoSo").innerHTML = anhDaiDien(anhMoi || user.photoURL, hoSo.ten, "avatar lon");
      veThanhNguoiDung(user, hoSo);                      // cập nhật ảnh nhỏ trên thanh menu
      thongBao("tbAnh", anhMoi ? "Đã đổi ảnh đại diện." : "Đã xóa ảnh đại diện.", "ok");
    } catch (err) { thongBao("tbAnh", loiTiengViet(err)); }
  };

  /* Đổi tên */
  document.getElementById("formTen").onsubmit = async ev => {
    ev.preventDefault();
    const ten = ev.target.elements.ten.value.trim();
    if (!ten) return;
    try {
      await updateProfile(user, { displayName: ten });
      await updateDoc(doc(db, "users", user.uid), { ten });
      thongBao("tbTen", "Đã lưu họ tên.", "ok");
      hoSo.ten = ten;
      veThanhNguoiDung(user, hoSo);
    } catch (err) { thongBao("tbTen", loiTiengViet(err)); }
  };

  /* Đổi mật khẩu: phải nhập lại mật khẩu cũ để xác nhận (Firebase yêu cầu) */
  themNutMat(trang);     // nút con mắt cho các ô mật khẩu
  const formMK = document.getElementById("formMatKhau");
  if (formMK) formMK.onsubmit = async ev => {
    ev.preventDefault();
    const f = formMK.elements;
    if (f.moi.value.length < 6) return thongBao("tbMatKhau", "Mật khẩu mới cần ít nhất 6 ký tự.");
    if (f.moi.value !== f.nhapLai.value) return thongBao("tbMatKhau", "Hai mật khẩu mới không giống nhau.");
    try {
      const xacNhan = EmailAuthProvider.credential(user.email, f.cu.value);
      await reauthenticateWithCredential(user, xacNhan);
      await updatePassword(user, f.moi.value);
      formMK.reset();
      thongBao("tbMatKhau", "Đã đổi mật khẩu.", "ok");
    } catch (err) { thongBao("tbMatKhau", loiTiengViet(err)); }
  };
}

/* ---------- Bài của tôi (users/{uid}/baiLuu) ---------- */
async function taiBaiLuu(user) {
  const khung = document.getElementById("baiLuu");
  try {
    const snap = await getDocs(query(collection(db, "users", user.uid, "baiLuu"), orderBy("ngayTao", "desc")));
    if (snap.empty) {
      khung.innerHTML = `<p class="muted">Bạn chưa lưu bài nào. Ở trang mô phỏng, nhập dữ liệu rồi bấm
        <b>💾 Lưu bài này</b> (dưới phần "Ví dụ có sẵn") để lưu lại và mở lại sau.</p>`;
      return;
    }
    const theoId = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
    khung.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Tên bài</th><th>Bài toán</th><th>Dữ liệu</th><th>Ngày lưu</th><th></th></tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const b = d.data();
            return `<tr>
              <td class="ten-bai" data-o-ten="${d.id}"><b>${e(b.ten)}</b></td>
              <td>${e(b.algoName)}</td>
              <td class="data-cell">${tomTatDuLieu(b.algoId, b.values)}</td>
              <td class="nowrap">${ngayGio(b.ngayTao)}</td>
              <td><div class="actions">
                <button class="btn sm primary" data-mo="${d.id}">Mở</button>
                <button class="btn sm" data-doi-ten="${d.id}">Đổi tên</button>
                <button class="btn sm danger" data-xoa-bai="${d.id}">Xóa</button>
              </div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>`;

    // Mở: gửi dữ liệu sang trang thuật toán (main.js tự điền vào form)
    khung.querySelectorAll("[data-mo]").forEach(b => b.onclick = () => {
      const bai = theoId[b.dataset.mo];
      try { sessionStorage.setItem("napLai", JSON.stringify({ algoId: bai.algoId, values: bai.values, ten: bai.ten })); } catch (e) {}
      location.href = `index.html#/algo/${bai.algoId}`;
    });

    // Đổi tên ngay trong bảng
    khung.querySelectorAll("[data-doi-ten]").forEach(b => b.onclick = () => {
      const id = b.dataset.doiTen;
      const o = khung.querySelector(`[data-o-ten="${id}"]`);
      if (o.querySelector("form")) return;                 // đang sửa rồi
      o.innerHTML = `<form class="doi-ten-bai">
          <input name="ten" maxlength="60" value="${e(theoId[id].ten)}" aria-label="Tên mới">
          <button class="btn sm primary">Lưu</button>
          <button class="btn sm" type="button" data-huy>Hủy</button>
        </form>`;
      const form = o.querySelector("form");
      form.elements.ten.focus();
      form.elements.ten.select();
      const huy = () => { o.innerHTML = `<b>${e(theoId[id].ten)}</b>`; };
      form.querySelector("[data-huy]").onclick = huy;
      form.elements.ten.onkeydown = ev => { if (ev.key === "Escape") huy(); };
      form.onsubmit = async ev => {
        ev.preventDefault();
        const ten = form.elements.ten.value.trim();
        if (!ten) return thongBao("tbBaiLuu", "Tên bài không được để trống.");
        const trung = Object.entries(theoId).find(([k, v]) =>
          k !== id && v.algoId === theoId[id].algoId && v.ten.toLowerCase() === ten.toLowerCase());
        if (trung) return thongBao("tbBaiLuu", `Bài toán này đã có bài tên "${ten}", hãy chọn tên khác.`);
        try {
          await updateDoc(doc(db, "users", user.uid, "baiLuu", id), { ten });
          theoId[id].ten = ten;
          huy();
          thongBao("tbBaiLuu", "Đã đổi tên.", "ok");
        } catch (err) { thongBao("tbBaiLuu", loiTiengViet(err)); }
      };
    });

    khung.querySelectorAll("[data-xoa-bai]").forEach(b => b.onclick = async () => {
      const id = b.dataset.xoaBai;
      if (!confirm(`Xóa bài "${theoId[id].ten}"?`)) return;
      try { await deleteDoc(doc(db, "users", user.uid, "baiLuu", id)); taiBaiLuu(user); }
      catch (err) { thongBao("tbBaiLuu", loiTiengViet(err)); }
    });
  } catch (err) {
    khung.innerHTML = `<p class="alert loi">${e(loiTiengViet(err))}</p>`;
  }
}

/* ---------- Lịch sử mô phỏng (users/{uid}/history) ---------- */
async function taiLichSu(user) {
  const khung = document.getElementById("lichSu");
  try {
    const q = query(collection(db, "users", user.uid, "history"), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    if (snap.empty) {
      document.getElementById("oChonHet").innerHTML = "";
      khung.innerHTML = `<p class="muted">Bạn chưa mô phỏng bài nào. <a class="link" href="index.html">Bắt đầu ngay</a></p>`;
      return;
    }
    document.getElementById("oChonHet").innerHTML =
      `<label class="check"><input type="checkbox" id="chonHet"> Chọn hết</label>`;
    khung.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr>
          <th class="col-check"></th><th>Thời gian</th><th>Bài toán</th><th>Dữ liệu</th>
          <th class="col-xoa"><button class="btn sm danger" id="xoaDaChon" disabled>Xóa mục đã chọn</button></th>
        </tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const h = d.data();
            return `<tr>
              <td class="col-check"><input type="checkbox" class="chon-muc" value="${d.id}" aria-label="Chọn mục này"></td>
              <td class="nowrap">${ngayGio(h.createdAt)}</td>
              <td>${e(h.algoName)}</td>
              <td class="data-cell">${tomTatDuLieu(h.algoId, h.values)}</td>
              <td><div class="actions">
                <button class="btn sm" data-chay="${d.id}">Mô phỏng lại</button>
                <button class="btn sm danger" data-xoa="${d.id}">Xóa</button>
              </div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>`;

    const theoId = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));

    // Mô phỏng lại: ghi tạm dữ liệu rồi mở trang thuật toán, main.js sẽ tự điền vào form
    khung.querySelectorAll("[data-chay]").forEach(b => b.onclick = () => {
      const h = theoId[b.dataset.chay];
      try { sessionStorage.setItem("napLai", JSON.stringify({ algoId: h.algoId, values: h.values })); } catch (e) {}
      location.href = `index.html#/algo/${h.algoId}`;
    });

    // Xóa 1 mục
    khung.querySelectorAll("[data-xoa]").forEach(b => b.onclick = async () => {
      if (!confirm("Xóa mục này khỏi lịch sử?")) return;
      await deleteDoc(doc(db, "users", user.uid, "history", b.dataset.xoa));
      taiLichSu(user);
    });

    /* ----- Chọn nhiều mục để xóa ----- */
    const chonHet = document.getElementById("chonHet");
    const nutXoa = document.getElementById("xoaDaChon");
    const oChon = [...khung.querySelectorAll(".chon-muc")];
    const daChon = () => oChon.filter(o => o.checked);

    function capNhatNut() {
      const k = daChon().length;
      // Chỉ hiện "Chọn hết" và nút xóa khi đã tích ít nhất 1 mục
      document.getElementById("oChonHet").classList.toggle("an", k === 0);
      nutXoa.classList.toggle("an", k === 0);
      nutXoa.disabled = k === 0;
      nutXoa.textContent = k ? `Xóa ${k} mục đã chọn` : "Xóa mục đã chọn";
      chonHet.checked = k === oChon.length;                 // chọn đủ hết thì ô "Chọn hết" cũng được tích
      chonHet.indeterminate = k > 0 && k < oChon.length;    // chọn một phần thì hiện dấu gạch
      oChon.forEach(o => o.closest("tr").classList.toggle("dang-chon", o.checked));
    }

    chonHet.onchange = () => { oChon.forEach(o => o.checked = chonHet.checked); capNhatNut(); };
    capNhatNut();                                        // ban đầu chưa chọn gì -> ẩn 2 nút
    oChon.forEach(o => o.onchange = capNhatNut);

    nutXoa.onclick = async () => {
      const ids = daChon().map(o => o.value);
      if (!ids.length || !confirm(`Xóa ${ids.length} mục đã chọn khỏi lịch sử?`)) return;
      nutXoa.disabled = true;
      nutXoa.textContent = "Đang xóa...";
      // Xóa cùng lúc bằng writeBatch (mỗi lần tối đa 500 mục)
      for (let i = 0; i < ids.length; i += 500) {
        const batch = writeBatch(db);
        ids.slice(i, i + 500).forEach(id => batch.delete(doc(db, "users", user.uid, "history", id)));
        await batch.commit();
      }
      taiLichSu(user);
    };
  } catch (err) {
    khung.innerHTML = `<p class="alert loi">${e(loiTiengViet(err))}</p>`;
  }
}

// Hiện dữ liệu theo đúng thứ tự và tên ô nhập của thuật toán (lấy từ data.js)
// VD: { type: "Hoán vị...", n: "4", m: "2" } -> "Bài toán = Hoán vị...  n = 4"   (bỏ ô m vì không dùng)
function tomTatDuLieu(algoId, values = {}) {
  const algo = ALGORITHMS.find(a => a.id === algoId);
  const dsO = algo ? algo.inputs : Object.keys(values).map(key => ({ key, label: key }));
  return dsO
    .filter(inp => values[inp.key] != null && values[inp.key] !== "")
    .filter(inp => !inp.hienKhi || values[inp.hienKhi.key] === inp.hienKhi.giaTri)   // ô bị ẩn thì không hiện
    .map(inp => `<span class="kv">${e(inp.label)} = ${e(String(values[inp.key]).replace(/\n/g, " / "))}</span>`)
    .join(" ");
}
