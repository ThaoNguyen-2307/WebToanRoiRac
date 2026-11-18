/* =========================================================
   main.js — XỬ LÝ giao diện
   1. Vẽ menu bên trái
   2. Điều hướng trang (trang chủ <-> trang thuật toán)
   3. Vẽ trang thuật toán (nhập liệu, mô phỏng, mã giả, nhật ký)
   4. Bộ điều khiển mô phỏng (Tiếp / Lùi / Tự chạy / Đặt lại)
   ========================================================= */

const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");

/* Phần Firebase (js/trang-khach.js) nạp sau file này. Khi sẵn sàng nó gọi __baoSanSang(App).
   Dùng: const App = await sanSang;  App.layViDu(...), App.luuLichSu(...)
   Nếu Firebase lỗi / chưa cấu hình, web vẫn chạy bình thường như khách.             */
const sanSang = new Promise(resolve => { window.__baoSanSang = resolve; });

/* ---------- 1. CỘT BÊN TRÁI: LỊCH SỬ MÔ PHỎNG ----------
   Máy tính: chỉ hiện lịch sử (chọn thuật toán bằng menu ngang phía trên).
   Điện thoại: menu ngang bị ẩn nên hiện thêm danh sách thuật toán ở cuối.     */
function renderSidebar() {
  let html = `
    <a href="#/" class="nav-home">⌂ Trang chủ</a>
    <div class="nav-title">🕘 Lịch sử mô phỏng</div>
    <div id="historyList"><p class="history-empty">Đang tải...</p></div>

    <div class="mobile-only">`;
  for (const g of GROUPS) {
    html += `<div class="nav-group"><div class="nav-title">${g.icon} ${g.name}</div>`;
    for (const a of ALGORITHMS.filter(x => x.group === g.id)) {
      html += `<a href="#/algo/${a.id}" class="nav-link" data-id="${a.id}">${a.name}</a>`;
    }
    html += `</div>`;
  }
  sidebar.innerHTML = html + `</div>`;
  khoiTaoLichSu();
}

let lichSuApp = null;

async function khoiTaoLichSu() {
  // Quá 5 giây chưa kết nối được Firebase -> coi như khách
  const hetGio = setTimeout(() => { if (!lichSuApp) veLichSuKhach(); }, 5000);
  lichSuApp = await sanSang;
  clearTimeout(hetGio);
  lichSuApp.theoDoi(veLichSu);        // vẽ lại mỗi khi đăng nhập / đăng xuất
}

function veLichSuKhach() {
  document.getElementById("historyList").innerHTML = `
    <div class="history-empty">
      <p>Đăng nhập để lưu lại các bài bạn đã mô phỏng và mở lại bất cứ lúc nào.</p>
      <a class="btn primary full" href="dang-nhap.html">Đăng nhập</a>
    </div>`;
}

async function veLichSu() {
  const khung = document.getElementById("historyList");
  const trangThai = lichSuApp.trangThai();
  if (trangThai === "dang-tai") { khung.innerHTML = `<p class="history-empty">Đang tải...</p>`; return; }
  if (trangThai === "khach") { veLichSuKhach(); return; }

  let ds;
  try { ds = await lichSuApp.layLichSu(30); }
  catch (e) { console.error(e); khung.innerHTML = `<p class="history-empty">Không tải được lịch sử.</p>`; return; }

  if (!ds.length) {
    khung.innerHTML = `<p class="history-empty">Chưa có bài nào. Chọn một thuật toán ở menu phía trên rồi bấm "Bắt đầu mô phỏng".</p>`;
    return;
  }

  // Chia nhóm theo ngày: Hôm nay / Hôm qua / 7 ngày qua / Cũ hơn
  const nhom = {};
  ds.forEach((h, i) => { (nhom[tenNgay(h.createdAt)] ||= []).push({ ...h, i }); });

  khung.innerHTML = Object.entries(nhom).map(([ten, muc]) => `
    <div class="history-day">${ten}</div>
    ${muc.map(h => `
      <button class="history-item" data-i="${h.i}" title="${escapeHtml(h.algoName)}">
        <span class="history-algo">${escapeHtml(h.algoName)}</span>
        <span class="history-sub">${escapeHtml(tomTatDuLieu(h.values))}</span>
      </button>`).join("")}`).join("")
    + `<a class="history-all" href="tai-khoan.html">Xem tất cả →</a>`;

  // Bấm 1 mục -> mở đúng thuật toán và điền lại dữ liệu cũ
  khung.querySelectorAll(".history-item").forEach(nut => nut.onclick = () => {
    const h = ds[nut.dataset.i];
    document.body.classList.remove("menu-open");
    if (currentAlgo?.id === h.algoId && location.hash.startsWith("#/algo/")) {
      dienDuLieu(h.values);
      addLog("Đã nạp lại dữ liệu từ lịch sử. Bấm \"Bắt đầu mô phỏng\" để chạy.");
    } else {
      try { sessionStorage.setItem("napLai", JSON.stringify({ algoId: h.algoId, values: h.values })); } catch (e) {}
      location.hash = `#/algo/${h.algoId}`;
    }
  });
}

function tenNgay(ts) {
  if (!ts?.toDate) return "Hôm nay";
  const ngay = ts.toDate(); ngay.setHours(0, 0, 0, 0);
  const homNay = new Date(); homNay.setHours(0, 0, 0, 0);
  const cach = Math.round((homNay - ngay) / 86400000);
  if (cach <= 0) return "Hôm nay";
  if (cach === 1) return "Hôm qua";
  if (cach < 7) return "7 ngày qua";
  return "Cũ hơn";
}

// { n: "4", matrix: "0 1\n1 0" } -> "n = 4 · ma trận 2×2"
function tomTatDuLieu(values = {}) {
  return Object.entries(values).map(([k, v]) => {
    v = String(v);
    if (v.includes("\n")) {
      const hang = v.trim().split("\n");
      return `ma trận ${hang.length}×${hang[0].trim().split(/\s+/).length}`;
    }
    return /^[a-z]\w*$/i.test(k) && k.length <= 5 && !isNaN(v) ? `${k} = ${v}` : v;
  }).join(" · ");
}

// Menu ngang trên cùng: mỗi nhóm là 1 mục, rê chuột vào thì thả xuống danh sách thuật toán
function renderTopNav() {
  document.getElementById("topnav").innerHTML = GROUPS.map(g => `
    <div class="dropdown" data-group="${g.id}">
      <button class="dropdown-btn">
        <span class="nav-icon">${NAV_ICONS[g.id]}</span>
        <span class="nav-label">${g.name}</span>
      </button>
      <div class="dropdown-menu">
        ${ALGORITHMS.filter(a => a.group === g.id)
          .map(a => `<a href="#/algo/${a.id}">${a.name}</a>`).join("")}
      </div>
    </div>`).join("");
}

// Tô sáng mục đang chọn trong menu
function highlightNav(id) {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.id === id);
  });
  const algo = ALGORITHMS.find(a => a.id === id);
  document.querySelectorAll(".dropdown").forEach(d => {
    d.classList.toggle("active", !!algo && d.dataset.group === algo.group);
  });
}

/* ---------- 2. ĐIỀU HƯỚNG ----------
   Dùng phần sau dấu # trên địa chỉ web:
   #/                      -> trang chủ
   #/algo/nhau             -> trang thuật toán n quân hậu
   #/algo/nhau/ly-thuyet   -> trang thuật toán, mở sẵn tab Lý thuyết
   #/huong-dan/mo-phong    -> trang hướng dẫn 1 tính năng            */
function router() {
  stopAutoPlay();
  const hash = location.hash || "#/";
  const parts = hash.split("/");          // ["#", "algo", "nhau"]
  const algo = parts[1] === "algo" ? ALGORITHMS.find(a => a.id === parts[2]) : null;
  const huongDan = parts[1] === "huong-dan" ? FEATURES.find(f => f.id === parts[2]) : null;
  if (algo) {
    document.body.classList.remove("home");   // trang thuật toán: hiện menu bên trái
    renderAlgoPage(algo);
    highlightNav(algo.id);
    if (parts[3] === "ly-thuyet") document.querySelector('.tab[data-tab="theory"]').click();
  } else if (parts[1] === "gioi-thieu") {
    document.body.classList.add("home");      // trang giới thiệu: dàn rộng như trang chủ
    renderGioiThieu();
    highlightNav(null);
  } else if (huongDan) {
    document.body.classList.add("home");      // trang hướng dẫn: dàn rộng như trang chủ
    renderGuide(huongDan);
    highlightNav(null);
  } else {
    document.body.classList.add("home");      // trang chủ: ẩn menu bên trái, dàn rộng toàn trang
    renderHome();
    highlightNav(null);
  }
  document.body.classList.remove("menu-open");   // đóng menu trên điện thoại
  document.activeElement?.blur();                // bỏ chọn mục menu vừa bấm để menu thả xuống tự đóng
  window.scrollTo(0, 0);
}

/* ---------- TRANG CHỦ ---------- */
/* Các tính năng giới thiệu ở trang chủ. Bấm vào -> trang hướng dẫn #/huong-dan/{id}
   steps: các bước sử dụng; meo: mẹo nhỏ; thu: bài để bấm "Thử ngay" (tab: mở sẵn tab nào) */
const FEATURES = [
  { id: "mo-phong", icon: "▶", title: "Mô phỏng từng bước",
    text: "Xem thuật toán chạy chậm từng bước, có thể tiến, lùi hoặc tự chạy.",
    steps: [
      "Chọn một bài toán: bấm vào thẻ ở trang chủ hoặc chọn trên thanh menu phía trên.",
      "Nhập dữ liệu ở cột bên trái (hoặc giữ nguyên dữ liệu mặc định).",
      "Bấm <b>▶ Bắt đầu mô phỏng</b>. Hình vẽ ở giữa hiện bước đầu tiên.",
      "Bấm <b>Tiếp ▶</b> để đi tới 1 bước, <b>◀ Lùi</b> để quay lại bước trước.",
      "Bấm <b>▶ Tự chạy</b> để web tự đi hết các bước; kéo thanh <b>Tốc độ</b> để chạy nhanh hoặc chậm hơn. Bấm <b>⏸ Dừng</b> để tạm dừng.",
      "Bấm <b>⟲</b> để xóa kết quả và làm lại từ đầu."
    ],
    meo: "Ô \"Bước 3 / 15\" ở góc dưới cho biết bạn đang ở bước nào trên tổng số bước.",
    thu: { algo: "hanoi" } },

  { id: "ma-gia", icon: "≡", title: "Mã giả tô sáng",
    text: "Dòng mã giả đang thực hiện được tô sáng để dễ theo dõi.",
    steps: [
      "Mở một bài toán bất kỳ. Khung <b>Mã giả</b> nằm ở cột bên phải.",
      "Bắt đầu mô phỏng. Dòng đang được thực hiện sẽ được <b>tô vàng</b>.",
      "Mỗi lần bấm Tiếp hoặc Lùi, dòng tô vàng di chuyển theo đúng bước đó.",
      "Đọc khung <b>Giải thích từng bước</b> ngay bên dưới để biết ở bước đó thuật toán làm gì."
    ],
    meo: "Vừa nhìn hình vẽ ở giữa vừa nhìn dòng tô vàng giúp bạn nối được \"code\" với \"hình\", đây là cách nhớ thuật toán nhanh nhất.",
    thu: { algo: "nhau" } },

  { id: "nhap-du-lieu", icon: "✎", title: "Tự nhập dữ liệu",
    text: "Nhập số, danh sách hoặc ma trận của riêng bạn để web giải.",
    steps: [
      "<b>Số</b> (ví dụ số đĩa n, kích thước bàn cờ): gõ trực tiếp vào ô.",
      "<b>Danh sách</b> (ví dụ trọng lượng đồ vật): các số cách nhau bằng dấu phẩy, ví dụ <code>3, 4, 5, 2</code>.",
      "<b>Ma trận</b> (đồ thị, bảng chi phí): mỗi dòng là 1 hàng, các số cách nhau bằng dấu cách. Số <code>0</code> nghĩa là không có cạnh.",
      "Nhập xong bấm <b>▶ Bắt đầu mô phỏng</b> để web giải theo dữ liệu của bạn."
    ],
    vidu: "0 4 1 0\n4 0 2 5\n1 2 0 8\n0 5 8 0",
    meo: "Nên nhập dữ liệu nhỏ (4 đến 6 đỉnh, n ≤ 8) để hình vẽ dễ nhìn và mô phỏng không quá dài.",
    thu: { algo: "dijkstra" } },

  { id: "vi-du", icon: "★", title: "Ví dụ có sẵn",
    text: "Mỗi thuật toán có sẵn các bài mẫu, bấm một nút là chạy.",
    steps: [
      "Mở một bài toán, nhìn mục <b>Ví dụ có sẵn</b> ở cột bên trái.",
      "Bấm vào tên một ví dụ: dữ liệu được điền sẵn vào các ô.",
      "Bấm <b>▶ Bắt đầu mô phỏng</b> để chạy ví dụ đó.",
      "Bấm <b>Mặc định</b> để quay về dữ liệu ban đầu."
    ],
    meo: "Đăng nhập để mỗi bài bạn đã chạy được lưu vào cột Lịch sử bên trái, lần sau bấm vào là mở lại ngay.",
    thu: { algo: "hanoi" } },

  { id: "ly-thuyet", icon: "✦", title: "Lý thuyết ngắn gọn",
    text: "Ý tưởng, mã giả và độ phức tạp của từng thuật toán.",
    steps: [
      "Mở một bài toán, bấm tab <b>Lý thuyết</b> (ngay cạnh tab Mô phỏng).",
      "Đọc phần <b>Ý tưởng</b> để hiểu thuật toán giải bài toán theo cách nào.",
      "Xem <b>Mã giả</b> đầy đủ và <b>Độ phức tạp</b> (thuật toán chạy nhanh hay chậm khi dữ liệu lớn).",
      "Quay lại tab <b>Mô phỏng</b> để xem thuật toán chạy thật."
    ],
    meo: "Nên đọc lý thuyết trước rồi mới mô phỏng: bạn sẽ đoán trước được bước tiếp theo và hiểu sâu hơn.",
    thu: { algo: "bfsdfs", tab: "ly-thuyet" } },

  { id: "so-sanh", icon: "⇄", title: "So sánh kỹ thuật",
    text: "So sánh đệ quy thường với quy hoạch động, quay lui với nhánh cận.",
    steps: [
      "Mở bài <b>Fibonacci</b>, ở ô <b>Cách giải</b> chọn \"Đệ quy thường\" rồi mô phỏng, ghi lại số bước.",
      "Đổi sang \"Quy hoạch động\" và mô phỏng lại với cùng n.",
      "So sánh số bước: quy hoạch động không tính lại các giá trị đã có nên ít bước hơn hẳn.",
      "Với bài <b>Người du lịch (TSP)</b>: các nhánh bị <b>cắt bỏ</b> (vì chắc chắn không tốt hơn kết quả đang có) được tô xám, cho thấy nhánh cận nhanh hơn quay lui thường."
    ],
    meo: "Thử với n lớn dần (5, 6, 7...) để thấy khoảng cách giữa hai cách giải tăng rất nhanh.",
    thu: { algo: "fibonacci" } }
];

/* ---------- TRANG HƯỚNG DẪN ---------- */
function renderGuide(f) {
  const algo = ALGORITHMS.find(a => a.id === f.thu.algo);
  const linkThu = `#/algo/${algo.id}${f.thu.tab ? "/" + f.thu.tab : ""}`;
  app.innerHTML = `
    <div class="guide">
      <a class="guide-back" href="#/">← Trang chủ</a>
      <div class="guide-head">
        <span class="feature-icon big">${f.icon}</span>
        <div>
          <span class="crumb">Hướng dẫn sử dụng</span>
          <h1>${f.title}</h1>
          <p>${f.text}</p>
        </div>
      </div>

      <ol class="guide-steps">
        ${f.steps.map(s => `<li>${s}</li>`).join("")}
      </ol>

      ${f.vidu ? `<div class="guide-example"><span>Ví dụ ma trận 4 đỉnh:</span><pre>${f.vidu}</pre></div>` : ""}

      <div class="guide-tip"><b>Mẹo:</b> ${f.meo}</div>

      <a class="btn primary guide-try" href="${linkThu}">Thử ngay với bài "${algo.name}" →</a>

      <h3 class="guide-others-title">Hướng dẫn khác</h3>
      <div class="guide-others">
        ${FEATURES.filter(x => x.id !== f.id).map(x => `
          <a href="#/huong-dan/${x.id}"><span class="feature-icon">${x.icon}</span>${x.title}</a>`).join("")}
      </div>
    </div>`;
}

/* ---------- TRANG GIỚI THIỆU ĐỒ ÁN (#/gioi-thieu) ----------
   Thông tin sinh viên, giảng viên lấy từ THONG_TIN_DO_AN trong js/chan-trang.js */
function renderGioiThieu() {
  const T = THONG_TIN_DO_AN;
  const dong = (nhan, giaTri) => giaTri ? `<tr><th>${nhan}</th><td>${giaTri}</td></tr>` : "";
  const soViDuToiThieu = 5;
  app.innerHTML = `
    <div class="guide gioi-thieu">
      <a class="guide-back" href="#/">← Trang chủ</a>
      <div class="guide-head">
        <span class="feature-icon big">ⓘ</span>
        <div>
          <span class="crumb">Giới thiệu</span>
          <h1>Về đồ án này</h1>
          <p>${T.deTai}.</p>
        </div>
      </div>

      <table class="gt-bang">
        ${dong("Học phần", T.hocPhan)}
        ${dong("Sinh viên thực hiện", T.sinhVien)}
        ${dong("Mã số sinh viên", T.mssv)}
        ${dong("Lớp", T.lop)}
        ${dong("Giảng viên hướng dẫn", T.gvhd)}
        ${dong("Đơn vị", `${T.khoa}, ${T.truong}`)}
        ${dong("Năm thực hiện", T.nam)}
        ${dong("Mã nguồn", T.github ? `<a class="link" href="${T.github}" target="_blank" rel="noopener">${T.github.replace("https://", "")}</a>` : "")}
      </table>

      <h2>Mục tiêu</h2>
      <ul class="gt-ds">
        <li>Trực quan hóa cách các thuật toán của môn Toán rời rạc hoạt động: chạy từng bước, tô sáng dòng mã giả, giải thích bằng tiếng Việt.</li>
        <li>Giải các bài toán tiêu biểu trong bài giảng, mỗi thuật toán có ít nhất ${soViDuToiThieu} ví dụ.</li>
        <li>Cho người dùng tự nhập dữ liệu, kể cả ma trận kề, ma trận chi phí của đồ thị.</li>
        <li>So sánh các kỹ thuật: đệ quy thường với quy hoạch động, vét cạn với nhánh cận.</li>
      </ul>

      <h2>Các thuật toán</h2>
      <div class="gt-nhom">
        ${GROUPS.map(g => `
          <div class="gt-the">
            <h3><span>${NAV_ICONS?.[g.id] || g.icon}</span>${g.name}</h3>
            ${ALGORITHMS.filter(a => a.group === g.id).map(a =>
              `<a href="#/algo/${a.id}">${a.name}<small>${a.complexity}</small></a>`).join("")}
          </div>`).join("")}
      </div>

      <h2>Chức năng theo vai trò</h2>
      <div class="gt-vai-tro">
        <div><b>Khách</b><p>Xem lý thuyết, chạy mô phỏng mọi thuật toán, dùng ví dụ có sẵn, tự nhập dữ liệu.</p></div>
        <div><b>Người dùng đã đăng nhập</b><p>Tự động lưu lịch sử mô phỏng, lưu “Bài của tôi”, đổi tên, ảnh đại diện, mật khẩu.</p></div>
        <div><b>Quản trị viên</b><p>Xem thống kê, phân quyền và khóa tài khoản, quản lý ví dụ cho từng thuật toán.</p></div>
      </div>

      <h2>Công nghệ sử dụng</h2>
      <div class="gt-cong-nghe">
        <span>HTML, CSS, JavaScript</span><span>SVG (vẽ hình mô phỏng)</span>
        <span>Firebase Authentication</span><span>Cloud Firestore</span><span>Git, GitHub</span>
      </div>
    </div>`;
}

let homeGroup = "quaylui";   // nhóm đang chọn ở trang chủ

function renderHome() {
  app.innerHTML = `
    <!-- KHỐI ĐẦU TRANG: tiêu đề + ô tìm kiếm + nhóm chủ đề -->
    <section class="hero">
      <h1>Máy mô phỏng thuật toán</h1>
      <p>Nhập tên bài toán hoặc chọn chủ đề để xem thuật toán chạy từng bước</p>

      <form class="search" id="searchForm" autocomplete="off">
        <input id="searchInput" type="text" placeholder="Ví dụ: tháp hà nội, n quân hậu, dijkstra...">
        <button type="submit" class="search-btn">Mô phỏng</button>
        <div class="suggest" id="suggest"></div>
      </form>

      <div class="group-tabs" id="groupTabs">
        ${GROUPS.map(g => `<button class="group-tab" data-group="${g.id}">${g.icon} ${g.name}</button>`).join("")}
      </div>
      <div class="topic-chips" id="topicChips"></div>
    </section>

    <!-- THẺ TỪNG THUẬT TOÁN: hình minh họa + tên + mô tả, bấm vào là mở trang mô phỏng -->
    <section class="algo-section">
      <h2>Học thuật toán đơn giản hơn</h2>
      <div class="algo-grid">
        ${ALGORITHMS.map(a => {
          const hinh = MINH_HOA[a.id] || { mau: "#34403a", svg: "" };
          return `
          <a class="algo-card" href="#/algo/${a.id}">
            <div class="algo-art" style="background:${hinh.mau}">
              <svg viewBox="0 0 200 200" aria-hidden="true">${hinh.svg}</svg>
            </div>
            <h3>${a.name}</h3>
            <p>${a.short}</p>
          </a>`;
        }).join("")}
      </div>
    </section>

    <!-- ĐIỂM NỔI BẬT -->
    <section class="features">
      ${FEATURES.map(f => `
        <a class="feature" href="#/huong-dan/${f.id}">
          <span class="feature-icon">${f.icon}</span>
          <div><strong>${f.title}</strong><p>${f.text}</p>
            <span class="feature-more">Xem hướng dẫn →</span></div>
        </a>`).join("")}
    </section>`;

  // Bấm vào nhóm -> đổi danh sách bài toán bên dưới
  document.querySelectorAll(".group-tab").forEach(tab => {
    tab.onclick = () => { homeGroup = tab.dataset.group; renderTopicChips(); };
  });
  renderTopicChips();

  // Ô tìm kiếm: gõ tới đâu gợi ý tới đó, Enter thì mở bài khớp nhất
  const input = document.getElementById("searchInput");
  input.oninput = () => renderSuggest(input.value);
  document.getElementById("searchForm").onsubmit = e => {
    e.preventDefault();
    const found = searchAlgorithms(input.value);
    if (found.length) location.hash = `#/algo/${found[0].id}`;
    else renderSuggest(input.value, true);
  };
}

function renderTopicChips() {
  document.querySelectorAll(".group-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.group === homeGroup));
  document.getElementById("topicChips").innerHTML = ALGORITHMS
    .filter(a => a.group === homeGroup)
    .map(a => `<a class="topic-chip" href="#/algo/${a.id}">${a.name}</a>`).join("");
}

// Bỏ dấu tiếng Việt để tìm "thap ha noi" vẫn ra "Tháp Hà Nội"
function boDau(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

function searchAlgorithms(text) {
  const q = boDau(text.trim());
  if (!q) return [];
  return ALGORITHMS.filter(a => {
    const group = GROUPS.find(g => g.id === a.group).name;
    return boDau(a.name + " " + a.short + " " + group).includes(q);
  });
}

function renderSuggest(text, showEmpty = false) {
  const box = document.getElementById("suggest");
  const found = searchAlgorithms(text);
  if (found.length) {
    box.innerHTML = found.map(a => `<a href="#/algo/${a.id}">${a.name}</a>`).join("");
  } else {
    box.innerHTML = showEmpty && text.trim() ? `<span>Không tìm thấy bài toán phù hợp</span>` : "";
  }
}

/* ---------- 3. TRANG THUẬT TOÁN ---------- */
let currentAlgo = null;

function renderAlgoPage(algo) {
  currentAlgo = algo;
  const group = GROUPS.find(g => g.id === algo.group);

  app.innerHTML = `
    <div class="page-head">
      <span class="crumb">${group.icon} ${group.name}</span>
      <h1>${algo.name}</h1>
      <p>${algo.short}</p>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="sim">Mô phỏng</button>
      <button class="tab" data-tab="theory">Lý thuyết</button>
    </div>

    <!-- TAB MÔ PHỎNG -->
    <div class="tab-panel" id="tab-sim">
      <div class="sim-grid">

        <!-- Cột trái: nhập dữ liệu -->
        <aside class="panel">
          <h3>Dữ liệu đầu vào</h3>
          <form id="inputForm">${algo.inputs.map(renderInput).join("")}</form>
          <div class="alert loi" id="loiNhap" hidden></div>
          <h4>Ví dụ có sẵn</h4>
          <div class="examples" id="examples"><small class="hint">Đang tải ví dụ...</small></div>

          <!-- BÀI CỦA TÔI: dữ liệu người dùng tự lưu (cần đăng nhập) -->
          <div class="bai-head">
            <h4>Bài của tôi</h4>
            <button class="link-nho" id="btnLuuBai" type="button" hidden>💾 Lưu bài này</button>
          </div>
          <form class="luu-bai" id="formLuuBai" hidden>
            <input name="ten" maxlength="60" placeholder="Đặt tên cho bài, VD: Bài 3 trong slide" aria-label="Tên bài">
            <div class="luu-bai-nut">
              <button class="btn sm" type="button" id="huyLuuBai">Hủy</button>
              <button class="btn sm primary">Lưu</button>
            </div>
          </form>
          <div class="alert" id="tbLuuBai" hidden></div>
          <div class="examples" id="baiCuaToi"><small class="hint">Đang tải...</small></div>
          <button class="btn primary full" id="btnRun">▶ Bắt đầu mô phỏng</button>
        </aside>

        <!-- Cột giữa: khu vực vẽ + nút điều khiển -->
        <section class="panel viz-panel">
          <div class="viz" id="viz">
            <p class="viz-empty">Khu vực mô phỏng<br><small>Nhập dữ liệu rồi bấm "Bắt đầu mô phỏng"</small></p>
          </div>
          <div class="controls">
            <button class="btn" id="btnReset" title="Đặt lại (phím R)">⟲</button>
            <button class="btn" id="btnPrev"  title="Lùi 1 bước (phím ←)">◀ Lùi</button>
            <button class="btn primary" id="btnPlay" title="Tự chạy / Dừng (phím Space)">▶ Tự chạy</button>
            <button class="btn" id="btnNext"  title="Tiếp 1 bước (phím →)">Tiếp ▶</button>
            <label class="speed">Tốc độ
              <input type="range" id="speed" min="1" max="5" value="3">
            </label>
            <span class="step-count" id="stepCount">Bước 0 / 0</span>
          </div>
          <p class="phim-tat">Phím tắt: <kbd>←</kbd> <kbd>→</kbd> lùi / tiếp · <kbd>Space</kbd> tự chạy / dừng ·
            <kbd>Home</kbd> <kbd>End</kbd> bước đầu / cuối · <kbd>R</kbd> đặt lại</p>
        </section>

        <!-- Cột phải: mã giả + nhật ký -->
        <aside class="panel">
          <h3>Mã giả <small class="ma-gia-ten" id="tenMaGia"></small></h3>
          <pre class="pseudo" id="pseudo"></pre>
          <h3>Giải thích từng bước</h3>
          <ol class="log" id="log"></ol>
        </aside>
      </div>
    </div>

    <!-- TAB LÝ THUYẾT -->
    <div class="tab-panel hidden" id="tab-theory">
      <div class="panel theory">
        <h3>Ý tưởng</h3>
        <p>${algo.short}</p>
        ${algo.lyThuyet || `<p class="todo">(Phần lý thuyết chi tiết sẽ viết ở đây: định nghĩa, cách hoạt động, ví dụ chạy tay.)</p>`}
        <h3>Mã giả</h3>
        <pre class="pseudo">${escapeHtml(algo.pseudo.join("\n"))}</pre>
        <h3>Độ phức tạp</h3>
        <p>${algo.complexity}</p>
      </div>
    </div>`;

  bindAlgoEvents();
  resetSimulation();
  napLaiTuLichSu(algo);
  taiViDu(algo);
  ganLuuBai();
  taiBaiCuaToi(algo);
}

/* ---------- Ví dụ có sẵn (admin nhập trong trang Quản trị -> Ví dụ bài toán) ---------- */
async function taiViDu(algo) {
  let ds = [];
  try {
    // Chờ Firebase tối đa 5 giây; quá thì coi như không có ví dụ
    const App = await Promise.race([sanSang, new Promise((_, loi) => setTimeout(loi, 5000))]);
    ds = await App.layViDu(algo.id);
  } catch (e) { /* không tải được -> dùng dữ liệu mặc định */ }

  if (currentAlgo !== algo) return;          // người dùng đã chuyển sang bài khác
  const khung = document.getElementById("examples");
  khung.innerHTML =
    `<button class="chip" data-mac-dinh>Mặc định</button>` +
    ds.map((v, i) => `<button class="chip" data-ex="${i}">${escapeHtml(v.tieuDe)}</button>`).join("");

  khung.querySelector("[data-mac-dinh]").onclick = () => {
    dienDuLieu(Object.fromEntries(algo.inputs.map(i => [i.key, i.value ?? i.options?.[0]])));
    addLog("Đã nạp dữ liệu mặc định.");
  };
  khung.querySelectorAll("[data-ex]").forEach(chip => chip.onclick = () => {
    const v = ds[chip.dataset.ex];
    dienDuLieu(v.values);
    addLog(`Đã nạp "${v.tieuDe}". Bấm "Bắt đầu mô phỏng" để chạy.`);
  });
}

// Điền dữ liệu vào form: { n: "4", matrix: "0 1\n1 0" }
function dienDuLieu(values = {}) {
  resetSimulation();
  for (const [key, val] of Object.entries(values)) {
    const el = document.querySelector(`#inputForm [name="${key}"]`);
    if (el && val != null) el.value = val;
  }
  capNhatOHien();
  veMaGia();
}

// Bấm "Mô phỏng lại" ở trang Tài khoản -> dữ liệu được gửi qua sessionStorage
function napLaiTuLichSu(algo) {
  try {
    const luu = JSON.parse(sessionStorage.getItem("napLai") || "null");
    if (luu?.algoId === algo.id) {
      sessionStorage.removeItem("napLai");
      dienDuLieu(luu.values);
      addLog(luu.ten ? `Đã mở bài "${escapeHtml(luu.ten)}". Bấm "Bắt đầu mô phỏng" để chạy.`
                     : "Đã nạp lại dữ liệu từ lịch sử.");
    }
  } catch (e) {}
}

/* ---------- BÀI CỦA TÔI ----------
   Người đã đăng nhập lưu lại dữ liệu mình tự nhập (VD 1 ma trận, 1 bài trong slide) kèm tên,
   lần sau bấm vào tên là điền lại đúng dữ liệu đó. Lưu ở users/{uid}/baiLuu trên Firestore.  */
let baiCuaToi = [];                 // danh sách bài đã lưu của thuật toán đang mở

async function taiBaiCuaToi(algo) {
  const khung = document.getElementById("baiCuaToi");
  const nutLuu = document.getElementById("btnLuuBai");
  if (!khung || currentAlgo !== algo) return;

  let App;
  try { App = await Promise.race([sanSang, new Promise((_, loi) => setTimeout(loi, 5000))]); }
  catch (e) { khung.innerHTML = `<small class="hint">Không kết nối được máy chủ nên chưa dùng được chức năng này.</small>`; return; }

  const trangThai = App.trangThai();
  if (trangThai === "dang-tai") return;                 // chờ biết đăng nhập hay chưa (theoDoi sẽ gọi lại)
  if (trangThai === "khach") {
    nutLuu.hidden = true;
    document.getElementById("formLuuBai").hidden = true;
    khung.innerHTML = `<small class="hint"><a class="link" href="dang-nhap.html">Đăng nhập</a> để lưu dữ liệu bạn tự nhập
      (VD một ma trận, một bài trong slide) và mở lại bất cứ lúc nào.</small>`;
    return;
  }

  nutLuu.hidden = false;
  try { baiCuaToi = await App.layBaiLuu(algo.id); }
  catch (e) { console.error(e); khung.innerHTML = `<small class="hint">Không tải được bài đã lưu.</small>`; return; }
  if (currentAlgo !== algo) return;

  if (!baiCuaToi.length) {
    khung.innerHTML = `<small class="hint">Chưa có bài nào. Nhập dữ liệu rồi bấm "💾 Lưu bài này".</small>`;
    return;
  }
  khung.innerHTML = baiCuaToi.map((b, i) => `
    <span class="chip chip-bai">
      <button type="button" data-bai="${i}" title="${escapeHtml(tomTatDuLieu(giaTriDangDung(algo, b.values)))}">${escapeHtml(b.ten)}</button>
      <button type="button" class="chip-xoa" data-xoa-bai="${i}" title="Xóa bài này" aria-label="Xóa bài ${escapeHtml(b.ten)}">×</button>
    </span>`).join("");

  khung.querySelectorAll("[data-bai]").forEach(nut => nut.onclick = () => {
    const b = baiCuaToi[nut.dataset.bai];
    dienDuLieu(b.values);
    addLog(`Đã mở bài "${escapeHtml(b.ten)}". Bấm "Bắt đầu mô phỏng" để chạy.`);
  });
  khung.querySelectorAll("[data-xoa-bai]").forEach(nut => nut.onclick = async () => {
    const b = baiCuaToi[nut.dataset.xoaBai];
    if (!confirm(`Xóa bài "${b.ten}"?`)) return;
    try { await App.xoaBai(b.id); taiBaiCuaToi(algo); }
    catch (e) { tbLuuBai("Không xóa được, hãy thử lại.", "loi"); }
  });
}

// Gắn sự kiện cho nút "Lưu bài này" và ô đặt tên
function ganLuuBai() {
  const form = document.getElementById("formLuuBai");
  const oTen = form.elements.ten;

  document.getElementById("btnLuuBai").onclick = () => {
    tbLuuBai("");
    // Dữ liệu phải hợp lệ thì mới cho lưu (giống khi bấm "Bắt đầu mô phỏng")
    const loi = kiemTraDuLieu(currentAlgo);
    baoLoiNhap(loi);
    if (loi) return;
    try { SOLVERS[currentAlgo.id]?.(readInputs()); }
    catch (err) { baoLoiNhap({ key: err.key, loi: err.message }); return; }

    // Đã lưu dữ liệu y hệt rồi thì báo, không lưu trùng
    const giaTri = giaTriForm();
    const khoa = JSON.stringify(giaTriDangDung(currentAlgo, giaTri));
    const trung = baiCuaToi.find(b => JSON.stringify(giaTriDangDung(currentAlgo, b.values)) === khoa);
    if (trung) return tbLuuBai(`Dữ liệu này đã được lưu với tên "${trung.ten}".`, "loi");

    form.hidden = false;
    oTen.value = goiYTenBai(giaTri).slice(0, 60);
    oTen.focus();
    oTen.select();
  };

  document.getElementById("huyLuuBai").onclick = () => { form.hidden = true; };
  oTen.onkeydown = ev => { if (ev.key === "Escape") form.hidden = true; };

  form.onsubmit = async ev => {
    ev.preventDefault();
    const ten = oTen.value.trim();
    if (!ten) { oTen.focus(); return tbLuuBai("Hãy đặt tên cho bài.", "loi"); }
    if (baiCuaToi.some(b => b.ten.toLowerCase() === ten.toLowerCase()))
      return tbLuuBai(`Đã có bài tên "${ten}", hãy chọn tên khác.`, "loi");

    const algo = currentAlgo;
    const nut = form.querySelector(".primary");
    nut.disabled = true;
    try {
      const App = await sanSang;
      await App.luuBai(algo, ten, giaTriForm());
      form.hidden = true;
      tbLuuBai(`Đã lưu "${ten}". Lần sau bấm vào tên bài để điền lại dữ liệu.`, "ok");
      taiBaiCuaToi(algo);
    } catch (e) {
      console.error(e);
      tbLuuBai(e.code === "permission-denied"
        ? "Máy chủ chưa cho phép lưu. Hãy cập nhật luật bảo mật Firestore (file firestore.rules)."
        : "Không lưu được, hãy thử lại.", "loi");
    } finally { nut.disabled = false; }
  };
}

function tbLuuBai(chu, kieu = "ok") {
  const k = document.getElementById("tbLuuBai");
  k.textContent = chu;
  k.className = "alert " + kieu;
  k.hidden = !chu;
}

// Giá trị đang có trong form, dạng chuỗi như người dùng nhập: { type: "...", n: "4", ... }
function giaTriForm() {
  return Object.fromEntries(currentAlgo.inputs.map(inp =>
    [inp.key, document.querySelector(`#inputForm [name="${inp.key}"]`).value]));
}

// Bỏ các ô không dùng tới (ô bị ẩn, VD ô m khi không chọn Tổ hợp) để so sánh / hiển thị
function giaTriDangDung(algo, values = {}) {
  const kq = {};
  for (const inp of algo.inputs) {
    if (inp.hienKhi && values[inp.hienKhi.key] !== inp.hienKhi.giaTri) continue;
    if (values[inp.key] != null) kq[inp.key] = values[inp.key];
  }
  return kq;
}

// Tên gợi ý khi lưu, VD "Hoán vị của n phần tử · n = 4"
function goiYTenBai(values) {
  const { cheDo, ...conLai } = giaTriDangDung(currentAlgo, values);   // bỏ ô "Hiển thị" cho tên gọn
  return tomTatDuLieu(conLai) || currentAlgo.name;
}

// Tạo 1 ô nhập liệu theo kiểu
function renderInput(inp) {
  let field;
  if (inp.type === "select") {
    field = `<select name="${inp.key}">${inp.options.map(o => `<option>${o}</option>`).join("")}</select>`;
  } else if (inp.type === "matrix") {
    field = `<textarea name="${inp.key}" rows="5" spellcheck="false">${inp.value}</textarea>
             <small class="hint">Mỗi dòng là 1 hàng, các số cách nhau bởi dấu cách</small>`;
  } else if (inp.type === "number") {
    field = `<input type="number" name="${inp.key}" value="${inp.value}" min="1" step="1">`;
  } else {
    field = `<input type="text" name="${inp.key}" value="${inp.value}">`;
  }
  const goiY = inp.hint ? `<small class="hint">${inp.hint}</small>` : "";
  return `<label class="field" data-key="${inp.key}"><span>${inp.label}</span>${field}${goiY}</label>`;
}

/* Mã giả theo lựa chọn: nếu thuật toán có maGiaTheo (VD bài Liệt kê có 3 dạng),
   hiện mã giả cụ thể của dạng đang chọn; không có thì dùng mã giả chung algo.pseudo.
   Các dạng giữ cùng số dòng nên con số "line" của từng bước vẫn tô đúng dòng.      */
function veMaGia() {
  const khung = document.getElementById("pseudo");
  if (!khung) return;
  let dong = currentAlgo.pseudo, ten = "";
  const theo = currentAlgo.maGiaTheo;
  if (theo) {
    const chon = document.querySelector(`#inputForm [name="${theo.key}"]`).value;
    if (theo[chon]) { dong = theo[chon]; ten = chon; }
  }
  const dongDangTo = khung.querySelector(".line.current")?.dataset.line;
  khung.innerHTML = dong
    .map((d, i) => `<span class="line" data-line="${i}">${escapeHtml(d)}</span>`).join("\n");
  document.getElementById("tenMaGia").textContent = ten ? `(${ten})` : "";
  if (dongDangTo != null) highlightLine(Number(dongDangTo));   // giữ dòng đang tô vàng
}

// Ẩn/hiện các ô chỉ dùng cho một lựa chọn (khai báo bằng hienKhi trong data.js)
function capNhatOHien() {
  for (const inp of currentAlgo.inputs) {
    if (!inp.hienKhi) continue;
    const chon = document.querySelector(`#inputForm [name="${inp.hienKhi.key}"]`).value;
    document.querySelector(`#inputForm .field[data-key="${inp.key}"]`).style.display =
      chon === inp.hienKhi.giaTri ? "" : "none";
  }
}
const oDangAn = key => document.querySelector(`#inputForm .field[data-key="${key}"]`)?.style.display === "none";

// Gắn sự kiện cho các nút trên trang thuật toán
function bindAlgoEvents() {
  // Chuyển tab
  document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
      document.getElementById("tab-sim").classList.toggle("hidden", tab.dataset.tab !== "sim");
      document.getElementById("tab-theory").classList.toggle("hidden", tab.dataset.tab !== "theory");
    };
  });

  document.getElementById("btnRun").onclick = startSimulation;
  // Sửa dữ liệu: ẩn thông báo lỗi và xóa mô phỏng cũ (vì không còn đúng với dữ liệu mới)
  document.getElementById("inputForm").oninput = () => {
    baoLoiNhap(null);
    tbLuuBai("");
    capNhatOHien();
    veMaGia();
    if (sim.steps.length) resetSimulation();
  };
  capNhatOHien();
  veMaGia();
  document.getElementById("btnNext").onclick = () => goToStep(sim.index + 1);
  document.getElementById("btnPrev").onclick = () => goToStep(sim.index - 1);
  document.getElementById("btnReset").onclick = resetSimulation;
  document.getElementById("btnPlay").onclick = toggleAutoPlay;
}

// Đọc dữ liệu người dùng nhập vào form -> object { n: 4, ... }
function readInputs() {
  const data = {};
  for (const inp of currentAlgo.inputs) {
    const el = document.querySelector(`[name="${inp.key}"]`);
    if (inp.type === "number") data[inp.key] = Number(el.value);
    else if (inp.type === "matrix")
      data[inp.key] = el.value.trim().split("\n").map(row => row.trim().split(/\s+/).map(Number));
    else data[inp.key] = el.value;
  }
  return data;
}

/* ---------- 4. BỘ ĐIỀU KHIỂN MÔ PHỎNG ----------
   Ý tưởng: thuật toán chạy 1 lần, ghi lại TẤT CẢ các bước vào mảng steps.
   Mỗi bước có dạng: { line: số dòng mã giả, msg: lời giải thích, state: dữ liệu để vẽ }
   Nút Tiếp/Lùi chỉ việc chuyển qua lại giữa các bước đã ghi -> lùi rất dễ.          */

const sim = { steps: [], index: -1, timer: null };

/* SOLVERS (hàm giải) và VE (hàm vẽ) được khai báo trong data.js,
   mỗi thuật toán tự đăng ký trong file riêng ở js/thuat-toan/ (VD: hanoi.js). */

// Bản mô phỏng tạm khi chưa có hàm giải: đi qua lần lượt từng dòng mã giả
function demoSteps(algo) {
  return algo.pseudo.map((line, i) => ({
    line: i,
    msg: `(Demo khung) Thực hiện dòng ${i + 1}: ${line.trim()}`,
    state: null
  }));
}

/* Kiểm tra dữ liệu nhập. Sai -> trả về { key, loi }, đúng -> null.
   Ô số chỉ cần là số nguyên dương (không âm, không có chữ).
   Các ràng buộc riêng (VD m ≤ n, dữ liệu quá lớn) do hàm giải tự báo bằng loiDuLieu(). */
function kiemTraDuLieu(algo) {
  for (const inp of algo.inputs) {
    if (inp.type !== "number" || oDangAn(inp.key)) continue;     // ô đang ẩn thì không cần kiểm tra
    const chu = document.querySelector(`#inputForm [name="${inp.key}"]`).value.trim();
    const so = Number(chu);
    if (chu === "" || !/^-?\d+$/.test(chu))
      return { key: inp.key, loi: `"${inp.label}" phải là số nguyên, không được để trống hay chứa chữ cái.` };
    if (so < 1)
      return { key: inp.key, loi: `"${inp.label}" phải là số dương (lớn hơn 0), bạn nhập ${so}.` };
  }
  return null;
}

function baoLoiNhap(loi) {
  const khung = document.getElementById("loiNhap");
  khung.textContent = loi ? loi.loi : "";
  khung.hidden = !loi;
  document.querySelectorAll("#inputForm .field").forEach(f =>
    f.classList.toggle("sai", !!loi && f.dataset.key === loi.key));
}

// Trả về true nếu bắt đầu mô phỏng được
function startSimulation() {
  stopAutoPlay();
  const loi = kiemTraDuLieu(currentAlgo);
  baoLoiNhap(loi);
  if (loi) { resetSimulation(); return false; }

  const input = readInputs();
  const solver = SOLVERS[currentAlgo.id];
  try {
    sim.steps = solver ? solver(input) : demoSteps(currentAlgo);
  } catch (err) {                                   // hàm giải báo dữ liệu không hợp lệ
    baoLoiNhap({ key: err.key, loi: err.message });
    resetSimulation();
    return false;
  }
  sim.index = -1;
  document.getElementById("log").innerHTML = "";
  goToStep(0);

  // Đã đăng nhập thì lưu lần mô phỏng này vào lịch sử (khách thì bỏ qua)
  const algo = currentAlgo;
  const raw = giaTriForm();
  sanSang.then(App => App.luuLichSu(algo, raw))
    .then(daLuu => { if (daLuu) veLichSu(); })            // có mục mới -> cập nhật cột lịch sử
    .catch(e => console.warn("Không lưu được lịch sử:", e));
  return true;
}

function resetSimulation() {
  stopAutoPlay();
  sim.steps = [];
  sim.index = -1;
  const log = document.getElementById("log");
  if (log) log.innerHTML = "";
  highlightLine(-1);
  updateStepCount();
}

// Nhảy tới bước thứ i và vẽ lại
function goToStep(i) {
  if (i < 0 || i >= sim.steps.length) { stopAutoPlay(); return; }
  sim.index = i;
  const step = sim.steps[i];

  highlightLine(step.line);
  drawState(step);

  // Nhật ký: hiện các bước từ 0 đến i (lùi thì nhật ký cũng lùi theo)
  document.getElementById("log").innerHTML =
    sim.steps.slice(0, i + 1).map(s => `<li>${s.msg}</li>`).join("");
  const log = document.getElementById("log");
  log.scrollTop = log.scrollHeight;

  updateStepCount();
}

// Vẽ trạng thái hiện tại lên khu vực mô phỏng (mỗi thuật toán sẽ có cách vẽ riêng)
function drawState(step) {
  const ve = VE[currentAlgo.id];
  if (ve && step.state) {                     // thuật toán đã có hình vẽ riêng
    document.getElementById("viz").innerHTML = `<div class="viz-content">${ve(step)}</div>`;
    return;
  }
  document.getElementById("viz").innerHTML = `
    <div class="viz-demo">
      <div class="viz-big">${sim.index + 1}</div>
      <p>${step.msg}</p>
      <small>Hình vẽ của thuật toán sẽ hiện ở đây</small>
    </div>`;
}

function highlightLine(n) {
  document.querySelectorAll("#pseudo .line").forEach(el => {
    el.classList.toggle("current", Number(el.dataset.line) === n);
  });
}

function updateStepCount() {
  const el = document.getElementById("stepCount");
  if (el) el.textContent = `Bước ${sim.index + 1} / ${sim.steps.length}`;
}

// Tự chạy: cứ sau một khoảng thời gian thì bấm "Tiếp" một lần
function toggleAutoPlay() {
  if (sim.timer) { stopAutoPlay(); return; }
  if (sim.steps.length === 0 && !startSimulation()) return;
  const speed = Number(document.getElementById("speed").value);   // 1 (chậm) .. 5 (nhanh)
  const delay = 1600 / speed;
  document.getElementById("btnPlay").textContent = "⏸ Dừng";
  sim.timer = setInterval(() => {
    if (sim.index >= sim.steps.length - 1) stopAutoPlay();
    else goToStep(sim.index + 1);
  }, delay);
}

function stopAutoPlay() {
  clearInterval(sim.timer);
  sim.timer = null;
  const btn = document.getElementById("btnPlay");
  if (btn) btn.textContent = "▶ Tự chạy";
}

function addLog(text) {
  const log = document.getElementById("log");
  if (log) log.innerHTML += `<li>${text}</li>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- PHÍM TẮT KHI MÔ PHỎNG ----------
   →  tiếp 1 bước (chưa chạy thì bắt đầu mô phỏng)   ←  lùi 1 bước
   Space  tự chạy / dừng      Home / End  về bước đầu / bước cuối      R  đặt lại
   Không bắt phím khi đang gõ trong ô nhập, khi có hộp thoại mở, hoặc khi đang ở tab Lý thuyết. */
function xuLyPhimTat(ev) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;              // để yên Cmd+R, Ctrl+C...
  const tabMoPhong = document.getElementById("tab-sim");
  if (!tabMoPhong || tabMoPhong.classList.contains("hidden")) return;
  if (document.querySelector(".modal-nen")) return;
  const dangGo = ev.target.closest?.("input, textarea, select, [contenteditable]");
  if (dangGo) return;

  const phim = ev.key === " " ? "Space" : ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  const lenh = {
    ArrowRight: () => { stopAutoPlay(); sim.steps.length ? goToStep(sim.index + 1) : startSimulation(); },
    ArrowLeft:  () => { stopAutoPlay(); goToStep(sim.index - 1); },
    Space:      () => toggleAutoPlay(),
    Home:       () => { stopAutoPlay(); if (sim.steps.length) goToStep(0); },
    End:        () => { stopAutoPlay(); if (sim.steps.length) goToStep(sim.steps.length - 1); },
    r:          () => resetSimulation()
  }[phim];
  if (!lenh) return;
  ev.preventDefault();                       // Space không cuộn trang, mũi tên không cuộn ngang
  // Vừa bấm chuột vào 1 nút thì nút đó đang được chọn, Space sẽ "bấm" nút đó lần nữa -> bỏ chọn trước
  if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur();
  lenh();
}

/* ---------- KHỞI ĐỘNG ---------- */
document.addEventListener("keydown", xuLyPhimTat);
document.getElementById("menuBtn").onclick = () => document.body.classList.toggle("menu-open");
window.addEventListener("hashchange", router);
renderTopNav();
renderSidebar();
router();
// Đăng nhập / đăng xuất khi đang mở trang thuật toán -> vẽ lại phần "Bài của tôi"
sanSang.then(App => App.theoDoi(() => { if (currentAlgo && document.getElementById("baiCuaToi")) taiBaiCuaToi(currentAlgo); }));
