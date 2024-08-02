function addTask(columnId) {
    const input = document.getElementById(`new-${columnId}-task`);
    const taskText = input.value.trim();
    if (taskText) {
        const tasksContainer = document.querySelector(`#${columnId} .tasks`);
        const taskElement = createTaskElement(taskText);
        tasksContainer.appendChild(taskElement);
        input.value = '';
    }
}

function createTaskElement(text) {
    const task = document.createElement('div');
    task.className = 'task';
    task.draggable = true;
    task.textContent = text;
    task.ondragstart = drag;
    return task;
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData('text', event.target.id);
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text');
    const task = document.getElementById(taskId);
    event.target.closest('.tasks').appendChild(task);
}

// Initialize with some tasks
document.addEventListener('DOMContentLoaded', () => {
    const todoTasks = document.querySelector('#todo .tasks');
    todoTasks.appendChild(createTaskElement('Task 1'));
    todoTasks.appendChild(createTaskElement('Task 2'));
    todoTasks.appendChild(createTaskElement('Task 3'));
});