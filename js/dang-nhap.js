/* =========================================================
   dang-nhap.js — TRANG ĐĂNG NHẬP / ĐĂNG KÝ
   3 cách: email + mật khẩu, Google, Facebook
   ========================================================= */
import { auth, daCauHinh, BASE, layHoSo, theoDoiDangNhap, tamDung, loiTiengViet, thongBao }
  from "./firebase.js";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const formDangNhap = document.getElementById("formDangNhap");
const formDangKy = document.getElementById("formDangKy");

/* ---------- Chuyển tab Đăng nhập <-> Đăng ký ---------- */
function moTab(ten) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === ten));
  formDangNhap.hidden = ten !== "dang-nhap";
  formDangKy.hidden = ten !== "dang-ky";
  thongBao("thongBao", "");
}
document.querySelectorAll(".auth-tab").forEach(t => t.onclick = () => moTab(t.dataset.tab));
if (location.hash === "#dang-ky") moTab("dang-ky");

/* ---------- Thông báo để lại từ trang khác (VD: tài khoản bị khóa) ---------- */
try {
  const tb = sessionStorage.getItem("thongBao");
  if (tb) { thongBao("thongBao", tb); sessionStorage.removeItem("thongBao"); }
} catch (e) {}

if (!daCauHinh) {
  thongBao("thongBao",
    "Chưa cấu hình Firebase: hãy điền thông tin vào file js/firebase-config.js (xem README.md).");
  document.querySelectorAll("button, input").forEach(el => {
    if (!el.classList.contains("auth-tab")) el.disabled = true;
  });
}

/* ---------- Đăng nhập xong thì chuyển trang ----------
   Admin -> trang quản trị; người dùng -> trang đang xem dở (next) hoặc trang chủ */
function chuyenTiep(hoSo) {
  const next = new URLSearchParams(location.search).get("next");
  if (next && next.startsWith(location.origin)) location.href = next;
  else if (hoSo?.vaiTro === "admin") location.href = `${BASE}admin/index.html`;
  else location.href = `${BASE}index.html`;
}

// Đã đăng nhập sẵn (hoặc vừa đăng nhập xong) -> chuyển trang
theoDoiDangNhap((user, hoSo) => { if (user) chuyenTiep(hoSo); });

// Khóa nút trong lúc chờ để tránh bấm 2 lần
async function dangXuLy(nut, viec) {
  nut.disabled = true;
  try { await viec(); }
  catch (err) { console.error(err); thongBao("thongBao", loiTiengViet(err)); }
  finally { nut.disabled = false; }
}

/* ---------- 1. Email + mật khẩu ---------- */
formDangNhap.onsubmit = ev => {
  ev.preventDefault();
  const f = formDangNhap.elements;
  dangXuLy(formDangNhap.querySelector("[type=submit]"), async () => {
    await signInWithEmailAndPassword(auth, f.email.value.trim(), f.matKhau.value);
    // theoDoiDangNhap ở trên sẽ tự chuyển trang
  });
};

formDangKy.onsubmit = ev => {
  ev.preventDefault();
  const f = formDangKy.elements;
  const ten = f.ten.value.trim();
  if (!ten) return thongBao("thongBao", "Vui lòng nhập họ tên.");
  if (f.matKhau.value.length < 6) return thongBao("thongBao", "Mật khẩu cần ít nhất 6 ký tự.");
  if (f.matKhau.value !== f.nhapLai.value) return thongBao("thongBao", "Hai mật khẩu không giống nhau.");

  dangXuLy(formDangKy.querySelector("[type=submit]"), async () => {
    tamDung(true);   // chờ lưu xong họ tên rồi mới tạo hồ sơ
    try {
      const { user } = await createUserWithEmailAndPassword(auth, f.email.value.trim(), f.matKhau.value);
      await updateProfile(user, { displayName: ten });
      const hoSo = await layHoSo(user, ten);
      chuyenTiep(hoSo);
    } finally {
      tamDung(false);
    }
  });
};

document.getElementById("btnQuenMatKhau").onclick = ev => {
  const email = formDangNhap.elements.email.value.trim();
  if (!email) return thongBao("thongBao", "Nhập email vào ô Email trước, rồi bấm lại \"Quên mật khẩu?\".");
  dangXuLy(ev.currentTarget, async () => {
    await sendPasswordResetEmail(auth, email);
    thongBao("thongBao", `Đã gửi email đặt lại mật khẩu tới ${email}. Kiểm tra cả hộp thư Spam.`, "ok");
  });
};

/* ---------- 2. Google và 3. Facebook ----------
   Mở cửa sổ đăng nhập của Google/Facebook. Lần đầu dùng sẽ tự tạo tài khoản (= đăng ký). */
document.getElementById("btnGoogle").onclick = ev => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });   // luôn cho chọn tài khoản Gmail
  dangXuLy(ev.currentTarget, () => signInWithPopup(auth, provider));
};

document.getElementById("btnFacebook").onclick = ev => {
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  dangXuLy(ev.currentTarget, () => signInWithPopup(auth, provider));
};
