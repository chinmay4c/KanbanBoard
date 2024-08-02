const kanbanBoard = document.getElementById('kanban-board');
const taskModal = document.getElementById('task-modal');
const columnModal = document.getElementById('column-modal');
const closeBtns = document.getElementsByClassName('close');
const taskForm = document.getElementById('task-form');
const columnForm = document.getElementById('column-form');
const addColumnBtn = document.getElementById('add-column-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let columns = JSON.parse(localStorage.getItem('columns')) || ['Todo', 'In Progress', 'Done'];

function createKanbanBoard() {
    kanbanBoard.innerHTML = '';
    columns.forEach(column => {
        const columnElement = document.createElement('div');
        columnElement.className = 'column';
        columnElement.id = column.toLowerCase().replace(/ /g, '-');
        columnElement.innerHTML = `
            <h2>${column}</h2>
            <div class="tasks" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
            <div class="add-task">
                <button onclick="openTaskModal('${column}')">Add Task</button>
            </div>
        `;
        kanbanBoard.appendChild(columnElement);
    });
}

function renderTasks() {
    columns.forEach(column => {
        const tasksContainer = document.querySelector(`#${column.toLowerCase().replace(/ /g, '-')} .tasks`);
        tasksContainer.innerHTML = '';
        if (tasks[column]) {
            tasks[column].forEach(task => {
                const taskElement = createTaskElement(task, column);
                tasksContainer.appendChild(taskElement);
            });
        }
    });
}

function createTaskElement(task, column) {
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
        <div class="task-tags">
            ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="task-actions">
            <button class="edit-task" onclick="openTaskModal('${column}', ${task.id})"><i class="fas fa-edit"></i></button>
            <button class="delete-task" onclick="deleteTask('${column}', ${task.id})"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return taskElement;
}

function openTaskModal(column, taskId = null) {
    taskModal.style.display = 'block';
    document.getElementById('modal-title').textContent = taskId ? 'Edit Task' : 'Add Task';
    if (taskId) {
        const task = tasks[column].find(t => t.id === taskId);
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-due-date').value = task.dueDate;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-tags').value = task.tags.join(', ');
    } else {
        taskForm.reset();
    }
    taskForm.onsubmit = (e) => saveTask(e, column, taskId);
}

function saveTask(e, column, taskId = null) {
    e.preventDefault();
    const task = {
        id: taskId || Date.now(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        dueDate: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value,
        tags: document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    if (!tasks[column]) {
        tasks[column] = [];
    }
    if (taskId) {
        const index = tasks[column].findIndex(t => t.id === taskId);
        tasks[column][index] = task;
    } else {
        tasks[column].push(task);
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    taskModal.style.display = 'none';
}

function deleteTask(column, taskId) {
    tasks[column] = tasks[column].filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
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
        
        const sourceColumnName = columns.find(col => col.toLowerCase().replace(/ /g, '-') === sourceColumn);
        const targetColumnName = columns.find(col => col.toLowerCase().replace(/ /g, '-') === targetColumn);
        const taskIndex = tasks[sourceColumnName].findIndex(task => task.title === taskElement.querySelector('h3').textContent);
        const [task] = tasks[sourceColumnName].splice(taskIndex, 1);
        if (!tasks[targetColumnName]) {
            tasks[targetColumnName] = [];
        }
        tasks[targetColumnName].push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }
}

function openColumnModal() {
    columnModal.style.display = 'block';
}

function addColumn(e) {
    e.preventDefault();
    const columnTitle = document.getElementById('column-title').value;
    if (columnTitle && !columns.includes(columnTitle)) {
        columns.push(columnTitle);
        localStorage.setItem('columns', JSON.stringify(columns));
        createKanbanBoard();
        renderTasks();
        columnModal.style.display = 'none';
    }
}

addColumnBtn.onclick = openColumnModal;
columnForm.onsubmit = addColumn;

Array.from(closeBtns).forEach(btn => {
    btn.onclick = () => {
        taskModal.style.display = 'none';
        columnModal.style.display = 'none';
    }
});

window.onclick = (event) => {
    if (event.target == taskModal) {
        taskModal.style.display = 'none';
    }
    if (event.target == columnModal) {
        columnModal.style.display = 'none';
    }
}

createKanbanBoard();
renderTasks();