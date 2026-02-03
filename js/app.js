/* ============================================
   BrowserCAD - Main Application Module
   ============================================ */

const App = {
    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        // Initialize modules
        Renderer.init('canvas', 'viewport');
        UI.init();

        // Load saved settings
        Storage.loadSettings();

        // Setup viewport event handlers
        this.setupViewportEvents();

        // Initial draw
        Renderer.draw();

        // Welcome message
        UI.log('BrowserCAD initialized. Type commands or use toolbar buttons.');
        UI.log('Press F1 for help, F2 for grid, F3 for snap, F8 for ortho.');

        // Check for saved drawing
        if (Storage.hasSavedDrawing()) {
            UI.log('Saved drawing found. Type "open" to load it.');
        }

        // Center the view
        this.centerView();

        console.log('BrowserCAD initialized successfully.');
    },

    // ==========================================
    // VIEWPORT EVENTS
    // ==========================================

    setupViewportEvents() {
        const viewport = document.getElementById('viewport');
        if (!viewport) return;

        // Mouse events
        viewport.addEventListener('mousedown', (e) => this.onMouseDown(e));
        viewport.addEventListener('mousemove', (e) => this.onMouseMove(e));
        viewport.addEventListener('mouseup', (e) => this.onMouseUp(e));
        viewport.addEventListener('wheel', (e) => this.onWheel(e));
        viewport.addEventListener('contextmenu', (e) => this.onContextMenu(e));

        // Touch events for mobile
        viewport.addEventListener('touchstart', (e) => this.onTouchStart(e));
        viewport.addEventListener('touchmove', (e) => this.onTouchMove(e));
        viewport.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // Double click
        viewport.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    },

    onMouseDown(e) {
        const paperPoint = this.screenToPaper(e.offsetX, e.offsetY);
        const world = this.screenToActiveSpace(paperPoint);
        const activeViewport = this.getActiveViewport();
        const effectiveZoom = this.isModelSpaceInLayout() && activeViewport
            ? CAD.zoom * activeViewport.viewScale
            : CAD.zoom;

        // Middle mouse button - start pan or zoom extents on double-click
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            e.preventDefault();

            // Check for double middle click
            const now = Date.now();
            if (e.button === 1 && now - this.lastMiddleClick < 300) {
                this.onMiddleDoubleClick();
                this.lastMiddleClick = 0;
                return;
            }
            this.lastMiddleClick = e.button === 1 ? now : 0;

            CAD.isPanning = true;
            CAD.panStart = { x: e.offsetX, y: e.offsetY };
            document.getElementById('viewport').style.cursor = 'grabbing';
            return;
        }

        // Left click - handle command or selection
        if (e.button === 0) {
            if (!world) return;
            Commands.handleClick(world);
            UI.updatePropertiesPanel();
        }
    },

    onMouseMove(e) {
        const paperPoint = this.screenToPaper(e.offsetX, e.offsetY);
        const world = this.screenToActiveSpace(paperPoint);
        const cursorPoint = world || paperPoint;

        // Update cursor position
        CAD.cursor = cursorPoint;
        CAD.cursorWorld = cursorPoint;
        CAD.tempEnd = cursorPoint;
        UI.updateCoordinates(cursorPoint.x, cursorPoint.y);

        // Handle panning
        if (CAD.isPanning) {
            const dx = e.offsetX - CAD.panStart.x;
            const dy = e.offsetY - CAD.panStart.y;
            const activeViewport = this.getActiveViewport();

            if (this.isModelSpaceInLayout() && activeViewport) {
                const paperDx = dx / CAD.zoom;
                const paperDy = dy / CAD.zoom;
                activeViewport.viewCenter.x -= paperDx / activeViewport.viewScale;
                activeViewport.viewCenter.y -= paperDy / activeViewport.viewScale;
            } else {
                CAD.pan.x += dx;
                CAD.pan.y += dy;
            }
            CAD.panStart = { x: e.offsetX, y: e.offsetY };
        }

        // Update hover highlighting (detect entity under cursor)
        const tolerance = 10 / effectiveZoom;
        const hit = world ? Commands.hitTest(world) : null;
        CAD.hoveredId = hit ? hit.id : null;

        // Update snap point (separate OSNAP and Grid Snap)
        if ((CAD.osnapEnabled || CAD.gridSnapEnabled) && world) {
            const entities = this.getSnapEntities(world);
            const snapTolerance = 15 / effectiveZoom;

            // Build effective snap modes based on current settings
            const effectiveSnapModes = {
                endpoint: CAD.osnapEnabled && CAD.snapModes.endpoint,
                midpoint: CAD.osnapEnabled && CAD.snapModes.midpoint,
                center: CAD.osnapEnabled && CAD.snapModes.center,
                intersection: CAD.osnapEnabled && CAD.snapModes.intersection,
                perpendicular: CAD.osnapEnabled && CAD.snapModes.perpendicular,
                tangent: CAD.osnapEnabled && CAD.snapModes.tangent,
                nearest: CAD.osnapEnabled && CAD.snapModes.nearest,
                grid: CAD.gridSnapEnabled  // Grid snap is separate
            };

            const snap = Geometry.findSnapPoints(world, entities, effectiveSnapModes, snapTolerance, CAD.gridSize);

            if (snap) {
                CAD.snapPoint = snap.point;
                CAD.snapType = snap.type;
            } else {
                CAD.snapPoint = null;
                CAD.snapType = null;
            }
        } else {
            CAD.snapPoint = null;
            CAD.snapType = null;
        }

        Renderer.draw();
    },

    getSnapEntities(cursorPoint) {
        const entities = CAD.getVisibleEntities();
        if (!CAD.activeCmd) return entities;

        const points = CAD.points || [];
        if (!points.length) return entities;

        const endPoint = CAD.tempEnd || cursorPoint;
        let previewEntity = null;

        switch (CAD.activeCmd) {
            case 'line': {
                previewEntity = {
                    type: 'line',
                    p1: { ...points[points.length - 1] },
                    p2: { ...endPoint }
                };
                break;
            }
            case 'polyline': {
                previewEntity = {
                    type: 'polyline',
                    points: [...points.map(p => ({ ...p })), { ...endPoint }]
                };
                break;
            }
            case 'rect': {
                previewEntity = {
                    type: 'rect',
                    p1: { ...points[0] },
                    p2: { ...endPoint }
                };
                break;
            }
            case 'circle': {
                previewEntity = {
                    type: 'circle',
                    center: { ...points[0] },
                    r: Utils.dist(points[0], endPoint)
                };
                break;
            }
            case 'arc': {
                if (points.length >= 2) {
                    const center = points[0];
                    previewEntity = {
                        type: 'arc',
                        center: { ...center },
                        r: Utils.dist(center, points[1]),
                        start: Utils.angle(center, points[1]),
                        end: Utils.angle(center, endPoint)
                    };
                }
                break;
            }
            case 'ellipse': {
                if (points.length >= 2) {
                    const center = Utils.midpoint(points[0], points[1]);
                    previewEntity = {
                        type: 'ellipse',
                        center: { ...center },
                        rx: Utils.dist(points[0], points[1]) / 2,
                        ry: Utils.dist(center, endPoint),
                        rotation: Utils.angle(points[0], points[1])
                    };
                }
                break;
            }
            case 'polygon': {
                const center = points[0];
                const radius = Utils.dist(center, endPoint);
                const startAngle = Utils.angle(center, endPoint);
                const sides = CAD.cmdOptions.sides || 4;
                const polyPoints = [];
                for (let i = 0; i < sides; i++) {
                    const angle = startAngle + (i * 2 * Math.PI / sides);
                    polyPoints.push({
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle)
                    });
                }
                polyPoints.push({ ...polyPoints[0] });
                previewEntity = {
                    type: 'polyline',
                    points: polyPoints,
                    closed: true
                };
                break;
            }
            default:
                break;
        }

        if (previewEntity) {
            entities.push(previewEntity);
        }

        return entities;
    },

    screenToPaper(x, y) {
        return Utils.screenToWorld(x, y, CAD.pan, CAD.zoom);
    },

    paperToModel(point, viewport) {
        return {
            x: (point.x - viewport.centerPoint.x) / viewport.viewScale + viewport.viewCenter.x,
            y: (point.y - viewport.centerPoint.y) / viewport.viewScale + viewport.viewCenter.y
        };
    },

    modelToPaper(point, viewport) {
        return {
            x: (point.x - viewport.viewCenter.x) * viewport.viewScale + viewport.centerPoint.x,
            y: (point.y - viewport.viewCenter.y) * viewport.viewScale + viewport.centerPoint.y
        };
    },

    screenToActiveSpace(paperPoint) {
        if (!paperPoint) return null;
        if (this.isModelSpaceInLayout()) {
            const viewport = this.getActiveViewport();
            if (!viewport || !this.isPointInViewport(paperPoint, viewport)) return null;
            return this.paperToModel(paperPoint, viewport);
        }
        return paperPoint;
    },

    isModelSpaceInLayout() {
        const layout = CAD.getLayout(CAD.currentLayout);
        return layout && layout.type === 'paper' && CAD.activeSpace === 'MODEL';
    },

    getActiveViewport() {
        if (!CAD.activeViewportId) return null;
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout) return null;
        return layout.viewports.find(viewport => viewport.id === CAD.activeViewportId) || null;
    },

    getViewportAtPoint(point) {
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout) return null;
        return layout.viewports.find(viewport => this.isPointInViewport(point, viewport)) || null;
    },

    isPointInViewport(point, viewport) {
        if (!viewport || !point) return false;
        const left = viewport.centerPoint.x - viewport.width / 2;
        const right = viewport.centerPoint.x + viewport.width / 2;
        const top = viewport.centerPoint.y - viewport.height / 2;
        const bottom = viewport.centerPoint.y + viewport.height / 2;
        return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
    },

    onMouseUp(e) {
        if (CAD.isPanning) {
            CAD.isPanning = false;
            document.getElementById('viewport').style.cursor = 'crosshair';
        }
        UI.focusCommandLine();
    },

    onWheel(e) {
        e.preventDefault();

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const paperPoint = this.screenToPaper(e.offsetX, e.offsetY);
        const activeViewport = this.getActiveViewport();

        if (this.isModelSpaceInLayout() && activeViewport && this.isPointInViewport(paperPoint, activeViewport)) {
            const modelPoint = this.paperToModel(paperPoint, activeViewport);
            activeViewport.viewScale *= zoomFactor;
            activeViewport.viewScale = Utils.clamp(activeViewport.viewScale, 0.001, 100);

            activeViewport.viewCenter = {
                x: modelPoint.x - (paperPoint.x - activeViewport.centerPoint.x) / activeViewport.viewScale,
                y: modelPoint.y - (paperPoint.y - activeViewport.centerPoint.y) / activeViewport.viewScale
            };
            Renderer.draw();
            return;
        }

        const worldBefore = Utils.screenToWorld(e.offsetX, e.offsetY, CAD.pan, CAD.zoom);
        CAD.zoom *= zoomFactor;

        // Clamp zoom level
        CAD.zoom = Utils.clamp(CAD.zoom, 0.01, 100);

        // Adjust pan to zoom around cursor
        CAD.pan.x = e.offsetX - worldBefore.x * CAD.zoom;
        CAD.pan.y = e.offsetY - worldBefore.y * CAD.zoom;

        Renderer.draw();
    },

    onContextMenu(e) {
        e.preventDefault();

        if (CAD.activeCmd) {
            // Context menu during command - show options
            UI.showContextMenu(e.clientX, e.clientY);
        } else if (CAD.selectedIds.length > 0) {
            // Context menu with selection
            UI.showContextMenu(e.clientX, e.clientY);
        } else {
            // General context menu
            UI.showContextMenu(e.clientX, e.clientY);
        }
    },

    // Track middle button for double-click zoom
    lastMiddleClick: 0,

    onDoubleClick(e) {
        if (e.button !== 0) return;
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout || layout.type !== 'paper') return;

        const paperPoint = this.screenToPaper(e.offsetX, e.offsetY);
        if (CAD.activeSpace === 'PAPER') {
            const viewport = this.getViewportAtPoint(paperPoint);
            if (viewport) {
                CAD.activeSpace = 'MODEL';
                CAD.activeViewportId = viewport.id;
                UI.log('MSPACE: Model space active in viewport.');
                Renderer.draw();
            }
        } else {
            CAD.activeSpace = 'PAPER';
            CAD.activeViewportId = null;
            UI.log('PSPACE: Paper space active.');
            Renderer.draw();
        }
    },

    onMiddleDoubleClick() {
        // Double middle click to zoom extents
        Commands.zoomExtents();
        Renderer.draw();
    },

    // ==========================================
    // TOUCH EVENTS
    // ==========================================

    touchState: {
        lastTap: 0,
        lastDistance: 0,
        touches: [],
        startX: 0,
        startY: 0,
        startTime: 0,
        moved: false,
        isPanning: false,
        longPressTimer: null,
        panModeActive: false  // Toggle pan mode on mobile
    },

    isMobile() {
        return window.innerWidth <= 768 || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    },

    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = e.target.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touchState.startX = x;
            this.touchState.startY = y;
            this.touchState.startTime = Date.now();
            this.touchState.moved = false;
            this.touchState.isPanning = false;

            // Check for double tap
            const now = Date.now();
            if (now - this.touchState.lastTap < 300) {
                // Double tap — zoom extents
                clearTimeout(this.touchState.longPressTimer);
                Commands.zoomExtents();
                this.touchState.lastTap = 0;
                Renderer.draw();
                return;
            }
            this.touchState.lastTap = now;

            // Long press timer for context menu (500ms)
            this.touchState.longPressTimer = setTimeout(() => {
                if (!this.touchState.moved) {
                    // Long press: show context menu at touch location
                    UI.showContextMenu(touch.clientX, touch.clientY);
                    this.touchState.isPanning = false;
                }
            }, 500);

            // In pan mode or no active command: start panning
            if (this.touchState.panModeActive || (!CAD.activeCmd && !CAD.selectionMode)) {
                this.touchState.isPanning = true;
            }

            const world = Utils.screenToWorld(x, y, CAD.pan, CAD.zoom);
            CAD.cursor = world;
            CAD.cursorWorld = world;
            CAD.tempEnd = world;
        } else if (e.touches.length === 2) {
            // Cancel long press and single-touch actions
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.isPanning = false;

            // Start pinch zoom
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            this.touchState.lastDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            this.touchState.pinchCenterX = (t1.clientX + t2.clientX) / 2;
            this.touchState.pinchCenterY = (t1.clientY + t2.clientY) / 2;
        }

        Renderer.draw();
    },

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = e.target.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const dx = x - this.touchState.startX;
            const dy = y - this.touchState.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If moved more than 8px, cancel long press and mark as moved
            if (dist > 8) {
                this.touchState.moved = true;
                clearTimeout(this.touchState.longPressTimer);
            }

            if (this.touchState.isPanning || (this.touchState.moved && this.touchState.panModeActive)) {
                // Pan the view
                CAD.pan.x += (x - this.touchState.startX);
                CAD.pan.y += (y - this.touchState.startY);
                this.touchState.startX = x;
                this.touchState.startY = y;
                this.touchState.isPanning = true;
            } else {
                // Update cursor and temp line for drawing
                const world = Utils.screenToWorld(x, y, CAD.pan, CAD.zoom);
                CAD.cursor = world;
                CAD.cursorWorld = world;
                CAD.tempEnd = world;
                UI.updateCoordinates(world.x, world.y);
            }
        } else if (e.touches.length === 2) {
            // Pinch zoom + two-finger pan
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const newCenterX = (t1.clientX + t2.clientX) / 2;
            const newCenterY = (t1.clientY + t2.clientY) / 2;

            if (this.touchState.lastDistance > 0) {
                const scale = distance / this.touchState.lastDistance;
                const rect = e.target.getBoundingClientRect();
                const x = newCenterX - rect.left;
                const y = newCenterY - rect.top;

                const worldBefore = Utils.screenToWorld(x, y, CAD.pan, CAD.zoom);
                CAD.zoom *= scale;
                CAD.zoom = Utils.clamp(CAD.zoom, 0.01, 100);
                CAD.pan.x = x - worldBefore.x * CAD.zoom;
                CAD.pan.y = y - worldBefore.y * CAD.zoom;
            }

            // Two-finger pan (movement of center point)
            if (this.touchState.pinchCenterX !== undefined) {
                const panDx = newCenterX - this.touchState.pinchCenterX;
                const panDy = newCenterY - this.touchState.pinchCenterY;
                CAD.pan.x += panDx;
                CAD.pan.y += panDy;
            }

            this.touchState.lastDistance = distance;
            this.touchState.pinchCenterX = newCenterX;
            this.touchState.pinchCenterY = newCenterY;
        }

        Renderer.draw();
    },

    onTouchEnd(e) {
        clearTimeout(this.touchState.longPressTimer);

        if (e.touches.length === 0) {
            this.touchState.lastDistance = 0;
            this.touchState.pinchCenterX = undefined;
            this.touchState.pinchCenterY = undefined;

            // If it was a tap (not a pan/long-press), handle as click
            if (!this.touchState.moved && !this.touchState.isPanning) {
                const rect = e.target.getBoundingClientRect();
                const x = this.touchState.startX;
                const y = this.touchState.startY;
                const world = Utils.screenToWorld(x, y, CAD.pan, CAD.zoom);
                CAD.cursor = world;
                CAD.cursorWorld = world;
                CAD.tempEnd = world;
                Commands.handleClick(world);
                UI.updatePropertiesPanel();
                Renderer.draw();
            }

            this.touchState.isPanning = false;
            this.touchState.moved = false;
        }
    },

    // ==========================================
    // VIEW UTILITIES
    // ==========================================

    centerView() {
        const canvas = Renderer.canvas;
        if (!canvas) return;

        CAD.pan.x = canvas.width / 2;
        CAD.pan.y = canvas.height / 2;
        Renderer.draw();
    },

    // ==========================================
    // COMMAND SHORTCUTS
    // ==========================================

    executeCommand(cmdName) {
        Commands.startCommand(cmdName);
        UI.focusCommandLine();
    }
};

// ============================================
// MOBILE UI MODULE
// ============================================

const MobileUI = {
    _numpadOpen: false,
    _numpadValue: '',
    _lastPrompt: '',
    _lastToolName: '',

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        this.updateSnapButtons();
        this._cacheElements();
    },

    _cacheElements() {
        this._els = {
            drawBar:      document.getElementById('mobileDrawBar'),
            toolBadge:    document.getElementById('mdbToolBadge'),
            promptText:   document.getElementById('mdbPromptText'),
            inputRow:     document.getElementById('mdbInputRow'),
            input:        document.getElementById('mdbInput'),
            actions:      document.getElementById('mdbActions'),
            subActions:   document.getElementById('mdbSubActions'),
            doneBtn:      document.getElementById('mdbDone'),
            closeBtn:     document.getElementById('mdbClose'),
            numpadBtn:    document.getElementById('mdbNumpadBtn'),
            numpad:       document.getElementById('mobileNumpad'),
            toolbar:      document.getElementById('mobileToolbar'),
            cmdInput:     document.getElementById('cmdInput')
        };
    },

    // ==========================================
    // DRAW BAR — prompt & action management
    // ==========================================

    /**
     * Called by UI.log() when a prompt message arrives.
     * Parses the prompt to extract tool name and message text.
     * e.g. "LINE: Specify first point:" → tool="LINE", text="Specify first point"
     */
    updatePrompt(message) {
        if (!this._els) return;

        const colonIdx = message.indexOf(':');
        let toolName = '';
        let promptText = message;

        if (colonIdx > 0 && colonIdx < 20) {
            toolName = message.substring(0, colonIdx).trim().toUpperCase();
            promptText = message.substring(colonIdx + 1).trim();
            // Remove trailing colon
            if (promptText.endsWith(':')) {
                promptText = promptText.slice(0, -1).trim();
            }
        }

        this._lastPrompt = promptText;
        this._lastToolName = toolName;

        // Update badge
        if (toolName) {
            this._els.toolBadge.textContent = toolName;
            this._els.toolBadge.classList.add('visible');
        }

        // Update prompt text
        this._els.promptText.textContent = promptText || message;
        this._els.promptText.classList.toggle('active', !!CAD.activeCmd);

        // Show/hide Close button for polyline-like commands
        const closable = ['polyline', 'polygon', 'spline'].includes(CAD.activeCmd);
        const hasPoints = CAD.points && CAD.points.length >= 2;
        if (this._els.closeBtn) {
            this._els.closeBtn.classList.toggle('visible', closable && hasPoints);
        }

        this.updateSubActions();
    },

    /**
     * Called when command state changes (active/inactive).
     */
    updateCommandState() {
        if (!this._els) return;

        if (CAD.activeCmd) {
            // Tool is active — show contextual badge
            const name = CAD.activeCmd.toUpperCase();
            this._els.toolBadge.textContent = name;
            this._els.toolBadge.classList.add('visible');
            this._els.promptText.classList.add('active');
        } else {
            // Idle
            this._els.toolBadge.classList.remove('visible');
            this._els.promptText.textContent = 'Tap a tool to begin';
            this._els.promptText.classList.remove('active');
            this._lastToolName = '';
            this._lastPrompt = '';

            // Auto-close numpad when command ends
            if (this._numpadOpen) {
                this.hideNumpad();
            }
        }

        this.updateSubActions();
    },

    updateSubActions() {
        if (!this._els || !this._els.subActions) return;

        const actions = [];
        const cmd = CAD.activeCmd || '';

        if (cmd === 'polyline') {
            actions.push({ label: 'Arc', value: 'A' });
            actions.push({ label: 'Line', value: 'L' });
            actions.push({ label: 'Close', value: 'C' });
            actions.push({ label: 'Undo', value: 'U' });
        } else if (cmd === 'spline') {
            actions.push({ label: 'Close', value: 'C' });
            actions.push({ label: 'Undo', value: 'U' });
        } else if (cmd === 'hatch') {
            actions.push({ label: 'Solid', value: 'solid' });
            actions.push({ label: 'Angle', value: 'angle' });
            actions.push({ label: 'Cross', value: 'cross' });
            actions.push({ label: 'Dots', value: 'dots' });
            actions.push({ label: 'List', value: 'list' });
        }

        this._els.subActions.innerHTML = '';
        if (!actions.length) return;

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'mdb-btn mdb-subaction';
            btn.textContent = action.label;
            btn.addEventListener('click', () => this.submitValue(action.value));
            this._els.subActions.appendChild(btn);
        });
    },

    // ==========================================
    // NUMERIC KEYPAD
    // ==========================================

    toggleNumpad() {
        if (this._numpadOpen) {
            this.hideNumpad();
        } else {
            this.showNumpad();
        }
    },

    showNumpad() {
        if (!this._els) return;
        this._numpadOpen = true;
        this._numpadValue = '';

        this._els.numpad.classList.add('visible');
        this._els.inputRow.classList.add('visible');
        this._els.numpadBtn.classList.add('active');
        this._els.toolbar.classList.add('numpad-open');

        this._els.input.value = '';
        this._els.input.focus();
    },

    hideNumpad() {
        if (!this._els) return;
        this._numpadOpen = false;
        this._numpadValue = '';

        this._els.numpad.classList.remove('visible');
        this._els.inputRow.classList.remove('visible');
        this._els.numpadBtn.classList.remove('active');
        this._els.toolbar.classList.remove('numpad-open');

        this._els.input.value = '';
    },

    /**
     * Handle a key press from the on-screen numpad.
     */
    numpadPress(key) {
        if (!this._els) return;

        if (key === 'backspace') {
            this._numpadValue = this._numpadValue.slice(0, -1);
        } else {
            this._numpadValue += key;
        }

        this._els.input.value = this._numpadValue;

        // Brief visual flash on input to confirm key registration
        this._els.input.style.borderColor = 'var(--accent-blue)';
        setTimeout(() => {
            if (this._els.input) {
                this._els.input.style.borderColor = '';
            }
        }, 120);
    },

    numpadClear() {
        this._numpadValue = '';
        if (this._els && this._els.input) {
            this._els.input.value = '';
        }
    },

    // ==========================================
    // INPUT SUBMISSION
    // ==========================================

    /**
     * Submit the current numpad/input value to the command system.
     * Routes through the existing cmdInput → handleCommandInput flow.
     */
    submitInput() {
        if (!this._els) return;

        const value = this._numpadValue || this._els.cmdInput?.value || this._els.input?.value || '';

        // Route through the main command input system
        if (this._els.cmdInput) {
            this._els.cmdInput.value = value;
            // Dispatch Enter keydown to trigger UI.handleCommandInput
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            this._els.cmdInput.dispatchEvent(event);
        }

        // Clear numpad value but keep numpad open for next input
        this._numpadValue = '';
        if (this._els.input) {
            this._els.input.value = '';
        }
    },

    /**
     * Submit a specific string value (e.g., "C" for Close).
     */
    submitValue(val) {
        if (!this._els) return;
        this._numpadValue = val;
        this.submitInput();
    },

    /**
     * Cancel the current command and reset mobile UI state.
     */
    cancelCommand() {
        Commands.cancelCommand();
        this.hideNumpad();
        Renderer.draw();
    },

    /**
     * Show the system keyboard by focusing the hidden cmdInput.
     * The command panel is display:none on mobile, but the input still
     * exists in the DOM. We temporarily make it visible in a floating
     * overlay style, then hide it again after input.
     */
    showKeyboard() {
        if (!this._els || !this._els.cmdInput) return;

        if (this._numpadOpen) {
            this.hideNumpad();
        }

        if (this._els.inputRow) {
            this._els.inputRow.classList.add('visible');
        }

        if (this._els.input) {
            this._els.input.readOnly = false;
            this._els.input.inputMode = 'text';
            this._els.input.focus();
        }

        // Temporarily show the command panel as a floating input
        const panel = document.querySelector('.command-panel');
        if (panel) {
            panel.style.display = 'block';
            panel.style.position = 'fixed';
            panel.style.bottom = '0';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.zIndex = '9999';
            panel.style.maxHeight = 'none';
            panel.style.borderTop = '2px solid var(--accent-blue)';

            // Hide history, show only input
            const history = panel.querySelector('.command-history');
            if (history) history.style.display = 'none';

            this._els.cmdInput.style.fontSize = '16px';

            const syncInput = () => {
                this._numpadValue = this._els.cmdInput.value;
                if (this._els.input) {
                    this._els.input.value = this._numpadValue;
                }
            };

            this._els.cmdInput.addEventListener('input', syncInput);
            const syncMobileInput = () => {
                if (!this._els) return;
                this._numpadValue = this._els.input.value;
                this._els.cmdInput.value = this._els.input.value;
            };
            this._els.input?.addEventListener('input', syncMobileInput);
            let closeKeyboard;
            const submitOnEnter = (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.submitInput();
                    closeKeyboard();
                }
            };

            // Close on Enter or blur
            closeKeyboard = () => {
                panel.style.display = '';
                panel.style.position = '';
                panel.style.bottom = '';
                panel.style.left = '';
                panel.style.right = '';
                panel.style.zIndex = '';
                panel.style.maxHeight = '';
                panel.style.borderTop = '';
                if (history) history.style.display = '';
                this._els.cmdInput.removeEventListener('blur', closeKeyboard);
                this._els.cmdInput.removeEventListener('input', syncInput);
                this._els.input?.removeEventListener('input', syncMobileInput);
                this._els.input?.removeEventListener('blur', closeKeyboard);
                this._els.input?.removeEventListener('keydown', submitOnEnter);
                if (this._els.input) {
                    this._els.input.readOnly = true;
                }
            };

            this._els.cmdInput.addEventListener('blur', closeKeyboard, { once: true });
            this._els.input?.addEventListener('blur', closeKeyboard, { once: true });
            this._els.input?.addEventListener('keydown', submitOnEnter);

            // Also close on Enter key (after command processes)
            const onEnter = (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    setTimeout(closeKeyboard, 50);
                    this._els.cmdInput.removeEventListener('keydown', onEnter);
                }
            };
            this._els.cmdInput.addEventListener('keydown', onEnter);
        }
    },

    // ==========================================
    // TOOLBAR TABS
    // ==========================================

    switchTab(tabName) {
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mtab === tabName);
        });
        document.querySelectorAll('.mobile-tool-row').forEach(row => {
            row.classList.toggle('active', row.dataset.mtab === tabName);
        });
    },

    // ==========================================
    // MENU DRAWER
    // ==========================================

    toggleMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        overlay.classList.add('visible');
    },

    closeMenu(event) {
        if (event && event.target !== event.currentTarget) return;
        const overlay = document.getElementById('mobileMenuOverlay');
        overlay.classList.remove('visible');
    },

    menuAction(action) {
        this.closeMenu();
        switch (action) {
            case 'new':
                if (confirm('Start a new drawing? All unsaved changes will be lost.')) {
                    CAD.newDrawing();
                    UI.log('New drawing started.');
                    Renderer.draw();
                    UI.updateLayerUI();
                    UI.renderLayoutTabs();
                }
                break;
            case 'open':        Storage.openFile(); break;
            case 'save':        Storage.saveToLocalStorage(); break;
            case 'exportdxf':   Storage.exportDXF(); break;
            case 'exportsvg':   Storage.exportSVG(); break;
            case 'exportjson':  Storage.exportJSON(); break;
            case 'selectall':   Commands.execute('selectall'); break;
            case 'filter':      Commands.execute('filter'); break;
            case 'qselect':     Commands.execute('qselect'); break;
            case 'block':       App.executeCommand('block'); break;
            case 'insert':      App.executeCommand('insert'); break;
            case 'matchprop':   App.executeCommand('matchprop'); break;
            case 'overkill':    App.executeCommand('overkill'); break;
            case 'purge':       App.executeCommand('purge'); break;
            case 'find':        App.executeCommand('find'); break;
            case 'settings':
                UI.log('Settings: Use command line for GRID, SNAP, ORTHO, OSNAP, POLAR, LTSCALE, DIMSCALE, DIMSTYLE, LAYOUT, LAYERSTATE');
                break;
            case 'layout':     App.executeCommand('layout'); break;
            case 'dimstyle':   App.executeCommand('dimstyle'); break;
            case 'layerstate': App.executeCommand('layerstate'); break;
            case 'help':        App.executeCommand('help'); break;
            case 'driveopen':   Storage.openFromDrive(); break;
            case 'drivesave':   Storage.saveToDrivePrompt(); break;
            case 'googlesignin': Storage.handleGoogleSignIn(); break;
        }
    },

    // ==========================================
    // SNAP CONTROLS
    // ==========================================

    toggleSnap(type) {
        switch (type) {
            case 'osnap': UI.toggleOsnap(); break;
            case 'grid':  UI.toggleGrid(); break;
            case 'ortho': UI.toggleOrtho(); break;
            case 'polar': UI.togglePolar(); break;
        }
        this.updateSnapButtons();
    },

    updateSnapButtons() {
        const osnapBtn = document.getElementById('mSnapOsnap');
        const gridBtn = document.getElementById('mSnapGrid');
        const orthoBtn = document.getElementById('mSnapOrtho');
        const polarBtn = document.getElementById('mSnapPolar');

        if (osnapBtn) osnapBtn.classList.toggle('active', CAD.osnapEnabled);
        if (gridBtn) gridBtn.classList.toggle('active', CAD.showGrid);
        if (orthoBtn) orthoBtn.classList.toggle('active', CAD.orthoEnabled);
        if (polarBtn) polarBtn.classList.toggle('active', CAD.polarEnabled);
    },

    // ==========================================
    // LAYER PROPERTIES MANAGER (CAD-style)
    // ==========================================

    _selectedLayer: null,

    showLayerPanel() {
        const overlay = document.getElementById('layerMgrOverlay');
        if (overlay) {
            overlay.classList.add('visible');
            this._selectedLayer = CAD.currentLayer;
            this._refreshLayerPanel();
        }
    },

    closeLayerPanel(event) {
        if (event && event.target !== event.currentTarget) return;
        const overlay = document.getElementById('layerMgrOverlay');
        if (overlay) overlay.classList.remove('visible');
    },

    _refreshLayerPanel() {
        const tbody = document.getElementById('layerMgrBody');
        const currentLabel = document.getElementById('layerMgrCurrent');
        if (!tbody) return;

        if (currentLabel) currentLabel.textContent = CAD.currentLayer;

        tbody.innerHTML = '';
        CAD.layers.forEach(layer => {
            const tr = document.createElement('tr');
            const isCurrent = layer.name === CAD.currentLayer;
            const isSelected = layer.name === this._selectedLayer;
            tr.className = (isCurrent ? 'lm-current ' : '') + (isSelected ? 'lm-selected' : '');
            tr.dataset.layer = layer.name;

            // Status column
            const tdStatus = document.createElement('td');
            tdStatus.innerHTML = isCurrent ? '<span style="color:var(--accent-blue)">&#9658;</span>' : '';
            tr.appendChild(tdStatus);

            // Name column
            const tdName = document.createElement('td');
            tdName.textContent = layer.name;
            tdName.addEventListener('dblclick', () => {
                if (layer.name === '0') return;
                const input = document.createElement('input');
                input.className = 'lm-name-input';
                input.value = layer.name;
                tdName.textContent = '';
                tdName.appendChild(input);
                input.focus();
                input.select();
                const finish = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== layer.name && !CAD.getLayer(newName)) {
                        CAD.entities.forEach(e => { if (e.layer === layer.name) e.layer = newName; });
                        if (CAD.currentLayer === layer.name) CAD.currentLayer = newName;
                        layer.name = newName;
                        UI.updateLayerUI();
                    }
                    this._refreshLayerPanel();
                };
                input.addEventListener('blur', finish, { once: true });
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
            });
            tr.appendChild(tdName);

            // On/Off toggle
            const tdOn = document.createElement('td');
            tdOn.style.textAlign = 'center';
            const onToggle = document.createElement('span');
            onToggle.className = 'lm-toggle' + (layer.visible === false ? ' off' : '');
            onToggle.innerHTML = layer.visible === false ? '&#9711;' : '&#9679;';
            onToggle.title = layer.visible === false ? 'Off' : 'On';
            onToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = layer.visible === false ? true : false;
                Renderer.draw();
                this._refreshLayerPanel();
            });
            tdOn.appendChild(onToggle);
            tr.appendChild(tdOn);

            // Freeze toggle
            const tdFreeze = document.createElement('td');
            tdFreeze.style.textAlign = 'center';
            const frzToggle = document.createElement('span');
            frzToggle.className = 'lm-toggle' + (layer.frozen ? '' : ' off');
            frzToggle.innerHTML = '&#10052;';
            frzToggle.title = layer.frozen ? 'Frozen' : 'Thawed';
            frzToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.frozen = !layer.frozen;
                Renderer.draw();
                this._refreshLayerPanel();
            });
            tdFreeze.appendChild(frzToggle);
            tr.appendChild(tdFreeze);

            // Lock toggle
            const tdLock = document.createElement('td');
            tdLock.style.textAlign = 'center';
            const lockToggle = document.createElement('span');
            lockToggle.className = 'lm-toggle' + (layer.locked ? '' : ' off');
            lockToggle.innerHTML = layer.locked ? '&#128274;' : '&#128275;';
            lockToggle.title = layer.locked ? 'Locked' : 'Unlocked';
            lockToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.locked = !layer.locked;
                this._refreshLayerPanel();
            });
            tdLock.appendChild(lockToggle);
            tr.appendChild(tdLock);

            // Color column
            const tdColor = document.createElement('td');
            const swatch = document.createElement('span');
            swatch.className = 'lm-color-swatch';
            swatch.style.background = layer.color;
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'lm-color-input';
            colorInput.value = layer.color;
            colorInput.addEventListener('input', (e) => {
                layer.color = e.target.value;
                swatch.style.background = e.target.value;
                UI.updateLayerUI();
                Renderer.draw();
            });
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                colorInput.click();
            });
            tdColor.appendChild(swatch);
            tdColor.appendChild(colorInput);
            tr.appendChild(tdColor);

            // Linetype column
            const tdLtype = document.createElement('td');
            tdLtype.textContent = layer.lineType || 'Continuous';
            tdLtype.addEventListener('dblclick', () => {
                const types = ['Continuous', 'Dashed', 'Dotted', 'DashDot', 'Center', 'Phantom', 'Hidden'];
                const currentIdx = types.indexOf(layer.lineType || 'Continuous');
                const nextIdx = (currentIdx + 1) % types.length;
                layer.lineType = types[nextIdx];
                Renderer.draw();
                this._refreshLayerPanel();
            });
            tr.appendChild(tdLtype);

            // Line weight column
            const tdLw = document.createElement('td');
            tdLw.textContent = layer.lineWeight || 'Default';
            tdLw.addEventListener('dblclick', () => {
                const weights = ['Default', '0.05', '0.09', '0.13', '0.15', '0.18', '0.20', '0.25', '0.30', '0.35', '0.40', '0.50', '0.60', '0.70', '0.80', '0.90', '1.00', '1.20', '1.40', '2.00'];
                const currentIdx = weights.indexOf(layer.lineWeight || 'Default');
                const nextIdx = (currentIdx + 1) % weights.length;
                layer.lineWeight = weights[nextIdx];
                this._refreshLayerPanel();
            });
            tr.appendChild(tdLw);

            // Row click = select
            tr.addEventListener('click', () => {
                this._selectedLayer = layer.name;
                this._refreshLayerPanel();
            });

            tbody.appendChild(tr);
        });
    },

    setCurrentFromSelected() {
        if (this._selectedLayer) {
            CAD.setCurrentLayer(this._selectedLayer);
            UI.updateLayerUI();
            this._refreshLayerPanel();
        }
    },

    addLayer() {
        const name = prompt('Enter layer name:', `Layer${CAD.layers.length}`);
        if (name) {
            if (CAD.addLayer(name)) {
                CAD.setCurrentLayer(name);
                this._selectedLayer = name;
                UI.updateLayerUI();
                this._refreshLayerPanel();
                UI.log(`Layer "${name}" created.`);
            } else {
                UI.log(`Layer "${name}" already exists.`, 'error');
            }
        }
    },

    deleteLayer() {
        const target = this._selectedLayer || CAD.currentLayer;
        if (target === '0') {
            UI.log('Cannot delete layer 0.', 'error');
            return;
        }
        if (confirm(`Delete layer "${target}"? Entities will move to layer 0.`)) {
            CAD.entities.forEach(e => {
                if (e.layer === target) e.layer = '0';
            });
            CAD.layers = CAD.layers.filter(l => l.name !== target);
            if (CAD.currentLayer === target) CAD.setCurrentLayer('0');
            this._selectedLayer = CAD.currentLayer;
            UI.updateLayerUI();
            Renderer.draw();
            this._refreshLayerPanel();
            UI.log(`Layer "${target}" deleted. Entities moved to layer 0.`);
        }
    },

    cycleSelectedLayerLineType() {
        const target = this._selectedLayer || CAD.currentLayer;
        const layer = CAD.getLayer(target);
        if (!layer) return;
        const types = ['Continuous', 'Dashed', 'Dotted', 'DashDot', 'Center', 'Phantom', 'Hidden'];
        const currentIdx = types.indexOf(layer.lineType || 'Continuous');
        const nextIdx = (currentIdx + 1) % types.length;
        layer.lineType = types[nextIdx];
        Renderer.draw();
        this._refreshLayerPanel();
        UI.log(`Layer "${layer.name}" linetype: ${layer.lineType}.`);
    },

    cycleSelectedLayerLineWeight() {
        const target = this._selectedLayer || CAD.currentLayer;
        const layer = CAD.getLayer(target);
        if (!layer) return;
        const weights = ['Default', '0.05', '0.09', '0.13', '0.15', '0.18', '0.20', '0.25', '0.30', '0.35', '0.40', '0.50', '0.60', '0.70', '0.80', '0.90', '1.00', '1.20', '1.40', '2.00'];
        const currentIdx = weights.indexOf(layer.lineWeight || 'Default');
        const nextIdx = (currentIdx + 1) % weights.length;
        layer.lineWeight = weights[nextIdx];
        Renderer.draw();
        this._refreshLayerPanel();
        UI.log(`Layer "${layer.name}" lineweight: ${layer.lineWeight}.`);
    },

    // ==========================================
    // PAN MODE
    // ==========================================

    togglePanMode() {
        App.touchState.panModeActive = !App.touchState.panModeActive;
        const viewport = document.getElementById('viewport');
        if (App.touchState.panModeActive) {
            viewport.style.cursor = 'grab';
            UI.log('Pan mode: ON (tap to place points disabled)');
        } else {
            viewport.style.cursor = 'crosshair';
            UI.log('Pan mode: OFF (tap to draw/select)');
        }
    }
};
// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    MobileUI.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
