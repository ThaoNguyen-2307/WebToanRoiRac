/* =========================================================
   firebase-config.js — THÔNG TIN KẾT NỐI FIREBASE
   Lấy ở: Firebase Console -> Project settings (bánh răng) -> Your apps -> Web app -> SDK setup and configuration -> Config
   Dán đè các giá trị "DIEN_..." bên dưới. (Xem README.md, mục "Cấu hình Firebase")
   Các giá trị này được phép công khai; bảo mật nằm ở file firestore.rules.
   ========================================================= */
export const firebaseConfig = {
  apiKey: "DIEN_API_KEY",
  authDomain: "DIEN_PROJECT_ID.firebaseapp.com",
  projectId: "DIEN_PROJECT_ID",
  storageBucket: "DIEN_PROJECT_ID.appspot.com",
  messagingSenderId: "DIEN_SENDER_ID",
  appId: "DIEN_APP_ID"
};
