import { db, daCauHinh, theoDoiDangNhap, veThanhNguoiDung } from "./firebase.js";
import { collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, doc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let nguoiDung = null;
let daBiet = !daCauHinh;
let lanLuuCuoi = "";
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
  },

  async layBaiLuu(algoId) {
    if (!nguoiDung) return [];
    const snap = await getDocs(query(collection(db, "users", nguoiDung.uid, "baiLuu"), where("algoId", "==", algoId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.ngayTao?.toMillis?.() || 0) - (a.ngayTao?.toMillis?.() || 0));
  },

  async luuBai(algo, ten, values) {
    if (!nguoiDung) throw new Error("Bạn cần đăng nhập để lưu bài.");
    await addDoc(collection(db, "users", nguoiDung.uid, "baiLuu"), {
      algoId: algo.id,
      algoName: algo.name,
      ten,
      values,
      ngayTao: serverTimestamp()
    });
  },

  async xoaBai(id) {
    if (!nguoiDung) return;
    await deleteDoc(doc(db, "users", nguoiDung.uid, "baiLuu", id));
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
