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
            { id: 'todo', title: 'Todo', color: '#e0e0e0' },
            { id: 'in-progress', title: 'In Progress', color: '#fff0b3' },
            { id: 'done', title: 'Done', color: '#b3ffb3' }
        ];
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            defaultView: 'board',
            dateFormat: 'MM/DD/YYYY',
            notifications: {
                dueDate: true,
                comments: false
            }
        };

        this.draggedItem = null;
    }

    init() {
        this.createBoard();
        this.renderTasks();
        this.setupEventListeners();
        this.initializeQuickFilters();
        this.renderTagList();
        this.applySettings();
    }

    createBoard() {
        this.board.innerHTML = '';
        this.columns.forEach((column) => {
            const columnElement = document.createElement('div');
            columnElement.className = 'column';
            columnElement.id = column.id;
            columnElement.style.backgroundColor = column.color;
            columnElement.innerHTML = `
                <div class="column-header">
                    <h2>${column.title}</h2>
                    <button onclick="kanbanBoard.openColumnModal('${column.id}')"><i class="fas fa-edit"></i></button>
                </div>
                <div class="tasks" data-column-id="${column.id}"></div>
                <button onclick="kanbanBoard.openTaskModal('${column.id}')" class="add-task-btn">Add Task</button>
            `;
            this.board.appendChild(columnElement);
        });
    }

    renderTasks() {
        this.columns.forEach(column => {
            const tasksContainer = document.querySelector(`#${column.id} .tasks`);
            tasksContainer.innerHTML = '';
            if (this.tasks[column.id]) {
                this.tasks[column.id].forEach(task => {
                    const taskElement = this.createTaskElement(task, column.id);
                    tasksContainer.appendChild(taskElement);
                });
            }
        });
    }

    createTaskElement(task, columnId) {
        const taskElement = document.createElement('div');
        taskElement.className = `task priority-${task.priority}`;
        taskElement.setAttribute('data-task-id', task.id);
        taskElement.draggable = true;
        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="task-meta">
                <span>Due: ${this.formatDate(task.dueDate)}</span>
                <span>Priority: ${task.priority}</span>
            </div>
            <div class="task-tags">
                ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            ${task.attachment ? `<div><i class="fas fa-paperclip"></i> ${task.attachment.name}</div>` : ''}
            <div class="task-actions">
                <button onclick="kanbanBoard.openTaskModal('${columnId}', '${task.id}')"><i class="fas fa-edit"></i></button>
                <button onclick="kanbanBoard.deleteTask('${columnId}', '${task.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        return taskElement;
    }

    openTaskModal(columnId, taskId = null) {
        this.taskModal.style.display = 'block';
        document.getElementById('modal-title').textContent = taskId ? 'Edit Task' : 'Add Task';
        this.taskForm.reset();
        if (taskId) {
            const task = this.tasks[columnId].find(t => t.id === taskId);
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-tags').value = task.tags.join(', ');
        }
        this.taskForm.onsubmit = (e) => this.saveTask(e, columnId, taskId);
    }

    saveTask(e, columnId, taskId = null) {
        e.preventDefault();
        const task = {
            id: taskId || Date.now().toString(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            tags: document.getElementById('task-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            attachment: document.getElementById('task-attachment').files[0] || null
        };
        if (!this.tasks[columnId]) {
            this.tasks[columnId] = [];
        }
        if (taskId) {
            const index = this.tasks[columnId].findIndex(t => t.id === taskId);
            this.tasks[columnId][index] = task;
        } else {
            this.tasks[columnId].push(task);
        }
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.renderTasks();
        this.taskModal.style.display = 'none';
        this.showNotification('Task saved successfully!');
    }

    deleteTask(columnId, taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks[columnId] = this.tasks[columnId].filter(task => task.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.renderTasks();
            this.showNotification('Task deleted successfully!');
        }
    }

    openColumnModal(columnId = null) {
        this.columnModal.style.display = 'block';
        this.columnForm.reset();
        if (columnId) {
            const column = this.columns.find(c => c.id === columnId);
            document.getElementById('column-title').value = column.title;
            document.getElementById('column-color').value = column.color;
        }
        this.columnForm.onsubmit = (e) => this.saveColumn(e, columnId);
    }

    saveColumn(e, columnId = null) {
        e.preventDefault();
        const column = {
            id: columnId || this.generateUniqueId(),
            title: document.getElementById('column-title').value,
            color: document.getElementById('column-color').value
        };
        if (columnId) {
            const index = this.columns.findIndex(c => c.id === columnId);
            this.columns[index] = column;
        } else {
            this.columns.push(column);
        }
        localStorage.setItem('columns', JSON.stringify(this.columns));
        this.createBoard();
        this.renderTasks();
        this.columnModal.style.display = 'none';
        this.showNotification('Column saved successfully!');
    }

    handleTaskMove(taskElement, targetColumn, sourceColumn) {
        const taskId = taskElement.getAttribute('data-task-id');
        const sourceColumnId = sourceColumn.getAttribute('data-column-id');
        const targetColumnId = targetColumn.getAttribute('data-column-id');
        
        const taskIndex = this.tasks[sourceColumnId].findIndex(task => task.id === taskId);
        const [task] = this.tasks[sourceColumnId].splice(taskIndex, 1);
        
        if (!this.tasks[targetColumnId]) {
            this.tasks[targetColumnId] = [];
        }
        this.tasks[targetColumnId].push(task);
        
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.showNotification('Task moved successfully!');
    }

    performAdvancedSearch() {
        const searchTitle = document.getElementById('search-title').value.toLowerCase();
        const searchDescription = document.getElementById('search-description').value.toLowerCase();
        const searchDueDate = document.getElementById('search-due-date').value;
        const searchPriority = document.getElementById('search-priority').value;
        const searchTags = document.getElementById('search-tags').value.toLowerCase().split(',').map(tag => tag.trim());

        const filteredTasks = {};
        Object.keys(this.tasks).forEach(columnId => {
            filteredTasks[columnId] = this.tasks[columnId].filter(task => {
                return (
                    (searchTitle === '' || task.title.toLowerCase().includes(searchTitle)) &&
                    (searchDescription === '' || task.description.toLowerCase().includes(searchDescription)) &&
                    (searchDueDate === '' || task.dueDate === searchDueDate) &&
                    (searchPriority === '' || task.priority === searchPriority) &&
                    (searchTags.length === 0 || searchTags.every(tag => task.tags.map(t => t.toLowerCase()).includes(tag)))
                );
            });
        });

        this.renderFilteredTasks(filteredTasks);
    }

    renderFilteredTasks(filteredTasks) {
        this.columns.forEach(column => {
            const tasksContainer = document.querySelector(`#${column.id} .tasks`);
            tasksContainer.innerHTML = '';
            if (filteredTasks[column.id]) {
                filteredTasks[column.id].forEach(task => {
                    const taskElement = this.createTaskElement(task, column.id);
                    tasksContainer.appendChild(taskElement);
                });
            }
        });
    }

    generateAndShowReport() {
        const report = this.generateReport();
        document.getElementById('report-content').innerHTML = report;
        document.getElementById('report-modal').style.display = 'block';
    }

    generateReport() {
        let report = '<h3>Kanban Board Report</h3>';
        report += '<table><tr><th>Column</th><th>Total Tasks</th><th>Low Priority</th><th>Medium Priority</th><th>High Priority</th></tr>';
        this.columns.forEach(column => {
            const columnTasks = this.tasks[column.id] || [];
            const totalTasks = columnTasks.length;
            const lowPriority = columnTasks.filter(task => task.priority === 'low').length;
            const mediumPriority = columnTasks.filter(task => task.priority === 'medium').length;
            const highPriority = columnTasks.filter(task => task.priority === 'high').length;
            report += `<tr><td>${column.title}</td><td>${totalTasks}</td><td>${lowPriority}</td><td>${mediumPriority}</td><td>${highPriority}</td></tr>`;
        });
        report += '</table>';
        return report;
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        this.showNotification('Theme toggled!');
    }

    initializeQuickFilters() {
        const quickFiltersContainer = document.getElementById('quick-filters');
        quickFiltersContainer.innerHTML = `
            <button onclick="kanbanBoard.filterTasks('all')">All Tasks</button>
            <button onclick="kanbanBoard.filterTasks('priority', 'high')">High Priority</button>
            <button onclick="kanbanBoard.filterTasks('dueDate', 'overdue')">Overdue</button>
        `;
    }

    filterTasks(filterType, value) {
        const filteredTasks = {};
        Object.keys(this.tasks).forEach(columnId => {
            filteredTasks[columnId] = this.tasks[columnId].filter(task => {
                if (filterType === 'all') return true;
                if (filterType === 'priority') return task.priority === value;
                if (filterType === 'dueDate' && value === 'overdue') {
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    return dueDate < today;
                }
                return false;
            });
        });
        this.renderFilteredTasks(filteredTasks);
    }
}
