const kanbanBoard = document.getElementById('kanban-board');
const modal = document.getElementById('task-modal');
const closeBtn = document.getElementsByClassName('close')[0];
const taskForm = document.getElementById('task-form');

let tasks = JSON.parse(localStorage.getItem('tasks')) || {};

const columns = ['todo', 'in-progress', 'done'];

function createKanbanBoard() {
    columns.forEach(column => {
        const columnElement = document.createElement('div');
        columnElement.className = 'column';
        columnElement.id = column;
        columnElement.innerHTML = `
            <h2>${column.replace('-', ' ').toUpperCase()}</h2>
            <div class="tasks" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
            <div class="add-task">
                <button onclick="openModal('${column}')">Add Task</button>
            </div>
        `;
        kanbanBoard.appendChild(columnElement);
    });
}

function renderTasks() {
    columns.forEach(column => {
        const tasksContainer = document.querySelector(`#${column} .tasks`);
        tasksContainer.innerHTML = '';
        if (tasks[column]) {
            tasks[column].forEach(task => {
                const taskElement = createTaskElement(task);
                tasksContainer.appendChild(taskElement);
            });
        }
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task priority-${task.priority}`;
    taskElement.draggable = true;
    taskElement.ondragstart = drag;
    taskElement.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-meta">
            <span>Due: ${task.dueDate}</span>
            <span>Priority: ${task.priority}</span>
        </div>
    `;
    return taskElement;
}

function openModal(column) {
    modal.style.display = 'block';
    taskForm.onsubmit = (e) => saveTask(e, column);
}

closeBtn.onclick = () => {
    modal.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function saveTask(e, column) {
    e.preventDefault();
    const task = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        dueDate: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value
    };
    if (!tasks[column]) {
        tasks[column] = [];
    }
    tasks[column].push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    modal.style.display = 'none';
    taskForm.reset();
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData('text', event.target.innerHTML);
    event.dataTransfer.setData('sourceColumn', event.target.closest('.column').id);
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text');
    const sourceColumn = event.dataTransfer.getData('sourceColumn');
    const targetColumn = event.target.closest('.column').id;
    
    if (sourceColumn !== targetColumn) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.draggable = true;
        taskElement.ondragstart = drag;
        taskElement.innerHTML = data;
        
        event.target.closest('.tasks').appendChild(taskElement);
        
        const taskIndex = tasks[sourceColumn].findIndex(task => task.title === taskElement.querySelector('h3').textContent);
        const [task] = tasks[sourceColumn].splice(taskIndex, 1);
        if (!tasks[targetColumn]) {
            tasks[targetColumn] = [];
        }
        tasks[targetColumn].push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

createKanbanBoard();
renderTasks();