/* =========================================================
   data.js — DỮ LIỆU các thuật toán
   Muốn thêm thuật toán mới: chỉ cần thêm 1 object vào ALGORITHMS.
   ========================================================= */

// Các nhóm kỹ thuật (theo slide của thầy)
const GROUPS = [
  { id: "quaylui",  name: "Quay lui",        icon: "↩" },
  { id: "qhd",      name: "Quy hoạch động",  icon: "▦" },
  { id: "nhanhcan", name: "Nhánh cận",       icon: "✂" },
  { id: "dothi",    name: "Đồ thị",          icon: "◉" }
];

/* Mỗi thuật toán gồm:
   - id, name, group, short: thông tin hiển thị
   - inputs: các ô nhập liệu (type: number | select | text | matrix)
   - pseudo: mã giả (mỗi phần tử là 1 dòng)
   - complexity: độ phức tạp
*/
const ALGORITHMS = [
  {
    id: "lietke",
    name: "Liệt kê nhị phân, hoán vị, tổ hợp",
    group: "quaylui",
    short: "Liệt kê tất cả cấu hình bằng cách thử từng khả năng cho mỗi vị trí.",
    inputs: [
      { key: "type", label: "Bài toán", type: "select",
        options: ["Dãy nhị phân n bit", "Hoán vị của n phần tử", "Tổ hợp chập m của n"] },
      { key: "n", label: "n", type: "number", value: 3,
        hint: "Nên chọn n nhỏ để dễ theo dõi (hoán vị nên ≤ 5); n càng lớn số bước tăng rất nhanh." },
      // hienKhi: ô m chỉ hiện khi ô "type" đang chọn "Tổ hợp chập m của n"
      { key: "m", label: "m", type: "number", value: 2, hint: "Cần m ≤ n.",
        hienKhi: { key: "type", giaTri: "Tổ hợp chập m của n" } },
      { key: "cheDo", label: "Hiển thị", type: "select",
        options: ["Chi tiết từng dòng mã giả", "Chỉ các cấu hình tìm được"] }
    ],
    pseudo: [
      "Try(i):",
      "  for j in tập đề cử của x[i]:",
      "    if j được chấp nhận:",
      "      x[i] = j",
      "      if i == n: in cấu hình x",
      "      else: Try(i + 1)",
      "      bỏ ghi nhận j  // quay lui"
    ],
    complexity: "Nhị phân O(2ⁿ), hoán vị O(n!)",
    // Mã giả cụ thể cho từng dạng (theo ô "type"). Giữ đủ 7 dòng, cùng thứ tự với mã giả chung ở trên.
    maGiaTheo: {
      key: "type",
      "Dãy nhị phân n bit": [
        "Try(i):",
        "  for j in {0, 1}:",
        "    // 0 và 1 luôn hợp lệ",
        "    x[i] = j",
        "    if i == n: in cấu hình x",
        "    else: Try(i + 1)",
        "    // quay lui, thử j tiếp theo"
      ],
      "Hoán vị của n phần tử": [
        "Try(i):",
        "  for j = 1..n:",
        "    if daDung[j] == false:",
        "      x[i] = j; daDung[j] = true",
        "      if i == n: in cấu hình x",
        "      else: Try(i + 1)",
        "      daDung[j] = false //quay lui"
      ],
      "Tổ hợp chập m của n": [
        "Try(i):        // x[0] = 0",
        "  for j = x[i-1]+1 .. n-m+i:",
        "    // j > x[i-1] nên luôn hợp lệ",
        "    x[i] = j",
        "    if i == m: in cấu hình x",
        "    else: Try(i + 1)",
        "    // quay lui, thử j tiếp theo"
      ]
    }
  },
  {
    id: "nhau",
    name: "Xếp n quân hậu",
    group: "quaylui",
    short: "Đặt n quân hậu lên bàn cờ n×n sao cho không con nào ăn được nhau.",
    inputs: [
      { key: "n", label: "Kích thước bàn cờ n", type: "number", value: 4,
        hint: "Nên chọn 4 đến 8. Với n = 2 hoặc 3 bài toán không có lời giải." },
      { key: "timKiem", label: "Tìm", type: "select", options: ["Lời giải đầu tiên", "Tất cả lời giải"] },
      { key: "cheDo", label: "Hiển thị", type: "select",
        options: ["Chi tiết từng dòng mã giả", "Chỉ các lần đặt / gỡ hậu"] }
    ],
    pseudo: [
      "Try(i):",
      "  for j = 1..n:",
      "    if cột j, 2 đường chéo trống:",
      "      đặt hậu tại (i, j)",
      "      if i == n: in lời giải",
      "      else: Try(i + 1)",
      "      gỡ hậu tại (i, j) //quay lui"
    ],
    complexity: "O(n!)"
  },
  {
    id: "hanoi",
    name: "Tháp Hà Nội",
    group: "quaylui",
    short: "Chuyển n đĩa từ cọc A sang cọc C, không đặt đĩa to lên đĩa nhỏ.",
    inputs: [
      { key: "n", label: "Số đĩa n", type: "number", value: 3,
        hint: "Nên chọn 3 đến 7 đĩa. n đĩa cần 2ⁿ − 1 lần chuyển." },
      { key: "cheDo", label: "Hiển thị", type: "select",
        options: ["Chi tiết từng dòng mã giả", "Chỉ các lần chuyển đĩa"] }
    ],
    pseudo: [
      "hanoi(n, A, B, C):",
      "  if n == 1:",
      "    chuyển đĩa A -> C; return",
      "  hanoi(n-1, A, C, B)",
      "  chuyển đĩa A -> C",
      "  hanoi(n-1, B, A, C)"
    ],
    complexity: "O(2ⁿ) — cần đúng 2ⁿ − 1 bước"
  },
  {
    id: "fibonacci",
    name: "Fibonacci: đệ quy và quy hoạch động",
    group: "qhd",
    short: "Tính số Fibonacci thứ n bằng 3 cách và so sánh số lần gọi hàm: đệ quy thường, QHĐ top-down, QHĐ bottom-up.",
    inputs: [
      { key: "n", label: "n", type: "number", value: 6,
        hint: "Quy ước như slide: f(1) = f(2) = 1, f(6) = 8. Đệ quy thường nên chọn n ≤ 9 để xem được cây lời gọi." },
      { key: "mode", label: "Cách giải", type: "select",
        options: ["Đệ quy thường (vét cạn)", "QHĐ top-down (có bảng nhớ)", "QHĐ bottom-up (vòng lặp)"] }
    ],
    // Mã giả chung (tab Lý thuyết): bản top-down của slide
    pseudo: [
      "fib(n):",
      "  if n <= 2: return 1",
      "  if có nho[n]: return nho[n]",
      "  nho[n] = fib(n-1) + fib(n-2)",
      "  return nho[n]"
    ],
    maGiaTheo: {
      key: "mode",
      "Đệ quy thường (vét cạn)": [
        "fib(n):",
        "  if n <= 2: return 1",
        "  return fib(n-1) + fib(n-2)"
      ],
      "QHĐ top-down (có bảng nhớ)": [
        "fib(n):",
        "  if n <= 2: return 1",
        "  if có nho[n]: return nho[n]",
        "  nho[n] = fib(n-1) + fib(n-2)",
        "  return nho[n]"
      ],
      "QHĐ bottom-up (vòng lặp)": [
        "fib(n):",
        "  F[1] = 1; F[2] = 1",
        "  for i = 3..n:",
        "    F[i] = F[i-1] + F[i-2]",
        "  return F[n]"
      ]
    },
    complexity: "Đệ quy thường O(2ⁿ); QHĐ top-down và bottom-up O(n)"
  },
  {
    id: "balo",
    name: "Xếp ba lô (cái túi)",
    group: "qhd",
    short: "Chọn đồ vật bỏ vào ba lô sức chứa b để tổng giá trị lớn nhất, giải bằng bảng quy hoạch động F[i][w].",
    inputs: [
      { key: "loai", label: "Bài toán", type: "select",
        options: ["Ba lô 1 (mỗi vật lấy tối đa 1 lần)", "Ba lô 2 (mỗi vật lấy tối đa m lần)"] },
      { key: "b", label: "Sức chứa ba lô b", type: "number", value: 8,
        hint: "Nên chọn b ≤ 15 để bảng vừa màn hình." },
      { key: "a", label: "Trọng lượng a₁..aₙ (cách nhau dấu phẩy)", type: "text", value: "3, 4, 5, 2" },
      { key: "c", label: "Giá trị c₁..cₙ (cách nhau dấu phẩy)", type: "text", value: "4, 5, 6, 3" },
      { key: "m", label: "Mỗi vật lấy tối đa m lần", type: "number", value: 2,
        hienKhi: { key: "loai", giaTri: "Ba lô 2 (mỗi vật lấy tối đa m lần)" } },
      { key: "cheDo", label: "Hiển thị", type: "select",
        options: ["Chi tiết từng dòng mã giả", "Chỉ kết quả từng ô"] }
    ],
    pseudo: [
      "for i = 1..n:",
      "  for w = 0..b:",
      "    F[i][w] = F[i-1][w]",
      "    if a[i] <= w:",
      "      lay = F[i-1][w-a[i]] + c[i]",
      "      F[i][w] = max(F[i][w], lay)",
      "w = b                 //truy vết",
      "for i = n..1:",
      "  if F[i][w] != F[i-1][w]:",
      "    chọn vật i; w = w - a[i]",
      "return F[n][b]"
    ],
    maGiaTheo: {
      key: "loai",
      "Ba lô 1 (mỗi vật lấy tối đa 1 lần)": [
        "for i = 1..n:",
        "  for w = 0..b:",
        "    F[i][w] = F[i-1][w]",
        "    if a[i] <= w:",
        "      lay = F[i-1][w-a[i]] + c[i]",
        "      F[i][w] = max(F[i][w], lay)",
        "w = b                 //truy vết",
        "for i = n..1:",
        "  if F[i][w] != F[i-1][w]:",
        "    chọn vật i; w = w - a[i]",
        "return F[n][b]"
      ],
      "Ba lô 2 (mỗi vật lấy tối đa m lần)": [
        "for i = 1..n:",
        "  for w = 0..b:",
        "    F[i][w] = F[i-1][w]",
        "    for k = 1..m, k*a[i] <= w:",
        "      lay = F[i-1][w-k*a[i]]+k*c[i]",
        "      F[i][w] = max(F[i][w], lay)",
        "w = b                 //truy vết",
        "for i = n..1:",
        "  x[i] = số cái vật i đã lấy",
        "  w = w - x[i]*a[i]",
        "return F[n][b]"
      ]
    },
    complexity: "Ba lô 1: O(n × b). Ba lô 2: O(n × b × m)"
  },
  {
    id: "tsp",
    name: "Người du lịch (TSP)",
    group: "nhanhcan",
    short: "Tìm hành trình đi qua mọi thành phố đúng 1 lần rồi quay về, tổng chi phí nhỏ nhất. Giải bằng nhánh cận, so sánh với vét cạn và tham lam.",
    inputs: [
      { key: "mode", label: "Cách giải", type: "select",
        options: ["Nhánh cận", "Vét cạn (quay lui, không cắt nhánh)", "Láng giềng gần nhất (tham lam)"] },
      { key: "matrix", label: "Ma trận chi phí c[i][j]", type: "matrix",
        value: "0 5 8 6 5\n5 0 3 15 8\n8 3 0 3 9\n6 15 3 0 3\n5 8 9 3 0",
        hint: "Hàng i, cột j là chi phí đi từ thành phố i đến j. Đường chéo bỏ qua, số 0 = không có đường. Nên dùng 4 đến 6 thành phố." },
      { key: "start", label: "Thành phố xuất phát", type: "number", value: 1 },
      { key: "cheDo", label: "Hiển thị", type: "select",
        options: ["Chi tiết từng dòng mã giả", "Chỉ các nút trên cây tìm kiếm"] }
    ],
    pseudo: [
      "Try(i):",
      "  for j chưa đi:",
      "    x[i] = j; S += c[x[i-1]][j]",
      "    if i == n:",
      "      T = S + c[j][x[1]]",
      "      if T < kyLuc: lưu kỷ lục",
      "    else: g = S + (n-i+1)*cmin",
      "      if g < kyLuc: Try(i + 1)",
      "      else: cắt nhánh",
      "    S -= c[x[i-1]][j] //quay lui"
    ],
    maGiaTheo: {
      key: "mode",
      "Nhánh cận": [
        "Try(i):",
        "  for j chưa đi:",
        "    x[i] = j; S += c[x[i-1]][j]",
        "    if i == n:",
        "      T = S + c[j][x[1]]",
        "      if T < kyLuc: lưu kỷ lục",
        "    else: g = S + (n-i+1)*cmin",
        "      if g < kyLuc: Try(i + 1)",
        "      else: cắt nhánh",
        "    S -= c[x[i-1]][j] //quay lui"
      ],
      "Vét cạn (quay lui, không cắt nhánh)": [
        "Try(i):",
        "  for j chưa đi:",
        "    x[i] = j; S += c[x[i-1]][j]",
        "    if i == n:",
        "      T = S + c[j][x[1]]",
        "      if T < kyLuc: lưu kỷ lục",
        "    else: Try(i + 1)",
        "    // không tính cận dưới",
        "    // nên không cắt nhánh nào",
        "    S -= c[x[i-1]][j] //quay lui"
      ],
      "Láng giềng gần nhất (tham lam)": [
        "u = x[1] = xuất phát; S = 0",
        "for i = 2..n:",
        "  j = chưa đi, gần u nhất",
        "  x[i] = j; S += c[u][j]; u = j",
        "S += c[u][x[1]]   //quay về",
        "return S"
      ]
    },
    complexity: "Vét cạn O(n!); nhánh cận xấu nhất O(n!) nhưng thường cắt được rất nhiều nhánh; tham lam O(n²)"
  },
  {
    id: "bfsdfs",
    name: "Duyệt đồ thị BFS, DFS",
    group: "dothi",
    short: "Thăm tất cả các đỉnh của đồ thị theo chiều rộng (hàng đợi) hoặc chiều sâu (đệ quy).",
    inputs: [
      { key: "mode", label: "Thuật toán", type: "select", options: ["BFS (chiều rộng)", "DFS (chiều sâu)"] },
      { key: "matrix", label: "Ma trận kề", type: "matrix",
        value: "0 1 1 0 0\n1 0 0 1 0\n1 0 0 1 1\n0 1 1 0 1\n0 0 1 1 0",
        hint: "Số khác 0 ở hàng u, cột v = có cạnh u → v. Ma trận đối xứng là đồ thị vô hướng." },
      { key: "start", label: "Đỉnh bắt đầu", type: "number", value: 1 }
    ],
    pseudo: [
      "BFS(s):",
      "  đánh dấu s; Q = [s]",
      "  while Q không rỗng:",
      "    u = lấy đầu Q; thăm u",
      "    for v kề với u:",
      "      if v chưa đánh dấu:",
      "        đánh dấu v; thêm v vào Q"
    ],
    maGiaTheo: {
      key: "mode",
      "BFS (chiều rộng)": [
        "BFS(s):",
        "  đánh dấu s; Q = [s]",
        "  while Q không rỗng:",
        "    u = lấy đầu Q; thăm u",
        "    for v kề với u:",
        "      if v chưa đánh dấu:",
        "        đánh dấu v; thêm v vào Q"
      ],
      "DFS (chiều sâu)": [
        "DFS(u):",
        "  đánh dấu u; thăm u",
        "  for v kề với u:",
        "    if v chưa đánh dấu:",
        "      DFS(v)",
        "  // hết đỉnh kề: quay lui"
      ]
    },
    complexity: "O(n²) với ma trận kề (O(V + E) với danh sách kề)"
  },
  {
    id: "dijkstra",
    name: "Dijkstra — đường đi ngắn nhất",
    group: "dothi",
    short: "Tìm đường đi ngắn nhất từ một đỉnh đến các đỉnh khác trên đồ thị có trọng số không âm.",
    inputs: [
      { key: "matrix", label: "Ma trận trọng số", type: "matrix",
        value: "0 4 1 0 0\n4 0 2 5 0\n1 2 0 8 10\n0 5 8 0 2\n0 0 10 2 0",
        hint: "Hàng u, cột v là độ dài cạnh u → v; 0 = không có cạnh. Trọng số phải không âm." },
      { key: "start", label: "Đỉnh đầu s", type: "number", value: 1 },
      { key: "end", label: "Đỉnh cuối t", type: "number", value: 5 }
    ],
    pseudo: [
      "d[s] = 0; d[v] = ∞ với v ≠ s",
      "while còn đỉnh chưa chốt:",
      "  u = chưa chốt, d[u] nhỏ nhất",
      "  if d[u] == ∞: dừng",
      "  chốt u",
      "  for v kề u, v chưa chốt:",
      "    if d[u] + w(u,v) < d[v]:",
      "      d[v] = d[u] + w(u,v)",
      "      truoc[v] = u",
      "truy vết từ t về s qua truoc[]"
    ],
    complexity: "O(n²) với ma trận kề"
  }
];

/* =========================================================
   CHỖ ĐĂNG KÝ THUẬT TOÁN (dùng chung)
   SOLVERS[id](input) -> mảng các bước: { line, msg, state }
     line : số thứ tự dòng mã giả cần tô sáng (bắt đầu từ 0)
     msg  : lời giải thích của bước đó
     state: dữ liệu để vẽ hình ở bước đó
   VE[id](step) -> chuỗi HTML vẽ trạng thái của 1 bước
   Mỗi thuật toán viết trong 1 file riêng ở js/thuat-toan/ (VD: hanoi.js)
   ========================================================= */
const SOLVERS = {};
const VE = {};

// Hàm giải gọi loiDuLieu(...) khi dữ liệu sai ràng buộc riêng, web sẽ hiện thông báo dưới ô nhập
function loiDuLieu(key, thongBao) {
  const e = new Error(thongBao);
  e.key = key;
  throw e;
}

// Số bước mô phỏng tối đa. Vượt quá sẽ báo "dữ liệu quá lớn" thay vì làm treo trình duyệt
const GIOI_HAN_BUOC = 100000;
function kiemTraSoBuoc(steps) {
  if (steps.length >= GIOI_HAN_BUOC)
    loiDuLieu("n", `Dữ liệu quá lớn: mô phỏng cần hơn ${GIOI_HAN_BUOC.toLocaleString("vi-VN")} bước, trình duyệt sẽ bị treo. Hãy nhập n nhỏ hơn.`);
}
