export class KanbanBoard {
    constructor() {
        this.board = document.getElementById('kanban-board');
        this.taskModal = document.getElementById('task-modal');
        this.columnModal = document.getElementById('column-modal');
        this.taskForm = document.getElementById('task-form');
        this.columnForm = document.getElementById('column-form');
        this.closeBtns = document.getElementsByClassName('close');

        this.tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        this.columns = JSON.parse(localStorage.getItem('columns')) || [
            { title: 'Todo', color: '#e0e0e0' },
            { title: 'In Progress', color: '#fff0b3' },
            { title: 'Done', color: '#b3ffb3' }
        ];

        this.draggedItem = null;
    }

    init() {
        this.createBoard();
        this.renderTasks();
        this.setupEventListeners();
    }

    createBoard() {
        this.board.innerHTML = '';
        this.columns.forEach((column, index) => {
            const columnElement = document.createElement('div');
            columnElement.className = 'column';
            columnElement.id = this.getColumnId(column.title);
            columnElement.style.backgroundColor = column.color;
            columnElement.innerHTML = `
                <h2>
                    ${column.title}
                    <button onclick="kanbanBoard.openColumnModal(${index})"><i class="fas fa-edit"></i></button>
                </h2>
                <div class="tasks" ondrop="kanbanBoard.drop(event)" ondragover="kanbanBoard.allowDrop(event)"></div>
                <div class="add-task">
                    <button onclick="kanbanBoard.openTaskModal('${column.title}')">Add Task</button>
                </div>
            `;
            this.board.appendChild(columnElement);
        });
    }

    renderTasks() {
        this.columns.forEach(column => {
            const tasksContainer = document.querySelector(`#${this.getColumnId(column.title)} .tasks`);
            tasksContainer.innerHTML = '';
            if (this.tasks[column.title]) {
                this.tasks[column.title].forEach(task => {
                    const taskElement = this.createTaskElement(task, column.title);
                    tasksContainer.appendChild(taskElement);
                });
            }
        });
    }

    createTaskElement(task, column) {
        const taskElement = document.createElement('div');
        taskElement.className = `task priority-${task.priority}`;
        taskElement.draggable = true;
        taskElement.ondragstart = (e) => this.drag(e);
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
            ${task.attachment ? `<div><i class="fas fa-paperclip attachment-icon"></i>${task.attachment.name}</div>` : ''}
            <div class="task-actions">
                <button class="edit-task" onclick="kanbanBoard.openTaskModal('${column}', ${task.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-task" onclick="kanbanBoard.deleteTask('${column}', ${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        return taskElement;
    }

    openTaskModal(column, taskId = null) {
        this.taskModal.style.display = 'block';
        document.getElementById('modal-title').textContent = taskId ? 'Edit Task' : 'Add Task';
        if (taskId) {
            const task = this.tasks[column].find(t => t.id === taskId);
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-tags').value = task.tags.join(', ');
        } else {
            this.taskForm.reset();
        }
        this.taskForm.onsubmit = (e) => this.saveTask(e, column, taskId);
    }

    saveTask(e, column, taskId = null) {
        e.preventDefault();
        const task = {
            id: taskId || Date.now(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            tags: document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            attachment: document.getElementById('task-attachment').files[0] || null
        };
        if (!this.tasks[column]) {
            this.tasks[column] = [];
        }
        if (taskId) {
            const index = this.tasks[column].findIndex(t => t.id === taskId);
            this.tasks[column][index] = task;
        } else {
            this.tasks[column].push(task);
        }
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
        this.taskModal.style.display = 'none';
    }

    deleteTask(column, taskId) {
        this.tasks[column] = this.tasks[column].filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
    }

    openColumnModal(columnIndex = null) {
        this.columnModal.style.display = 'block';
        if (columnIndex !== null) {
            const column = this.columns[columnIndex];
            document.getElementById('column-title').value = column.title;
            document.getElementById('column-color').value = column.color;
        } else {
            this.columnForm.reset();
        }
        this.columnForm.onsubmit = (e) => this.saveColumn(e, columnIndex);
    }

    saveColumn(e, columnIndex = null) {
        e.preventDefault();
        const column = {
            title: document.getElementById('column-title').value,
            color: document.getElementById('column-color').value
        };
        if (columnIndex !== null) {
            this.columns[columnIndex] = column;
        } else {
            this.columns.push(column);
        }
        localStorage.setItem('columns', JSON.stringify(this.columns));
        this.createBoard();
        this.renderTasks();
        this.columnModal.style.display = 'none';
    }

    allowDrop(event) {
        event.preventDefault();
    }

    drag(event) {
        this.draggedItem = event.target;
    }

    drop(event) {
        event.preventDefault();
        const sourceColumn = this.draggedItem.closest('.column').id;
        const targetColumn = event.target.closest('.column').id;
        
        if (sourceColumn !== targetColumn) {
            event.target.closest('.tasks').appendChild(this.draggedItem);
            
            const sourceColumnName = this.getColumnTitle(sourceColumn);
            const targetColumnName = this.getColumnTitle(targetColumn);
            const taskId = parseInt(this.draggedItem.querySelector('.task-actions button').onclick.toString().match(/\d+/)[0]);
            const taskIndex = this.tasks[sourceColumnName].findIndex(task => task.id === taskId);
            const [task] = this.tasks[sourceColumnName].splice(taskIndex, 1);
            if (!this.tasks[targetColumnName]) {
                this.tasks[targetColumnName] = [];
            }
            this.tasks[targetColumnName].push(task);
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.renderTasks();
        }
    }

    getColumnId(title) {
        return title.toLowerCase().replace(/ /g, '-');
    }

    getColumnTitle(id) {
        return this.columns.find(col => this.getColumnId(col.title) === id).title;
    }

    exportData() {
        const data = {
            tasks: this.tasks,
            columns: this.columns
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "kanban_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            this.tasks = data.tasks;
            this.columns = data.columns;
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            localStorage.setItem('columns', JSON.stringify(this.columns));
            this.createBoard();
            this.renderTasks();
        };
        reader.readAsText(file);
    }

    setupEventListeners() {
        Array.from(this.closeBtns).forEach(btn => {
            btn.onclick = () => {
                this.taskModal.style.display = 'none';
                this.columnModal.style.display = 'none';
            }
        });

        window.onclick = (event) => {
            if (event.target == this.taskModal) {
                this.taskModal.style.display = 'none';
            }
            if (event.target == this.columnModal) {
                this.columnModal.style.display = 'none';
            }
        }

        // Add event listener for task search
        document.getElementById('task-search').addEventListener('input', (e) => this.searchTasks(e.target.value));
    }

    searchTasks(query) {
        query = query.toLowerCase();
        Object.keys(this.tasks).forEach(column => {
            const tasksContainer = document.querySelector(`#${this.getColumnId(column)} .tasks`);
            this.tasks[column].forEach(task => {
                const taskElement = tasksContainer.querySelector(`[data-task-id="${task.id}"]`);
                if (task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)) {
                    taskElement.style.display = '';
                } else {
                    taskElement.style.display = 'none';
                }
            });
        });
    }

    addCommentToTask(column, taskId, comment) {
        const task = this.tasks[column].find(t => t.id === taskId);
        if (!task.comments) {
            task.comments = [];
        }
        task.comments.push({
            id: Date.now(),
            text: comment,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
    }

    deleteComment(column, taskId, commentId) {
        const task = this.tasks[column].find(t => t.id === taskId);
        task.comments = task.comments.filter(comment => comment.id !== commentId);
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
    }

    sortTasks(column, sortBy) {
        this.tasks[column].sort((a, b) => {
            if (sortBy === 'dueDate') {
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (sortBy === 'priority') {
                const priorityOrder = { low: 1, medium: 2, high: 3 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
        });
        this.renderTasks();
    }

    filterTasks(column, filterBy, value) {
        const tasksContainer = document.querySelector(`#${this.getColumnId(column)} .tasks`);
        this.tasks[column].forEach(task => {
            const taskElement = tasksContainer.querySelector(`[data-task-id="${task.id}"]`);
            if (filterBy === 'priority') {
                taskElement.style.display = task.priority === value ? '' : 'none';
            } else if (filterBy === 'tag') {
                taskElement.style.display = task.tags.includes(value) ? '' : 'none';
            }
        });
    }

    generateReport() {
        let report = 'Kanban Board Report\n\n';
        this.columns.forEach(column => {
            report += `${column.title}:\n`;
            report += `Total tasks: ${this.tasks[column.title].length}\n`;
            const priorities = { low: 0, medium: 0, high: 0 };
            this.tasks[column.title].forEach(task => {
                priorities[task.priority]++;
            });
            report += `Priorities: Low (${priorities.low}), Medium (${priorities.medium}), High (${priorities.high})\n\n`;
        });
        return report;
    }
}