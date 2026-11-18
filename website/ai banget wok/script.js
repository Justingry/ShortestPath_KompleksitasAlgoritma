/**
 * ============================================================================
 * SCRIPT.JS — SIMULATOR PSEUDOCODE DIJKSTRA (BASELINE) VS DIJKSTRA OPTIMAL
 * ============================================================================
 * Membandingkan secara visual:
 * 1. Dijkstra (Procedure Dijkstra_Baseline):
 *    - Menggunakan Min-Heap PQ + fungsi getRouterIndex(id) O(n) di dalam loop edge E
 *    - Kompleksitas Waktu: T_Baseline = O(V * E)
 * 2. Dijkstra Optimal (Procedure Dijkstra_Optimized):
 *    - Menggunakan Min-Heap PQ + Hash Map routerIndexMap.get(id) O(1)
 *    - Kompleksitas Waktu: T_Optimal = O((V + E) log V)
 * ============================================================================
 */

const INF = 999999;

// 1. DATA TOPOLOGI 13 NODE (Indeks Vektor 0..12 -> Router ID 1..13) & 24 JALUR OSPF
const nodesData = [
  { idx: 0,  id: 1,  label: '1',  x: 165,  y: 495, costDx: 0,   costDy: 42,  active: true },
  { idx: 1,  id: 2,  label: '2',  x: 70,   y: 215, costDx: 0,   costDy: -36, active: true },
  { idx: 2,  id: 3,  label: '3',  x: 250,  y: 65,  costDx: 0,   costDy: -36, active: true },
  { idx: 3,  id: 4,  label: '4',  x: 265,  y: 355, costDx: -42, costDy: 36,  active: true },
  { idx: 4,  id: 5,  label: '5',  x: 380,  y: 215, costDx: 0,   costDy: -36, active: true },
  { idx: 5,  id: 6,  label: '6',  x: 540,  y: 355, costDx: 0,   costDy: 42,  active: true },
  { idx: 6,  id: 7,  label: '7',  x: 685,  y: 495, costDx: 0,   costDy: 42,  active: true },
  { idx: 7,  id: 8,  label: '8',  x: 715,  y: 215, costDx: 0,   costDy: -36, active: true },
  { idx: 8,  id: 9,  label: '9',  x: 540,  y: 65,  costDx: 0,   costDy: -36, active: true },
  { idx: 9,  id: 10, label: '10', x: 865,  y: 65,  costDx: 0,   costDy: -36, active: true },
  { idx: 10, id: 11, label: '11', x: 835,  y: 355, costDx: -48, costDy: 4,   active: true },
  { idx: 11, id: 12, label: '12', x: 1125, y: 215, costDx: 0,   costDy: -36, active: true },
  { idx: 12, id: 13, label: '13', x: 1125, y: 395, costDx: 0,   costDy: 42,  active: true }
];

const edgesData = [
  { id: 0,  u: 1,  v: 2,  bw: 10,  cost: 10, t: 0.55, dx: -12, dy: 0,   active: true },
  { id: 1,  u: 1,  v: 4,  bw: 50,  cost: 2,  t: 0.45, dx: 12,  dy: 10,  active: true },
  { id: 2,  u: 1,  v: 7,  bw: 10,  cost: 10, t: 0.50, dx: 0,   dy: 0,   active: true },
  { id: 3,  u: 2,  v: 3,  bw: 25,  cost: 4,  t: 0.50, dx: -10, dy: -6,  active: true },
  { id: 4,  u: 2,  v: 4,  bw: 25,  cost: 4,  t: 0.46, dx: -10, dy: 8,   active: true },
  { id: 5,  u: 2,  v: 5,  bw: 20,  cost: 5,  t: 0.48, dx: 0,   dy: 0,   active: true },
  { id: 6,  u: 3,  v: 9,  bw: 10,  cost: 10, t: 0.50, dx: 0,   dy: 0,   active: true },
  { id: 7,  u: 4,  v: 5,  bw: 100, cost: 1,  t: 0.52, dx: -8,  dy: 8,   active: true },
  { id: 8,  u: 4,  v: 6,  bw: 20,  cost: 5,  t: 0.52, dx: 0,   dy: 0,   active: true },
  { id: 9,  u: 5,  v: 6,  bw: 25,  cost: 4,  t: 0.46, dx: 8,   dy: -10, active: true },
  { id: 10, u: 5,  v: 8,  bw: 50,  cost: 2,  t: 0.50, dx: 0,   dy: 0,   active: true },
  { id: 11, u: 5,  v: 9,  bw: 20,  cost: 5,  t: 0.50, dx: -10, dy: -4,  active: true },
  { id: 12, u: 6,  v: 7,  bw: 50,  cost: 2,  t: 0.52, dx: -14, dy: 8,   active: true },
  { id: 13, u: 6,  v: 8,  bw: 50,  cost: 2,  t: 0.48, dx: -10, dy: -8,  active: true },
  { id: 14, u: 7,  v: 11, bw: 25,  cost: 4,  t: 0.45, dx: -26, dy: -10, active: true },
  { id: 15, u: 7,  v: 13, bw: 10,  cost: 10, t: 0.52, dx: 24,  dy: 18,  active: true },
  { id: 16, u: 8,  v: 9,  bw: 25,  cost: 4,  t: 0.50, dx: 10,  dy: -4,  active: true },
  { id: 17, u: 8,  v: 11, bw: 50,  cost: 2,  t: 0.44, dx: -10, dy: -6,  active: true },
  { id: 18, u: 8,  v: 12, bw: 20,  cost: 5,  t: 0.46, dx: 0,   dy: 0,   active: true },
  { id: 19, u: 9,  v: 10, bw: 10,  cost: 10, t: 0.50, dx: 0,   dy: 0,   active: true },
  { id: 20, u: 10, v: 12, bw: 25,  cost: 4,  t: 0.50, dx: 14,  dy: -6,  active: true },
  { id: 21, u: 11, v: 12, bw: 25,  cost: 4,  t: 0.48, dx: -16, dy: -12, active: true },
  { id: 22, u: 11, v: 13, bw: 25,  cost: 4,  t: 0.50, dx: -8,  dy: -2,  active: true },
  { id: 23, u: 12, v: 13, bw: 100, cost: 1,  t: 0.50, dx: 16,  dy: 0,   active: true }
];

// 2. PSEUDOCODE PERSIS SESUAI YANG DIKIRIM USER (DIJKSTRA VS DIJKSTRA OPTIMAL)
const CODE_LINES_STANDARD = [
  { line: 1,  text: 'Procedure Dijkstra_Baseline(G, srcId, destId)' },
  { line: 2,  text: '  for i <- 0 to n - 1 do dist[i] <- INF; parentNode[i] <- -1' },
  { line: 3,  text: '  Function getRouterIndex(id) // Pemindaian Linear O(n)' },
  { line: 4,  text: '    for i <- 0 to n - 1 do if G.m_routers[i].getId() == id return i' },
  { line: 5,  text: '  srcIdx <- getRouterIndex(srcId); destIdx <- getRouterIndex(destId) // O(n)' },
  { line: 6,  text: '  dist[srcIdx] <- 0; PQ <- CreateMinPriorityQueue(); PQ.push((0, srcIdx))' },
  { line: 7,  text: '  while NOT PQ.isEmpty() do' },
  { line: 8,  text: '    (d, uIdx) <- PQ.pop_min() // Operasi Heap Pop: O(log n)' },
  { line: 9,  text: '    if d > dist[uIdx] OR G.m_routers[uIdx].isDown() then continue' },
  { line: 10, text: '    for each edge in uNode.getEdges() do' },
  { line: 11, text: '      if edge.isBroken() OR vNode.isDown() then continue' },
  { line: 12, text: '      vIdx <- getRouterIndex(vNode.getId()) // BOTTLENECK: Loop O(n)!' },
  { line: 13, text: '      weight <- edge.getOspfCost()' },
  { line: 14, text: '      if dist[uIdx] + weight < dist[vIdx] then' },
  { line: 15, text: '        dist[vIdx] <- dist[uIdx] + weight; parentNode[vIdx] <- uIdx' },
  { line: 16, text: '        PQ.push((dist[vIdx], vIdx)) // Operasi Heap Push: O(log n)' },
  { line: 17, text: 'End Procedure' }
];

const CODE_LINES_MINHEAP = [
  { line: 1,  text: 'Procedure Dijkstra_Optimized(G, srcId, destId)' },
  { line: 2,  text: '  for i <- 0 to n - 1 do dist[i] <- INF; parentNode[i] <- -1' },
  { line: 3,  text: '  // OPTIMASI 1: Bangun Hash Map ID -> Indeks Vektor O(n) Sekali di Awal' },
  { line: 4,  text: '  routerIndexMap <- CreateHashMap()' },
  { line: 5,  text: '  for i <- 0 to n - 1 do routerIndexMap.put(G.m_routers[i].getId(), i)' },
  { line: 6,  text: '  srcIdx <- routerIndexMap.get(srcId); destIdx <- routerIndexMap.get(destId) // O(1)' },
  { line: 7,  text: '  dist[srcIdx] <- 0; PQ <- CreateMinPriorityQueue(); PQ.push((0, srcIdx))' },
  { line: 8,  text: '  while NOT PQ.isEmpty() do' },
  { line: 9,  text: '    (d, uIdx) <- PQ.pop_min() // Operasi Heap Pop: O(log n)' },
  { line: 10, text: '    if d > dist[uIdx] OR G.m_routers[uIdx].isDown() then continue' },
  { line: 11, text: '    for each edge in uNode.getEdges() do' },
  { line: 12, text: '      if edge.isBroken() OR vNode.isDown() then continue' },
  { line: 13, text: '      vIdx <- routerIndexMap.get(vNode.getId()) // OPTIMASI 2: Lookup O(1)!' },
  { line: 14, text: '      weight <- edge.getOspfCost()' },
  { line: 15, text: '      if dist[uIdx] + weight < dist[vIdx] then' },
  { line: 16, text: '        dist[vIdx] <- dist[uIdx] + weight; parentNode[vIdx] <- uIdx' },
  { line: 17, text: '        PQ.push((dist[vIdx], vIdx)) // Operasi Heap Push: O(log n)' },
  { line: 18, text: 'End Procedure' }
];

let currentMode = 'standard'; // 'standard' = Dijkstra (Baseline), 'minheap' = Dijkstra Optimal
let sourceNode = 1;
let destNode = 13;

let traceStandard = null;
let traceMinHeap = null;
let activeFrames = [];
let currentFrameIdx = 0;
let playTimer = null;
let playSpeedMs = 750;

function getNodeById(id) {
  return nodesData.find((n) => n.id === id);
}

function isNodeActive(id) {
  const n = getNodeById(id);
  return Boolean(n && n.active);
}

function buildAdjacency() {
  const adj = {};
  nodesData.forEach((n) => {
    adj[n.id] = [];
  });
  edgesData.forEach((e) => {
    if (e.active && isNodeActive(e.u) && isNodeActive(e.v)) {
      adj[e.u].push({ to: e.v, cost: e.cost, edgeId: e.id });
      adj[e.v].push({ to: e.u, cost: e.cost, edgeId: e.id });
    }
  });
  Object.keys(adj).forEach((k) => {
    adj[k].sort((a, b) => a.to - b.to);
  });
  return adj;
}

function reconstructRoute(dist, parent, parentEdge, dst) {
  const pathNodes = [];
  const pathEdges = [];
  let reachable = false;
  if (isNodeActive(dst) && dist[dst] !== INF) {
    reachable = true;
    let curr = dst;
    while (curr !== -1) {
      pathNodes.unshift(curr);
      if (parentEdge[curr] !== -1) {
        pathEdges.unshift(parentEdge[curr]);
      }
      curr = parent[curr];
    }
  }
  return { pathNodes, pathEdges, reachable };
}

// Binary Min-Heap untuk kedua prosedur (karena kedua pseudocode memakai MinPriorityQueue PQ)
class BinaryMinHeap {
  constructor() {
    this.data = [];
    this.heapOps = 0;
  }
  push(item) {
    this.data.push(item);
    this.heapOps++;
    let idx = this.data.length - 1;
    while (idx > 0) {
      this.heapOps++;
      const p = Math.floor((idx - 1) / 2);
      if (
        this.data[idx].cost < this.data[p].cost ||
        (this.data[idx].cost === this.data[p].cost && this.data[idx].node < this.data[p].node)
      ) {
        const tmp = this.data[idx];
        this.data[idx] = this.data[p];
        this.data[p] = tmp;
        idx = p;
      } else {
        break;
      }
    }
  }
  pop() {
    if (this.data.length === 0) return null;
    this.heapOps++;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let idx = 0;
      const n = this.data.length;
      while (true) {
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        let smallest = idx;
        if (left < n) {
          this.heapOps++;
          if (
            this.data[left].cost < this.data[smallest].cost ||
            (this.data[left].cost === this.data[smallest].cost && this.data[left].node < this.data[smallest].node)
          ) {
            smallest = left;
          }
        }
        if (right < n) {
          this.heapOps++;
          if (
            this.data[right].cost < this.data[smallest].cost ||
            (this.data[right].cost === this.data[smallest].cost && this.data[right].node < this.data[smallest].node)
          ) {
            smallest = right;
          }
        }
        if (smallest !== idx) {
          const tmp = this.data[idx];
          this.data[idx] = this.data[smallest];
          this.data[smallest] = tmp;
          idx = smallest;
        } else {
          break;
        }
      }
    }
    return top;
  }
  snapshot() {
    return this.data.map((x) => ({ cost: x.cost, node: x.node, uIdx: x.node - 1 }));
  }
  isEmpty() {
    return this.data.length === 0;
  }
}

// Simulasi fungsi getRouterIndex(id) pada Dijkstra_Baseline:
// Mencari dari i = 0 s/d n-1 hingga G.m_routers[i].getId() == id (atau semua n elemen pada worst-case scan)
function simulateGetRouterIndex(targetId) {
  const scannedIds = [];
  for (let i = 0; i < nodesData.length; i++) {
    scannedIds.push(nodesData[i].id);
    if (nodesData[i].id === targetId) {
      break;
    }
  }
  // Pada analisis kompleksitas T_Baseline, getRouterIndex adalah operasi linear O(n) (hingga n=13 cek)
  return {
    foundIdx: targetId - 1,
    scannedIds,
    opsCount: nodesData.length // n = 13 operasi linear scan O(n)
  };
}

// =========================================================================
// 3. GENERATOR TRACE: DIJKSTRA (Procedure Dijkstra_Baseline - Lambda O(n))
// =========================================================================
function generateBaselineTrace(srcId, destId) {
  const n = nodesData.length;
  const dist = {};
  const parent = {};
  const parentEdge = {};
  const settled = {};

  nodesData.forEach((node) => {
    dist[node.id] = INF;
    parent[node.id] = -1;
    parentEdge[node.id] = -1;
    settled[node.id] = false;
  });

  const adj = buildAdjacency();
  const pq = new BinaryMinHeap();
  const frames = [];

  let initOps = n; // for i <- 0 to n-1 do dist[i] <- INF
  let lookupOps = 0; // total operasi getRouterIndex(id) O(n)
  let edgeCheckOps = 0;
  let relaxOps = 0;

  // Lookup srcIdx & destIdx menggunakan getRouterIndex(srcId) & getRouterIndex(destId) -> 2 * O(n)
  const srcLookup = simulateGetRouterIndex(srcId);
  const dstLookup = simulateGetRouterIndex(destId);
  lookupOps += srcLookup.opsCount + dstLookup.opsCount;

  if (!isNodeActive(srcId)) {
    frames.push({
      phase: 'ROUTER ASAL DOWN',
      badgeColor: 'rose',
      lines: [1, 8, 9],
      lineStyle: 'rose',
      u: `${srcId - 1} (R${srcId})`,
      v: '-',
      cand: 'uNode.isDown()',
      opsSoFar: initOps + lookupOps,
      formula: `uNode (Node ${srcId}) sedang DOWN / OFF`,
      narration: `Router asal Node ${srcId} sedang dimatikan (uNode.isDown() == true). Klik Node ${srcId} pada peta untuk menyalakannya.`,
      dist: { ...dist },
      parent: { ...parent },
      visited: { ...settled },
      scanningNodes: [],
      checkingEdgeId: null,
      relaxedNodeId: null,
      relaxedEdgeId: null,
      heapSnapshot: [],
      lookupTargetId: srcId,
      lookupCostThisStep: lookupOps,
      showFinalPath: false,
      pathNodes: [],
      pathEdges: []
    });
    return { frames, lookupOps, heapAndEdgeOps: initOps, totalOps: initOps + lookupOps, reachable: false, pathNodes: [], pathEdges: [], finalCost: INF };
  }

  dist[srcId] = 0;
  pq.push({ cost: 0, node: srcId });

  // Frame 0: Inisialisasi & Lookup Awal dengan getRouterIndex O(n)
  frames.push({
    phase: 'INIT & getRouterIndex AWAL O(n)',
    badgeColor: 'amber',
    lines: [1, 2, 3, 4, 5, 6],
    lineStyle: 'amber',
    u: `idx ${srcId - 1} (N${srcId})`,
    v: `idx ${destId - 1} (N${destId})`,
    cand: `+${lookupOps} op scan`,
    opsSoFar: initOps + lookupOps + pq.heapOps,
    formula: `Init dist[0..12] (+${n} op) + 2x getRouterIndex (+${lookupOps} op) + PQ.push((0, ${srcId - 1}))`,
    narration: `Dijkstra_Baseline: Inisialisasi dist[0..12] = INF (+${n} op), lalu memanggil getRouterIndex(${srcId}) dan getRouterIndex(${destId}) yang masing-masing memindai vektor m_routers secara linear O(n) (+${lookupOps} op).`,
    dist: { ...dist },
    parent: { ...parent },
    visited: { ...settled },
    scanningNodes: dstLookup.scannedIds,
    checkingEdgeId: null,
    relaxedNodeId: srcId,
    relaxedEdgeId: null,
    heapSnapshot: pq.snapshot(),
    lookupTargetId: destId,
    lookupCostThisStep: lookupOps,
    showFinalPath: false,
    pathNodes: [],
    pathEdges: []
  });

  while (!pq.isEmpty()) {
    const topItem = pq.pop();
    const u = topItem.node;
    const d = topItem.cost;
    const uIdx = u - 1;

    if (d > dist[u] || !isNodeActive(u)) {
      frames.push({
        phase: `SKIP DATA USANG (d > dist[${uIdx}])`,
        badgeColor: 'amber',
        lines: [7, 8, 9],
        lineStyle: 'amber',
        u: `idx ${uIdx} (N${u})`,
        v: '-',
        cand: `${d} > ${dist[u]}`,
        opsSoFar: initOps + lookupOps + pq.heapOps + edgeCheckOps + relaxOps,
        formula: `PQ.pop_min() -> (${d}, idx ${uIdx}): karena ${d} > dist[${uIdx}] (${dist[u]}), continue!`,
        narration: `Mengambil (${d}, idx ${uIdx}) dari PQ, tetapi nilai d=${d} lebih besar dari dist[${uIdx}]=${dist[u]} yang sudah ditemukan sebelumnya. Langsung dilewati (continue).`,
        dist: { ...dist },
        parent: { ...parent },
        visited: { ...settled },
        scanningNodes: [],
        checkingEdgeId: null,
        relaxedNodeId: null,
        relaxedEdgeId: null,
        heapSnapshot: pq.snapshot(),
        lookupTargetId: null,
        lookupCostThisStep: 0,
        showFinalPath: false,
        pathNodes: [],
        pathEdges: []
      });
      continue;
    }

    settled[u] = true;

    // Frame: PQ.pop_min()
    frames.push({
      phase: `PQ.pop_min() -> uIdx=${uIdx} (Node ${u})`,
      badgeColor: 'emerald',
      lines: [7, 8, 9],
      lineStyle: 'green',
      u: `idx ${uIdx} (N${u})`,
      v: '-',
      cand: `Cost = ${d}`,
      opsSoFar: initOps + lookupOps + pq.heapOps + edgeCheckOps + relaxOps,
      formula: `(d=${d}, uIdx=${uIdx}) <- PQ.pop_min() [Operasi Heap O(log n)]`,
      narration: `PQ.pop_min() mengambil elemen Root terkecil dari Min-Heap yaitu uNode = Node ${u} (uIdx = ${uIdx}) dengan jarak d = ${d}. Sekarang periksa setiap edge di uNode.getEdges().`,
      dist: { ...dist },
      parent: { ...parent },
      visited: { ...settled },
      scanningNodes: [],
      checkingEdgeId: null,
      relaxedNodeId: null,
      relaxedEdgeId: null,
      heapSnapshot: pq.snapshot(),
      lookupTargetId: null,
      lookupCostThisStep: 0,
      showFinalPath: false,
      pathNodes: [],
      pathEdges: []
    });

    for (const edge of adj[u]) {
      const v = edge.to;
      const vIdx = v - 1;
      if (settled[v] || !isNodeActive(v)) continue;

      // BOTTLENECK UTAMA DIJKSTRA_BASELINE: panggil getRouterIndex(vNode.getId()) di dalam loop edge!
      const vLookup = simulateGetRouterIndex(v);
      lookupOps += vLookup.opsCount;
      edgeCheckOps++;

      const newCost = dist[u] + edge.cost;
      const oldCost = dist[v];
      const oldStr = oldCost === INF ? 'INF' : String(oldCost);

      if (newCost < oldCost) {
        dist[v] = newCost;
        parent[v] = u;
        parentEdge[v] = edge.edgeId;
        relaxOps++;
        pq.push({ cost: newCost, node: v });

        frames.push({
          phase: `BOTTLENECK getRouterIndex(${v}) + RELAKSASI`,
          badgeColor: 'rose',
          lines: [10, 12, 13, 14, 15, 16],
          lineStyle: 'rose',
          u: `idx ${uIdx} (N${u})`,
          v: `idx ${vIdx} (N${v})`,
          cand: `+${vLookup.opsCount} op (O(n))`,
          opsSoFar: initOps + lookupOps + pq.heapOps + edgeCheckOps + relaxOps,
          formula: `vIdx <- getRouterIndex(${v}) [+${vLookup.opsCount} op!] lalu dist[${vIdx}] = ${newCost} & PQ.push`,
          narration: `BOTTLENECK O(n): Untuk mengecek tetangga Node ${v}, Dijkstra_Baseline memanggil getRouterIndex(${v}) yang memindai ulang vektor m_routers (+${vLookup.opsCount} op)! Setelah ketemu vIdx=${vIdx}, jarak di-update menjadi ${newCost} (< ${oldStr}) dan di-push ke PQ.`,
          dist: { ...dist },
          parent: { ...parent },
          visited: { ...settled },
          scanningNodes: vLookup.scannedIds,
          checkingEdgeId: edge.edgeId,
          relaxedNodeId: v,
          relaxedEdgeId: edge.edgeId,
          heapSnapshot: pq.snapshot(),
          lookupTargetId: v,
          lookupCostThisStep: vLookup.opsCount,
          showFinalPath: false,
          pathNodes: [],
          pathEdges: []
        });
      } else {
        frames.push({
          phase: `BOTTLENECK getRouterIndex(${v}) (TIDAK UPDATE)`,
          badgeColor: 'amber',
          lines: [10, 12, 13, 14],
          lineStyle: 'rose',
          u: `idx ${uIdx} (N${u})`,
          v: `idx ${vIdx} (N${v})`,
          cand: `+${vLookup.opsCount} op (O(n))`,
          opsSoFar: initOps + lookupOps + pq.heapOps + edgeCheckOps + relaxOps,
          formula: `vIdx <- getRouterIndex(${v}) [+${vLookup.opsCount} op!], tapi ${newCost} >= ${oldStr}`,
          narration: `BOTTLENECK O(n): Tetap harus memanggil getRouterIndex(${v}) (+${vLookup.opsCount} op pemindaian linear) hanya untuk mengecek bahwa jarak ${newCost} >= dist[${vIdx}] (${oldStr}).`,
          dist: { ...dist },
          parent: { ...parent },
          visited: { ...settled },
          scanningNodes: vLookup.scannedIds,
          checkingEdgeId: edge.edgeId,
          relaxedNodeId: null,
          relaxedEdgeId: null,
          heapSnapshot: pq.snapshot(),
          lookupTargetId: v,
          lookupCostThisStep: vLookup.opsCount,
          showFinalPath: false,
          pathNodes: [],
          pathEdges: []
        });
      }
    }
  }

  const route = reconstructRoute(dist, parent, parentEdge, destId);
  const heapAndEdgeOps = initOps + pq.heapOps + edgeCheckOps + relaxOps;
  const totalOps = lookupOps + heapAndEdgeOps;

  frames.push({
    phase: 'SELESAI • HASIL AKHIR DIJKSTRA (BASELINE)',
    badgeColor: route.reachable ? 'emerald' : 'rose',
    lines: [17],
    lineStyle: 'green',
    u: `idx ${srcId - 1} (N${srcId})`,
    v: `idx ${destId - 1} (N${destId})`,
    cand: `Total ${totalOps} op`,
    opsSoFar: totalOps,
    formula: route.reachable
      ? `Rute: ${route.pathNodes.join(' → ')} | Cost = ${dist[destId]} | Total = ${totalOps} op (${lookupOps} op di getRouterIndex!)`
      : `Tidak ada jalur aktif dari Node ${srcId} ke Node ${destId}`,
    narration: route.reachable
      ? `Procedure Dijkstra_Baseline selesai dengan Total ${totalOps} operasi. Perhatikan bahwa ${lookupOps} operasi habis terbuang hanya untuk memanggil getRouterIndex() O(n) berulang-ulang di dalam loop sisi E (Kompleksitas O(V·E))!`
      : `Pencarian selesai. Node ${destId} tidak terjangkau dari Node ${srcId}.`,
    dist: { ...dist },
    parent: { ...parent },
    visited: { ...settled },
    scanningNodes: [],
    checkingEdgeId: null,
    relaxedNodeId: null,
    relaxedEdgeId: null,
    heapSnapshot: [],
    lookupTargetId: null,
    lookupCostThisStep: 0,
    showFinalPath: true,
    pathNodes: route.pathNodes,
    pathEdges: route.pathEdges
  });

  return {
    frames,
    lookupOps,
    heapAndEdgeOps,
    totalOps,
    reachable: route.reachable,
    pathNodes: route.pathNodes,
    pathEdges: route.pathEdges,
    finalCost: dist[destId]
  };
}

// =========================================================================
// 4. GENERATOR TRACE: DIJKSTRA OPTIMAL (Procedure Dijkstra_Optimized - Hash Map O(1))
// =========================================================================
function generateOptimizedTrace(srcId, destId) {
  const n = nodesData.length;
  const dist = {};
  const parent = {};
  const parentEdge = {};
  const settled = {};

  nodesData.forEach((node) => {
    dist[node.id] = INF;
    parent[node.id] = -1;
    parentEdge[node.id] = -1;
    settled[node.id] = false;
  });

  const adj = buildAdjacency();
  const pq = new BinaryMinHeap();
  const frames = [];

  let initOps = n; // for i <- 0 to n-1 do dist[i] <- INF
  let hashMapOps = n + 2; // n kali routerIndexMap.put() di awal + 2 kali get(srcId), get(destId) O(1)
  let edgeCheckOps = 0;
  let relaxOps = 0;

  if (!isNodeActive(srcId)) {
    frames.push({
      phase: 'ROUTER ASAL DOWN',
      badgeColor: 'rose',
      lines: [1, 9, 10],
      lineStyle: 'rose',
      u: `${srcId - 1} (R${srcId})`,
      v: '-',
      cand: 'uNode.isDown()',
      opsSoFar: initOps + hashMapOps,
      formula: `uNode (Node ${srcId}) sedang DOWN / OFF`,
      narration: `Router asal Node ${srcId} sedang dimatikan (uNode.isDown() == true). Klik Node ${srcId} pada peta untuk menyalakannya.`,
      dist: { ...dist },
      parent: { ...parent },
      visited: { ...settled },
      scanningNodes: [],
      checkingEdgeId: null,
      relaxedNodeId: null,
      relaxedEdgeId: null,
      heapSnapshot: [],
      lookupTargetId: srcId,
      lookupCostThisStep: 1,
      showFinalPath: false,
      pathNodes: [],
      pathEdges: []
    });
    return { frames, hashMapOps, heapAndEdgeOps: initOps, totalOps: initOps + hashMapOps, reachable: false, pathNodes: [], pathEdges: [], finalCost: INF };
  }

  dist[srcId] = 0;
  pq.push({ cost: 0, node: srcId });

  // Frame 0: OPTIMASI 1 - Bangun routerIndexMap Sekali di Awal O(n) + Lookup O(1)
  frames.push({
    phase: 'OPTIMASI 1 • BANGUN HASH MAP O(n) SEKALI SAJA',
    badgeColor: 'emerald',
    lines: [1, 2, 3, 4, 5, 6, 7],
    lineStyle: 'green',
    u: `idx ${srcId - 1} (N${srcId})`,
    v: `idx ${destId - 1} (N${destId})`,
    cand: 'get() = +1 op (O(1))',
    opsSoFar: initOps + hashMapOps + pq.heapOps,
    formula: `routerIndexMap.put(id, i) sekali di awal (+${n} op) -> srcIdx & destIdx diambil instan O(1)!`,
    narration: `OPTIMASI 1: Membangun Hash Map routerIndexMap sekali saja di awal (+${n} op). Setelah itu, mencari srcIdx dan destIdx cukup dengan routerIndexMap.get() yang langsung selesai dalam 1 langkah O(1)!`,
    dist: { ...dist },
    parent: { ...parent },
    visited: { ...settled },
    scanningNodes: [srcId],
    checkingEdgeId: null,
    relaxedNodeId: srcId,
    relaxedEdgeId: null,
    heapSnapshot: pq.snapshot(),
    lookupTargetId: srcId,
    lookupCostThisStep: 1,
    showFinalPath: false,
    pathNodes: [],
    pathEdges: []
  });

  while (!pq.isEmpty()) {
    const topItem = pq.pop();
    const u = topItem.node;
    const d = topItem.cost;
    const uIdx = u - 1;

    if (d > dist[u] || !isNodeActive(u)) {
      frames.push({
        phase: `SKIP DATA USANG (d > dist[${uIdx}])`,
        badgeColor: 'amber',
        lines: [8, 9, 10],
        lineStyle: 'amber',
        u: `idx ${uIdx} (N${u})`,
        v: '-',
        cand: `${d} > ${dist[u]}`,
        opsSoFar: initOps + hashMapOps + pq.heapOps + edgeCheckOps + relaxOps,
        formula: `PQ.pop_min() -> (${d}, idx ${uIdx}): karena ${d} > dist[${uIdx}] (${dist[u]}), continue!`,
        narration: `Mengambil (${d}, idx ${uIdx}) dari PQ, tetapi d=${d} > dist[${uIdx}]=${dist[u]}. Langsung dilewati (continue).`,
        dist: { ...dist },
        parent: { ...parent },
        visited: { ...settled },
        scanningNodes: [],
        checkingEdgeId: null,
        relaxedNodeId: null,
        relaxedEdgeId: null,
        heapSnapshot: pq.snapshot(),
        lookupTargetId: null,
        lookupCostThisStep: 0,
        showFinalPath: false,
        pathNodes: [],
        pathEdges: []
      });
      continue;
    }

    settled[u] = true;

    frames.push({
      phase: `PQ.pop_min() -> uIdx=${uIdx} (Node ${u})`,
      badgeColor: 'emerald',
      lines: [8, 9, 10],
      lineStyle: 'green',
      u: `idx ${uIdx} (N${u})`,
      v: '-',
      cand: `Cost = ${d}`,
      opsSoFar: initOps + hashMapOps + pq.heapOps + edgeCheckOps + relaxOps,
      formula: `(d=${d}, uIdx=${uIdx}) <- PQ.pop_min() [Operasi Heap O(log n)]`,
      narration: `PQ.pop_min() mengambil elemen Root terkecil dari Min-Heap yaitu uNode = Node ${u} (uIdx = ${uIdx}) dengan Cost = ${d}.`,
      dist: { ...dist },
      parent: { ...parent },
      visited: { ...settled },
      scanningNodes: [],
      checkingEdgeId: null,
      relaxedNodeId: null,
      relaxedEdgeId: null,
      heapSnapshot: pq.snapshot(),
      lookupTargetId: null,
      lookupCostThisStep: 0,
      showFinalPath: false,
      pathNodes: [],
      pathEdges: []
    });

    for (const edge of adj[u]) {
      const v = edge.to;
      const vIdx = v - 1;
      if (settled[v] || !isNodeActive(v)) continue;

      // OPTIMASI 2: Lookup Hash Map O(1) hanya 1 operasi!
      hashMapOps += 1;
      edgeCheckOps += 1;

      const newCost = dist[u] + edge.cost;
      const oldCost = dist[v];
      const oldStr = oldCost === INF ? 'INF' : String(oldCost);

      if (newCost < oldCost) {
        dist[v] = newCost;
        parent[v] = u;
        parentEdge[v] = edge.edgeId;
        relaxOps++;
        pq.push({ cost: newCost, node: v });

        frames.push({
          phase: `OPTIMASI 2: HashMap.get(${v}) O(1) + RELAKSASI`,
          badgeColor: 'emerald',
          lines: [11, 13, 14, 15, 16, 17],
          lineStyle: 'green',
          u: `idx ${uIdx} (N${u})`,
          v: `idx ${vIdx} (N${v})`,
          cand: '+1 op (O(1) Instan!)',
          opsSoFar: initOps + hashMapOps + pq.heapOps + edgeCheckOps + relaxOps,
          formula: `vIdx <- routerIndexMap.get(${v}) [+1 op O(1)] -> dist[${vIdx}] = ${newCost} & PQ.push`,
          narration: `OPTIMASI 2 O(1): routerIndexMap.get(${v}) langsung menemukan vIdx = ${vIdx} dalam 1 langkah instan tanpa memindai array! Jarak Node ${v} di-update menjadi ${newCost} (< ${oldStr}) dan di-push ke Min-Heap PQ.`,
          dist: { ...dist },
          parent: { ...parent },
          visited: { ...settled },
          scanningNodes: [v],
          checkingEdgeId: edge.edgeId,
          relaxedNodeId: v,
          relaxedEdgeId: edge.edgeId,
          heapSnapshot: pq.snapshot(),
          lookupTargetId: v,
          lookupCostThisStep: 1,
          showFinalPath: false,
          pathNodes: [],
          pathEdges: []
        });
      } else {
        frames.push({
          phase: `OPTIMASI 2: HashMap.get(${v}) O(1) (TETAP)`,
          badgeColor: 'sky',
          lines: [11, 13, 14, 15],
          lineStyle: 'amber',
          u: `idx ${uIdx} (N${u})`,
          v: `idx ${vIdx} (N${v})`,
          cand: '+1 op (O(1) Instan!)',
          opsSoFar: initOps + hashMapOps + pq.heapOps + edgeCheckOps + relaxOps,
          formula: `vIdx <- routerIndexMap.get(${v}) [+1 op O(1)], ${newCost} >= ${oldStr} (Tetap)`,
          narration: `OPTIMASI 2 O(1): routerIndexMap.get(${v}) langsung mengambil vIdx = ${vIdx} hanya dalam 1 operasi. Karena jarak ${newCost} >= dist[${vIdx}] (${oldStr}), tidak ada perubahan.`,
          dist: { ...dist },
          parent: { ...parent },
          visited: { ...settled },
          scanningNodes: [v],
          checkingEdgeId: edge.edgeId,
          relaxedNodeId: null,
          relaxedEdgeId: null,
          heapSnapshot: pq.snapshot(),
          lookupTargetId: v,
          lookupCostThisStep: 1,
          showFinalPath: false,
          pathNodes: [],
          pathEdges: []
        });
      }
    }
  }

  const route = reconstructRoute(dist, parent, parentEdge, destId);
  const heapAndEdgeOps = initOps + pq.heapOps + edgeCheckOps + relaxOps;
  const totalOps = hashMapOps + heapAndEdgeOps;

  frames.push({
    phase: 'SELESAI • HASIL AKHIR DIJKSTRA OPTIMAL',
    badgeColor: route.reachable ? 'emerald' : 'rose',
    lines: [18],
    lineStyle: 'green',
    u: `idx ${srcId - 1} (N${srcId})`,
    v: `idx ${destId - 1} (N${destId})`,
    cand: `Total ${totalOps} op`,
    opsSoFar: totalOps,
    formula: route.reachable
      ? `Rute: ${route.pathNodes.join(' → ')} | Cost = ${dist[destId]} | Total = ${totalOps} op (Lookup HashMap hanya ${hashMapOps} op!)`
      : `Tidak ada jalur aktif dari Node ${srcId} ke Node ${destId}`,
    narration: route.reachable
      ? `Procedure Dijkstra_Optimized selesai hanya dalam ${totalOps} operasi (bandingkan dengan Dijkstra Baseline yang memakan ${traceStandard ? traceStandard.totalOps : ''} operasi)! Berkat routerIndexMap O(1), kompleksitas mencapai O((V + E) log V).`
      : `Pencarian selesai. Node ${destId} tidak terjangkau dari Node ${srcId}.`,
    dist: { ...dist },
    parent: { ...parent },
    visited: { ...settled },
    scanningNodes: [],
    checkingEdgeId: null,
    relaxedNodeId: null,
    relaxedEdgeId: null,
    heapSnapshot: [],
    lookupTargetId: null,
    lookupCostThisStep: 0,
    showFinalPath: true,
    pathNodes: route.pathNodes,
    pathEdges: route.pathEdges
  });

  return {
    frames,
    hashMapOps,
    heapAndEdgeOps,
    totalOps,
    reachable: route.reachable,
    pathNodes: route.pathNodes,
    pathEdges: route.pathEdges,
    finalCost: dist[destId]
  };
}

// =========================================================================
// 5. RENDER SELURUH KOMPONEN VISUAL
// =========================================================================
function recomputeAllTraces(jumpToEnd = false) {
  stopAnimation();
  traceStandard = generateBaselineTrace(sourceNode, destNode);
  traceMinHeap = generateOptimizedTrace(sourceNode, destNode);

  activeFrames = currentMode === 'standard' ? traceStandard.frames : traceMinHeap.frames;
  currentFrameIdx = jumpToEnd ? activeFrames.length - 1 : 0;

  const slider = document.getElementById('stepSlider');
  if (slider) {
    slider.max = String(Math.max(0, activeFrames.length - 1));
    slider.value = String(currentFrameIdx);
  }

  renderScoreboardAndModeUI();
  renderCodePanelStructure();
  renderNodeToggleButtons();
  renderCurrentFrame();
}

function renderScoreboardAndModeUI() {
  const btnStd = document.getElementById('btnModeStandard');
  const btnHeap = document.getElementById('btnModeMinHeap');
  const cardStd = document.getElementById('cardScoreStandard');
  const cardHeap = document.getElementById('cardScoreHeap');
  const mapTag = document.getElementById('activeModeTagOnMap');

  if (currentMode === 'standard') {
    btnStd.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-amber-500 text-slate-950 shadow';
    btnHeap.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800';
    cardStd.className = 'p-3 rounded-xl bg-amber-950/25 border-2 border-amber-500/70 transition';
    cardHeap.className = 'p-3 rounded-xl bg-slate-950 border border-slate-800 transition opacity-85';
    mapTag.className = 'text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold';
    mapTag.textContent = 'Mode Aktif: Dijkstra (Baseline O(V·E))';
  } else {
    btnHeap.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-emerald-500 text-slate-950 shadow';
    btnStd.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800';
    cardHeap.className = 'p-3 rounded-xl bg-emerald-950/25 border-2 border-emerald-500/70 transition';
    cardStd.className = 'p-3 rounded-xl bg-slate-950 border border-slate-800 transition opacity-85';
    mapTag.className = 'text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold';
    mapTag.textContent = 'Mode Aktif: Dijkstra Optimal (Hash Map O((V+E)logV))';
  }

  document.getElementById('scoreStdTotal').textContent = `${traceStandard.totalOps} op`;
  document.getElementById('scoreStdScan').textContent = `${traceStandard.lookupOps} op`;
  document.getElementById('scoreStdEdge').textContent = `${traceStandard.heapAndEdgeOps} op`;

  document.getElementById('scoreHeapTotal').textContent = `${traceMinHeap.totalOps} op`;
  document.getElementById('scoreHeapOps').textContent = `${traceMinHeap.hashMapOps} op`;
  document.getElementById('scoreHeapEdge').textContent = `${traceMinHeap.heapAndEdgeOps} op`;

  const savedPct = traceStandard.totalOps > 0
    ? Math.round(((traceStandard.totalOps - traceMinHeap.totalOps) / traceStandard.totalOps) * 100)
    : 0;
  const effBadge = document.getElementById('badgeEfficiency');
  if (savedPct > 0) {
    effBadge.textContent = `Optimal ${savedPct}% Lebih Cepat`;
    effBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 mono';
  } else {
    effBadge.textContent = `Operasi Setara`;
    effBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 mono';
  }

  const statusBadge = document.getElementById('badgeRouteStatus');
  const routeText = document.getElementById('textFinalRoute');
  const costText = document.getElementById('textFinalCost');

  if (traceStandard.reachable) {
    statusBadge.textContent = 'RUTE OPTIMAL';
    statusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    routeText.textContent = traceStandard.pathNodes.join(' → ');
    costText.textContent = String(traceStandard.finalCost);
  } else {
    statusBadge.textContent = 'TERPUTUS';
    statusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
    routeText.textContent = `Tidak ada jalur ${sourceNode} → ${destNode}`;
    costText.textContent = '∞';
  }
}

function renderCodePanelStructure() {
  const container = document.getElementById('codeLinesContainer');
  const titleEl = document.getElementById('codePanelTitle');
  const linesData = currentMode === 'standard' ? CODE_LINES_STANDARD : CODE_LINES_MINHEAP;

  titleEl.textContent = currentMode === 'standard'
    ? '💻 Pseudocode: Procedure Dijkstra_Baseline (Lama)'
    : '💻 Pseudocode: Procedure Dijkstra_Optimized (Optimal)';

  container.innerHTML = '';
  linesData.forEach((item) => {
    const row = document.createElement('div');
    row.id = `code-line-${item.line}`;
    row.className = 'code-line text-slate-300';
    row.innerHTML = `<span class="code-pointer" id="code-ptr-${item.line}"></span><span class="code-line-num">${item.line}</span><span>${escapeHtml(item.text)}</span>`;
    container.appendChild(row);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCurrentFrame() {
  const frame = activeFrames[currentFrameIdx];
  if (!frame) return;

  const slider = document.getElementById('stepSlider');
  if (slider) slider.value = String(currentFrameIdx);

  const phaseBadge = document.getElementById('stepPhaseBadge');
  phaseBadge.textContent = frame.phase;
  const colorMap = {
    emerald: 'px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mono',
    amber: 'px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 mono',
    sky: 'px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 mono',
    rose: 'px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 mono'
  };
  phaseBadge.className = colorMap[frame.badgeColor] || colorMap.sky;

  document.getElementById('stepCounterLabel').textContent = `Langkah ${currentFrameIdx + 1} / ${activeFrames.length}`;
  document.getElementById('stepCostFormula').textContent = frame.formula;
  document.getElementById('stepNarrationText').textContent = frame.narration;

  document.getElementById('watchU').textContent = String(frame.u);
  document.getElementById('watchV').textContent = String(frame.v);
  document.getElementById('watchCand').textContent = String(frame.cand);
  document.getElementById('watchOps').textContent = `${frame.opsSoFar} op`;
  document.getElementById('activeLineBadge').textContent = `Baris Aktif: ${frame.lines.join(', ')}`;

  const linesData = currentMode === 'standard' ? CODE_LINES_STANDARD : CODE_LINES_MINHEAP;
  const activeLineSet = new Set(frame.lines);
  linesData.forEach((item) => {
    const row = document.getElementById(`code-line-${item.line}`);
    const ptr = document.getElementById(`code-ptr-${item.line}`);
    if (!row || !ptr) return;
    if (activeLineSet.has(item.line)) {
      row.className = frame.lineStyle === 'green'
        ? 'code-line active-line-green'
        : frame.lineStyle === 'rose'
        ? 'code-line active-line-rose'
        : 'code-line active-line';
      ptr.textContent = '▶';
    } else {
      row.className = 'code-line text-slate-400';
      ptr.textContent = '';
    }
  });

  renderSvgTopologyFrame(frame);
  renderDataStructureVisualizer(frame);
  renderDistArrayCards(frame);
}

function renderSvgTopologyFrame(frame) {
  const edgesLayer = document.getElementById('edgesLayer');
  const nodesLayer = document.getElementById('nodesLayer');
  edgesLayer.innerHTML = '';
  nodesLayer.innerHTML = '';

  const pathEdgeSet = new Set(frame.pathEdges || []);
  const pathNodeSet = new Set(frame.pathNodes || []);
  const scanNodeSet = new Set(frame.scanningNodes || []);

  const treeEdgeSet = new Set();
  nodesData.forEach((n) => {
    const p = frame.parent[n.id];
    if (p && p !== -1) {
      const found = edgesData.find(
        (e) => e.active && ((e.u === p && e.v === n.id) || (e.v === p && e.u === n.id))
      );
      if (found) treeEdgeSet.add(found.id);
    }
  });

  edgesData.forEach((edge) => {
    const nU = getNodeById(edge.u);
    const nV = getNodeById(edge.v);
    const effectiveActive = edge.active && nU.active && nV.active;

    const isFinalPath = frame.showFinalPath && effectiveActive && pathEdgeSet.has(edge.id);
    const isChecking = effectiveActive && frame.checkingEdgeId === edge.id;
    const isRelaxed = effectiveActive && frame.relaxedEdgeId === edge.id;
    const isInSptTree = !frame.showFinalPath && effectiveActive && treeEdgeSet.has(edge.id);

    let strokeColor = '#334155';
    let strokeWidth = 2.8;
    let extraClass = '';
    let dashArray = '';

    if (!effectiveActive) {
      strokeColor = '#f43f5e';
      strokeWidth = 2.2;
      dashArray = '6,6';
    } else if (isFinalPath || isRelaxed) {
      strokeColor = '#10b981';
      strokeWidth = 5.5;
      extraClass = 'active-route-line';
    } else if (isChecking) {
      strokeColor = '#38bdf8';
      strokeWidth = 5;
      extraClass = 'checking-edge-line';
    } else if (isInSptTree) {
      strokeColor = '#059669';
      strokeWidth = 3.8;
    }

    const tPos = typeof edge.t === 'number' ? edge.t : 0.5;
    const midX = nU.x + (nV.x - nU.x) * tPos + (edge.dx || 0);
    const midY = nU.y + (nV.y - nU.y) * tPos + (edge.dy || 0);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'edge-group');
    g.addEventListener('click', () => {
      edge.active = !edge.active;
      recomputeAllTraces(true);
    });

    const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitLine.setAttribute('x1', nU.x);
    hitLine.setAttribute('y1', nU.y);
    hitLine.setAttribute('x2', nV.x);
    hitLine.setAttribute('y2', nV.y);
    hitLine.setAttribute('stroke', 'transparent');
    hitLine.setAttribute('stroke-width', '20');
    g.appendChild(hitLine);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', nU.x);
    line.setAttribute('y1', nU.y);
    line.setAttribute('x2', nV.x);
    line.setAttribute('y2', nV.y);
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', strokeWidth);
    if (dashArray) line.setAttribute('stroke-dasharray', dashArray);
    if (extraClass) line.setAttribute('class', extraClass);
    g.appendChild(line);

    const badgeW = 104;
    const badgeH = 21;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', midX - badgeW / 2);
    rect.setAttribute('y', midY - badgeH / 2);
    rect.setAttribute('width', badgeW);
    rect.setAttribute('height', badgeH);
    rect.setAttribute('rx', '6');

    if (!edge.active) {
      rect.setAttribute('fill', '#4c0519');
      rect.setAttribute('stroke', '#f43f5e');
    } else if (isFinalPath || isRelaxed) {
      rect.setAttribute('fill', '#064e3b');
      rect.setAttribute('stroke', '#10b981');
    } else if (isChecking) {
      rect.setAttribute('fill', '#0c4a6e');
      rect.setAttribute('stroke', '#38bdf8');
    } else {
      rect.setAttribute('fill', '#0f172a');
      rect.setAttribute('stroke', '#334155');
    }
    rect.setAttribute('stroke-width', '1.5');
    g.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX);
    text.setAttribute('y', midY + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '9.5');
    text.setAttribute('font-weight', '700');
    text.setAttribute(
      'fill',
      !edge.active ? '#fda4af' : isFinalPath || isRelaxed ? '#a7f3d0' : isChecking ? '#bae6fd' : '#e2e8f0'
    );
    text.textContent = !edge.active ? 'PUTUS (OFF)' : `${edge.bw} Mbps, Cost = ${edge.cost}`;
    g.appendChild(text);

    edgesLayer.appendChild(g);
  });

  nodesData.forEach((node) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-group');
    g.addEventListener('click', () => {
      node.active = !node.active;
      recomputeAllTraces(true);
    });

    const isSource = node.id === sourceNode;
    const isDest = node.id === destNode;
    const isCurrentU = String(frame.u).includes(`N${node.id})`) && !frame.showFinalPath;
    const isRelaxedV = frame.relaxedNodeId === node.id;
    const isScanned = scanNodeSet.has(node.id);
    const isVisited = Boolean(frame.visited[node.id]);
    const isOnFinalPath = frame.showFinalPath && pathNodeSet.has(node.id);

    if (node.active && (isCurrentU || isScanned || isRelaxedV)) {
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('cx', node.x);
      halo.setAttribute('cy', node.y);
      halo.setAttribute('r', '33');
      halo.setAttribute('fill', 'none');
      halo.setAttribute(
        'stroke',
        isRelaxedV ? '#10b981' : isCurrentU ? '#f59e0b' : '#38bdf8'
      );
      halo.setAttribute('stroke-width', '2.5');
      halo.setAttribute('stroke-dasharray', '5,3');
      g.appendChild(halo);
    }

    let fillColor = '#0f172a';
    let strokeColor = '#64748b';
    let strokeWidth = '3';

    if (!node.active) {
      fillColor = '#4c0519';
      strokeColor = '#f43f5e';
    } else if (isCurrentU) {
      fillColor = '#78350f';
      strokeColor = '#f59e0b';
      strokeWidth = '4.5';
    } else if (isRelaxedV) {
      fillColor = '#064e3b';
      strokeColor = '#10b981';
      strokeWidth = '4.5';
    } else if (isScanned) {
      fillColor = '#0c4a6e';
      strokeColor = '#38bdf8';
      strokeWidth = '4';
    } else if (frame.showFinalPath && isDest && isOnFinalPath) {
      fillColor = '#78350f';
      strokeColor = '#f59e0b';
      strokeWidth = '4.5';
    } else if (isOnFinalPath || isSource) {
      fillColor = '#065f46';
      strokeColor = '#10b981';
      strokeWidth = '4.5';
    } else if (isVisited) {
      fillColor = '#064e3b';
      strokeColor = '#34d399';
      strokeWidth = '3.5';
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', '25');
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', strokeWidth);
    g.appendChild(circle);

    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('x', node.x);
    nameText.setAttribute('y', node.y + 5);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', '15');
    nameText.setAttribute('font-weight', '800');
    nameText.setAttribute('fill', !node.active ? '#fda4af' : '#ffffff');
    nameText.textContent = node.label;
    g.appendChild(nameText);

    const dVal = frame.dist[node.id];
    const badgeX = node.x + (node.costDx || 0);
    const badgeY = node.y + (node.costDy || 42);
    const costText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    costText.setAttribute('x', badgeX);
    costText.setAttribute('y', badgeY);
    costText.setAttribute('text-anchor', 'middle');
    costText.setAttribute('font-size', '11');
    costText.setAttribute('font-weight', '700');

    if (!node.active) {
      costText.setAttribute('fill', '#fb7185');
      costText.textContent = 'DOWN (OFF)';
    } else if (dVal === INF) {
      costText.setAttribute('fill', '#94a3b8');
      costText.textContent = 'Cost: ∞';
    } else {
      costText.setAttribute(
        'fill',
        isCurrentU || isDest ? '#fbbf24' : isSource || isOnFinalPath ? '#34d399' : '#38bdf8'
      );
      const prefix = isSource ? 'ASAL • ' : isDest ? 'TUJUAN • ' : isVisited ? '✓ ' : '';
      costText.textContent = `${prefix}Cost: ${dVal}`;
    }
    g.appendChild(costText);

    nodesLayer.appendChild(g);
  });
}

// =========================================================================
// 6. VISUALISASI LOOKUP (getRouterIndex O(n) VS routerIndexMap O(1)) + MIN-HEAP PQ
// =========================================================================
function renderDataStructureVisualizer(frame) {
  const box = document.getElementById('dsVisualizerBox');
  const titleEl = document.getElementById('dsPanelTitle');
  const subEl = document.getElementById('dsPanelSubtitle');
  const sizeBadge = document.getElementById('dsSizeBadge');
  const heap = frame.heapSnapshot || [];
  sizeBadge.textContent = `PQ: ${heap.length} item`;

  const scanSet = new Set(frame.scanningNodes || []);
  const targetId = frame.lookupTargetId;

  if (currentMode === 'standard') {
    titleEl.textContent = '🐢 Bottleneck: getRouterIndex(id) Scan O(n) + PQ';
    subEl.textContent = 'Mencari indeks vIdx dengan memindai vektor G.m_routers[0..12] di setiap sisi E';
  } else {
    titleEl.textContent = '⚡ Optimasi: routerIndexMap.get(id) O(1) + PQ';
    subEl.textContent = 'Langsung memetakan ID Router ke indeks vIdx (0..12) dalam 1 langkah O(1)!';
  }

  let lookupCells = '';
  nodesData.forEach((n) => {
    const isTarget = targetId === n.id;
    const isScanned = scanSet.has(n.id);
    let cls = 'bg-slate-900 border-slate-800 text-slate-400';

    if (isTarget) {
      cls = currentMode === 'standard'
        ? 'bg-rose-500/25 border-rose-400 text-rose-200 ring-1 ring-rose-400'
        : 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400';
    } else if (isScanned && currentMode === 'standard') {
      cls = 'bg-amber-500/20 border-amber-400 text-amber-200';
    }

    lookupCells += `
      <div class="p-1 rounded border text-center mono ${cls}">
        <div class="text-[9px] text-slate-400">${currentMode === 'standard' ? 'm[' + n.idx + ']' : 'id:' + n.id}</div>
        <div class="text-[10.5px] font-extrabold">${currentMode === 'standard' ? 'ID ' + n.id : '→ ' + n.idx}</div>
      </div>
    `;
  });

  const queueBadges = heap.length > 0
    ? heap
        .map((item, idx) => {
          const cls = idx === 0
            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
            : 'bg-slate-900 border-slate-700 text-slate-300';
          return `<span class="px-2 py-0.5 rounded border text-[10.5px] mono ${cls}">${idx === 0 ? 'Root: ' : ''}($${item.cost}, idx:${item.uIdx})</span>`.replace('$', '');
        })
        .join('')
    : '<span class="text-[11px] text-slate-500 italic">PQ Kosong (Selesai)</span>';

  const lookupHeader = currentMode === 'standard'
    ? `<span class="text-rose-300 font-bold">Pemindaian Linear G.m_routers[0..12] oleh getRouterIndex(${targetId || '...'}):</span> <span class="mono text-amber-300">${frame.lookupCostThisStep ? '+' + frame.lookupCostThisStep + ' op (O(n))' : 'Menunggu cek sisi'}</span>`
    : `<span class="text-emerald-300 font-bold">Hash Map routerIndexMap.get(${targetId || '...'}):</span> <span class="mono text-emerald-300">${frame.lookupCostThisStep ? '+1 op (Instan O(1)!)' : 'Siap O(1)'}</span>`;

  box.innerHTML = `
    <div class="w-full space-y-2">
      <div class="text-[11px] flex flex-wrap items-center justify-between gap-1">
        ${lookupHeader}
      </div>
      <div class="grid grid-cols-7 sm:grid-cols-13 gap-1">
        ${lookupCells}
      </div>
      <div class="pt-2 border-t border-slate-800/90 flex flex-wrap items-center gap-1.5">
        <span class="text-[10px] text-sky-300 uppercase font-bold mr-1">Isi Min-Heap PQ (d, uIdx):</span>
        ${queueBadges}
      </div>
    </div>
  `;
}

function renderDistArrayCards(frame) {
  const grid = document.getElementById('distArrayGrid');
  grid.innerHTML = '';

  nodesData.forEach((n) => {
    const d = frame.dist[n.id];
    const p = frame.parent[n.id];
    const isVis = frame.visited[n.id];
    const isCurrU = String(frame.u).includes(`N${n.id})`) && !frame.showFinalPath;
    const isRelaxed = frame.relaxedNodeId === n.id;

    let cardCls = 'bg-slate-950 border-slate-800';
    if (!n.active) {
      cardCls = 'bg-rose-950/40 border-rose-500/40';
    } else if (isRelaxed) {
      cardCls = 'bg-emerald-950/70 border-emerald-400 ring-1 ring-emerald-400';
    } else if (isCurrU) {
      cardCls = 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400';
    } else if (isVis) {
      cardCls = 'bg-emerald-950/30 border-emerald-500/40';
    }

    const card = document.createElement('div');
    card.className = `p-2 rounded-xl border text-center mono transition ${cardCls}`;
    card.innerHTML = `
      <div class="text-[10px] font-bold text-slate-400 flex items-center justify-between">
        <span>idx:${n.idx}</span>
        <span class="text-white">ID:${n.id}</span>
      </div>
      <div class="text-xs sm:text-sm font-extrabold mt-1 ${!n.active ? 'text-rose-400' : d === INF ? 'text-slate-500' : 'text-emerald-300'}">
        ${!n.active ? 'DOWN' : d === INF ? 'INF' : d}
      </div>
      <div class="text-[9.5px] text-sky-300 mt-0.5">
        ${p && p !== -1 ? 'pIdx:' + (p - 1) : n.id === sourceNode ? 'srcIdx' : 'p:-1'}
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderNodeToggleButtons() {
  const container = document.getElementById('nodeToggleButtons');
  container.innerHTML = '';

  nodesData.forEach((n) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `py-1.5 px-2 rounded-lg text-xs font-bold border mono transition ${
      n.active
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
    }`;
    btn.textContent = `N${n.id} ${n.active ? 'ON' : 'OFF'}`;
    btn.addEventListener('click', () => {
      n.active = !n.active;
      recomputeAllTraces(true);
    });
    container.appendChild(btn);
  });
}

// =========================================================================
// 7. KONTROL PEMUTAR ANIMASI & EVENT LISTENERS
// =========================================================================
function startAnimation() {
  if (playTimer) {
    stopAnimation();
    return;
  }
  if (currentFrameIdx >= activeFrames.length - 1) {
    currentFrameIdx = 0;
    renderCurrentFrame();
  }
  const btn = document.getElementById('btnPlayPause');
  btn.textContent = '⏸ Pause Animasi';
  btn.className = 'px-4 py-1.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow transition';

  playTimer = setInterval(() => {
    if (currentFrameIdx < activeFrames.length - 1) {
      currentFrameIdx++;
      renderCurrentFrame();
    } else {
      stopAnimation();
    }
  }, playSpeedMs);
}

function stopAnimation() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  const btn = document.getElementById('btnPlayPause');
  if (btn) {
    btn.textContent = '▶ Play Animasi';
    btn.className = 'px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow transition';
  }
}

function switchAlgorithmMode(mode) {
  currentMode = mode;
  activeFrames = currentMode === 'standard' ? traceStandard.frames : traceMinHeap.frames;
  currentFrameIdx = 0;

  const slider = document.getElementById('stepSlider');
  if (slider) {
    slider.max = String(Math.max(0, activeFrames.length - 1));
    slider.value = '0';
  }

  renderScoreboardAndModeUI();
  renderCodePanelStructure();
  renderCurrentFrame();
  startAnimation();
}

function applyScenario(type) {
  nodesData.forEach((n) => { n.active = true; });
  edgesData.forEach((e) => { e.active = true; });

  if (type === 'cut58') {
    edgesData[10].active = false;
  } else if (type === 'down8') {
    getNodeById(8).active = false;
  } else if (type === 'down56') {
    getNodeById(5).active = false;
    getNodeById(6).active = false;
  }
  recomputeAllTraces(false);
  startAnimation();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnModeStandard').addEventListener('click', () => switchAlgorithmMode('standard'));
  document.getElementById('btnModeMinHeap').addEventListener('click', () => switchAlgorithmMode('minheap'));

  document.getElementById('selectSource').addEventListener('change', (e) => {
    sourceNode = parseInt(e.target.value, 10);
    recomputeAllTraces(false);
  });

  document.getElementById('selectDest').addEventListener('change', (e) => {
    destNode = parseInt(e.target.value, 10);
    recomputeAllTraces(false);
  });

  document.getElementById('btnSwapNodes').addEventListener('click', () => {
    const tmp = sourceNode;
    sourceNode = destNode;
    destNode = tmp;
    document.getElementById('selectSource').value = String(sourceNode);
    document.getElementById('selectDest').value = String(destNode);
    recomputeAllTraces(false);
  });

  document.getElementById('btnPresetNormal').addEventListener('click', () => applyScenario('normal'));
  document.getElementById('btnPresetCut58').addEventListener('click', () => applyScenario('cut58'));
  document.getElementById('btnPresetDown8').addEventListener('click', () => applyScenario('down8'));
  document.getElementById('btnPresetDown56').addEventListener('click', () => applyScenario('down56'));
  document.getElementById('btnResetAllOn').addEventListener('click', () => applyScenario('normal'));

  document.getElementById('btnPlayPause').addEventListener('click', () => startAnimation());

  document.getElementById('btnStepStart').addEventListener('click', () => {
    stopAnimation();
    currentFrameIdx = 0;
    renderCurrentFrame();
  });

  document.getElementById('btnStepPrev').addEventListener('click', () => {
    stopAnimation();
    if (currentFrameIdx > 0) {
      currentFrameIdx--;
      renderCurrentFrame();
    }
  });

  document.getElementById('btnStepNext').addEventListener('click', () => {
    stopAnimation();
    if (currentFrameIdx < activeFrames.length - 1) {
      currentFrameIdx++;
      renderCurrentFrame();
    }
  });

  document.getElementById('btnStepEnd').addEventListener('click', () => {
    stopAnimation();
    currentFrameIdx = activeFrames.length - 1;
    renderCurrentFrame();
  });

  document.getElementById('stepSlider').addEventListener('input', (e) => {
    stopAnimation();
    currentFrameIdx = parseInt(e.target.value, 10);
    renderCurrentFrame();
  });

  document.getElementById('selectSpeed').addEventListener('change', (e) => {
    playSpeedMs = parseInt(e.target.value, 10);
    if (playTimer) {
      stopAnimation();
      startAnimation();
    }
  });

  recomputeAllTraces(true);
});
