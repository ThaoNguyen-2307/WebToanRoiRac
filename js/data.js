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
      { key: "n", label: "n", type: "number", value: 3, min: 1, max: 6 },
      { key: "m", label: "m (cho tổ hợp)", type: "number", value: 2, min: 1, max: 6 }
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
    complexity: "Nhị phân O(2ⁿ), hoán vị O(n!)"
  },
  {
    id: "nhau",
    name: "Xếp n quân hậu",
    group: "quaylui",
    short: "Đặt n quân hậu lên bàn cờ n×n sao cho không con nào ăn được nhau.",
    inputs: [
      { key: "n", label: "Kích thước bàn cờ n", type: "number", value: 4, min: 4, max: 8 }
    ],
    pseudo: [
      "Try(i):",
      "  for j = 1..n:",
      "    if cột j và 2 đường chéo còn trống:",
      "      đặt hậu tại (i, j)",
      "      if i == n: in lời giải",
      "      else: Try(i + 1)",
      "      gỡ hậu tại (i, j)  // quay lui"
    ],
    complexity: "O(n!)"
  },
  {
    id: "hanoi",
    name: "Tháp Hà Nội",
    group: "quaylui",
    short: "Chuyển n đĩa từ cọc A sang cọc C, không đặt đĩa to lên đĩa nhỏ.",
    inputs: [
      { key: "n", label: "Số đĩa n", type: "number", value: 3, min: 1, max: 7 }
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
    short: "So sánh số lần gọi hàm giữa đệ quy thường và quy hoạch động.",
    inputs: [
      { key: "n", label: "n", type: "number", value: 6, min: 1, max: 10 },
      { key: "mode", label: "Cách giải", type: "select",
        options: ["Đệ quy thường", "Quy hoạch động (lưu kết quả)"] }
    ],
    pseudo: [
      "fib(n):",
      "  if n <= 2: return 1",
      "  if n đã có trong bảng nhớ: return nhớ[n]",
      "  nhớ[n] = fib(n-1) + fib(n-2)",
      "  return nhớ[n]"
    ],
    complexity: "Đệ quy O(2ⁿ), QHĐ O(n)"
  },
  {
    id: "balo",
    name: "Xếp ba lô (cái túi)",
    group: "qhd",
    short: "Chọn đồ vật bỏ vào ba lô sức chứa b để tổng giá trị lớn nhất.",
    inputs: [
      { key: "b", label: "Sức chứa ba lô b", type: "number", value: 8, min: 1, max: 30 },
      { key: "w", label: "Trọng lượng (cách nhau dấu phẩy)", type: "text", value: "3, 4, 5, 2" },
      { key: "v", label: "Giá trị (cách nhau dấu phẩy)", type: "text", value: "4, 5, 6, 3" }
    ],
    pseudo: [
      "for i = 1..n:",
      "  for w = 0..b:",
      "    F[i][w] = F[i-1][w]",
      "    if a[i] <= w:",
      "      F[i][w] = max(F[i][w], F[i-1][w-a[i]] + c[i])",
      "return F[n][b]"
    ],
    complexity: "O(n × b)"
  },
  {
    id: "tsp",
    name: "Người du lịch (TSP)",
    group: "nhanhcan",
    short: "Tìm hành trình đi qua mọi thành phố đúng 1 lần, quay về điểm đầu, chi phí nhỏ nhất.",
    inputs: [
      { key: "matrix", label: "Ma trận chi phí", type: "matrix",
        value: "0 20 42 35\n20 0 30 34\n42 30 0 12\n35 34 12 0" }
    ],
    pseudo: [
      "Try(i):",
      "  for j in các thành phố chưa đi:",
      "    x[i] = j; cộng chi phí",
      "    if i == n: cập nhật kỷ lục",
      "    else if chi phí + cận dưới < kỷ lục:",
      "      Try(i + 1)",
      "    // ngược lại: cắt nhánh",
      "    trừ chi phí  // quay lui"
    ],
    complexity: "Xấu nhất O(n!), cắt nhánh giúp nhanh hơn nhiều"
  },
  {
    id: "bfsdfs",
    name: "Duyệt đồ thị BFS, DFS",
    group: "dothi",
    short: "Thăm tất cả các đỉnh của đồ thị theo chiều rộng hoặc chiều sâu.",
    inputs: [
      { key: "mode", label: "Thuật toán", type: "select", options: ["BFS (chiều rộng)", "DFS (chiều sâu)"] },
      { key: "matrix", label: "Ma trận kề", type: "matrix",
        value: "0 1 1 0 0\n1 0 0 1 0\n1 0 0 1 1\n0 1 1 0 1\n0 0 1 1 0" },
      { key: "start", label: "Đỉnh bắt đầu", type: "number", value: 1, min: 1, max: 10 }
    ],
    pseudo: [
      "BFS(s):",
      "  đánh dấu s; đưa s vào hàng đợi Q",
      "  while Q không rỗng:",
      "    u = lấy đầu Q; thăm u",
      "    for v kề với u:",
      "      if v chưa đánh dấu:",
      "        đánh dấu v; đưa v vào Q"
    ],
    complexity: "O(V + E)"
  },
  {
    id: "dijkstra",
    name: "Dijkstra — đường đi ngắn nhất",
    group: "dothi",
    short: "Tìm đường đi ngắn nhất từ một đỉnh đến các đỉnh khác (trọng số không âm).",
    inputs: [
      { key: "matrix", label: "Ma trận trọng số (0 = không có cạnh)", type: "matrix",
        value: "0 4 1 0 0\n4 0 2 5 0\n1 2 0 8 10\n0 5 8 0 2\n0 0 10 2 0" },
      { key: "start", label: "Đỉnh đầu", type: "number", value: 1, min: 1, max: 10 },
      { key: "end", label: "Đỉnh cuối", type: "number", value: 5, min: 1, max: 10 }
    ],
    pseudo: [
      "d[s] = 0; d[v] = ∞ với v ≠ s",
      "while còn đỉnh chưa chốt:",
      "  u = đỉnh chưa chốt có d[u] nhỏ nhất",
      "  chốt u",
      "  for v kề với u:",
      "    if d[u] + w(u,v) < d[v]:",
      "      d[v] = d[u] + w(u,v); trước[v] = u"
    ],
    complexity: "O(V²)"
  }
];
