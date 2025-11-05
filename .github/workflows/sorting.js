const canvas = document.getElementById("visualCanvas");
const ctx = canvas.getContext("2d");

let data = [];
let sorting = false;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 색상 보간 (inferno 유사)
function interpolateColor(value, min, max) {
  const ratio = (value - min) / (max - min || 1);
  const r = 255;
  const g = Math.floor(80 + ratio * 175);
  const b = Math.floor(0 + ratio * 50);
  return `rgb(${r},${g},${b})`;
}

// ===== 소리 =====
function playTone(freq, duration = 0.05) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// ===== 그래프 그리기 =====
function drawGraph(values, highlight = []) {
  const width = canvas.width;
  const height = canvas.height;
  const n = values.length;
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const barWidth = width / n;

  ctx.fillStyle = "rgb(10,0,0)";
  ctx.fillRect(0, 0, width, height);

  // 샘플링 비율 (예: 1000개 이상이면 일부만 그림)
  const step = n > 1000 ? Math.ceil(n / 1000) : 1;

  for (let i = 0; i < n; i += step) {
    const val = values[i];
    const color = highlight.includes(i)
      ? "white"
      : interpolateColor(val, minVal, maxVal);
    const barHeight = (val - minVal) / (maxVal - minVal + 1) * (height - 20);
    ctx.fillStyle = color;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth * step, barHeight);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ 정렬 알고리즘들 ============

// 1️⃣ 버블 정렬
async function bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      drawGraph(arr, [j, j + 1]);
      playTone(arr[j] + 100);
      await sleep(10);
    }
  }
}

// 2️⃣ 삽입 정렬
async function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
      drawGraph(arr, [j, j + 1]);
      playTone(arr[j + 1] + 100);
      await sleep(10);
    }
    arr[j + 1] = key;
  }
}

// 3️⃣ 선택 정렬
async function selectionSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
      drawGraph(arr, [j, minIdx]);
      playTone(arr[j] + 100);
      await sleep(10);
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
}

// 4️⃣ 병합 정렬
async function mergeSort(arr, start = 0, end = arr.length) {
  if (end - start <= 1) return;
  const mid = Math.floor((start + end) / 2);
  await mergeSort(arr, start, mid);
  await mergeSort(arr, mid, end);
  const merged = [];
  let i = start, j = mid;
  while (i < mid && j < end) {
    if (arr[i] < arr[j]) merged.push(arr[i++]);
    else merged.push(arr[j++]);
  }
  while (i < mid) merged.push(arr[i++]);
  while (j < end) merged.push(arr[j++]);
  for (let k = 0; k < merged.length; k++) {
    arr[start + k] = merged[k];
    drawGraph(arr, [start + k]);
    playTone(arr[start + k] + 100);
    await sleep(10);
  }
}

// 5️⃣ 퀵 정렬
async function quickSort(arr, start = 0, end = arr.length - 1) {
  if (start >= end) return;
  const pivot = arr[end];
  let left = start;
  for (let i = start; i < end; i++) {
    if (arr[i] < pivot) {
      [arr[i], arr[left]] = [arr[left], arr[i]];
      drawGraph(arr, [i, left, end]);
      playTone(arr[i] + 100);
      await sleep(10);
      left++;
    }
  }
  [arr[left], arr[end]] = [arr[end], arr[left]];
  drawGraph(arr, [left]);
  playTone(arr[left] + 100);
  await sleep(20);
  await quickSort(arr, start, left - 1);
  await quickSort(arr, left + 1, end);
}

// 6️⃣ 힙 정렬
async function heapSort(arr) {
  const n = arr.length;
  const heapify = async (n, i) => {
    let largest = i;
    let l = 2 * i + 1;
    let r = 2 * i + 2;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest != i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      drawGraph(arr, [i, largest]);
      playTone(arr[i] + 100);
      await sleep(15);
      await heapify(n, largest);
    }
  };
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    drawGraph(arr, [0, i]);
    playTone(arr[i] + 100);
    await sleep(15);
    await heapify(i, 0);
  }
}

// 7️⃣ 셸 정렬
async function shellSort(arr) {
  for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < arr.length; i++) {
      let temp = arr[i];
      let j = i;
      while (j >= gap && arr[j - gap] > temp) {
        arr[j] = arr[j - gap];
        j -= gap;
        drawGraph(arr, [j, i]);
        playTone(arr[j] + 100);
        await sleep(10);
      }
      arr[j] = temp;
    }
  }
}

// 8️⃣ 칵테일 정렬
async function cocktailSort(arr) {
  let swapped = true;
  let start = 0;
  let end = arr.length;
  while (swapped) {
    swapped = false;
    for (let i = start; i < end - 1; i++) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
      drawGraph(arr, [i]);
      playTone(arr[i] + 100);
      await sleep(5);
    }
    if (!swapped) break;
    swapped = false;
    end--;
    for (let i = end - 1; i >= start; i--) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
      drawGraph(arr, [i]);
      playTone(arr[i] + 100);
      await sleep(5);
    }
    start++;
  }
}

// 9️⃣ 놈 정렬
async function gnomeSort(arr) {
  let i = 0;
  while (i < arr.length) {
    if (i === 0 || arr[i] >= arr[i - 1]) i++;
    else {
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      drawGraph(arr, [i, i - 1]);
      playTone(arr[i] + 100);
      await sleep(10);
      i--;
    }
  }
}

// 🔟 기수 정렬
async function radixSort(arr) {
  let max = Math.max(...arr);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    let output = new Array(arr.length).fill(0);
    let count = new Array(10).fill(0);
    for (let i = 0; i < arr.length; i++) count[Math.floor(arr[i] / exp) % 10]++;
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = arr.length - 1; i >= 0; i--) {
      output[count[Math.floor(arr[i] / exp) % 10] - 1] = arr[i];
      count[Math.floor(arr[i] / exp) % 10]--;
    }
    for (let i = 0; i < arr.length; i++) {
      arr[i] = output[i];
      drawGraph(arr, [i]);
      playTone(arr[i] + 100);
      await sleep(5);
    }
  }
}
// 11️⃣ 계수 정렬 (Counting Sort)
async function countingSort(arr) {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min + 1;
  const count = new Array(range).fill(0);

  for (let i = 0; i < arr.length; i++) {
    count[arr[i] - min]++;
    drawGraph(arr, [i]);
    playTone(arr[i] + 100);
    await sleep(5);
  }

  let idx = 0;
  for (let i = 0; i < range; i++) {
    while (count[i]-- > 0) {
      arr[idx++] = i + min;
      drawGraph(arr, [idx]);
      playTone(arr[idx - 1] + 100);
      await sleep(5);
    }
  }
}

// 12️⃣ 기적 정렬 (Miracle Sort - 완전히 농담용 알고리즘)
async function miracleSort(arr) {
  drawGraph(arr);
  playTone(440, 0.2);
  await sleep(200);
  // 기적적으로 정렬 완료!
  arr.sort((a, b) => a - b);
  for (let i = 0; i < arr.length; i++) {
    drawGraph(arr, [i]);
    playTone(arr[i] + 200);
    await sleep(5);
  }
}

// 13️⃣ 플래시 정렬 (Flash Sort)
async function flashSort(arr) {
  const n = arr.length;
  if (n <= 1) return;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const m = Math.floor(0.45 * n); // class 개수
  const L = new Array(m).fill(0);

  // 클래스 카운트
  const c = (m - 1) / (max - min);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(c * (arr[i] - min));
    L[k]++;
  }

  for (let k = 1; k < m; k++) L[k] += L[k - 1];

  let moves = 0;
  let j = 0;
  let k = m - 1;
  while (moves < n - 1) {
    while (j > L[k] - 1) {
      j++;
      k = Math.floor(c * (arr[j] - min));
    }
    let flash = arr[j];
    while (j !== L[k]) {
      k = Math.floor(c * (flash - min));
      const hold = arr[L[k] - 1];
      arr[L[k] - 1] = flash;
      flash = hold;
      L[k]--;
      moves++;
      drawGraph(arr, [j, k]);
      playTone(arr[j] + 100);
      await sleep(5);
    }
  }

  // 마지막으로 삽입정렬로 정제
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
      drawGraph(arr, [j, j + 1]);
      playTone(arr[j + 1] + 120);
      await sleep(5);
    }
    arr[j + 1] = key;
  }
}

// 14️⃣ 보고 정렬 (Bogo Sort)
async function bogoSort(arr) {
  function isSorted(a) {
    for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
    return true;
  }

  let attempts = 0;
  while (!isSorted(arr)) {
    shuffle(arr);
    drawGraph(arr);
    playTone(arr[Math.floor(Math.random() * arr.length)] + 100);
    await sleep(50);
    attempts++;
    if (attempts > 2000) break; // 안전 장치
  }
  drawGraph(arr);
  playTone(800, 0.2);
}

// ====== 데이터 생성 ======
function generateData(type, n) {
  let arr = [];
  if (type === "random") {
    for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 400));
  } else {
    arr = Array.from({ length: n }, (_, i) => i * 4);
    shuffle(arr);
  }
  return arr;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ====== UI 연결 ======
const startBtn = document.getElementById("startBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const dataTypeSelect = document.getElementById("dataType");
const numBarsInput = document.getElementById("numBars");
const algoSelect = document.getElementById("algorithm");

function init() {
  const n = parseInt(numBarsInput.value);
  const type = dataTypeSelect.value;
  data = generateData(type, n);
  drawGraph(data);
}

startBtn.onclick = async () => {
  if (sorting) return;
  sorting = true;
  const algo = algoSelect.value;
  const copy = [...data];
  if (algo === "bubble") await bubbleSort(copy);
  else if (algo === "insertion") await insertionSort(copy);
  else if (algo === "selection") await selectionSort(copy);
  else if (algo === "merge") await mergeSort(copy);
  else if (algo === "quick") await quickSort(copy);
  else if (algo === "heap") await heapSort(copy);
  else if (algo === "shell") await shellSort(copy);
  else if (algo === "cocktail") await cocktailSort(copy);
  else if (algo === "gnome") await gnomeSort(copy);
  else if (algo === "radix") await radixSort(copy);
  else if (algo === "counting") await countingSort(copy);
  else if (algo === "miracle") await miracleSort(copy);
  else if (algo === "flash") await flashSort(copy);
  else if (algo === "bogo") await bogoSort(copy);

  
  sorting = false;
};

shuffleBtn.onclick = () => {
  if (sorting) return;
  init();
};

init();
