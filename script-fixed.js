// Get the canvas and context
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match its display size
function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Initial canvas setup
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let currentSize = 5;
let startX, startY;
let fillShape = false;

// Get UI elements
const brushSizeInput = document.getElementById('brush-size');
const sizeDisplay = document.getElementById('size-display');
const colorPicker = document.getElementById('color-picker');
const fillShapeCheckbox = document.getElementById('fill-shape');
const clearCanvasBtn = document.getElementById('clear-canvas');
const saveCanvasBtn = document.getElementById('save-canvas');
const loadCanvasBtn = document.getElementById('load-canvas');
const downloadCanvasBtn = document.getElementById('download-canvas');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// Text modal elements
const textModal = document.getElementById('text-modal');
const textInput = document.getElementById('text-input');
const textApplyBtn = document.getElementById('text-apply');
const textCancelBtn = document.getElementById('text-cancel');

// Layer elements
const layersList = document.getElementById('layers-list');
const addLayerBtn = document.getElementById('add-layer');
const deleteLayerBtn = document.getElementById('delete-layer');

// Update brush size
brushSizeInput.addEventListener('input', () => {
    currentSize = brushSizeInput.value;
    sizeDisplay.textContent = currentSize;
});

// Update fill shape option
fillShapeCheckbox.addEventListener('change', () => {
    fillShape = fillShapeCheckbox.checked;
});

// Update color
colorPicker.addEventListener('change', () => {
    currentColor = colorPicker.value;
    updateActiveColorOption();
});

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // Update cursor based on tool
        switch(currentTool) {
            case 'brush':
                canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                canvas.style.cursor = 'grab';
                break;
            case 'text':
                canvas.style.cursor = 'text';
                break;
            default:
                canvas.style.cursor = 'crosshair';
        }
    });
});

// Color palette selection
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentColor = option.dataset.color;
        colorPicker.value = currentColor;
    });
});

// Update active color option when color picker changes
function updateActiveColorOption() {
    document.querySelectorAll('.color-option').forEach(option => {
        if (option.dataset.color === currentColor) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Clear canvas
clearCanvasBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
});

// Save canvas
saveCanvasBtn.addEventListener('click', () => {
    const drawingData = canvas.toDataURL();
    const data = {
        drawing: drawingData,
        timestamp: new Date().toISOString()
    };

    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${new Date().getTime()}.json`;
    link.click();

    URL.revokeObjectURL(url);
});

// Load canvas
loadCanvasBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    saveState();
                };
                img.src = data.drawing;
            } catch (error) {
                alert('Error loading file. Please make sure it is a valid drawing file.');
            }
        };
        reader.readAsText(file);
    });

    input.click();
});

// Download canvas
downloadCanvasBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `drawing-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Undo/Redo functionality
let history = [];
let historyStep = -1;

function saveState() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    history.push(canvas.toDataURL());

    // Limit history to 50 steps
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }

    updateUndoRedoButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        restoreState();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        restoreState();
    }
}

function restoreState() {
    const img = new Image();
    img.src = history[historyStep];
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        updateUndoRedoButtons();
    };
}

function updateUndoRedoButtons() {
    undoBtn.disabled = historyStep <= 0;
    redoBtn.disabled = historyStep >= history.length - 1;

    undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
    redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
}

// Add event listeners for undo/redo
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
            e.preventDefault();
            redo();
        }
    }
});

// Text modal functionality
let textPosition = null;

function showTextModal(x, y) {
    textPosition = { x, y };
    textModal.style.display = 'flex';
    textInput.value = '';
    textInput.focus();
}

textApplyBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text && textPosition) {
        ctx.font = `${currentSize * 3}px Arial`;
        ctx.fillStyle = currentColor;
        ctx.fillText(text, textPosition.x, textPosition.y);
        saveState();
    }
    textModal.style.display = 'none';
});

textCancelBtn.addEventListener('click', () => {
    textModal.style.display = 'none';
});

// Close modal when clicking outside
textModal.addEventListener('click', (e) => {
    if (e.target === textModal) {
        textModal.style.display = 'none';
    }
});

// Drawing functions
function startDrawing(e) {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    if (currentTool === 'text') {
        showTextModal(startX, startY);
        return;
    }

    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
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
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function stopDrawing(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = currentSize;

    if (currentTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    } else if (currentTool === 'rectangle') {
        const width = endX - startX;
        const height = endY - startY;

        ctx.beginPath();
        if (fillShape) {
            ctx.fillRect(startX, startY, width, height);
        } else {
            ctx.strokeRect(startX, startY, width, height);
        }
    } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        if (fillShape) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    isDrawing = false;
    ctx.beginPath();
    saveState();
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
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

// Initialize the app
function init() {
    // Set initial canvas background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();

    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Keyboard shortcuts
        if (e.key === 'Escape') {
            textModal.style.display = 'none';
        }
    });

    // Prevent scrolling when touching the canvas
    document.body.addEventListener('touchstart', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });

    document.body.addEventListener('touchend', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });

    document.body.addEventListener('touchmove', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Layers functionality
let layers = [];
let activeLayerIndex = 0;
let layerCounter = 1;

// Initialize with a base layer
function initLayers() {
    // Create a base layer
    addLayer();
    updateLayersList();
}

// Add a new layer
function addLayer() {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = canvas.width;
    layerCanvas.height = canvas.height;
    const layerCtx = layerCanvas.getContext('2d');

    // Fill with white background
    layerCtx.fillStyle = 'white';
    layerCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);

    const layer = {
        id: layerCounter++,
        name: `Layer ${layerCounter}`,
        canvas: layerCanvas,
        context: layerCtx,
        visible: true
    };

    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    updateLayersList();
    redrawCanvas();
}

// Delete the active layer
function deleteLayer() {
    if (layers.length <= 1) {
        alert('You must have at least one layer!');
        return;
    }

    layers.splice(activeLayerIndex, 1);
    activeLayerIndex = Math.min(activeLayerIndex, layers.length - 1);
    updateLayersList();
    redrawCanvas();
}

// Update the layers list UI
function updateLayersList() {
    layersList.innerHTML = '';

    layers.forEach((layer, index) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item' + (index === activeLayerIndex ? ' active' : '');

        const visibilitySpan = document.createElement('span');
        visibilitySpan.className = 'layer-visibility';
        visibilitySpan.textContent = layer.visible ? '👁️' : '🚫';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'layer-name';
        nameSpan.textContent = layer.name;

        layerItem.appendChild(visibilitySpan);
        layerItem.appendChild(nameSpan);

        layerItem.addEventListener('click', () => {
            activeLayerIndex = index;
            updateLayersList();
        });

        layerItem.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            toggleLayerVisibility(index);
        });

        layersList.appendChild(layerItem);
    });
}

// Toggle layer visibility
function toggleLayerVisibility(index) {
    layers[index].visible = !layers[index].visible;
    updateLayersList();
    redrawCanvas();
}

// Redraw all visible layers to the main canvas
function redrawCanvas() {
    // Clear the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all visible layers
    layers.forEach(layer => {
        if (layer.visible) {
            ctx.drawImage(layer.canvas, 0, 0);
        }
    });

    // Save the current state
    saveState();
}

// Update the current active layer with the main canvas content
function updateActiveLayer() {
    if (layers.length > 0) {
        const activeLayer = layers[activeLayerIndex];
        activeLayer.context.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        activeLayer.context.drawImage(canvas, 0, 0);
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
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

// Add event listeners for layer controls
addLayerBtn.addEventListener('click', addLayer);
deleteLayerBtn.addEventListener('click', deleteLayer);

// Initialize the application when the page loads
window.addEventListener('load', () => {
    init();
    initLayers();
});
