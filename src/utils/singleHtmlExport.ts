/**
 * Utility to generate and download a 100% self-contained single-file HTML version
 * of ChromaShift Lab with zero external dependencies (no CDNs, no external CSS, no external fonts).
 * Can be opened by double-clicking in Chrome, Edge, or Safari offline.
 */

export function downloadStandaloneHtml() {
  const standaloneContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChromaShift Lab - Photoshop RGB Additive Training (Offline Single HTML)</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111317;
      --panel: #181b22;
      --border: #282e3b;
      --text: #e2e8f0;
      --muted: #8e9bb0;
      --accent: #3b82f6;
      --red: #ef4444;
      --green: #22c55e;
      --blue: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 16px;
      line-height: 1.5;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .brand { font-size: 1.25rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: #1f2533; border: 1px solid var(--border); }
    .nav-tabs { display: flex; gap: 4px; background: #0c0e12; padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
    .tab-btn {
      background: none; border: none; color: var(--muted); padding: 8px 14px; font-size: 0.82rem; font-weight: 600;
      border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
    }
    .tab-btn.active { background: var(--panel); color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
    .container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
    .color-swatch {
      width: 100%; height: 160px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: flex-end; padding: 12px; font-weight: 600; font-size: 0.85rem;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }
    .slider-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .slider-row label { width: 70px; font-size: 0.85rem; font-weight: 600; }
    .slider-row input[type="range"] { flex: 1; accent-color: var(--accent); }
    .slider-row .num-box {
      width: 50px; background: #0e1014; border: 1px solid var(--border); color: #fff;
      padding: 4px 6px; border-radius: 4px; text-align: center; font-family: monospace; font-size: 0.85rem;
    }
    .btn {
      background: #252b38; border: 1px solid var(--border); color: #fff; padding: 8px 16px;
      font-size: 0.85rem; font-weight: 600; border-radius: 6px; cursor: pointer; transition: 0.15s;
    }
    .btn:hover { background: #323a4b; }
    .btn-primary { background: var(--accent); border-color: var(--accent); }
    .btn-primary:hover { background: #2563eb; }
    .curves-box { width: 100%; aspect-ratio: 1/1; background: #0c0e12; border: 1px solid var(--border); border-radius: 8px; position: relative; }
    .stat-pill { font-size: 0.78rem; font-family: monospace; background: #0c0e12; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        <span>ChromaShift Lab</span>
        <span class="badge">오프라인 단일 HTML 에디션</span>
      </div>
      <div class="nav-tabs">
        <button class="tab-btn active" onclick="switchTab('sculptor')">1. 채널 조각가</button>
        <button class="tab-btn" onclick="switchTab('neutralizer')">2. 커브 캐스트 중화</button>
        <button class="tab-btn" onclick="switchTab('blends')">3. 블렌드 모드 예측</button>
        <button class="tab-btn" onclick="switchTab('decoder')">4. 블렌드 디코더</button>
      </div>
      <div>
        <span class="stat-pill" id="streakLabel">Streak: 0 🔥</span>
      </div>
    </header>

    <!-- MODULE 1: SCULPTOR -->
    <div id="tab-sculptor" class="tab-content">
      <div class="grid-2">
        <div class="panel">
          <h3 style="margin-bottom: 12px; font-size: 1rem;">목표 색상 vs 내 색상</h3>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <div id="sculptorTargetPatch" class="color-swatch" style="background: rgb(255, 128, 0);">TARGET</div>
              <div style="margin-top: 6px; font-size: 0.78rem; color: var(--muted); text-align: center;" id="targetRgbText">RGB: 255, 128, 0</div>
            </div>
            <div style="flex: 1;">
              <div id="sculptorUserPatch" class="color-swatch" style="background: rgb(128, 128, 128);">YOUR COLOR</div>
              <div style="margin-top: 6px; font-size: 0.78rem; color: var(--muted); text-align: center;" id="userRgbText">RGB: 128, 128, 128</div>
            </div>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #0c0e12; border-radius: 8px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">인간 지각 색차 (CIE76 & Delta E)</div>
            <div id="sculptorDeltaFeedback" style="font-size: 0.85rem; font-family: monospace; color: #38bdf8;">ΔE = -- (판정 대기중)</div>
          </div>
        </div>

        <div class="panel">
          <h3 style="margin-bottom: 16px; font-size: 1rem;">RGB 채널 슬라이더</h3>
          <div class="slider-row">
            <label style="color: var(--red);">[R] Red</label>
            <input type="range" id="sculptorR" min="0" max="255" value="128" oninput="updateSculptor()">
            <span class="num-box" id="sculptorR_val">128</span>
          </div>
          <div class="slider-row">
            <label style="color: var(--green);">[G] Green</label>
            <input type="range" id="sculptorG" min="0" max="255" value="128" oninput="updateSculptor()">
            <span class="num-box" id="sculptorG_val">128</span>
          </div>
          <div class="slider-row">
            <label style="color: var(--blue);">[B] Blue</label>
            <input type="range" id="sculptorB" min="0" max="255" value="128" oninput="updateSculptor()">
            <span class="num-box" id="sculptorB_val">128</span>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-primary" onclick="submitSculptor()" style="flex: 1;">채점 및 피드백 (Enter)</button>
            <button class="btn" onclick="nextSculptorProblem()">다음 문제</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODULE 2: CURVES NEUTRALIZER -->
    <div id="tab-neutralizer" class="tab-content" style="display: none;">
      <div class="grid-2">
        <div class="panel">
          <h3 style="margin-bottom: 12px; font-size: 1rem;">Photoshop Curves 캐스트 중화</h3>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <div id="neutCastPatch" class="color-swatch" style="background: rgb(172, 130, 96);">BEFORE CAST</div>
              <div style="margin-top: 6px; font-size: 0.78rem; color: var(--muted); text-align: center;" id="neutCastText">R: 172, G: 130, B: 96</div>
            </div>
            <div style="flex: 1;">
              <div id="neutResultPatch" class="color-swatch" style="background: rgb(172, 130, 96);">AFTER CURVES</div>
              <div style="margin-top: 6px; font-size: 0.78rem; color: var(--muted); text-align: center;" id="neutResultText">R: 172, G: 130, B: 96</div>
            </div>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #0c0e12; border-radius: 8px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">중립 회색 균형도 (목표: R = G = B, Delta ≤ 3)</div>
            <div id="neutBalanceScore" style="font-size: 0.85rem; font-family: monospace; color: #f59e0b;">불균형 편차: Δ 76 (보정 필요)</div>
          </div>
        </div>

        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1rem;">Curves 채널별 미드톤 제어</h3>
            <div style="display: flex; gap: 6px;">
              <button class="btn" style="padding: 4px 8px; font-size: 0.75rem;" onclick="resetCurves()">커브 리셋</button>
              <button class="btn" style="padding: 4px 8px; font-size: 0.75rem;" onclick="nextCastProblem()">다음 캐스트</button>
            </div>
          </div>

          <div class="slider-row">
            <label style="color: var(--red);">Red 곡선</label>
            <input type="range" id="curveR" min="0" max="255" value="128" oninput="updateCurves()">
            <span class="num-box" id="curveR_val">128</span>
          </div>
          <div class="slider-row">
            <label style="color: var(--green);">Green 곡선</label>
            <input type="range" id="curveG" min="0" max="255" value="128" oninput="updateCurves()">
            <span class="num-box" id="curveG_val">128</span>
          </div>
          <div class="slider-row">
            <label style="color: var(--blue);">Blue 곡선</label>
            <input type="range" id="curveB" min="0" max="255" value="128" oninput="updateCurves()">
            <span class="num-box" id="curveB_val">128</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 10px; line-height: 1.6;">
            💡 <strong>Photoshop 팁:</strong> Red를 올리면 붉은 기가 추가되고, 내리면 보색인 Cyan이 나타납니다. Blue를 올리면 차가워지고, 내리면 Yellow가 올라옵니다.
          </div>
        </div>
      </div>
    </div>

    <!-- MODULE 3: BLEND PREDICTOR -->
    <div id="tab-blends" class="tab-content" style="display: none;">
      <div class="panel">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem;">레이어 블렌딩 모드 연산 예측</h3>
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px;">
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px;">Layer 1 (Base Color)</div>
            <div id="blendBasePatch" class="color-swatch" style="background: rgb(60, 100, 180); height: 100px;">Base</div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--muted);">+</div>
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px;">Layer 2 (Blend Color)</div>
            <div id="blendTopPatch" class="color-swatch" style="background: rgb(180, 80, 40); height: 100px;">Blend</div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--muted);">=</div>
          <div style="flex: 1.2; background: #0c0e12; border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 0.75rem; color: var(--muted);">지정 블렌딩 모드</div>
            <div id="targetBlendModeName" style="font-size: 1.1rem; font-weight: 700; color: #38bdf8; margin: 4px 0;">Screen</div>
            <div id="targetBlendFormula" style="font-size: 0.72rem; color: var(--muted); font-family: monospace;">255 - ((255-A)(255-B))/255</div>
          </div>
        </div>

        <h4 style="font-size: 0.9rem; margin-bottom: 12px; color: var(--muted);">합성 결과 색상을 고르세요:</h4>
        <div id="blendChoicesGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;"></div>
        <div id="blendExplanation" style="margin-top: 16px; padding: 12px; background: #0c0e12; border-radius: 8px; display: none;"></div>
      </div>
    </div>

    <!-- MODULE 4: DECODER -->
    <div id="tab-decoder" class="tab-content" style="display: none;">
      <div class="panel">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem;">역추적 블렌드 디코더 (Blend Mode Decoder)</h3>
        <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 16px;">하위 레이어(Base)와 상위 레이어가 합성된 결과(Result)를 보고, 어떤 블렌딩 모드가 적용되었는지 추리하세요.</p>
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px;">
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px;">Base Layer</div>
            <div id="decBasePatch" class="color-swatch" style="background: rgb(80, 120, 160); height: 120px;">BASE</div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px;">Top Blend Source</div>
            <div id="decBlendPatch" class="color-swatch" style="background: rgb(150, 90, 70); height: 120px;">BLEND</div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 4px;">Final Result</div>
            <div id="decResultPatch" class="color-swatch" style="background: rgb(190, 175, 195); height: 120px;">RESULT</div>
          </div>
        </div>

        <div id="decoderOptions" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
        <div id="decoderFeedback" style="margin-top: 16px; padding: 12px; background: #0c0e12; border-radius: 8px; display: none;"></div>
      </div>
    </div>
  </div>

  <script>
    // Pure Vanilla JS offline logic
    let currentStreak = parseInt(localStorage.getItem('chromashift_streak') || '0', 10);
    document.getElementById('streakLabel').innerText = 'Streak: ' + currentStreak + ' 🔥';

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('tab-' + tabId).style.display = 'block';
      event.target.classList.add('active');
    }

    // Color math
    function rgbToLab(r, g, b) {
      let rL = (r/255) <= 0.04045 ? (r/255)/12.92 : Math.pow(((r/255)+0.055)/1.055, 2.4);
      let gL = (g/255) <= 0.04045 ? (g/255)/12.92 : Math.pow(((g/255)+0.055)/1.055, 2.4);
      let bL = (b/255) <= 0.04045 ? (b/255)/12.92 : Math.pow(((b/255)+0.055)/1.055, 2.4);
      let x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) * 100 / 95.047;
      let y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) * 100 / 100.0;
      let z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) * 100 / 108.883;
      let fx = x > 0.008856 ? Math.cbrt(x) : 7.787*x + 16/116;
      let fy = y > 0.008856 ? Math.cbrt(y) : 7.787*y + 16/116;
      let fz = z > 0.008856 ? Math.cbrt(z) : 7.787*z + 16/116;
      return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
    }

    function deltaE76(c1, c2) {
      let l1 = rgbToLab(c1.r, c1.g, c1.b);
      let l2 = rgbToLab(c2.r, c2.g, c2.b);
      return Math.sqrt(Math.pow(l1[0]-l2[0],2) + Math.pow(l1[1]-l2[1],2) + Math.pow(l1[2]-l2[2],2));
    }

    // Module 1 logic
    let targetRgb = { r: 235, g: 120, b: 40 };
    function nextSculptorProblem() {
      targetRgb = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
      };
      document.getElementById('sculptorTargetPatch').style.background = \`rgb(\${targetRgb.r},\${targetRgb.g},\${targetRgb.b})\`;
      document.getElementById('targetRgbText').innerText = \`RGB: \${targetRgb.r}, \${targetRgb.g}, \${targetRgb.b}\`;
      document.getElementById('sculptorDeltaFeedback').innerText = 'ΔE = -- (판정 대기중)';
    }

    function updateSculptor() {
      let r = parseInt(document.getElementById('sculptorR').value, 10);
      let g = parseInt(document.getElementById('sculptorG').value, 10);
      let b = parseInt(document.getElementById('sculptorB').value, 10);
      document.getElementById('sculptorR_val').innerText = r;
      document.getElementById('sculptorG_val').innerText = g;
      document.getElementById('sculptorB_val').innerText = b;
      document.getElementById('sculptorUserPatch').style.background = \`rgb(\${r},\${g},\${b})\`;
      document.getElementById('userRgbText').innerText = \`RGB: \${r}, \${g}, \${b}\`;
    }

    function submitSculptor() {
      let r = parseInt(document.getElementById('sculptorR').value, 10);
      let g = parseInt(document.getElementById('sculptorG').value, 10);
      let b = parseInt(document.getElementById('sculptorB').value, 10);
      let dE = deltaE76(targetRgb, { r, g, b }).toFixed(1);
      let verdict = dE <= 3 ? '🎉 PERFECT (인간 지각 일치!)' : dE <= 8 ? '👍 GOOD (우수)' : '⚠️ 오차 큼 (보색 재조정 필요)';
      document.getElementById('sculptorDeltaFeedback').innerText = \`지각 색차 ΔE = \${dE} | \${verdict}\`;
      if (dE <= 8) {
        currentStreak++;
        localStorage.setItem('chromashift_streak', currentStreak);
        document.getElementById('streakLabel').innerText = 'Streak: ' + currentStreak + ' 🔥';
      }
    }

    // Module 2 logic
    let castRgb = { r: 172, g: 130, b: 96 };
    function updateCurves() {
      let dr = parseInt(document.getElementById('curveR').value, 10) - 128;
      let dg = parseInt(document.getElementById('curveG').value, 10) - 128;
      let db = parseInt(document.getElementById('curveB').value, 10) - 128;
      document.getElementById('curveR_val').innerText = dr > 0 ? '+' + dr : dr;
      document.getElementById('curveG_val').innerText = dg > 0 ? '+' + dg : dg;
      document.getElementById('curveB_val').innerText = db > 0 ? '+' + db : db;

      let resR = Math.max(0, Math.min(255, castRgb.r + dr));
      let resG = Math.max(0, Math.min(255, castRgb.g + dg));
      let resB = Math.max(0, Math.min(255, castRgb.b + db));
      document.getElementById('neutResultPatch').style.background = \`rgb(\${resR},\${resG},\${resB})\`;
      document.getElementById('neutResultText').innerText = \`R: \${resR}, G: \${resG}, B: \${resB}\`;

      let unbalance = Math.max(Math.abs(resR - resG), Math.abs(resG - resB), Math.abs(resB - resR));
      let status = unbalance <= 3 ? '✅ PERFECT NEUTRAL (중립 회색 달성!)' : unbalance <= 8 ? '👍 ACCEPTABLE (양호)' : \`Δ \${unbalance} (보색 불균형)\`;
      document.getElementById('neutBalanceScore').innerText = \`채널 불균형 편차: \${status}\`;
    }

    function resetCurves() {
      document.getElementById('curveR').value = 128;
      document.getElementById('curveG').value = 128;
      document.getElementById('curveB').value = 128;
      updateCurves();
    }

    function nextCastProblem() {
      castRgb = {
        r: 128 + Math.floor((Math.random() - 0.5) * 80),
        g: 128 + Math.floor((Math.random() - 0.5) * 80),
        b: 128 + Math.floor((Math.random() - 0.5) * 80)
      };
      document.getElementById('neutCastPatch').style.background = \`rgb(\${castRgb.r},\${castRgb.g},\${castRgb.b})\`;
      document.getElementById('neutCastText').innerText = \`R: \${castRgb.r}, G: \${castRgb.g}, B: \${castRgb.b}\`;
      resetCurves();
    }

    // Initialize module 3 quiz
    const modes = [
      { id: 'screen', name: 'Screen', calc: (a,b) => Math.round(255 - ((255-a)*(255-b))/255) },
      { id: 'linear_dodge', name: 'Linear Dodge (Add)', calc: (a,b) => Math.min(255, a+b) },
      { id: 'lighten', name: 'Lighten', calc: (a,b) => Math.max(a,b) },
      { id: 'multiply', name: 'Multiply', calc: (a,b) => Math.round((a*b)/255) }
    ];
    let curBase = { r: 60, g: 110, b: 170 };
    let curTop = { r: 180, g: 70, b: 30 };
    let curMode = modes[0];

    function initBlendQuiz() {
      curMode = modes[Math.floor(Math.random() * modes.length)];
      document.getElementById('targetBlendModeName').innerText = curMode.name;
      let grid = document.getElementById('blendChoicesGrid');
      grid.innerHTML = '';
      document.getElementById('blendExplanation').style.display = 'none';

      modes.forEach(m => {
        let r = m.calc(curBase.r, curTop.r);
        let g = m.calc(curBase.g, curTop.g);
        let b = m.calc(curBase.b, curTop.b);
        let btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.height = '90px';
        btn.style.background = \`rgb(\${r},\${g},\${b})\`;
        btn.style.border = '2px solid rgba(255,255,255,0.15)';
        btn.onclick = () => {
          let exp = document.getElementById('blendExplanation');
          exp.style.display = 'block';
          if (m.id === curMode.id) {
            exp.innerHTML = \`<span style="color:#22c55e; font-weight:700;">정답입니다! 🎉</span> \${curMode.name} 공식 적용: R=\${r}, G=\${g}, B=\${b} <button class="btn" style="margin-left:12px; padding:2px 8px;" onclick="initBlendQuiz()">다음 문제</button>\`;
          } else {
            exp.innerHTML = \`<span style="color:#ef4444; font-weight:700;">오답입니다.</span> 선택한 색상은 \${m.name}의 결과입니다.\`;
          }
        };
        grid.appendChild(btn);
      });
    }

    // Decoder
    function initDecoder() {
      let m = modes[Math.floor(Math.random() * 3)]; // Screen, Add, Lighten
      let r = m.calc(80, 150);
      let g = m.calc(120, 90);
      let b = m.calc(160, 70);
      document.getElementById('decResultPatch').style.background = \`rgb(\${r},\${g},\${b})\`;
      let opts = document.getElementById('decoderOptions');
      opts.innerHTML = '';
      modes.forEach(mode => {
        let b = document.createElement('button');
        b.className = 'btn';
        b.innerText = mode.name;
        b.onclick = () => {
          let fb = document.getElementById('decoderFeedback');
          fb.style.display = 'block';
          if (mode.id === m.id) {
            fb.innerHTML = \`<span style="color:#22c55e; font-weight:700;">정답입니다! 👏</span> 이 합성은 \${m.name} 연산입니다. <button class="btn" style="margin-left:12px;" onclick="initDecoder()">다음 문제</button>\`;
          } else {
            fb.innerHTML = \`<span style="color:#ef4444;">오답입니다. 다시 추리해 보세요.</span>\`;
          }
        };
        opts.appendChild(b);
      });
    }

    // First load setup
    nextSculptorProblem();
    updateCurves();
    initBlendQuiz();
    initDecoder();
  </script>
</body>
</html>`;

  const blob = new Blob([standaloneContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chromashift_photoshop_rgb_training_offline.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
