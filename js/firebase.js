import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const daCauHinh = !Object.values(firebaseConfig).some(v => String(v).includes("DIEN_"));

export let auth = null;
export let db = null;
if (daCauHinh) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "vi";          // email/hộp thoại của Firebase bằng tiếng Việt
  db = getFirestore(app);
}

export const BASE = document.body.dataset.base || "";

// Hồ sơ người dùng
export async function layHoSo(user, tenMacDinh = "") {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    updateDoc(ref, { lanCuoi: serverTimestamp() }).catch(() => {});
    return { uid: user.uid, ...snap.data() };
  }
  const hoSo = {
    email: user.email || "",
    ten: tenMacDinh || user.displayName || (user.email || "").split("@")[0] || "Người dùng",
    anh: user.photoURL || "",
    dangNhapBang: user.providerData[0]?.providerId || "password",
    vaiTro: "user",
    biKhoa: false,
    ngayTao: serverTimestamp(),
    lanCuoi: serverTimestamp()
  };
  await setDoc(ref, hoSo);
  return { uid: user.uid, ...hoSo };
}

let tamDungTheoDoi = false;                         // dùng khi đang đăng ký (xem dang-nhap.js)
export function tamDung(giaTri) { tamDungTheoDoi = giaTri; }

export function theoDoiDangNhap(callback) {
  if (!daCauHinh) { callback(null, null); return; }
  onAuthStateChanged(auth, async user => {
    if (tamDungTheoDoi) return;
    if (!user) { callback(null, null); return; }
    try {
      const hoSo = await layHoSo(user);
      if (hoSo.biKhoa) {                              // tài khoản bị admin khóa -> đăng xuất
        try { sessionStorage.setItem("thongBao", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."); } catch (e) {}
        await signOut(auth);                          // lần gọi sau sẽ là callback(null, null)
        return;
      }
      callback(user, hoSo);
    } catch (e) {
      console.error("Lỗi đọc hồ sơ:", e);
      callback(user, null);
    }
  });
}

// Trang bắt buộc đăng nhập (giống yeuCauCauThu() trong PHP)
export function yeuCauDangNhap(callback) {
  theoDoiDangNhap((user, hoSo) => {
    if (!user) {
      location.href = `${BASE}dang-nhap.html?next=${encodeURIComponent(location.href)}`;
      return;
    }
    callback(user, hoSo);
  });
}

// Trang chỉ dành cho admin (giống yeuCauAdmin() trong PHP)
export function yeuCauAdmin(callback) {
  yeuCauDangNhap((user, hoSo) => {
    if (hoSo?.vaiTro !== "admin") {
      document.body.innerHTML = `
        <div class="khong-quyen">
          <h1>Bạn không có quyền vào trang này</h1>
          <p>Trang quản trị chỉ dành cho tài khoản admin.</p>
          <a class="btn primary" href="${BASE}index.html">Về trang chủ</a>
        </div>`;
      return;
    }
    callback(user, hoSo);
  });
}

export async function dangXuat() {
  await signOut(auth);
  location.href = `${BASE}index.html`;
}

// Khu vực người dùng trên thanh tiêu đề
export function veThanhNguoiDung(user, hoSo) {
  const khung = document.getElementById("userArea");
  if (!khung) return;

  if (!user) {
    khung.innerHTML = `
      <a class="btn" href="${BASE}dang-nhap.html">Đăng nhập</a>
      <a class="btn primary" href="${BASE}dang-nhap.html#dang-ky">Đăng ký</a>`;
    return;
  }

  const ten = hoSo?.ten || user.displayName || user.email;
  khung.innerHTML = `
    <details class="user-menu">
      <summary>${anhDaiDien(hoSo?.anh || user.photoURL, ten)}<span class="user-name">${e(ten)}</span></summary>
      <div class="user-dropdown">
        <div class="user-info"><strong>${e(ten)}</strong><small>${e(user.email || "")}</small></div>
        <a href="${BASE}tai-khoan.html">Tài khoản của tôi</a>
        ${hoSo?.vaiTro === "admin" ? `<a href="${BASE}admin/index.html">Trang quản trị</a>` : ""}
        <button type="button" id="btnDangXuat">Đăng xuất</button>
      </div>
    </details>`;
  document.getElementById("btnDangXuat").onclick = dangXuat;
}

// Hàm tiện ích

export function e(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function anhDaiDien(url, ten, lop = "avatar") {
  if (url) return `<img class="${lop}" src="${e(url)}" alt="" referrerpolicy="no-referrer">`;
  return `<span class="${lop} avatar-chu">${e((ten || "?").trim().charAt(0).toUpperCase())}</span>`;
}

// Firestore Timestamp -> "13/11/2026 19:30"
export function ngayGio(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function tenCachDangNhap(ma) {
  return { "google.com": "Google", "password": "Email + mật khẩu" }[ma] || ma;
}

// Dịch mã lỗi của Firebase sang tiếng Việt
export function loiTiengViet(err) {
  const ma = err?.code || "";
  const bang = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/missing-email": "Vui lòng nhập email.",
    "auth/missing-password": "Vui lòng nhập mật khẩu.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/wrong-password": "Mật khẩu không đúng.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/email-already-in-use": "Email này đã được đăng ký. Hãy đăng nhập.",
    "auth/weak-password": "Mật khẩu quá yếu, cần ít nhất 6 ký tự.",
    "auth/too-many-requests": "Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/cancelled-popup-request": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/popup-blocked": "Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên (pop-up) rồi thử lại.",
    "auth/account-exists-with-different-credential":
      "Email này đã đăng ký bằng cách khác (Google hoặc mật khẩu). Hãy đăng nhập bằng đúng cách đó.",
    "auth/unauthorized-domain":
      "Tên miền này chưa được cho phép. Thêm nó trong Firebase -> Authentication -> Settings -> Authorized domains.",
    "auth/operation-not-allowed": "Cách đăng nhập này chưa được bật trong Firebase Authentication.",
    "auth/requires-recent-login": "Vui lòng đăng xuất rồi đăng nhập lại để thực hiện thao tác này.",
    "auth/network-request-failed": "Lỗi mạng. Kiểm tra kết nối Internet.",
    "permission-denied": "Bạn không có quyền thực hiện thao tác này (kiểm tra file firestore.rules)."
  };
  return bang[ma] || `Có lỗi xảy ra (${ma || err?.message || "không rõ"}).`;
}

// Hiện thông báo trong 1 khung (loai: "ok" | "loi")
export function thongBao(idKhung, noiDung, loai = "loi") {
  const el = document.getElementById(idKhung);
  if (!el) return;
  el.className = `alert ${loai}`;
  el.textContent = noiDung;
  el.hidden = !noiDung;
}
