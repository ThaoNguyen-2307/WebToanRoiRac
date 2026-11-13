/* =========================================================
   main.js — XỬ LÝ giao diện
   1. Vẽ menu bên trái
   2. Điều hướng trang (trang chủ <-> trang thuật toán)
   3. Vẽ trang thuật toán (nhập liệu, mô phỏng, mã giả, nhật ký)
   4. Bộ điều khiển mô phỏng (Tiếp / Lùi / Tự chạy / Đặt lại)
   ========================================================= */

const app = document.getElementById("app");
const sidebar = document.getElementById("sidebar");

/* ---------- 1. MENU BÊN TRÁI ---------- */
function renderSidebar() {
  let html = `<a href="#/" class="nav-home">⌂ Trang chủ</a>`;
  for (const g of GROUPS) {
    html += `<div class="nav-group"><div class="nav-title">${g.icon} ${g.name}</div>`;
    for (const a of ALGORITHMS.filter(x => x.group === g.id)) {
      html += `<a href="#/algo/${a.id}" class="nav-link" data-id="${a.id}">${a.name}</a>`;
    }
    html += `</div>`;
  }
  sidebar.innerHTML = html;
}

// Tô sáng mục đang chọn trong menu
function highlightNav(id) {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.id === id);
  });
}

/* ---------- 2. ĐIỀU HƯỚNG ----------
   Dùng phần sau dấu # trên địa chỉ web:
   #/            -> trang chủ
   #/algo/nhau   -> trang thuật toán n quân hậu            */
function router() {
  stopAutoPlay();
  const hash = location.hash || "#/";
  const parts = hash.split("/");          // ["#", "algo", "nhau"]
  if (parts[1] === "algo") {
    const algo = ALGORITHMS.find(a => a.id === parts[2]);
    if (algo) { renderAlgoPage(algo); highlightNav(algo.id); }
    else renderHome();
  } else {
    renderHome();
    highlightNav(null);
  }
  document.body.classList.remove("menu-open");   // đóng menu trên điện thoại
  window.scrollTo(0, 0);
}

/* ---------- TRANG CHỦ ---------- */
function renderHome() {
  let html = `
    <section class="hero">
      <h1>Học thuật toán Toán rời rạc bằng hình ảnh</h1>
      <p>Chọn một thuật toán, nhập dữ liệu và xem thuật toán chạy từng bước:
         quay lui, quy hoạch động, nhánh cận và đồ thị.</p>
    </section>`;

  for (const g of GROUPS) {
    html += `<h2 class="group-heading">${g.icon} ${g.name}</h2><div class="cards">`;
    for (const a of ALGORITHMS.filter(x => x.group === g.id)) {
      html += `
        <a class="card" href="#/algo/${a.id}">
          <h3>${a.name}</h3>
          <p>${a.short}</p>
          <span class="badge">${a.complexity}</span>
        </a>`;
    }
    html += `</div>`;
  }
  app.innerHTML = html;
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
          <h4>Ví dụ có sẵn</h4>
          <div class="examples">
            ${[1, 2, 3, 4, 5].map(i => `<button class="chip" data-ex="${i}">Ví dụ ${i}</button>`).join("")}
          </div>
          <button class="btn primary full" id="btnRun">▶ Bắt đầu mô phỏng</button>
        </aside>

        <!-- Cột giữa: khu vực vẽ + nút điều khiển -->
        <section class="panel viz-panel">
          <div class="viz" id="viz">
            <p class="viz-empty">Khu vực mô phỏng<br><small>Nhập dữ liệu rồi bấm "Bắt đầu mô phỏng"</small></p>
          </div>
          <div class="controls">
            <button class="btn" id="btnReset" title="Đặt lại">⟲</button>
            <button class="btn" id="btnPrev"  title="Lùi 1 bước">◀ Lùi</button>
            <button class="btn primary" id="btnPlay" title="Tự chạy">▶ Tự chạy</button>
            <button class="btn" id="btnNext"  title="Tiếp 1 bước">Tiếp ▶</button>
            <label class="speed">Tốc độ
              <input type="range" id="speed" min="1" max="5" value="3">
            </label>
            <span class="step-count" id="stepCount">Bước 0 / 0</span>
          </div>
        </section>

        <!-- Cột phải: mã giả + nhật ký -->
        <aside class="panel">
          <h3>Mã giả</h3>
          <pre class="pseudo" id="pseudo">${algo.pseudo
            .map((line, i) => `<span class="line" data-line="${i}">${escapeHtml(line)}</span>`)
            .join("\n")}</pre>
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
        <p class="todo">(Phần lý thuyết chi tiết sẽ viết ở đây: định nghĩa, cách hoạt động, ví dụ chạy tay.)</p>
        <h3>Mã giả</h3>
        <pre class="pseudo">${escapeHtml(algo.pseudo.join("\n"))}</pre>
        <h3>Độ phức tạp</h3>
        <p>${algo.complexity}</p>
      </div>
    </div>`;

  bindAlgoEvents();
  resetSimulation();
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
    field = `<input type="number" name="${inp.key}" value="${inp.value}" min="${inp.min}" max="${inp.max}">`;
  } else {
    field = `<input type="text" name="${inp.key}" value="${inp.value}">`;
  }
  return `<label class="field"><span>${inp.label}</span>${field}</label>`;
}

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

  // Nạp ví dụ có sẵn (tạm thời: nạp lại dữ liệu mặc định)
  document.querySelectorAll(".chip").forEach(chip => {
    chip.onclick = () => {
      renderAlgoPage(currentAlgo);
      addLog(`Đã nạp Ví dụ ${chip.dataset.ex} (sẽ thêm dữ liệu thật sau).`);
    };
  });

  document.getElementById("btnRun").onclick = startSimulation;
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

/* SOLVERS: nơi đặt hàm giải thật cho từng thuật toán (sẽ viết ở các tuần sau).
   Ví dụ:
   SOLVERS.hanoi = function (input) {
     const steps = [];
     ... chạy thuật toán, mỗi bước gọi steps.push({ line, msg, state }) ...
     return steps;
   };                                                                          */
const SOLVERS = {};

// Bản mô phỏng tạm khi chưa có hàm giải: đi qua lần lượt từng dòng mã giả
function demoSteps(algo) {
  return algo.pseudo.map((line, i) => ({
    line: i,
    msg: `(Demo khung) Thực hiện dòng ${i + 1}: ${line.trim()}`,
    state: null
  }));
}

function startSimulation() {
  stopAutoPlay();
  const input = readInputs();
  const solver = SOLVERS[currentAlgo.id];
  sim.steps = solver ? solver(input) : demoSteps(currentAlgo);
  sim.index = -1;
  document.getElementById("log").innerHTML = "";
  goToStep(0);
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
  if (sim.steps.length === 0) startSimulation();
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

/* ---------- KHỞI ĐỘNG ---------- */
document.getElementById("menuBtn").onclick = () => document.body.classList.toggle("menu-open");
window.addEventListener("hashchange", router);
renderSidebar();
router();
