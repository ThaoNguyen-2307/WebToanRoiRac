/* =========================================================
   mat-khau.js — NÚT CON MẮT ĐỂ HIỆN / ẨN MẬT KHẨU
   Gọi themNutMat() sau khi trang đã có các ô mật khẩu:
   mọi ô <input type="password"> sẽ được gắn thêm 1 nút con mắt ở bên phải.
   ========================================================= */

const MAT_MO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
const MAT_NHAM = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3"/>
  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>`;

export function themNutMat(goc = document) {
  goc.querySelectorAll('input[type="password"]').forEach(o => {
    if (o.parentElement.classList.contains("pw-wrap")) return;   // đã gắn rồi thì bỏ qua

    // Bọc ô mật khẩu trong 1 khung để đặt nút con mắt đè lên góc phải
    const khung = document.createElement("span");
    khung.className = "pw-wrap";
    o.parentNode.insertBefore(khung, o);
    khung.appendChild(o);

    const nut = document.createElement("button");
    nut.type = "button";                       // type="button" để bấm không bị gửi form
    nut.className = "pw-toggle";
    nut.innerHTML = MAT_MO;
    nut.setAttribute("aria-label", "Hiện mật khẩu");
    nut.title = "Hiện mật khẩu";
    khung.appendChild(nut);

    nut.onclick = () => {
      const dangAn = o.type === "password";
      o.type = dangAn ? "text" : "password";
      nut.innerHTML = dangAn ? MAT_NHAM : MAT_MO;
      const nhan = dangAn ? "Ẩn mật khẩu" : "Hiện mật khẩu";
      nut.setAttribute("aria-label", nhan);
      nut.title = nhan;
      o.focus();
    };
  });
}
