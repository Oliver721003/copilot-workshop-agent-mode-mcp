// 以 localStorage 儲存的鍵值
const STORAGE_KEY = "todos";
const THEME_KEY = "theme"; // 'light'|'dark' 或未設定

// 暫存資料
let todos = [];
let currentFilter = "all"; // 篩選狀態: all | active | done

// 取得 DOM 元素
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const emptyTip = document.getElementById("empty-tip");
const statusTip = document.getElementById("status-tip");
const countEl = document.getElementById("incomplete-count");
const themeToggle = document.getElementById("theme-toggle");
const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
let statusTipTimer = null;

// 讀取 localStorage
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch (e) {
    // 若解析失敗則重置
    todos = [];
  }
}

// 讀取並套用主題（若使用者未設定則跟隨系統偏好）
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  // 如果使用者曾經手動選過，就以儲存值為準
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
  } else {
    // 跟隨作業系統偏好
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
    // 若使用者從未手動切換，監聽系統變更以同步（直到使用者手動切換）
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener &&
      mq.addEventListener("change", (e) => {
        const stillSaved = localStorage.getItem(THEME_KEY);
        if (!stillSaved) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }
}

// 儲存使用者選擇並套用
function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

// 套用主題並更新按鈕文字（按鈕文字顯示要切換到的模式）
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ 淺色模式";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙 深色模式";
  }
}

// 儲存到 localStorage
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function showStatus(message) {
  if (statusTipTimer) {
    clearTimeout(statusTipTimer);
  }

  statusTip.textContent = message;
  statusTip.hidden = false;
  statusTipTimer = window.setTimeout(() => {
    statusTip.hidden = true;
    statusTipTimer = null;
  }, 3500);
}

// 更新未完成數量顯示
function updateCount() {
  const incomplete = todos.filter((t) => !t.done).length;
  countEl.textContent = `未完成: ${incomplete} 項`;
}

// 產生唯一 id
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 渲染清單
function render() {
  listEl.innerHTML = "";
  // 根據 currentFilter 決定要顯示的項目
  const filtered = todos.filter((t) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "active") return !t.done;
    if (currentFilter === "done") return t.done;
    return true;
  });

  // 顯示對應的空提示文字
  if (filtered.length === 0) {
    emptyTip.style.display = "block";
    if (currentFilter === "all")
      emptyTip.textContent = "還沒有任何待辦事項,新增一個吧!";
    else if (currentFilter === "active")
      emptyTip.textContent = "目前沒有未完成的待辦事項";
    else if (currentFilter === "done")
      emptyTip.textContent = "目前沒有已完成的待辦事項";
  } else {
    emptyTip.style.display = "none";
  }

  filtered.forEach((item) => {
    const li = document.createElement("li");
    // 左側區塊：勾選 + 文字
    const left = document.createElement("div");
    left.className = "todo-left";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!item.done;
    cb.dataset.id = item.id;

    const txt = document.createElement("span");
    txt.className = "todo-text";
    if (item.done) txt.classList.add("done");
    txt.textContent = item.text;

    left.appendChild(cb);
    left.appendChild(txt);

    // 右側刪除按鈕
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "刪除";
    del.dataset.id = item.id;

    li.appendChild(left);
    li.appendChild(del);
    listEl.appendChild(li);
  });

  updateCount();
}

// 新增待辦
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return; // 空白不新增

  todos.unshift({ id: uid(), text: trimmed, done: false });
  saveTodos();
  render();
}

// 切換完成狀態
function toggleDone(id, done) {
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return;
  todos[idx].done = done;
  saveTodos();
  render();
}

// 刪除待辦
function removeTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

// 監聽表單提交 (按新增或 Enter)
form.addEventListener("submit", function (e) {
  e.preventDefault();
  addTodo(input.value);
  input.value = "";
  input.focus();
});

// 事件代理處理勾選與刪除
listEl.addEventListener("click", function (e) {
  const target = e.target;

  // 刪除按鈕
  if (target.matches(".delete-btn")) {
    const id = target.dataset.id;
    removeTodo(id);
    return;
  }
});

// 勾選狀態變更
listEl.addEventListener("change", function (e) {
  const target = e.target;
  if (target.matches('input[type="checkbox"]')) {
    const id = target.dataset.id;
    const done = target.checked;
    toggleDone(id, done);
    if (
      (currentFilter === "active" && done) ||
      (currentFilter === "done" && !done)
    ) {
      showStatus(
        "該項目已更新，但目前的篩選條件會隱藏它；切換到「全部」可查看。"
      );
    }
  }
});

// 初始載入
document.addEventListener("DOMContentLoaded", () => {
  loadTodos();
  // 初始化主題（會依 localStorage 或系統偏好）
  initTheme();

  // 篩選按鈕事件
  filterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    })
  );

  // 主題按鈕
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  });

  render();
});
