const THONG_TIN_DO_AN = {
  deTai: "Xây dựng ứng dụng Web hỗ trợ học và mô phỏng các thuật toán trong toán rời rạc",
  hocPhan: "Đồ án cơ sở ngành",
  sinhVien: "Nguyễn Đỗ Thảo Nguyên",
  mssv: "66132371",
  lop: "66CNPM",
  gvhd: "ThS. Nguyễn Hải Triều",
  khoa: "Khoa Công nghệ Thông tin",
  truong: "Trường Đại học Nha Trang",
  nam: 2026,
  github: "https://github.com/ThaoNguyen-2307/WebToanRoiRac"
};

function veChanTrang() {
  const chan = document.getElementById("siteFooter");
  if (!chan) return;
  const T = THONG_TIN_DO_AN;
  const goc = document.getElementById("app") ? "" : "index.html";
  const coThuatToan = typeof GROUPS !== "undefined" && typeof ALGORITHMS !== "undefined";

  const cotThuatToan = coThuatToan ? GROUPS.map(g => `
    <div class="ft-cot">
      <h4>${g.name}</h4>
      ${ALGORITHMS.filter(a => a.group === g.id).map(a =>
    `<a href="${goc}#/algo/${a.id}">${a.name.split(/[:—(]/)[0].trim()}</a>`).join("")}
    </div>`).join("") : "";

  chan.innerHTML = `
    <div class="ft-tren">
      <div class="ft-gioi-thieu">
        <a href="${goc}#/" class="logo ft-logo"><span class="logo-mark">∑</span><span>Toán Rời Rạc <small>Mô phỏng thuật toán</small></span></a>
        <div class="ft-lien-ket">
          <a href="${goc}#/gioi-thieu">Giới thiệu đồ án</a>
          <a href="${goc}#/huong-dan/mo-phong">Hướng dẫn sử dụng</a>
          ${T.github ? `<a href="${T.github}" target="_blank" rel="noopener">Mã nguồn GitHub</a>` : ""}
        </div>
      </div>
      ${cotThuatToan}
    </div>
    <div class="ft-duoi">
      <span>${T.hocPhan} · ${T.khoa} · ${T.truong}</span>
      <span>SV thực hiện: <b>${T.sinhVien}</b>${T.lop ? ` (${T.lop})` : ""} · GVHD: <b>${T.gvhd}</b> · © ${T.nam}</span>
    </div>`;
}

veChanTrang();

document.addEventListener("click", ev => {
  const logo = ev.target.closest("a.logo");
  if (!logo || !document.getElementById("app")) return;          // chỉ xử lý trên trang khách index.html
  if ((location.hash || "#/") === "#/" && logo.getAttribute("href") === "#/") {
    ev.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
