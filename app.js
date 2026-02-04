const MAX = 6;
const KEY = "gear_codes_v1";

function getCodes() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// 角度→座標
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180; // -90で上を0度に
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// 円スライスのパス（扇形）
function slicePath(cx, cy, r, startDeg, endDeg) {
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function render() {
  const codes = getCodes();
  const progress = clamp(codes.length, 0, MAX);

  // 表示テキスト
  const progressEl = document.getElementById("progressText");
  if (progressEl) progressEl.textContent = `${progress} / ${MAX}`;

  // 取得済みコード
  const list = document.getElementById("codesList");
  if (list) {
    list.innerHTML = "";
    codes.slice(0, MAX).forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      list.appendChild(li);
    });
  }

  // SVG（マスク）生成
  const size = 512;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.52; // ←色づき範囲がズレる時はここを0.48〜0.58で調整

  // 6分割：1枚ずつ色づく
  const step = 360 / MAX;

  let maskPaths = "";
  for (let i = 0; i < MAX; i++) {
    const start = i * step;
    const end = (i + 1) * step;
    const visible = i < progress ? "#fff" : "#000";
    maskPaths += `<path d="${slicePath(cx, cy, r, start, end)}" fill="${visible}"></path>`;
  }

  // gear.pngを2枚重ね：上を#F04600に変換してマスク
  // ※gear.pngは透過PNG推奨（今回の添付はOKです）
  const svg = `
  <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="ギア進捗">
    <defs>
      <mask id="m">
        <rect width="100%" height="100%" fill="#000"></rect>
        ${maskPaths}
      </mask>

      <!-- #F04600 に“塗り替える”SVGフィルタ（透明度は元画像のまま維持） -->
      <filter id="tint" color-interpolation-filters="sRGB">
        <!--
          R=0.941176 (240/255)
          G=0.274510 (70/255)
          B=0        (0/255)
          A=元画像を維持
        -->
        <feColorMatrix type="matrix" values="
          0 0 0 0 0.941176
          0 0 0 0 0.274510
          0 0 0 0 0
          0 0 0 1 0
        "/>
      </filter>
    </defs>

    <!-- 下：灰（そのまま） -->
    <image href="./gear.png" x="0" y="0" width="${size}" height="${size}" />

    <!-- 上：オレンジ化＋マスク -->
    <image href="./gear.png" x="0" y="0" width="${size}" height="${size}"
      mask="url(#m)" filter="url(#tint)" />
  </svg>
  `;

  const stage = document.getElementById("gearStage");
  if (stage) stage.innerHTML = svg;
}

// ボタン類（存在チェック付き）
const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(KEY);
    render();
  });
}

const showCodesBtn = document.getElementById("showCodesBtn");
if (showCodesBtn) {
  showCodesBtn.addEventListener("click", () => {
    const panel = document.getElementById("codesPanel");
    if (panel) panel.open = true;
  });
}

render();
