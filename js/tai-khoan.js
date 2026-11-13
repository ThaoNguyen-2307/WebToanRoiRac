/* =========================================================
   tai-khoan.js — TRANG "TÀI KHOẢN CỦA TÔI" (người đã đăng nhập)
   - Xem hồ sơ, đổi tên hiển thị
   - Đổi mật khẩu (chỉ với tài khoản đăng ký bằng email)
   - Lịch sử các bài đã mô phỏng: mô phỏng lại, xóa
   ========================================================= */
import { auth, db, yeuCauDangNhap, veThanhNguoiDung, e, anhDaiDien, ngayGio,
         tenCachDangNhap, loiTiengViet, thongBao } from "./firebase.js";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, updateDoc, collection, query, orderBy, limit, getDocs, deleteDoc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const trang = document.getElementById("trang");

yeuCauDangNhap((user, hoSo) => {
  veThanhNguoiDung(user, hoSo);
  veTrang(user, hoSo || {});
  taiLichSu(user);
});

function veTrang(user, hoSo) {
  const dungMatKhau = (hoSo.dangNhapBang || "password") === "password";
  trang.innerHTML = `
    <h1>Tài khoản của tôi</h1>

    <div class="account-grid">
      <!-- HỒ SƠ -->
      <section class="panel profile">
        ${anhDaiDien(hoSo.anh || user.photoURL, hoSo.ten, "avatar lon")}
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

    <!-- LỊCH SỬ -->
    <section class="panel">
      <h3>Lịch sử mô phỏng</h3>
      <div id="lichSu"><p class="muted">Đang tải...</p></div>
    </section>`;

  /* Đổi tên */
  document.getElementById("formTen").onsubmit = async ev => {
    ev.preventDefault();
    const ten = ev.target.elements.ten.value.trim();
    if (!ten) return;
    try {
      await updateProfile(user, { displayName: ten });
      await updateDoc(doc(db, "users", user.uid), { ten });
      thongBao("tbTen", "Đã lưu họ tên.", "ok");
      veThanhNguoiDung(user, { ...hoSo, ten });
    } catch (err) { thongBao("tbTen", loiTiengViet(err)); }
  };

  /* Đổi mật khẩu: phải nhập lại mật khẩu cũ để xác nhận (Firebase yêu cầu) */
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

/* ---------- Lịch sử mô phỏng (users/{uid}/history) ---------- */
async function taiLichSu(user) {
  const khung = document.getElementById("lichSu");
  try {
    const q = query(collection(db, "users", user.uid, "history"), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    if (snap.empty) {
      khung.innerHTML = `<p class="muted">Bạn chưa mô phỏng bài nào. <a class="link" href="index.html">Bắt đầu ngay</a></p>`;
      return;
    }
    khung.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Thời gian</th><th>Bài toán</th><th>Dữ liệu</th><th></th></tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const h = d.data();
            return `<tr>
              <td class="nowrap">${ngayGio(h.createdAt)}</td>
              <td>${e(h.algoName)}</td>
              <td class="data-cell">${tomTatDuLieu(h.values)}</td>
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

    khung.querySelectorAll("[data-xoa]").forEach(b => b.onclick = async () => {
      if (!confirm("Xóa mục này khỏi lịch sử?")) return;
      await deleteDoc(doc(db, "users", user.uid, "history", b.dataset.xoa));
      taiLichSu(user);
    });
  } catch (err) {
    khung.innerHTML = `<p class="alert loi">${e(loiTiengViet(err))}</p>`;
  }
}

// { n: "4", matrix: "0 1\n1 0" } -> "n = 4 · matrix = 0 1 / 1 0"
function tomTatDuLieu(values = {}) {
  return Object.entries(values)
    .map(([k, v]) => `<span class="kv">${e(k)} = ${e(String(v).replace(/\n/g, " / "))}</span>`)
    .join(" ");
}
