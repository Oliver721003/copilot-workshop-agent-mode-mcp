// 以 localStorage 儲存的鍵值
const STORAGE_KEY = "todos";

// 暫存資料
let todos = [];

// 取得 DOM 元素
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const emptyTip = document.getElementById("empty-tip");
const countEl = document.getElementById("incomplete-count");

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

// 儲存到 localStorage
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
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

  if (todos.length === 0) {
    emptyTip.style.display = "block";
  } else {
    emptyTip.style.display = "none";
  }

  todos.forEach((item) => {
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
  }
});

// 初始載入
document.addEventListener("DOMContentLoaded", () => {
  loadTodos();
  render();
});
