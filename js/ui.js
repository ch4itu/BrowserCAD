/* ============================================
   BrowserCAD - UI Module
   ============================================ */

const UI = {
    elements: {},
    activeButton: null,
    commandHistory: [],
    historyIndex: -1,
    lastCommand: null,
    maxHistorySize: 50,
    defaultPlaceholder: 'Type a command',

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        // Cache DOM elements
        this.elements = {
            cmdInput: document.getElementById('cmdInput'),
            cmdHistory: document.getElementById('cmdHistory'),
            cmdPrompt: document.getElementById('commandPrompt'),
            imageAttachInput: document.getElementById('imageAttachInput'),
            lispScriptInput: document.getElementById('lispScriptInput'),
            coordDisplay: document.getElementById('coordDisplay'),
            layerSelect: document.getElementById('layerSelect'),
            layerColor: document.getElementById('layerColor'),
            statusSnap: document.getElementById('statusSnap'),
            statusGrid: document.getElementById('statusGrid'),
            statusOrtho: document.getElementById('statusOrtho'),
            statusPolar: document.getElementById('statusPolar'),
            propertiesPanel: document.getElementById('propertiesPanel'),
            viewportTabs: document.getElementById('viewportTabs'),
            desktopHatchSwatches: document.getElementById('desktopHatchSwatches')
        };

        // Setup event listeners
        this.setupEventListeners();
        this.updateLayerUI();
        this.renderLayoutTabs();
        this.updateStatusBar();
        this.updateCommandPrompt(null);
        this.ensureCommandButtons();

        // Focus command line
        this.focusCommandLine();

        return this;
    },

    renderLayoutTabs() {
        const tabs = this.elements.viewportTabs;
        if (!tabs) return;
        tabs.innerHTML = '';

        CAD.layouts.forEach(layout => {
            const tab = document.createElement('div');
            tab.className = `viewport-tab${layout.name === CAD.currentLayout ? ' active' : ''}`;
            tab.textContent = layout.name;
            tab.addEventListener('click', () => {
                CAD.setCurrentLayout(layout.name);
                this.renderLayoutTabs();
                Renderer.draw();
            });
            tabs.appendChild(tab);
        });

        const addTab = document.createElement('button');
        addTab.className = 'viewport-tab viewport-tab-add';
        addTab.textContent = '+';
        addTab.title = 'Add Layout';
        addTab.addEventListener('click', () => {
            this.addLayout();
        });
        tabs.appendChild(addTab);
    },

    addLayout() {
        let index = 1;
        let name = `Layout${index}`;
        while (CAD.getLayout(name)) {
            index += 1;
            name = `Layout${index}`;
        }
        CAD.addLayout(name);
        CAD.setCurrentLayout(name);
        this.renderLayoutTabs();
        Renderer.draw();
        UI.log(`LAYOUT: Created ${name}.`, 'success');
    },

    ensureCommandButtons() {
        const desktopTargets = [
            { cmd: 'block', label: 'Block', title: 'Make Block (B)', icon: '\u25A3' },
            { cmd: 'insert', label: 'Insert', title: 'Insert Block (I)', icon: '\u2795' },
            { cmd: 'hatch', label: 'Hatch', title: 'Hatch (H)', icon: '\u2592' },
            { cmd: 'hatchedit', label: 'HatchEdit', title: 'Edit Hatch (HE)', icon: '\u2591' }
        ];
        const drawPanel = document.querySelector('.ribbon-content[data-tab="draw"] .ribbon-panel-content');
        if (drawPanel) {
            desktopTargets.forEach(target => {
                const existing = document.querySelector(`.tool-btn[data-cmd="${target.cmd}"]`);
                if (existing) return;
                const button = document.createElement('button');
                button.className = 'tool-btn';
                button.dataset.cmd = target.cmd;
                button.title = target.title;
                button.onclick = () => App.executeCommand(target.cmd);
                const icon = document.createElement('i');
                icon.className = 'icon';
                icon.textContent = target.icon;
                const label = document.createElement('span');
                label.className = 'label';
                label.textContent = target.label;
                button.appendChild(icon);
                button.appendChild(label);
                drawPanel.appendChild(button);
            });
        }

        const mobileRow = document.querySelector('.mobile-tool-row[data-mtab="draw"]');
        if (mobileRow) {
            desktopTargets.forEach(target => {
                const existing = mobileRow.querySelector(`.mobile-tool-btn[data-cmd="${target.cmd}"]`);
                if (existing) return;
                const button = document.createElement('button');
                button.className = 'mobile-tool-btn';
                button.dataset.cmd = target.cmd;
                button.onclick = () => App.executeCommand(target.cmd);
                const icon = document.createElement('i');
                icon.className = 'm-icon';
                icon.textContent = target.icon;
                const label = document.createElement('span');
                label.className = 'm-label';
                label.textContent = target.label;
                button.appendChild(icon);
                button.appendChild(label);
                mobileRow.appendChild(button);
            });
        }
    },

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    setupEventListeners() {
        // Command input handling
        if (this.elements.cmdInput) {
            this.elements.cmdInput.addEventListener('keydown', (e) => {
                this.handleCommandInput(e);
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Re-focus command line after any canvas interaction
        const viewport = document.getElementById('viewport');
        if (viewport) {
            viewport.addEventListener('pointerup', () => {
                // Small delay so click handlers run first
                requestAnimationFrame(() => this.focusCommandLine());
            });
        }

        // Prevent text selection during CAD operations, but allow in command history
        document.addEventListener('selectstart', (e) => {
            const target = e.target;
            // Allow selection in INPUT elements and command history
            // Check if target has closest method (it's an Element, not a text node)
            if (target.tagName === 'INPUT' ||
                (target.closest && target.closest('.command-history')) ||
                (target.closest && target.closest('.properties-panel')) ||
                (target.closest && target.closest('.panel-content'))) {
                return; // Allow selection
            }
            e.preventDefault();
        });
    },

    handleCommandInput(e) {
        const input = this.elements.cmdInput;
        const currentValue = input.value;

        // For LISP expressions (starting with '('), allow space for input,
        // but submit on space if the expression is balanced.
        if (e.key === ' ' && currentValue.startsWith('(')) {
            if (!this.isBalancedLisp(currentValue.trim())) {
                return;
            }
        }

        // Handle Enter and Space keys (Space acts like Enter in CAD)
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const value = currentValue.trim();

            // Space or Enter with empty input - repeat last command or act as Enter
            if (!value) {
                if (CAD.activeCmd) {
                    // During active command, space/enter confirms or finishes
                    Commands.handleInput('');
                } else if (this.lastCommand) {
                    // No active command - repeat last command
                    this.log(`Command: ${this.lastCommand}`, 'input');
                    Commands.execute(this.lastCommand);
                }
                input.value = '';
                return;
            }

            // Check for LISP expression
            if (value.startsWith('(')) {
                this.log(`LISP: ${value}`, 'input');
                this.addToHistory(value);
                Lisp.execute(value).then(result => {
                    if (result !== null && result !== undefined) {
                        this.log(Lisp.toString(result), 'success');
                    }
                });
                input.value = '';
                return;
            }

            this.log(`Command: ${value}`, 'input');
            this.addToHistory(value);

            // Try to handle as coordinate/input first
            if (Commands.handleInput(value)) {
                input.value = '';
                return;
            }

            // Store as last command for repeat
            this.lastCommand = value;

            // Otherwise treat as command
            Commands.execute(value);
            input.value = '';
            this.historyIndex = -1;

        } else if (e.key === 'Escape') {
            e.preventDefault();
            Commands.cancelCommand();
            input.value = '';
            this.historyIndex = -1;

        } else if (e.key === 'ArrowUp') {
            // Navigate command history (up)
            e.preventDefault();
            if (this.commandHistory.length > 0) {
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                }
                input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            }

        } else if (e.key === 'ArrowDown') {
            // Navigate command history (down)
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            } else {
                this.historyIndex = -1;
                input.value = '';
            }

        } else if (e.key === 'Tab') {
            // Tab completion for commands
            e.preventDefault();
            this.autoCompleteCommand(input);
        }
    },

    addToHistory(command) {
        // Don't add duplicates consecutively
        if (this.commandHistory.length > 0 &&
            this.commandHistory[this.commandHistory.length - 1] === command) {
            return;
        }

        this.commandHistory.push(command);

        // Limit history size
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }
    },

    autoCompleteCommand(input) {
        const value = input.value.toLowerCase().trim();
        if (!value) return;

        // Find matching commands
        const commands = Object.keys(Commands.aliases);
        const matches = commands.filter(cmd => cmd.startsWith(value));

        if (matches.length === 1) {
            input.value = matches[0].toUpperCase();
        } else if (matches.length > 1) {
            // Show available completions
            this.log(`Completions: ${matches.slice(0, 10).join(', ')}${matches.length > 10 ? '...' : ''}`);
        }
    },

    isBalancedLisp(input) {
        let depth = 0;
        let inString = false;
        let escape = false;

        for (const char of input) {
            if (escape) {
                escape = false;
                continue;
            }
            if (char === '\\' && inString) {
                escape = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
                continue;
            }
            if (inString) continue;
            if (char === '(') depth++;
            if (char === ')') depth--;
        }

        return depth === 0 && !inString;
    },

    handleKeyboard(e) {
        // Don't handle if typing in input (except specific keys)
        if (e.target.tagName === 'INPUT') {
            const isFunctionKey = e.key.startsWith('F');
            const isGlobalShortcut = (e.ctrlKey && e.key === 'a') || e.key === 'Delete';
            if (!isFunctionKey && !isGlobalShortcut) return;
        }

        // Escape - cancel current operation
        if (e.key === 'Escape') {
            e.preventDefault();
            Commands.cancelCommand();
            return;
        }

        // Space or Enter - repeat last command or act as Enter for active command
        if ((e.key === ' ' || e.key === 'Enter') && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (CAD.activeCmd) {
                // Active command - act as Enter to confirm/finish
                Commands.handleInput('');
                Renderer.draw();
            } else if (this.lastCommand) {
                // No active command - repeat last command
                this.log(`Command: ${this.lastCommand}`, 'input');
                Commands.execute(this.lastCommand);
            }
            this.focusCommandLine();
            return;
        }

        // Delete - erase selected
        if (e.key === 'Delete') {
            e.preventDefault();
            if (CAD.selectedIds.length > 0) {
                Commands.startCommand('erase');
            }
            return;
        }

        // Ctrl+Z - Undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            Commands.undo();
            return;
        }

        // Ctrl+Y or Ctrl+Shift+Z - Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            Commands.redo();
            return;
        }

        // Ctrl+A - Select all
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            CAD.selectAll();
            this.log(`${CAD.selectedIds.length} objects selected.`);
            Renderer.draw();
            return;
        }

        // Ctrl+C - Copy
        if (e.ctrlKey && e.key === 'c' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const count = CAD.copyToClipboard();
            if (count > 0) {
                this.log(`${count} objects copied to clipboard.`);
            }
            return;
        }

        // Ctrl+V - Paste
        if (e.ctrlKey && e.key === 'v' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const pasted = CAD.paste();
            if (pasted.length > 0) {
                this.log(`${pasted.length} objects pasted.`);
                Renderer.draw();
            }
            return;
        }

        // Ctrl+S - Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            Storage.saveToLocalStorage();
            return;
        }

        // Ctrl+O - Open
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            Storage.loadFromLocalStorage();
            return;
        }

        // Ctrl+F1 - Toggle ribbon collapse
        if (e.ctrlKey && e.key === 'F1') {
            e.preventDefault();
            this.toggleRibbon();
            return;
        }

        // F1 - Help
        if (e.key === 'F1') {
            e.preventDefault();
            this.showHelp();
            return;
        }

        // F2 - Toggle grid display
        if (e.key === 'F2') {
            e.preventDefault();
            CAD.showGrid = !CAD.showGrid;
            this.log(`Grid display: ${CAD.showGrid ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            Renderer.draw();
            return;
        }

        // F3 - Toggle Object Snap (OSNAP - endpoint, midpoint, center, quadrant, node, etc.)
        if (e.key === 'F3') {
            e.preventDefault();
            CAD.osnapEnabled = !CAD.osnapEnabled;
            this.log(`Object Snap (OSNAP): ${CAD.osnapEnabled ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            return;
        }

        // F7 - Toggle grid display
        if (e.key === 'F7') {
            e.preventDefault();
            CAD.showGrid = !CAD.showGrid;
            this.log(`Grid display: ${CAD.showGrid ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            Renderer.draw();
            return;
        }

        // F8 - Toggle ortho
        if (e.key === 'F8') {
            e.preventDefault();
            CAD.orthoEnabled = !CAD.orthoEnabled;
            this.log(`Ortho: ${CAD.orthoEnabled ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            return;
        }

        // F9 - Toggle Grid Snap (snap cursor to grid points)
        if (e.key === 'F9') {
            e.preventDefault();
            CAD.gridSnapEnabled = !CAD.gridSnapEnabled;
            this.log(`Grid Snap: ${CAD.gridSnapEnabled ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            return;
        }

        // F10 - Toggle polar
        if (e.key === 'F10') {
            e.preventDefault();
            CAD.polarEnabled = !CAD.polarEnabled;
            this.log(`Polar: ${CAD.polarEnabled ? 'ON' : 'OFF'}`);
            this.updateStatusBar();
            return;
        }

        // F12 - Toggle Dynamic Input
        if (e.key === 'F12') {
            e.preventDefault();
            CAD.dynamicInputEnabled = !CAD.dynamicInputEnabled;
            this.log(`Dynamic Input: ${CAD.dynamicInputEnabled ? 'ON' : 'OFF'}`);
            Renderer.draw();
            return;
        }

        // Letter keys - focus command line
        if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && e.target.tagName !== 'INPUT') {
            this.focusCommandLine();
        }
    },

    // ==========================================
    // HELP
    // ==========================================

    showHelp() {
        const helpText = `
BrowserCAD Quick Reference:

DRAWING COMMANDS:
  L, LINE       - Draw lines
  PL, PLINE     - Draw polylines
  C, CIRCLE     - Draw circles
  A, ARC        - Draw arcs
  REC, RECT     - Draw rectangles
  EL, ELLIPSE   - Draw ellipses
  IMAGE, IMAGEATTACH - Attach images for tracing
  T, TEXT       - Add text
  POL, POLYGON  - Draw regular polygons
  DO, DONUT     - Draw donuts
  RAY           - Draw rays
  XL, XLINE     - Draw construction lines
  SPL, SPLINE   - Draw splines
  H, HATCH      - Hatch closed areas (Pattern/Scale/Angle)
  HE, HATCHEDIT - Edit existing hatch properties
  IMAGE, IMAGEATTACH - Attach image for tracing

MODIFY COMMANDS:
  M, MOVE       - Move objects
  CO, COPY      - Copy objects
  RO, ROTATE    - Rotate objects
  SC, SCALE     - Scale objects
  MI, MIRROR    - Mirror objects
  O, OFFSET     - Offset objects
  TR, TRIM      - Trim objects
  E, ERASE      - Erase objects
  X, EXPLODE    - Explode objects
  AR, ARRAY     - Rectangular array
  ARRAYPOLAR    - Polar array
  F, FILLET     - Fillet corners (R for radius)
  CHA, CHAMFER  - Chamfer corners (D for distance)
  BR, BREAK     - Break objects

DIMENSION COMMANDS:
  DIM, DIMLIN   - Linear dimension
  DIMALIGNED    - Aligned dimension
  DIMRAD        - Radius dimension
  DIMDIA        - Diameter dimension
  DIMSTYLE      - Manage dimension styles

UTILITY COMMANDS:
  U, UNDO       - Undo last action
  REDO          - Redo last undo
  Z, ZOOM       - Zoom view (E=extents)
  P, PAN        - Pan view
  LAYOUT        - Manage layouts/paperspace
  LAYERSTATE    - Save/restore layer states
  DIST, DI      - Measure distance
  AREA, AA      - Measure area
  LIST, LI      - List object properties

KEYBOARD SHORTCUTS:
  Space/Enter   - Execute command / Repeat last
  Escape        - Cancel command
  Delete        - Erase selected
  Ctrl+Z        - Undo
  Ctrl+Y        - Redo
  Ctrl+C/V      - Copy/Paste
  Ctrl+A        - Select all
  F2            - Toggle grid
  F3            - Toggle object snap
  F8            - Toggle ortho mode
  Arrow Up/Down - Command history

LISP:
  Type (expression) to execute Lisp code
  APPLOAD - Load .lsp scripts from a local file
  Example: (+ 1 2 3) => 6
  Example: (command "circle" '(0 0) 50)
  Example: (setq x 10)
        `;
        this.log(helpText);
    },

    // ==========================================
    // COMMAND LINE LOGGING
    // ==========================================

    log(message, type = 'default') {
        if (!this.elements.cmdHistory) return;

        const line = document.createElement('div');
        line.className = `line ${type}`;
        line.textContent = message;

        this.elements.cmdHistory.appendChild(line);
        this.elements.cmdHistory.scrollTop = this.elements.cmdHistory.scrollHeight;

        // If it's a prompt, also show in input placeholder (CAD-like)
        if (type === 'prompt') {
            this.setPrompt(message);
            // Feed mobile draw bar with prompt text
            if (typeof MobileUI !== 'undefined' && MobileUI.updatePrompt) {
                MobileUI.updatePrompt(message);
            }
        }
    },

    // Set prompt text in the command input placeholder (CAD-like behavior)
    setPrompt(text) {
        if (this.elements.cmdInput) {
            this.elements.cmdInput.placeholder = text || this.defaultPlaceholder;
        }
    },

    updateCommandPrompt(activeCommand) {
        if (!this.elements.cmdPrompt) return;
        if (activeCommand) {
            this.elements.cmdPrompt.textContent = `Command [${activeCommand.toUpperCase()}]:`;
        } else {
            this.elements.cmdPrompt.textContent = 'Command:';
        }
        // Sync mobile draw bar state
        if (typeof MobileUI !== 'undefined' && MobileUI.updateCommandState) {
            MobileUI.updateCommandState();
        }
        this.updateDesktopHatchSwatches();
    },

    // Reset prompt to default
    resetPrompt() {
        if (this.elements.cmdInput) {
            this.elements.cmdInput.placeholder = this.defaultPlaceholder;
        }
    },

    updateDesktopHatchSwatches() {
        const container = this.elements.desktopHatchSwatches;
        if (!container) return;
        if (CAD.activeCmd !== 'hatch') {
            container.classList.remove('visible');
            container.innerHTML = '';
            return;
        }
        const hatchPatterns = (typeof Commands !== 'undefined' && Commands.hatchPatterns)
            ? Commands.hatchPatterns
            : ['solid'];
        container.innerHTML = '';
        hatchPatterns.forEach(pattern => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'desktop-hatch-swatch';
            const swatch = document.createElement('canvas');
            swatch.width = 28;
            swatch.height = 28;
            const label = document.createElement('span');
            label.className = 'desktop-hatch-swatch-label';
            label.textContent = pattern.startsWith('ansi') || pattern.startsWith('ar-')
                ? pattern.toUpperCase()
                : pattern;
            button.appendChild(swatch);
            button.appendChild(label);
            button.addEventListener('click', () => {
                if (typeof Commands !== 'undefined' && Commands.setHatchPattern) {
                    Commands.setHatchPattern(pattern);
                }
            });
            container.appendChild(button);
            this.renderHatchSwatch(swatch, pattern);
        });
        container.classList.add('visible');
    },

    renderHatchSwatch(canvas, pattern) {
        if (!canvas || typeof Geometry === 'undefined' || !Geometry.Hatch) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = Math.min(canvas.width, canvas.height);
        const rootStyle = getComputedStyle(document.documentElement);
        const stroke = rootStyle.getPropertyValue('--text-bright').trim() || '#e2e8f0';
        const bg = rootStyle.getPropertyValue('--bg-canvas').trim() || '#0f172a';

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        const inset = 2;
        const boundary = [
            { x: inset, y: inset },
            { x: size - inset, y: inset },
            { x: size - inset, y: size - inset },
            { x: inset, y: size - inset }
        ];

        if (pattern === 'solid') {
            ctx.fillStyle = stroke;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2);
            ctx.globalAlpha = 1;
            return;
        }

        const hatch = new Geometry.Hatch(boundary, pattern, 1, 0);
        const lines = hatch.generateRenderLines();
        ctx.beginPath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        lines.forEach(seg => {
            if (!seg || !seg.p1 || !seg.p2) return;
            ctx.moveTo(seg.p1.x, seg.p1.y);
            ctx.lineTo(seg.p2.x, seg.p2.y);
        });
        ctx.stroke();
    },

    promptImageAttach(onLoad) {
        const input = this.elements.imageAttachInput;
        if (!input) return;

        input.value = '';
        input.onchange = () => {
            if (!input.files || input.files.length === 0) {
                this.log('IMAGEATTACH: No file selected.', 'error');
                if (onLoad) onLoad(null);
                return;
            }

            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    if (onLoad) {
                        onLoad({
                            src: reader.result,
                            width: img.width,
                            height: img.height
                        });
                    }
                };
                img.onerror = () => {
                    this.log('IMAGEATTACH: Failed to load image.', 'error');
                    if (onLoad) onLoad(null);
                };
                img.src = reader.result;
            };
            reader.onerror = () => {
                this.log('IMAGEATTACH: Failed to read image.', 'error');
                if (onLoad) onLoad(null);
            };
            reader.readAsDataURL(file);
        };

        input.click();
    },

    promptLispAttach(onLoad) {
        const input = this.elements.lispScriptInput;
        if (!input) return;

        input.value = '';
        input.onchange = () => {
            if (!input.files || input.files.length === 0) {
                this.log('APPLOAD: No file selected.', 'error');
                if (onLoad) onLoad(null);
                return;
            }

            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                if (onLoad) {
                    onLoad({
                        name: file.name,
                        code: reader.result
                    });
                }
            };
            reader.onerror = () => {
                this.log('APPLOAD: Failed to read file.', 'error');
                if (onLoad) onLoad(null);
            };
            reader.readAsText(file);
        };

        input.click();
    },

    clearHistory() {
        if (this.elements.cmdHistory) {
            this.elements.cmdHistory.innerHTML = '';
        }
    },

    focusCommandLine() {
        if (this.elements.cmdInput) {
            // Avoid stealing focus from modals, color pickers, or other inputs
            const active = document.activeElement;
            const isOtherInput = active && active !== document.body &&
                active.tagName === 'INPUT' && active !== this.elements.cmdInput;
            if (!isOtherInput) {
                this.elements.cmdInput.focus();
            }
        }
    },

    // ==========================================
    // TOOLBAR MANAGEMENT
    // ==========================================

    setActiveButton(cmdName) {
        // Remove active class from all buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.mobile-tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.activeButton = cmdName;

        // Store as last command
        if (cmdName) {
            this.lastCommand = cmdName;
        }

        // Add active class to matching button
        if (cmdName) {
            const btn = document.querySelector(`[data-cmd="${cmdName}"]`);
            if (btn) {
                btn.classList.add('active');
            }
            const mobileButtons = document.querySelectorAll('.mobile-tool-btn');
            mobileButtons.forEach(mobileBtn => {
                const explicitCmd = mobileBtn.dataset.cmd;
                const onclick = mobileBtn.getAttribute('onclick') || '';
                const match = onclick.match(/executeCommand\\('([^']+)'\\)/);
                const mobileCmd = explicitCmd || (match ? match[1] : null);
                if (mobileCmd === cmdName) {
                    mobileBtn.classList.add('active');
                }
            });
        }
    },

    // ==========================================
    // COORDINATE DISPLAY
    // ==========================================

    updateCoordinates(x, y) {
        if (this.elements.coordDisplay) {
            this.elements.coordDisplay.textContent =
                `${x.toFixed(4)}, ${y.toFixed(4)}, 0.0000`;
        }
        // Update mobile coordinate overlay
        const mobileCoords = document.getElementById('mobileCoordsOverlay');
        if (mobileCoords) {
            mobileCoords.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
        }
    },

    // ==========================================
    // STATUS BAR
    // ==========================================

    updateStatusBar() {
        // Object Snap (OSNAP)
        const statusOsnap = document.getElementById('statusOsnap');
        if (statusOsnap) {
            statusOsnap.classList.toggle('active', CAD.osnapEnabled);
        }

        // Grid Snap
        const statusGridSnap = document.getElementById('statusGridSnap');
        if (statusGridSnap) {
            statusGridSnap.classList.toggle('active', CAD.gridSnapEnabled);
        }

        // Grid Display
        if (this.elements.statusGrid) {
            this.elements.statusGrid.classList.toggle('active', CAD.showGrid);
        }

        // Ortho
        if (this.elements.statusOrtho) {
            this.elements.statusOrtho.classList.toggle('active', CAD.orthoEnabled);
        }

        // Polar
        if (this.elements.statusPolar) {
            this.elements.statusPolar.classList.toggle('active', CAD.polarEnabled);
        }
    },

    // Toggle Object Snap (F3) - endpoint, midpoint, center, nearest, quadrant, node, etc.
    toggleOsnap() {
        CAD.osnapEnabled = !CAD.osnapEnabled;
        this.log(`Object Snap (OSNAP): ${CAD.osnapEnabled ? 'ON' : 'OFF'}`);
        this.updateStatusBar();
    },

    // Toggle Grid Snap (F9) - snap to grid points
    toggleGridSnap() {
        CAD.gridSnapEnabled = !CAD.gridSnapEnabled;
        this.log(`Grid Snap: ${CAD.gridSnapEnabled ? 'ON' : 'OFF'}`);
        this.updateStatusBar();
    },

    // Legacy toggle - kept for compatibility
    toggleSnap() {
        this.toggleOsnap();
    },

    toggleGrid() {
        CAD.showGrid = !CAD.showGrid;
        this.log(`Grid Display: ${CAD.showGrid ? 'ON' : 'OFF'}`);
        this.updateStatusBar();
        Renderer.draw();
    },

    toggleOrtho() {
        CAD.orthoEnabled = !CAD.orthoEnabled;
        this.log(`Ortho: ${CAD.orthoEnabled ? 'ON' : 'OFF'}`);
        this.updateStatusBar();
    },

    togglePolar() {
        CAD.polarEnabled = !CAD.polarEnabled;
        this.log(`Polar: ${CAD.polarEnabled ? 'ON' : 'OFF'}`);
        this.updateStatusBar();
    },

    // ==========================================
    // LAYER MANAGEMENT
    // ==========================================

    updateLayerUI() {
        const select = this.elements.layerSelect;
        if (!select) return;

        select.innerHTML = '';

        CAD.layers.forEach(layer => {
            const option = document.createElement('option');
            option.value = layer.name;
            option.textContent = layer.name;
            option.style.color = layer.color;
            select.appendChild(option);
        });

        select.value = CAD.currentLayer;

        // Update color picker/swatch
        const currentLayer = CAD.getLayer(CAD.currentLayer);
        if (currentLayer) {
            if (this.elements.layerColor) {
                this.elements.layerColor.value = currentLayer.color;
            }
            // Update the color swatch button
            const swatch = document.getElementById('layerColorSwatch');
            if (swatch) {
                swatch.style.background = currentLayer.color;
            }
        }

        this.updateLayerRibbonControls();
    },

    updateLayerRibbonControls() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;

        const visBtn = document.getElementById('layerToggleVisibility');
        if (visBtn) {
            visBtn.classList.toggle('active', layer.visible !== false);
            const icon = visBtn.querySelector('.icon');
            if (icon) {
                icon.innerHTML = layer.visible === false ? '&#9711;' : '&#9679;';
            }
            visBtn.title = layer.visible === false ? 'Layer Off' : 'Layer On';
        }

        const freezeBtn = document.getElementById('layerToggleFreeze');
        if (freezeBtn) {
            freezeBtn.classList.toggle('active', layer.frozen);
            freezeBtn.title = layer.frozen ? 'Thaw Layer' : 'Freeze Layer';
        }

        const lockBtn = document.getElementById('layerToggleLock');
        if (lockBtn) {
            lockBtn.classList.toggle('active', layer.locked);
            const icon = lockBtn.querySelector('.icon');
            if (icon) {
                icon.innerHTML = layer.locked ? '&#128274;' : '&#128275;';
            }
            lockBtn.title = layer.locked ? 'Unlock Layer' : 'Lock Layer';
        }

        const ltypeBtn = document.getElementById('layerCycleLineType');
        if (ltypeBtn) {
            const label = ltypeBtn.querySelector('.label');
            const lineType = layer.lineType || 'Continuous';
            if (label) {
                label.textContent = lineType;
            }
            ltypeBtn.title = `Cycle Layer Linetype (Current: ${lineType})`;
        }

        const weightBtn = document.getElementById('layerCycleLineWeight');
        if (weightBtn) {
            const label = weightBtn.querySelector('.label');
            const lineWeight = layer.lineWeight || 'Default';
            if (label) {
                label.textContent = lineWeight;
            }
            weightBtn.title = `Cycle Layer Lineweight (Current: ${lineWeight})`;
        }
    },

    onLayerChange() {
        const select = this.elements.layerSelect;
        if (select) {
            CAD.setCurrentLayer(select.value);
            this.updateLayerUI();
            this.log(`Current layer: ${CAD.currentLayer}`);
        }
    },

    onLayerColorChange() {
        const colorInput = this.elements.layerColor;
        if (colorInput) {
            CAD.updateLayerColor(CAD.currentLayer, colorInput.value);
            Renderer.draw();
        }
    },

    addNewLayer() {
        const name = prompt('Enter layer name:', `Layer${CAD.layers.length}`);
        if (name) {
            if (CAD.addLayer(name)) {
                CAD.setCurrentLayer(name);
                this.updateLayerUI();
                this.log(`Layer "${name}" created and set current.`);
            } else {
                this.log(`Layer "${name}" already exists.`, 'error');
            }
        }
    },

    toggleCurrentLayerVisibility() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;
        layer.visible = layer.visible === false ? true : false;
        this.updateLayerUI();
        Renderer.draw();
        this.log(`Layer "${layer.name}" ${layer.visible ? 'On' : 'Off'}.`);
    },

    toggleCurrentLayerFrozen() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;
        layer.frozen = !layer.frozen;
        this.updateLayerUI();
        Renderer.draw();
        this.log(`Layer "${layer.name}" ${layer.frozen ? 'Frozen' : 'Thawed'}.`);
    },

    toggleCurrentLayerLock() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;
        layer.locked = !layer.locked;
        this.updateLayerUI();
        this.log(`Layer "${layer.name}" ${layer.locked ? 'Locked' : 'Unlocked'}.`);
    },

    cycleCurrentLayerLineType() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;
        const types = ['Continuous', 'Dashed', 'Dotted', 'DashDot', 'Center', 'Phantom', 'Hidden'];
        const currentIdx = types.indexOf(layer.lineType || 'Continuous');
        const nextIdx = (currentIdx + 1) % types.length;
        layer.lineType = types[nextIdx];
        this.updateLayerUI();
        Renderer.draw();
        this.log(`Layer "${layer.name}" linetype: ${layer.lineType}.`);
    },

    cycleCurrentLayerLineWeight() {
        const layer = CAD.getLayer(CAD.currentLayer);
        if (!layer) return;
        const weights = ['Default', '0.05', '0.09', '0.13', '0.15', '0.18', '0.20', '0.25', '0.30', '0.35', '0.40', '0.50', '0.60', '0.70', '0.80', '0.90', '1.00', '1.20', '1.40', '2.00'];
        const currentIdx = weights.indexOf(layer.lineWeight || 'Default');
        const nextIdx = (currentIdx + 1) % weights.length;
        layer.lineWeight = weights[nextIdx];
        this.updateLayerUI();
        this.log(`Layer "${layer.name}" lineweight: ${layer.lineWeight}.`);
    },

    // ==========================================
    // PROPERTIES PANEL
    // ==========================================

    togglePropertiesPanel() {
        const panel = document.getElementById('panelLeft');
        if (panel) {
            panel.classList.toggle('collapsed');
            // Resize canvas after panel animation completes
            setTimeout(() => {
                if (typeof Renderer !== 'undefined') {
                    Renderer.resize();
                }
            }, 250); // Wait for CSS transition to complete
        }
    },

    // ==========================================
    // SELECTION RIBBON
    // ==========================================

    // Commands that need entity selection
    modifyCommands: ['move', 'copy', 'rotate', 'scale', 'mirror', 'erase', 'stretch', 'array', 'arrayrect', 'arraypolar', 'offset', 'trim', 'extend', 'fillet', 'chamfer', 'explode'],

    updateSelectionRibbon() {
        const ribbon = document.getElementById('selectionRibbon');
        const countEl = document.getElementById('selectionCount');
        const actionsEl = document.getElementById('selectionActions');
        if (!ribbon) return;

        const selectedCount = CAD.selectedIds ? CAD.selectedIds.length : 0;
        const activeCmd = CAD.activeCmd;
        const isModifyCmd = activeCmd && this.modifyCommands.includes(activeCmd);

        // Show ribbon if entities selected OR if a modify command is active
        if (selectedCount > 0 || isModifyCmd) {
            ribbon.style.display = 'flex';
            if (countEl) {
                countEl.textContent = selectedCount;
            }
            // Update ribbon content based on mode
            this.updateSelectionRibbonContent(selectedCount, isModifyCmd, activeCmd);
        } else {
            ribbon.style.display = 'none';
        }
    },

    updateSelectionRibbonContent(count, isModifyCmd, activeCmd) {
        const actionsEl = document.getElementById('selectionActions');
        if (!actionsEl) return;

        if (isModifyCmd && count === 0) {
            // Show selection helpers during modify commands
            actionsEl.innerHTML = `
                <span class="sel-prompt">Select objects for ${activeCmd.toUpperCase()}:</span>
                <button class="sel-btn" onclick="CAD.selectAll(); UI.updateSelectionRibbon(); Renderer.draw();" title="Select All">
                    <i class="icon">☑</i> All
                </button>
                <button class="sel-btn" onclick="Commands.execute('selectwindow')" title="Window Select">
                    <i class="icon">⬚</i> Window
                </button>
                <button class="sel-btn" onclick="Commands.execute('selectcrossing')" title="Crossing Select">
                    <i class="icon">⬡</i> Crossing
                </button>
                <div class="sel-separator"></div>
                <button class="sel-btn deselect" onclick="Commands.cancelCommand();" title="Cancel Command (Esc)">
                    <i class="icon">⊗</i> Cancel
                </button>
            `;
        } else if (count > 0) {
            // Show action buttons when entities are selected
            actionsEl.innerHTML = `
                <button class="sel-btn" onclick="App.executeCommand('move')" title="Move (M)">
                    <i class="icon">↔</i> Move
                </button>
                <button class="sel-btn" onclick="App.executeCommand('copy')" title="Copy (CO)">
                    <i class="icon">⧉</i> Copy
                </button>
                <button class="sel-btn" onclick="App.executeCommand('rotate')" title="Rotate (RO)">
                    <i class="icon">↻</i> Rotate
                </button>
                <button class="sel-btn" onclick="App.executeCommand('scale')" title="Scale (SC)">
                    <i class="icon">⤢</i> Scale
                </button>
                <button class="sel-btn" onclick="App.executeCommand('mirror')" title="Mirror (MI)">
                    <i class="icon">⇿</i> Mirror
                </button>
                <button class="sel-btn" onclick="App.executeCommand('erase')" title="Erase (E)">
                    <i class="icon">✕</i> Erase
                </button>
                <button class="sel-btn" onclick="Commands.listEntities()" title="Properties">
                    <i class="icon">ℹ</i> Properties
                </button>
                <div class="sel-separator"></div>
                <button class="sel-btn deselect" onclick="CAD.clearSelection(); Renderer.draw();" title="Deselect All (Esc)">
                    <i class="icon">⊗</i> Deselect
                </button>
            `;
        }
    },

    updatePropertiesPanel() {
        const panel = this.elements.propertiesPanel;
        if (!panel) return;

        // Also update selection ribbon
        this.updateSelectionRibbon();

        const selected = CAD.getSelectedEntities();

        if (selected.length === 0) {
            panel.innerHTML = '<div class="property-group"><p style="color: var(--text-muted);">No selection</p></div>';
            return;
        }

        if (selected.length === 1) {
            const entity = selected[0];
            panel.innerHTML = this.getEntityProperties(entity);
            this.bindEntityColorControls(entity);
        } else {
            panel.innerHTML = `
                <div class="property-group">
                    <div class="property-group-title">Selection</div>
                    <div class="property-row">
                        <span class="property-label">Objects</span>
                        <span class="property-value">${selected.length}</span>
                    </div>
                </div>
            `;
        }
    },

    getEntityProperties(entity) {
        const resolvedColor = CAD.getEntityColor(entity);
        const colorLabel = entity.color ? entity.color.toLowerCase() : 'ByLayer';
        const byLayerDisabled = entity.color ? '' : ' disabled';
        let html = `
            <div class="property-group">
                <div class="property-group-title">General</div>
                <div class="property-row">
                    <span class="property-label">Type</span>
                    <span class="property-value">${entity.type.toUpperCase()}</span>
                </div>
                <div class="property-row">
                    <span class="property-label">Layer</span>
                    <span class="property-value">${entity.layer}</span>
                </div>
                <div class="property-row">
                    <span class="property-label">Color</span>
                    <div class="property-value property-value--actions">
                        <button class="property-color-btn" data-action="entity-color" title="Set entity color">
                            <span class="property-color-swatch" style="background: ${resolvedColor};"></span>
                            <span class="property-color-label">${colorLabel}</span>
                        </button>
                        <button class="property-color-bylayer" data-action="entity-color-bylayer"${byLayerDisabled}>ByLayer</button>
                    </div>
                </div>
            </div>
        `;

        switch (entity.type) {
            case 'line':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Start X</span>
                            <span class="property-value">${entity.p1.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Start Y</span>
                            <span class="property-value">${entity.p1.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">End X</span>
                            <span class="property-value">${entity.p2.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">End Y</span>
                            <span class="property-value">${entity.p2.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Length</span>
                            <span class="property-value">${Utils.dist(entity.p1, entity.p2).toFixed(4)}</span>
                        </div>
                    </div>
                `;
                break;

            case 'circle':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Center X</span>
                            <span class="property-value">${entity.center.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Center Y</span>
                            <span class="property-value">${entity.center.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Radius</span>
                            <span class="property-value">${entity.r.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Diameter</span>
                            <span class="property-value">${(entity.r * 2).toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Circumference</span>
                            <span class="property-value">${(2 * Math.PI * entity.r).toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Area</span>
                            <span class="property-value">${(Math.PI * entity.r * entity.r).toFixed(4)}</span>
                        </div>
                    </div>
                `;
                break;

            case 'arc':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Center X</span>
                            <span class="property-value">${entity.center.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Center Y</span>
                            <span class="property-value">${entity.center.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Radius</span>
                            <span class="property-value">${entity.r.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Start Angle</span>
                            <span class="property-value">${(entity.start * 180 / Math.PI).toFixed(2)}°</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">End Angle</span>
                            <span class="property-value">${(entity.end * 180 / Math.PI).toFixed(2)}°</span>
                        </div>
                    </div>
                `;
                break;

            case 'rect':
                const width = Math.abs(entity.p2.x - entity.p1.x);
                const height = Math.abs(entity.p2.y - entity.p1.y);
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Corner 1 X</span>
                            <span class="property-value">${entity.p1.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Corner 1 Y</span>
                            <span class="property-value">${entity.p1.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Width</span>
                            <span class="property-value">${width.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Height</span>
                            <span class="property-value">${height.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Area</span>
                            <span class="property-value">${(width * height).toFixed(4)}</span>
                        </div>
                    </div>
                `;
                break;

            case 'polyline':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Vertices</span>
                            <span class="property-value">${entity.points.length}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Closed</span>
                            <span class="property-value">${Utils.isPolygonClosed(entity.points) ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                `;
                break;

            case 'ellipse':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-row">
                            <span class="property-label">Center X</span>
                            <span class="property-value">${entity.center.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Center Y</span>
                            <span class="property-value">${entity.center.y.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Major Radius</span>
                            <span class="property-value">${entity.rx.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Minor Radius</span>
                            <span class="property-value">${entity.ry.toFixed(4)}</span>
                        </div>
                    </div>
                `;
                break;

            case 'text':
                html += `
                    <div class="property-group">
                        <div class="property-group-title">Text</div>
                        <div class="property-row">
                            <span class="property-label">Content</span>
                            <span class="property-value">${entity.text}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Height</span>
                            <span class="property-value">${entity.height.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Position X</span>
                            <span class="property-value">${entity.position.x.toFixed(4)}</span>
                        </div>
                        <div class="property-row">
                            <span class="property-label">Position Y</span>
                            <span class="property-value">${entity.position.y.toFixed(4)}</span>
                        </div>
                    </div>
                `;
                break;
            case 'mleader':
                html += `<div class="property-row"><span>Text</span><span>${entity.text || ''}</span></div>`;
                html += `<div class="property-row"><span>Leader Points</span><span>${(entity.points || []).length}</span></div>`;
                html += `<div class="property-row"><span>Arrow Type</span><span>${entity.arrowType || 'closed'}</span></div>`;
                html += `<div class="property-row"><span>Text Height</span><span>${entity.height || 2.5}</span></div>`;
                html += `<div class="property-row"><span>Style</span><span>${entity.mleaderStyle || 'Standard'}</span></div>`;
                break;
            case 'tolerance':
                html += `<div class="property-row"><span>Position</span><span>${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}</span></div>`;
                html += `<div class="property-row"><span>Frames</span><span>${(entity.frames || []).length}</span></div>`;
                html += `<div class="property-row"><span>Height</span><span>${entity.height || 5}</span></div>`;
                break;
            case 'trace':
                html += `<div class="property-row"><span>Width</span><span>${entity.width || 'N/A'}</span></div>`;
                if (entity.p1 && entity.p2) {
                    html += `<div class="property-row"><span>From</span><span>${entity.p1.x.toFixed(2)}, ${entity.p1.y.toFixed(2)}</span></div>`;
                    html += `<div class="property-row"><span>To</span><span>${entity.p2.x.toFixed(2)}, ${entity.p2.y.toFixed(2)}</span></div>`;
                }
                break;
            case 'field':
                html += `<div class="property-row"><span>Field Type</span><span>${entity.fieldType || 'custom'}</span></div>`;
                html += `<div class="property-row"><span>Value</span><span>${entity.evaluatedText || '---'}</span></div>`;
                html += `<div class="property-row"><span>Position</span><span>${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}</span></div>`;
                html += `<div class="property-row"><span>Height</span><span>${entity.height || 10}</span></div>`;
                break;
        }

        return html;
    },

    bindEntityColorControls(entity) {
        const panel = this.elements.propertiesPanel;
        if (!panel || !entity) return;

        const colorButton = panel.querySelector('[data-action="entity-color"]');
        if (colorButton) {
            colorButton.addEventListener('click', () => {
                const currentColor = entity.color || CAD.getEntityColor(entity);
                this.showColorPicker(currentColor, (color) => {
                    CAD.updateEntity(entity.id, { color });
                    this.updatePropertiesPanel();
                    Renderer.draw();
                });
            });
        }

        const byLayerButton = panel.querySelector('[data-action="entity-color-bylayer"]');
        if (byLayerButton) {
            byLayerButton.addEventListener('click', () => {
                if (!entity.color) return;
                CAD.updateEntity(entity.id, { color: null });
                this.updatePropertiesPanel();
                Renderer.draw();
            });
        }
    },

    // ==========================================
    // CONTEXT MENU
    // ==========================================

    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        if (!menu) return;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.add('visible');

        // Update menu items based on selection
        this.updateContextMenuItems();

        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('visible');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    },

    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.classList.remove('visible');
        }
    },

    updateContextMenuItems() {
        const hasSelection = CAD.selectedIds.length > 0;

        document.querySelectorAll('.context-menu-item[data-requires-selection]').forEach(item => {
            item.style.display = hasSelection ? 'flex' : 'none';
        });
    },

    // ==========================================
    // MODAL DIALOGS
    // ==========================================

    showModal(title, content, buttons = []) {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        const modal = overlay.querySelector('.modal');
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = content;

        const footer = modal.querySelector('.modal-footer');
        footer.innerHTML = '';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.primary ? 'btn-primary' : ''}`;
            button.textContent = btn.label;
            button.onclick = () => {
                if (btn.action) btn.action();
                this.hideModal();
            };
            footer.appendChild(button);
        });

        overlay.classList.add('visible');
    },

    hideModal() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    },

    // ==========================================
    // RIBBON TAB SWITCHING
    // ==========================================

    switchRibbonTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.ribbon-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.ribbon-content').forEach(content => {
            content.style.display = content.dataset.tab === tabName ? 'flex' : 'none';
        });

        // If ribbon was collapsed, expand it when switching tabs
        const ribbon = document.getElementById('ribbon');
        if (ribbon && ribbon.classList.contains('collapsed')) {
            this.toggleRibbon();
        }
    },

    toggleRibbon() {
        const ribbon = document.getElementById('ribbon');
        const icon = document.getElementById('ribbonCollapseIcon');
        if (ribbon) {
            ribbon.classList.toggle('collapsed');
            if (icon) {
                icon.textContent = ribbon.classList.contains('collapsed') ? '▼' : '▲';
            }
            // Resize canvas after ribbon toggle
            setTimeout(() => {
                if (typeof Renderer !== 'undefined') {
                    Renderer.resize();
                }
            }, 250);
        }
    },

    // ==========================================
    // CANVAS SELECTION TOOLBAR
    // ==========================================

    // Store previous selection for "Previous" option
    previousSelection: [],

    showCanvasSelectionToolbar() {
        const toolbar = document.getElementById('canvasSelectionToolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
            this.updateCanvasSelectionInfo();
        }
    },

    hideCanvasSelectionToolbar() {
        const toolbar = document.getElementById('canvasSelectionToolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
    },

    updateCanvasSelectionInfo() {
        const info = document.getElementById('cstInfo');
        if (!info) return;

        const count = CAD.selectedIds ? CAD.selectedIds.length : 0;
        if (count > 0) {
            info.textContent = `${count} object(s) selected`;
            info.classList.add('has-selection');
        } else {
            info.textContent = 'Click entities or use selection mode';
            info.classList.remove('has-selection');
        }
    },

    // Window selection - user draws left to right
    canvasSelectWindow() {
        this.log('Window selection: Click first corner, then drag LEFT to RIGHT');
        CAD.cmdOptions.forceWindowMode = 'window';
        CAD.selectionMode = true;
        this.focusCommandLine();
    },

    // Crossing selection - user draws right to left
    canvasSelectCrossing() {
        this.log('Crossing selection: Click first corner, then drag RIGHT to LEFT');
        CAD.cmdOptions.forceWindowMode = 'crossing';
        CAD.selectionMode = true;
        this.focusCommandLine();
    },

    // Select all entities
    canvasSelectAll() {
        CAD.selectAll();
        this.log(`${CAD.selectedIds.length} object(s) selected.`);
        this.updateCanvasSelectionInfo();
        Renderer.draw();
    },

    // Select previous selection
    canvasSelectPrevious() {
        if (this.previousSelection && this.previousSelection.length > 0) {
            // Verify entities still exist
            const validIds = this.previousSelection.filter(id => CAD.getEntity(id));
            if (validIds.length > 0) {
                CAD.selectedIds = [...validIds];
                this.log(`${validIds.length} object(s) from previous selection.`);
                this.updateCanvasSelectionInfo();
                Renderer.draw();
            } else {
                this.log('Previous selection no longer exists.', 'error');
            }
        } else {
            this.log('No previous selection available.', 'error');
        }
    },

    // Select last created entity
    canvasSelectLast() {
        const entities = CAD.getVisibleEntities();
        if (entities.length > 0) {
            const lastEntity = entities[entities.length - 1];
            CAD.selectedIds = [lastEntity.id];
            this.log(`Selected last entity: ${lastEntity.type}`);
            this.updateCanvasSelectionInfo();
            Renderer.draw();
        } else {
            this.log('No entities to select.', 'error');
        }
    },

    // Confirm selection and continue command
    confirmCanvasSelection() {
        if (CAD.selectedIds.length > 0) {
            // Store for "Previous" option
            this.previousSelection = [...CAD.selectedIds];

            // Continue with the command
            if (CAD.cmdOptions.needSelection) {
                CAD.cmdOptions.needSelection = false;
                Commands.continueCommand(CAD.activeCmd);
                this.hideCanvasSelectionToolbar();
                Renderer.draw();
            }
        } else {
            this.log('No objects selected. Select objects first.', 'error');
        }
    },

    // Update canvas selection toolbar visibility based on state
    updateCanvasSelectionToolbar() {
        const activeCmd = CAD.activeCmd;
        const needSelection = CAD.cmdOptions && CAD.cmdOptions.needSelection;

        if (activeCmd && needSelection && this.modifyCommands.includes(activeCmd)) {
            this.showCanvasSelectionToolbar();
        } else {
            this.hideCanvasSelectionToolbar();
        }
    },

    // ==========================================
    // AUTOCAD-STYLE COLOR PICKER
    // ==========================================

    // CAD Color Index palette
    aciColors: [
        // Standard 9 colors (1-9)
        { index: 1, hex: '#ff0000', name: 'Red' },
        { index: 2, hex: '#ffff00', name: 'Yellow' },
        { index: 3, hex: '#00ff00', name: 'Green' },
        { index: 4, hex: '#00ffff', name: 'Cyan' },
        { index: 5, hex: '#0000ff', name: 'Blue' },
        { index: 6, hex: '#ff00ff', name: 'Magenta' },
        { index: 7, hex: '#ffffff', name: 'White' },
        { index: 8, hex: '#808080', name: 'Gray' },
        { index: 9, hex: '#c0c0c0', name: 'Light Gray' },
        // Additional grays (250-255)
        { index: 250, hex: '#333333' },
        { index: 251, hex: '#464646' },
        { index: 252, hex: '#585858' },
        { index: 253, hex: '#6b6b6b' },
        { index: 254, hex: '#808080' },
        { index: 255, hex: '#ffffff' }
    ],

    // Generate full ACI palette (colors 10-249)
    generateAciPalette() {
        const palette = [];
        // Generate spectrum colors
        const baseColors = [
            // Reds (10-19)
            '#ff0000', '#ff5555', '#cc0000', '#cc4444', '#990000',
            '#994444', '#660000', '#663333', '#330000', '#331a1a',
            // Oranges (20-29)
            '#ff5500', '#ff8855', '#cc4400', '#cc6d44', '#994400',
            '#996644', '#663300', '#664433', '#331a00', '#33261a',
            // Yellows (30-49)
            '#ff8000', '#ffaa55', '#cc6600', '#cc8844', '#996600',
            '#997744', '#664400', '#665533', '#332200', '#33291a',
            '#ffaa00', '#ffcc55', '#cc8800', '#ccaa44', '#998800',
            '#999944', '#665500', '#666633', '#332b00', '#333319',
            // Yellow-greens (50-69)
            '#ffff00', '#ffff55', '#cccc00', '#cccc44', '#999900',
            '#999944', '#666600', '#666633', '#333300', '#33331a',
            '#aaff00', '#ccff55', '#88cc00', '#aacc44', '#669900',
            '#889944', '#446600', '#556633', '#223300', '#2b331a',
            // Greens (70-89)
            '#55ff00', '#88ff55', '#44cc00', '#6dcc44', '#339900',
            '#559944', '#226600', '#446633', '#113300', '#22331a',
            '#00ff00', '#55ff55', '#00cc00', '#44cc44', '#009900',
            '#449944', '#006600', '#336633', '#003300', '#1a331a',
            // Green-cyans (90-109)
            '#00ff55', '#55ff88', '#00cc44', '#44cc6d', '#009933',
            '#449955', '#006622', '#336644', '#003311', '#1a3322',
            '#00ffaa', '#55ffcc', '#00cc88', '#44ccaa', '#009966',
            '#449988', '#006644', '#336655', '#003322', '#1a332b',
            // Cyans (110-129)
            '#00ffff', '#55ffff', '#00cccc', '#44cccc', '#009999',
            '#449999', '#006666', '#336666', '#003333', '#1a3333',
            '#00aaff', '#55ccff', '#0088cc', '#44aacc', '#006699',
            '#448899', '#004466', '#335566', '#002233', '#1a2b33',
            // Blues (130-149)
            '#0055ff', '#5588ff', '#0044cc', '#446dcc', '#003399',
            '#445599', '#002266', '#334466', '#001133', '#1a2233',
            '#0000ff', '#5555ff', '#0000cc', '#4444cc', '#000099',
            '#444499', '#000066', '#333366', '#000033', '#1a1a33',
            // Blue-magentas (150-169)
            '#5500ff', '#8855ff', '#4400cc', '#6d44cc', '#330099',
            '#554499', '#220066', '#443366', '#110033', '#221a33',
            '#aa00ff', '#cc55ff', '#8800cc', '#aa44cc', '#660099',
            '#884499', '#440066', '#553366', '#220033', '#2b1a33',
            // Magentas (170-189)
            '#ff00ff', '#ff55ff', '#cc00cc', '#cc44cc', '#990099',
            '#994499', '#660066', '#663366', '#330033', '#331a33',
            '#ff00aa', '#ff55cc', '#cc0088', '#cc44aa', '#990066',
            '#994488', '#660044', '#663355', '#330022', '#331a2b',
            // Reds again (190-209)
            '#ff0055', '#ff5588', '#cc0044', '#cc446d', '#990033',
            '#994455', '#660022', '#663344', '#330011', '#331a22'
        ];

        for (let i = 0; i < baseColors.length && i < 200; i++) {
            palette.push({ index: 10 + i, hex: baseColors[i] });
        }
        return palette;
    },

    colorPickerCallback: null,
    selectedColor: '#ffffff',

    showColorPicker(currentColor, callback) {
        this.colorPickerCallback = callback;
        this.selectedColor = currentColor || '#ffffff';

        const dialog = document.getElementById('colorPickerDialog');
        if (!dialog) return;

        // Build the color palette
        this.buildColorPalette();

        // Set preview
        this.updateColorPreview(this.selectedColor);

        // Show dialog
        dialog.style.display = 'flex';
    },

    hideColorPicker() {
        const dialog = document.getElementById('colorPickerDialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
        this.colorPickerCallback = null;
    },

    buildColorPalette() {
        // Build primary row (colors 1-9)
        const primaryRow = document.querySelector('.aci-row.aci-primary');
        if (primaryRow) {
            primaryRow.innerHTML = '';
            for (let i = 1; i <= 9; i++) {
                const color = this.aciColors.find(c => c.index === i);
                if (color) {
                    const div = document.createElement('div');
                    div.className = 'aci-color';
                    div.style.backgroundColor = color.hex;
                    div.title = `${color.name || 'Color ' + i} (${i})`;
                    div.dataset.color = color.hex;
                    div.onclick = () => this.selectColor(color.hex);
                    primaryRow.appendChild(div);
                }
            }
        }

        // Build gray row
        const grayRow = document.querySelector('.aci-gray-colors');
        if (grayRow) {
            grayRow.innerHTML = '';
            const grays = ['#000000', '#333333', '#464646', '#585858', '#6b6b6b', '#808080', '#969696', '#b0b0b0', '#c0c0c0', '#e0e0e0', '#ffffff'];
            grays.forEach((hex, i) => {
                const div = document.createElement('div');
                div.className = 'aci-color';
                div.style.backgroundColor = hex;
                div.title = `Gray ${i + 1}`;
                div.dataset.color = hex;
                div.onclick = () => this.selectColor(hex);
                grayRow.appendChild(div);
            });
        }

        // Build full palette
        const fullPalette = document.querySelector('.aci-full-palette');
        if (fullPalette) {
            fullPalette.innerHTML = '';
            const palette = this.generateAciPalette();
            palette.forEach(color => {
                const div = document.createElement('div');
                div.className = 'aci-color';
                div.style.backgroundColor = color.hex;
                div.title = `Color ${color.index}`;
                div.dataset.color = color.hex;
                div.onclick = () => this.selectColor(color.hex);
                fullPalette.appendChild(div);
            });
        }

        // Setup true color picker
        const hexPicker = document.getElementById('colorHexPicker');
        if (hexPicker) {
            hexPicker.value = this.selectedColor;
            hexPicker.oninput = (e) => {
                this.selectColor(e.target.value);
                this.updateRgbInputs(e.target.value);
            };
        }

        // Setup RGB inputs
        ['colorR', 'colorG', 'colorB'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.oninput = () => this.updateFromRgb();
            }
        });
    },

    selectColor(hex) {
        this.selectedColor = hex;
        this.updateColorPreview(hex);

        // Remove selection from all
        document.querySelectorAll('.aci-color.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to clicked one
        const selected = document.querySelector(`.aci-color[data-color="${hex}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    },

    updateColorPreview(hex) {
        const previewBox = document.getElementById('colorPreviewBox');
        const previewText = document.getElementById('colorPreviewText');
        if (previewBox) previewBox.style.backgroundColor = hex;
        if (previewText) previewText.textContent = hex.toUpperCase();
    },

    updateRgbInputs(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const rInput = document.getElementById('colorR');
        const gInput = document.getElementById('colorG');
        const bInput = document.getElementById('colorB');
        if (rInput) rInput.value = r;
        if (gInput) gInput.value = g;
        if (bInput) bInput.value = b;
    },

    updateFromRgb() {
        const r = parseInt(document.getElementById('colorR')?.value || 0);
        const g = parseInt(document.getElementById('colorG')?.value || 0);
        const b = parseInt(document.getElementById('colorB')?.value || 0);
        const hex = '#' + [r, g, b].map(x => {
            const h = Math.max(0, Math.min(255, x)).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('');
        this.selectedColor = hex;
        this.updateColorPreview(hex);
        const hexPicker = document.getElementById('colorHexPicker');
        if (hexPicker) hexPicker.value = hex;
    },

    switchColorTab(tab) {
        document.querySelectorAll('.color-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        document.getElementById('colorTabIndex').style.display = tab === 'index' ? 'block' : 'none';
        document.getElementById('colorTabTrue').style.display = tab === 'true' ? 'block' : 'none';
    },

    confirmColorPicker() {
        if (this.colorPickerCallback) {
            this.colorPickerCallback(this.selectedColor);
        }
        this.hideColorPicker();
    },

    // Override layer color change to use our picker
    showLayerColorPicker() {
        const currentColor = this.elements.layerColor?.value || '#ffffff';
        this.showColorPicker(currentColor, (color) => {
            if (this.elements.layerColor) {
                this.elements.layerColor.value = color;
            }
            this.onLayerColorChange();
        });
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
