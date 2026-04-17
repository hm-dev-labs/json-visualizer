// ===== 状態管理 =====
let parsedData = null;
let currentTab = 'tree';
let sortCol = null;
let sortAsc = true;
let conditionLogic = 'AND'; // 'AND' | 'OR'
let conditionRows = [];    // 条件行の状態リスト
let conditionCounter = 0;  // 行IDのカウンター
let _analysisArr = null;   // 分析対象配列キャッシュ

// ===== エディタ初期化 =====
const textarea = document.getElementById('jsonInput');
const lineNumbers = document.getElementById('lineNumbers');

textarea.addEventListener('input', () => { updateLineNumbers(); parseAndRender(); updateStatus(); });
textarea.addEventListener('scroll', () => { lineNumbers.scrollTop = textarea.scrollTop; });
textarea.addEventListener('keydown', handleTabKey);

function updateLineNumbers() {
  const lines = textarea.value.split('\n');
  lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
}

function handleTabKey(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = textarea.selectionStart, en = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, s) + '  ' + textarea.value.substring(en);
    textarea.selectionStart = textarea.selectionEnd = s + 2;
    updateLineNumbers();
  }
}

// Ctrl+Shift+F でフォーマット
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); formatJSON(); }
});

// ===== ドラッグ＆ドロップ =====
const overlay = document.getElementById('dropOverlay');
document.addEventListener('dragover', e => { e.preventDefault(); overlay.classList.add('visible'); });
document.addEventListener('dragleave', e => { if (!e.relatedTarget) overlay.classList.remove('visible'); });
document.addEventListener('drop', e => {
  e.preventDefault(); overlay.classList.remove('visible');
  const file = e.dataTransfer.files[0];
  if (file) readFile(file);
});

function handleFileInput(e) {
  const f = e.target.files[0];
  if (f) {
    readFile(f);
  }
}
function readFile(file) {
  const r = new FileReader();
  r.onload = ev => {
    textarea.value = ev.target.result;
    updateLineNumbers();
    parseAndRender();
    updateStatus();
    showToast(`「${file.name}」を読み込みました`);
  };
  r.onerror = () => showToast('ファイルの読み込みに失敗しました', false);
  r.readAsText(file, 'UTF-8');
}

// ===== JSON パース & レンダー =====
function parseAndRender() {
  const raw = textarea.value.trim();
  if (!raw) { parsedData = null; setStatus('ready', ''); renderEmpty(); return; }
  try {
    parsedData = JSON.parse(raw);
    setStatus('valid', '有効なJSON');
    renderTree(parsedData);
    renderAnalysis(parsedData);
    renderTable(parsedData);
  } catch (err) {
    parsedData = null;
    setStatus('invalid', err.message);
    renderEmpty();
  }
}

function renderEmpty() {
  document.getElementById('treeContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>JSONを貼り付けるとツリー表示されます</p></div>';
  document.getElementById('analysisContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>JSON配列データを貼り付けると分析結果が表示されます</p></div>';
  document.getElementById('tableContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>JSON配列データを貼り付けるとテーブル表示されます</p></div>';
}

// ===== ステータスバー =====
function setStatus(state, msg) {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  dot.className = 'status-dot ' + (state === 'valid' ? 'valid' : state === 'invalid' ? 'invalid' : '');
  txt.textContent = state === 'ready' ? '準備完了' : msg;
}

function updateStatus() {
  const val = textarea.value;
  const lines = val.split('\n').length;
  const bytes = new Blob([val]).size;
  document.getElementById('statusLines').textContent = `${lines} 行`;
  document.getElementById('statusSize').textContent = bytes < 1024 ? `${bytes} B` : `${(bytes/1024).toFixed(1)} KB`;
}

// ===== ツールバー操作 =====
function formatJSON() {
  if (!parsedData) { showToast('JSONが無効です', false); return; }
  textarea.value = JSON.stringify(parsedData, null, 2);
  updateLineNumbers(); updateStatus();
  showToast('フォーマット完了');
}

function minifyJSON() {
  if (!parsedData) { showToast('JSONが無効です', false); return; }
  textarea.value = JSON.stringify(parsedData);
  updateLineNumbers(); updateStatus();
  showToast('ミニファイ完了');
}

function copyJSON() {
  navigator.clipboard.writeText(textarea.value).then(() => showToast('コピーしました'));
}

function clearEditor() {
  textarea.value = ''; parsedData = null;
  updateLineNumbers(); updateStatus(); renderEmpty();
  setStatus('ready', '');
}

function loadSample() {
  const sample = [
    { id: 1, name: "田中 太郎", age: 28, email: "tanaka@example.com", status: "active", score: 92.5, verified: true, address: null, tags: ["admin","user"], created_at: "2024-01-15" },
    { id: 2, name: "鈴木 花子", age: 34, email: "suzuki@example.com", status: "inactive", score: 78.0, verified: false, address: { city: "東京", zip: "100-0001" }, tags: ["user"], created_at: "2024-02-20" },
    { id: 3, name: "山田 次郎", age: null, email: null, status: "active", score: 45.2, verified: true, address: null, tags: [], created_at: "2024-03-05" },
    { id: 4, name: "佐藤 美咲", age: 22, email: "sato@example.com", status: "pending", score: 88.1, verified: false, address: { city: "大阪", zip: "530-0001" }, tags: ["user","vip"], created_at: "2024-03-12" },
    { id: 5, name: "伊藤 健一", age: 45, email: "ito@example.com", status: "active", score: null, verified: true, address: { city: "名古屋", zip: "460-0001" }, tags: ["admin"], created_at: "2024-04-01" },
    { id: 6, name: "渡辺 由美", age: 31, email: null, status: "inactive", score: 67.3, verified: null, address: null, tags: ["user"], created_at: "2024-04-10" }
  ];
  textarea.value = JSON.stringify(sample, null, 2);
  updateLineNumbers(); parseAndRender(); updateStatus();
  showToast('サンプルデータを読み込みました');
}

// ===== タブ切り替え =====
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === tab + 'Pane'));
}

// ===== ツリービュー =====
function renderTree(data) {
  const container = document.getElementById('treeContainer');
  container.innerHTML = '';
  const node = buildTreeNode(data, null, 0);
  container.appendChild(node);
  container.classList.add('fade-in');
}

function buildTreeNode(val, key, depth) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-node';
  wrapper.style.setProperty('--depth', depth);

  const line = document.createElement('div');
  line.className = 'tree-line';

  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle';

  const keySpan = key !== null ? (() => { const s = document.createElement('span'); s.className = 'tree-key'; s.textContent = typeof key === 'number' ? `[${key}]` : `"${key}"`; return s; })() : null;
  const colon = key !== null ? (() => { const s = document.createElement('span'); s.className = 'tree-colon'; s.textContent = ':'; return s; })() : null;

  if (val === null) {
    toggle.classList.add('hidden');
    line.appendChild(toggle);
    if (keySpan) { line.appendChild(keySpan); line.appendChild(colon); }
    const v = document.createElement('span'); v.className = 'tree-value null'; v.textContent = 'null';
    line.appendChild(v);
  } else if (Array.isArray(val)) {
    toggle.textContent = '▶'; toggle.classList.add('open');
    const bracket = document.createElement('span'); bracket.className = 'tree-bracket'; bracket.textContent = '[';
    const count = document.createElement('span'); count.className = 'tree-count'; count.textContent = `${val.length} items`;
    const children = document.createElement('div'); children.className = 'tree-children';
    toggle.onclick = () => { toggle.classList.toggle('open'); children.classList.toggle('collapsed'); };
    line.appendChild(toggle);
    if (keySpan) { line.appendChild(keySpan); line.appendChild(colon); }
    line.appendChild(bracket); line.appendChild(count);
    val.forEach((item, i) => children.appendChild(buildTreeNode(item, i, depth + 1)));
    const closeLine = document.createElement('div'); closeLine.className = 'tree-line';
    closeLine.style.setProperty('--depth', depth);
    const closeB = document.createElement('span'); closeB.className = 'tree-bracket'; closeB.textContent = ']';
    const ph = document.createElement('span'); ph.className = 'tree-toggle hidden';
    closeLine.appendChild(ph); closeLine.appendChild(closeB);
    wrapper.appendChild(line); wrapper.appendChild(children); wrapper.appendChild(closeLine);
    return wrapper;
  } else if (typeof val === 'object') {
    const keys = Object.keys(val);
    toggle.textContent = '▶'; toggle.classList.add('open');
    const bracket = document.createElement('span'); bracket.className = 'tree-bracket'; bracket.textContent = '{';
    const count = document.createElement('span'); count.className = 'tree-count'; count.textContent = `${keys.length} keys`;
    const children = document.createElement('div'); children.className = 'tree-children';
    toggle.onclick = () => { toggle.classList.toggle('open'); children.classList.toggle('collapsed'); };
    line.appendChild(toggle);
    if (keySpan) { line.appendChild(keySpan); line.appendChild(colon); }
    line.appendChild(bracket); line.appendChild(count);
    keys.forEach(k => children.appendChild(buildTreeNode(val[k], k, depth + 1)));
    const closeLine = document.createElement('div'); closeLine.className = 'tree-line';
    closeLine.style.setProperty('--depth', depth);
    const closeB = document.createElement('span'); closeB.className = 'tree-bracket'; closeB.textContent = '}';
    const ph = document.createElement('span'); ph.className = 'tree-toggle hidden';
    closeLine.appendChild(ph); closeLine.appendChild(closeB);
    wrapper.appendChild(line); wrapper.appendChild(children); wrapper.appendChild(closeLine);
    return wrapper;
  } else {
    toggle.classList.add('hidden');
    line.appendChild(toggle);
    if (keySpan) { line.appendChild(keySpan); line.appendChild(colon); }
    const v = document.createElement('span');
    v.className = `tree-value ${typeof val}`;
    v.textContent = typeof val === 'string' ? `"${val}"` : String(val);
    line.appendChild(v);
  }
  wrapper.appendChild(line);
  return wrapper;
}

function expandAll() {
  document.querySelectorAll('.tree-toggle:not(.hidden)').forEach(t => { t.classList.add('open'); });
  document.querySelectorAll('.tree-children').forEach(c => { c.classList.remove('collapsed'); });
}
function collapseAll() {
  document.querySelectorAll('.tree-toggle:not(.hidden)').forEach(t => { t.classList.remove('open'); });
  document.querySelectorAll('.tree-children').forEach(c => { c.classList.add('collapsed'); });
}

function searchTree(q) {
  document.querySelectorAll('.tree-node').forEach(node => {
    if (!q) { node.classList.remove('search-match', 'search-hidden'); return; }
    const text = node.querySelector('.tree-line') ? node.querySelector('.tree-line').textContent.toLowerCase() : '';
    if (text.includes(q.toLowerCase())) { node.classList.add('search-match'); node.classList.remove('search-hidden'); }
    else { node.classList.remove('search-match'); node.classList.add('search-hidden'); }
  });
}

// ===== 配列自動検出 =====
// ルートがオブジェクトの場合、その中に含まれる最大の配列を返す
function detectAnalysisTarget(data) {
  if (Array.isArray(data)) return { arr: data, path: null };
  if (typeof data !== 'object' || !data) return { arr: null, path: null };
  // オブジェクトの値を再帰的に探索して最大の配列を見つける
  let best = { arr: null, path: null, len: 0 };
  function search(obj, prefix) {
    if (typeof obj !== 'object' || !obj) return;
    if (Array.isArray(obj)) {
      const hasObjects = obj.some(v => typeof v === 'object' && v !== null && !Array.isArray(v));
      if (hasObjects && obj.length > best.len) best = { arr: obj, path: prefix, len: obj.length };
      return;
    }
    Object.keys(obj).forEach(k => search(obj[k], prefix ? `${prefix}.${k}` : k));
  }
  search(data, '');
  return best;
}

let currentBaseArr = null;
let currentBaseStats = null;

function renderAnalysis(data) {
  const container = document.getElementById('analysisContainer');
  const { arr, path: detectedPath } = detectAnalysisTarget(data);
  if (!arr || arr.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>分析可能な配列データが見つかりません</p></div>'; return; }

  currentBaseArr = arr;
  currentBaseStats = analyzeData(arr);

  container.innerHTML = '';
  container.classList.add('fade-in');

  // ネスト配列を使用した場合のバナー
  if (detectedPath) {
    const banner = el('div', 'info-banner');
    banner.innerHTML = `ℹ️ <strong>${detectedPath}</strong> 内の配列 (${arr.length} 件) を分析対象として使用しています`;
    container.appendChild(banner);
  }

  // 条件チェッカー (再描画しない領域)
  _analysisArr = arr;
  container.appendChild(buildConditionCheckerSection(currentBaseStats, arr));

  // 結果描画用コンテナ (絞り込みで再描画される領域)
  const dynamicContainer = el('div', 'analysis-dynamic-results');
  dynamicContainer.id = 'analysisDynamicResults';
  dynamicContainer.style.display = 'flex';
  dynamicContainer.style.flexDirection = 'column';
  dynamicContainer.style.gap = '20px';
  dynamicContainer.style.marginTop = '20px';
  container.appendChild(dynamicContainer);

  // 初期状態は全件で描画
  renderDynamicAnalysisResults(arr);
}

function renderDynamicAnalysisResults(filteredArr) {
  const container = document.getElementById('analysisDynamicResults');
  if (!container) return;
  container.innerHTML = '';

  if (!filteredArr || filteredArr.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 40px 0;"><div class="empty-icon">📭</div><p>条件に一致するデータがありません</p></div>';
    return;
  }

  const stats = analyzeData(filteredArr);

  // 概要カード
  const overviewGrid = el('div', 'overview-grid');
  const overviewData = [
    { v: filteredArr.length, l: '総レコード数' },
    { v: stats.fields.length, l: 'フィールド数' },
    { v: stats.totalNullCount, l: 'Null総数' },
    { v: stats.enumFields.length, l: 'Enum候補フィールド' },
    { v: stats.numericFields.length, l: '数値フィールド' },
    { v: stats.nestedFields.length, l: 'ネストフィールド' }
  ];
  overviewData.forEach(d => {
    const card = el('div', 'overview-card');
    card.innerHTML = `<div class="card-value">${d.v}</div><div class="card-label">${d.l}</div>`;
    overviewGrid.appendChild(card);
  });
  container.appendChild(overviewGrid);

  // Null率
  container.appendChild(buildNullSection(stats, filteredArr.length));
  // Enum分析
  if (stats.enumFields.length > 0) container.appendChild(buildEnumSection(stats));
  // 数値統計
  if (stats.numericFields.length > 0) container.appendChild(buildNumericSection(stats));
  // フィールド一覧
  container.appendChild(buildFieldSection(stats, filteredArr.length));
}

function analyzeData(arr) {
  const fieldMap = {};
  arr.forEach(row => {
    if (typeof row !== 'object' || !row) return;
    flattenKeys(row, '', fieldMap, row);
  });

  const fields = Object.keys(fieldMap).map(path => {
    const values = fieldMap[path];
    const nullCount = values.filter(v => v === null || v === undefined).length;
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const types = [...new Set(nonNull.map(v => Array.isArray(v) ? 'array' : typeof v))];
    const type = types.length === 0 ? 'null' : types.length === 1 ? types[0] : 'mixed';
    const strValues = nonNull.filter(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
    const uniqueVals = [...new Set(strValues.map(String))];
    const isEnum = uniqueVals.length > 0 && uniqueVals.length <= 20 && uniqueVals.length < nonNull.length * 0.7;
    const numVals = nonNull.filter(v => typeof v === 'number');
    return { path, values, nullCount, nonNull, type, uniqueVals, isEnum, numVals };
  });

  const totalNullCount = fields.reduce((a, f) => a + f.nullCount, 0);
  const enumFields = fields.filter(f => f.isEnum);
  const numericFields = fields.filter(f => f.type === 'number' && f.numVals.length > 0);
  const nestedFields = fields.filter(f => f.type === 'object' || f.type === 'array');
  return { fields, totalNullCount, enumFields, numericFields, nestedFields };
}

function flattenKeys(obj, prefix, map) {
  if (typeof obj !== 'object' || obj === null) return;
  if (Array.isArray(obj)) {
    // 配列の各要素を再帰的に展開
    obj.forEach(item => flattenKeys(item, prefix, map));
    return;
  }
  Object.keys(obj).forEach(k => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (!map[path]) map[path] = [];
    const val = obj[k];
    if (Array.isArray(val)) {
      // 配列フィールド: プリミティブ要素はそのまま収集、オブジェクト要素は再帰展開
      const primitives = val.filter(v => typeof v !== 'object' || v === null);
      const objects = val.filter(v => typeof v === 'object' && v !== null && !Array.isArray(v));
      if (primitives.length > 0) primitives.forEach(p => map[path].push(p));
      else map[path].push(val); // 配列自体を値として記録
      objects.forEach(item => flattenKeys(item, path, map));
    } else {
      map[path].push(val);
      if (typeof val === 'object' && val !== null) {
        flattenKeys(val, path, map);
      }
    }
  });
}

function buildNullSection(stats, total) {
  const sec = buildSection('🔴 Null率分析', '各フィールドのNull/欠損率');
  const body = sec.querySelector('.analysis-section-body');
  const sorted = [...stats.fields].sort((a, b) => b.nullCount - a.nullCount);
  sorted.forEach(f => {
    const rate = total > 0 ? (f.nullCount / total * 100) : 0;
    const rateClass = rate >= 50 ? 'high' : rate >= 10 ? 'medium' : rate > 0 ? 'low' : 'zero';
    const row = el('div', 'bar-row');
    const lbl = el('div', 'bar-label'); lbl.textContent = f.path; lbl.title = f.path;
    const track = el('div', 'bar-track');
    const fill = el('div', 'bar-fill null-bar');
    fill.style.width = '0%';
    setTimeout(() => fill.style.width = rate + '%', 50);
    track.appendChild(fill);
    const badge = el('span', `null-rate-indicator ${rateClass}`);
    badge.textContent = rate === 0 ? '0%' : `${rate.toFixed(1)}% (${f.nullCount})`;
    row.appendChild(lbl); row.appendChild(track); row.appendChild(badge);
    body.appendChild(row);
  });
  return sec;
}

function buildEnumSection(stats) {
  const sec = buildSection('🎯 Enum分析', 'カーディナリティが低いフィールドの値分布');
  const body = sec.querySelector('.analysis-section-body');
  stats.enumFields.forEach(f => {
    const group = el('div', 'enum-field-group');
    const title = el('div', 'enum-field-title');
    title.innerHTML = `<span>${f.path}</span><span class="enum-field-count">${f.uniqueVals.length} 種類</span>`;
    group.appendChild(title);
    const valCounts = {};
    f.nonNull.forEach(v => { const s = String(v); valCounts[s] = (valCounts[s] || 0) + 1; });
    const sorted = Object.entries(valCounts).sort((a, b) => b[1] - a[1]);
    const maxC = sorted[0]?.[1] || 1;
    sorted.forEach(([val, count]) => {
      const row = el('div', 'bar-row');
      const lbl = el('div', 'bar-label'); lbl.textContent = val; lbl.title = val;
      const track = el('div', 'bar-track');
      const fill = el('div', 'bar-fill enum-bar');
      fill.style.width = '0%';
      setTimeout(() => fill.style.width = (count / maxC * 100) + '%', 80);
      track.appendChild(fill);
      const valDiv = el('div', 'bar-value'); valDiv.textContent = count;
      row.appendChild(lbl); row.appendChild(track); row.appendChild(valDiv);
      group.appendChild(row);
    });
    body.appendChild(group);
  });
  return sec;
}

function buildNumericSection(stats) {
  const sec = buildSection('📈 数値統計', '数値フィールドの基本統計量');
  const body = sec.querySelector('.analysis-section-body');
  const table = el('table', 'analysis-table');
  table.innerHTML = `<thead><tr><th>フィールド</th><th>件数</th><th>平均</th><th>最小</th><th>最大</th><th>合計</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  stats.numericFields.forEach(f => {
    const nums = f.numVals;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const min = Math.min(...nums), max = Math.max(...nums), sum = nums.reduce((a, b) => a + b, 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="field-path mono">${f.path}</td><td>${nums.length}</td><td>${avg.toFixed(2)}</td><td>${min}</td><td>${max}</td><td>${sum.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  body.appendChild(table);
  return sec;
}

function buildFieldSection(stats, total) {
  const sec = buildSection('📋 フィールド一覧', 'すべてのフィールドの型・存在率サマリー（ネスト含む）');
  const body = sec.querySelector('.analysis-section-body');
  const table = el('table', 'analysis-table');
  table.innerHTML = `<thead><tr><th>フィールドパス</th><th>型</th><th>存在率</th><th>Null数</th><th>ユニーク数</th><th>サンプル値</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  // すべてのフィールドを表示（ネストを示すインデント付き）
  stats.fields.forEach(f => {
    const depth = (f.path.match(/\./g) || []).length;
    const presence = total > 0 ? ((f.values.length - f.nullCount) / total * 100).toFixed(1) : 0;
    const sample = f.nonNull.slice(0, 3).map(v => {
      const s = JSON.stringify(v);
      return `<span class="sample-value" title="${s}">${s.length > 20 ? s.slice(0, 20) + '…' : s}</span>`;
    }).join('');
    const indent = depth > 0 ? `<span style="color:var(--text-muted);margin-right:${depth*10}px">${'└─'.padStart(depth*2,'　')}</span>` : '';
    const shortName = depth > 0 ? f.path.split('.').pop() : f.path;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="field-path mono" title="${f.path}">${indent}<span style="color:var(--purple)">${shortName}</span>${depth > 0 ? `<span style="color:var(--text-muted);font-size:0.65rem"> (${f.path})</span>` : ''}</td><td><span class="type-badge ${f.type}">${f.type}</span></td><td>${presence}%</td><td>${f.nullCount}</td><td>${f.uniqueVals.length}</td><td>${sample}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  body.appendChild(table);
  return sec;
}

function buildSection(title, subtitle) {
  const sec = el('div', 'analysis-section');
  const header = el('div', 'analysis-section-header');
  header.innerHTML = `<span>${title}</span><span style="color:var(--text-muted);font-weight:400;font-size:0.75rem">${subtitle}</span>`;
  const body = el('div', 'analysis-section-body');
  sec.appendChild(header); sec.appendChild(body);
  return sec;
}

// ===== 条件チェッカー =====

const OPERATORS_STRING = [
  { value: 'contains',      label: '含む' },
  { value: 'not_contains',  label: '含まない' },
  { value: 'starts_with',   label: 'から始まる' },
  { value: 'ends_with',     label: 'で終わる' },
  { value: 'equals',        label: '完全一致' },
  { value: 'not_equals',    label: '一致しない' },
  { value: 'is_empty',      label: '空文字列' },
  { value: 'regex',         label: '正規表現' },
  { value: 'is_null',       label: 'null / 未定義' },
  { value: 'is_not_null',   label: 'not null' },
  { value: 'in_list',       label: 'リスト内に含まれる' },
];

const OPERATORS_NUMBER = [
  { value: 'num_eq',        label: '= (等しい)' },
  { value: 'num_neq',       label: '≠ (等しくない)' },
  { value: 'num_gt',        label: '> (より大きい)' },
  { value: 'num_gte',       label: '≥ (以上)' },
  { value: 'num_lt',        label: '< (より小さい)' },
  { value: 'num_lte',       label: '≤ (以下)' },
  { value: 'num_between',   label: '範囲内 (between)' },
  { value: 'is_null',       label: 'null / 未定義' },
  { value: 'is_not_null',   label: 'not null' },
  { value: 'in_list',       label: 'リスト内に含まれる' },
];

const OPERATORS_BOOLEAN = [
  { value: 'equals',        label: '= true' },
  { value: 'not_equals',    label: '= false' },
  { value: 'is_null',       label: 'null / 未定義' },
  { value: 'is_not_null',   label: 'not null' },
];

const OPERATORS_COMMON = [
  { value: 'is_null',       label: 'null / 未定義' },
  { value: 'is_not_null',   label: 'not null' },
];

function getOperatorsForType(type) {
  if (type === 'number') return OPERATORS_NUMBER;
  if (type === 'boolean') return OPERATORS_BOOLEAN;
  if (type === 'string') return OPERATORS_STRING;
  return OPERATORS_COMMON;
}

function needsInput(op) {
  return !['is_null', 'is_not_null', 'is_empty', 'equals', 'not_equals'].includes(op)
    && op !== '';
}
function isBooleanOp(op) { return ['equals', 'not_equals'].includes(op); }
function isBetweenOp(op) { return op === 'num_between'; }
function isNoInputOp(op) { return ['is_null', 'is_not_null', 'is_empty'].includes(op); }

function getFieldType(stats, fieldPath) {
  const f = stats.fields.find(f => f.path === fieldPath);
  return f ? f.type : 'string';
}

function buildConditionCheckerSection(stats, arr) {
  const sec = el('div', 'analysis-section');
  const header = el('div', 'analysis-section-header');
  header.innerHTML = `<span>🔎 条件チェッカー</span><span style="color:var(--text-muted);font-weight:400;font-size:0.75rem">カラムと条件を指定してレコード数を確認</span>`;
  sec.appendChild(header);

  const body = el('div', 'analysis-section-body');

  // ツールバー（AND/OR + 追加ボタン）
  const toolbar = el('div', 'condition-checker-toolbar');

  const logicToggle = el('div', 'condition-logic-toggle');
  ['AND', 'OR'].forEach(l => {
    const btn = el('button', 'logic-btn' + (conditionLogic === l ? ' active' : ''));
    btn.textContent = l;
    btn.onclick = () => {
      conditionLogic = l;
      logicToggle.querySelectorAll('.logic-btn').forEach(b => b.classList.toggle('active', b.textContent === l));
      runAllConditionChecks(arr, stats);
    };
    logicToggle.appendChild(btn);
  });

  const addBtn = el('button', 'btn-add-condition');
  addBtn.innerHTML = '＋ 条件を追加';
  addBtn.onclick = () => addConditionRow(conditionList, stats, arr);

  toolbar.appendChild(logicToggle);
  toolbar.appendChild(addBtn);
  body.appendChild(toolbar);

  // 結合結果バナー
  const combinedBanner = el('div', 'combined-result-banner');
  combinedBanner.id = 'conditionCombinedBanner';
  combinedBanner.style.display = 'none';
  body.appendChild(combinedBanner);

  // 条件リスト
  const conditionList = el('div', 'condition-list');
  conditionList.id = 'conditionList';
  body.appendChild(conditionList);

  sec.appendChild(body);

  // 既存の条件行を再描画
  conditionRows.forEach(state => {
    const row = createConditionRowEl(state, stats, arr);
    conditionList.appendChild(row);
  });
  if (conditionRows.length === 0) {
    // 最初の1行を追加
    addConditionRow(conditionList, stats, arr);
  }

  return sec;
}

function addConditionRow(listEl, stats, arr) {
  const id = ++conditionCounter;
  const state = { id, field: stats.fields[0]?.path || '', operator: '', value: '', value2: '', result: null };
  conditionRows.push(state);
  const rowEl = createConditionRowEl(state, stats, arr);
  listEl.appendChild(rowEl);
}

function createConditionRowEl(state, stats, arr) {
  const row = el('div', 'condition-row' + (state.result !== null ? ' has-result' : ''));
  row.dataset.condId = state.id;

  // フィールド選択
  const fieldSel = el('select', 'condition-select');
  stats.fields.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.path;
    opt.textContent = f.path;
    if (f.path === state.field) opt.selected = true;
    fieldSel.appendChild(opt);
  });

  // 演算子選択
  const opSel = el('select', 'condition-select');

  // 値入力エリア
  const inputWrap = el('div', 'condition-input-wrap');

  // フィールド変更 → 演算子リスト更新
  function updateOperators() {
    const type = getFieldType(stats, fieldSel.value);
    const ops = getOperatorsForType(type);
    opSel.innerHTML = '';
    ops.forEach(op => {
      const opt = document.createElement('option');
      opt.value = op.value;
      opt.textContent = op.label;
      if (op.value === state.operator) opt.selected = true;
      opSel.appendChild(opt);
    });
    if (!state.operator) opSel.selectedIndex = 0;
    updateInputArea();
  }

  // 演算子変更 → 入力エリア更新
  function updateInputArea() {
    inputWrap.innerHTML = '';
    const op = opSel.value;
    const type = getFieldType(stats, fieldSel.value);

    if (isNoInputOp(op)) {
      // 入力不要
      const ph = el('span', '');
      ph.style.cssText = 'color:var(--text-muted);font-size:0.75rem;padding:0 4px;';
      ph.textContent = '（入力不要）';
      inputWrap.appendChild(ph);
    } else if (isBooleanOp(op) && type === 'boolean') {
      const sel = el('select', 'condition-select condition-input');
      sel.innerHTML = '<option value="true">true</option><option value="false">false</option>';
      sel.value = state.value || 'true';
      sel.oninput = () => { state.value = sel.value; };
      inputWrap.appendChild(sel);
    } else if (isBetweenOp(op)) {
      const inp1 = el('input', 'condition-input');
      inp1.type = 'number'; inp1.placeholder = '最小値'; inp1.value = state.value || '';
      inp1.oninput = () => { state.value = inp1.value; };
      const sep = el('span', 'between-sep'); sep.textContent = '〜';
      const inp2 = el('input', 'condition-input');
      inp2.type = 'number'; inp2.placeholder = '最大値'; inp2.value = state.value2 || '';
      inp2.oninput = () => { state.value2 = inp2.value; };
      inputWrap.appendChild(inp1); inputWrap.appendChild(sep); inputWrap.appendChild(inp2);
    } else {
      const isNum = ['num_eq','num_neq','num_gt','num_gte','num_lt','num_lte'].includes(op);
      const inp = el('input', 'condition-input');
      inp.type = isNum ? 'number' : 'text';
      inp.placeholder = op === 'in_list' ? '値1, 値2, 値3' : op === 'regex' ? '正規表現パターン' : '値を入力';
      inp.value = state.value || '';
      inp.oninput = () => { state.value = inp.value; };
      inputWrap.appendChild(inp);
    }
  }

  fieldSel.onchange = () => {
    state.field = fieldSel.value;
    state.operator = '';
    state.value = '';
    state.value2 = '';
    updateOperators();
  };
  opSel.onchange = () => {
    state.operator = opSel.value;
    state.value = '';
    state.value2 = '';
    updateInputArea();
  };

  updateOperators();

  // 実行ボタン
  const runBtn = el('button', 'btn-run-check');
  runBtn.textContent = '実行';
  runBtn.onclick = () => {
    state.field = fieldSel.value;
    state.operator = opSel.value;
    runSingleConditionCheck(state, arr, row);
    runAllConditionChecks(arr, stats);
  };

  // 削除ボタン
  const delBtn = el('button', 'btn-remove-condition');
  delBtn.innerHTML = '✕';
  delBtn.title = '条件を削除';
  delBtn.onclick = () => {
    conditionRows = conditionRows.filter(r => r.id !== state.id);
    row.remove();
    runAllConditionChecks(arr, stats);
  };

  row.appendChild(fieldSel);
  row.appendChild(opSel);
  row.appendChild(inputWrap);
  row.appendChild(runBtn);
  row.appendChild(delBtn);

  // 既存の結果を復元
  if (state.result !== null) {
    appendResultToRow(row, state, arr.length);
  }

  return row;
}

function runSingleConditionCheck(state, arr, rowEl) {
  const { field, operator } = state;
  if (!field || !operator) return;

  const matched = arr.filter(record => {
    const val = getNestedValue(record, field);
    return evaluateCondition(val, operator, state.value, state.value2);
  });

  state.result = matched;
  state.matchedIndices = arr.map((r, i) => matched.includes(r) ? i : -1).filter(i => i >= 0);

  rowEl.classList.add('has-result');
  // 既存の結果行を削除して再描画
  const old = rowEl.querySelector('.condition-result');
  if (old) old.remove();
  appendResultToRow(rowEl, state, arr.length);
}

function appendResultToRow(rowEl, state, total) {
  const matched = state.result;
  if (!matched) return;
  const count = matched.length;
  const pct = total > 0 ? (count / total * 100) : 0;

  const resultDiv = el('div', 'condition-result');

  const barWrap = el('div', 'condition-result-bar-wrap');
  const bar = el('div', 'condition-result-bar');
  bar.style.width = '0%';
  setTimeout(() => bar.style.width = pct + '%', 50);
  barWrap.appendChild(bar);

  const txt = el('span', 'condition-result-text');
  txt.innerHTML = `<strong>${count}</strong> / ${total} 件 &nbsp;(<strong>${pct.toFixed(1)}%</strong>)`;

  resultDiv.appendChild(barWrap);
  resultDiv.appendChild(txt);
  rowEl.appendChild(resultDiv);
}

function runAllConditionChecks(arr, stats) {
  const banner = document.getElementById('conditionCombinedBanner');
  if (!banner) return;

  const validResults = conditionRows.filter(r => r.result !== null);
  
  let combined = arr;
  if (validResults.length > 0) {
    if (conditionLogic === 'AND') {
      combined = arr.filter(record =>
        validResults.every(r => r.result && r.result.includes(record))
      );
    } else {
      const union = new Set();
      validResults.forEach(r => r.result && r.result.forEach(rec => union.add(rec)));
      combined = [...union];
    }
  }

  if (validResults.length >= 2) {
    const count = combined.length;
    const pct = arr.length > 0 ? (count / arr.length * 100) : 0;
    banner.style.display = 'flex';
    banner.innerHTML = `
      <span>🔗 ${conditionLogic} 結合結果：<strong>${count}</strong> / ${arr.length} 件 &nbsp;(<strong>${pct.toFixed(1)}%</strong>)</span>
    `;
  } else {
    banner.style.display = 'none';
  }

  // 絞り込み結果を分析コンテナとテーブルに反映
  renderDynamicAnalysisResults(combined);
  updateFilteredTable(combined, validResults.length > 0);
}

function evaluateCondition(val, operator, checkVal, checkVal2) {
  const isNullVal = val === null || val === undefined;
  switch (operator) {
    case 'is_null':       return isNullVal;
    case 'is_not_null':   return !isNullVal;
    case 'is_empty':      return !isNullVal && String(val) === '';
    case 'contains':      return !isNullVal && String(val).toLowerCase().includes(String(checkVal).toLowerCase());
    case 'not_contains':  return isNullVal || !String(val).toLowerCase().includes(String(checkVal).toLowerCase());
    case 'starts_with':   return !isNullVal && String(val).toLowerCase().startsWith(String(checkVal).toLowerCase());
    case 'ends_with':     return !isNullVal && String(val).toLowerCase().endsWith(String(checkVal).toLowerCase());
    case 'equals':        return !isNullVal && String(val).toLowerCase() === String(checkVal).toLowerCase();
    case 'not_equals':    return isNullVal || String(val).toLowerCase() !== String(checkVal).toLowerCase();
    case 'regex': {
      if (isNullVal) return false;
      try { return new RegExp(checkVal).test(String(val)); } catch { return false; }
    }
    case 'in_list': {
      if (isNullVal) return false;
      const list = String(checkVal).split(',').map(s => s.trim().toLowerCase());
      return list.includes(String(val).toLowerCase());
    }
    case 'num_eq':        return !isNullVal && Number(val) === Number(checkVal);
    case 'num_neq':       return !isNullVal && Number(val) !== Number(checkVal);
    case 'num_gt':        return !isNullVal && Number(val) >  Number(checkVal);
    case 'num_gte':       return !isNullVal && Number(val) >= Number(checkVal);
    case 'num_lt':        return !isNullVal && Number(val) <  Number(checkVal);
    case 'num_lte':       return !isNullVal && Number(val) <= Number(checkVal);
    case 'num_between':   return !isNullVal && Number(val) >= Number(checkVal) && Number(val) <= Number(checkVal2);
    default: return false;
  }
}

function getNestedValue(obj, path) {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

function updateFilteredTable(records, isFiltered) {
  renderTable(records);
  if (isFiltered) {
    const count = records.length;
    const container = document.getElementById('tableContainer');
    const banner = el('div', 'info-banner');
    banner.innerHTML = `🔎 条件フィルター結果: <strong>${count} 件</strong> を表示中`;
    container.insertBefore(banner, container.firstChild);
  }
}

// ===== テーブルビュー =====
function renderTable(data) {
  const container = document.getElementById('tableContainer');
  const { arr, path: detectedPath } = detectAnalysisTarget(data);
  if (!arr || arr.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>配列データが見つかりません</p></div>'; return; }

  const cols = [...new Set(arr.flatMap(r => typeof r === 'object' && r ? Object.keys(r) : []))];
  container.innerHTML = '';

  const wrapper = el('div', 'table-wrapper');
  const table = el('table', 'data-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const numTh = document.createElement('th'); numTh.textContent = '#'; numTh.className = 'row-number';
  headerRow.appendChild(numTh);
  cols.forEach((col, ci) => {
    const th = document.createElement('th');
    th.innerHTML = `${col} <span class="sort-arrow">⇅</span>`;
    th.onclick = () => sortTable(arr, cols, col, container);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  arr.forEach((row, ri) => {
    const tr = document.createElement('tr');
    const numTd = document.createElement('td'); numTd.className = 'row-number'; numTd.textContent = ri + 1;
    tr.appendChild(numTd);
    cols.forEach(col => {
      const td = document.createElement('td');
      const val = typeof row === 'object' && row ? row[col] : undefined;
      if (val === null || val === undefined) { td.className = 'null-cell'; td.textContent = 'null'; }
      else if (typeof val === 'boolean') { td.className = 'bool-cell'; td.textContent = String(val); }
      else if (typeof val === 'number') { td.className = 'num-cell'; td.textContent = val; }
      else if (typeof val === 'object') { td.className = 'obj-cell'; td.textContent = JSON.stringify(val); }
      else { td.className = 'str-cell'; td.textContent = val; }
      td.title = td.textContent;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  container.classList.add('fade-in');
}

function sortTable(arr, cols, col, container) {
  if (sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
  const sorted = [...arr].sort((a, b) => {
    const av = a?.[col], bv = b?.[col];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });
  renderTable(sorted);
}

// ===== ユーティリティ =====
function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

function showToast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = 'toast' + (ok ? ' success' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
}

// ===== リサイザー =====
const resizer = document.getElementById('resizer');
const editorPanel = document.getElementById('editorPanel');
let isResizing = false;
resizer.addEventListener('mousedown', e => { isResizing = true; resizer.classList.add('active'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
document.addEventListener('mousemove', e => {
  if (!isResizing) return;
  const container = document.getElementById('mainContainer');
  const rect = container.getBoundingClientRect();
  const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width * 100, 20), 80);
  editorPanel.style.width = pct + '%';
});
document.addEventListener('mouseup', () => { isResizing = false; resizer.classList.remove('active'); document.body.style.cursor = ''; document.body.style.userSelect = ''; });

// ===== 初期化 =====
updateLineNumbers();
updateStatus();
