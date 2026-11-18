/* =========================================================
   bfsdfs.js — DUYỆT ĐỒ THỊ THEO CHIỀU RỘNG (BFS) VÀ CHIỀU SÂU (DFS)
   Đồ thị cho bằng ma trận kề: ô (u, v) khác 0 nghĩa là có cạnh u -> v.
   Ma trận đối xứng -> đồ thị vô hướng; không đối xứng -> có hướng (vẽ mũi tên).
   Các đỉnh kề được xét theo thứ tự tăng dần.

   Mã giả BFS (data.js):              Mã giả DFS (đệ quy):
     0 BFS(s):                           0 DFS(u):
     1   đánh dấu s; Q = [s]             1   đánh dấu u; thăm u
     2   while Q không rỗng:             2   for v kề với u:
     3     u = lấy đầu Q; thăm u         3     if v chưa đánh dấu:
     4     for v kề với u:               4       DFS(v)
     5       if v chưa đánh dấu:         5   // hết đỉnh kề: quay lui
     6         đánh dấu v; thêm v vào Q
   ========================================================= */

const DUYET_BFS = "BFS (chiều rộng)";

SOLVERS.bfsdfs = function (input) {
  const mt = docMaTran(input.matrix);
  const n = mt.length;
  kiemTraDinh(input.start, n, "start", "Đỉnh bắt đầu");
  const s = input.start - 1;
  const coHuong = !laDoiXung(mt);
  const bfs = input.mode === DUYET_BFS;

  const steps = [];
  const danhDau = Array(n).fill(false);
  const daTham = Array(n).fill(false);
  const cha = Array(n).fill(-1);          // đỉnh nào dẫn tới đỉnh này (để vẽ cây duyệt)
  const thuTu = [];                       // thứ tự thăm
  const Q = [];                           // hàng đợi (BFS) hoặc ngăn xếp lời gọi (DFS)

  function ghi(line, msg, them = {}) {
    kiemTraSoBuoc(steps);
    steps.push({
      line, msg,
      state: { loai: bfs ? "bfs" : "dfs", n, mt, coHuong, s, danhDau: danhDau.slice(), daTham: daTham.slice(),
               cha: cha.slice(), thuTu: thuTu.slice(), Q: Q.slice(), ...them }
    });
  }

  if (bfs) {
    ghi(0, `Bắt đầu BFS từ đỉnh ${s + 1}. Các đỉnh kề được xét theo thứ tự tăng dần.`);
    danhDau[s] = true; Q.push(s);
    ghi(1, `Đánh dấu ${s + 1} và đưa vào hàng đợi: Q = [${s + 1}].`, { u: s });
    while (Q.length) {
      ghi(2, `Hàng đợi Q = [${Q.map(v => v + 1).join(", ")}] chưa rỗng.`);
      const u = Q.shift();
      daTham[u] = true; thuTu.push(u);
      ghi(3, `Lấy ${u + 1} ở ĐẦU hàng đợi ra và thăm. Thứ tự thăm: ${thuTu.map(v => v + 1).join(" → ")}.`, { u });
      const ke = dinhKe(mt, u);
      if (!ke.length) ghi(4, `Đỉnh ${u + 1} không có đỉnh kề nào.`, { u });
      for (const v of ke) {
        ghi(4, `Xét đỉnh ${v + 1} kề với ${u + 1}.`, { u, v });
        if (danhDau[v]) {
          ghi(5, `${v + 1} đã được đánh dấu rồi, bỏ qua.`, { u, v });
        } else {
          danhDau[v] = true; cha[v] = u; Q.push(v);
          ghi(6, `${v + 1} chưa đánh dấu: đánh dấu và thêm vào CUỐI hàng đợi. Q = [${Q.map(x => x + 1).join(", ")}].`, { u, v });
        }
      }
    }
    ghi(2, "Hàng đợi rỗng: kết thúc BFS.", { xong: true });
  } else {
    ghi(null, `Bắt đầu DFS từ đỉnh ${s + 1}. Các đỉnh kề được xét theo thứ tự tăng dần.`);
    (function DFS(u) {
      Q.push(u);                          // vào ngăn xếp lời gọi
      ghi(0, `Gọi DFS(${u + 1}).`, { u });
      danhDau[u] = daTham[u] = true; thuTu.push(u);
      ghi(1, `Đánh dấu và thăm ${u + 1}. Thứ tự thăm: ${thuTu.map(v => v + 1).join(" → ")}.`, { u });
      for (const v of dinhKe(mt, u)) {
        ghi(2, `Xét đỉnh ${v + 1} kề với ${u + 1}.`, { u, v });
        if (danhDau[v]) {
          ghi(3, `${v + 1} đã được đánh dấu, bỏ qua.`, { u, v });
        } else {
          cha[v] = u;
          ghi(4, `${v + 1} chưa đánh dấu: đi SÂU xuống, gọi DFS(${v + 1}).`, { u, v });
          DFS(v);
          ghi(2, `Quay lại DFS(${u + 1}), xét tiếp các đỉnh kề còn lại của ${u + 1}.`, { u });
        }
      }
      Q.pop();
      ghi(5, Q.length ? `Đã xét hết đỉnh kề của ${u + 1}: kết thúc DFS(${u + 1}), quay lui về ${Q[Q.length - 1] + 1}.`
                      : `Đã xét hết đỉnh kề của ${u + 1}: kết thúc DFS(${u + 1}).`, { u });
    })(s);
  }

  const khongToi = [];
  for (let v = 0; v < n; v++) if (!daTham[v]) khongToi.push(v + 1);
  ghi(null, `Xong! Thứ tự thăm ${bfs ? "BFS" : "DFS"}: ${thuTu.map(v => v + 1).join(" → ")}.`
    + (khongToi.length ? ` Không đi tới được các đỉnh: ${khongToi.join(", ")} (đồ thị không liên thông).` : " Đã thăm đủ tất cả các đỉnh."),
    { xong: true });
  return steps;
};

/* ---------- HÀM VẼ ---------- */
VE.bfsdfs = function (step) {
  const s = step.state;
  const bfs = s.loai === "bfs";
  const doThi = veDoThi({
    n: s.n, mt: s.mt, coHuong: s.coHuong, nhanCanh: false,
    lopDinh: i => i === s.u && !s.xong ? "hien-tai" : i === s.v ? "dang-xet"
      : s.daTham[i] ? "da-tham" : s.danhDau[i] ? "cho" : "",
    phuDinh: i => { const k = s.thuTu.indexOf(i); return k >= 0 ? `#${k + 1}` : ""; },
    lopCanh: (a, b) => (a === s.u && b === s.v) ? "dang-xet" : s.cha[b] === a ? "cay" : ""
  });

  const tenQ = bfs ? "Hàng đợi Q (lấy ra ở đầu, thêm vào ở cuối)" : "Ngăn xếp lời gọi đệ quy (đỉnh trên cùng đang chạy)";
  const dsQ = bfs ? s.Q : [...s.Q].reverse();
  return `
    <div class="dt-hang">${doThi}
      <div class="dt-ben">
        <span class="dem-tieu-de">${tenQ}</span>
        <div class="hang-doi ${bfs ? "" : "doc"}">${dsQ.length
          ? dsQ.map((v, k) => `<span class="${k === 0 ? "dau" : ""}">${bfs ? v + 1 : `DFS(${v + 1})`}</span>`).join("")
          : `<em>(rỗng)</em>`}</div>
        <span class="dem-tieu-de">Thứ tự thăm</span>
        <div class="thu-tu">${s.thuTu.length ? s.thuTu.map(v => `<span>${v + 1}</span>`).join("<i>→</i>") : "<em>(chưa thăm đỉnh nào)</em>"}</div>
      </div>
    </div>
    <div class="chu-thich">
      <span><i class="cham hien-tai"></i>đang xét (u)</span>
      <span><i class="cham dang-xet"></i>đỉnh kề đang xét (v)</span>
      ${bfs ? `<span><i class="cham cho"></i>đã đánh dấu, chờ trong Q</span>` : ""}
      <span><i class="cham xong"></i>đã thăm</span>
      <span><i class="vach"></i>cạnh của cây duyệt</span>
    </div>`;
};

/* ---------- LÝ THUYẾT ---------- */
ALGORITHMS.find(a => a.id === "bfsdfs").lyThuyet = `
  <p><b>Đồ thị</b> G = (V, E) gồm tập đỉnh V và tập cạnh E. Trong máy tính, đồ thị n đỉnh thường được lưu bằng
     <b>ma trận kề</b> A cỡ n × n: A[u][v] ≠ 0 nếu có cạnh từ u đến v. Đồ thị vô hướng có ma trận đối xứng.</p>
  <p><b>Duyệt đồ thị</b> là đi qua tất cả các đỉnh đến được từ một đỉnh xuất phát s, mỗi đỉnh đúng một lần.
     Để không thăm lại, mỗi đỉnh có một dấu "đã đánh dấu".</p>

  <h3>BFS: duyệt theo chiều rộng</h3>
  <p>Dùng <b>hàng đợi</b> (vào trước ra trước). Thăm s, rồi lần lượt các đỉnh cách s 1 cạnh, rồi các đỉnh cách s 2 cạnh...
     giống như vết loang. Vì vậy đường đi từ s theo cây BFS là <b>đường đi ít cạnh nhất</b>.</p>

  <h3>DFS: duyệt theo chiều sâu</h3>
  <p>Dùng <b>đệ quy</b> (hoặc ngăn xếp: vào sau ra trước). Từ đỉnh u, đi ngay sang một đỉnh kề chưa thăm và tiếp tục đi sâu,
     đến khi không đi tiếp được thì <b>quay lui</b> về đỉnh trước đó. DFS chính là kỹ thuật quay lui áp dụng trên đồ thị.</p>

  <table class="table">
    <thead><tr><th></th><th>BFS</th><th>DFS</th></tr></thead>
    <tbody>
      <tr><td>Cấu trúc dữ liệu</td><td>Hàng đợi (FIFO)</td><td>Đệ quy / ngăn xếp (LIFO)</td></tr>
      <tr><td>Thứ tự thăm</td><td>Gần trước, xa sau (theo lớp)</td><td>Đi sâu hết một nhánh rồi mới quay lại</td></tr>
      <tr><td>Ứng dụng</td><td>Đường đi ít cạnh nhất, tìm theo mức</td><td>Kiểm tra liên thông, tìm chu trình, sắp xếp tô-pô</td></tr>
      <tr><td>Độ phức tạp</td><td colspan="2">O(n²) với ma trận kề; O(V + E) với danh sách kề</td></tr>
    </tbody>
  </table>
  <p>Đỉnh nào không được thăm sau khi duyệt từ s thì không có đường đi từ s tới đỉnh đó, tức đồ thị không liên thông.</p>`;
