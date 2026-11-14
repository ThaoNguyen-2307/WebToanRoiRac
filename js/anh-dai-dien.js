/* =========================================================
   anh-dai-dien.js — HỘP THOẠI ĐỔI ẢNH ĐẠI DIỆN
   Dùng chung cho trang Tài khoản và trang quản trị.

   const ketQua = await moDoiAnh(anhHienTai, tenNguoiDung);
     - chuỗi "data:image/jpeg;base64,..." : ảnh mới (đã cắt vuông, thu nhỏ 256×256)
     - ""   : người dùng chọn "Xóa ảnh"
     - null : người dùng bấm Hủy

   Ảnh được lưu thẳng vào Firestore (trường "anh" của users/{uid}) dưới dạng chuỗi,
   nên không cần bật Firebase Storage. Ảnh 256×256 chỉ khoảng 15–30 KB.
   ========================================================= */

const KICH_THUOC = 256;      // ảnh đại diện 256 × 256 điểm ảnh

// Cắt giữa ảnh thành hình vuông, thu nhỏ rồi xuất ra JPEG dạng chuỗi
function catVaThuNho(nguon, rong, cao) {
  const canh = Math.min(rong, cao);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = KICH_THUOC;
  canvas.getContext("2d").drawImage(nguon, (rong - canh) / 2, (cao - canh) / 2, canh, canh, 0, 0, KICH_THUOC, KICH_THUOC);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Đọc file ảnh người dùng chọn -> chuỗi ảnh đã xử lý
function docFileAnh(file) {
  return new Promise((xong, loi) => {
    if (!file.type.startsWith("image/")) return loi(new Error("File đã chọn không phải là ảnh."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { xong(catVaThuNho(img, img.naturalWidth, img.naturalHeight)); URL.revokeObjectURL(url); };
    img.onerror = () => { loi(new Error("Không đọc được ảnh này.")); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

const chuDau = ten => (ten || "?").trim().charAt(0).toUpperCase();

export function moDoiAnh(anhHienTai = "", ten = "") {
  return new Promise(traVe => {
    let anhMoi = anhHienTai;       // ảnh đang xem trước
    let luong = null;              // luồng camera đang mở

    const nen = document.createElement("div");
    nen.className = "modal-nen";
    nen.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Đổi ảnh đại diện">
        <h3>Đổi ảnh đại diện</h3>

        <div class="anh-xem-truoc" id="xemTruoc"></div>
        <div class="camera" id="khungCamera" hidden>
          <video id="video" autoplay playsinline muted></video>
          <button class="btn primary" id="nutChup" type="button">📸 Chụp</button>
        </div>
        <div class="alert loi" id="loiAnh" hidden></div>

        <div class="anh-nut">
          <button class="btn" id="nutChonFile" type="button">🖼 Chọn ảnh từ máy</button>
          <button class="btn" id="nutCamera" type="button">📷 Chụp ảnh</button>
          <button class="btn danger" id="nutXoaAnh" type="button">Xóa ảnh</button>
        </div>
        <!-- Trên điện thoại, ô chọn file tự cho phép chụp bằng camera hoặc chọn từ thư viện ảnh -->
        <input type="file" id="oFile" accept="image/*" hidden>

        <div class="modal-chan">
          <button class="btn" id="nutHuy" type="button">Hủy</button>
          <button class="btn primary" id="nutLuu" type="button">Lưu ảnh</button>
        </div>
      </div>`;
    document.body.appendChild(nen);
    const $ = id => nen.querySelector("#" + id);

    function veXemTruoc() {
      $("xemTruoc").innerHTML = anhMoi
        ? `<img src="${anhMoi}" alt="Ảnh đại diện xem trước">`
        : `<span>${chuDau(ten)}</span>`;
    }
    function baoLoi(chu) { $("loiAnh").textContent = chu; $("loiAnh").hidden = !chu; }

    function tatCamera() {
      luong?.getTracks().forEach(t => t.stop());
      luong = null;
      $("khungCamera").hidden = true;
      $("xemTruoc").style.display = "";      // hiện lại ảnh xem trước
    }
    function dong(ketQua) {
      tatCamera();
      nen.remove();
      document.removeEventListener("keydown", phimEsc);
      traVe(ketQua);
    }
    const phimEsc = ev => { if (ev.key === "Escape") dong(null); };
    document.addEventListener("keydown", phimEsc);

    /* 1. Chọn ảnh từ máy */
    $("nutChonFile").onclick = () => { tatCamera(); $("oFile").click(); };
    $("oFile").onchange = async () => {
      const file = $("oFile").files[0];
      if (!file) return;
      try { anhMoi = await docFileAnh(file); baoLoi(""); veXemTruoc(); }
      catch (err) { baoLoi(err.message); }
      $("oFile").value = "";
    };

    /* 2. Chụp ảnh bằng camera của máy */
    $("nutCamera").onclick = async () => {
      baoLoi("");
      if (!navigator.mediaDevices?.getUserMedia) return baoLoi("Trình duyệt này không hỗ trợ mở camera.");
      try {
        luong = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } });
        $("video").srcObject = luong;
        $("khungCamera").hidden = false;
        $("xemTruoc").style.display = "none";  // đang mở camera thì ẩn ảnh xem trước
      } catch (err) {
        baoLoi(err.name === "NotAllowedError"
          ? "Bạn chưa cho phép web dùng camera. Bấm biểu tượng ổ khóa trên thanh địa chỉ để cho phép."
          : "Không mở được camera (máy không có camera hoặc camera đang được ứng dụng khác dùng).");
      }
    };
    $("nutChup").onclick = () => {
      const v = $("video");
      anhMoi = catVaThuNho(v, v.videoWidth, v.videoHeight);
      tatCamera();
      veXemTruoc();
    };

    /* 3. Xóa ảnh -> quay về chữ cái đầu của tên */
    $("nutXoaAnh").onclick = () => { tatCamera(); anhMoi = ""; veXemTruoc(); };

    $("nutHuy").onclick = () => dong(null);
    nen.onclick = ev => { if (ev.target === nen) dong(null); };   // bấm ra ngoài hộp thoại = Hủy
    $("nutLuu").onclick = () => dong(anhMoi === anhHienTai ? null : anhMoi);

    veXemTruoc();
  });
}
