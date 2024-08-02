import { KanbanBoard } from './kanbanBoard.js';

const kanbanBoard = new KanbanBoard();

document.addEventListener('DOMContentLoaded', () => {
    kanbanBoard.init();

    // Event listeners for main functionality
    document.getElementById('add-task-btn').addEventListener('click', () => kanbanBoard.openTaskModal());
    document.getElementById('add-column-btn').addEventListener('click', () => kanbanBoard.openColumnModal());
    document.getElementById('export-btn').addEventListener('click', () => kanbanBoard.exportData());
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-input').click());
    document.getElementById('import-input').addEventListener('change', (e) => kanbanBoard.importData(e.target.files[0]));
    document.getElementById('generate-report-btn').addEventListener('click', () => kanbanBoard.generateAndShowReport());
    document.getElementById('toggle-theme-btn').addEventListener('click', () => kanbanBoard.toggleTheme());

    // Advanced search functionality
    document.getElementById('advanced-search-btn').addEventListener('click', () => kanbanBoard.openAdvancedSearchModal());
    document.getElementById('advanced-search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        kanbanBoard.performAdvancedSearch();
    });

    // Settings functionality
    document.getElementById('settings-link').addEventListener('click', () => kanbanBoard.openSettingsModal());
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        kanbanBoard.saveSettings();
    });

    // Initialize date pickers
    flatpickr("#task-due-date", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        minDate: "today",
    });

    flatpickr("#search-due-date", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Initialize tooltips
    tippy('[data-tippy-content]');

    // Initialize drag and drop
    const drake = dragula([...document.querySelectorAll('.column .tasks')]);
    drake.on('drop', (el, target, source) => {
        kanbanBoard.handleTaskMove(el, target, source);
    });
});

// Make kanbanBoard globally accessible for inline event handlers
window.kanbanBoard = kanbanBoard;