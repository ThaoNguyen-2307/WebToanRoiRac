const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");

const sanSang = new Promise(resolve => { window.__baoSanSang = resolve; });

// Cột bên trái: lịch sử mô phỏng
function renderSidebar() {
  let html = `
    <a href="#/" class="nav-home">⌂ Trang chủ</a>
    <div class="nav-title">Lịch sử mô phỏng</div>
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
      try { sessionStorage.setItem("napLai", JSON.stringify({ algoId: h.algoId, values: h.values })); } catch (e) { }
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

// Điều hướng
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

// Trang chủ
// Các tính năng ở trang chủ, bấm vào thì mở trang hướng dẫn
const FEATURES = [
  {
    id: "mo-phong", icon: "▶", title: "Mô phỏng từng bước",
    text: "Xem thuật toán chạy chậm từng bước, có thể tiến, lùi hoặc tự chạy.",
    steps: [
      "Chọn một bài toán ở trang chủ hoặc trên thanh menu phía trên.",
      "Đọc khung <b>Đề bài</b> ở giữa trang để biết bài toán đang hỏi gì. Đề bài tự đổi theo dữ liệu bạn nhập.",
      "Bấm <b>▶ Bắt đầu mô phỏng</b>. Hình vẽ ở giữa hiện bước đầu tiên.",
      "Bấm <b>Tiếp ▶</b> / <b>◀ Lùi</b> để đi từng bước, hoặc <b>▶ Tự chạy</b> để web tự chạy. Kéo thanh <b>Tốc độ</b> để chạy nhanh hay chậm.",
      "Bấm <b>⟲</b> để xóa kết quả và làm lại từ đầu."
    ],
    meo: "Dùng bàn phím cho nhanh: <b>→</b> tiếp, <b>←</b> lùi, <b>Space</b> tự chạy / dừng, <b>Home</b> / <b>End</b> về bước đầu / cuối, <b>R</b> làm lại.",
    thu: { algo: "hanoi" }
  },
  {
    id: "ma-gia", icon: "≡", title: "Mã giả tô sáng",
    text: "Dòng mã giả đang thực hiện được tô sáng để dễ theo dõi.",
    steps: [
      "Mở một bài toán bất kỳ. Khung <b>Mã giả</b> nằm ở cột bên phải.",
      "Với bài có nhiều dạng (VD Liệt kê: nhị phân, hoán vị, tổ hợp), mã giả tự đổi theo dạng bạn chọn.",
      "Bắt đầu mô phỏng. Dòng đang thực hiện được <b>tô vàng</b>, đi Tiếp hay Lùi thì dòng tô vàng đi theo.",
      "Đọc khung <b>Giải thích từng bước</b> ngay bên dưới để biết ở bước đó thuật toán làm gì."
    ],
    meo: "Vừa nhìn hình vẽ ở giữa vừa nhìn dòng tô vàng sẽ giúp bạn nối được \"code\" với \"hình\", dễ nhớ thuật toán hơn.",
    thu: { algo: "nhau" }
  },
  {
    id: "nhap-du-lieu", icon: "✎", title: "Tự nhập dữ liệu",
    text: "Nhập số, danh sách hoặc ma trận của riêng bạn để web giải.",
    steps: [
      "<b>Số</b> (số đĩa n, kích thước bàn cờ...): gõ vào ô. Web không cho nhập số âm hay chữ cái.",
      "<b>Danh sách</b> (trọng lượng, giá trị đồ vật): các số cách nhau bằng dấu phẩy, VD <code>3, 4, 5, 2</code>.",
      "<b>Ma trận</b> (bài đồ thị, TSP): chỉnh <b>Số đỉnh</b> bằng nút − / +, rồi điền từng ô của bảng. Ô bỏ trống tính là 0 (không có đường).",
      "Tích <b>Đối xứng</b> nếu đường đi 2 chiều như nhau: sửa ô (i, j) thì ô (j, i) tự đổi theo. Bấm <b>Ngẫu nhiên</b> để có dữ liệu thử nhanh.",
      "Muốn dán ma trận chép từ chỗ khác thì bấm <b>Nhập dạng chữ</b> (mỗi dòng là 1 hàng, các số cách nhau bằng dấu cách), hoặc dán thẳng vào 1 ô của bảng.",
      "Hình <b>Xem trước đồ thị</b> dưới bảng vẽ lại ngay khi bạn sửa, nhập xong bấm <b>▶ Bắt đầu mô phỏng</b>."
    ],
    vidu: "0 4 1 0\n4 0 2 5\n1 2 0 8\n0 5 8 0",
    meo: "Nên nhập dữ liệu nhỏ (4 đến 6 đỉnh, n ≤ 8) để hình vẽ dễ nhìn và mô phỏng không quá dài.",
    thu: { algo: "dijkstra" }
  },
  {
    id: "vi-du", icon: "★", title: "Ví dụ có sẵn",
    text: "Mỗi thuật toán có sẵn các bài mẫu, bấm một nút là chạy.",
    steps: [
      "Mở một bài toán, nhìn mục <b>Ví dụ có sẵn</b> ở cột bên trái.",
      "Bấm vào tên một ví dụ: dữ liệu tự điền vào các ô, khung Đề bài đổi theo.",
      "Bấm <b>▶ Bắt đầu mô phỏng</b> để chạy ví dụ đó.",
      "Bấm <b>Mặc định</b> để quay về dữ liệu ban đầu."
    ],
    meo: "Mỗi thuật toán có ít nhất 5 ví dụ lấy từ bài giảng, có cả trường hợp đặc biệt như không có lời giải, không có đường đi.",
    thu: { algo: "hanoi" }
  },
  {
    id: "bai-cua-toi", icon: "▤", title: "Lịch sử và Bài của tôi",
    text: "Đăng nhập để lưu lại những bài đã chạy và dữ liệu tự nhập.",
    steps: [
      "Đăng nhập (email hoặc tài khoản Google). Mỗi lần bấm <b>Bắt đầu mô phỏng</b> sẽ được lưu vào <b>Lịch sử mô phỏng</b> ở cột trái.",
      "Bấm vào một mục trong lịch sử để mở lại đúng dữ liệu lần đó.",
      "Muốn giữ lại một bộ dữ liệu tự nhập (VD 1 ma trận trong slide), bấm <b>Lưu bài này</b> ở mục <b>Bài của tôi</b> rồi đặt tên.",
      "Vào <b>Tài khoản của tôi</b> để đổi tên, xóa bài đã lưu, xóa lịch sử (tích <b>Chọn hết</b> để xóa nhiều mục một lúc)."
    ],
    meo: "Khách chưa đăng nhập vẫn dùng được mọi thuật toán, chỉ là không lưu lại được.",
    thu: { algo: "tsp" }
  },
  {
    id: "tu-kiem-tra", icon: "?", title: "Tự kiểm tra",
    text: "Web dừng lại hỏi bạn bước tiếp theo trước khi hiện, để tự kiểm tra mình hiểu bài chưa.",
    steps: [
      "Mở một bài toán, tích ô <b>Tự kiểm tra</b> cạnh thanh tốc độ.",
      "Bắt đầu mô phỏng và đi từng bước như bình thường. Tới bước quan trọng, web hiện câu hỏi, VD \"Đỉnh nào được thăm tiếp theo?\".",
      "Chọn đáp án (bấm chuột hoặc phím 1 đến 4). Web tô xanh đáp án đúng, tô đỏ đáp án sai và giải thích.",
      "Bấm <b>Tiếp tục</b> (hoặc Enter) để chạy tiếp. Số câu đúng hiện ngay cạnh ô Tự kiểm tra."
    ],
    meo: "Nên xem mô phỏng 1 lần trước, sau đó bật Tự kiểm tra và chạy lại với ví dụ khác để ôn.",
    thu: { algo: "bfsdfs" }
  },
  {
    id: "ly-thuyet", icon: "✦", title: "Lý thuyết ngắn gọn",
    text: "Ý tưởng, mã giả và độ phức tạp của từng thuật toán.",
    steps: [
      "Mở một bài toán, bấm tab <b>Lý thuyết</b> (ngay cạnh tab Mô phỏng).",
      "Đọc đề bài, ý tưởng, công thức và độ phức tạp của thuật toán.",
      "Một số bài có bảng so sánh, VD bài Người du lịch có bảng so sánh quy hoạch động với nhánh cận.",
      "Quay lại tab <b>Mô phỏng</b> để xem thuật toán chạy thật."
    ],
    meo: "Nên đọc lý thuyết trước rồi mới mô phỏng, bạn sẽ đoán trước được bước tiếp theo.",
    thu: { algo: "bfsdfs", tab: "ly-thuyet" }
  },
  {
    id: "so-sanh", icon: "⇄", title: "So sánh kỹ thuật",
    text: "So sánh đệ quy thường với quy hoạch động, vét cạn với nhánh cận trên cùng một dữ liệu.",
    steps: [
      "Mở bài <b>Fibonacci</b>, <b>Xếp ba lô</b>, <b>Người du lịch</b> hoặc <b>BFS/DFS</b>.",
      "Nhập dữ liệu (hoặc chọn ví dụ), rồi bấm <b>So sánh các cách giải</b> dưới nút Bắt đầu mô phỏng.",
      "Web chạy tất cả các cách giải với cùng dữ liệu và hiện bảng kết quả, biểu đồ cột và nhận xét. VD f(8): đệ quy thường gọi hàm 41 lần, quy hoạch động chỉ 13 lần.",
      "Ở bài Người du lịch, khi mô phỏng nhánh cận, các nhánh bị cắt hiện <b>màu đỏ có dấu ✂</b> trên cây tìm kiếm."
    ],
    meo: "Thử tăng dần n (5, 6, 7...) rồi bấm so sánh lại để thấy khoảng cách giữa các cách giải tăng rất nhanh.",
    thu: { algo: "fibonacci" }
  },
  {
    id: "phim-tat", icon: "⌘", title: "Phím tắt",
    text: "Điều khiển mô phỏng bằng bàn phím, tiện khi thuyết trình.",
    steps: [
      "<b>→</b>: đi tiếp 1 bước (chưa chạy thì tự bắt đầu mô phỏng).",
      "<b>←</b>: lùi 1 bước.",
      "<b>Space</b>: tự chạy / dừng.",
      "<b>Home</b> / <b>End</b>: về bước đầu / bước cuối. <b>R</b>: làm lại từ đầu.",
      "Khi đang Tự kiểm tra: phím <b>1</b> đến <b>4</b> để chọn đáp án, <b>Enter</b> để chạy tiếp."
    ],
    meo: "Phím tắt không có tác dụng khi bạn đang gõ trong ô nhập liệu, nên không lo bấm nhầm.",
    thu: { algo: "lietke" }
  }
];

// Trang hướng dẫn
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

      ${f.vidu ? `<div class="guide-example"><span>Ví dụ ma trận 4 đỉnh (dán vào ô "Nhập dạng chữ"):</span><pre>${f.vidu}</pre></div>` : ""}

      <div class="guide-tip"><b>Mẹo:</b> ${f.meo}</div>

      <a class="btn primary guide-try" href="${linkThu}">Thử ngay với bài "${algo.name}" →</a>

      <h3 class="guide-others-title">Hướng dẫn khác</h3>
      <div class="guide-others">
        ${FEATURES.filter(x => x.id !== f.id).map(x => `
          <a href="#/huong-dan/${x.id}"><span class="feature-icon">${x.icon}</span>${x.title}</a>`).join("")}
      </div>
    </div>`;
}

// Trang giới thiệu đồ án
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

// Trang thuật toán
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
            <button class="link-nho" id="btnLuuBai" type="button" hidden>Lưu bài này</button>
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
          <button class="btn full nut-so-sanh" id="btnSoSanh" hidden>So sánh các cách giải</button>
        </aside>

        <!-- Cột giữa: khu vực vẽ + nút điều khiển -->
        <section class="panel viz-panel">
          <div class="viz" id="viz">
            <p class="viz-empty">Khu vực mô phỏng<br><small>Nhập dữ liệu rồi bấm "Bắt đầu mô phỏng"</small></p>
          </div>
          <!-- Câu hỏi của chế độ Tự kiểm tra (js/tu-kiem-tra.js) -->
          <div class="hop-hoi" id="hopHoi" hidden></div>
          <div class="controls">
            <button class="btn" id="btnReset" title="Đặt lại (phím R)">⟲</button>
            <button class="btn" id="btnPrev"  title="Lùi 1 bước (phím ←)">◀ Lùi</button>
            <button class="btn primary" id="btnPlay" title="Tự chạy / Dừng (phím Space)">▶ Tự chạy</button>
            <button class="btn" id="btnNext"  title="Tiếp 1 bước (phím →)">Tiếp ▶</button>
            <label class="speed">Tốc độ
              <input type="range" id="speed" min="1" max="5" value="3">
            </label>
            <label class="tu-kiem-tra" title="Web sẽ dừng lại hỏi bạn bước tiếp theo trước khi hiện">
              <input type="checkbox" id="chkKiemTra"> Tự kiểm tra</label>
            <span class="pill diem-kt" id="diemKT" hidden></span>
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

// Ví dụ có sẵn
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
  dongBoOMaTran();        // ô ma trận dạng bảng vẽ lại theo dữ liệu mới
  baoLoiNhap(null);       // dữ liệu mới thì bỏ thông báo lỗi cũ
  capNhatOHien();
  veMaGia();
  veDeBai();              // đề bài đổi theo dữ liệu mới
}

function napLaiTuLichSu(algo) {
  try {
    const luu = JSON.parse(sessionStorage.getItem("napLai") || "null");
    if (luu?.algoId === algo.id) {
      sessionStorage.removeItem("napLai");
      dienDuLieu(luu.values);
      addLog(luu.ten ? `Đã mở bài "${escapeHtml(luu.ten)}". Bấm "Bắt đầu mô phỏng" để chạy.`
        : "Đã nạp lại dữ liệu từ lịch sử.");
    }
  } catch (e) { }
}

// Bài của tôi
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
    khung.innerHTML = `<small class="hint">Chưa có bài nào. Nhập dữ liệu rồi bấm "Lưu bài này".</small>`;
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

function giaTriForm() {
  return Object.fromEntries(currentAlgo.inputs.map(inp =>
    [inp.key, document.querySelector(`#inputForm [name="${inp.key}"]`).value]));
}

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
  if (inp.type === "matrix") return oMaTranHTML(inp);      // ô ma trận dạng bảng: js/o-ma-tran.js
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
  document.getElementById("inputForm").oninput = () => {
    baoLoiNhap(null);
    tbLuuBai("");
    capNhatOHien();
    veMaGia();
    if (sim.steps.length) resetSimulation();
    veDeBai();                                   // đề bài tự đổi theo dữ liệu đang nhập
  };
  ganOMaTran(currentAlgo);
  ganSoSanh();
  ktGan();
  capNhatOHien();
  veMaGia();
  veDeBai();
  document.getElementById("btnNext").onclick = () => goToStep(sim.index + 1);
  document.getElementById("btnPrev").onclick = () => goToStep(sim.index - 1);
  document.getElementById("btnReset").onclick = resetSimulation;
  document.getElementById("btnPlay").onclick = toggleAutoPlay;
}

function readInputs() {
  const data = {};
  for (const inp of currentAlgo.inputs) {
    const el = document.querySelector(`[name="${inp.key}"]`);
    if (inp.type === "number") data[inp.key] = Number(el.value);
    else if (inp.type === "matrix")
      data[inp.key] = el.value.split("\n").filter(row => row.trim())      // bỏ dòng trống
        .map(row => row.trim().split(/\s+/).map(Number));
    else data[inp.key] = el.value;
  }
  return data;
}

// Bộ điều khiển mô phỏng

const sim = { steps: [], index: -1, timer: null };

function demoSteps(algo) {
  return algo.pseudo.map((line, i) => ({
    line: i,
    msg: `(Demo khung) Thực hiện dòng ${i + 1}: ${line.trim()}`,
    state: null
  }));
}

function kiemTraDuLieu(algo) {
  for (const inp of algo.inputs) {
    if (inp.type === "matrix") {                                 // ma trận: không chữ, không số âm, phải vuông
      const kq = docChuMaTran(document.querySelector(`#inputForm [name="${inp.key}"]`).value);
      if (kq.loi) return { key: inp.key, loi: kq.loi };
      continue;
    }
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
  if (KT.bat) ktTaoCauHoi(); else ktXoa();      // chế độ Tự kiểm tra: chuẩn bị câu hỏi
  sim.deBaiGon = dongDeBai();                    // đề bài 1 dòng, hiện phía trên hình vẽ
  goToStep(0);

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
  ktXoa();
  const log = document.getElementById("log");
  if (log) log.innerHTML = "";
  highlightLine(-1);
  updateStepCount();
  veDeBai();                        // chưa mô phỏng thì khu vực mô phỏng hiện đề bài
}

// Nhảy tới bước thứ i và vẽ lại
function goToStep(i) {
  if (i < 0 || i >= sim.steps.length) { stopAutoPlay(); return; }
  if (ktChan(i)) return;            // chế độ Tự kiểm tra: dừng lại hỏi trước khi hiện bước i
  ktAnHop();
  sim.index = i;
  const step = sim.steps[i];

  highlightLine(step.line);
  drawState(step);

  document.getElementById("log").innerHTML =
    sim.steps.slice(0, i + 1).map(s => `<li>${s.msg}</li>`).join("");
  const log = document.getElementById("log");
  log.scrollTop = log.scrollHeight;

  updateStepCount();
}

function drawState(step) {
  const ve = VE[currentAlgo.id];
  if (ve && step.state) {                     // thuật toán đã có hình vẽ riêng
    document.getElementById("viz").innerHTML = `${sim.deBaiGon || ""}<div class="viz-content">${ve(step)}</div>`;
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

// Phím tắt khi mô phỏng
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
    ArrowLeft: () => { stopAutoPlay(); goToStep(sim.index - 1); },
    Space: () => toggleAutoPlay(),
    Home: () => { stopAutoPlay(); if (sim.steps.length) goToStep(0); },
    End: () => { stopAutoPlay(); if (sim.steps.length) goToStep(sim.steps.length - 1); },
    r: () => resetSimulation()
  }[phim];
  if (!lenh) return;
  ev.preventDefault();                       // Space không cuộn trang, mũi tên không cuộn ngang
  if (document.activeElement?.tagName === "BUTTON") document.activeElement.blur();
  lenh();
}

// Khởi động
document.addEventListener("keydown", xuLyPhimTat);
document.getElementById("menuBtn").onclick = () => document.body.classList.toggle("menu-open");
window.addEventListener("hashchange", router);
renderTopNav();
renderSidebar();
router();
sanSang.then(App => App.theoDoi(() => { if (currentAlgo && document.getElementById("baiCuaToi")) taiBaiCuaToi(currentAlgo); }));
