const NAV_ICONS = {
  // Quay lui: mũi tên quay ngược
  quaylui: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>`,
  // Quy hoạch động: bảng ô
  qhd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`,
  // Nhánh cận: cây có nhánh bị cắt
  nhanhcan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="12" cy="4" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/>
    <path d="M12 6v11M11 7l-5 10M13 7l3.5 5"/><path d="M15.5 14.5l4 4M19.5 14.5l-4 4"/></svg>`,
  // Đồ thị: các đỉnh nối nhau
  dothi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><circle cx="5" cy="18" r="2.2"/>
    <path d="M7.2 6h9.6M6.2 7.9l4.8 8.3M17.8 7.9l-4.8 8.3M5 8.2v7.6"/></svg>`
};

const VANG = "#ffd43b";

const MINH_HOA = {
  lietke: { mau: "#3d4a63", svg: `
    <g stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".3">
      <line x1="100" y1="42" x2="145" y2="98"/><line x1="145" y1="98" x2="125" y2="155"/>
      <line x1="145" y1="98" x2="168" y2="155"/><line x1="55" y1="98" x2="32" y2="155"/></g>
    <g stroke="${VANG}" stroke-width="6" stroke-linecap="round">
      <line x1="100" y1="42" x2="55" y2="98"/><line x1="55" y1="98" x2="78" y2="155"/></g>
    <g fill="#fff"><circle cx="100" cy="42" r="15"/><circle cx="55" cy="98" r="15"/><circle cx="78" cy="155" r="15"/></g>
    <g fill="#fff" opacity=".35"><circle cx="145" cy="98" r="15"/><circle cx="32" cy="155" r="15"/>
      <circle cx="125" cy="155" r="15"/><circle cx="168" cy="155" r="15"/></g>
    <g font-family="Arial,sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#3d4a63">
      <text x="55" y="103">0</text><text x="78" y="160">01</text></g>` },

  // Bàn cờ 4×4 với 4 quân hậu không ăn nhau
  nhau: { mau: "#a35d4f", svg: `
    ${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c =>
      `<rect x="${30 + c * 35}" y="${30 + r * 35}" width="35" height="35" fill="${(r + c) % 2 ? "#ecd3c9" : "#fff"}"/>`).join("")).join("")}
    ${[[0, 1], [1, 3], [2, 0], [3, 2]].map(([r, c]) => {
      const x = 47.5 + c * 35, y = 47.5 + r * 35;
      return `<path d="M${x - 11} ${y + 9}L${x - 13} ${y - 6}L${x - 5} ${y}L${x} ${y - 11}L${x + 5} ${y}L${x + 13} ${y - 6}L${x + 11} ${y + 9}Z" fill="#3a1a12"/>`;
    }).join("")}
    <rect x="30" y="30" width="140" height="140" fill="none" stroke="#3a1a12" stroke-width="3"/>` },

  // Tháp Hà Nội: 3 cọc, 1 đĩa đang được nhấc lên
  hanoi: { mau: "#6f9a8d", svg: `
    <g fill="#f1f7f4" opacity=".9"><rect x="47" y="70" width="6" height="95"/><rect x="97" y="70" width="6" height="95"/>
      <rect x="147" y="70" width="6" height="95"/><rect x="18" y="163" width="164" height="9" rx="4"/></g>
    <rect x="20" y="149" width="60" height="14" rx="7" fill="#2a3242"/>
    <rect x="27" y="135" width="46" height="14" rx="7" fill="#ff8787"/>
    <rect x="134" y="149" width="32" height="14" rx="7" fill="#fff"/>
    <rect x="90" y="40" width="20" height="14" rx="7" fill="${VANG}"/>
    <path d="M150 140 Q150 47 116 47" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/>` },

  // Cây gọi đệ quy Fibonacci: các lời gọi bị lặp tô vàng
  fibonacci: { mau: "#7f9a72", svg: `
    <g stroke="#fff" stroke-width="3.5" opacity=".75">
      <line x1="100" y1="35" x2="58" y2="85"/><line x1="100" y1="35" x2="142" y2="85"/>
      <line x1="58" y1="85" x2="33" y2="135"/><line x1="58" y1="85" x2="83" y2="135"/>
      <line x1="142" y1="85" x2="122" y2="135"/><line x1="142" y1="85" x2="165" y2="135"/>
      <line x1="33" y1="135" x2="18" y2="178"/><line x1="33" y1="135" x2="50" y2="178"/></g>
    ${[[100, 35, 5], [58, 85, 4], [142, 85, 3, 1], [33, 135, 3, 1], [83, 135, 2], [122, 135, 2], [165, 135, 1],
       [18, 178, 2], [50, 178, 1]].map(([x, y, n, lap]) =>
      `<circle cx="${x}" cy="${y}" r="15" fill="${lap ? VANG : "#fff"}"/>
       <text x="${x}" y="${y + 5}" font-family="Arial,sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="#3d5236">${n}</text>`).join("")}` },

  // Bảng quy hoạch động của bài ba lô: điền dần từng ô
  balo: { mau: "#5b7a99", svg: `
    ${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => {
      const daDien = r < 3 || (r === 3 && c < 2), dangXet = r === 3 && c === 2;
      return `<rect x="${36 + c * 26}" y="${36 + r * 26}" width="23" height="23" rx="4"
        fill="${dangXet ? VANG : "#fff"}" opacity="${daDien || dangXet ? 1 : .3}"/>`;
    }).join("")).join("")}
    <g stroke="#1f2f44" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M99.5 101v12"/><path d="M73 98l17 17"/></g>` },

  // Người du lịch: các thành phố và một hành trình khép kín
  tsp: { mau: "#c98b4a", svg: `
    <polygon points="45,62 112,36 166,82 150,156 80,166 36,120" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
    <g stroke="#fff" stroke-width="2" stroke-dasharray="5 6" opacity=".55"><line x1="45" y1="62" x2="150" y2="156"/><line x1="112" y1="36" x2="80" y2="166"/></g>
    ${[[112, 36], [166, 82], [150, 156], [80, 166], [36, 120]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="10" fill="#4a2f12" stroke="#fff" stroke-width="3"/>`).join("")}
    <circle cx="45" cy="62" r="12" fill="${VANG}" stroke="#fff" stroke-width="3"/>` },

  // BFS: duyệt theo từng lớp, đỉnh đã thăm tô vàng
  bfsdfs: { mau: "#7d6b91", svg: `
    <circle cx="100" cy="45" r="70" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 7" opacity=".4"/>
    <g stroke="#fff" stroke-width="3.5" opacity=".8">
      <line x1="100" y1="45" x2="55" y2="100"/><line x1="100" y1="45" x2="145" y2="100"/>
      <line x1="55" y1="100" x2="35" y2="158"/><line x1="55" y1="100" x2="85" y2="158"/>
      <line x1="145" y1="100" x2="125" y2="158"/><line x1="145" y1="100" x2="168" y2="158"/></g>
    <circle cx="100" cy="45" r="14" fill="${VANG}"/><circle cx="55" cy="100" r="14" fill="${VANG}"/><circle cx="145" cy="100" r="14" fill="${VANG}"/>
    ${[35, 85, 125, 168].map(x => `<circle cx="${x}" cy="158" r="14" fill="#fff" opacity=".9"/>`).join("")}` },

  // Dijkstra: đồ thị có trọng số, đường ngắn nhất tô vàng
  dijkstra: { mau: "#2a3242", svg: `
    <g stroke="#fff" stroke-width="3" opacity=".3">
      <line x1="35" y1="100" x2="92" y2="45"/><line x1="92" y1="45" x2="155" y2="58"/>
      <line x1="155" y1="58" x2="170" y2="145"/><line x1="92" y1="45" x2="95" y2="158"/></g>
    <g stroke="${VANG}" stroke-width="6" stroke-linecap="round"><line x1="35" y1="100" x2="95" y2="158"/><line x1="95" y1="158" x2="170" y2="145"/></g>
    <g font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">
      <text x="56" y="66">7</text><text x="124" y="42">4</text><text x="176" y="100">6</text><text x="82" y="105">5</text>
      <text x="52" y="142">2</text><text x="134" y="168">3</text></g>
    ${[[35, 100], [92, 45], [155, 58], [95, 158], [170, 145]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="12" fill="#fff"/>`).join("")}
    <circle cx="35" cy="100" r="12" fill="${VANG}"/><circle cx="170" cy="145" r="12" fill="${VANG}"/>` }
};
