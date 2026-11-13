/* =========================================================
   trang-khach.js — NỐI TRANG KHÁCH (index.html) VỚI FIREBASE
   - Hiện nút Đăng nhập / Đăng ký hoặc tên người dùng trên thanh tiêu đề
   - Cung cấp cho main.js đối tượng App:
       trangThai()             -> "dang-tai" | "khach" | "thanh-vien"
       theoDoi(callback)       -> gọi callback mỗi khi đăng nhập / đăng xuất
       layViDu(algoId)         -> danh sách ví dụ do admin nhập
       layLichSu(soLuong)      -> lịch sử mô phỏng của người đang đăng nhập (mới nhất trước)
       luuLichSu(algo, values) -> lưu 1 lần mô phỏng (chỉ khi đã đăng nhập)
   Khách chưa đăng nhập vẫn dùng web bình thường, chỉ không lưu lịch sử.
   ========================================================= */
import { db, daCauHinh, theoDoiDangNhap, veThanhNguoiDung } from "./firebase.js";
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let nguoiDung = null;
let daBiet = !daCauHinh;            // đã biết đăng nhập hay chưa (chưa cấu hình -> coi như khách)
let lanLuuCuoi = "";                // tránh lưu trùng khi bấm "Bắt đầu" nhiều lần với cùng dữ liệu
const nguoiNghe = [];

const App = {
  trangThai() {
    if (!daBiet) return "dang-tai";
    return nguoiDung ? "thanh-vien" : "khach";
  },

  theoDoi(callback) {
    nguoiNghe.push(callback);
    callback();
  },

  async layViDu(algoId) {
    if (!daCauHinh) return [];
    const snap = await getDocs(query(collection(db, "examples"), where("algoId", "==", algoId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ngayTao?.toMillis?.() || 0) - (b.ngayTao?.toMillis?.() || 0));
  },

  async layLichSu(soLuong = 30) {
    if (!nguoiDung) return [];
    const q = query(collection(db, "users", nguoiDung.uid, "history"),
                    orderBy("createdAt", "desc"), limit(soLuong));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async luuLichSu(algo, values) {
    if (!nguoiDung) return false;                    // khách: không lưu
    const khoa = algo.id + JSON.stringify(values);
    if (khoa === lanLuuCuoi) return false;           // giống hệt lần vừa lưu -> bỏ qua
    lanLuuCuoi = khoa;
    await addDoc(collection(db, "users", nguoiDung.uid, "history"), {
      algoId: algo.id,
      algoName: algo.name,
      values,
      createdAt: serverTimestamp()
    });
    return true;
  }
};

theoDoiDangNhap((user, hoSo) => {
  nguoiDung = user;
  daBiet = true;
  lanLuuCuoi = "";
  veThanhNguoiDung(user, hoSo);
  nguoiNghe.forEach(cb => cb());
});

// Báo cho main.js biết phần Firebase đã sẵn sàng
window.__baoSanSang?.(App);
