import { KanbanBoard } from './kanbanBoard.js';

const kanbanBoard = new KanbanBoard();

document.getElementById('add-column-btn').addEventListener('click', () => kanbanBoard.openColumnModal());
document.getElementById('export-btn').addEventListener('click', () => kanbanBoard.exportData());
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-input').click());
document.getElementById('import-input').addEventListener('change', (e) => kanbanBoard.importData(e.target.files[0]));
document.getElementById('generate-report-btn').addEventListener('click', () => {
    const reportContent = kanbanBoard.generateReport();
    document.getElementById('report-content').textContent = reportContent;
    document.getElementById('report-modal').style.display = 'block';
});

kanbanBoard.init();

// Make kanbanBoard globally accessible for inline event handlers
window.kanbanBoard = kanbanBoard;