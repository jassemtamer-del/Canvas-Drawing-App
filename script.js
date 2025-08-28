// Get the canvas and context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match its display size
function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = window.innerHeight * 0.7;
}

// Initial canvas setup
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 5;

// Get UI elements
const brushSizeInput = document.getElementById('brush-size');
const sizeDisplay = document.getElementById('size-display');
const colorPicker = document.getElementById('color-picker');
const brushTool = document.getElementById('brush-tool');
const eraserTool = document.getElementById('eraser-tool');
const clearCanvasBtn = document.getElementById('clear-canvas');
const downloadCanvasBtn = document.getElementById('download-canvas');

// Update brush size
brushSizeInput.addEventListener('input', () => {
    currentSize = brushSizeInput.value;
    sizeDisplay.textContent = currentSize;
});

// Update color
colorPicker.addEventListener('change', () => {
    currentColor = colorPicker.value;
});

// Tool selection
brushTool.addEventListener('click', () => {
    currentTool = 'brush';
    brushTool.classList.add('active');
    eraserTool.classList.remove('active');
    canvas.style.cursor = 'crosshair';
});

eraserTool.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserTool.classList.add('active');
    brushTool.classList.remove('active');
    canvas.style.cursor = 'grab';
});

// Clear canvas
clearCanvasBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

// Download canvas
downloadCanvasBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';

    if (currentTool === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    } else {
        ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
    }
}

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});