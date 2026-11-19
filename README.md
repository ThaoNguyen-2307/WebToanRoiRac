# Web hỗ trợ học và mô phỏng thuật toán Toán rời rạc

Đồ án cơ sở ngành. Viết bằng HTML, CSS, JavaScript; đăng nhập và cơ sở dữ liệu dùng **Firebase** (Authentication + Cloud Firestore).

## Các trang và phân quyền

| Vai trò | Trang | Làm được gì |
|---|---|---|
| **Khách** (chưa đăng nhập) | `index.html` | Xem trang chủ, lý thuyết, mô phỏng mọi thuật toán, dùng ví dụ có sẵn |
| **Người dùng** (đã đăng nhập) | `tai-khoan.html` | Như khách, cộng thêm: lưu lịch sử mô phỏng, mô phỏng lại, đổi tên, đổi mật khẩu |
| **Đăng nhập / Đăng ký** | `dang-nhap.html` | Email + mật khẩu, **Google** (Gmail), quên mật khẩu |
| **Admin** | `admin/index.html` | Thống kê: số tài khoản, lượt mô phỏng, thuật toán dùng nhiều nhất |
| | `admin/tai-khoan.html` | Đổi vai trò (người dùng ↔ admin), khóa / mở khóa tài khoản |
| | `admin/vi-du.html` | Thêm / sửa / xóa ví dụ có sẵn cho từng thuật toán (yêu cầu ≥ 5 ví dụ) |

Đăng nhập xong: admin được chuyển vào `admin/index.html`, người dùng quay về trang đang xem.
Người dùng thường mở trang `admin/...` sẽ thấy thông báo "không có quyền".

## Cấu trúc thư mục

```
web-toan-roi-rac/
├── index.html            Trang khách (trang chủ + trang từng thuật toán)
├── dang-nhap.html        Đăng nhập / đăng ký
├── tai-khoan.html        Tài khoản của tôi (phải đăng nhập)
├── admin/
│   ├── index.html        Tổng quan
│   ├── tai-khoan.html    Quản lý tài khoản
│   └── vi-du.html        Quản lý ví dụ
├── css/style.css         Toàn bộ giao diện
├── js/
│   ├── data.js           Dữ liệu các thuật toán (tên, ô nhập, mã giả)
│   ├── main.js           Trang khách: menu, trang thuật toán, bộ điều khiển mô phỏng
│   ├── firebase-config.js  THÔNG TIN KẾT NỐI FIREBASE (tự điền)
│   ├── firebase.js       Dùng chung: kết nối, hồ sơ, phân quyền, thanh người dùng
│   ├── trang-khach.js    Nối trang khách với Firebase (lưu lịch sử, tải ví dụ)
│   ├── dang-nhap.js      Xử lý đăng nhập / đăng ký
│   ├── tai-khoan.js      Xử lý trang tài khoản
│   └── admin.js          Xử lý 3 trang admin
└── firestore.rules       Luật bảo mật cơ sở dữ liệu
```

## Cơ sở dữ liệu (Cloud Firestore)

| Bảng | Nội dung |
|---|---|
| `users/{uid}` | `email, ten, anh, dangNhapBang, vaiTro ("user" / "admin"), biKhoa, ngayTao, lanCuoi` |
| `users/{uid}/history/{id}` | `algoId, algoName, values, createdAt` (lịch sử mô phỏng của từng người) |
| `users/{uid}/baiLuu/{id}` | `algoId, algoName, ten, values, ngayTao` (Bài của tôi: dữ liệu người dùng tự lưu, có đặt tên) |
| `examples/{id}` | `algoId, tieuDe, values, ngayTao` (ví dụ có sẵn, admin quản lý) |

## Cấu hình Firebase (làm 1 lần)

1. Vào https://console.firebase.google.com → **Create a project** (đặt tên, ví dụ `web-toan-roi-rac`), có thể tắt Google Analytics.
2. Trong project: bấm biểu tượng **Web `</>`** để thêm Web app → đặt tên → **Register app**.
   Firebase hiện đoạn `const firebaseConfig = {...}`: chép các giá trị vào file `js/firebase-config.js`.
3. **Build → Authentication → Get started → Sign-in method**, bật:
   - **Email/Password**
   - **Google** (chọn email hỗ trợ là email của bạn → Save)
4. **Authentication → Settings → Authorized domains**: thêm `127.0.0.1` (Live Server mở web ở địa chỉ này; `localhost` có sẵn).
5. **Build → Firestore Database → Create database** → chọn vị trí `asia-southeast1` (Singapore) → **Production mode**.
6. Tab **Rules** của Firestore: xóa hết, dán toàn bộ nội dung file `firestore.rules` → **Publish**.

### Tạo tài khoản admin đầu tiên

1. Mở web, đăng ký một tài khoản như bình thường.
2. Firebase Console → **Firestore Database** → bảng `users` → bấm vào tài khoản của bạn → sửa trường `vaiTro` từ `user` thành `admin`.
3. Đăng nhập lại: bạn sẽ vào được trang quản trị. Các admin sau có thể cấp quyền ngay trong `admin/tai-khoan.html`.

## Chạy web

Mở thư mục bằng VS Code → chuột phải `index.html` → **Open with Live Server**.
Không mở trực tiếp bằng cách bấm đúp file `.html`, vì phần đăng nhập (`type="module"`) chỉ chạy qua máy chủ như Live Server.

Chưa điền `firebase-config.js` thì web vẫn mô phỏng được bình thường (như khách); trang đăng nhập sẽ báo "Chưa cấu hình Firebase".

## Bảo mật

- Thông tin trong `firebase-config.js` được phép công khai. Dữ liệu được bảo vệ bởi `firestore.rules`:
  người dùng không tự cấp quyền admin hay tự mở khóa được, chỉ xem được lịch sử của chính mình.
- In dữ liệu người dùng ra HTML luôn qua hàm `e(...)` để chống chèn mã (XSS).
