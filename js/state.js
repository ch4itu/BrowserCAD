/* ============================================
   BrowserCAD - State Management Module
   ============================================ */

// Unique ID generator with collision prevention
let entityIdCounter = 0;
function generateId() {
    return `ent_${Date.now()}_${entityIdCounter++}`;
}

// State Manager Class
class StateManager {
    constructor() {
        // Command state
        this.activeCmd = null;
        this.step = 0;
        this.points = [];
        this.tempEnd = null;
        this.lineChainStart = null;
        this.offsetDist = 10;
        this.targetId = null;
        this.cmdOptions = {};

        // Selection state
        this.selectionMode = false;
        this.selectStart = null;
        this.selectedIds = [];

        // Hover state (for entity highlighting on mouse over)
        this.hoveredId = null;

        // Grip editing state
        this.gripDragging = false;
        this.activeGrip = null;      // { entityId, gripIndex, point, type }
        this.gripBasePoint = null;    // Original grip position when drag started
        this.hoveredGrip = null;      // Grip under cursor (for highlighting)

        // View state
        this.pan = { x: 0, y: 0 };
        this.zoom = 1;
        this.cursor = { x: 0, y: 0 };
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };

        // Snap settings
        this.snapEnabled = true;        // Legacy - for compatibility
        this.osnapEnabled = true;       // Object Snap (F3) - endpoint, midpoint, center, nearest, etc.
        this.gridSnapEnabled = false;   // Grid Snap (F9) - snap to grid points
        this.snapModes = {
            endpoint: true,
            midpoint: true,
            center: true,
            intersection: true,
            perpendicular: true,
            tangent: false,
            nearest: true,
            extension: true,
            appint: false,              // Apparent intersection (extended entities)
            quadrant: true,
            node: true
        };
        this.snapPoint = null;
        this.snapType = null;
        this.gridSize = 10;

        // Cursor settings (CAD-like)
        this.crosshairSize = 15;        // Crosshair size in pixels
        this.fullCrosshair = false;     // Full-screen crosshair (CURSORSIZE = 100 in CAD)
        this.pickboxSize = 3;           // Selection aperture size
        this.cursorWorld = null;        // Cursor position in world coordinates

        // Dynamic Input (F12 - coordinate display near cursor)
        this.dynamicInputEnabled = true;

        // Ortho mode (constrain to horizontal/vertical)
        this.orthoEnabled = false;

        // Polar tracking
        this.polarEnabled = false;
        this.polarAngle = 45;

        // Drawing settings
        this.lineWeight = 'ByLayer';
        this.lineType = 'ByLayer';
        this.lineTypeScale = 1;
        this.hatchPattern = 'solid';
        this.hatchScale = 1;
        this.hatchAngle = 0;

        // Text styles
        this.currentTextStyle = 'Standard';
        this.textStyles = {
            'Standard': { font: 'Arial, sans-serif', bold: false, italic: false },
            'Romans': { font: '"Courier New", Courier, monospace', bold: false, italic: false },
            'RomanD': { font: '"Times New Roman", Times, serif', bold: false, italic: false },
            'Italic': { font: 'Arial, sans-serif', bold: false, italic: true },
            'Bold': { font: 'Arial, sans-serif', bold: true, italic: false },
            'Mono': { font: '"Courier New", Courier, monospace', bold: false, italic: false },
            'Script': { font: '"Comic Sans MS", cursive', bold: false, italic: false },
            'Gothic': { font: '"Century Gothic", sans-serif', bold: false, italic: false }
        };

        // Offset settings
        this.offsetDist = 10;
        this.offsetGapType = 0;         // 0=Extend, 1=Fillet, 2=Chamfer (OFFSETGAPTYPE)
        this.lastScaleFactor = 1;
        this.imageAttachScale = 1;
        this.imageAttachRotation = 0;

        // Point display settings (PDMODE, PDSIZE)
        this.pointDisplayMode = 3;      // 0=dot, 1=none, 2=+, 3=X, 4=short line
        this.pointDisplaySize = 5;      // Size in pixels

        // Text settings
        this.textHeight = 10;           // Default text height
        this.textStyle = 'Standard';    // Text style name

        // Dimension settings (DIMTXT, DIMASZ, DIMSCALE, etc.)
        this.dimTextHeight = 2.5;       // Dimension text height (DIMTXT)
        this.dimArrowSize = 2.5;        // Dimension arrow size (DIMASZ)
        this.dimScale = 1;              // Overall dimension scale (DIMSCALE)
        this.dimPrecision = 4;          // Decimal precision (DIMDEC)
        this.lastLinearDim = null;
        this.dimStyles = [
            {
                name: 'Standard',
                textHeight: this.dimTextHeight,
                arrowSize: this.dimArrowSize,
                scale: this.dimScale,
                precision: this.dimPrecision
            }
        ];
        this.currentDimStyle = 'Standard';

        // Layers
        this.layers = [
            { name: '0', color: '#ffffff', visible: true, locked: false, frozen: false, lineType: 'Continuous', lineWeight: 'Default' }
        ];
        this.currentLayer = '0';
        this.layerStates = {};

        // Entities
        this.entities = [];

        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoLevels = 100;

        // Drawing info
        this.drawingName = 'Untitled';
        this.modified = false;
        this.lastLinearDim = null;

        // Clipboard for copy/paste
        this.clipboard = [];

        // Block definitions (CAD-like blocks)
        // { blockName: { name, basePoint, entities: [...], description } }
        this.blocks = {};

        // Named views { name: { pan: {x,y}, zoom: number } }
        this.namedViews = {};

        // Layouts (Model + Paper Space)
        this.layouts = [
            {
                name: 'Model',
                type: 'model',
                pan: { x: 0, y: 0 },
                zoom: 1,
                showGrid: true,
                paper: null,
                viewports: [],
                entities: []
            }
        ];
        this.currentLayout = 'Model';
        this.activeSpace = 'MODEL';
        this.activeViewportId = null;

        // Grid display
        this.showGrid = true;
        this.gridSpacing = 100;
        this.gridSubdivisions = 10;

        // Origin/UCS
        this.origin = { x: 0, y: 0 };
        this.ucsAngle = 0;
    }

    // ==========================================
    // LAYOUTS (MODEL/PAPERSPACE)
    // ==========================================

    getLayout(name) {
        return this.layouts.find(layout => layout.name === name);
    }

    addLayout(name, options = {}) {
        if (!name || this.getLayout(name)) return false;
        const layout = {
            name,
            type: options.type || 'paper',
            pan: { x: 0, y: 0 },
            zoom: 1,
            showGrid: options.showGrid ?? false,
            paper: options.paper || { width: 420, height: 297, margin: 10 },
            viewports: [],
            entities: []
        };
        this.layouts.push(layout);
        this.modified = true;
        return layout;
    }

    renameLayout(oldName, newName) {
        const layout = this.getLayout(oldName);
        if (!layout || this.getLayout(newName)) return false;
        layout.name = newName;
        if (this.currentLayout === oldName) {
            this.currentLayout = newName;
        }
        this.modified = true;
        return true;
    }

    removeLayout(name) {
        if (name === 'Model') return false;
        const index = this.layouts.findIndex(layout => layout.name === name);
        if (index === -1) return false;
        this.layouts.splice(index, 1);
        if (this.currentLayout === name) {
            this.setCurrentLayout('Model');
        }
        this.modified = true;
        return true;
    }

    saveCurrentLayoutView() {
        const layout = this.getLayout(this.currentLayout);
        if (!layout) return;
        layout.pan = { ...this.pan };
        layout.zoom = this.zoom;
        layout.showGrid = this.showGrid;
    }

    setCurrentLayout(name) {
        const layout = this.getLayout(name);
        if (!layout) return false;
        this.saveCurrentLayoutView();
        this.currentLayout = name;
        this.pan = { ...layout.pan };
        this.zoom = layout.zoom;
        this.showGrid = layout.showGrid;
        this.activeSpace = layout.type === 'paper' ? 'PAPER' : 'MODEL';
        this.activeViewportId = null;
        return true;
    }

    normalizeLayout(layout) {
        const normalized = {
            ...layout,
            viewports: Array.isArray(layout.viewports) ? layout.viewports : [],
            entities: Array.isArray(layout.entities) ? layout.entities : []
        };
        if (normalized.type === 'paper' && !normalized.paper) {
            normalized.paper = { width: 420, height: 297, margin: 10 };
        }
        if (normalized.type === 'model') {
            normalized.paper = null;
        }
        return normalized;
    }

    // ==========================================
    // DIMENSION STYLES
    // ==========================================

    getDimStyle(name) {
        return this.dimStyles.find(style => style.name === name);
    }

    saveCurrentDimStyle(name) {
        if (!name) return false;
        const existing = this.getDimStyle(name);
        const styleData = {
            name,
            textHeight: this.dimTextHeight,
            arrowSize: this.dimArrowSize,
            scale: this.dimScale,
            precision: this.dimPrecision
        };
        if (existing) {
            Object.assign(existing, styleData);
            return true;
        }
        this.dimStyles.push(styleData);
        return true;
    }

    applyDimStyle(name) {
        const style = this.getDimStyle(name);
        if (!style) return false;
        this.currentDimStyle = style.name;
        this.dimTextHeight = style.textHeight;
        this.dimArrowSize = style.arrowSize;
        this.dimScale = style.scale;
        this.dimPrecision = style.precision;
        return true;
    }

    // ==========================================
    // LAYER STATES
    // ==========================================

    saveLayerState(name) {
        if (!name) return false;
        this.layerStates[name] = {
            layers: JSON.parse(JSON.stringify(this.layers)),
            currentLayer: this.currentLayer
        };
        this.modified = true;
        return true;
    }

    restoreLayerState(name) {
        const state = this.layerStates[name];
        if (!state) return false;
        this.layers = JSON.parse(JSON.stringify(state.layers));
        this.currentLayer = state.currentLayer || '0';
        this.modified = true;
        return true;
    }

    deleteLayerState(name) {
        if (!this.layerStates[name]) return false;
        delete this.layerStates[name];
        this.modified = true;
        return true;
    }

    // ==========================================
    // ENTITY MANAGEMENT
    // ==========================================

    addEntity(data, skipUndo = false) {
        const entity = {
            id: generateId(),
            layer: this.currentLayer,
            lineWeight: this.lineWeight,
            lineType: this.lineType,
            ...data
        };

        if (!skipUndo) {
            this.saveUndoState('Add Entity');
        }

        this.entities.push(entity);
        this.modified = true;
        return entity;
    }

    removeEntity(id, skipUndo = false) {
        const index = this.entities.findIndex(e => e.id === id);
        if (index === -1) return null;

        if (!skipUndo) {
            this.saveUndoState('Remove Entity');
        }

        const removed = this.entities.splice(index, 1)[0];
        this.modified = true;
        return removed;
    }

    removeEntities(ids, skipUndo = false) {
        if (ids.length === 0) return [];

        if (!skipUndo) {
            this.saveUndoState('Remove Entities');
        }

        const removed = [];
        this.entities = this.entities.filter(e => {
            if (ids.includes(e.id)) {
                removed.push(e);
                return false;
            }
            return true;
        });

        this.modified = true;
        return removed;
    }

    getEntity(id) {
        return this.entities.find(e => e.id === id);
    }

    updateEntity(id, updates, skipUndo = false) {
        const entity = this.getEntity(id);
        if (!entity) return null;

        if (!skipUndo) {
            this.saveUndoState('Update Entity');
        }

        Object.assign(entity, updates);
        this.modified = true;
        return entity;
    }

    isLayerVisible(name) {
        const layer = this.getLayer(name);
        return layer && layer.visible !== false && !layer.frozen;
    }

    getVisibleEntities() {
        return this.entities.filter(e => {
            if (e._hidden) return false;
            return this.isLayerVisible(e.layer);
        });
    }

    getEditableEntities() {
        return this.entities.filter(e => {
            if (e._hidden) return false;
            const layer = this.getLayer(e.layer);
            return layer && layer.visible && !layer.frozen && !layer.locked;
        });
    }

    isEntityLocked(entity) {
        const layer = this.getLayer(entity.layer);
        return layer && layer.locked;
    }

    // ==========================================
    // BLOCK MANAGEMENT
    // ==========================================

    addBlock(name, basePoint, entities, description = '') {
        if (Array.isArray(basePoint)) {
            const resolvedEntities = basePoint;
            const resolvedBasePoint = entities || { x: 0, y: 0 };
            entities = resolvedEntities;
            basePoint = resolvedBasePoint;
        }
        if (this.blocks[name]) {
            return null; // Block already exists
        }

        // Deep clone entities and remove IDs (they're stored as definitions)
        const blockEntities = entities.map(e => {
            const clone = JSON.parse(JSON.stringify(e));
            delete clone.id;
            return clone;
        });

        const block = {
            name: name,
            basePoint: { ...basePoint },
            entities: blockEntities,
            description: description,
            createdAt: Date.now()
        };

        this.blocks[name] = block;
        this.modified = true;
        return block;
    }

    getBlock(name) {
        return this.blocks[name] || null;
    }

    deleteBlock(name) {
        if (this.blocks[name]) {
            delete this.blocks[name];
            this.modified = true;
            return true;
        }
        return false;
    }

    getBlockList() {
        return Object.keys(this.blocks);
    }

    renameBlock(oldName, newName) {
        if (!this.blocks[oldName] || this.blocks[newName]) {
            return false;
        }

        this.blocks[newName] = this.blocks[oldName];
        this.blocks[newName].name = newName;
        delete this.blocks[oldName];

        // Update all block references
        this.entities.forEach(entity => {
            if (entity.type === 'block' && entity.blockName === oldName) {
                entity.blockName = newName;
            }
        });

        this.modified = true;
        return true;
    }

    // Get expanded entities for a block reference (for rendering, hit testing, etc.)
    getBlockEntities(blockRef) {
        const block = this.getBlock(blockRef.blockName);
        if (!block) return [];

        const insertPoint = blockRef.insertPoint || { x: 0, y: 0 };
        const scale = blockRef.scale || { x: 1, y: 1 };
        const rotation = blockRef.rotation || 0;

        // Transform each entity in the block definition
        return block.entities.map(entity => {
            let transformed = JSON.parse(JSON.stringify(entity));

            // Apply transformations: scale, rotate, translate
            transformed = this.transformBlockEntity(transformed, block.basePoint, insertPoint, scale, rotation);

            // Inherit properties from block reference if not specified
            if (!transformed.layer) transformed.layer = blockRef.layer;
            if ((!transformed.color || transformed.color === 'ByBlock') && blockRef.color && blockRef.color !== 'ByLayer') {
                transformed.color = blockRef.color;
            }

            return transformed;
        });
    }

    transformBlockEntity(entity, basePoint, insertPoint, scale, rotation) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Helper to transform a point relative to base point, then to insert point
        const transformPoint = (p) => {
            // Translate to origin (relative to base point)
            let x = p.x - basePoint.x;
            let y = p.y - basePoint.y;

            // Scale
            x *= scale.x;
            y *= scale.y;

            // Rotate
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;

            // Translate to insert point
            return {
                x: rx + insertPoint.x,
                y: ry + insertPoint.y
            };
        };

        switch (entity.type) {
            case 'line':
                entity.p1 = transformPoint(entity.p1);
                entity.p2 = transformPoint(entity.p2);
                break;
            case 'circle':
                entity.center = transformPoint(entity.center);
                entity.r *= Math.abs(scale.x); // Uniform scale for circles
                break;
            case 'arc':
                entity.center = transformPoint(entity.center);
                entity.r *= Math.abs(scale.x);
                entity.start += rotation;
                entity.end += rotation;
                break;
            case 'rect':
                entity.p1 = transformPoint(entity.p1);
                entity.p2 = transformPoint(entity.p2);
                break;
            case 'polyline':
                entity.points = entity.points.map(p => transformPoint(p));
                break;
            case 'ellipse':
                entity.center = transformPoint(entity.center);
                entity.rx *= Math.abs(scale.x);
                entity.ry *= Math.abs(scale.y);
                entity.rotation = (entity.rotation || 0) + rotation;
                break;
            case 'text':
                entity.position = transformPoint(entity.position);
                entity.height *= Math.abs(scale.y);
                entity.rotation = (entity.rotation || 0) + Utils.radToDeg(rotation);
                break;
            case 'point':
                entity.position = transformPoint(entity.position);
                break;
            case 'donut':
                entity.center = transformPoint(entity.center);
                entity.innerRadius *= Math.abs(scale.x);
                entity.outerRadius *= Math.abs(scale.x);
                break;
            case 'image':
                entity.p1 = transformPoint(entity.p1);
                entity.width = (entity.width || 100) * Math.abs(scale.x);
                entity.height = (entity.height || 100) * Math.abs(scale.y);
                entity.rotation = (entity.rotation || 0) + Utils.radToDeg(rotation);
                entity.p2 = {
                    x: entity.p1.x + entity.width,
                    y: entity.p1.y + entity.height
                };
                break;
        }

        return entity;
    }

    // ==========================================
    // LAYER MANAGEMENT
    // ==========================================

    addLayer(name, color = '#ffffff') {
        if (this.layers.find(l => l.name === name)) {
            return null; // Layer already exists
        }

        const layer = {
            name,
            color,
            visible: true,
            locked: false,
            frozen: false,
            lineType: 'Continuous',
            lineWeight: 'Default'
        };

        this.layers.push(layer);
        return layer;
    }

    getLayer(name) {
        return this.layers.find(l => l.name === name);
    }

    setCurrentLayer(name) {
        if (this.getLayer(name)) {
            this.currentLayer = name;
            return true;
        }
        return false;
    }

    updateLayerColor(name, color) {
        const layer = this.getLayer(name);
        if (layer) {
            layer.color = color;
            return true;
        }
        return false;
    }

    toggleLayerVisibility(name) {
        const layer = this.getLayer(name);
        if (layer) {
            layer.visible = !layer.visible;
            return layer.visible;
        }
        return null;
    }

    getEntityColor(entity) {
        if (entity.color && entity.color !== 'ByLayer' && entity.color !== 'ByBlock') return entity.color;
        const layer = this.getLayer(entity.layer);
        return layer ? layer.color : '#ffffff';
    }

    // ==========================================
    // UNDO/REDO SYSTEM
    // ==========================================

    saveUndoState(actionName = 'Action') {
        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Deep clone current entities and blocks
        const snapshot = {
            action: actionName,
            entities: JSON.parse(JSON.stringify(this.entities)),
            blocks: JSON.parse(JSON.stringify(this.blocks)),
            layers: JSON.parse(JSON.stringify(this.layers)),
            currentLayer: this.currentLayer
        };

        this.undoStack.push(snapshot);

        // Limit undo levels
        if (this.undoStack.length > this.maxUndoLevels) {
            this.undoStack.shift();
        }
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        // Save current state to redo stack
        const currentSnapshot = {
            action: 'Redo',
            entities: JSON.parse(JSON.stringify(this.entities)),
            blocks: JSON.parse(JSON.stringify(this.blocks)),
            layers: JSON.parse(JSON.stringify(this.layers)),
            currentLayer: this.currentLayer
        };
        this.redoStack.push(currentSnapshot);

        // Restore previous state
        const snapshot = this.undoStack.pop();
        this.entities = snapshot.entities;
        this.blocks = snapshot.blocks || {};
        this.layers = snapshot.layers;
        this.currentLayer = snapshot.currentLayer;
        this.modified = true;

        return snapshot.action;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        // Save current state to undo stack
        const currentSnapshot = {
            action: 'Undo',
            entities: JSON.parse(JSON.stringify(this.entities)),
            blocks: JSON.parse(JSON.stringify(this.blocks)),
            layers: JSON.parse(JSON.stringify(this.layers)),
            currentLayer: this.currentLayer
        };
        this.undoStack.push(currentSnapshot);

        // Restore redo state
        const snapshot = this.redoStack.pop();
        this.entities = snapshot.entities;
        this.blocks = snapshot.blocks || {};
        this.layers = snapshot.layers;
        this.currentLayer = snapshot.currentLayer;
        this.modified = true;

        return snapshot.action;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    // ==========================================
    // SELECTION MANAGEMENT
    // ==========================================

    select(ids) {
        if (!Array.isArray(ids)) ids = [ids];
        this.selectedIds = [...new Set([...this.selectedIds, ...ids])];
        // Update UI
        if (typeof UI !== 'undefined') {
            UI.updatePropertiesPanel();
        }
    }

    deselect(ids) {
        if (!Array.isArray(ids)) ids = [ids];
        this.selectedIds = this.selectedIds.filter(id => !ids.includes(id));
        // Update UI
        if (typeof UI !== 'undefined') {
            UI.updatePropertiesPanel();
        }
    }

    clearSelection() {
        // Store previous selection for SELECTPREVIOUS command
        if (this.selectedIds.length > 0) {
            this._previousSelection = [...this.selectedIds];
        }
        this.selectedIds = [];
        // Clear grip state
        this.hoveredGrip = null;
        this.activeGrip = null;
        this.gripDragging = false;
        this.gripBasePoint = null;
        // Update UI
        if (typeof UI !== 'undefined') {
            UI.updatePropertiesPanel();
        }
    }

    isSelected(id) {
        return this.selectedIds.includes(id);
    }

    getSelectedEntities() {
        return this.entities.filter(e => this.selectedIds.includes(e.id));
    }

    selectAll() {
        this.selectedIds = this.getVisibleEntities().map(e => e.id);
        // Update UI
        if (typeof UI !== 'undefined') {
            UI.updatePropertiesPanel();
        }
    }

    // ==========================================
    // CLIPBOARD OPERATIONS
    // ==========================================

    copyToClipboard() {
        const selected = this.getSelectedEntities();
        if (selected.length === 0) return 0;

        this.clipboard = JSON.parse(JSON.stringify(selected));
        return this.clipboard.length;
    }

    paste(offset = { x: 50, y: 50 }) {
        if (this.clipboard.length === 0) return [];

        this.saveUndoState('Paste');

        const newEntities = [];
        const idMap = {};

        this.clipboard.forEach(entity => {
            const newId = generateId();
            idMap[entity.id] = newId;

            const newEntity = {
                ...JSON.parse(JSON.stringify(entity)),
                id: newId
            };

            // Offset the entity
            this.offsetEntity(newEntity, offset);
            this.entities.push(newEntity);
            newEntities.push(newEntity);
        });

        this.modified = true;
        this.selectedIds = newEntities.map(e => e.id);
        return newEntities;
    }

    offsetEntity(entity, offset) {
        switch (entity.type) {
            case 'line':
                entity.p1.x += offset.x;
                entity.p1.y += offset.y;
                entity.p2.x += offset.x;
                entity.p2.y += offset.y;
                break;
            case 'circle':
            case 'arc':
                entity.center.x += offset.x;
                entity.center.y += offset.y;
                break;
            case 'rect':
                entity.p1.x += offset.x;
                entity.p1.y += offset.y;
                entity.p2.x += offset.x;
                entity.p2.y += offset.y;
                break;
            case 'polyline':
                entity.points.forEach(p => {
                    p.x += offset.x;
                    p.y += offset.y;
                });
                break;
            case 'ellipse':
                entity.center.x += offset.x;
                entity.center.y += offset.y;
                break;
            case 'text':
                entity.position.x += offset.x;
                entity.position.y += offset.y;
                break;
            case 'block':
                entity.insertPoint.x += offset.x;
                entity.insertPoint.y += offset.y;
                break;
            case 'point':
                entity.position.x += offset.x;
                entity.position.y += offset.y;
                break;
            case 'donut':
                entity.center.x += offset.x;
                entity.center.y += offset.y;
                break;
            case 'image':
                entity.p1.x += offset.x;
                entity.p1.y += offset.y;
                if (entity.p2) {
                    entity.p2.x += offset.x;
                    entity.p2.y += offset.y;
                }
                break;
        }
    }

    // ==========================================
    // COMMAND STATE MANAGEMENT
    // ==========================================

    startCommand(name) {
        this.activeCmd = name;
        this.step = 0;
        this.points = [];
        this.targetId = null;
        this.lineChainStart = null;
        this.cmdOptions = {};
        // Clear selection mode when starting a command
        this.selectionMode = false;
        this.selectStart = null;
    }

    finishCommand() {
        this.activeCmd = null;
        this.points = [];
        this.step = 0;
        this.lineChainStart = null;
        this.cmdOptions = {};
        // Clear selection mode when finishing
        this.selectionMode = false;
        this.selectStart = null;
    }

    cancelCommand() {
        this.finishCommand();
    }

    // ==========================================
    // VIEW OPERATIONS
    // ==========================================

    zoomIn(factor = 1.2) {
        this.zoom *= factor;
    }

    zoomOut(factor = 1.2) {
        this.zoom /= factor;
    }

    zoomExtents(canvasWidth, canvasHeight, padding = 50) {
        if (this.entities.length === 0) {
            this.zoom = 1;
            this.pan = { x: canvasWidth / 2, y: canvasHeight / 2 };
            return;
        }

        // Calculate bounding box of all entities
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.entities.forEach(entity => {
            const ext = this.getEntityExtents(entity);
            if (ext) {
                minX = Math.min(minX, ext.minX);
                minY = Math.min(minY, ext.minY);
                maxX = Math.max(maxX, ext.maxX);
                maxY = Math.max(maxY, ext.maxY);
            }
        });

        if (minX === Infinity) return;

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scaleX = (canvasWidth - padding * 2) / width;
        const scaleY = (canvasHeight - padding * 2) / height;
        this.zoom = Math.min(scaleX, scaleY, 10);

        this.pan.x = canvasWidth / 2 - centerX * this.zoom;
        this.pan.y = canvasHeight / 2 - centerY * this.zoom;
    }

    getEntityExtents(entity) {
        switch (entity.type) {
            case 'line':
                return {
                    minX: Math.min(entity.p1.x, entity.p2.x),
                    maxX: Math.max(entity.p1.x, entity.p2.x),
                    minY: Math.min(entity.p1.y, entity.p2.y),
                    maxY: Math.max(entity.p1.y, entity.p2.y)
                };
            case 'circle':
                return {
                    minX: entity.center.x - entity.r,
                    maxX: entity.center.x + entity.r,
                    minY: entity.center.y - entity.r,
                    maxY: entity.center.y + entity.r
                };
            case 'arc':
                // Simplified - use circle bounds
                return {
                    minX: entity.center.x - entity.r,
                    maxX: entity.center.x + entity.r,
                    minY: entity.center.y - entity.r,
                    maxY: entity.center.y + entity.r
                };
            case 'rect':
                return {
                    minX: Math.min(entity.p1.x, entity.p2.x),
                    maxX: Math.max(entity.p1.x, entity.p2.x),
                    minY: Math.min(entity.p1.y, entity.p2.y),
                    maxY: Math.max(entity.p1.y, entity.p2.y)
                };
            case 'polyline':
                const xs = entity.points.map(p => p.x);
                const ys = entity.points.map(p => p.y);
                return {
                    minX: Math.min(...xs),
                    maxX: Math.max(...xs),
                    minY: Math.min(...ys),
                    maxY: Math.max(...ys)
                };
            case 'ellipse':
                return {
                    minX: entity.center.x - entity.rx,
                    maxX: entity.center.x + entity.rx,
                    minY: entity.center.y - entity.ry,
                    maxY: entity.center.y + entity.ry
                };
            case 'text':
                // Approximate text bounds
                const textWidth = entity.text.length * entity.height * 0.6;
                return {
                    minX: entity.position.x,
                    maxX: entity.position.x + textWidth,
                    minY: entity.position.y - entity.height,
                    maxY: entity.position.y
                };
            case 'image': {
                const width = entity.width ?? Math.abs(entity.p2.x - entity.p1.x);
                const height = entity.height ?? Math.abs(entity.p2.y - entity.p1.y);
                const rotation = Utils.degToRad(entity.rotation || 0);
                const corners = [
                    { x: entity.p1.x, y: entity.p1.y },
                    { x: entity.p1.x + width, y: entity.p1.y },
                    { x: entity.p1.x + width, y: entity.p1.y + height },
                    { x: entity.p1.x, y: entity.p1.y + height }
                ].map(point => Utils.rotatePoint(point, entity.p1, rotation));
                const xs = corners.map(p => p.x);
                const ys = corners.map(p => p.y);
                return {
                    minX: Math.min(...xs),
                    maxX: Math.max(...xs),
                    minY: Math.min(...ys),
                    maxY: Math.max(...ys)
                };
            }
            case 'donut':
                return {
                    minX: entity.center.x - entity.outerRadius,
                    maxX: entity.center.x + entity.outerRadius,
                    minY: entity.center.y - entity.outerRadius,
                    maxY: entity.center.y + entity.outerRadius
                };
            case 'point':
                return {
                    minX: entity.position.x - 1,
                    maxX: entity.position.x + 1,
                    minY: entity.position.y - 1,
                    maxY: entity.position.y + 1
                };
            case 'dimension':
                if (entity.dimType === 'linear' || entity.dimType === 'aligned') {
                    return {
                        minX: Math.min(entity.p1.x, entity.p2.x, entity.dimLinePos.x),
                        maxX: Math.max(entity.p1.x, entity.p2.x, entity.dimLinePos.x),
                        minY: Math.min(entity.p1.y, entity.p2.y, entity.dimLinePos.y),
                        maxY: Math.max(entity.p1.y, entity.p2.y, entity.dimLinePos.y)
                    };
                } else if (entity.dimType === 'radius' || entity.dimType === 'diameter') {
                    return {
                        minX: entity.center.x - entity.radius,
                        maxX: entity.center.x + entity.radius,
                        minY: entity.center.y - entity.radius,
                        maxY: entity.center.y + entity.radius
                    };
                }
                return null;
            case 'block':
                // Get expanded entities and compute combined extents
                const blockEntities = this.getBlockEntities(entity);
                if (blockEntities.length === 0) {
                    // Fallback: just use insert point
                    return {
                        minX: entity.insertPoint.x - 1,
                        maxX: entity.insertPoint.x + 1,
                        minY: entity.insertPoint.y - 1,
                        maxY: entity.insertPoint.y + 1
                    };
                }
                let bMinX = Infinity, bMinY = Infinity;
                let bMaxX = -Infinity, bMaxY = -Infinity;
                blockEntities.forEach(be => {
                    const ext = this.getEntityExtents(be);
                    if (ext) {
                        bMinX = Math.min(bMinX, ext.minX);
                        bMinY = Math.min(bMinY, ext.minY);
                        bMaxX = Math.max(bMaxX, ext.maxX);
                        bMaxY = Math.max(bMaxY, ext.maxY);
                    }
                });
                return bMinX !== Infinity ? { minX: bMinX, maxX: bMaxX, minY: bMinY, maxY: bMaxY } : null;
            default:
                return null;
        }
    }

    // ==========================================
    // SERIALIZATION
    // ==========================================

    toJSON() {
        return {
            version: '1.3',
            name: this.drawingName,
            layers: this.layers,
            currentLayer: this.currentLayer,
            entities: this.entities,
            blocks: this.blocks,
            namedViews: this.namedViews,
            layouts: this.layouts,
            currentLayout: this.currentLayout,
            dimStyles: this.dimStyles,
            currentDimStyle: this.currentDimStyle,
            layerStates: this.layerStates,
            view: {
                pan: this.pan,
                zoom: this.zoom
            },
            settings: {
                gridSize: this.gridSize,
                gridSpacing: this.gridSpacing,
                snapEnabled: this.snapEnabled,
                snapModes: this.snapModes,
                orthoEnabled: this.orthoEnabled,
                dimPrecision: this.dimPrecision,
                lineType: this.lineType,
                lineTypeScale: this.lineTypeScale
            }
        };
    }

    fromJSON(data) {
        if (data.version) {
            this.drawingName = data.name || 'Untitled';
            this.layers = data.layers || this.layers;
            this.currentLayer = data.currentLayer || '0';
            this.entities = data.entities || [];
            this.blocks = data.blocks || {};
            this.namedViews = data.namedViews || {};
            this.layouts = (data.layouts || this.layouts).map(layout => this.normalizeLayout(layout));
            this.currentLayout = data.currentLayout || this.currentLayout;
            this.dimStyles = data.dimStyles || this.dimStyles;
            this.currentDimStyle = data.currentDimStyle || this.currentDimStyle;
            this.layerStates = data.layerStates || this.layerStates;

            if (data.view) {
                this.pan = data.view.pan || this.pan;
                this.zoom = data.view.zoom || this.zoom;
            }

            if (data.settings) {
                this.gridSize = data.settings.gridSize || this.gridSize;
                this.gridSpacing = data.settings.gridSpacing || this.gridSpacing;
                this.snapEnabled = data.settings.snapEnabled !== false;
                this.snapModes = { ...this.snapModes, ...data.settings.snapModes };
                this.orthoEnabled = data.settings.orthoEnabled || false;
                this.dimPrecision = data.settings.dimPrecision ?? this.dimPrecision;
                this.lineType = data.settings.lineType || this.lineType;
                this.lineTypeScale = data.settings.lineTypeScale || this.lineTypeScale;
            }

            this.applyDimStyle(this.currentDimStyle);
            this.setCurrentLayout(this.currentLayout);

            // Reset undo stack on load
            this.undoStack = [];
            this.redoStack = [];
            this.modified = false;
        }
    }

    clear() {
        this.saveUndoState('Clear Drawing');
        this.entities = [];
        this.selectedIds = [];
        this.modified = true;
    }

    newDrawing() {
        this.entities = [];
        this.selectedIds = [];
        this.blocks = {};
        this.namedViews = {};
        this.layers = [
            { name: '0', color: '#ffffff', visible: true, locked: false, frozen: false, lineType: 'Continuous', lineWeight: 'Default' }
        ];
        this.currentLayer = '0';
        this.layerStates = {};
        this.dimStyles = [
            {
                name: 'Standard',
                textHeight: 2.5,
                arrowSize: 2.5,
                scale: 1,
                precision: 4
            }
        ];
        this.currentDimStyle = 'Standard';
        this.applyDimStyle(this.currentDimStyle);
        this.layouts = [
            {
                name: 'Model',
                type: 'model',
                pan: { x: 0, y: 0 },
                zoom: 1,
                showGrid: true,
                paper: null,
                viewports: [],
                entities: []
            }
        ];
        this.currentLayout = 'Model';
        this.setCurrentLayout(this.currentLayout);
        this.pan = { x: 0, y: 0 };
        this.zoom = 1;
        this.undoStack = [];
        this.redoStack = [];
        this.drawingName = 'Untitled';
        this.modified = false;
    }
}

// Create global state instance
const CAD = new StateManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CAD, StateManager, generateId };
}
