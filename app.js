const MAX = 6;
const KEY = "gear_codes_v1";

function getCodes(){
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function setCodes(arr){
  localStorage.setItem(KEY, JSON.stringify(arr));
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// 角度→座標
function polar(cx, cy, r, deg){
  const rad = (deg - 90) * Math.PI / 180; // -90で上を0度に
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// 円スライスのパス（扇形）
function slicePath(cx, cy, r, startDeg, endDeg){
  const a = polar(cx, cy, r, startDeg);
  const b = polar(cx, cy, r, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function render(){
  const codes = getCodes();
  const progress = clamp(codes.length, 0, MAX);

  // 表示テキスト
  document.getElementById("progressText").textContent = `${progress} / ${MAX}`;

  // 取得済みコード
  const list = document.getElementById("codesList");
  list.innerHTML = "";
  codes.slice(0, MAX).forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    list.appendChild(li);
  });

  // SVG（マスク）生成
  const size = 512;
  const cx = size/2, cy = size/2;
  const r = size * 0.52; // マスク半径（gear.pngの外径に合わせて調整）

  // 6分割：1枚ずつ色づく
  const step = 360 / MAX;

  let maskPaths = "";
  for(let i=0; i<MAX; i++){
    const start = i * step;
    const end = (i+1) * step;
    const visible = i < progress ? "#fff" : "#000";
    maskPaths += `<path d="${slicePath(cx, cy, r, start, end)}" fill="${visible}"></path>`;
  }

  // gear.pngを2枚重ね：上をオレンジ化してマスク
  // ※gear.pngは「透過背景」を推奨
  const svg = `
  <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="ギア進捗">
    <defs>
      <mask id="m">
        <rect width="100%" height="100%" fill="#000"></rect>
        ${maskPaths}
      </mask>
    </defs>

    <!-- 下：灰（そのまま） -->
    <image href="./gear.png" x="0" y="0" width="${size}" height="${size}" />

    <!-- 上：オレンジ化（CSSフィルタ）＋マスク -->
    <image href="./gear.png" x="0" y="0" width="${size}" height="${size}"
      mask="url(#m)" class="orangeLayer" />
  </svg>
  `;

  const stage = document.getElementById("gearStage");
  stage.innerHTML = svg;

  // オレンジ化のフィルタ（必要に応じて調整）
  // ここは「画像次第で最適値が変わる」ため微調整前提です。
  const orange = stage.querySelector(".orangeLayer");
  orange.style.filter = "sepia(1) saturate(7000%) hue-rotate(6deg) brightness(0.95)";
}

document.getElementById("resetBtn").addEventListener("click", () => {
  localStorage.removeItem(KEY);
  render();
});

document.getElementById("showCodesBtn").addEventListener("click", () => {
  document.getElementById("codesPanel").open = true;
});

render();
