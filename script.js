
"use strict";

// 1. Select HTML elements
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const submitButton = document.getElementById("submit-button");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const totalCount = document.getElementById("total-count");
const emptyState = document.getElementById("empty-state");
const message = document.getElementById("message");
const clearCompletedButton =
  document.getElementById("clear-completed");
const filterButtons = document.querySelector(".filters");

// 2. Application state
const STORAGE_KEY = "todo-list-tasks";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      task =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("Could not load tasks:", error);
    return [];
  }
}

let tasks = loadTasks();
let currentFilter = "all";
let editingId = null;

// 3. Save state to localStorage
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks:", error);
    showMessage("Tasks could not be saved in this browser.");
  }
}

// 4. Display a short status message
function showMessage(text) {
  message.textContent = text;
}

// 5. Create a new task
function addTask(text) {
  const task = {
    id: crypto.randomUUID(),
    text: text,
    completed: false
  };

  tasks.unshift(task);
  saveTasks();
  renderTasks();
  showMessage("Task added successfully!");
}

// 6. Update a task's text
function updateTask(id, newText) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  task.text = newText;
  saveTasks();
  renderTasks();
  showMessage("Task updated successfully!");
}

// 7. Delete a task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);

  if (editingId === id) {
    editingId = null;
    taskInput.value = "";
    submitButton.textContent = "+ Add Task";
  }

  saveTasks();
  renderTasks();
  showMessage("Task deleted.");
}

// 8. Mark a task complete or active
function toggleTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  showMessage(task.completed ? "Task completed!" : "Task marked active.");
}

// 9. Show tasks according to the selected filter
function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter(task => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter(task => task.completed);
  }

  return tasks;
}

// 10. Render tasks dynamically
function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = getVisibleTasks();
  const activeCount = tasks.filter(task => !task.completed).length;

  taskCount.textContent = `${activeCount} task${activeCount !== 1 ? "s" : ""} left`;
  totalCount.textContent = `${tasks.length} total task${tasks.length !== 1 ? "s" : ""}`;

  emptyState.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyState.querySelector("h3").textContent = "No tasks yet";
    emptyState.querySelector("p").textContent =
      "Add a task above to get started.";
  } else if (visibleTasks.length === 0) {
    emptyState.querySelector("h3").textContent = "Nothing to show";
    emptyState.querySelector("p").textContent =
      "Try another filter to see your tasks.";
  }

  visibleTasks.forEach(task => {
    // Create each list item
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    if (task.completed) {
      li.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", `Complete ${task.text}`);

    // Task text
    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button";
    editButton.dataset.action = "edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${task.text}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

    actions.append(editButton, deleteButton);
    li.append(checkbox, span, actions);
    taskList.appendChild(li);
  });

  // Update selected filter appearance
  filterButtons.querySelectorAll(".filter").forEach(button => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

// 11. Handle add and edit form submissions
taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) {
    showMessage("Please enter a task.");
    return;
  }

  if (editingId !== null) {
    updateTask(editingId, text);
    editingId = null;
    submitButton.textContent = "+ Add Task";
  } else {
    addTask(text);
  }

  taskInput.value = "";
  taskInput.focus();
});

// 12. Event delegation for task actions
taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button || !taskList.contains(button)) return;

  const li = button.closest(".task-item");
  const id = li?.dataset.id;

  if (!id) return;

  if (button.dataset.action === "edit") {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingId = id;
    taskInput.value = task.text;
    submitButton.textContent = "Save Changes";
    taskInput.focus();
    showMessage("Edit your task, then select Save Changes.");
  }

  if (button.dataset.action === "delete") {
    deleteTask(id);
  }
});

// Delegate checkbox changes from the task list
taskList.addEventListener("change", event => {
  const checkbox = event.target;

  if (!checkbox.matches('input[data-action="toggle"]')) return;

  const id = checkbox.closest(".task-item")?.dataset.id;

  if (id) toggleTask(id);
});

// 13. Filter tasks
filterButtons.addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");

  if (!button || !filterButtons.contains(button)) return;

  currentFilter = button.dataset.filter;
  renderTasks();
});

// 14. Remove all completed tasks
clearCompletedButton.addEventListener("click", () => {
  const completedCount = tasks.filter(task => task.completed).length;

  if (completedCount === 0) {
    showMessage("There are no completed tasks to clear.");
    return;
  }

  tasks = tasks.filter(task => !task.completed);

  if (editingId !== null && !tasks.some(task => task.id === editingId)) {
    editingId = null;
    taskInput.value = "";
    submitButton.textContent = "+ Add Task";
  }

  saveTasks();
  renderTasks();
  showMessage("Completed tasks cleared.");
});

// 15. Display saved tasks when the page opens
renderTasks();
