/* ============================================
   BrowserCAD - Commands Module
   ============================================ */

const Commands = {
    // Commands that should repeat automatically (like CAD)
    repeatableCommands: ['line', 'polyline', 'circle', 'arc', 'rect', 'ellipse', 'text', 'point', 'polygon', 'donut', 'ray', 'xline', 'spline'],

    // Last executed drawing command (for repeat)
    lastDrawingCmd: null,

    // Command aliases (CAD-like shortcuts)
    aliases: {
        // Drawing commands
        'l': 'line',
        'line': 'line',
        'pl': 'polyline',
        'pline': 'polyline',
        'c': 'circle',
        'circle': 'circle',
        'a': 'arc',
        'arc': 'arc',
        'rec': 'rect',
        'rect': 'rect',
        'rectangle': 'rect',
        'el': 'ellipse',
        'ellipse': 'ellipse',
        't': 'text',
        'text': 'text',
        'dt': 'text',
        'dtext': 'text',
        'mt': 'mtext',
        'mtext': 'mtext',
        'po': 'point',
        'point': 'point',
        'multiple': 'point',
        'pol': 'polygon',
        'polygon': 'polygon',
        'ray': 'ray',
        'xl': 'xline',
        'xline': 'xline',
        'spl': 'spline',
        'spline': 'spline',
        'do': 'donut',
        'donut': 'donut',
        'doughnut': 'donut',

        // Modify commands
        'e': 'erase',
        'erase': 'erase',
        'del': 'erase',
        'delete': 'erase',
        'm': 'move',
        'move': 'move',
        'co': 'copy',
        'cp': 'copy',
        'copy': 'copy',
        'ro': 'rotate',
        'rotate': 'rotate',
        'sc': 'scale',
        'scale': 'scale',
        'mi': 'mirror',
        'mirror': 'mirror',
        'o': 'offset',
        'offset': 'offset',
        'tr': 'trim',
        'trim': 'trim',
        'ex': 'extend',
        'extend': 'extend',
        'f': 'fillet',
        'fillet': 'fillet',
        'cha': 'chamfer',
        'ch': 'chamfer',
        'chamfer': 'chamfer',
        'x': 'explode',
        'explode': 'explode',
        'j': 'join',
        'join': 'join',
        'h': 'hatch',
        'hatch': 'hatch',
        'bh': 'hatch',
        'bhatch': 'hatch',
        'he': 'hatchedit',
        'hatchedit': 'hatchedit',
        'leader': 'leader',
        'le': 'leader',
        'ar': 'array',
        'array': 'array',
        'arrayrect': 'arrayrect',
        'arraypolar': 'arraypolar',
        '-array': 'array',
        'br': 'break',
        'break': 'break',
        'len': 'lengthen',
        'lengthen': 'lengthen',
        's': 'stretch',
        'stretch': 'stretch',
        'pe': 'pedit',
        'pedit': 'pedit',

        // Dimension commands
        'dim': 'dimlinear',
        'dimlin': 'dimlinear',
        'dimlinear': 'dimlinear',
        'dimaligned': 'dimaligned',
        'dimang': 'dimangular',
        'dimangular': 'dimangular',
        'dimrad': 'dimradius',
        'dimradius': 'dimradius',
        'dimdia': 'dimdiameter',
        'dimdiameter': 'dimdiameter',
        'dimbaseline': 'dimbaseline',
        'dimbase': 'dimbaseline',
        'dimcontinue': 'dimcontinue',
        'dimcont': 'dimcontinue',
        'dimstyle': 'dimstyle',
        'dstyle': 'dimstyle',

        // Utility commands
        'u': 'undo',
        'undo': 'undo',
        'redo': 'redo',
        'mredo': 'redo',
        'z': 'zoom',
        'zoom': 'zoom',
        'ze': 'zoomextents',
        'zoomextents': 'zoomextents',
        'p': 'pan',
        'pan': 'pan',
        're': 'regen',
        'regen': 'regen',
        'redraw': 'regen',
        'redrawall': 'regen',
        'la': 'layer',
        '-la': 'layer',
        'layer': 'layer',
        'layfrz': 'layfrz',
        'laythw': 'laythw',
        'layon': 'layon',
        'layoff': 'layoff',
        'layout': 'layout',
        'laystate': 'layerstate',
        'layerstate': 'layerstate',
        'id': 'id',
        'dist': 'distance',
        'di': 'distance',
        'distance': 'distance',
        'measuregeom': 'distance',
        'area': 'area',
        'aa': 'area',
        'list': 'list',
        'li': 'list',
        'properties': 'list',
        'props': 'list',
        'pr': 'list',
        'qselect': 'qselect',
        'selectsimilar': 'selectsimilar',

        // Selection
        'all': 'selectall',
        'selectall': 'selectall',
        'selectwindow': 'selectwindow',
        'selectcrossing': 'selectcrossing',

        // File operations
        'new': 'new',
        'save': 'save',
        'saveas': 'saveas',
        'open': 'open',
        'export': 'export',
        'dxfout': 'export',

        // Settings
        'grid': 'grid',
        'snap': 'snap',
        'ortho': 'ortho',
        'osnap': 'osnap',
        'polar': 'polar',
        'image': 'imageattach',
        'imageattach': 'imageattach',
        'attach': 'imageattach',
        'offsetgaptype': 'offsetgaptype',
        'pdmode': 'pdmode',
        'pdsize': 'pdsize',
        'textsize': 'textsize',
        'dimtxt': 'dimtxt',
        'dimasz': 'dimasz',
        'dimscale': 'dimscale',
        'dimdec': 'dimdec',
        'linetype': 'linetype',
        'lt': 'linetype',
        'ltscale': 'ltscale',

        // Text style
        'style': 'style',
        'textstyle': 'style',

        // Lisp
        'lisp': 'lisp',
        'vlisp': 'lisp',
        'appload': 'appload',
        'load': 'appload',

        // Block commands
        'b': 'block',
        'block': 'block',
        'bmake': 'block',
        'i': 'insert',
        'insert': 'insert',
        'ddinsert': 'insert',

        // Divide/Measure commands
        'div': 'divide',
        'divide': 'divide',
        'me': 'measure',
        'measure': 'measure',

        // Revision cloud
        'revcloud': 'revcloud',
        'rc': 'revcloud',

        // Match properties
        'ma': 'matchprop',
        'matchprop': 'matchprop',
        'painter': 'matchprop',

        // Wipeout
        'wipeout': 'wipeout',

        // Layer lock/unlock
        'laylck': 'laylck',
        'laylock': 'laylck',
        'layulk': 'layulk',
        'layunlock': 'layulk',

        // Named views
        'view': 'view',
        '-view': 'view',

        // Ordinate dimension
        'dimord': 'dimordinate',
        'dimordinate': 'dimordinate',
        'dor': 'dimordinate',

        // Overkill
        'overkill': 'overkill',

        // Layer management (Phase 2)
        'laydel': 'laydel',
        'laydelete': 'laydel',
        'layiso': 'layiso',
        'layisolate': 'layiso',
        'layuniso': 'layuniso',
        'layunisolate': 'layuniso',
        'laymerge': 'laymerge',
        'laymrg': 'laymerge',

        // Selection (Phase 2)
        'filter': 'filter',
        'fi': 'filter',

        // Modify (Phase 2)
        'al': 'align',
        'align': 'align',
        'scaletext': 'scaletext',
        'st': 'scaletext',
        'justifytext': 'justifytext',
        'jt': 'justifytext',

        // Utilities (Phase 2)
        'find': 'find',
        'purge': 'purge',
        'pu': 'purge',

        // Drawing (Phase 2)
        'solid': 'solid',
        'so': 'solid',
        'boundary': 'boundary',
        'bo': 'boundary',
        'region': 'region',
        'reg': 'region',

        // Dimensions (Phase 2)
        'qdim': 'qdim',
        'dimarc': 'dimarc',
        'dimbreak': 'dimbreak',
        'dimspace': 'dimspace',

        // Help
        'help': 'help',
        '?': 'help',

        // Layout & plotting
        'mview': 'mview',
        'mspace': 'mspace',
        'pspace': 'pspace',
        'plot': 'plot',
        'exportpdf': 'exportpdf',
        'pdfout': 'exportpdf',

        // Phase 3: Advanced Drawing & Editing
        'chprop': 'chprop',
        'change': 'chprop',

        'draworder': 'draworder',
        'dr': 'draworder',
        'bringtofront': 'draworderfront',
        'draworderfront': 'draworderfront',
        'sendtoback': 'draworderback',
        'draworderback': 'draworderback',
        'draworderabove': 'draworderabove',
        'draworderbelow': 'draworderbelow',
        'texttofront': 'texttofront',

        'hideobjects': 'hideobjects',
        'isolateobjects': 'isolateobjects',
        'unisolateobjects': 'unisolateobjects',
        'objectshide': 'hideobjects',
        'objectsisolate': 'isolateobjects',

        'group': 'group',
        'g': 'group',
        'ungroup': 'ungroup',

        'xclip': 'xclip',
        'xc': 'xclip',
        'arraypath': 'arraypath',

        'mline': 'mline',
        'ml': 'mline',

        'table': 'table',
        'tb': 'table',

        'copybase': 'copybase',
        'pasteblock': 'pasteblock',
        'pasteasblock': 'pasteblock',

        'reverse': 'reverse',

        'selectprevious': 'selectprevious',

        // Multi-Leader
        'mleader': 'mleader',
        'mld': 'mleader',
        'mleaderstyle': 'mleaderstyle',
        'mls': 'mleaderstyle',
        'mleaderalign': 'mleaderalign',
        'mleadercollect': 'mleadercollect',

        // Block Attributes
        'attdef': 'attdef',
        'att': 'attdef',
        'attedit': 'attedit',
        'ate': 'attedit',
        'eattedit': 'attedit',

        // Geometric Tolerances
        'tolerance': 'tolerance',
        'tol': 'tolerance',

        // Calculator
        'quickcalc': 'quickcalc',
        'qc': 'quickcalc',
        'cal': 'quickcalc',

        // Multiline Style
        'mlstyle': 'mlstyle',

        // Trace
        'trace': 'trace',

        // Page Setup
        'pagesetup': 'pagesetup',

        // Viewport Scale
        'vpscale': 'vpscale',

        // Image Clip
        'imageclip': 'imageclip',
        'iclip': 'imageclip',

        // Field
        'field': 'field',

        // Count
        'count': 'count',

        // Close/End options (handled specially in execute() when activeCmd exists)
        'close': 'close'
    },

    // ==========================================
    // COMMAND EXECUTION
    // ==========================================

    execute(input) {
        const trimmedInput = input.trim();

        // Check for Lisp expression (starts with parenthesis)
        if (trimmedInput.startsWith('(')) {
            this.executeLisp(trimmedInput);
            return;
        }

        const parts = trimmedInput.toLowerCase().split(/\s+/);
        const cmdName = parts[0];
        const args = parts.slice(1);

        // Check for close command during active drawing
        if ((cmdName === 'c' || cmdName === 'close') && CAD.activeCmd) {
            this.closeShape();
            return;
        }

        // Check for undo command during active line/polyline drawing
        if ((cmdName === 'u') && CAD.activeCmd &&
            (CAD.activeCmd === 'line' || CAD.activeCmd === 'polyline' || CAD.activeCmd === 'spline')) {
            this.handleInput('u');
            return;
        }

        if (cmdName === 'plot') {
            this.plotLayout();
            return;
        }

        if (cmdName === 'exportpdf' || cmdName === 'pdfout') {
            Storage.exportPDF();
            return;
        }

        if (cmdName === 'pspace') {
            this.enterPaperSpace();
            return;
        }

        if (cmdName === 'mspace') {
            const layout = CAD.getLayout(CAD.currentLayout);
            if (!layout || layout.type !== 'paper') {
                UI.log('MSPACE: Not in a layout. Switch to a layout tab first.', 'error');
                return;
            }
            if (CAD.activeViewportId) {
                this.enterModelSpace();
                return;
            }
        }

        const command = this.aliases[cmdName];
        if (!command) {
            if (typeof Lisp !== 'undefined') {
                const lispCmdName = 'C:' + cmdName.toUpperCase();
                if (Lisp.userFunctions && Lisp.userFunctions[lispCmdName]) {
                    this.executeLisp(`(${lispCmdName})`);
                    return;
                }
            }
            
            UI.log(`Unknown command: ${cmdName}`, 'error');
            return;
        }

        if (command === 'selectwindow' || command === 'selectcrossing') {
            if (!CAD.activeCmd) {
                UI.setActiveButton(null);
                UI.updateCommandPrompt(null);
            }
            if (command === 'selectwindow') {
                UI.canvasSelectWindow();
            } else {
                UI.canvasSelectCrossing();
            }
            return;
        }

        if (command === 'qselect' && args.length > 0) {
            this.selectByType(args[0]);
            return;
        }

        // Handle HELP with a topic argument
        if (command === 'help' && args.length > 0) {
            this.showCommandHelp(args[0]);
            return;
        }

        // Execute the command
        this.startCommand(command, args);
    },

    // Execute Lisp code
    async executeLisp(code) {
        if (typeof Lisp === 'undefined') {
            UI.log('Lisp interpreter not loaded.', 'error');
            return;
        }

        try {
            const result = await Lisp.execute(code);
            if (result !== undefined && result !== null) {
                // Format the result for display
                const formatted = this.formatLispResult(result);
                UI.log(`Result: ${formatted}`);
            }
        } catch (err) {
            UI.log(`LISP Error: ${err.message}`, 'error');
        }
        Renderer.draw();
    },

    // Format LISP result for display
    formatLispResult(value) {
        if (value === null) return 'nil';
        if (value === true) return 'T';
        if (value === false) return 'nil';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') return `"${value}"`;
        if (Array.isArray(value)) {
            if (value.length === 0) return 'nil';
            return '(' + value.map(v => this.formatLispResult(v)).join(' ') + ')';
        }
        if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
            return `(${value.x} ${value.y}${value.z !== undefined ? ' ' + value.z : ''})`;
        }
        return String(value);
    },

    startCommand(name, args = []) {
        // Finish any active command first (without restarting)
        if (CAD.activeCmd) {
            this.finishCommand(true); // Pass true to prevent auto-restart
        }

        // Track repeatable commands
        if (this.repeatableCommands.includes(name)) {
            this.lastDrawingCmd = name;
        }

        CAD.startCommand(name);
        UI.setActiveButton(name);
        UI.updateCommandPrompt(name);

        // Update selection ribbon (for modify commands that need selection)
        UI.updateSelectionRibbon();

        // Update canvas selection toolbar for modify commands
        UI.updateCanvasSelectionToolbar();

        switch (name) {
            // Drawing commands
            case 'line':
                UI.log('LINE: Specify first point:', 'prompt');
                break;

            case 'polyline':
                CAD.cmdOptions.polylineMode = 'line';
                CAD.cmdOptions.polylineArcStep = 0;
                CAD.cmdOptions.polylineArcEnd = null;
                CAD.cmdOptions.polylineBulges = [];
                UI.log('PLINE: Specify start point:', 'prompt');
                break;

            case 'circle':
                UI.log('CIRCLE: Specify center point or [3P/2P/Ttr]:', 'prompt');
                break;

            case 'arc':
                UI.log('ARC: Specify center point:', 'prompt');
                break;

            case 'rect':
                UI.log('RECTANGLE: Specify first corner point:', 'prompt');
                break;

            case 'mview': {
                const layout = CAD.getLayout(CAD.currentLayout);
                if (!layout || layout.type !== 'paper') {
                    UI.log('MVIEW: Not in a layout. Switch to a layout tab first.', 'error');
                    this.finishCommand();
                    return;
                }
                UI.log('MVIEW: Specify first corner of viewport:', 'prompt');
                break;
            }

            case 'ellipse':
                UI.log('ELLIPSE: Specify axis endpoint 1:', 'prompt');
                break;

            case 'text':
                UI.log('TEXT: Specify start point of text:', 'prompt');
                break;

            case 'point':
                UI.log('POINT: Specify a point:', 'prompt');
                break;

            case 'mtext':
                UI.log('MTEXT: Specify first corner:', 'prompt');
                break;

            case 'polygon':
                UI.log('POLYGON: Enter number of sides <4>:', 'prompt');
                CAD.cmdOptions.sides = 4;
                break;

            case 'mspace':
                UI.log('MSPACE: Select viewport to activate:', 'prompt');
                break;

            case 'ray':
                UI.log('RAY: Specify start point:', 'prompt');
                break;

            case 'xline':
                UI.log('XLINE: Specify a point or [Hor/Ver/Ang]:', 'prompt');
                break;

            case 'spline':
                UI.log('SPLINE: Specify first point:', 'prompt');
                break;

            case 'donut':
                UI.log(`DONUT: Specify inside diameter <${CAD.cmdOptions.donutInner || 10}>:`, 'prompt');
                CAD.cmdOptions.donutInner = CAD.cmdOptions.donutInner || 10;
                CAD.cmdOptions.donutOuter = CAD.cmdOptions.donutOuter || 20;
                break;

            // Dimension commands
            case 'dimlinear':
                UI.log('DIMLINEAR: Specify first extension line origin:', 'prompt');
                break;

            case 'dimaligned':
                UI.log('DIMALIGNED: Specify first extension line origin:', 'prompt');
                break;

            case 'dimangular':
                UI.log('DIMANGULAR: Select arc, circle, line, or specify vertex:', 'prompt');
                break;

            case 'dimradius':
                UI.log('DIMRADIUS: Select arc or circle:', 'prompt');
                break;

            case 'dimdiameter':
                UI.log('DIMDIAMETER: Select arc or circle:', 'prompt');
                break;
            case 'dimbaseline':
                if (!CAD.lastLinearDim) {
                    UI.log('DIMBASELINE: No previous linear dimension found.', 'error');
                    this.finishCommand(true);
                    break;
                }
                CAD.cmdOptions.dimBasePoint = { ...CAD.lastLinearDim.p1 };
                UI.log('DIMBASELINE: Specify next extension line origin:', 'prompt');
                break;
            case 'dimcontinue':
                if (!CAD.lastLinearDim) {
                    UI.log('DIMCONTINUE: No previous linear dimension found.', 'error');
                    this.finishCommand(true);
                    break;
                }
                CAD.cmdOptions.dimBasePoint = { ...CAD.lastLinearDim.p2 };
                UI.log('DIMCONTINUE: Specify next extension line origin:', 'prompt');
                break;
            case 'dimstyle':
                CAD.cmdOptions.dimStyleStep = 'prompt';
                UI.log(`DIMSTYLE: Current "${CAD.currentDimStyle}". [List/Set/Save] <Set>:`, 'prompt');
                break;
            case 'layout':
                CAD.cmdOptions.layoutStep = 'prompt';
                UI.log(`LAYOUT: [New/Set/List/Delete] <Set>:`, 'prompt');
                break;
            case 'layerstate':
                CAD.cmdOptions.layerStateStep = 'prompt';
                UI.log('LAYERSTATE: [Save/Restore/List/Delete] <Restore>:', 'prompt');
                break;

            // Modify commands
            case 'erase':
                if (CAD.selectedIds.length > 0) {
                    this.deleteSelected();
                } else {
                    UI.log('ERASE: Select objects to erase:', 'prompt');
                    CAD.selectionMode = true;
                }
                break;

            case 'move':
                if (CAD.selectedIds.length === 0) {
                    UI.log('MOVE: Select objects to move:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('MOVE: Specify base point:', 'prompt');
                }
                break;

            case 'copy':
                if (CAD.selectedIds.length === 0) {
                    UI.log('COPY: Select objects to copy:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('COPY: Specify base point:', 'prompt');
                }
                break;

            case 'rotate':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ROTATE: Select objects to rotate:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('ROTATE: Specify base point:', 'prompt');
                }
                break;

            case 'scale':
                if (CAD.selectedIds.length === 0) {
                    UI.log('SCALE: Select objects to scale:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('SCALE: Specify base point:', 'prompt');
                }
                CAD.cmdOptions.scaleMode = 'factor'; // factor, reference
                CAD.cmdOptions.scaleCopy = false;
                break;

            case 'mirror':
                if (CAD.selectedIds.length === 0) {
                    UI.log('MIRROR: Select objects to mirror:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('MIRROR: Specify first point of mirror line:', 'prompt');
                }
                break;

            case 'offset':
                UI.log(`OFFSET: Specify offset distance or [Through/Erase] <${CAD.offsetDist}>:`, 'prompt');
                CAD.cmdOptions.offsetMode = 'distance'; // distance, through, picking
                break;

            case 'trim':
                UI.log('TRIM: Select cutting edges... (Press Enter when done)', 'prompt');
                CAD.cmdOptions.cuttingEdges = [];
                CAD.cmdOptions.selectingEdges = true;
                break;

            case 'extend':
                UI.log('EXTEND: Select boundary edges... (Press Enter when done)', 'prompt');
                CAD.cmdOptions.boundaryEdges = [];
                CAD.cmdOptions.selectingEdges = true;
                break;

            case 'hatch':
                if (CAD.selectedIds.length > 0) {
                    this.applyHatchToSelection();
                    this.finishCommand();
                    return;
                }
                UI.log(`HATCH: Click inside a closed area or select a closed object.`, 'prompt');
                UI.log(`Pattern=${CAD.hatchPattern.toUpperCase()}, Scale=${CAD.hatchScale}, Angle=${CAD.hatchAngle}°`, 'prompt');
                UI.log(`Options: [Pattern/Scale/Angle] or click to apply:`, 'prompt');
                break;

            case 'hatchedit':
                if (CAD.selectedIds.length === 1) {
                    const selEnt = CAD.getSelectedEntities()[0];
                    if (selEnt && (selEnt.type === 'hatch' || selEnt.hatch)) {
                        CAD.cmdOptions.hatchEditTarget = selEnt;
                        UI.log(`HATCHEDIT: Pattern=${(selEnt.patternName || selEnt.hatch?.pattern || 'solid').toUpperCase()}, Scale=${selEnt.scale || 1}, Angle=${selEnt.angle || 0}°`, 'prompt');
                        UI.log(`Options: [Pattern/Scale/Angle/Delete]:`, 'prompt');
                    } else {
                        UI.log('HATCHEDIT: Selected entity is not a hatch.', 'error');
                        this.finishCommand();
                    }
                } else {
                    UI.log('HATCHEDIT: Select a hatch entity to edit:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                }
                break;

            case 'leader':
                UI.log('LEADER: Specify first point:', 'prompt');
                break;

            case 'explode':
                if (CAD.selectedIds.length > 0) {
                    this.explodeSelected();
                } else {
                    UI.log('EXPLODE: Select objects to explode:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                }
                break;

            case 'xclip':
                if (CAD.selectedIds.length === 0) {
                    UI.log('XCLIP: Select block reference to clip:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    const xclipTarget = CAD.getSelectedEntities()[0];
                    if (xclipTarget && xclipTarget.type === 'insert') {
                        CAD.cmdOptions.xclipTarget = xclipTarget;
                        UI.log('XCLIP: [ON/OFF/Delete/New boundary] <New>:', 'prompt');
                        CAD.cmdOptions.xclipMode = 'options';
                    } else {
                        UI.log('XCLIP: Selected entity is not a block reference.', 'error');
                        this.finishCommand();
                    }
                }
                break;

            case 'array':
            case 'arrayrect':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ARRAY: Select objects to array:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('ARRAY: Enter number of rows <1>:', 'prompt');
                    CAD.cmdOptions.arrayRows = 1;
                    CAD.cmdOptions.arrayCols = 1;
                    CAD.cmdOptions.arrayType = 'rectangular';
                }
                break;

            case 'arraypolar':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ARRAYPOLAR: Select objects to array:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('ARRAYPOLAR: Specify center point of array:', 'prompt');
                    CAD.cmdOptions.arrayType = 'polar';
                }
                break;

            case 'fillet':
                UI.log(`FILLET: Current radius = ${CAD.filletRadius || 0}. Select first object or [Radius]:`, 'prompt');
                CAD.filletRadius = CAD.filletRadius || 0;
                break;

            case 'chamfer':
                UI.log(`CHAMFER: Distances = ${CAD.chamferDist1 || 0}, ${CAD.chamferDist2 || 0}. Select first line or [Distance]:`, 'prompt');
                CAD.chamferDist1 = CAD.chamferDist1 || 0;
                CAD.chamferDist2 = CAD.chamferDist2 || 0;
                break;

            case 'break':
                UI.log('BREAK: Select object:', 'prompt');
                break;

            case 'lengthen':
                UI.log('LENGTHEN: Select an object or [DElta/Percent/Total/DYnamic]:', 'prompt');
                CAD.cmdOptions.lengthenMode = 'dynamic';
                break;

            case 'stretch':
                UI.log('STRETCH: Select objects to stretch by crossing-window or polygon:', 'prompt');
                CAD.cmdOptions.needSelection = true;
                CAD.cmdOptions.stretchMode = 'selectWindow';
                CAD.selectionMode = true;
                break;

            case 'join':
                if (CAD.selectedIds.length === 0) {
                    UI.log('JOIN: Select source object:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('JOIN: Select objects to join to source:', 'prompt');
                }
                break;

            case 'pedit':
                if (CAD.selectedIds.length === 0) {
                    UI.log('PEDIT: Select polyline or [Multiple]:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.peditMode = null;
                } else {
                    const selected = CAD.getSelectedEntities();
                    if (selected.length === 1 && (selected[0].type === 'polyline' || selected[0].type === 'line')) {
                        CAD.cmdOptions.peditTarget = selected[0];
                        UI.log('PEDIT: [Close/Open/Join/Width/Edit vertex/Spline/Decurve]:', 'prompt');
                    } else {
                        UI.log('PEDIT: Select a single polyline.', 'error');
                        this.finishCommand();
                    }
                }
                break;

            // Utility commands
            case 'undo':
                this.undo();
                break;

            case 'redo':
                this.redo();
                break;

            case 'zoom':
                if (args[0] === 'e' || args[0] === 'extents') {
                    this.zoomExtents();
                } else if (args[0] === 'a' || args[0] === 'all') {
                    this.zoomExtents();
                } else {
                    UI.log('ZOOM: [All/Center/Extents/Window] <realtime>:', 'prompt');
                }
                break;

            case 'zoomextents':
                this.zoomExtents();
                break;

            case 'pan':
                UI.log('PAN: Use middle mouse button or Shift+Left click to pan', 'prompt');
                this.finishCommand();
                break;

            case 'regen':
                Renderer.draw();
                UI.log('Regenerating model.');
                this.finishCommand();
                break;

            case 'selectall':
                CAD.selectAll();
                UI.log(`${CAD.selectedIds.length} objects selected.`);
                Renderer.draw();
                this.finishCommand();
                break;
            case 'distance':
                UI.log('DIST: Specify first point:', 'prompt');
                break;

            case 'area':
                UI.log('AREA: Specify first corner point or [Object]:', 'prompt');
                break;

            case 'id':
                UI.log('ID: Specify point:', 'prompt');
                break;

            case 'list':
                this.listSelected();
                this.finishCommand();
                break;
            case 'layer':
                UI.log('LAYER: Enter option [New/Set/On/Off/List]:', 'prompt');
                break;
            case 'layfrz':
                UI.log('LAYFRZ: Enter layer name or [Current]:', 'prompt');
                break;
            case 'laythw':
                UI.log('LAYTHW: Enter layer name or [Current]:', 'prompt');
                break;
            case 'layon':
                UI.log('LAYON: Enter layer name or [Current]:', 'prompt');
                break;
            case 'layoff':
                UI.log('LAYOFF: Enter layer name or [Current]:', 'prompt');
                break;
            case 'selectsimilar':
                this.selectSimilar();
                this.finishCommand();
                break;
            case 'qselect':
                if (CAD.getVisibleEntities().length === 0) {
                    UI.log('QSELECT: No entities to select.', 'error');
                    this.finishCommand();
                    break;
                }
                CAD.cmdOptions.waitingForQselectType = true;
                UI.log(`QSELECT: Enter object type or [List]:`, 'prompt');
                break;

            case 'grid':
                CAD.showGrid = !CAD.showGrid;
                UI.log(`Grid: ${CAD.showGrid ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                Renderer.draw();
                this.finishCommand();
                break;

            case 'snap':
                CAD.snapEnabled = !CAD.snapEnabled;
                UI.log(`Snap: ${CAD.snapEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                break;

            case 'ortho':
                CAD.orthoEnabled = !CAD.orthoEnabled;
                UI.log(`Ortho: ${CAD.orthoEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                break;
            case 'osnap':
                UI.log('OSNAP: Enter option [On/Off/End/Mid/Cen/Int/Per/Tan/Nea/Qua/Nod/All/None/List]:', 'prompt');
                break;
            case 'polar':
                UI.log(`POLAR: Enter option [On/Off/Angle] <${CAD.polarAngle}>:`, 'prompt');
                break;

            case 'offsetgaptype':
                UI.log(`OFFSETGAPTYPE: Enter new value <${CAD.offsetGapType}> (0=Extend, 1=Fillet, 2=Chamfer):`, 'prompt');
                break;

            case 'imageattach':
                UI.log('IMAGEATTACH: Select image file to attach.', 'prompt');
                UI.promptImageAttach((imageData) => {
                    if (!imageData) {
                        this.finishCommand(true);
                        return;
                    }
                    CAD.cmdOptions.imageData = imageData;
                    CAD.cmdOptions.imageInsert = null;
                    CAD.cmdOptions.imageScale = CAD.imageAttachScale || 1;
                    CAD.cmdOptions.imageRotation = CAD.imageAttachRotation || 0;
                    CAD.step = 0;
                    UI.log('IMAGEATTACH: Specify insertion point:', 'prompt');
                });
                break;

            case 'pdmode':
                UI.log(`PDMODE: Enter new value <${CAD.pointDisplayMode}> (0=dot, 2=+, 3=X, 32=square, 64=circle):`, 'prompt');
                break;

            case 'pdsize':
                UI.log(`PDSIZE: Enter new value <${CAD.pointDisplaySize}>:`, 'prompt');
                break;

            case 'textsize':
                UI.log(`TEXTSIZE: Enter new value <${CAD.textHeight}>:`, 'prompt');
                break;

            case 'dimtxt':
                UI.log(`DIMTXT: Enter new dimension text height <${CAD.dimTextHeight}>:`, 'prompt');
                break;

            case 'dimasz':
                UI.log(`DIMASZ: Enter new dimension arrow size <${CAD.dimArrowSize}>:`, 'prompt');
                break;

            case 'dimscale':
                UI.log(`DIMSCALE: Enter new dimension scale factor <${CAD.dimScale}>:`, 'prompt');
                break;
            case 'dimdec':
                UI.log(`DIMDEC: Enter new dimension precision <${CAD.dimPrecision}>:`, 'prompt');
                break;

            case 'linetype':
                UI.log(`LINETYPE: Enter name or [List] <${CAD.lineType}>:`, 'prompt');
                break;

            case 'ltscale':
                UI.log(`LTSCALE: Enter new linetype scale <${CAD.lineTypeScale}>:`, 'prompt');
                break;

            case 'new':
                if (confirm('Start a new drawing? All unsaved changes will be lost.')) {
                    CAD.newDrawing();
                    UI.log('New drawing started.');
                    Renderer.draw();
                    UI.updateLayerUI();
                    UI.renderLayoutTabs();
                }
                this.finishCommand();
                break;

            case 'save':
                Storage.saveToLocalStorage();
                this.finishCommand();
                break;

            case 'open':
                Storage.openFile();
                this.finishCommand();
                break;

            case 'export':
                Storage.exportDXF();
                this.finishCommand();
                break;

            case 'lisp':
                UI.log('Lisp Mode. Type (expression) to execute LISP code.');
                UI.log('Examples: (+ 1 2 3), (setq x 10), (command "circle" \'(0 0) 50)');
                UI.log('Type (help) for available functions.');
                this.finishCommand();
                break;

            case 'appload':
                UI.log('APPLOAD: Select a LISP file to load.', 'prompt');
                UI.promptLispAttach(async (lispFile) => {
                    if (!lispFile) {
                        this.finishCommand(true);
                        return;
                    }
                    await Lisp.load(lispFile.code);
                    UI.log(`APPLOAD: Loaded ${lispFile.name}.`);
                    this.finishCommand(true);
                });
                break;

            // Block commands
            case 'block':
                if (CAD.selectedIds.length === 0) {
                    UI.log('BLOCK: Select objects for block:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('BLOCK: Enter block name:', 'prompt');
                    CAD.cmdOptions.waitingForName = true;
                }
                break;

            case 'insert':
                // Show available blocks
                const blockList = CAD.getBlockList();
                if (blockList.length === 0) {
                    UI.log('INSERT: No blocks defined. Use BLOCK command to create blocks first.', 'error');
                    this.finishCommand();
                } else {
                    UI.log(`INSERT: Available blocks: ${blockList.join(', ')}`, 'prompt');
                    UI.log('INSERT: Enter block name to insert:', 'prompt');
                    CAD.cmdOptions.waitingForBlockName = true;
                    CAD.cmdOptions.insertScale = { x: 1, y: 1 };
                    CAD.cmdOptions.insertRotation = 0;
                }
                break;

            // ==========================================
            // NEW QUICK-WIN COMMANDS
            // ==========================================

            case 'divide':
                UI.log('DIVIDE: Select object to divide:', 'prompt');
                break;

            case 'measure':
                UI.log('MEASURE: Select object to measure:', 'prompt');
                break;

            case 'revcloud':
                UI.log(`REVCLOUD: Specify arc length <${CAD.cmdOptions.revcloudArcLen || 15}>:`, 'prompt');
                CAD.cmdOptions.revcloudArcLen = CAD.cmdOptions.revcloudArcLen || 15;
                break;

            case 'matchprop':
                UI.log('MATCHPROP: Select source object:', 'prompt');
                break;

            case 'wipeout':
                UI.log('WIPEOUT: Specify first point:', 'prompt');
                break;

            case 'laylck':
                UI.log('LAYLCK: Enter layer name to lock:', 'prompt');
                break;

            case 'layulk':
                UI.log('LAYULK: Enter layer name to unlock:', 'prompt');
                break;

            case 'view':
                UI.log('VIEW: Enter option [Save/Restore/Delete/List]:', 'prompt');
                break;

            case 'dimordinate':
                UI.log('DIMORDINATE: Specify feature location:', 'prompt');
                break;

            case 'overkill':
                this.executeOverkill();
                break;

            // ==========================================
            // PHASE 2 COMMANDS
            // ==========================================

            // Layer management
            case 'laydel':
                UI.log('LAYDEL: Enter name of layer to delete (entities moved to "0"):', 'prompt');
                break;

            case 'layiso':
                UI.log('LAYISO: Select object on layer to isolate:', 'prompt');
                break;

            case 'layuniso':
                this.executeLayUniso();
                break;

            case 'laymerge':
                UI.log('LAYMERGE: Enter source layer name to merge:', 'prompt');
                break;

            // Selection
            case 'filter':
                UI.log('FILTER: Enter filter [Type/Layer/Color/All] <All>:', 'prompt');
                CAD.cmdOptions.filterStep = 'mode';
                break;

            // Modify
            case 'align':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ALIGN: Select objects to align:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    CAD.step = 0;
                    UI.log('ALIGN: Specify first source point:', 'prompt');
                }
                break;

            case 'scaletext':
                if (CAD.selectedIds.length === 0) {
                    UI.log('SCALETEXT: Select text objects:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('SCALETEXT: Specify new height:', 'prompt');
                }
                break;

            case 'justifytext':
                if (CAD.selectedIds.length === 0) {
                    UI.log('JUSTIFYTEXT: Select text objects:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('JUSTIFYTEXT: Enter justification [Left/Center/Right] <Left>:', 'prompt');
                }
                break;

            // Utilities
            case 'find':
                UI.log('FIND: Enter search string:', 'prompt');
                CAD.cmdOptions.findStep = 'search';
                break;

            case 'purge':
                this.executePurge();
                break;

            case 'style': {
                const styles = Object.keys(CAD.textStyles);
                UI.log(`Text styles: ${styles.join(', ')}. Current: ${CAD.currentTextStyle}`, 'info');
                UI.log('STYLE: Enter style name to set, or NEW to create:', 'prompt');
                break;
            }

            // Drawing
            case 'solid':
                UI.log('SOLID: Specify first point:', 'prompt');
                break;

            case 'boundary':
            case 'region':
                UI.log(`${name.toUpperCase()}: Specify internal point to detect boundary:`, 'prompt');
                break;

            // Dimensions
            case 'qdim':
                if (CAD.selectedIds.length === 0) {
                    UI.log('QDIM: Select objects to dimension:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    this.continueCommand('qdim');
                }
                break;

            case 'dimarc':
                UI.log('DIMARC: Select arc to dimension:', 'prompt');
                break;

            case 'dimbreak':
                UI.log('DIMBREAK: Select dimension to break:', 'prompt');
                break;

            case 'dimspace':
                UI.log('DIMSPACE: Select base dimension:', 'prompt');
                break;

            // Help command
            case 'help':
                this.showHelp();
                break;

            // ==========================================
            // PHASE 3 COMMANDS
            // ==========================================

            // Change properties
            case 'chprop':
                if (CAD.selectedIds.length === 0) {
                    UI.log('CHPROP: Select objects to change properties:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('CHPROP: Enter property to change [Color/LAyer/LType/LtScale/LWeight/Thickness]:', 'prompt');
                    CAD.cmdOptions.chpropStep = 'property';
                }
                break;

            // Draw order
            case 'draworder':
                if (CAD.selectedIds.length === 0) {
                    UI.log('DRAWORDER: Select objects:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('DRAWORDER: Enter option [Above/Under/Front/Back]:', 'prompt');
                    CAD.cmdOptions.draworderStep = 'option';
                }
                break;

            case 'draworderfront':
                if (CAD.selectedIds.length === 0) {
                    UI.log('DRAWORDER: Select objects to bring to front:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.draworderAction = 'front';
                } else {
                    this.executeDrawOrder('front');
                }
                break;

            case 'draworderback':
                if (CAD.selectedIds.length === 0) {
                    UI.log('DRAWORDER: Select objects to send to back:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.draworderAction = 'back';
                } else {
                    this.executeDrawOrder('back');
                }
                break;

            case 'draworderabove':
                if (CAD.selectedIds.length === 0) {
                    UI.log('DRAWORDER: Select objects to move above:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.draworderAction = 'above';
                } else {
                    UI.log('DRAWORDER: Select reference object:', 'prompt');
                    CAD.cmdOptions.draworderStep = 'ref';
                }
                break;

            case 'draworderbelow':
                if (CAD.selectedIds.length === 0) {
                    UI.log('DRAWORDER: Select objects to move below:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.draworderAction = 'below';
                } else {
                    UI.log('DRAWORDER: Select reference object:', 'prompt');
                    CAD.cmdOptions.draworderStep = 'ref';
                }
                break;

            case 'texttofront':
                this.executeTextToFront();
                break;

            // Hide/Isolate objects
            case 'hideobjects':
                if (CAD.selectedIds.length === 0) {
                    UI.log('HIDEOBJECTS: Select objects to hide:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.hideAction = 'hide';
                } else {
                    this.executeHideObjects();
                }
                break;

            case 'isolateobjects':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ISOLATEOBJECTS: Select objects to isolate (all others hidden):', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.hideAction = 'isolate';
                } else {
                    this.executeIsolateObjects();
                }
                break;

            case 'unisolateobjects':
                this.executeUnisolateObjects();
                break;

            // Group / Ungroup
            case 'group':
                if (CAD.selectedIds.length === 0) {
                    UI.log('GROUP: Select objects to group:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('GROUP: Enter group name (or press Enter for auto-name):', 'prompt');
                    CAD.cmdOptions.groupStep = 'name';
                }
                break;

            case 'ungroup':
                if (CAD.selectedIds.length === 0) {
                    UI.log('UNGROUP: Select grouped object:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    this.executeUngroup();
                }
                break;

            // Array along path
            case 'arraypath':
                if (CAD.selectedIds.length === 0) {
                    UI.log('ARRAYPATH: Select objects to array:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('ARRAYPATH: Select path curve:', 'prompt');
                    CAD.cmdOptions.arraypathStep = 'path';
                }
                break;

            // Multiline
            case 'mline':
                UI.log(`MLINE: Specify start point or [Justification/Scale] <scale=${CAD.cmdOptions.mlineScale || 10}>:`, 'prompt');
                CAD.cmdOptions.mlineScale = CAD.cmdOptions.mlineScale || 10;
                CAD.cmdOptions.mlineJust = CAD.cmdOptions.mlineJust || 'top';
                break;

            // Table
            case 'table':
                UI.log('TABLE: Specify insertion point:', 'prompt');
                CAD.cmdOptions.tableStep = 'insert';
                CAD.cmdOptions.tableRows = 3;
                CAD.cmdOptions.tableCols = 3;
                CAD.cmdOptions.tableCellW = 40;
                CAD.cmdOptions.tableCellH = 10;
                break;

            // Copy with base point
            case 'copybase':
                if (CAD.selectedIds.length === 0) {
                    UI.log('COPYBASE: Select objects:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                    CAD.cmdOptions.copybaseAction = true;
                } else {
                    UI.log('COPYBASE: Specify base point:', 'prompt');
                    CAD.cmdOptions.copybaseAction = true;
                }
                break;

            // Paste as block
            case 'pasteblock':
                if (!CAD.clipboard || CAD.clipboard.length === 0) {
                    UI.log('PASTEBLOCK: Clipboard is empty. Use COPYBASE first.', 'error');
                    this.finishCommand();
                } else {
                    UI.log('PASTEBLOCK: Specify insertion point:', 'prompt');
                }
                break;

            // Reverse polyline
            case 'reverse':
                if (CAD.selectedIds.length === 0) {
                    UI.log('REVERSE: Select polylines to reverse:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    this.executeReverse();
                }
                break;

            // Select previous
            case 'selectprevious':
                this.executeSelectPrevious();
                break;

            // ===== NEW AUTOCAD LT FEATURES =====

            case 'mleader':
                UI.log('MLEADER: Specify leader arrowhead location:', 'prompt');
                break;

            case 'mleaderstyle': {
                const styles = CAD.mleaderStyles.map(s => s.name).join(', ');
                UI.log(`MLEADERSTYLE: Current style: "${CAD.currentMLeaderStyle}". Available: ${styles}`, 'info');
                UI.log('Options: [List/Set/New/Delete]:', 'prompt');
                break;
            }

            case 'mleaderalign':
                if (CAD.selectedIds.length < 2) {
                    UI.log('MLEADERALIGN: Select multileaders to align (at least 2):', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    UI.log('MLEADERALIGN: Specify direction or [Options]:', 'prompt');
                }
                break;

            case 'mleadercollect':
                if (CAD.selectedIds.length < 2) {
                    UI.log('MLEADERCOLLECT: Select multileaders to collect:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                } else {
                    this.executeMLeaderCollect();
                }
                break;

            case 'attdef':
                UI.log('ATTDEF: Enter attribute tag name:', 'prompt');
                CAD.cmdOptions.attdefStep = 'tag';
                break;

            case 'attedit':
                if (CAD.selectedIds.length > 0) {
                    this.executeAttEdit();
                } else {
                    UI.log('ATTEDIT: Select a block with attributes:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                }
                break;

            case 'tolerance':
                CAD.cmdOptions.toleranceFrames = [];
                CAD.cmdOptions.toleranceStep = 'symbol';
                UI.log('Enter geometric characteristic (u=Position, r=Perpendicularity, p=Parallelism, a=Angularity, y=Cylindricity, c=Concentricity, s=Symmetry, t=Flatness, l=Straightness, i=Circularity, x=Runout):', 'prompt');
                break;

            case 'quickcalc':
                this.showQuickCalc();
                break;

            case 'mlstyle': {
                const mStyles = CAD.multilineStyles.map(s => s.name).join(', ');
                UI.log(`MLSTYLE: Current style: "${CAD.currentMultilineStyle}". Available: ${mStyles}`, 'info');
                UI.log('Options: [List/Set/New/Delete/Elements]:', 'prompt');
                break;
            }

            case 'trace':
                UI.log(`TRACE: Specify trace width <${CAD.cmdOptions.traceWidth || 1}>:`, 'prompt');
                CAD.cmdOptions.traceWidth = CAD.cmdOptions.traceWidth || 1;
                CAD.cmdOptions.traceStep = 'width';
                break;

            case 'pagesetup': {
                const layout = CAD.getLayout(CAD.currentLayout);
                if (!layout || layout.type !== 'paper') {
                    UI.log('PAGESETUP: Switch to a layout tab first (not Model).', 'error');
                    this.finishCommand();
                    return;
                }
                const ps = CAD.getPageSetup();
                UI.log(`PAGESETUP: Layout "${CAD.currentLayout}"`, 'info');
                UI.log(`  Paper: ${ps.paperSize} (${ps.paperWidth}x${ps.paperHeight}mm) ${ps.orientation}`, 'info');
                UI.log(`  Scale: ${ps.plotScale}, Margins: T=${ps.margins.top} R=${ps.margins.right} B=${ps.margins.bottom} L=${ps.margins.left}`, 'info');
                UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
                break;
            }

            case 'vpscale': {
                const vLayout = CAD.getLayout(CAD.currentLayout);
                if (!vLayout || vLayout.type !== 'paper') {
                    UI.log('VPSCALE: Switch to a layout tab first.', 'error');
                    this.finishCommand();
                    return;
                }
                if (!CAD.activeViewportId) {
                    UI.log('VPSCALE: Select a viewport or enter Model Space first (MSPACE).', 'error');
                    this.finishCommand();
                    return;
                }
                UI.log('VPSCALE: Enter viewport scale (e.g., 1:1, 1:2, 1:10, 1:50, 1:100) or scale factor:', 'prompt');
                break;
            }

            case 'imageclip': {
                if (CAD.selectedIds.length === 1) {
                    const imgEnt = CAD.getEntity(CAD.selectedIds[0]);
                    if (imgEnt && imgEnt.type === 'image') {
                        CAD.cmdOptions.clipTarget = imgEnt;
                        UI.log('IMAGECLIP: Enter clipping option [ON/OFF/Delete/New boundary]:', 'prompt');
                    } else {
                        UI.log('IMAGECLIP: Selected entity is not an image.', 'error');
                        this.finishCommand();
                    }
                } else {
                    UI.log('IMAGECLIP: Select an image to clip:', 'prompt');
                    CAD.cmdOptions.needSelection = true;
                }
                break;
            }

            case 'field':
                UI.log('FIELD: Select field type [Date/Filename/Author/Area/NumObjects/Title/Custom]:', 'prompt');
                CAD.cmdOptions.fieldStep = 'type';
                break;

            case 'count': {
                const countResult = this.executeCount();
                if (countResult) {
                    UI.log('COUNT: Entity summary:', 'info');
                    for (const [type, count] of Object.entries(countResult.byType)) {
                        UI.log(`  ${type}: ${count}`, 'info');
                    }
                    if (Object.keys(countResult.byBlock).length > 0) {
                        UI.log('Block references:', 'info');
                        for (const [name, count] of Object.entries(countResult.byBlock)) {
                            UI.log(`  ${name}: ${count}`, 'info');
                        }
                    }
                    UI.log(`Total entities: ${countResult.total}`, 'info');
                }
                this.finishCommand();
                break;
            }

            default:
                UI.log(`Command "${name}" not yet implemented.`, 'error');
                this.finishCommand();
        }
    },

    // ==========================================
    // HELP COMMAND
    // ==========================================

    showHelp(topic) {
        if (topic) {
            this.showCommandHelp(topic);
            this.finishCommand();
            return;
        }

        UI.log('=== BrowserCAD Help ===', 'info');
        UI.log('');

        UI.log('--- Drawing Commands ---', 'info');
        UI.log('  LINE (L)        Draw lines');
        UI.log('  PLINE (PL)      Draw polylines');
        UI.log('  CIRCLE (C)      Draw circles');
        UI.log('  ARC (A)         Draw arcs');
        UI.log('  RECT (REC)      Draw rectangles');
        UI.log('  ELLIPSE (EL)    Draw ellipses');
        UI.log('  TEXT (T)        Single-line text');
        UI.log('  MTEXT (MT)      Multi-line text');
        UI.log('  POLYGON (POL)   Regular polygon');
        UI.log('  DONUT (DO)      Draw donuts');
        UI.log('  RAY             Draw rays');
        UI.log('  XLINE (XL)      Construction lines');
        UI.log('  SPLINE (SPL)    Draw splines');
        UI.log('  HATCH (H)       Hatch closed areas');
        UI.log('  LEADER (LE)     Leader with text');
        UI.log('  IMAGEATTACH     Attach image for tracing');
        UI.log('  REVCLOUD (RC)   Revision cloud');
        UI.log('  WIPEOUT         Masking polygon');
        UI.log('  SOLID (SO)      Filled triangle/quad');
        UI.log('  REGION (REG)    Create region from boundary');
        UI.log('  BOUNDARY (BO)   Create polyline from boundary');
        UI.log('');

        UI.log('--- Modify Commands ---', 'info');
        UI.log('  MOVE (M)        Move objects');
        UI.log('  COPY (CO)       Copy objects');
        UI.log('  ROTATE (RO)     Rotate objects');
        UI.log('  SCALE (SC)      Scale objects');
        UI.log('  MIRROR (MI)     Mirror objects');
        UI.log('  OFFSET (O)      Offset entities');
        UI.log('  TRIM (TR)       Trim objects');
        UI.log('  EXTEND (EX)     Extend objects');
        UI.log('  FILLET (F)      Fillet between lines');
        UI.log('  CHAMFER (CHA)   Chamfer between lines');
        UI.log('  BREAK (BR)      Break an object');
        UI.log('  STRETCH (S)     Stretch via window');
        UI.log('  JOIN (J)        Join segments');
        UI.log('  PEDIT (PE)      Edit polylines');
        UI.log('  ERASE (E)       Erase objects');
        UI.log('  EXPLODE (X)     Explode compound objects');
        UI.log('  ARRAY (AR)      Rectangular array');
        UI.log('  ARRAYPOLAR      Polar array');
        UI.log('  MATCHPROP (MA)  Copy properties');
        UI.log('  ALIGN (AL)      Align objects');
        UI.log('  SCALETEXT (ST)  Scale text height');
        UI.log('  JUSTIFYTEXT (JT) Set text justification');
        UI.log('  DIVIDE (DIV)    Divide into segments');
        UI.log('  MEASURE (ME)    Measure intervals');
        UI.log('  OVERKILL        Remove duplicates');
        UI.log('  CHPROP (CH)     Change entity properties');
        UI.log('  REVERSE         Reverse polyline direction');
        UI.log('');

        UI.log('--- Draw Order & Visibility ---', 'info');
        UI.log('  DRAWORDER (DR)  Change draw order');
        UI.log('  BRINGTOFRONT    Bring objects to front');
        UI.log('  SENDTOBACK      Send objects to back');
        UI.log('  TEXTTOFRONT     Text/dims to front');
        UI.log('  HIDEOBJECTS     Hide selected objects');
        UI.log('  ISOLATEOBJECTS  Isolate selected objects');
        UI.log('  UNISOLATEOBJECTS Restore hidden objects');
        UI.log('');

        UI.log('--- Grouping ---', 'info');
        UI.log('  GROUP (G)       Group objects');
        UI.log('  UNGROUP         Ungroup objects');
        UI.log('');

        UI.log('--- Advanced ---', 'info');
        UI.log('  ARRAYPATH       Array along a path');
        UI.log('  MLINE (ML)      Draw multilines');
        UI.log('  TABLE (TB)      Create table grid');
        UI.log('  COPYBASE        Copy with base point');
        UI.log('  PASTEBLOCK      Paste as block');
        UI.log('');

        UI.log('--- Block Commands ---', 'info');
        UI.log('  BLOCK (B)       Create block');
        UI.log('  INSERT (I)      Insert block');
        UI.log('');

        UI.log('--- Dimension Commands ---', 'info');
        UI.log('  DIMLINEAR (DIM) Linear dimension');
        UI.log('  DIMALIGNED (DAL) Aligned dimension');
        UI.log('  DIMANGULAR (DAN) Angular dimension');
        UI.log('  DIMRADIUS (DRA) Radius dimension');
        UI.log('  DIMDIAMETER (DDI) Diameter dimension');
        UI.log('  DIMBASELINE     Baseline dimension');
        UI.log('  DIMCONTINUE     Continue dimension');
        UI.log('  DIMORDINATE (DOR) Ordinate dimension');
        UI.log('  QDIM            Quick dimension');
        UI.log('  DIMARC          Arc length dimension');
        UI.log('  DIMBREAK        Toggle dimension break');
        UI.log('  DIMSPACE        Space dimensions evenly');
        UI.log('');

        UI.log('--- Inquiry Commands ---', 'info');
        UI.log('  DISTANCE (DI)   Measure distance');
        UI.log('  AREA (AA)       Measure area');
        UI.log('  ID              Read coordinate');
        UI.log('  LIST (LI)       List entity properties');
        UI.log('');

        UI.log('--- Selection Commands ---', 'info');
        UI.log('  SELECTALL (ALL) Select all');
        UI.log('  QSELECT         Select by type');
        UI.log('  SELECTSIMILAR   Select similar objects');
        UI.log('  FILTER (FI)     Filter by type/layer/color');
        UI.log('');

        UI.log('--- Layer Commands ---', 'info');
        UI.log('  LAYER (LA)      Layer management');
        UI.log('  LAYFRZ           Freeze layer');
        UI.log('  LAYTHW           Thaw layer');
        UI.log('  LAYON            Turn layer on');
        UI.log('  LAYOFF           Turn layer off');
        UI.log('  LAYLCK           Lock layer');
        UI.log('  LAYULK           Unlock layer');
        UI.log('  LAYDEL           Delete layer');
        UI.log('  LAYISO           Isolate layer');
        UI.log('  LAYUNISO         Restore layers');
        UI.log('  LAYMERGE         Merge layers');
        UI.log('');

        UI.log('--- View & Utility ---', 'info');
        UI.log('  ZOOM (Z)        Zoom (All/Extents/Window)');
        UI.log('  PAN (P)         Pan view');
        UI.log('  REGEN (RE)      Regenerate display');
        UI.log('  UNDO (U)        Undo');
        UI.log('  REDO (Y)        Redo');
        UI.log('  VIEW            Named views');
        UI.log('  FIND            Search and replace text');
        UI.log('  PURGE (PU)      Remove unused items');
        UI.log('  APPLOAD         Load Lisp scripts');
        UI.log('  LAYOUT          Manage layouts/paperspace');
        UI.log('  MVIEW           Create layout viewport');
        UI.log('  MSPACE          Activate model space in viewport');
        UI.log('  PSPACE          Return to paper space');
        UI.log('  PLOT            Export layout to PDF');
        UI.log('  LAYERSTATE      Manage layer states');
        UI.log('');

        UI.log('--- Settings ---', 'info');
        UI.log('  GRID            Toggle grid');
        UI.log('  SNAP            Toggle snap');
        UI.log('  ORTHO           Toggle ortho');
        UI.log('  OSNAP           Object snap modes');
        UI.log('  POLAR           Polar tracking');
        UI.log('  LINETYPE (LT)   Set linetype');
        UI.log('  LTSCALE         Linetype scale');
        UI.log('  DIMSTYLE        Dimension style manager');
        UI.log('');

        UI.log('--- File Commands ---', 'info');
        UI.log('  NEW             New drawing');
        UI.log('  SAVE            Save to local storage');
        UI.log('  OPEN            Open from local storage');
        UI.log('  EXPORT (DXFOUT) Export DXF');
        UI.log('');

        UI.log('--- Keyboard Shortcuts ---', 'info');
        UI.log('  Ctrl+Z    Undo');
        UI.log('  Ctrl+Y    Redo');
        UI.log('  F2        Toggle grid');
        UI.log('  F3        Toggle OSNAP');
        UI.log('  F8        Toggle ortho');
        UI.log('  F10       Toggle polar');
        UI.log('  Esc       Cancel command');
        UI.log('  Enter/Space  Confirm / repeat last');
        UI.log('');

        UI.log('Type HELP <command> for detailed help on a specific command.', 'info');
        this.finishCommand();
    },

    showCommandHelp(cmdName) {
        const lc = cmdName.toLowerCase();
        const resolved = this.aliases[lc] || lc;

        const helpTexts = {
            'line': 'LINE (L): Draw line segments. Click start point, then next points. Press Enter to finish. Type "U" to undo last segment. Type "C" to close.',
            'polyline': 'PLINE (PL): Draw polylines. Click points sequentially. Press Enter to finish. Type "C" to close.',
            'circle': 'CIRCLE (C): Draw circles. Specify center point then radius. Options: 3P (three-point), 2P (two-point), Ttr (tangent-tangent-radius).',
            'arc': 'ARC (A): Draw arcs. Specify center point, then start point, then end point.',
            'rect': 'RECT (REC): Draw rectangles. Click first corner, then opposite corner.',
            'ellipse': 'ELLIPSE (EL): Draw ellipses. Specify axis endpoints, then other axis distance.',
            'text': 'TEXT (T): Add single-line text. Click insertion point, enter height, rotation, then text content.',
            'mtext': 'MTEXT (MT): Add multi-line text. Click two corners for text box, then enter text.',
            'polygon': 'POLYGON (POL): Draw regular polygon. Enter sides, specify center, then inscribed/circumscribed radius.',
            'donut': 'DONUT (DO): Draw donuts. Enter inner/outer diameters, then click center points.',
            'move': 'MOVE (M): Move objects. Select objects, specify base point, then destination point.',
            'copy': 'COPY (CO): Copy objects. Select objects, specify base point, then destination(s). Press Enter to finish.',
            'rotate': 'ROTATE (RO): Rotate objects. Select objects, specify base point, then rotation angle.',
            'scale': 'SCALE (SC): Scale objects. Select objects, specify base point, enter scale factor. Options: Copy, Reference.',
            'mirror': 'MIRROR (MI): Mirror objects. Select objects, specify two mirror line points.',
            'offset': 'OFFSET (O): Offset entities. Enter distance, select object, click side to offset.',
            'trim': 'TRIM (TR): Trim objects at cutting edges. Select cutting edges (Enter for all), then click portions to trim.',
            'extend': 'EXTEND (EX): Extend objects to boundary edges. Select boundaries (Enter for all), then click objects to extend.',
            'fillet': 'FILLET (F): Round corner between two lines. Enter radius, select two lines.',
            'chamfer': 'CHAMFER (CHA): Bevel corner between two lines. Enter distances, select two lines.',
            'erase': 'ERASE (E): Delete selected objects.',
            'explode': 'EXPLODE (X): Break compound objects (blocks, polylines, rects) into individual entities.',
            'block': 'BLOCK (B): Create a named block. Select objects, enter name, specify base point.',
            'insert': 'INSERT (I): Insert a block reference. Enter name, scale, rotation, click placement.',
            'array': 'ARRAY (AR): Create rectangular array. Select objects, enter rows, columns, spacing.',
            'hatch': 'HATCH (H): Fill closed areas with patterns. Options: Pattern/Scale/Angle. Click inside boundary to apply.',
            'hatchedit': 'HATCHEDIT (HE): Edit existing hatch. Change pattern, scale, angle, or delete.',
            'matchprop': 'MATCHPROP (MA): Copy properties (layer, color, linetype) from source to destination objects.',
            'align': 'ALIGN (AL): Align objects using point pairs. Select objects, specify source/dest point pairs.',
            'divide': 'DIVIDE (DIV): Place point markers at equal intervals along an object.',
            'measure': 'MEASURE (ME): Place point markers at specified distance intervals along an object.',
            'overkill': 'OVERKILL: Remove duplicate/overlapping entities automatically.',
            'dimlinear': 'DIMLINEAR (DIM): Create horizontal/vertical dimension. Click two points, then place dimension line.',
            'dimaligned': 'DIMALIGNED (DAL): Create aligned dimension. Click two points, then place dimension line.',
            'dimangular': 'DIMANGULAR (DAN): Measure angle between two lines. Select two lines, then place dimension.',
            'dimradius': 'DIMRADIUS (DRA): Dimension radius. Select arc/circle, then place dimension.',
            'dimdiameter': 'DIMDIAMETER (DDI): Dimension diameter. Select arc/circle, then place dimension.',
            'dimordinate': 'DIMORDINATE (DOR): Ordinate dimension. Click feature point, then leader endpoint. Type X/Y to force axis.',
            'qdim': 'QDIM: Quick dimension. Select objects, then click to place. Auto-generates dimensions.',
            'dimstyle': 'DIMSTYLE: Manage dimension styles. Options: List/Set/Save.',
            'osnap': 'OSNAP: Object snap settings. Options: On/Off/End/Mid/Cen/Int/Per/Tan/Nea/Qua/Nod/All/None/List.',
            'layer': 'LAYER (LA): Layer management. Options: New (create), Set (current), On/Off (visibility), List.',
            'layout': 'LAYOUT: Manage Model/Layout tabs. Options: New/Set/List/Delete.',
            'layerstate': 'LAYERSTATE: Save/restore layer states. Options: Save/Restore/List/Delete.',
            'mview': 'MVIEW: Create a paper space viewport. Click two corners to define the viewport rectangle.',
            'mspace': 'MSPACE: Activate model space within a viewport. Select a viewport to edit its view.',
            'pspace': 'PSPACE: Return to paper space editing.',
            'plot': 'PLOT: Export the current layout to PDF (requires jsPDF).',
            'zoom': 'ZOOM (Z): Zoom view. Options: All/Extents/Window/Center. Scroll wheel also zooms.',
            'find': 'FIND: Search and replace text in all text/mtext entities.',
            'filter': 'FILTER (FI): Select entities by Type, Layer, or Color filter.',
            'view': 'VIEW: Named views. Options: Save/Restore/Delete/List.',
            'purge': 'PURGE (PU): Remove unused layers and unreferenced block definitions.',
            'chprop': 'CHPROP (CH): Change entity properties. Select objects, then choose Color/LAyer/LType/LtScale/LWeight.',
            'draworder': 'DRAWORDER (DR): Change draw order. Options: Front, Back, Above (ref), Under (ref).',
            'draworderfront': 'BRINGTOFRONT: Move selected objects to the front (drawn last).',
            'draworderback': 'SENDTOBACK: Move selected objects to the back (drawn first).',
            'texttofront': 'TEXTTOFRONT: Bring all text, mtext, dimensions, and leaders to the front.',
            'hideobjects': 'HIDEOBJECTS: Temporarily hide selected objects. Use UNISOLATEOBJECTS to restore.',
            'isolateobjects': 'ISOLATEOBJECTS: Show only selected objects, hide everything else.',
            'unisolateobjects': 'UNISOLATEOBJECTS: Restore all hidden objects to visible.',
            'group': 'GROUP (G): Create a named group. Select objects, enter name. Clicking one selects all.',
            'ungroup': 'UNGROUP: Dissolve groups. Select grouped object, all groups it belongs to are removed.',
            'arraypath': 'ARRAYPATH: Array objects along a path. Select objects, select path, enter count.',
            'mline': 'MLINE (ML): Draw parallel lines. Options: Justification (Top/Zero/Bottom), Scale (line spacing).',
            'table': 'TABLE (TB): Create a table grid. Click insertion point, enter rows, columns, cell dimensions.',
            'copybase': 'COPYBASE: Copy with a specified base point. Select objects, click base point.',
            'pasteblock': 'PASTEBLOCK: Paste clipboard contents as a block reference. Click insertion point.',
            'reverse': 'REVERSE: Reverse the direction of polylines, lines, or arcs.',
            'selectprevious': 'SELECTPREVIOUS: Re-select the previous selection set.',
            'help': 'HELP (?): Display available commands and keyboard shortcuts. Type HELP <command> for details.',
            'mleader': 'MLEADER (MLD): Create multi-leader annotation. Specify arrowhead point, landing point, then enter text.',
            'mleaderstyle': 'MLEADERSTYLE (MLS): Manage multi-leader styles. Options: List/Set/New/Delete.',
            'mleaderalign': 'MLEADERALIGN: Align selected multileader objects evenly.',
            'mleadercollect': 'MLEADERCOLLECT: Collect multiple multileaders into a single leader with stacked content.',
            'attdef': 'ATTDEF (ATT): Define block attributes. Enter tag name, prompt text, default value, then place in drawing.',
            'attedit': 'ATTEDIT (ATE): Edit block attribute values. Select block reference with attributes to modify.',
            'tolerance': 'TOLERANCE (TOL): Create geometric tolerance (GD&T) feature control frame. Specify symbol, tolerance, and datums.',
            'quickcalc': 'QUICKCALC (QC): Open the QuickCalc calculator. Evaluate math expressions.',
            'mlstyle': 'MLSTYLE: Manage multiline styles. Options: List/Set/New/Delete/Elements.',
            'trace': 'TRACE: Draw filled trace segments with specified width.',
            'pagesetup': 'PAGESETUP: Configure page setup for the current layout. Set paper size, orientation, scale, margins.',
            'vpscale': 'VPSCALE: Set viewport scale factor. Enter ratio like 1:50 or a decimal scale factor.',
            'imageclip': 'IMAGECLIP (ICLIP): Clip an image to a rectangular boundary. Select image, then define clip rectangle.',
            'field': 'FIELD: Insert a dynamic field (date, filename, count, etc.) as text at a specified point.',
            'count': 'COUNT: Count all entities by type and list block reference counts.'
        };

        const helpText = helpTexts[resolved];
        if (helpText) {
            UI.log(helpText, 'info');
        } else {
            UI.log(`No detailed help available for "${cmdName}". Try HELP for the full command list.`, 'info');
        }
    },

    // ==========================================
    // CLICK HANDLING
    // ==========================================

    handleClick(point) {
        const state = CAD;

        // Handle coordinate input from snap
        if ((state.osnapEnabled || state.gridSnapEnabled) && state.snapPoint) {
            point = { ...state.snapPoint };
        }

        // Apply ortho mode
        if (state.orthoEnabled && state.points.length > 0) {
            point = Utils.applyOrtho(state.points[state.points.length - 1], point);
        }

        if (typeof Lisp !== 'undefined' && Lisp.pendingInput) {
            const lispType = CAD.lispInputType;
            if (lispType === 'point' || lispType === 'corner') {
                Lisp.handleUserInput(point);
                Renderer.draw();
                return;
            }
            if (lispType === 'entsel') {
                const hit = this.hitTest(point);
                if (hit) {
                    Lisp.handleUserInput({ entity: hit, point });
                } else {
                    UI.log('No object found for selection.', 'error');
                }
                Renderer.draw();
                return;
            }
            if (lispType === 'ssget') {
                const hits = this.hitTestAll(point);
                if (hits.length > 0) {
                    Lisp.handleUserInput({ ids: hits.map(hit => hit.id) });
                } else if (CAD.selectedIds.length > 0) {
                    Lisp.handleUserInput({ ids: [...CAD.selectedIds] });
                } else {
                    UI.log('No objects selected.', 'error');
                }
                Renderer.draw();
                return;
            }
        }

        // Handle selection mode FIRST (window/crossing selection in progress)
        // This must come before needSelection check to properly finish selection box
        if (state.selectionMode && state.selectStart) {
            this.finishSelection(point);
            // After window selection during modify commands, update toolbar and stay in selection mode
            if (state.cmdOptions.needSelection) {
                UI.log(`${state.selectedIds.length} selected. Press ENTER to confirm or keep selecting.`, 'prompt');
                UI.updateCanvasSelectionInfo();
            }
            Renderer.draw();
            return;
        }

        // Check if we need selection first (modify commands)
        if (state.cmdOptions.needSelection) {
            const hit = this.hitTest(point);
            if (hit) {
                // Toggle selection on click (like CAD)
                if (state.isSelected(hit.id)) {
                    state.deselect(hit.id);
                    UI.log(`1 removed, ${state.selectedIds.length} total`);
                } else {
                    state.select(hit.id);
                    UI.log(`1 found, ${state.selectedIds.length} total`);
                }
            } else {
                // Start window/crossing selection (first corner)
                state.selectionMode = true;
                state.selectStart = point;
                UI.log('Specify opposite corner:');
                Renderer.draw();
                return;
            }

            // Don't auto-proceed - wait for Enter to confirm selection
            // User can keep selecting more entities
            UI.log(`${state.selectedIds.length} selected. Press ENTER to confirm or keep selecting.`, 'prompt');
            UI.updateCanvasSelectionInfo();
            Renderer.draw();
            return;
        }

        // Handle PEDIT movevertex click
        if (state.activeCmd === 'pedit' && state.cmdOptions.peditMode === 'movevertex') {
            const target = state.cmdOptions.peditTarget;
            const vi = state.cmdOptions.vertexIndex || 0;
            if (target && target.points && vi < target.points.length) {
                CAD.saveUndoState('PEDIT Move vertex');
                target.points[vi] = { x: point.x, y: point.y };
                CAD.updateEntity(target.id, target, true);
                UI.log(`Vertex ${vi} moved. [N/P/M/I/D/X]:`, 'prompt');
                state.cmdOptions.peditMode = 'editvertex';
                Renderer.draw();
            }
            return;
        }

        // Handle active commands
        switch (state.activeCmd) {
            case 'line':
                this.handleLineClick(point);
                break;

            case 'polyline':
                this.handlePolylineClick(point);
                break;

            case 'circle':
                this.handleCircleClick(point);
                break;

            case 'arc':
                this.handleArcClick(point);
                break;

            case 'rect':
                this.handleRectClick(point);
                break;

            case 'mview':
                this.handleMViewClick(point);
                break;

            case 'ellipse':
                this.handleEllipseClick(point);
                break;

            case 'text':
                this.handleTextClick(point);
                break;

            case 'leader':
                this.handleLeaderClick(point);
                break;

            case 'mtext':
                this.handleMTextClick(point);
                break;

            case 'mspace':
                this.handleMSpaceClick(point);
                break;

            case 'point':
                this.handlePointClick(point);
                break;

            case 'move':
                this.handleMoveClick(point);
                break;

            case 'copy':
                this.handleCopyClick(point);
                break;

            case 'rotate':
                this.handleRotateClick(point);
                break;

            case 'scale':
                this.handleScaleClick(point);
                break;

            case 'mirror':
                this.handleMirrorClick(point);
                break;

            case 'offset':
                this.handleOffsetClick(point);
                break;

            case 'imageattach':
                this.handleImageAttachClick(point);
                break;

            case 'trim':
                this.handleTrimClick(point);
                break;

            case 'extend':
                this.handleExtendClick(point);
                break;

            case 'hatch':
                this.handleHatchClick(point);
                break;

            case 'hatchedit': {
                const hitEnt = this.hitTest(point);
                if (hitEnt && (hitEnt.type === 'hatch' || hitEnt.hatch)) {
                    CAD.cmdOptions.hatchEditTarget = hitEnt;
                    UI.log(`HATCHEDIT: Pattern=${(hitEnt.patternName || hitEnt.hatch?.pattern || 'solid').toUpperCase()}, Scale=${hitEnt.scale || 1}, Angle=${hitEnt.angle || 0}°`, 'prompt');
                    UI.log(`Options: [Pattern/Scale/Angle/Delete]:`, 'prompt');
                } else {
                    UI.log('HATCHEDIT: No hatch found at that point.', 'error');
                }
                break;
            }

            case 'xclip':
                this.handleXClipClick(point);
                break;

            case 'distance':
                this.handleDistanceClick(point);
                break;

            case 'area':
                this.handleAreaClick(point);
                break;

            case 'id':
                UI.log(`X = ${point.x.toFixed(4)}, Y = ${point.y.toFixed(4)}, Z = 0.0000`);
                this.finishCommand();
                break;

            case 'polygon':
                this.handlePolygonClick(point);
                break;

            case 'ray':
                this.handleRayClick(point);
                break;

            case 'xline':
                this.handleXLineClick(point);
                break;

            case 'spline':
                this.handleSplineClick(point);
                break;

            case 'donut':
                this.handleDonutClick(point);
                break;

            case 'array':
            case 'arrayrect':
                this.handleArrayClick(point);
                break;

            case 'arraypolar':
                this.handlePolarArrayClick(point);
                break;

            case 'fillet':
                this.handleFilletClick(point);
                break;

            case 'chamfer':
                this.handleChamferClick(point);
                break;

            case 'stretch':
                this.handleStretchClick(point);
                break;

            case 'break':
                this.handleBreakClick(point);
                break;

            case 'dimlinear':
            case 'dimaligned':
                this.handleDimLinearClick(point);
                break;
            case 'dimbaseline':
            case 'dimcontinue':
                this.handleDimContinueClick(point);
                break;

            case 'dimradius':
            case 'dimdiameter':
                this.handleDimRadiusClick(point);
                break;

            case 'block':
                this.handleBlockClick(point);
                break;

            case 'insert':
                this.handleInsertClick(point);
                break;

            // New quick-win commands
            case 'divide':
                this.handleDivideClick(point);
                break;

            case 'measure':
                this.handleMeasureClick(point);
                break;

            case 'revcloud':
                this.handleRevcloudClick(point);
                break;

            case 'matchprop':
                this.handleMatchpropClick(point);
                break;

            case 'wipeout':
                this.handleWipeoutClick(point);
                break;

            case 'dimordinate':
                this.handleDimOrdinateClick(point);
                break;

            // Phase 2 click handlers
            case 'layiso':
                this.handleLayIsoClick(point);
                break;

            case 'align':
                this.handleAlignClick(point);
                break;

            case 'solid':
                this.handleSolidClick(point);
                break;

            case 'boundary':
            case 'region':
                this.handleBoundaryClick(point);
                break;

            case 'qdim':
                this.handleQdimClick(point);
                break;

            case 'dimarc':
                this.handleDimArcClick(point);
                break;

            case 'dimbreak':
                this.handleDimBreakClick(point);
                break;

            case 'dimspace':
                this.handleDimSpaceClick(point);
                break;

            // Phase 3 click handlers
            case 'draworderabove':
            case 'draworderbelow':
                this.handleDrawOrderRefClick(point);
                break;

            case 'arraypath':
                this.handleArrayPathClick(point);
                break;

            case 'mline':
                this.handleMlineClick(point);
                break;

            case 'table':
                this.handleTableClick(point);
                break;

            case 'copybase':
                this.handleCopyBaseClick(point);
                break;

            case 'pasteblock':
                this.handlePasteBlockClick(point);
                break;

            // ===== NEW AUTOCAD LT FEATURE CLICK HANDLERS =====
            case 'mleader':
                this.handleMLeaderClick(point);
                break;

            case 'attdef':
                this.handleAttDefClick(point);
                break;

            case 'tolerance':
                this.handleToleranceClick(point);
                break;

            case 'trace':
                this.handleTraceClick(point);
                break;

            case 'imageclip':
                this.handleImageClipClick(point);
                break;

            case 'field':
                this.handleFieldClick(point);
                break;

            default:
                // No active command - try to select
                this.handleSelectionClick(point);
        }

        Renderer.draw();
    },

    // ==========================================
    // DRAWING COMMAND HANDLERS
    // ==========================================

    handleLineClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.points.length === 1 && !state.lineChainStart) {
            state.lineChainStart = point;
        }

        if (state.points.length === 2) {
            CAD.addEntity({
                type: 'line',
                p1: { ...state.points[0] },
                p2: { ...state.points[1] }
            });
            state.points = [state.points[1]];
            UI.log('LINE: Specify next point or [Close/Undo]:', 'prompt');
        } else {
            UI.log('LINE: Specify next point:', 'prompt');
        }
    },

    handlePolylineClick(point) {
        const state = CAD;
        const mode = state.cmdOptions.polylineMode || 'line';

        // Initialize bulges array if not present
        if (!state.cmdOptions.polylineBulges) {
            state.cmdOptions.polylineBulges = [];
        }

        if (mode === 'arc' && state.points.length >= 1) {
            if (!state.cmdOptions.polylineArcStep) {
                state.cmdOptions.polylineArcEnd = point;
                state.cmdOptions.polylineArcStep = 1;
                UI.log('PLINE: Specify point on arc:', 'prompt');
                return;
            }

            const startPoint = state.points[state.points.length - 1];
            const midPoint = point;
            const endPoint = state.cmdOptions.polylineArcEnd;

            // Compute bulge from three points (start, midpoint-on-arc, end)
            const bulge = this._computeBulgeFromThreePoints(startPoint, midPoint, endPoint);

            if (bulge !== null) {
                // Store the bulge for the segment from startPoint to endPoint
                state.cmdOptions.polylineBulges[state.points.length - 1] = bulge;
                state.points.push({ ...endPoint });
            } else {
                // Fallback to straight segment
                state.cmdOptions.polylineBulges[state.points.length - 1] = 0;
                state.points.push({ ...endPoint });
                UI.log('PLINE: Arc points invalid, used straight segment.', 'error');
            }

            state.cmdOptions.polylineArcStep = 0;
            state.cmdOptions.polylineArcEnd = null;
            UI.log('PLINE: Specify next point or [Arc/Line/Close/Undo]:', 'prompt');
            return;
        }

        // Line mode: push point with 0 bulge for preceding segment
        if (state.points.length > 0) {
            state.cmdOptions.polylineBulges[state.points.length - 1] = 0;
        }
        state.points.push(point);
        state.step++;
        UI.log('PLINE: Specify next point or [Arc/Line/Close/Undo]:', 'prompt');
    },

    _computeBulgeFromThreePoints(start, mid, end) {
        // Compute circle through three points
        const ax = start.x, ay = start.y;
        const bx = mid.x, by = mid.y;
        const cx = end.x, cy = end.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-8) return null;

        const ax2ay2 = ax * ax + ay * ay;
        const bx2by2 = bx * bx + by * by;
        const cx2cy2 = cx * cx + cy * cy;

        const ux = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
        const uy = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
        const center = { x: ux, y: uy };
        const radius = Utils.dist(center, start);
        if (!radius || Number.isNaN(radius)) return null;

        // Compute the included angle
        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const midAngle = Math.atan2(mid.y - center.y, mid.x - center.x);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

        // Determine direction (CCW or CW)
        const ccw = this.isAngleBetweenCCW(startAngle, endAngle, midAngle);

        let sweep;
        if (ccw) {
            sweep = endAngle - startAngle;
            if (sweep <= 0) sweep += Math.PI * 2;
        } else {
            sweep = endAngle - startAngle;
            if (sweep >= 0) sweep -= Math.PI * 2;
        }

        // Bulge = tan(sweep / 4)
        return Math.tan(sweep / 4);
    },

    handleCircleClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.points.length === 1) {
            UI.log('CIRCLE: Specify radius or [Diameter]:', 'prompt');
        } else if (state.points.length === 2) {
            const radius = Utils.dist(state.points[0], state.points[1]);
            CAD.addEntity({
                type: 'circle',
                center: { ...state.points[0] },
                r: radius
            });
            UI.log(`Circle created with radius ${radius.toFixed(4)}`);
            this.finishCommand();
        }
    },

    handleArcClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('ARC: Specify start point of arc:', 'prompt');
        } else if (state.step === 2) {
            UI.log('ARC: Specify end point of arc:', 'prompt');
        } else if (state.step === 3) {
            const center = state.points[0];
            const r = Utils.dist(center, state.points[1]);
            const startAngle = Utils.angle(center, state.points[1]);
            const endAngle = Utils.angle(center, state.points[2]);

            CAD.addEntity({
                type: 'arc',
                center: { ...center },
                r: r,
                start: startAngle,
                end: endAngle
            });
            UI.log('Arc created.');
            this.finishCommand();
        }
    },

    handleRectClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.points.length === 1) {
            UI.log('RECTANGLE: Specify other corner point:', 'prompt');
        } else if (state.points.length === 2) {
            CAD.addEntity({
                type: 'rect',
                p1: { ...state.points[0] },
                p2: { ...state.points[1] }
            });
            UI.log('Rectangle created.');
            this.finishCommand();
        }
    },

    handleMViewClick(point) {
        const state = CAD;
        const layout = state.getLayout(state.currentLayout);
        if (!layout || layout.type !== 'paper') {
            UI.log('MVIEW: Not in a layout. Switch to a layout tab first.', 'error');
            this.finishCommand();
            return;
        }

        state.points.push(point);
        state.step++;

        if (state.points.length === 1) {
            UI.log('MVIEW: Specify opposite corner:', 'prompt');
            return;
        }

        const p1 = state.points[0];
        const p2 = state.points[1];
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);

        if (width < 1 || height < 1) {
            UI.log('MVIEW: Viewport is too small.', 'error');
            this.finishCommand();
            return;
        }

        const centerPoint = Utils.midpoint(p1, p2);
        const modelLayout = state.getLayout('Model') || { pan: { x: 0, y: 0 }, zoom: 1 };
        const canvasSize = Renderer.getCanvasSize();
        const modelViewCenter = Utils.screenToWorld(
            canvasSize.width / 2,
            canvasSize.height / 2,
            modelLayout.pan,
            modelLayout.zoom,
            canvasSize.height
        );
        const viewScale = modelLayout.zoom / (state.zoom || 1);

        layout.viewports.push({
            id: generateId(),
            type: 'viewport',
            centerPoint: { ...centerPoint },
            width,
            height,
            viewCenter: { ...modelViewCenter },
            viewScale: Math.max(viewScale, 0.001)
        });

        UI.log('MVIEW: Viewport created.', 'success');
        this.finishCommand();
    },

    handleMSpaceClick(point) {
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout || layout.type !== 'paper') {
            UI.log('MSPACE: Not in a layout. Switch to a layout tab first.', 'error');
            this.finishCommand();
            return;
        }

        const viewport = this.getViewportAtPoint(point, layout);
        if (!viewport) {
            UI.log('MSPACE: Select a viewport.', 'prompt');
            return;
        }

        this.enterModelSpace(viewport);
        this.finishCommand(true);
    },

    handleEllipseClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('ELLIPSE: Specify axis endpoint 2:', 'prompt');
        } else if (state.step === 2) {
            UI.log('ELLIPSE: Specify distance to other axis:', 'prompt');
        } else if (state.step === 3) {
            const center = Utils.midpoint(state.points[0], state.points[1]);
            const rx = Utils.dist(state.points[0], state.points[1]) / 2;
            const ry = Utils.dist(center, state.points[2]);
            const rotation = Utils.angle(state.points[0], state.points[1]);

            CAD.addEntity({
                type: 'ellipse',
                center: { ...center },
                rx: rx,
                ry: ry,
                rotation: rotation
            });
            UI.log('Ellipse created.');
            this.finishCommand();
        }
    },

    handleTextClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            // First click - get text position
            const defaultHeight = CAD.textHeight || 10;
            UI.log(`TEXT: Specify height <${defaultHeight}>:`, 'prompt');
            CAD.cmdOptions.textPosition = point;
        } else if (state.step === 2) {
            // Height entered via handleInput, now get rotation
            UI.log('TEXT: Specify rotation angle <0>:', 'prompt');
        }
    },

    completeTextCommand(text) {
        const height = CAD.cmdOptions.textHeight || CAD.textHeight || 10;
        const rotation = CAD.cmdOptions.textRotation || 0;
        const position = CAD.cmdOptions.textPosition;

        if (text && position) {
            CAD.addEntity({
                type: 'text',
                position: { ...position },
                text: text,
                height: height,
                rotation: rotation,
                textStyle: CAD.currentTextStyle || 'Standard'
            });
            UI.log('Text created.');
        }
        this.finishCommand();
    },

    handleLeaderClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('LEADER: Specify next point:', 'prompt');
        } else if (state.step === 2) {
            UI.log('LEADER: Enter text:', 'prompt');
        }
    },

    completeLeaderCommand(text) {
        const points = CAD.points;
        if (!text || points.length < 2) {
            UI.log('LEADER: Text required to finish leader.', 'error');
            return;
        }
        const height = CAD.textHeight || 10;
        const anchor = points[points.length - 1];
        CAD.addEntity({
            type: 'leader',
            points: points.map(p => ({ ...p })),
            text: text,
            height: height,
            textPosition: { x: anchor.x, y: anchor.y }
        });
        UI.log('Leader created.');
        this.finishCommand();
    },

    handleMTextClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('MTEXT: Specify opposite corner or [Height/Justify/Line spacing/Rotation/Style/Width]:', 'prompt');
        } else if (state.step === 2) {
            // Two corners specified - create mtext box
            const p1 = state.points[0];
            const p2 = state.points[1];

            // Calculate width from corners
            const width = Math.abs(p2.x - p1.x);
            const height = CAD.textHeight || 10;

            // Prompt for text content
            const text = prompt('Enter multiline text (use \\n for new lines):', '');
            if (text) {
                CAD.addEntity({
                    type: 'mtext',
                    position: {
                        x: Math.min(p1.x, p2.x),
                        y: Math.max(p1.y, p2.y)
                    },
                    text: text.replace(/\\n/g, '\n'),
                    height: height,
                    width: width,
                    rotation: 0,
                    attachment: 'topLeft' // TL, TC, TR, ML, MC, MR, BL, BC, BR
                });
                UI.log('MText created.');
            }
            this.finishCommand();
        }
    },

    handlePointClick(point) {
        CAD.addEntity({
            type: 'point',
            position: { ...point }
        });
        UI.log(`Point: X=${point.x.toFixed(4)}, Y=${point.y.toFixed(4)}. Specify next point:`);
        // Don't finish - allow multiple points (like CAD)
    },

    // ==========================================
    // MODIFY COMMAND HANDLERS
    // ==========================================

    handleMoveClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('MOVE: Specify second point or <use first point as displacement>:', 'prompt');
        } else if (state.step === 2) {
            const delta = {
                x: state.points[1].x - state.points[0].x,
                y: state.points[1].y - state.points[0].y
            };

            CAD.saveUndoState('Move');
            state.getSelectedEntities().forEach(entity => {
                const moved = Geometry.moveEntity(entity, delta);
                CAD.updateEntity(entity.id, moved, true);
            });

            UI.log(`${state.selectedIds.length} objects moved.`);
            state.clearSelection();
            this.finishCommand();
        }
    },

    handleCopyClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('COPY: Specify second point or <use first point as displacement>:', 'prompt');
        } else if (state.step === 2) {
            const delta = {
                x: state.points[1].x - state.points[0].x,
                y: state.points[1].y - state.points[0].y
            };

            CAD.saveUndoState('Copy');
            state.getSelectedEntities().forEach(entity => {
                const copied = Geometry.moveEntity(entity, delta);
                delete copied.id;
                CAD.addEntity(copied, true);
            });

            UI.log(`${state.selectedIds.length} objects copied.`);
            state.points = [state.points[1]]; // Allow multiple copies
            state.step = 1;
            UI.log('COPY: Specify second point or [Exit]:', 'prompt');
        }
    },

    handleRotateClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('ROTATE: Specify rotation angle or [Reference]:', 'prompt');
        } else if (state.step === 2) {
            const angle = Utils.angle(state.points[0], state.points[1]);

            CAD.saveUndoState('Rotate');
            state.getSelectedEntities().forEach(entity => {
                const rotated = Geometry.rotateEntity(entity, state.points[0], angle);
                CAD.updateEntity(entity.id, rotated, true);
            });

            UI.log(`${state.selectedIds.length} objects rotated ${Utils.radToDeg(angle).toFixed(2)}°`);
            state.clearSelection();
            this.finishCommand();
        }
    },

    handleScaleClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log(`SCALE: Specify scale factor or [Copy/Reference] <${CAD.lastScaleFactor}>:`, 'prompt');
        } else if (state.step === 2) {
            // Visual scaling by second point (scale factor from distance)
            if (state.cmdOptions.scaleMode === 'reference') {
                UI.log('SCALE: Specify second reference point:', 'prompt');
            } else {
                // Direct visual scale - calculate from first to second point
                const scale = Utils.dist(state.points[0], point);
                this.applyScale(state.points[0], scale, state.cmdOptions.scaleCopy);
            }
        } else if (state.step === 3) {
            // Reference mode - have first two reference points
            if (state.cmdOptions.scaleMode === 'reference') {
                UI.log('SCALE: Specify new length or [Points]:', 'prompt');
            }
        } else if (state.step === 4) {
            // Reference mode with new length from points
            const refDist = Utils.dist(state.points[1], state.points[2]);
            const newDist = Utils.dist(state.points[1], point);
            if (refDist > 0) {
                const scale = newDist / refDist;
                this.applyScale(state.points[0], scale, state.cmdOptions.scaleCopy);
            }
        }
    },

    applyScale(basePoint, scaleFactor, makeCopy = false) {
        const state = CAD;
        CAD.saveUndoState('Scale');
        state.lastScaleFactor = scaleFactor;

        if (makeCopy) {
            // Create scaled copies
            state.getSelectedEntities().forEach(entity => {
                const scaled = Geometry.scaleEntity(entity, basePoint, scaleFactor);
                delete scaled.id;
                CAD.addEntity(scaled, true);
            });
            UI.log(`${state.selectedIds.length} objects scaled (copy) by factor ${scaleFactor.toFixed(4)}`);
        } else {
            // Scale in place
            state.getSelectedEntities().forEach(entity => {
                const scaled = Geometry.scaleEntity(entity, basePoint, scaleFactor);
                CAD.updateEntity(entity.id, scaled, true);
            });
            UI.log(`${state.selectedIds.length} objects scaled by factor ${scaleFactor.toFixed(4)}`);
        }

        state.clearSelection();
        this.finishCommand();
    },

    handleMirrorClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('MIRROR: Specify second point of mirror line:', 'prompt');
        } else if (state.step === 2) {
            CAD.saveUndoState('Mirror');

            state.getSelectedEntities().forEach(entity => {
                const mirrored = Geometry.mirrorEntity(entity, state.points[0], state.points[1]);
                delete mirrored.id;
                CAD.addEntity(mirrored, true);
            });

            UI.log(`${state.selectedIds.length} objects mirrored.`);

            // Ask to delete source objects
            const deleteSource = confirm('Delete source objects?');
            if (deleteSource) {
                CAD.removeEntities(state.selectedIds, true);
            }

            state.clearSelection();
            this.finishCommand();
        }
    },

    handleStretchClick(point) {
        const state = CAD;
        const mode = state.cmdOptions.stretchMode;

        if (mode === 'basePoint') {
            state.points.push(point);
            state.cmdOptions.stretchMode = 'displacement';
            UI.log('STRETCH: Specify second point or <use first point as displacement>:', 'prompt');
        } else if (mode === 'displacement') {
            const basePoint = state.points[0];
            const displacement = {
                x: point.x - basePoint.x,
                y: point.y - basePoint.y
            };

            CAD.saveUndoState('Stretch');

            // Get selected entities and stretch them
            const selectedEntities = state.getSelectedEntities();
            const stretchWindow = state.cmdOptions.stretchWindow;

            selectedEntities.forEach(entity => {
                const stretched = this.stretchEntity(entity, displacement, stretchWindow);
                if (stretched) {
                    CAD.updateEntity(entity.id, stretched, true);
                }
            });

            UI.log(`${state.selectedIds.length} objects stretched.`);
            state.clearSelection();
            this.finishCommand();
        }
    },

    stretchEntity(entity, displacement, window) {
        // Helper function to check if a point is in the stretch window
        const inWindow = (p) => {
            if (!window) return true;
            return p.x >= window.minX && p.x <= window.maxX &&
                   p.y >= window.minY && p.y <= window.maxY;
        };

        // Helper to move point if in window
        const stretchPoint = (p) => {
            if (inWindow(p)) {
                return { x: p.x + displacement.x, y: p.y + displacement.y };
            }
            return { ...p };
        };

        switch (entity.type) {
            case 'line':
                return {
                    ...entity,
                    p1: stretchPoint(entity.p1),
                    p2: stretchPoint(entity.p2)
                };

            case 'circle':
                // Circles move if center is in window
                if (inWindow(entity.center)) {
                    return {
                        ...entity,
                        center: stretchPoint(entity.center)
                    };
                }
                return entity;

            case 'arc':
                // Arcs move if center is in window
                if (inWindow(entity.center)) {
                    return {
                        ...entity,
                        center: stretchPoint(entity.center)
                    };
                }
                return entity;

            case 'rect':
                return {
                    ...entity,
                    p1: stretchPoint(entity.p1),
                    p2: stretchPoint(entity.p2)
                };

            case 'polyline':
                return {
                    ...entity,
                    points: entity.points.map(p => stretchPoint(p))
                };

            case 'ellipse':
                if (inWindow(entity.center)) {
                    return {
                        ...entity,
                        center: stretchPoint(entity.center)
                    };
                }
                return entity;

            case 'text':
                if (inWindow(entity.position)) {
                    return {
                        ...entity,
                        position: stretchPoint(entity.position)
                    };
                }
                return entity;

            default:
                return entity;
        }
    },

    handleOffsetClick(point) {
        const state = CAD;

        if (state.step === 0) {
            // Step 0: Waiting for distance - user can pick first point for two-point distance
            if (state.cmdOptions.offsetMode === 'picking') {
                // Second point picked - calculate distance
                const firstPoint = state.points[0];
                const distance = Utils.dist(firstPoint, point);
                CAD.offsetDist = distance;
                state.points = [];
                state.step = 1;
                UI.log(`Offset distance: ${distance.toFixed(4)}`);
                UI.log('OFFSET: Select object to offset:', 'prompt');
            } else {
                // First click - start two-point distance picking
                state.points = [point];
                state.cmdOptions.offsetMode = 'picking';
                UI.log(`First point: ${point.x.toFixed(4)}, ${point.y.toFixed(4)}`);
                UI.log('OFFSET: Specify second point:', 'prompt');
            }
            return;
        }

        if (state.step === 1) {
            // Select object to offset
            const hit = this.hitTest(point);
            if (hit) {
                state.targetId = hit.id;
                state.step = 2;
                UI.log('OFFSET: Specify point on side to offset:', 'prompt');
            } else {
                UI.log('No object found.', 'error');
            }
        } else if (state.step === 2) {
            // Perform offset
            this.performOffset(state.targetId, point);
            state.step = 1;
            state.targetId = null;
            UI.log('OFFSET: Select object to offset or [Exit]:', 'prompt');
        }
    },

    handleImageAttachClick(point) {
        const state = CAD;
        const imageData = state.cmdOptions.imageData;

        if (!imageData) {
            UI.log('IMAGEATTACH: No image loaded.', 'error');
            return;
        }

        if (state.step === 0) {
            state.cmdOptions.imageInsert = point;
            state.step = 1;
            UI.log(`IMAGEATTACH: Specify scale factor or corner <${CAD.imageAttachScale}>:`, 'prompt');
            return;
        }

        if (state.step === 1) {
            const scale = this.getImageScaleFromCorner(state.cmdOptions.imageInsert, point);
            state.cmdOptions.imageScale = scale;
            CAD.imageAttachScale = scale;
            state.step = 2;
            UI.log(`IMAGEATTACH: Specify rotation angle <${CAD.imageAttachRotation}>:`, 'prompt');
            return;
        }

        if (state.step === 2) {
            const angle = Utils.radToDeg(Utils.angle(state.cmdOptions.imageInsert, point));
            state.cmdOptions.imageRotation = angle;
            CAD.imageAttachRotation = angle;
            this.createImageEntity(state.cmdOptions.imageInsert, state.cmdOptions.imageScale, angle);
        }
    },

    handleTrimClick(point) {
        const state = CAD;

        if (state.cmdOptions.selectingEdges) {
            // Use all entities as cutting edges (CAD behavior when Enter is pressed without selection)
            return;
        }

        const hit = this.hitTest(point);
        if (hit) {
            const allEntities = CAD.getVisibleEntities().filter(e => e.id !== hit.id);
            const result = Geometry.trimLine(hit, point, allEntities);

            if (result && result.length > 0) {
                CAD.saveUndoState('Trim');
                CAD.removeEntity(hit.id, true);
                result.forEach(e => CAD.addEntity(e, true));
                UI.log('Object trimmed. Select next object to trim or [Exit]:');
            } else {
                UI.log('Cannot trim this object at this location.', 'error');
            }
        } else {
            UI.log('No object found to trim.', 'error');
        }
    },

    handleExtendClick(point) {
        const state = CAD;

        if (state.cmdOptions.selectingEdges) {
            // Use all entities as boundary edges (CAD behavior when Enter is pressed without selection)
            return;
        }

        const hit = this.hitTest(point);
        if (hit && hit.type === 'line') {
            const allEntities = CAD.getVisibleEntities().filter(e => e.id !== hit.id);
            const result = Geometry.extendLine(hit, point, allEntities);

            if (result) {
                CAD.saveUndoState('Extend');
                CAD.updateEntity(hit.id, result, true);
                UI.log('Object extended. Select next object to extend or [Exit]:');
                Renderer.draw();
            } else {
                UI.log('Cannot extend to any boundary.', 'error');
            }
        } else if (hit && hit.type === 'arc') {
            const allEntities = CAD.getVisibleEntities().filter(e => e.id !== hit.id);
            const result = Geometry.extendArc(hit, point, allEntities);

            if (result) {
                CAD.saveUndoState('Extend');
                CAD.updateEntity(hit.id, result, true);
                UI.log('Arc extended. Select next object to extend or [Exit]:');
                Renderer.draw();
            } else {
                UI.log('Cannot extend arc to any boundary.', 'error');
            }
        } else if (hit) {
            UI.log('Only lines and arcs can be extended.', 'error');
        } else {
            UI.log('No object found to extend.', 'error');
        }
    },

    handleHatchClick(point) {
        const targets = this.findHatchTargets(point);

        // Multiple overlapping closed entities -> compute intersection
        if (targets.length > 1) {
            let intersectionPoly = this.getHatchBoundaryPoints(targets[0]);
            for (let i = 1; i < targets.length; i++) {
                const otherPoly = this.getHatchBoundaryPoints(targets[i]);
                const clipped = Geometry.clipPolygon(intersectionPoly, otherPoly);
                if (clipped && clipped.length >= 3) {
                    intersectionPoly = clipped;
                }
                // If clipping fails, keep the last good polygon
            }
            if (intersectionPoly && intersectionPoly.length >= 3) {
                CAD.saveUndoState('Hatch');
                const hatchEntity = this.createHatchEntity(
                    intersectionPoly,
                    targets.map(entity => entity.id)
                );
                CAD.addEntity(hatchEntity);
                UI.log('Hatch applied to intersection.');
                this.finishCommand();
                return;
            }
        }

        // Single closed entity containing the point
        if (targets.length === 1) {
            this.applyHatch(targets[0]);
            this.finishCommand();
            return;
        }

        // Direct hit test on a specific entity (clicking on its boundary)
        const hit = this.hitTest(point);
        if (hit) {
            if (this.entitySupportsHatch(hit)) {
                this.applyHatch(hit);
            } else {
                UI.log('Object is not closed. Cannot hatch.', 'error');
            }
            this.finishCommand();
            return;
        }

        // Last resort: try to find a closed loop from intersecting line/polyline segments
        const loop = this.findLineLoopContainingPoint(point);
        if (loop) {
            CAD.saveUndoState('Hatch');
            const boundary = CAD.addEntity({
                type: 'polyline',
                points: loop,
                hatch: { pattern: CAD.hatchPattern },
                noStroke: true
            });
            const hatchEntity = this.createHatchEntity(loop, [boundary.id]);
            CAD.addEntity(hatchEntity);
            UI.log('Hatch applied from boundary.');
        } else {
            UI.log('No closed boundary found at that point.', 'error');
        }

        this.finishCommand();
    },

    getHatchPatternOptions() {
        const underline = (text, shortcut) => {
            const index = text.toLowerCase().indexOf(shortcut);
            if (index === -1) return text;
            return `${text.slice(0, index)}${text[index]}\u0332${text.slice(index + 1)}`;
        };
        return [
            underline('solid', 's'),
            underline('diagonal', 'd'),
            underline('cross', 'c'),
            underline('dots', 'o'),
            underline('angle', 'a'),
            'ANSI31', 'ANSI32', 'ANSI33', 'ANSI34',
            'ANSI35', 'ANSI36', 'ANSI37', 'ANSI38',
            'brick', 'honey', 'earth', 'grass',
            'steel', 'insul', 'net', 'net3', 'dash',
            'square', 'zigzag',
            'ar-b816', 'ar-brstd', 'ar-b88', 'ar-brelm', 'ar-conc', 'ar-hbone',
            'ar-parq1', 'ar-rroof', 'ar-rshke', 'ar-sand',
            'brass', 'clay', 'cork', 'flex', 'gravel', 'hex', 'sacncr',
            'trans', 'dolmit', 'plast', 'line', 'triang'
        ].join('/');
    },

    hatchPatterns: [
        'solid', 'diagonal', 'cross', 'dots', 'angle',
        'ansi31', 'ansi32', 'ansi33', 'ansi34', 'ansi35', 'ansi36', 'ansi37', 'ansi38',
        'brick', 'earth', 'grass', 'honey',
        'steel', 'insul', 'net', 'net3',
        'dash', 'square', 'zigzag',
        'ar-b816', 'ar-brstd', 'ar-b88', 'ar-brelm', 'ar-conc', 'ar-hbone',
        'ar-parq1', 'ar-rroof', 'ar-rshke', 'ar-sand',
        'brass', 'clay', 'cork', 'flex', 'gravel', 'hex', 'sacncr',
        'trans', 'dolmit', 'plast', 'line', 'triang'
    ],

    hatchPatternAliases: {
        angle: 'ansi31',
        diagonal: 'ansi31',
        cross: 'ansi37',
        dots: 'dots',
        brick: 'brick',
        honey: 'honey',
        earth: 'earth',
        grass: 'grass',
        steel: 'steel',
        insul: 'insul',
        net: 'net',
        dash: 'dash',
        square: 'square',
        zigzag: 'zigzag'
    },

    setHatchPattern(pattern) {
        const raw = pattern.toLowerCase();
        const normalized = this.hatchPatternAliases[raw] || raw;
        if (!this.hatchPatterns.includes(normalized)) {
            UI.log(`HATCH: Unsupported pattern "${pattern}". Use LIST to see options.`, 'error');
            return false;
        }
        CAD.hatchPattern = normalized;
        UI.log(`HATCH: Pattern set to ${CAD.hatchPattern.toUpperCase()}.`, 'prompt');
        return true;
    },

    entitySupportsHatch(entity) {
        if (entity.type === 'circle' || entity.type === 'rect' || entity.type === 'ellipse') {
            return true;
        }
        return entity.type === 'polyline' && Utils.isPolygonClosed(entity.points);
    },

    applyHatch(entity) {
        CAD.saveUndoState('Hatch');
        const boundary = this.getHatchBoundaryPoints(entity);
        const hatchEntity = this.createHatchEntity(boundary, [entity.id], entity);
        CAD.addEntity(hatchEntity);
        UI.log('Hatch applied.');
        Renderer.draw();
    },

    applyHatchToSelection() {
        const selected = CAD.getSelectedEntities();
        const targets = selected.filter(entity => this.entitySupportsHatch(entity));
        if (targets.length === 0) {
            UI.log('HATCH: No closed objects selected.', 'error');
            return;
        }
        CAD.saveUndoState('Hatch');
        targets.forEach(entity => {
            const boundary = this.getHatchBoundaryPoints(entity);
            const hatchEntity = this.createHatchEntity(boundary, [entity.id], entity);
            CAD.addEntity(hatchEntity, true);
        });
        UI.log(`HATCH: Applied to ${targets.length} object(s).`, 'success');
        Renderer.draw();
    },

    getHatchBoundaryPoints(entity) {
        if (!entity) return [];
        // For spline polylines, generate smooth interpolated boundary points
        if (entity.type === 'polyline' && entity.isSpline && entity.points && entity.points.length >= 2) {
            return Geometry.getSplineBoundaryPoints(entity.points, entity.closed);
        }
        // For polylines with bulges, generate arc-interpolated boundary points
        if (entity.type === 'polyline' && entity.bulges && entity.bulges.length > 0 && entity.points) {
            return this._getPolylineWithArcsBoundaryPoints(entity);
        }
        if (entity.points && entity.points.length) return entity.points;
        if (entity.type === 'rect') {
            const x1 = entity.p1.x;
            const y1 = entity.p1.y;
            const x2 = entity.p2.x;
            const y2 = entity.p2.y;
            return [
                { x: x1, y: y1 },
                { x: x2, y: y1 },
                { x: x2, y: y2 },
                { x: x1, y: y2 }
            ];
        }
        if (entity.type === 'circle') {
            const points = [];
            const steps = 36;
            for (let i = 0; i < steps; i++) {
                const angle = (Math.PI * 2 * i) / steps;
                points.push({
                    x: entity.center.x + Math.cos(angle) * entity.r,
                    y: entity.center.y + Math.sin(angle) * entity.r
                });
            }
            return points;
        }
        if (entity.type === 'ellipse') {
            const points = [];
            const steps = 36;
            for (let i = 0; i < steps; i++) {
                const angle = (Math.PI * 2 * i) / steps;
                points.push({
                    x: entity.center.x + Math.cos(angle) * entity.rx,
                    y: entity.center.y + Math.sin(angle) * entity.ry
                });
            }
            return points;
        }
        return [];
    },

    _getPolylineWithArcsBoundaryPoints(entity) {
        const points = entity.points || [];
        const bulges = entity.bulges || [];
        const result = [];
        const numPoints = entity.closed ? points.length : points.length - 1;
        for (let i = 0; i < numPoints; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const bulge = bulges[i] || 0;
            result.push({ ...p1 });
            if (Math.abs(bulge) > 1e-10) {
                // Generate arc points between p1 and p2
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 1e-10) continue;
                const r = d * (1 + bulge * bulge) / (4 * Math.abs(bulge));
                const nx = -dy / d;
                const ny = dx / d;
                const h = d * (1 - bulge * bulge) / (4 * bulge);
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const cx = midX + h * nx;
                const cy = midY + h * ny;
                const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
                const endAngle = Math.atan2(p2.y - cy, p2.x - cx);
                const ccw = bulge > 0;
                let sweep = endAngle - startAngle;
                if (ccw && sweep < 0) sweep += Math.PI * 2;
                if (!ccw && sweep > 0) sweep -= Math.PI * 2;
                const steps = Math.max(8, Math.ceil(Math.abs(sweep * r) / 2));
                for (let j = 1; j < steps; j++) {
                    const t = j / steps;
                    const angle = startAngle + sweep * t;
                    result.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
                }
            }
        }
        if (!entity.closed && points.length > 0) {
            result.push({ ...points[points.length - 1] });
        }
        return result;
    },

    createHatchEntity(boundaryPoints, clipIds = [], sourceEntity = null) {
        const pattern = (CAD.hatchPattern || 'ansi31').toLowerCase();
        const userScale = CAD.hatchScale || 1;
        const userAngle = CAD.hatchAngle || 0;

        // Auto-compute a base scale factor so patterns look good at any geometry size
        let autoScale = 1;
        if (boundaryPoints && boundaryPoints.length >= 2) {
            const bbox = Geometry.Hatch.getPointsBoundingBox(boundaryPoints);
            const extent = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
            autoScale = Math.max(extent / 60, 0.1);
        }
        const effectiveScale = autoScale * userScale;

        // Generate render lines for non-solid patterns
        let renderLines = [];
        if (pattern !== 'solid') {
            const hatch = new Geometry.Hatch(boundaryPoints, pattern, effectiveScale, userAngle);
            renderLines = hatch.generateRenderLines();
        }

        const result = {
            type: 'hatch',
            hatch: { pattern },
            boundary: boundaryPoints,
            patternName: pattern,
            scale: effectiveScale,
            angle: userAngle,
            renderLines,
            clipIds
        };

        // Store source entity geometry info for accurate clip path rendering
        if (sourceEntity) {
            if (sourceEntity.type === 'polyline' && sourceEntity.bulges && sourceEntity.bulges.length > 0) {
                result.sourcePoints = [...sourceEntity.points];
                result.sourceBulges = [...sourceEntity.bulges];
                result.sourceClosed = sourceEntity.closed || false;
            } else if (sourceEntity.type === 'polyline' && sourceEntity.isSpline) {
                result.sourceIsSpline = true;
                result.sourcePoints = [...sourceEntity.points];
                result.sourceClosed = sourceEntity.closed || false;
            } else if (sourceEntity.type === 'circle') {
                result.sourceCircle = { center: { ...sourceEntity.center }, r: sourceEntity.r };
            } else if (sourceEntity.type === 'ellipse') {
                result.sourceEllipse = { center: { ...sourceEntity.center }, rx: sourceEntity.rx, ry: sourceEntity.ry, rotation: sourceEntity.rotation || 0 };
            }
        }

        return result;
    },

    findHatchTargets(point) {
        const targets = [];
        const entities = CAD.getVisibleEntities();
        for (const entity of entities) {
            if (!this.entitySupportsHatch(entity)) {
                continue;
            }
            if (this.pointInsideEntity(point, entity)) {
                targets.push(entity);
            }
        }
        if (targets.length > 1) {
            targets.sort((a, b) => this.getEntityArea(a) - this.getEntityArea(b));
        }
        return targets;
    },

    getEntityArea(entity) {
        switch (entity.type) {
            case 'circle':
                return Math.PI * entity.r * entity.r;
            case 'ellipse':
                return Math.PI * entity.rx * entity.ry;
            case 'rect':
                return Math.abs((entity.p2.x - entity.p1.x) * (entity.p2.y - entity.p1.y));
            case 'polyline':
                return Math.abs(Utils.polygonArea(entity.points));
            default:
                return Infinity;
        }
    },

    pointInsideEntity(point, entity) {
        switch (entity.type) {
            case 'circle':
                return Utils.dist(point, entity.center) <= entity.r;
            case 'ellipse':
                return Utils.pointInEllipse(point, entity);
            case 'rect':
                return Utils.pointInRect(point, entity.p1, entity.p2);
            case 'polyline': {
                let testPoints;
                if (entity.isSpline && entity.points.length >= 2) {
                    testPoints = Geometry.getSplineBoundaryPoints(entity.points, entity.closed);
                } else if (entity.bulges && entity.bulges.length > 0) {
                    testPoints = this._getPolylineWithArcsBoundaryPoints(entity);
                } else {
                    testPoints = Utils.isPolygonClosed(entity.points)
                        ? entity.points
                        : [...entity.points, entity.points[0]];
                }
                return Utils.pointInPolygon(point, testPoints);
            }
            default:
                return false;
        }
    },

    findLineLoopContainingPoint(point) {
        const segments = [];
        const entities = CAD.getVisibleEntities();

        entities.forEach(entity => {
            if (entity.type === 'line') {
                segments.push({ p1: entity.p1, p2: entity.p2 });
            } else if (entity.type === 'polyline' && entity.points.length > 1) {
                if (entity.isSpline) {
                    // Interpolate spline to segments
                    const pts = Geometry.getSplineBoundaryPoints(entity.points, entity.closed);
                    for (let i = 0; i < pts.length - 1; i++) {
                        segments.push({ p1: pts[i], p2: pts[i + 1] });
                    }
                    if (entity.closed && pts.length > 1) {
                        segments.push({ p1: pts[pts.length - 1], p2: pts[0] });
                    }
                } else if (entity.bulges && entity.bulges.length > 0) {
                    // Interpolate arcs to segments
                    const pts = this._getPolylineWithArcsBoundaryPoints(entity);
                    for (let i = 0; i < pts.length - 1; i++) {
                        segments.push({ p1: pts[i], p2: pts[i + 1] });
                    }
                    if (entity.closed && pts.length > 1) {
                        segments.push({ p1: pts[pts.length - 1], p2: pts[0] });
                    }
                } else {
                    for (let i = 0; i < entity.points.length - 1; i++) {
                        segments.push({ p1: entity.points[i], p2: entity.points[i + 1] });
                    }
                    if (entity.closed || Utils.isPolygonClosed(entity.points)) {
                        segments.push({ p1: entity.points[entity.points.length - 1], p2: entity.points[0] });
                    }
                }
            } else if (entity.type === 'circle') {
                // Convert circle to segments
                const steps = 36;
                for (let i = 0; i < steps; i++) {
                    const a1 = (Math.PI * 2 * i) / steps;
                    const a2 = (Math.PI * 2 * ((i + 1) % steps)) / steps;
                    segments.push({
                        p1: { x: entity.center.x + Math.cos(a1) * entity.r, y: entity.center.y + Math.sin(a1) * entity.r },
                        p2: { x: entity.center.x + Math.cos(a2) * entity.r, y: entity.center.y + Math.sin(a2) * entity.r }
                    });
                }
            } else if (entity.type === 'rect') {
                const x1 = entity.p1.x, y1 = entity.p1.y, x2 = entity.p2.x, y2 = entity.p2.y;
                const corners = [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }];
                for (let i = 0; i < 4; i++) {
                    segments.push({ p1: corners[i], p2: corners[(i + 1) % 4] });
                }
            } else if (entity.type === 'ellipse') {
                const steps = 36;
                for (let i = 0; i < steps; i++) {
                    const a1 = (Math.PI * 2 * i) / steps;
                    const a2 = (Math.PI * 2 * ((i + 1) % steps)) / steps;
                    segments.push({
                        p1: { x: entity.center.x + Math.cos(a1) * entity.rx, y: entity.center.y + Math.sin(a1) * entity.ry },
                        p2: { x: entity.center.x + Math.cos(a2) * entity.rx, y: entity.center.y + Math.sin(a2) * entity.ry }
                    });
                }
            } else if (entity.type === 'arc') {
                const steps = Math.max(8, Math.ceil(Math.abs((entity.end || 0) - (entity.start || 0)) * entity.r / 2));
                const start = entity.start || 0;
                const end = entity.end || 0;
                for (let i = 0; i < steps; i++) {
                    const a1 = start + (end - start) * i / steps;
                    const a2 = start + (end - start) * (i + 1) / steps;
                    segments.push({
                        p1: { x: entity.center.x + Math.cos(a1) * entity.r, y: entity.center.y + Math.sin(a1) * entity.r },
                        p2: { x: entity.center.x + Math.cos(a2) * entity.r, y: entity.center.y + Math.sin(a2) * entity.r }
                    });
                }
            }
        });

        if (segments.length === 0) {
            return null;
        }

        const loops = this.buildLineLoops(segments);
        for (const loop of loops) {
            if (Utils.pointInPolygon(point, loop)) {
                return loop;
            }
        }

        return null;
    },

    handleXClipClick(point) {
        const state = CAD;
        const mode = state.cmdOptions.xclipMode;

        if (mode === 'options') {
            // User clicked on an entity - use as target
            const hit = this.hitTest(point);
            if (hit && hit.type === 'insert') {
                state.cmdOptions.xclipTarget = hit;
                UI.log('XCLIP: [ON/OFF/Delete/New boundary] <New>:', 'prompt');
            }
            return;
        }

        if (mode === 'rect1') {
            // First corner of rectangular clip boundary
            state.points.push(point);
            state.cmdOptions.xclipMode = 'rect2';
            UI.log('XCLIP: Specify opposite corner:', 'prompt');
            return;
        }

        if (mode === 'rect2') {
            // Second corner of rectangular clip boundary
            const p1 = state.points[0];
            const p2 = point;
            const clipBoundary = [
                { x: p1.x, y: p1.y },
                { x: p2.x, y: p1.y },
                { x: p2.x, y: p2.y },
                { x: p1.x, y: p2.y }
            ];
            this.applyXClip(state.cmdOptions.xclipTarget, clipBoundary);
            return;
        }

        if (mode === 'poly') {
            // Polygonal clip boundary - accumulate points
            state.points.push(point);
            state.step++;
            UI.log(`XCLIP: Specify next point or [Enter to finish]:`, 'prompt');
            return;
        }
    },

    applyXClip(target, clipBoundary) {
        if (!target || !clipBoundary || clipBoundary.length < 3) {
            UI.log('XCLIP: Invalid clip boundary.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('XCLIP');
        target.xclip = {
            enabled: true,
            boundary: clipBoundary
        };
        CAD.modified = true;
        UI.log('XCLIP: Clip boundary applied.');
        this.finishCommand();
        Renderer.draw();
    },

    buildLineLoops(segments) {
        const tolerance = 0.001;
        const keyFor = (p) => `${Math.round(p.x / tolerance)}:${Math.round(p.y / tolerance)}`;
        const pointForKey = new Map();
        const adjacency = new Map();

        const addAdjacency = (key, segmentIndex) => {
            if (!adjacency.has(key)) {
                adjacency.set(key, []);
            }
            adjacency.get(key).push(segmentIndex);
        };

        segments.forEach((segment, index) => {
            const key1 = keyFor(segment.p1);
            const key2 = keyFor(segment.p2);
            if (!pointForKey.has(key1)) pointForKey.set(key1, segment.p1);
            if (!pointForKey.has(key2)) pointForKey.set(key2, segment.p2);
            addAdjacency(key1, index);
            addAdjacency(key2, index);
        });

        const used = new Set();
        const loops = [];

        const followLoop = (startIndex) => {
            const startSeg = segments[startIndex];
            const startKey = keyFor(startSeg.p1);
            const nextKey = keyFor(startSeg.p2);
            const loop = [pointForKey.get(startKey)];
            let currentKey = nextKey;
            let prevKey = startKey;

            used.add(startIndex);
            loop.push(pointForKey.get(currentKey));

            let guard = 0;
            while (currentKey !== startKey && guard < segments.length + 5) {
                guard += 1;
                const options = (adjacency.get(currentKey) || []).filter(idx => !used.has(idx));
                if (options.length === 0) {
                    return null;
                }

                let nextIndex = options[0];
                if (options.length > 1) {
                    nextIndex = options.find(idx => {
                        const seg = segments[idx];
                        const keyA = keyFor(seg.p1);
                        const keyB = keyFor(seg.p2);
                        return keyA !== prevKey && keyB !== prevKey;
                    }) ?? options[0];
                }

                used.add(nextIndex);
                const seg = segments[nextIndex];
                const keyA = keyFor(seg.p1);
                const keyB = keyFor(seg.p2);
                const nextKeyCandidate = keyA === currentKey ? keyB : keyA;

                prevKey = currentKey;
                currentKey = nextKeyCandidate;
                loop.push(pointForKey.get(currentKey));
            }

            if (currentKey === startKey && loop.length >= 4) {
                return loop;
            }

            return null;
        };

        segments.forEach((segment, index) => {
            if (used.has(index)) return;
            const loop = followLoop(index);
            if (loop) {
                loops.push(loop);
            }
        });

        return loops;
    },

    handleDistanceClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('DIST: Specify second point:', 'prompt');
        } else if (state.step === 2) {
            const d = Utils.dist(state.points[0], state.points[1]);
            const angle = Utils.angleDeg(state.points[0], state.points[1]);
            const dx = state.points[1].x - state.points[0].x;
            const dy = state.points[1].y - state.points[0].y;

            UI.log(`Distance = ${d.toFixed(4)}, Angle = ${angle.toFixed(2)}°`);
            UI.log(`Delta X = ${dx.toFixed(4)}, Delta Y = ${dy.toFixed(4)}`);
            this.finishCommand();
        }
    },

    handleAreaClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        UI.log(`AREA: Point ${state.step}, specify next point or [Enter to calculate]:`, 'prompt');
    },

    // ==========================================
    // SELECTION HANDLING
    // ==========================================

    // Selection click with cycling is defined in QUICK-WIN section
    _oldHandleSelectionClick(point) {
        // Replaced by handleSelectionClick with selection cycling support
        this.handleSelectionClick(point);
    },

    finishSelection(endPoint) {
        const state = CAD;
        const start = state.selectStart;

        const box = {
            x: Math.min(start.x, endPoint.x),
            y: Math.min(start.y, endPoint.y),
            w: Math.abs(endPoint.x - start.x),
            h: Math.abs(endPoint.y - start.y)
        };

        // Check for forced window mode from canvas toolbar
        let isCrossing;
        if (state.cmdOptions.forceWindowMode === 'window') {
            isCrossing = false;
            state.cmdOptions.forceWindowMode = null;
        } else if (state.cmdOptions.forceWindowMode === 'crossing') {
            isCrossing = true;
            state.cmdOptions.forceWindowMode = null;
        } else {
            isCrossing = endPoint.x < start.x;
        }

        // Don't clear existing selection - add to it
        const existingSelection = state.cmdOptions.needSelection ? [...state.selectedIds] : [];
        const newSelection = [];

        CAD.getVisibleEntities().forEach(entity => {
            const ext = CAD.getEntityExtents(entity);
            if (!ext) return;

            if (isCrossing) {
                // Crossing selection - any intersection
                if (ext.minX < box.x + box.w && ext.maxX > box.x &&
                    ext.minY < box.y + box.h && ext.maxY > box.y) {
                    newSelection.push(entity.id);
                }
            } else {
                // Window selection - fully inside
                if (ext.minX >= box.x && ext.maxX <= box.x + box.w &&
                    ext.minY >= box.y && ext.maxY <= box.y + box.h) {
                    newSelection.push(entity.id);
                }
            }
        });

        // Merge with existing selection (remove duplicates)
        if (state.cmdOptions.needSelection) {
            const combinedSet = new Set([...existingSelection, ...newSelection]);
            state.selectedIds = Array.from(combinedSet);
            UI.log(`${newSelection.length} found, ${state.selectedIds.length} total.`);
        } else {
            state.selectedIds = newSelection;
            UI.log(`${state.selectedIds.length} found.`);
        }

        state.selectionMode = false;
        state.selectStart = null;

        // Update canvas selection toolbar info
        UI.updateCanvasSelectionInfo();

        // Don't auto-continue if needSelection - wait for user confirmation
        // This allows user to keep adding to selection
    },

    continueCommand(name) {
        switch (name) {
            case 'move':
                UI.log('MOVE: Specify base point:', 'prompt');
                break;
            case 'copy':
                UI.log('COPY: Specify base point:', 'prompt');
                break;
            case 'rotate':
                UI.log('ROTATE: Specify base point:', 'prompt');
                break;
            case 'scale':
                UI.log('SCALE: Specify base point:', 'prompt');
                break;
            case 'mirror':
                UI.log('MIRROR: Specify first point of mirror line:', 'prompt');
                break;
            case 'stretch':
                CAD.cmdOptions.stretchMode = 'basePoint';
                UI.log('STRETCH: Specify base point:', 'prompt');
                break;

            // Phase 2 commands
            case 'align':
                CAD.step = 0;
                UI.log('ALIGN: Specify first source point:', 'prompt');
                break;
            case 'scaletext':
                UI.log('SCALETEXT: Specify new height:', 'prompt');
                break;
            case 'justifytext':
                UI.log('JUSTIFYTEXT: Enter justification [Left/Center/Right] <Left>:', 'prompt');
                break;
            case 'qdim':
                CAD.cmdOptions.qdimReady = true;
                UI.log('QDIM: Specify dimension line position:', 'prompt');
                break;

            // Phase 3 commands
            case 'chprop':
                UI.log('CHPROP: Enter property to change [Color/LAyer/LType/LtScale/LWeight/Thickness]:', 'prompt');
                CAD.cmdOptions.chpropStep = 'property';
                break;
            case 'draworder':
                UI.log('DRAWORDER: Enter option [Above/Under/Front/Back]:', 'prompt');
                CAD.cmdOptions.draworderStep = 'option';
                break;
            case 'draworderfront':
                this.executeDrawOrder('front');
                break;
            case 'draworderback':
                this.executeDrawOrder('back');
                break;
            case 'draworderabove':
                UI.log('DRAWORDER: Select reference object:', 'prompt');
                CAD.cmdOptions.draworderStep = 'ref';
                break;
            case 'draworderbelow':
                UI.log('DRAWORDER: Select reference object:', 'prompt');
                CAD.cmdOptions.draworderStep = 'ref';
                break;
            case 'hideobjects':
                this.executeHideObjects();
                break;
            case 'isolateobjects':
                this.executeIsolateObjects();
                break;
            case 'group':
                UI.log('GROUP: Enter group name (or press Enter for auto-name):', 'prompt');
                CAD.cmdOptions.groupStep = 'name';
                break;
            case 'ungroup':
                this.executeUngroup();
                break;
            case 'arraypath':
                UI.log('ARRAYPATH: Select path curve:', 'prompt');
                CAD.cmdOptions.arraypathStep = 'path';
                break;
            case 'copybase':
                UI.log('COPYBASE: Specify base point:', 'prompt');
                CAD.cmdOptions.copybaseAction = true;
                break;
            case 'reverse':
                this.executeReverse();
                break;

            // New AutoCAD LT features
            case 'attedit':
                this.executeAttEdit();
                break;
            case 'mleadercollect':
                this.executeMLeaderCollect();
                break;
            case 'mleaderalign':
                this.executeMLeaderAlign();
                break;
            case 'imageclip': {
                const imgEnt = CAD.getEntity(CAD.selectedIds[0]);
                if (imgEnt && imgEnt.type === 'image') {
                    CAD.cmdOptions.clipTarget = imgEnt;
                    UI.log('IMAGECLIP: Enter clipping option [ON/OFF/Delete/New boundary]:', 'prompt');
                } else {
                    UI.log('IMAGECLIP: Selected entity is not an image.', 'error');
                    this.finishCommand();
                }
                break;
            }
        }
    },

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    getImageScaleFromCorner(insertPoint, cornerPoint) {
        const imageData = CAD.cmdOptions.imageData;
        if (!imageData || !insertPoint || !cornerPoint) return CAD.imageAttachScale || 1;

        const width = Math.abs(cornerPoint.x - insertPoint.x);
        const height = Math.abs(cornerPoint.y - insertPoint.y);
        const scaleX = width / imageData.width;
        const scaleY = height / imageData.height;
        const scale = Math.max(scaleX, scaleY);
        return scale > 0 ? scale : (CAD.imageAttachScale || 1);
    },

    createImageEntity(insertPoint, scaleFactor, rotationAngle) {
        if (!insertPoint || !scaleFactor) {
            this.finishCommand();
            return;
        }

        const imageData = CAD.cmdOptions.imageData;
        if (!imageData) {
            UI.log('IMAGEATTACH: No image loaded.', 'error');
            this.finishCommand();
            return;
        }

        const width = imageData.width * scaleFactor;
        const height = imageData.height * scaleFactor;
        const rotation = rotationAngle ?? CAD.imageAttachRotation ?? 0;

        CAD.addEntity({
            type: 'image',
            p1: { ...insertPoint },
            p2: { x: insertPoint.x + width, y: insertPoint.y + height },
            width,
            height,
            src: imageData.src,
            opacity: 0.6,
            scale: scaleFactor,
            rotation
        });
        UI.log('Image attached.');
        this.finishCommand();
        Renderer.draw();
    },

    hitTest(point) {
        // Pixel-based tolerance scaled by pickbox size
        const pxTolerance = Math.max(8, (CAD.pickboxSize || 3) * 3);
        const tolerance = pxTolerance / CAD.zoom;
        const entities = CAD.getVisibleEntities();

        for (let i = entities.length - 1; i >= 0; i--) {
            if (Geometry.hitTest(point, entities[i], tolerance)) {
                return entities[i];
            }
        }
        return null;
    },

    closeShape() {
        const state = CAD;

        if (state.activeCmd === 'polyline' && state.points.length >= 2) {
            const bulges = state.cmdOptions.polylineBulges || [];
            const hasBulges = bulges.some(b => b && Math.abs(b) > 1e-10);
            const entityData = {
                type: 'polyline',
                points: [...state.points],
                closed: true
            };
            if (hasBulges) {
                entityData.bulges = [...bulges];
            }
            CAD.addEntity(entityData);
            UI.log('Polyline closed.');
            this.finishCommand();
        } else if (state.activeCmd === 'spline' && state.points.length >= 2) {
            // Close spline: add closing segment back to first point
            state.points.push({ ...state.points[0] });
            CAD.addEntity({
                type: 'polyline',
                points: [...state.points],
                isSpline: true,
                closed: true
            });
            UI.log('Spline closed.');
            this.finishCommand();
            Renderer.draw();
        } else if (state.activeCmd === 'line' && state.lineChainStart && state.points.length >= 1) {
            CAD.addEntity({
                type: 'line',
                p1: { ...state.points[0] },
                p2: { ...state.lineChainStart }
            });
            UI.log('Line chain closed.');
            this.finishCommand();
        } else {
            UI.log('Cannot close. Need at least 2 points.', 'error');
        }
    },

    performOffset(entityId, clickPoint) {
        const entity = CAD.getEntity(entityId);
        if (!entity) return;

        let newData = null;

        switch (entity.type) {
            case 'line':
                const side = Geometry.getOffsetSide(entity.p1, entity.p2, clickPoint);
                const offsetLine = Geometry.offsetLine(entity.p1, entity.p2, CAD.offsetDist, side);
                if (offsetLine) {
                    newData = { type: 'line', ...offsetLine };
                }
                break;

            case 'circle':
                const offsetCircle = Geometry.offsetCircle(entity.center, entity.r, CAD.offsetDist, clickPoint);
                if (offsetCircle) {
                    newData = { type: 'circle', ...offsetCircle };
                }
                break;

            case 'rect':
                if (CAD.offsetGapType === 0) {
                    const offsetRect = Geometry.offsetRect(entity.p1, entity.p2, CAD.offsetDist, clickPoint);
                    if (offsetRect) {
                        newData = { type: 'rect', ...offsetRect };
                    }
                } else {
                    const rectPoints = [
                        { x: entity.p1.x, y: entity.p1.y },
                        { x: entity.p2.x, y: entity.p1.y },
                        { x: entity.p2.x, y: entity.p2.y },
                        { x: entity.p1.x, y: entity.p2.y },
                        { x: entity.p1.x, y: entity.p1.y }
                    ];
                    const offsetPoly = Geometry.offsetPolyline({ points: rectPoints }, CAD.offsetDist, clickPoint);
                    if (offsetPoly) {
                        newData = { type: 'polyline', ...offsetPoly };
                    }
                }
                break;

            case 'polyline':
                const offsetPoly = Geometry.offsetPolyline(entity, CAD.offsetDist, clickPoint);
                if (offsetPoly) {
                    newData = { type: 'polyline', ...offsetPoly };
                }
                break;
        }

        if (newData) {
            CAD.addEntity(newData);
            UI.log('Object offset.');
        } else {
            UI.log('Could not offset object.', 'error');
        }
    },

    deleteSelected() {
        if (CAD.selectedIds.length === 0) {
            UI.log('No objects selected.', 'error');
            return;
        }

        CAD.removeEntities(CAD.selectedIds);
        UI.log(`${CAD.selectedIds.length} objects erased.`);
        CAD.clearSelection();
        this.finishCommand();
        Renderer.draw();
    },

    explodeSelected() {
        const state = CAD;
        let explodedCount = 0;

        CAD.saveUndoState('Explode');

        state.getSelectedEntities().forEach(entity => {
            if (entity.type === 'rect') {
                // Explode rectangle to 4 lines
                const p1 = entity.p1, p2 = entity.p2;
                CAD.addEntity({ type: 'line', p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p1.y } }, true);
                CAD.addEntity({ type: 'line', p1: { x: p2.x, y: p1.y }, p2: { x: p2.x, y: p2.y } }, true);
                CAD.addEntity({ type: 'line', p1: { x: p2.x, y: p2.y }, p2: { x: p1.x, y: p2.y } }, true);
                CAD.addEntity({ type: 'line', p1: { x: p1.x, y: p2.y }, p2: { x: p1.x, y: p1.y } }, true);
                CAD.removeEntity(entity.id, true);
                explodedCount++;
            } else if (entity.type === 'polyline' && entity.points.length > 1) {
                // Explode polyline to lines
                for (let i = 0; i < entity.points.length - 1; i++) {
                    CAD.addEntity({
                        type: 'line',
                        p1: { ...entity.points[i] },
                        p2: { ...entity.points[i + 1] }
                    }, true);
                }
                CAD.removeEntity(entity.id, true);
                explodedCount++;
            } else if (entity.type === 'hatch') {
                // Explode hatch into boundary polyline + pattern lines
                const boundary = entity.boundary || entity.points || [];
                const bPoints = Geometry.Hatch.getBoundaryPoints(boundary);
                if (bPoints && bPoints.length >= 3) {
                    CAD.addEntity({
                        type: 'polyline',
                        points: [...bPoints],
                        closed: true,
                        layer: entity.layer
                    }, true);
                }
                // Regenerate render lines if missing (ensures pattern-correct output)
                let rLines = entity.renderLines;
                if ((!rLines || rLines.length === 0) && entity.patternName !== 'solid') {
                    const hatch = new Geometry.Hatch(
                        boundary,
                        entity.patternName || 'ansi31',
                        entity.scale || 1,
                        entity.angle || 0
                    );
                    rLines = hatch.generateRenderLines();
                }
                if (rLines && rLines.length > 0) {
                    rLines.forEach(seg => {
                        if (seg && seg.p1 && seg.p2) {
                            CAD.addEntity({
                                type: 'line',
                                p1: { ...seg.p1 },
                                p2: { ...seg.p2 },
                                layer: entity.layer
                            }, true);
                        }
                    });
                    UI.log(`Hatch exploded into boundary + ${rLines.length} pattern lines.`);
                } else if (entity.patternName === 'solid') {
                    // Solid hatch: explode to filled boundary polyline
                    if (bPoints && bPoints.length >= 3) {
                        const lastEntity = CAD.entities[CAD.entities.length - 1];
                        if (lastEntity) {
                            CAD.updateEntity(lastEntity.id, {
                                hatch: { pattern: 'solid' }
                            }, true);
                        }
                    }
                    UI.log('Solid hatch exploded to filled polyline.');
                }
                CAD.removeEntity(entity.id, true);
                explodedCount++;
            } else if (entity.type === 'block') {
                // Explode block reference into individual entities
                const expandedEntities = CAD.getBlockEntities(entity);
                if (expandedEntities.length > 0) {
                    expandedEntities.forEach(expandedEntity => {
                        expandedEntity.layer = entity.layer || expandedEntity.layer;
                        CAD.addEntity(expandedEntity, true);
                    });
                    CAD.removeEntity(entity.id, true);
                    explodedCount++;
                    UI.log(`Block "${entity.blockName}" exploded into ${expandedEntities.length} object(s).`);
                } else {
                    UI.log(`Block "${entity.blockName}" not found or empty.`, 'error');
                }
            }
        });

        UI.log(`${explodedCount} objects exploded.`);
        state.clearSelection();
        this.finishCommand();
        Renderer.draw();
    },

    listSelected() {
        const selected = CAD.getSelectedEntities();
        if (selected.length === 0) {
            UI.log('No objects selected.');
            return;
        }

        selected.forEach(entity => {
            UI.log(`--- ${entity.type.toUpperCase()} ---`);
            UI.log(`  Layer: ${entity.layer}`);
            UI.log(`  ID: ${entity.id}`);

            switch (entity.type) {
                case 'line':
                    UI.log(`  Start: ${Utils.formatPoint(entity.p1)}`);
                    UI.log(`  End: ${Utils.formatPoint(entity.p2)}`);
                    UI.log(`  Length: ${Utils.dist(entity.p1, entity.p2).toFixed(4)}`);
                    break;
                case 'circle':
                    UI.log(`  Center: ${Utils.formatPoint(entity.center)}`);
                    UI.log(`  Radius: ${entity.r.toFixed(4)}`);
                    break;
                case 'arc':
                    UI.log(`  Center: ${Utils.formatPoint(entity.center)}`);
                    UI.log(`  Radius: ${entity.r.toFixed(4)}`);
                    UI.log(`  Start Angle: ${Utils.radToDeg(entity.start).toFixed(2)}°`);
                    UI.log(`  End Angle: ${Utils.radToDeg(entity.end).toFixed(2)}°`);
                    break;
                case 'rect':
                    UI.log(`  Corner 1: ${Utils.formatPoint(entity.p1)}`);
                    UI.log(`  Corner 2: ${Utils.formatPoint(entity.p2)}`);
                    break;
                case 'polyline':
                    UI.log(`  Vertices: ${entity.points.length}`);
                    UI.log(`  Closed: ${Utils.isPolygonClosed(entity.points)}`);
                    break;
                case 'leader':
                    UI.log(`  Points: ${entity.points.length}`);
                    UI.log(`  Text: ${entity.text}`);
                    break;
                case 'image':
                    UI.log(`  Insertion: ${Utils.formatPoint(entity.p1)}`);
                    UI.log(`  Width: ${(entity.width ?? Math.abs(entity.p2.x - entity.p1.x)).toFixed(4)}`);
                    UI.log(`  Height: ${(entity.height ?? Math.abs(entity.p2.y - entity.p1.y)).toFixed(4)}`);
                    UI.log(`  Scale: ${(entity.scale ?? 1).toFixed(4)}`);
                    UI.log(`  Rotation: ${(entity.rotation ?? 0).toFixed(2)}°`);
                    break;
                case 'hatch': {
                    const hPat = entity.patternName || (entity.hatch && entity.hatch.pattern) || 'solid';
                    const hBound = entity.boundary || entity.points || [];
                    const hPts = Geometry.Hatch.getBoundaryPoints(hBound);
                    UI.log(`  Pattern: ${hPat.toUpperCase()}`);
                    UI.log(`  Scale: ${(entity.scale || 1).toFixed(4)}`);
                    UI.log(`  Angle: ${(entity.angle || 0).toFixed(2)}°`);
                    UI.log(`  Boundary Points: ${hPts.length}`);
                    break;
                }
                case 'block':
                    UI.log(`  Block Name: ${entity.blockName}`);
                    UI.log(`  Insertion Point: ${Utils.formatPoint(entity.insertPoint)}`);
                    UI.log(`  Scale X: ${(entity.scale?.x ?? 1).toFixed(4)}`);
                    UI.log(`  Scale Y: ${(entity.scale?.y ?? 1).toFixed(4)}`);
                    UI.log(`  Rotation: ${Utils.radToDeg(entity.rotation ?? 0).toFixed(2)}°`);
                    const block = CAD.getBlock(entity.blockName);
                    if (block) {
                        UI.log(`  Block Entities: ${block.entities.length}`);
                    }
                    break;
            }
        });
    },

    getSelectableTypes() {
        const types = CAD.getVisibleEntities().map(entity => entity.type);
        return Array.from(new Set(types)).sort();
    },

    selectByType(type) {
        const normalizedType = type.toLowerCase();
        const types = this.getSelectableTypes();
        if (!types.includes(normalizedType)) {
            UI.log(`QSELECT: Unknown type "${type}". Use LIST for options.`, 'error');
            return;
        }
        CAD.selectedIds = CAD.getVisibleEntities()
            .filter(entity => entity.type === normalizedType)
            .map(entity => entity.id);
        UI.log(`${CAD.selectedIds.length} ${normalizedType}(s) selected.`);
        UI.updateCanvasSelectionInfo();
        Renderer.draw();
    },

    selectSimilar() {
        const selected = CAD.getSelectedEntities();
        if (selected.length === 0) {
            UI.log('SELECTSIMILAR: No objects selected.', 'error');
            return;
        }
        this.selectByType(selected[0].type);
    },

    getLinetypeOptions() {
        return ['bylayer', 'continuous', 'dashed', 'dotted', 'dashdot', 'center', 'phantom', 'hidden'];
    },

    undo() {
        const action = CAD.undo();
        if (action) {
            UI.log(`Undo: ${action}`);
            Renderer.draw();
        } else {
            UI.log('Nothing to undo.');
        }
        this.finishCommand();
    },

    redo() {
        const action = CAD.redo();
        if (action) {
            UI.log(`Redo: ${action}`);
            Renderer.draw();
        } else {
            UI.log('Nothing to redo.');
        }
        this.finishCommand();
    },

    zoomExtents() {
        const size = Renderer.getCanvasSize();
        CAD.zoomExtents(size.width, size.height);
        UI.log('Zoom extents.');
        Renderer.draw();
        this.finishCommand();
    },

    finishCommand(preventRestart = false) {
        const lastCmd = CAD.activeCmd;
        CAD.finishCommand();
        UI.setActiveButton(null);
        UI.updateCommandPrompt(null);
        UI.hideCanvasSelectionToolbar();
        UI.updateSelectionRibbon();
        UI.resetPrompt();
        Renderer.draw();

        // Auto-restart repeatable commands (like CAD)
        if (!preventRestart && lastCmd && this.repeatableCommands.includes(lastCmd)) {
            // Small delay to allow UI to update
            setTimeout(() => {
                this.startCommand(lastCmd);
            }, 50);
        }
    },

    cancelCommand() {
        // Clear the last drawing command so it doesn't restart
        this.lastDrawingCmd = null;
        CAD.cancelCommand();
        CAD.clearSelection();
        CAD.selectionMode = false;
        CAD.selectStart = null;
        CAD.cmdOptions.forceWindowMode = null;
        UI.setActiveButton(null);
        UI.updateCommandPrompt(null);
        UI.log('*Cancel*');
        UI.resetPrompt();
        UI.updateSelectionRibbon();
        UI.hideCanvasSelectionToolbar();
        Renderer.draw();
    },

    getViewportAtPoint(point, layout) {
        if (!layout || !layout.viewports) return null;
        return layout.viewports.find(viewport => {
            const left = viewport.centerPoint.x - viewport.width / 2;
            const right = viewport.centerPoint.x + viewport.width / 2;
            const top = viewport.centerPoint.y - viewport.height / 2;
            const bottom = viewport.centerPoint.y + viewport.height / 2;
            return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
        }) || null;
    },

    enterModelSpace(viewport = null) {
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout || layout.type !== 'paper') {
            UI.log('MSPACE: Not in a layout. Switch to a layout tab first.', 'error');
            return;
        }
        const target = viewport || layout.viewports.find(v => v.id === CAD.activeViewportId);
        if (!target) {
            UI.log('MSPACE: Select a viewport to activate.', 'prompt');
            return;
        }
        CAD.activeSpace = 'MODEL';
        CAD.activeViewportId = target.id;
        UI.log('MSPACE: Model space active in viewport.');
        Renderer.draw();
    },

    enterPaperSpace() {
        CAD.activeSpace = 'PAPER';
        CAD.activeViewportId = null;
        UI.log('PSPACE: Paper space active.');
        Renderer.draw();
    },

    plotLayout() {
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout || layout.type !== 'paper' || !layout.paper) {
            UI.log('PLOT: Switch to a layout tab first.', 'error');
            return;
        }

        const PDF = window.jspdf?.jsPDF || window.jsPDF;
        if (!PDF) {
            UI.log('PLOT: jsPDF not available.', 'error');
            return;
        }

        const { width, height } = layout.paper;
        const scale = 3;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        Renderer.renderLayoutToContext(ctx, layout, { scale });

        const doc = new PDF({
            orientation: width >= height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [width, height]
        });

        const imageData = canvas.toDataURL('image/png');
        doc.addImage(imageData, 'PNG', 0, 0, width, height);
        doc.save(`${CAD.drawingName || 'BrowserCAD'}.pdf`);
        UI.log('PLOT: PDF generated.', 'success');
    },

    // ==========================================
    // NEW DRAWING COMMAND HANDLERS
    // ==========================================

    handlePolygonClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            // First click - center point
            UI.log('POLYGON: Specify radius (edge point):', 'prompt');
        } else if (state.points.length === 2) {
            // Second click - edge point, create polygon
            const center = state.points[0];
            const edgePoint = state.points[1];
            const radius = Utils.dist(center, edgePoint);
            const startAngle = Utils.angle(center, edgePoint);
            const sides = state.cmdOptions.sides || 4;

            // Create polygon as a closed polyline
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = startAngle + (i * 2 * Math.PI / sides);
                points.push({
                    x: center.x + radius * Math.cos(angle),
                    y: center.y + radius * Math.sin(angle)
                });
            }
            // Close the polygon
            points.push({ ...points[0] });

            CAD.addEntity({
                type: 'polyline',
                points: points,
                closed: true
            });

            UI.log(`Polygon with ${sides} sides created.`);
            this.finishCommand();
        }
    },

    handleRayClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            UI.log('RAY: Specify through point:', 'prompt');
        } else if (state.points.length === 2) {
            // Create a very long line in the direction specified
            const direction = Utils.angle(state.points[0], state.points[1]);
            const length = 10000; // Large number for "infinite" line

            CAD.addEntity({
                type: 'line',
                p1: { ...state.points[0] },
                p2: {
                    x: state.points[0].x + length * Math.cos(direction),
                    y: state.points[0].y + length * Math.sin(direction)
                },
                isRay: true
            });

            UI.log('Ray created.');
            // Keep start point for more rays from same origin
            state.points = [state.points[0]];
            UI.log('RAY: Specify through point:', 'prompt');
        }
    },

    handleXLineClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            UI.log('XLINE: Specify through point:', 'prompt');
        } else if (state.points.length === 2) {
            // Create a construction line (infinite in both directions)
            const direction = Utils.angle(state.points[0], state.points[1]);
            const length = 10000;

            CAD.addEntity({
                type: 'line',
                p1: {
                    x: state.points[0].x - length * Math.cos(direction),
                    y: state.points[0].y - length * Math.sin(direction)
                },
                p2: {
                    x: state.points[0].x + length * Math.cos(direction),
                    y: state.points[0].y + length * Math.sin(direction)
                },
                isXLine: true
            });

            UI.log('Construction line created.');
            // Keep origin point for more construction lines
            state.points = [state.points[0]];
            UI.log('XLINE: Specify through point:', 'prompt');
        }
    },

    handleSplineClick(point) {
        const state = CAD;
        state.points.push(point);

        UI.log(`SPLINE: Specify point ${state.points.length + 1} or [Close/Enter to finish]:`, 'prompt');
    },

    getArcPointsFromThreePoints(start, mid, end) {
        const ax = start.x;
        const ay = start.y;
        const bx = mid.x;
        const by = mid.y;
        const cx = end.x;
        const cy = end.y;

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-8) return null;

        const ax2ay2 = ax * ax + ay * ay;
        const bx2by2 = bx * bx + by * by;
        const cx2cy2 = cx * cx + cy * cy;

        const ux = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
        const uy = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
        const center = { x: ux, y: uy };
        const radius = Utils.dist(center, start);
        if (!radius || Number.isNaN(radius)) return null;

        const startAngle = Utils.angle(center, start);
        const midAngle = Utils.angle(center, mid);
        const endAngle = Utils.angle(center, end);
        const ccw = this.isAngleBetweenCCW(startAngle, endAngle, midAngle);

        const twoPi = Math.PI * 2;
        let startAdj = startAngle;
        let endAdj = endAngle;
        let delta = 0;

        if (ccw) {
            if (endAdj < startAdj) endAdj += twoPi;
            delta = endAdj - startAdj;
        } else {
            if (startAdj < endAdj) startAdj += twoPi;
            delta = startAdj - endAdj;
        }

        const segments = Math.max(6, Math.ceil(Math.abs(delta) / (Math.PI / 12)));
        const step = delta / segments;
        const points = [];

        for (let i = 1; i <= segments; i += 1) {
            const angle = ccw ? startAdj + step * i : startAdj - step * i;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        }

        return points;
    },

    isAngleBetweenCCW(start, end, test) {
        const twoPi = Math.PI * 2;
        const norm = (angle) => {
            let val = angle % twoPi;
            if (val < 0) val += twoPi;
            return val;
        };
        let s = norm(start);
        let e = norm(end);
        let t = norm(test);
        if (e < s) e += twoPi;
        if (t < s) t += twoPi;
        return t <= e;
    },

    handleDonutClick(point) {
        const state = CAD;

        // Create donut (two concentric circles represented as filled shape)
        const inner = state.cmdOptions.donutInner || 10;
        const outer = state.cmdOptions.donutOuter || 20;

        CAD.addEntity({
            type: 'donut',
            center: { ...point },
            innerRadius: inner / 2,
            outerRadius: outer / 2
        });

        UI.log('Donut created. Specify center of next donut or press Enter to finish:', 'prompt');
    },

    // ==========================================
    // BLOCK COMMAND HANDLERS
    // ==========================================

    handleBlockClick(point) {
        const state = CAD;

        // If we're waiting for base point
        if (state.cmdOptions.waitingForBasePoint) {
            state.cmdOptions.blockBasePoint = { ...point };
            state.cmdOptions.waitingForBasePoint = false;

            // Now create the block
            this.createBlock();
        }
    },

    createBlock() {
        const state = CAD;
        const name = state.cmdOptions.blockName;
        const basePoint = state.cmdOptions.blockBasePoint;
        const selectedEntities = state.getSelectedEntities();

        if (!name || !basePoint || selectedEntities.length === 0) {
            UI.log('BLOCK: Invalid block parameters.', 'error');
            this.finishCommand(true);
            return;
        }

        // Check if block already exists
        if (CAD.getBlock(name)) {
            UI.log(`BLOCK: Block "${name}" already exists. Use a different name.`, 'error');
            this.finishCommand(true);
            return;
        }

        CAD.saveUndoState('Create Block');

        // Create the block definition
        const block = CAD.addBlock(name, basePoint, selectedEntities);
        if (block) {
            // Remove the original entities (like CAD)
            CAD.removeEntities(state.selectedIds, true);

            // Insert a block reference at the base point
            CAD.addEntity({
                type: 'block',
                blockName: name,
                insertPoint: { ...basePoint },
                scale: { x: 1, y: 1 },
                rotation: 0
            }, true);

            UI.log(`BLOCK: Block "${name}" created with ${selectedEntities.length} object(s).`);
        } else {
            UI.log('BLOCK: Failed to create block.', 'error');
        }

        state.clearSelection();
        this.finishCommand(true);
    },

    handleInsertClick(point) {
        const state = CAD;

        // If block is selected and we're placing it
        if (state.cmdOptions.insertBlockName) {
            const blockName = state.cmdOptions.insertBlockName;
            const scale = state.cmdOptions.insertScale || { x: 1, y: 1 };
            const rotation = state.cmdOptions.insertRotation || 0;

            CAD.saveUndoState('Insert Block');

            CAD.addEntity({
                type: 'block',
                blockName: blockName,
                insertPoint: { ...point },
                scale: scale,
                rotation: Utils.degToRad(rotation)
            });

            UI.log(`INSERT: Block "${blockName}" inserted.`);

            // Ask for next insertion point (like CAD)
            UI.log('INSERT: Specify insertion point or [Enter] to finish:', 'prompt');
        }
    },

    // ==========================================
    // NEW MODIFY COMMAND HANDLERS
    // ==========================================

    handleArrayClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            // Point for row/column offset reference
            UI.log('ARRAY: Specify second point for row/column spacing:', 'prompt');
        } else if (state.step === 2) {
            const rows = state.cmdOptions.arrayRows || 1;
            const cols = state.cmdOptions.arrayCols || 1;
            const rowOffset = state.points[1].y - state.points[0].y;
            const colOffset = state.points[1].x - state.points[0].x;

            CAD.saveUndoState('Array');

            const selectedEntities = state.getSelectedEntities();
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (r === 0 && c === 0) continue; // Skip original

                    const dx = c * colOffset;
                    const dy = r * rowOffset;

                    selectedEntities.forEach(entity => {
                        const copied = Geometry.moveEntity(entity, { x: dx, y: dy });
                        delete copied.id;
                        CAD.addEntity(copied, true);
                    });
                }
            }

            UI.log(`Array created: ${rows} rows x ${cols} columns.`);
            state.clearSelection();
            this.finishCommand();
        }
    },

    handlePolarArrayClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            // Center point specified, now ask for number of items
            UI.log('ARRAYPOLAR: Enter number of items <4>:', 'prompt');
            state.cmdOptions.arrayItems = state.cmdOptions.arrayItems || 4;
            state.cmdOptions.arrayAngle = 360;
            state.cmdOptions.waitingForItems = true;
        }
    },

    completePolarArray() {
        const state = CAD;
        const center = state.points[0];
        const items = state.cmdOptions.arrayItems || 4;
        const totalAngle = Utils.degToRad(state.cmdOptions.arrayAngle || 360);
        const angleStep = totalAngle / items;

        CAD.saveUndoState('Polar Array');

        const selectedEntities = state.getSelectedEntities();
        for (let i = 1; i < items; i++) {
            const angle = angleStep * i;

            selectedEntities.forEach(entity => {
                // Rotate entity around center point
                const rotated = Geometry.rotateEntity(entity, center, angle);
                delete rotated.id;
                CAD.addEntity(rotated, true);
            });
        }

        UI.log(`Polar array created: ${items} items.`);
        state.clearSelection();
        this.finishCommand();
    },

    handleFilletClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (!hit) {
            UI.log('No object selected.', 'error');
            return;
        }

        if (state.step === 0) {
            state.targetId = hit.id;
            state.step = 1;
            UI.log('FILLET: Select second object:', 'prompt');
        } else if (state.step === 1) {
            // Perform fillet between two lines
            const entity1 = CAD.getEntity(state.targetId);
            const entity2 = hit;

            if (entity1.type === 'line' && entity2.type === 'line') {
                const result = Geometry.filletLines(entity1, entity2, CAD.filletRadius);
                if (result) {
                    CAD.saveUndoState('Fillet');
                    CAD.updateEntity(entity1.id, result.line1, true);
                    CAD.updateEntity(entity2.id, result.line2, true);
                    if (result.arc) {
                        CAD.addEntity(result.arc, true);
                    }
                    UI.log(`Fillet created with radius ${CAD.filletRadius}.`);
                } else {
                    UI.log('Cannot fillet these objects.', 'error');
                }
            } else {
                UI.log('Fillet currently supports only lines.', 'error');
            }

            this.finishCommand();
        }
    },

    handleChamferClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (!hit) {
            UI.log('No object selected.', 'error');
            return;
        }

        if (state.step === 0) {
            state.targetId = hit.id;
            state.step = 1;
            UI.log('CHAMFER: Select second line:', 'prompt');
        } else if (state.step === 1) {
            const entity1 = CAD.getEntity(state.targetId);
            const entity2 = hit;

            if (entity1.type === 'line' && entity2.type === 'line') {
                const result = Geometry.chamferLines(entity1, entity2, CAD.chamferDist1, CAD.chamferDist2);
                if (result) {
                    CAD.saveUndoState('Chamfer');
                    CAD.updateEntity(entity1.id, result.line1, true);
                    CAD.updateEntity(entity2.id, result.line2, true);
                    CAD.addEntity(result.chamferLine, true);
                    UI.log(`Chamfer created with distances ${CAD.chamferDist1}, ${CAD.chamferDist2}.`);
                } else {
                    UI.log('Cannot chamfer these lines.', 'error');
                }
            } else {
                UI.log('Chamfer currently supports only lines.', 'error');
            }

            this.finishCommand();
        }
    },

    handleBreakClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (!hit) {
            UI.log('No object selected.', 'error');
            return;
        }

        if (state.step === 0) {
            state.targetId = hit.id;
            state.points.push(point);
            state.step = 1;
            UI.log('BREAK: Specify second break point or [First point]:', 'prompt');
        } else if (state.step === 1) {
            state.points.push(point);

            const entity = CAD.getEntity(state.targetId);
            if (entity && entity.type === 'line') {
                const result = Geometry.breakLine(entity, state.points[0], state.points[1]);
                if (result && result.length > 0) {
                    CAD.saveUndoState('Break');
                    CAD.removeEntity(state.targetId, true);
                    result.forEach(e => CAD.addEntity(e, true));
                    UI.log('Object broken.');
                } else {
                    UI.log('Cannot break object at specified points.', 'error');
                }
            }

            this.finishCommand();
        }
    },

    // ==========================================
    // DIMENSION COMMAND HANDLERS
    // ==========================================

    handleDimLinearClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('DIMLINEAR: Specify second extension line origin:', 'prompt');
        } else if (state.step === 2) {
            UI.log('DIMLINEAR: Specify dimension line location:', 'prompt');
        } else if (state.step === 3) {
            const p1 = state.points[0];
            const p2 = state.points[1];
            const dimLine = state.points[2];

            // Calculate dimension value
            const distance = state.activeCmd === 'dimaligned' ?
                Utils.dist(p1, p2) :
                Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y) ?
                    Math.abs(p2.x - p1.x) : Math.abs(p2.y - p1.y);

            // Create dimension entity
            const entity = CAD.addEntity({
                type: 'dimension',
                dimType: state.activeCmd === 'dimaligned' ? 'aligned' : 'linear',
                p1: { ...p1 },
                p2: { ...p2 },
                dimLinePos: { ...dimLine },
                value: distance,
                text: distance.toFixed(CAD.dimPrecision ?? 2)
            });
            CAD.lastLinearDim = entity;

            UI.log(`Dimension: ${distance.toFixed(4)}`);
            this.finishCommand();
        }
    },

    handleDimRadiusClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (hit && (hit.type === 'circle' || hit.type === 'arc')) {
            state.targetId = hit.id;
            state.points.push(point);
            state.step = 1;
            UI.log('DIMRADIUS: Specify dimension line location:', 'prompt');
        } else if (state.step === 1) {
            const entity = CAD.getEntity(state.targetId);
            if (entity) {
                const value = state.activeCmd === 'dimdiameter' ? entity.r * 2 : entity.r;
                const prefix = state.activeCmd === 'dimdiameter' ? 'Ø' : 'R';

                CAD.addEntity({
                    type: 'dimension',
                    dimType: state.activeCmd === 'dimdiameter' ? 'diameter' : 'radius',
                    center: { ...entity.center },
                    radius: entity.r,
                    dimLinePos: { ...point },
                    value: value,
                    text: `${prefix}${value.toFixed(CAD.dimPrecision ?? 2)}`
                });

                UI.log(`${state.activeCmd === 'dimdiameter' ? 'Diameter' : 'Radius'}: ${value.toFixed(4)}`);
            }
            this.finishCommand();
        } else {
            UI.log('Please select a circle or arc.', 'error');
        }
    },

    handleDimContinueClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log(`${state.activeCmd === 'dimbaseline' ? 'DIMBASELINE' : 'DIMCONTINUE'}: Specify dimension line location:`, 'prompt');
        } else if (state.step === 2) {
            const p1 = state.cmdOptions.dimBasePoint;
            const p2 = state.points[0];
            const dimLine = state.points[1];
            if (!p1) {
                UI.log('Dimension base point missing.', 'error');
                this.finishCommand(true);
                return;
            }
            const distance = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y) ?
                Math.abs(p2.x - p1.x) : Math.abs(p2.y - p1.y);
            const entity = CAD.addEntity({
                type: 'dimension',
                dimType: 'linear',
                p1: { ...p1 },
                p2: { ...p2 },
                dimLinePos: { ...dimLine },
                value: distance,
                text: distance.toFixed(CAD.dimPrecision ?? 2)
            });
            CAD.lastLinearDim = entity;
            UI.log(`Dimension: ${distance.toFixed(4)}`);
            this.finishCommand();
        }
    },

    // ==========================================
    // QUICK-WIN COMMAND HANDLERS
    // ==========================================

    // --- Entity length/point helpers ---
    getEntityLength(entity) {
        switch (entity.type) {
            case 'line':
                return Utils.dist(entity.p1, entity.p2);
            case 'circle':
                return 2 * Math.PI * entity.r;
            case 'arc': {
                let sweep = entity.end - entity.start;
                if (sweep < 0) sweep += 2 * Math.PI;
                return entity.r * sweep;
            }
            case 'polyline': {
                let len = 0;
                for (let i = 1; i < entity.points.length; i++) {
                    len += Utils.dist(entity.points[i - 1], entity.points[i]);
                }
                return len;
            }
            case 'ellipse': {
                // Approximate ellipse perimeter (Ramanujan)
                const a = entity.rx, b = entity.ry;
                return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
            }
            case 'rect': {
                const w = Math.abs(entity.p2.x - entity.p1.x);
                const h = Math.abs(entity.p2.y - entity.p1.y);
                return 2 * (w + h);
            }
            default:
                return 0;
        }
    },

    getPointAtDistance(entity, distance) {
        switch (entity.type) {
            case 'line': {
                const len = Utils.dist(entity.p1, entity.p2);
                if (len === 0) return { ...entity.p1 };
                const t = distance / len;
                return Utils.lerp(entity.p1, entity.p2, t);
            }
            case 'circle': {
                const angle = (distance / entity.r); // in radians
                return {
                    x: entity.center.x + entity.r * Math.cos(angle),
                    y: entity.center.y + entity.r * Math.sin(angle)
                };
            }
            case 'arc': {
                const angle = entity.start + (distance / entity.r);
                return {
                    x: entity.center.x + entity.r * Math.cos(angle),
                    y: entity.center.y + entity.r * Math.sin(angle)
                };
            }
            case 'polyline': {
                let remaining = distance;
                for (let i = 1; i < entity.points.length; i++) {
                    const segLen = Utils.dist(entity.points[i - 1], entity.points[i]);
                    if (remaining <= segLen) {
                        const t = segLen > 0 ? remaining / segLen : 0;
                        return Utils.lerp(entity.points[i - 1], entity.points[i], t);
                    }
                    remaining -= segLen;
                }
                return { ...entity.points[entity.points.length - 1] };
            }
            case 'rect': {
                // Trace around rectangle perimeter
                const corners = [
                    { ...entity.p1 },
                    { x: entity.p2.x, y: entity.p1.y },
                    { ...entity.p2 },
                    { x: entity.p1.x, y: entity.p2.y },
                    { ...entity.p1 }
                ];
                let remaining = distance;
                for (let i = 1; i < corners.length; i++) {
                    const segLen = Utils.dist(corners[i - 1], corners[i]);
                    if (remaining <= segLen) {
                        const t = segLen > 0 ? remaining / segLen : 0;
                        return Utils.lerp(corners[i - 1], corners[i], t);
                    }
                    remaining -= segLen;
                }
                return { ...corners[corners.length - 1] };
            }
            default:
                return null;
        }
    },

    // --- DIVIDE ---
    handleDivideClick(point) {
        const hit = this.hitTest(point);
        if (!hit) {
            UI.log('DIVIDE: No object found. Select an object:', 'prompt');
            return;
        }
        const length = this.getEntityLength(hit);
        if (length <= 0) {
            UI.log('DIVIDE: Cannot divide this object type.', 'error');
            this.finishCommand();
            return;
        }
        CAD.cmdOptions.divideTarget = hit;
        UI.log('DIVIDE: Enter number of segments <2>:', 'prompt');
    },

    executeDivide(entity, segments) {
        const length = this.getEntityLength(entity);
        const segLen = length / segments;
        CAD.saveUndoState('Divide');

        for (let i = 1; i < segments; i++) {
            const pt = this.getPointAtDistance(entity, segLen * i);
            if (pt) {
                CAD.addEntity({ type: 'point', position: pt }, true);
            }
        }
        UI.log(`DIVIDE: ${segments - 1} point(s) placed.`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- MEASURE ---
    handleMeasureClick(point) {
        const hit = this.hitTest(point);
        if (!hit) {
            UI.log('MEASURE: No object found. Select an object:', 'prompt');
            return;
        }
        const length = this.getEntityLength(hit);
        if (length <= 0) {
            UI.log('MEASURE: Cannot measure this object type.', 'error');
            this.finishCommand();
            return;
        }
        CAD.cmdOptions.measureTarget = hit;
        UI.log('MEASURE: Specify length of interval:', 'prompt');
    },

    executeMeasure(entity, interval) {
        const length = this.getEntityLength(entity);
        const count = Math.floor(length / interval);
        if (count < 1) {
            UI.log('MEASURE: Interval is larger than entity length.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Measure');

        for (let i = 1; i <= count; i++) {
            const pt = this.getPointAtDistance(entity, interval * i);
            if (pt) {
                CAD.addEntity({ type: 'point', position: pt }, true);
            }
        }
        UI.log(`MEASURE: ${count} point(s) placed at ${interval} intervals.`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- REVCLOUD ---
    handleRevcloudClick(point) {
        const state = CAD;
        if (state.step === 0) {
            // Still waiting for arc length input, accept default
            state.step = 1;
            UI.log('REVCLOUD: Specify first point:', 'prompt');
            return;
        }
        state.points.push(point);
        if (state.points.length === 1) {
            UI.log('REVCLOUD: Specify next point or [Close]:', 'prompt');
        } else {
            const first = state.points[0];
            const last = state.points[state.points.length - 1];
            if (Utils.dist(first, last) < 15 / CAD.zoom && state.points.length >= 3) {
                // Close the revcloud
                this.createRevcloud(state.points);
                return;
            }
            UI.log('REVCLOUD: Specify next point or [Close]:', 'prompt');
        }
        Renderer.draw();
    },

    createRevcloud(points) {
        const arcLen = CAD.cmdOptions.revcloudArcLen || 15;
        // Generate arc bumps along the polyline path
        const revcloudPoints = [];
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const segLen = Utils.dist(p1, p2);
            const numArcs = Math.max(1, Math.round(segLen / arcLen));
            const angle = Utils.angle(p1, p2);
            const perpAngle = angle + Math.PI / 2;
            const bumpHeight = arcLen * 0.4;

            for (let j = 0; j < numArcs; j++) {
                const t0 = j / numArcs;
                const t1 = (j + 1) / numArcs;
                const tMid = (t0 + t1) / 2;

                revcloudPoints.push(Utils.lerp(p1, p2, t0));
                // Add arc bump point
                const midPt = Utils.lerp(p1, p2, tMid);
                revcloudPoints.push({
                    x: midPt.x + bumpHeight * Math.cos(perpAngle),
                    y: midPt.y + bumpHeight * Math.sin(perpAngle)
                });
            }
        }
        // Close the shape
        if (revcloudPoints.length > 0) {
            revcloudPoints.push({ ...revcloudPoints[0] });
        }

        CAD.saveUndoState('Revision Cloud');
        CAD.addEntity({
            type: 'polyline',
            points: revcloudPoints,
            isRevcloud: true
        }, true);
        UI.log('REVCLOUD: Revision cloud created.');
        this.finishCommand();
        Renderer.draw();
    },

    // --- MATCHPROP ---
    handleMatchpropClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);
        if (!hit) {
            UI.log('MATCHPROP: No object found. Try again.', 'prompt');
            return;
        }

        if (!state.cmdOptions.matchSource) {
            // First click: select source
            state.cmdOptions.matchSource = hit;
            UI.log(`MATCHPROP: Source: ${hit.type} on layer "${hit.layer}". Select destination objects:`, 'prompt');
        } else {
            // Subsequent clicks: apply properties to destination
            const src = state.cmdOptions.matchSource;
            CAD.saveUndoState('Match Properties');
            CAD.updateEntity(hit.id, {
                layer: src.layer,
                lineWeight: src.lineWeight,
                lineType: src.lineType,
                color: src.color || undefined
            });
            UI.log(`MATCHPROP: Properties applied to ${hit.type}. Select next or press Enter to finish.`, 'prompt');
            Renderer.draw();
        }
    },

    // --- WIPEOUT ---
    handleWipeoutClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            UI.log('WIPEOUT: Specify next point:', 'prompt');
        } else {
            UI.log(`WIPEOUT: Specify next point or press Enter to finish (${state.points.length} points):`, 'prompt');
        }
        Renderer.draw();
    },

    createWipeout() {
        const state = CAD;
        if (state.points.length < 3) {
            UI.log('WIPEOUT: Need at least 3 points.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Wipeout');
        // Close the polygon
        const pts = [...state.points, { ...state.points[0] }];
        CAD.addEntity({
            type: 'wipeout',
            points: pts
        }, true);
        UI.log('WIPEOUT: Wipeout created.');
        this.finishCommand();
        Renderer.draw();
    },

    // --- LAYER LOCK/UNLOCK ---
    lockLayer(layerName, lock) {
        const layer = CAD.getLayer(layerName);
        if (!layer) {
            const layerNames = CAD.layers.map(l => l.name).join(', ');
            UI.log(`Layer "${layerName}" not found. Available: ${layerNames}`, 'error');
            return;
        }
        layer.locked = lock;
        UI.log(`Layer "${layerName}" ${lock ? 'locked' : 'unlocked'}.`);
        UI.updateLayerUI();
        this.finishCommand();
        Renderer.draw();
    },

    // --- NAMED VIEWS ---
    saveNamedView(name) {
        if (!name) {
            UI.log('VIEW: Enter a valid name.', 'error');
            return;
        }
        if (!CAD.namedViews) CAD.namedViews = {};
        CAD.namedViews[name] = {
            pan: { ...CAD.pan },
            zoom: CAD.zoom
        };
        UI.log(`VIEW: View "${name}" saved.`);
        this.finishCommand();
    },

    restoreNamedView(name) {
        if (!CAD.namedViews || !CAD.namedViews[name]) {
            UI.log(`VIEW: View "${name}" not found.`, 'error');
            return;
        }
        const view = CAD.namedViews[name];
        CAD.pan = { ...view.pan };
        CAD.zoom = view.zoom;
        UI.log(`VIEW: Restored view "${name}".`);
        this.finishCommand();
        Renderer.draw();
    },

    deleteNamedView(name) {
        if (!CAD.namedViews || !CAD.namedViews[name]) {
            UI.log(`VIEW: View "${name}" not found.`, 'error');
            return;
        }
        delete CAD.namedViews[name];
        UI.log(`VIEW: View "${name}" deleted.`);
        this.finishCommand();
    },

    listNamedViews() {
        if (!CAD.namedViews || Object.keys(CAD.namedViews).length === 0) {
            UI.log('VIEW: No named views defined.');
        } else {
            const views = Object.keys(CAD.namedViews);
            UI.log(`VIEW: ${views.length} view(s): ${views.join(', ')}`);
        }
        this.finishCommand();
    },

    // --- DIMORDINATE ---
    handleDimOrdinateClick(point) {
        const state = CAD;
        if (state.step === 0) {
            state.points.push(point);
            state.step = 1;
            UI.log('DIMORDINATE: Specify leader endpoint or [Xdatum/Ydatum]:', 'prompt');
        } else if (state.step === 1) {
            state.points.push(point);
            const featurePt = state.points[0];
            const leaderEnd = state.points[1];

            // Determine X or Y based on direction of leader
            const dx = Math.abs(leaderEnd.x - featurePt.x);
            const dy = Math.abs(leaderEnd.y - featurePt.y);
            const isXDatum = state.cmdOptions.dimOrdAxis === 'x' || (!state.cmdOptions.dimOrdAxis && dy > dx);
            const isYDatum = state.cmdOptions.dimOrdAxis === 'y' || (!state.cmdOptions.dimOrdAxis && dx >= dy);

            const value = isXDatum ? featurePt.x : featurePt.y;
            const precision = CAD.dimPrecision || 4;
            const text = value.toFixed(precision);

            CAD.saveUndoState('Ordinate Dimension');
            CAD.addEntity({
                type: 'dimension',
                dimType: 'ordinate',
                featurePoint: { ...featurePt },
                leaderEnd: { ...leaderEnd },
                isXDatum: isXDatum,
                text: text,
                value: value
            }, true);

            UI.log(`DIMORDINATE: ${isXDatum ? 'X' : 'Y'} = ${text}`);
            CAD.lastLinearDim = { p1: featurePt, p2: leaderEnd };
            this.finishCommand();
            Renderer.draw();
        }
    },

    // --- SELECTION CYCLING ---
    hitTestAll(point) {
        const pxTolerance = Math.max(8, (CAD.pickboxSize || 3) * 3);
        const tolerance = pxTolerance / CAD.zoom;
        const entities = CAD.getVisibleEntities();
        const hits = [];

        for (let i = entities.length - 1; i >= 0; i--) {
            if (Geometry.hitTest(point, entities[i], tolerance)) {
                hits.push(entities[i]);
            }
        }
        return hits;
    },

    handleSelectionClick(point) {
        const hits = this.hitTestAll(point);
        if (hits.length === 0) {
            // Start window/crossing selection
            CAD.selectionMode = true;
            CAD.selectStart = point;
            Renderer.draw();
            return;
        }

        if (hits.length === 1) {
            const hitEnt = hits[0];
            CAD.select(hitEnt.id);
            // Group-aware selection: select all group members
            if (hitEnt._groups && hitEnt._groups.length > 0 && CAD._groups) {
                hitEnt._groups.forEach(gName => {
                    const memberIds = CAD._groups[gName];
                    if (memberIds) {
                        memberIds.forEach(mid => {
                            if (!CAD.selectedIds.includes(mid)) {
                                CAD.selectedIds.push(mid);
                            }
                        });
                    }
                });
                UI.log(`Selected group: ${hitEnt.type} on layer "${hitEnt.layer}" (${CAD.selectedIds.length} in group)`);
            } else {
                UI.log(`Selected: ${hitEnt.type} on layer "${hitEnt.layer}"`);
            }
        } else {
            // Selection cycling: cycle through overlapping entities
            if (!CAD.cmdOptions._cycleHits ||
                !CAD.cmdOptions._cyclePoint ||
                Utils.dist(CAD.cmdOptions._cyclePoint, point) > 5 / CAD.zoom) {
                // New cycle location
                CAD.cmdOptions._cycleHits = hits;
                CAD.cmdOptions._cycleIndex = 0;
                CAD.cmdOptions._cyclePoint = { ...point };
            } else {
                // Advance cycle
                CAD.cmdOptions._cycleIndex = (CAD.cmdOptions._cycleIndex + 1) % hits.length;
            }

            const idx = CAD.cmdOptions._cycleIndex;
            const entity = hits[idx];
            CAD.clearSelection();
            CAD.select(entity.id);
            UI.log(`Cycling (${idx + 1}/${hits.length}): ${entity.type} on layer "${entity.layer}". Click again to cycle.`);
        }
        UI.updateSelectionRibbon();
        Renderer.draw();
    },

    // --- OVERKILL ---
    executeOverkill() {
        const entities = CAD.getVisibleEntities();
        const toRemove = [];
        const tolerance = 0.001;

        for (let i = 0; i < entities.length; i++) {
            if (toRemove.includes(entities[i].id)) continue;
            for (let j = i + 1; j < entities.length; j++) {
                if (toRemove.includes(entities[j].id)) continue;
                if (this.areEntitiesDuplicate(entities[i], entities[j], tolerance)) {
                    toRemove.push(entities[j].id);
                }
            }
        }

        if (toRemove.length === 0) {
            UI.log('OVERKILL: No duplicate objects found.');
        } else {
            CAD.saveUndoState('Overkill');
            CAD.removeEntities(toRemove, true);
            UI.log(`OVERKILL: ${toRemove.length} duplicate object(s) removed.`);
        }
        this.finishCommand();
        Renderer.draw();
    },

    areEntitiesDuplicate(a, b, tol) {
        if (a.type !== b.type) return false;
        if (a.layer !== b.layer) return false;

        switch (a.type) {
            case 'line':
                return (this.pointsEqual(a.p1, b.p1, tol) && this.pointsEqual(a.p2, b.p2, tol)) ||
                       (this.pointsEqual(a.p1, b.p2, tol) && this.pointsEqual(a.p2, b.p1, tol));
            case 'circle':
                return this.pointsEqual(a.center, b.center, tol) && Math.abs(a.r - b.r) < tol;
            case 'arc':
                return this.pointsEqual(a.center, b.center, tol) &&
                       Math.abs(a.r - b.r) < tol &&
                       Math.abs(a.start - b.start) < tol &&
                       Math.abs(a.end - b.end) < tol;
            case 'rect':
                return (this.pointsEqual(a.p1, b.p1, tol) && this.pointsEqual(a.p2, b.p2, tol)) ||
                       (this.pointsEqual(a.p1, b.p2, tol) && this.pointsEqual(a.p2, b.p1, tol));
            case 'point':
                return this.pointsEqual(a.position, b.position, tol);
            case 'polyline':
                if (a.points.length !== b.points.length) return false;
                return a.points.every((p, i) => this.pointsEqual(p, b.points[i], tol));
            case 'text':
            case 'mtext':
                return this.pointsEqual(a.position, b.position, tol) && a.text === b.text;
            case 'ellipse':
                return this.pointsEqual(a.center, b.center, tol) &&
                       Math.abs(a.rx - b.rx) < tol &&
                       Math.abs(a.ry - b.ry) < tol;
            default:
                return false;
        }
    },

    pointsEqual(a, b, tol) {
        return Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;
    },

    // ==========================================
    // PHASE 2: LAYER SYSTEM
    // ==========================================

    executeLayDel(layerName) {
        if (layerName === '0') {
            UI.log('LAYDEL: Cannot delete layer "0".', 'error');
            this.finishCommand();
            return;
        }
        const layer = CAD.getLayer(layerName);
        if (!layer) {
            UI.log(`LAYDEL: Layer "${layerName}" not found.`, 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Delete Layer');
        // Move all entities on deleted layer to layer "0"
        let moved = 0;
        CAD.entities.forEach(e => {
            if (e.layer === layerName) {
                e.layer = '0';
                moved++;
            }
        });
        // Remove the layer
        CAD.layers = CAD.layers.filter(l => l.name !== layerName);
        if (CAD.currentLayer === layerName) {
            CAD.currentLayer = '0';
        }
        UI.log(`LAYDEL: Layer "${layerName}" deleted. ${moved} entity(ies) moved to layer "0".`);
        UI.updateLayerUI();
        this.finishCommand();
        Renderer.draw();
    },

    handleLayIsoClick(point) {
        const hit = this.hitTest(point);
        if (!hit) {
            UI.log('LAYISO: No object found. Select object on layer to isolate:', 'prompt');
            return;
        }
        const targetLayer = hit.layer;
        CAD.saveUndoState('Layer Isolate');
        // Store pre-isolation state
        CAD._layIsoState = CAD.layers.map(l => ({ name: l.name, visible: l.visible }));
        // Hide all layers except the target
        let hidden = 0;
        CAD.layers.forEach(l => {
            if (l.name !== targetLayer) {
                l.visible = false;
                hidden++;
            }
        });
        UI.log(`LAYISO: Layer "${targetLayer}" isolated. ${hidden} layer(s) hidden.`);
        UI.updateLayerUI();
        this.finishCommand();
        Renderer.draw();
    },

    executeLayUniso() {
        if (!CAD._layIsoState) {
            UI.log('LAYUNISO: No isolated layers to restore.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Layer Unisolate');
        CAD._layIsoState.forEach(saved => {
            const layer = CAD.getLayer(saved.name);
            if (layer) layer.visible = saved.visible;
        });
        delete CAD._layIsoState;
        UI.log('LAYUNISO: All layers restored to previous visibility.');
        UI.updateLayerUI();
        this.finishCommand();
        Renderer.draw();
    },

    executeLayMerge(srcName, destName) {
        if (srcName === destName) {
            UI.log('LAYMERGE: Source and destination are the same.', 'error');
            this.finishCommand();
            return;
        }
        const srcLayer = CAD.getLayer(srcName);
        const destLayer = CAD.getLayer(destName);
        if (!srcLayer) {
            UI.log(`LAYMERGE: Source layer "${srcName}" not found.`, 'error');
            this.finishCommand();
            return;
        }
        if (!destLayer) {
            UI.log(`LAYMERGE: Destination layer "${destName}" not found.`, 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Merge Layers');
        let moved = 0;
        CAD.entities.forEach(e => {
            if (e.layer === srcName) {
                e.layer = destName;
                moved++;
            }
        });
        CAD.layers = CAD.layers.filter(l => l.name !== srcName);
        if (CAD.currentLayer === srcName) {
            CAD.currentLayer = destName;
        }
        UI.log(`LAYMERGE: "${srcName}" merged into "${destName}". ${moved} entity(ies) moved.`);
        UI.updateLayerUI();
        this.finishCommand();
        Renderer.draw();
    },

    // ==========================================
    // PHASE 2: SELECTION FILTER
    // ==========================================

    handleFilterInput(input) {
        const state = CAD;
        const val = input.toLowerCase().trim();

        if (state.cmdOptions.filterStep === 'mode') {
            if (val === 'type' || val === 't') {
                state.cmdOptions.filterStep = 'type';
                UI.log('FILTER: Enter entity type (line/circle/arc/polyline/rect/text/point/dimension/ellipse/donut/block):', 'prompt');
                return true;
            }
            if (val === 'layer' || val === 'la') {
                state.cmdOptions.filterStep = 'layer';
                const layerNames = CAD.layers.map(l => l.name).join(', ');
                UI.log(`FILTER: Enter layer name [${layerNames}]:`, 'prompt');
                return true;
            }
            if (val === 'color' || val === 'c') {
                state.cmdOptions.filterStep = 'color';
                UI.log('FILTER: Enter color (e.g. #ff0000, red, white):', 'prompt');
                return true;
            }
            if (val === 'all' || val === 'a' || val === '') {
                this.executeFilterAll();
                return true;
            }
            UI.log('FILTER: Enter filter [Type/Layer/Color/All]:', 'prompt');
            return true;
        }

        if (state.cmdOptions.filterStep === 'type') {
            const type = val;
            const entities = CAD.getVisibleEntities().filter(e => e.type === type);
            CAD.selectedIds = entities.map(e => e.id);
            UI.log(`FILTER: ${entities.length} ${type} entity(ies) selected.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.filterStep === 'layer') {
            const entities = CAD.getVisibleEntities().filter(e => e.layer === input.trim());
            CAD.selectedIds = entities.map(e => e.id);
            UI.log(`FILTER: ${entities.length} entity(ies) on layer "${input.trim()}" selected.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.filterStep === 'color') {
            const entities = CAD.getVisibleEntities().filter(e => {
                const ec = CAD.getEntityColor(e).toLowerCase();
                return ec === val || ec.includes(val);
            });
            CAD.selectedIds = entities.map(e => e.id);
            UI.log(`FILTER: ${entities.length} entity(ies) with color "${val}" selected.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        return false;
    },

    executeFilterAll() {
        const entities = CAD.getVisibleEntities();
        CAD.selectedIds = entities.map(e => e.id);
        UI.log(`FILTER: All ${entities.length} visible entity(ies) selected.`);
        this.finishCommand();
        Renderer.draw();
    },

    // ==========================================
    // PHASE 2: MODIFY COMMANDS
    // ==========================================

    handleAlignClick(point) {
        const state = CAD;
        if (state.cmdOptions.needSelection) return;

        if (state.step === 0) {
            state.cmdOptions.srcPt1 = point;
            state.step = 1;
            UI.log('ALIGN: Specify second source point:', 'prompt');
        } else if (state.step === 1) {
            state.cmdOptions.srcPt2 = point;
            state.step = 2;
            UI.log('ALIGN: Specify first destination point:', 'prompt');
        } else if (state.step === 2) {
            state.cmdOptions.dstPt1 = point;
            state.step = 3;
            UI.log('ALIGN: Specify second destination point:', 'prompt');
        } else if (state.step === 3) {
            state.cmdOptions.dstPt2 = point;
            state.step = 4;
            UI.log('ALIGN: Scale objects to alignment points? [Yes/No] <No>:', 'prompt');
        }
    },

    executeAlign(doScale) {
        const state = CAD;
        const src1 = state.cmdOptions.srcPt1;
        const src2 = state.cmdOptions.srcPt2;
        const dst1 = state.cmdOptions.dstPt1;
        const dst2 = state.cmdOptions.dstPt2;

        if (!src1 || !dst1) {
            UI.log('ALIGN: Insufficient points.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('Align');
        const selected = CAD.getSelectedEntities();

        // Calculate translation
        const dx = dst1.x - src1.x;
        const dy = dst1.y - src1.y;

        // Calculate rotation and scale if we have 2 point pairs
        let angle = 0;
        let scale = 1;
        if (src2 && dst2) {
            const srcAngle = Utils.angle(src1, src2);
            const dstAngle = Utils.angle(dst1, dst2);
            angle = dstAngle - srcAngle;

            if (doScale) {
                const srcDist = Utils.dist(src1, src2);
                const dstDist = Utils.dist(dst1, dst2);
                if (srcDist > 0) scale = dstDist / srcDist;
            }
        }

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const transformPt = (p) => {
            // Translate relative to src1
            let x = p.x - src1.x;
            let y = p.y - src1.y;
            // Scale
            x *= scale;
            y *= scale;
            // Rotate
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;
            // Translate to dst1
            return { x: rx + dst1.x, y: ry + dst1.y };
        };

        selected.forEach(entity => {
            this.transformEntity(entity, transformPt);
            CAD.updateEntity(entity.id, entity, true);
        });

        UI.log(`ALIGN: ${selected.length} object(s) aligned.`);
        this.finishCommand();
        Renderer.draw();
    },

    transformEntity(entity, transformPt) {
        switch (entity.type) {
            case 'line':
                entity.p1 = transformPt(entity.p1);
                entity.p2 = transformPt(entity.p2);
                break;
            case 'circle':
            case 'arc':
                entity.center = transformPt(entity.center);
                break;
            case 'rect':
                entity.p1 = transformPt(entity.p1);
                entity.p2 = transformPt(entity.p2);
                break;
            case 'polyline':
                entity.points = entity.points.map(p => transformPt(p));
                break;
            case 'ellipse':
                entity.center = transformPt(entity.center);
                break;
            case 'text':
            case 'mtext':
                entity.position = transformPt(entity.position);
                break;
            case 'point':
                entity.position = transformPt(entity.position);
                break;
            case 'donut':
                entity.center = transformPt(entity.center);
                break;
        }
    },

    executeScaleText(newHeight) {
        const selected = CAD.getSelectedEntities().filter(e => e.type === 'text' || e.type === 'mtext');
        if (selected.length === 0) {
            UI.log('SCALETEXT: No text objects in selection.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Scale Text');
        selected.forEach(e => {
            CAD.updateEntity(e.id, { height: newHeight }, true);
        });
        UI.log(`SCALETEXT: ${selected.length} text object(s) scaled to height ${newHeight}.`);
        this.finishCommand();
        Renderer.draw();
    },

    executeJustifyText(justification) {
        const val = justification.toLowerCase();
        const validJust = { l: 'left', left: 'left', c: 'center', center: 'center', r: 'right', right: 'right' };
        const just = validJust[val];
        if (!just) {
            UI.log('JUSTIFYTEXT: Invalid option. [Left/Center/Right]', 'error');
            return;
        }
        const selected = CAD.getSelectedEntities().filter(e => e.type === 'text' || e.type === 'mtext');
        if (selected.length === 0) {
            UI.log('JUSTIFYTEXT: No text objects in selection.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Justify Text');
        selected.forEach(e => {
            CAD.updateEntity(e.id, { justify: just }, true);
        });
        UI.log(`JUSTIFYTEXT: ${selected.length} text object(s) set to "${just}" justification.`);
        this.finishCommand();
        Renderer.draw();
    },

    // ==========================================
    // PHASE 2: UTILITY COMMANDS
    // ==========================================

    handleFindInput(input) {
        const state = CAD;
        if (state.cmdOptions.findStep === 'search') {
            state.cmdOptions.findSearch = input;
            state.cmdOptions.findStep = 'replace';
            UI.log('FIND: Enter replacement string (or press Enter for find-only):', 'prompt');
            return true;
        }
        if (state.cmdOptions.findStep === 'replace') {
            const search = state.cmdOptions.findSearch;
            const replace = input;
            this.executeFind(search, replace);
            return true;
        }
        return false;
    },

    executeFind(search, replace) {
        const entities = CAD.getVisibleEntities().filter(e =>
            (e.type === 'text' || e.type === 'mtext') && e.text && e.text.includes(search)
        );

        if (entities.length === 0) {
            UI.log(`FIND: "${search}" not found in any text objects.`);
            this.finishCommand();
            return;
        }

        if (replace === '') {
            // Find only - select matching entities
            CAD.selectedIds = entities.map(e => e.id);
            UI.log(`FIND: Found "${search}" in ${entities.length} text object(s). Objects selected.`);
        } else {
            // Find and replace
            CAD.saveUndoState('Find & Replace');
            entities.forEach(e => {
                const newText = e.text.split(search).join(replace);
                CAD.updateEntity(e.id, { text: newText }, true);
            });
            CAD.selectedIds = entities.map(e => e.id);
            UI.log(`FIND: Replaced "${search}" with "${replace}" in ${entities.length} text object(s).`);
        }
        this.finishCommand();
        Renderer.draw();
    },

    executePurge() {
        let purged = 0;

        // Purge unused layers (no entities)
        const usedLayers = new Set(CAD.entities.map(e => e.layer));
        const before = CAD.layers.length;
        CAD.layers = CAD.layers.filter(l => l.name === '0' || usedLayers.has(l.name));
        purged += (before - CAD.layers.length);
        const layersPurged = before - CAD.layers.length;

        // Purge unused blocks (no INSERT references)
        const usedBlocks = new Set(CAD.entities.filter(e => e.type === 'block').map(e => e.blockName));
        const blocksBefore = Object.keys(CAD.blocks).length;
        Object.keys(CAD.blocks).forEach(name => {
            if (!usedBlocks.has(name)) {
                delete CAD.blocks[name];
                purged++;
            }
        });
        const blocksPurged = blocksBefore - Object.keys(CAD.blocks).length;

        if (purged === 0) {
            UI.log('PURGE: No unused items to purge.');
        } else {
            UI.log(`PURGE: Removed ${layersPurged} layer(s), ${blocksPurged} block(s).`);
            UI.updateLayerUI();
        }
        this.finishCommand();
    },

    // ==========================================
    // PHASE 2: DRAWING COMMANDS
    // ==========================================

    handleSolidClick(point) {
        const state = CAD;
        state.points.push(point);

        if (state.points.length === 1) {
            UI.log('SOLID: Specify second point:', 'prompt');
        } else if (state.points.length === 2) {
            UI.log('SOLID: Specify third point:', 'prompt');
        } else if (state.points.length === 3) {
            UI.log('SOLID: Specify fourth point or press Enter for triangle:', 'prompt');
        } else if (state.points.length === 4) {
            this.createSolidEntity();
        }
    },

    createSolidEntity() {
        const state = CAD;
        if (state.points.length < 3) {
            UI.log('SOLID: Need at least 3 points.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('Solid');
        const pts = [...state.points];
        // CAD SOLID uses triangle (3 pts) or quad (4 pts)
        if (pts.length === 3) {
            pts.push({ ...pts[2] }); // Degenerate quad
        }
        // Close the polygon
        pts.push({ ...pts[0] });
        CAD.addEntity({
            type: 'polyline',
            points: pts,
            isSolid: true,
            hatch: 'solid'
        }, true);
        UI.log('SOLID: Solid created.');
        this.finishCommand();
        Renderer.draw();
    },

    handleBoundaryClick(point) {
        // Detect closed boundary at clicked point by ray-casting
        const entities = CAD.getVisibleEntities();
        const boundaryPts = this.detectBoundary(point, entities);

        if (!boundaryPts || boundaryPts.length < 3) {
            UI.log(`${CAD.activeCmd.toUpperCase()}: No closed boundary found at click point.`, 'error');
            return;
        }

        CAD.saveUndoState(CAD.activeCmd === 'region' ? 'Region' : 'Boundary');
        const pts = [...boundaryPts, { ...boundaryPts[0] }];
        const entityType = CAD.activeCmd === 'region' ? 'region' : 'polyline';
        CAD.addEntity({
            type: entityType,
            points: pts,
            isRegion: CAD.activeCmd === 'region',
            isBoundary: true
        }, true);
        UI.log(`${CAD.activeCmd.toUpperCase()}: Boundary created with ${boundaryPts.length} vertices.`);
        this.finishCommand();
        Renderer.draw();
    },

    detectBoundary(point, entities) {
        // Simple boundary detection: find the smallest closed polyline/rect that contains the point
        const candidates = [];

        entities.forEach(entity => {
            let pts = null;
            if (entity.type === 'polyline' && entity.points.length >= 3) {
                if (Utils.isPolygonClosed(entity.points)) {
                    pts = entity.points;
                }
            } else if (entity.type === 'rect') {
                pts = [
                    { ...entity.p1 },
                    { x: entity.p2.x, y: entity.p1.y },
                    { ...entity.p2 },
                    { x: entity.p1.x, y: entity.p2.y }
                ];
            } else if (entity.type === 'circle') {
                // Approximate circle as polygon for containment test
                const n = 32;
                pts = [];
                for (let i = 0; i < n; i++) {
                    const a = (2 * Math.PI * i) / n;
                    pts.push({
                        x: entity.center.x + entity.r * Math.cos(a),
                        y: entity.center.y + entity.r * Math.sin(a)
                    });
                }
            }

            if (pts && Utils.pointInPolygon(point, pts)) {
                const area = Math.abs(Utils.polygonArea(pts));
                candidates.push({ points: pts, area: area });
            }
        });

        // Return the smallest enclosing boundary
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => a.area - b.area);
        return candidates[0].points;
    },

    // ==========================================
    // PHASE 2: DIMENSION COMMANDS
    // ==========================================

    handleQdimClick(point) {
        const state = CAD;
        if (state.cmdOptions.needSelection) return;

        // Point is for dimension line placement
        if (state.cmdOptions.qdimReady) {
            // Already collected, this is the dimension line position click
            return;
        }

        // Place dimensions for all selected objects
        const selected = CAD.getSelectedEntities();
        if (selected.length === 0) {
            UI.log('QDIM: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('Quick Dimension');
        let count = 0;

        selected.forEach(entity => {
            if (entity.type === 'line') {
                // Create linear dimension for line
                const dimPos = {
                    x: (entity.p1.x + entity.p2.x) / 2,
                    y: point.y
                };
                const len = Utils.dist(entity.p1, entity.p2);
                const precision = CAD.dimPrecision || 4;
                CAD.addEntity({
                    type: 'dimension',
                    dimType: 'linear',
                    p1: { ...entity.p1 },
                    p2: { ...entity.p2 },
                    dimLinePos: dimPos,
                    text: len.toFixed(precision),
                    value: len
                }, true);
                count++;
            } else if (entity.type === 'circle') {
                const precision = CAD.dimPrecision || 4;
                CAD.addEntity({
                    type: 'dimension',
                    dimType: 'diameter',
                    center: { ...entity.center },
                    radius: entity.r,
                    dimLinePos: {
                        x: entity.center.x + entity.r,
                        y: entity.center.y
                    },
                    text: '%%C' + (entity.r * 2).toFixed(precision),
                    value: entity.r * 2
                }, true);
                count++;
            } else if (entity.type === 'arc') {
                const precision = CAD.dimPrecision || 4;
                CAD.addEntity({
                    type: 'dimension',
                    dimType: 'radius',
                    center: { ...entity.center },
                    radius: entity.r,
                    dimLinePos: {
                        x: entity.center.x + entity.r * Math.cos(entity.start),
                        y: entity.center.y + entity.r * Math.sin(entity.start)
                    },
                    text: 'R' + entity.r.toFixed(precision),
                    value: entity.r
                }, true);
                count++;
            } else if (entity.type === 'rect') {
                const precision = CAD.dimPrecision || 4;
                const w = Math.abs(entity.p2.x - entity.p1.x);
                const h = Math.abs(entity.p2.y - entity.p1.y);
                const minX = Math.min(entity.p1.x, entity.p2.x);
                const minY = Math.min(entity.p1.y, entity.p2.y);
                const maxX = Math.max(entity.p1.x, entity.p2.x);
                const maxY = Math.max(entity.p1.y, entity.p2.y);
                // Width dimension
                CAD.addEntity({
                    type: 'dimension',
                    dimType: 'linear',
                    p1: { x: minX, y: minY },
                    p2: { x: maxX, y: minY },
                    dimLinePos: { x: (minX + maxX) / 2, y: point.y },
                    text: w.toFixed(precision),
                    value: w
                }, true);
                // Height dimension
                CAD.addEntity({
                    type: 'dimension',
                    dimType: 'linear',
                    p1: { x: maxX, y: minY },
                    p2: { x: maxX, y: maxY },
                    dimLinePos: { x: point.x, y: (minY + maxY) / 2 },
                    text: h.toFixed(precision),
                    value: h
                }, true);
                count += 2;
            }
        });

        UI.log(`QDIM: ${count} dimension(s) created.`);
        this.finishCommand();
        Renderer.draw();
    },

    handleDimArcClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (state.step === 0) {
            if (!hit || hit.type !== 'arc') {
                UI.log('DIMARC: Select an arc entity.', 'error');
                return;
            }
            state.cmdOptions.dimArcEntity = hit;
            state.step = 1;
            UI.log('DIMARC: Specify dimension arc line location:', 'prompt');
        } else if (state.step === 1) {
            const arc = state.cmdOptions.dimArcEntity;
            let sweep = arc.end - arc.start;
            if (sweep < 0) sweep += 2 * Math.PI;
            const arcLength = arc.r * sweep;
            const precision = CAD.dimPrecision || 4;

            CAD.saveUndoState('Arc Length Dimension');
            const midAngle = arc.start + sweep / 2;
            const dimPt = {
                x: arc.center.x + (arc.r + 15 / CAD.zoom) * Math.cos(midAngle),
                y: arc.center.y + (arc.r + 15 / CAD.zoom) * Math.sin(midAngle)
            };

            CAD.addEntity({
                type: 'dimension',
                dimType: 'arclength',
                center: { ...arc.center },
                radius: arc.r,
                startAngle: arc.start,
                endAngle: arc.end,
                dimLinePos: dimPt,
                text: '⌒' + arcLength.toFixed(precision),
                value: arcLength
            }, true);

            UI.log(`DIMARC: Arc length = ${arcLength.toFixed(precision)}`);
            this.finishCommand();
            Renderer.draw();
        }
    },

    handleDimBreakClick(point) {
        const hit = this.hitTest(point);
        if (!hit || hit.type !== 'dimension') {
            UI.log('DIMBREAK: Select a dimension entity.', 'error');
            return;
        }
        CAD.saveUndoState('Dimension Break');
        CAD.updateEntity(hit.id, { dimBreak: !hit.dimBreak }, true);
        UI.log(`DIMBREAK: Dimension break ${hit.dimBreak ? 'removed' : 'applied'}.`);
        this.finishCommand();
        Renderer.draw();
    },

    handleDimSpaceClick(point) {
        const state = CAD;
        const hit = this.hitTest(point);

        if (!state.cmdOptions.dimspaceBase) {
            if (!hit || hit.type !== 'dimension') {
                UI.log('DIMSPACE: Select a base dimension.', 'error');
                return;
            }
            state.cmdOptions.dimspaceBase = hit;
            state.cmdOptions.dimspaceDims = [hit];
            UI.log('DIMSPACE: Select next dimension (or Enter when done):', 'prompt');
        } else {
            if (hit && hit.type === 'dimension') {
                state.cmdOptions.dimspaceDims.push(hit);
                UI.log(`DIMSPACE: ${state.cmdOptions.dimspaceDims.length} dimensions selected. Select next or Enter:`, 'prompt');
            } else {
                UI.log('DIMSPACE: Enter spacing distance:', 'prompt');
            }
        }
    },

    executeDimSpace(spacing) {
        const dims = CAD.cmdOptions.dimspaceDims;
        if (!dims || dims.length < 2) {
            UI.log('DIMSPACE: Need at least 2 dimensions.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('Dimension Space');
        const base = dims[0];
        const baseY = base.dimLinePos ? base.dimLinePos.y : 0;

        for (let i = 1; i < dims.length; i++) {
            if (dims[i].dimLinePos) {
                dims[i].dimLinePos.y = baseY + spacing * i;
                CAD.updateEntity(dims[i].id, dims[i], true);
            }
        }

        UI.log(`DIMSPACE: ${dims.length} dimensions spaced at ${spacing} intervals.`);
        this.finishCommand();
        Renderer.draw();
    },

    // ==========================================
    // PHASE 3: ADVANCED DRAWING & EDITING
    // ==========================================

    // --- CHPROP (Change Properties) ---
    handleChpropInput(input) {
        const state = CAD;
        const opt = input.toLowerCase();

        if (state.cmdOptions.chpropStep === 'property') {
            if (opt === 'c' || opt === 'color') {
                UI.log('CHPROP: Enter new color (hex, e.g. #ff0000):', 'prompt');
                state.cmdOptions.chpropStep = 'color';
            } else if (opt === 'la' || opt === 'layer') {
                const layerNames = CAD.layers.map(l => l.name).join(', ');
                UI.log(`CHPROP: Enter new layer name [${layerNames}]:`, 'prompt');
                state.cmdOptions.chpropStep = 'layer';
            } else if (opt === 'lt' || opt === 'ltype') {
                UI.log('CHPROP: Enter new linetype [Continuous/Dashed/Dotted/DashDot/Center/Hidden/Phantom]:', 'prompt');
                state.cmdOptions.chpropStep = 'ltype';
            } else if (opt === 'lts' || opt === 'ltscale') {
                UI.log('CHPROP: Enter new linetype scale:', 'prompt');
                state.cmdOptions.chpropStep = 'ltscale';
            } else if (opt === 'lw' || opt === 'lweight') {
                UI.log('CHPROP: Enter new lineweight (1-10):', 'prompt');
                state.cmdOptions.chpropStep = 'lweight';
            } else {
                UI.log('CHPROP: Unknown property. [Color/LAyer/LType/LtScale/LWeight]:', 'prompt');
            }
            return true;
        }

        if (state.cmdOptions.chpropStep === 'color') {
            CAD.saveUndoState('CHPROP Color');
            const selected = CAD.getSelectedEntities();
            selected.forEach(e => { e.color = input; });
            UI.log(`Changed color of ${selected.length} object(s) to ${input}.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.chpropStep === 'layer') {
            const layer = CAD.getLayer(input);
            if (!layer) {
                UI.log(`CHPROP: Layer "${input}" not found.`, 'error');
                return true;
            }
            CAD.saveUndoState('CHPROP Layer');
            const selected = CAD.getSelectedEntities();
            selected.forEach(e => { e.layer = input; });
            UI.log(`Moved ${selected.length} object(s) to layer "${input}".`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.chpropStep === 'ltype') {
            CAD.saveUndoState('CHPROP Linetype');
            const selected = CAD.getSelectedEntities();
            selected.forEach(e => { e.lineType = input.toLowerCase(); });
            UI.log(`Changed linetype of ${selected.length} object(s) to ${input}.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.chpropStep === 'ltscale') {
            const val = parseFloat(input);
            if (isNaN(val) || val <= 0) { UI.log('Invalid scale.', 'error'); return true; }
            CAD.saveUndoState('CHPROP LTScale');
            const selected = CAD.getSelectedEntities();
            selected.forEach(e => { e.lineTypeScale = val; });
            UI.log(`Changed linetype scale of ${selected.length} object(s) to ${val}.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        if (state.cmdOptions.chpropStep === 'lweight') {
            const val = parseFloat(input);
            if (isNaN(val) || val <= 0) { UI.log('Invalid lineweight.', 'error'); return true; }
            CAD.saveUndoState('CHPROP LWeight');
            const selected = CAD.getSelectedEntities();
            selected.forEach(e => { e.lineWeight = val; });
            UI.log(`Changed lineweight of ${selected.length} object(s) to ${val}.`);
            this.finishCommand();
            Renderer.draw();
            return true;
        }

        return false;
    },

    // --- DRAW ORDER ---
    executeDrawOrder(action) {
        const selectedIds = [...CAD.selectedIds];
        if (selectedIds.length === 0) {
            UI.log('DRAWORDER: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('DRAWORDER');

        if (action === 'front') {
            // Move selected to end of array (drawn last = on top)
            const selected = CAD.entities.filter(e => selectedIds.includes(e.id));
            CAD.entities = CAD.entities.filter(e => !selectedIds.includes(e.id));
            CAD.entities.push(...selected);
            UI.log(`${selected.length} object(s) brought to front.`);
        } else if (action === 'back') {
            // Move selected to beginning of array (drawn first = behind)
            const selected = CAD.entities.filter(e => selectedIds.includes(e.id));
            CAD.entities = CAD.entities.filter(e => !selectedIds.includes(e.id));
            CAD.entities.unshift(...selected);
            UI.log(`${selected.length} object(s) sent to back.`);
        }

        this.finishCommand();
        Renderer.draw();
    },

    handleDrawOrderRefClick(point) {
        // User clicks on reference entity for above/below
        const hit = this.hitTest(point);
        if (!hit) {
            UI.log('DRAWORDER: No object at that point. Click on reference object:', 'prompt');
            return;
        }

        const action = CAD.cmdOptions.draworderAction;
        const selectedIds = [...CAD.selectedIds];
        const refIndex = CAD.entities.findIndex(e => e.id === hit.id);
        if (refIndex === -1) return;

        CAD.saveUndoState('DRAWORDER');

        const selected = CAD.entities.filter(e => selectedIds.includes(e.id));
        CAD.entities = CAD.entities.filter(e => !selectedIds.includes(e.id));

        // Recalculate ref index after removal
        const newRefIndex = CAD.entities.findIndex(e => e.id === hit.id);

        if (action === 'above') {
            CAD.entities.splice(newRefIndex + 1, 0, ...selected);
            UI.log(`${selected.length} object(s) moved above reference.`);
        } else {
            CAD.entities.splice(newRefIndex, 0, ...selected);
            UI.log(`${selected.length} object(s) moved below reference.`);
        }

        this.finishCommand();
        Renderer.draw();
    },

    executeTextToFront() {
        CAD.saveUndoState('TEXTTOFRONT');
        const textEnts = CAD.entities.filter(e =>
            e.type === 'text' || e.type === 'mtext' || e.type === 'dimension' || e.type === 'leader'
        );
        CAD.entities = CAD.entities.filter(e =>
            e.type !== 'text' && e.type !== 'mtext' && e.type !== 'dimension' && e.type !== 'leader'
        );
        CAD.entities.push(...textEnts);
        UI.log(`${textEnts.length} text/dimension objects brought to front.`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- HIDE / ISOLATE / UNISOLATE OBJECTS ---
    executeHideObjects() {
        const selectedIds = [...CAD.selectedIds];
        if (selectedIds.length === 0) {
            UI.log('HIDEOBJECTS: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        // Store hidden ids for unisolate
        if (!CAD._hiddenEntityIds) CAD._hiddenEntityIds = [];
        CAD.saveUndoState('HIDEOBJECTS');

        selectedIds.forEach(id => {
            const ent = CAD.getEntity(id);
            if (ent) {
                ent._hidden = true;
                CAD._hiddenEntityIds.push(id);
            }
        });

        CAD.clearSelection();
        UI.log(`${selectedIds.length} object(s) hidden. Use UNISOLATEOBJECTS to show all.`);
        this.finishCommand();
        Renderer.draw();
    },

    executeIsolateObjects() {
        const selectedIds = [...CAD.selectedIds];
        if (selectedIds.length === 0) {
            UI.log('ISOLATEOBJECTS: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        if (!CAD._hiddenEntityIds) CAD._hiddenEntityIds = [];
        CAD.saveUndoState('ISOLATEOBJECTS');

        CAD.entities.forEach(ent => {
            if (!selectedIds.includes(ent.id)) {
                ent._hidden = true;
                CAD._hiddenEntityIds.push(ent.id);
            }
        });

        UI.log(`Isolated ${selectedIds.length} object(s). All others hidden.`);
        this.finishCommand();
        Renderer.draw();
    },

    executeUnisolateObjects() {
        CAD.saveUndoState('UNISOLATEOBJECTS');
        let count = 0;
        CAD.entities.forEach(ent => {
            if (ent._hidden) {
                delete ent._hidden;
                count++;
            }
        });
        CAD._hiddenEntityIds = [];
        UI.log(`${count} object(s) restored to visible.`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- GROUP / UNGROUP ---
    executeGroup(groupName) {
        const selectedIds = [...CAD.selectedIds];
        if (selectedIds.length < 2) {
            UI.log('GROUP: Select at least 2 objects to group.', 'error');
            this.finishCommand();
            return;
        }

        // Initialize groups storage
        if (!CAD._groups) CAD._groups = {};
        if (CAD._groups[groupName]) {
            UI.log(`GROUP: Group "${groupName}" already exists. Choose another name.`, 'error');
            return;
        }

        CAD._groups[groupName] = [...selectedIds];

        // Tag entities with group name
        selectedIds.forEach(id => {
            const ent = CAD.getEntity(id);
            if (ent) {
                if (!ent._groups) ent._groups = [];
                ent._groups.push(groupName);
            }
        });

        UI.log(`GROUP: Created group "${groupName}" with ${selectedIds.length} objects.`);
        this.finishCommand();
    },

    executeUngroup() {
        const selected = CAD.getSelectedEntities();
        if (selected.length === 0) {
            UI.log('UNGROUP: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        if (!CAD._groups) CAD._groups = {};

        let ungrouped = 0;
        selected.forEach(ent => {
            if (ent._groups && ent._groups.length > 0) {
                const groupNames = [...ent._groups];
                groupNames.forEach(gName => {
                    // Remove group from all members
                    if (CAD._groups[gName]) {
                        CAD._groups[gName].forEach(memberId => {
                            const member = CAD.getEntity(memberId);
                            if (member && member._groups) {
                                member._groups = member._groups.filter(g => g !== gName);
                                if (member._groups.length === 0) delete member._groups;
                            }
                        });
                        delete CAD._groups[gName];
                        ungrouped++;
                    }
                });
            }
        });

        UI.log(`UNGROUP: ${ungrouped} group(s) dissolved.`);
        this.finishCommand();
    },

    // --- ARRAY PATH ---
    handleArrayPathClick(point) {
        const state = CAD;

        if (state.cmdOptions.arraypathStep === 'path') {
            // User clicks to select the path entity
            const hit = this.hitTest(point);
            if (!hit) {
                UI.log('ARRAYPATH: Click on a path object (line, polyline, arc, circle):', 'prompt');
                return;
            }
            if (!['line', 'polyline', 'arc', 'circle', 'spline'].includes(hit.type)) {
                UI.log('ARRAYPATH: Object must be a line, polyline, arc, or circle.', 'error');
                return;
            }
            state.cmdOptions.arraypathEntity = hit;
            state.cmdOptions.arraypathStep = 'count';
            UI.log('ARRAYPATH: Enter number of items:', 'prompt');
        }
    },

    executeArrayPath(count) {
        const state = CAD;
        const pathEntity = state.cmdOptions.arraypathEntity;
        const selectedIds = [...CAD.selectedIds];
        if (!pathEntity || selectedIds.length === 0) {
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('ARRAYPATH');

        // Get points along the path
        const pathPoints = this.getPointsAlongEntity(pathEntity, count);
        if (pathPoints.length < 2) {
            UI.log('ARRAYPATH: Could not calculate path points.', 'error');
            this.finishCommand();
            return;
        }

        const sourceEntities = selectedIds.map(id => CAD.getEntity(id)).filter(Boolean);
        // Compute centroid of source entities for offset calculation
        const centroid = this.getEntitiesCentroid(sourceEntities);

        let created = 0;
        // Skip first point (original objects stay), array from second point onward
        for (let i = 1; i < pathPoints.length; i++) {
            const dx = pathPoints[i].x - centroid.x;
            const dy = pathPoints[i].y - centroid.y;

            sourceEntities.forEach(ent => {
                const clone = JSON.parse(JSON.stringify(ent));
                clone.id = undefined;
                const moved = Geometry.moveEntity(clone, { x: dx, y: dy });
                CAD.addEntity(moved, true);
                created++;
            });
        }

        UI.log(`ARRAYPATH: Created ${created} objects along path.`);
        this.finishCommand();
        Renderer.draw();
    },

    getEntitiesCentroid(entities) {
        let sx = 0, sy = 0, count = 0;
        entities.forEach(ent => {
            const pts = this.getEntityKeyPoints(ent);
            pts.forEach(p => { sx += p.x; sy += p.y; count++; });
        });
        return count > 0 ? { x: sx / count, y: sy / count } : { x: 0, y: 0 };
    },

    getEntityKeyPoints(ent) {
        switch (ent.type) {
            case 'line': return [ent.p1, ent.p2];
            case 'circle': case 'arc': case 'ellipse': case 'donut': return [ent.center];
            case 'rect': return [ent.p1, ent.p2];
            case 'polyline': return ent.points;
            case 'text': case 'mtext': case 'point': return [ent.position];
            case 'block': return [ent.insertPoint];
            default: return [{ x: 0, y: 0 }];
        }
    },

    getPointsAlongEntity(entity, count) {
        const points = [];
        const totalLen = this.getEntityLength(entity);
        if (totalLen <= 0 || count < 1) return points;

        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const dist = t * totalLen;
            const pt = this.getPointAtDistance(entity, dist);
            if (pt) points.push(pt);
        }
        return points;
    },

    // --- MULTILINE (MLINE) ---
    handleMlineClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.points.length >= 2) {
            // Create two parallel lines for each segment
            const p1 = state.points[state.points.length - 2];
            const p2 = state.points[state.points.length - 1];
            const halfScale = (state.cmdOptions.mlineScale || 10) / 2;

            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const perpAngle = angle + Math.PI / 2;

            let off1, off2;
            const just = state.cmdOptions.mlineJust || 'top';
            if (just === 'top') {
                off1 = 0;
                off2 = -halfScale * 2;
            } else if (just === 'bottom') {
                off1 = halfScale * 2;
                off2 = 0;
            } else {
                // zero (center)
                off1 = halfScale;
                off2 = -halfScale;
            }

            const cos = Math.cos(perpAngle);
            const sin = Math.sin(perpAngle);

            CAD.addEntity({
                type: 'line',
                p1: { x: p1.x + cos * off1, y: p1.y + sin * off1 },
                p2: { x: p2.x + cos * off1, y: p2.y + sin * off1 }
            }, true);
            CAD.addEntity({
                type: 'line',
                p1: { x: p1.x + cos * off2, y: p1.y + sin * off2 },
                p2: { x: p2.x + cos * off2, y: p2.y + sin * off2 }
            });

            UI.log('MLINE: Specify next point or [Close/Undo]:', 'prompt');
        } else {
            UI.log('MLINE: Specify next point:', 'prompt');
        }
    },

    // --- TABLE ---
    handleTableClick(point) {
        const state = CAD;
        if (state.cmdOptions.tableStep === 'insert') {
            state.cmdOptions.tableInsert = { ...point };
            state.cmdOptions.tableStep = 'rows';
            UI.log(`TABLE: Enter number of rows <${state.cmdOptions.tableRows}>:`, 'prompt');
        }
    },

    createTable() {
        const state = CAD;
        const opts = state.cmdOptions;
        const insert = opts.tableInsert;
        if (!insert) { this.finishCommand(); return; }

        const rows = opts.tableRows;
        const cols = opts.tableCols;
        const cellW = opts.tableCellW;
        const cellH = opts.tableCellH;

        CAD.saveUndoState('TABLE');

        // Create horizontal lines
        for (let r = 0; r <= rows; r++) {
            CAD.addEntity({
                type: 'line',
                p1: { x: insert.x, y: insert.y - r * cellH },
                p2: { x: insert.x + cols * cellW, y: insert.y - r * cellH }
            }, true);
        }

        // Create vertical lines
        for (let c = 0; c <= cols; c++) {
            CAD.addEntity({
                type: 'line',
                p1: { x: insert.x + c * cellW, y: insert.y },
                p2: { x: insert.x + c * cellW, y: insert.y - rows * cellH }
            }, true);
        }

        UI.log(`TABLE: Created ${rows}x${cols} table (${cellW}x${cellH} cells).`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- COPYBASE ---
    handleCopyBaseClick(point) {
        const state = CAD;

        if (state.cmdOptions.copybaseAction && state.points.length === 0) {
            // Base point specified
            state.points.push(point);
            const selected = CAD.getSelectedEntities();
            CAD.clipboard = selected.map(e => JSON.parse(JSON.stringify(e)));
            CAD.clipboardBasePoint = { ...point };
            UI.log(`COPYBASE: ${selected.length} object(s) copied with base point (${point.x.toFixed(2)}, ${point.y.toFixed(2)}).`);
            this.finishCommand();
        }
    },

    // --- PASTEBLOCK ---
    handlePasteBlockClick(point) {
        if (!CAD.clipboard || CAD.clipboard.length === 0) {
            UI.log('PASTEBLOCK: Nothing to paste.', 'error');
            this.finishCommand();
            return;
        }

        const basePoint = CAD.clipboardBasePoint || { x: 0, y: 0 };
        const dx = point.x - basePoint.x;
        const dy = point.y - basePoint.y;

        // Create a block from clipboard, insert at click point
        const blockName = `PastedBlock_${Date.now()}`;
        const blockEntities = CAD.clipboard.map(e => {
            const clone = JSON.parse(JSON.stringify(e));
            delete clone.id;
            return clone;
        });

        CAD.addBlock(blockName, basePoint, blockEntities);
        CAD.addEntity({
            type: 'block',
            blockName: blockName,
            insertPoint: { ...point },
            scale: { x: 1, y: 1 },
            rotation: 0
        });

        UI.log(`PASTEBLOCK: Pasted as block "${blockName}" at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}).`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- REVERSE ---
    executeReverse() {
        const selected = CAD.getSelectedEntities();
        if (selected.length === 0) {
            UI.log('REVERSE: No objects selected.', 'error');
            this.finishCommand();
            return;
        }

        CAD.saveUndoState('REVERSE');
        let count = 0;

        selected.forEach(ent => {
            if (ent.type === 'polyline' && ent.points) {
                ent.points.reverse();
                count++;
            } else if (ent.type === 'line') {
                const temp = { ...ent.p1 };
                ent.p1 = { ...ent.p2 };
                ent.p2 = temp;
                count++;
            } else if (ent.type === 'arc') {
                const temp = ent.start;
                ent.start = ent.end;
                ent.end = temp;
                count++;
            }
        });

        UI.log(`REVERSE: ${count} object(s) reversed.`);
        this.finishCommand();
        Renderer.draw();
    },

    // --- SELECT PREVIOUS ---
    executeSelectPrevious() {
        if (CAD._previousSelection && CAD._previousSelection.length > 0) {
            CAD.selectedIds = [...CAD._previousSelection];
            UI.log(`${CAD.selectedIds.length} object(s) re-selected from previous selection.`);
            UI.updateSelectionRibbon();
        } else {
            UI.log('SELECTPREVIOUS: No previous selection.', 'error');
        }
        this.finishCommand();
        Renderer.draw();
    },

    // ==========================================
    // INPUT HANDLING
    // ==========================================

    handleInput(input) {
        const state = CAD;
        input = input.trim();
        const inputLower = input.toLowerCase();

        if (typeof Lisp !== 'undefined' && Lisp.pendingInput) {
            const lispType = CAD.lispInputType;
            if (lispType === 'point' || lispType === 'corner') {
                const basePoint = Lisp.inputBasePoint || null;
                const coord = Utils.parseCoordInput(input, basePoint);
                if (coord) {
                    Lisp.handleUserInput(coord);
                } else {
                    UI.log('Invalid point. Use x,y format.', 'error');
                }
                return true;
            }
            if (lispType === 'dist' || lispType === 'angle' || lispType === 'real') {
                const value = parseFloat(input);
                if (Number.isNaN(value)) {
                    UI.log('Invalid number.', 'error');
                } else {
                    Lisp.handleUserInput(value);
                }
                return true;
            }
            if (lispType === 'int') {
                const value = parseInt(input, 10);
                if (Number.isNaN(value)) {
                    UI.log('Invalid integer.', 'error');
                } else {
                    Lisp.handleUserInput(value);
                }
                return true;
            }
            if (lispType === 'string' || lispType === 'keyword') {
                Lisp.handleUserInput(input);
                return true;
            }
            if (lispType === 'entsel' || lispType === 'ssget') {
                UI.log('Select object(s) on the canvas.', 'prompt');
                return true;
            }
        }

        if (state.activeCmd && inputLower) {
            const active = state.activeCmd;
            // Only block alias-collisions for drawing commands where accidentally
            // starting a new command would be destructive. All other commands
            // (pedit, osnap, layer, etc.) handle their own sub-options and should
            // never have input blocked here.
            const allowed = {
                line: ['c', 'close', 'u', 'undo'],
                polyline: ['a', 'arc', 'l', 'line', 'c', 'close', 'u', 'undo'],
                spline: ['c', 'close', 'u', 'undo'],
                revcloud: ['c', 'close'],
                hatch: ['list']
            };

            if (active === 'polyline') {
                if (inputLower === 'a' || inputLower === 'arc') {
                    state.cmdOptions.polylineMode = 'arc';
                    state.cmdOptions.polylineArcStep = 0;
                    state.cmdOptions.polylineArcEnd = null;
                    UI.log('PLINE: Arc mode. Specify arc endpoint:', 'prompt');
                    return true;
                }
                if (inputLower === 'l' || inputLower === 'line') {
                    state.cmdOptions.polylineMode = 'line';
                    state.cmdOptions.polylineArcStep = 0;
                    state.cmdOptions.polylineArcEnd = null;
                    UI.log('PLINE: Line mode. Specify next point:', 'prompt');
                    return true;
                }
                if (inputLower === 'c' || inputLower === 'close') {
                    this.closeShape();
                    return true;
                }
            }

            if (active === 'spline' && (inputLower === 'c' || inputLower === 'close')) {
                this.closeShape();
                return true;
            }

            if (this.aliases[inputLower] && this.aliases[inputLower] !== active) {
                // Only block for drawing commands that have an explicit allowed list.
                // All other commands (pedit, osnap, layer, hatchedit, dimstyle, chprop,
                // filter, find, text, etc.) accept text sub-options and must not be blocked.
                if (active in allowed) {
                    if (!allowed[active].includes(inputLower)) {
                        UI.log(`${active.toUpperCase()}: Command in progress. Finish or cancel to start another.`, 'error');
                        return true;
                    }
                }
            }
        }

        if (!input) {
            // Enter pressed with empty input

            // TEXT - use default height
            if (state.activeCmd === 'text' && state.step === 1) {
                CAD.cmdOptions.textHeight = CAD.textHeight || 10;
                state.step = 2;
                UI.log('TEXT: Specify rotation angle <0>:', 'prompt');
                return true;
            }

            // TEXT - use default rotation (0)
            if (state.activeCmd === 'text' && state.step === 2) {
                CAD.cmdOptions.textRotation = 0;
                state.step = 3;
                UI.log('TEXT: Enter text:', 'prompt');
                return true;
            }

            // POINT - finish point command on Enter
            if (state.activeCmd === 'point') {
                this.finishCommand();
                return true;
            }

            // Confirm selection during modify commands
            if (state.cmdOptions.needSelection && state.selectedIds.length > 0) {
                // Store for "Previous" option
                UI.previousSelection = [...state.selectedIds];
                state.cmdOptions.needSelection = false;
                UI.hideCanvasSelectionToolbar();
                this.continueCommand(state.activeCmd);
                Renderer.draw();
                return true;
            }

            // Cancel selection mode if no selection made
            if (state.cmdOptions.needSelection && state.selectedIds.length === 0) {
                UI.log('No objects selected.');
                this.finishCommand(true);
                return true;
            }

            if (state.activeCmd === 'osnap') {
                CAD.osnapEnabled = !CAD.osnapEnabled;
                UI.log(`OSNAP: ${CAD.osnapEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }

            if (state.activeCmd === 'polar') {
                CAD.polarEnabled = !CAD.polarEnabled;
                UI.log(`POLAR: ${CAD.polarEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }

            if (state.activeCmd === 'offset' && state.step === 0) {
                state.step = 1;
                UI.log(`Offset distance: ${CAD.offsetDist.toFixed(4)}`);
                UI.log('OFFSET: Select object to offset:', 'prompt');
                return true;
            }

            if (state.activeCmd === 'scale' && state.step === 1 && state.cmdOptions.scaleMode === 'factor') {
                const scaleFactor = CAD.lastScaleFactor || 1;
                this.applyScale(state.points[0], scaleFactor, state.cmdOptions.scaleCopy);
                return true;
            }

            if (state.activeCmd === 'imageattach' && state.step === 1) {
                const scaleFactor = CAD.imageAttachScale || 1;
                state.cmdOptions.imageScale = scaleFactor;
                state.step = 2;
                UI.log(`IMAGEATTACH: Specify rotation angle <${CAD.imageAttachRotation}>:`, 'prompt');
                return true;
            }

            if (state.activeCmd === 'imageattach' && state.step === 2) {
                const rotation = CAD.imageAttachRotation || 0;
                state.cmdOptions.imageRotation = rotation;
                this.createImageEntity(state.cmdOptions.imageInsert, state.cmdOptions.imageScale, rotation);
                return true;
            }

            if (state.activeCmd === 'polyline' && state.points.length >= 2) {
                // Finish polyline, include bulges if any arcs were drawn
                const bulges = state.cmdOptions.polylineBulges || [];
                const hasBulges = bulges.some(b => b && Math.abs(b) > 1e-10);
                const entityData = {
                    type: 'polyline',
                    points: [...state.points]
                };
                if (hasBulges) {
                    entityData.bulges = [...bulges];
                }
                CAD.addEntity(entityData);
                UI.log('Polyline created.');
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'spline' && state.points.length >= 2) {
                // Finish spline (create as smooth polyline for now)
                CAD.addEntity({
                    type: 'polyline',
                    points: [...state.points],
                    isSpline: true
                });
                UI.log('Spline created.');
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'trim' && state.cmdOptions.selectingEdges) {
                state.cmdOptions.selectingEdges = false;
                UI.log('TRIM: Select object to trim:', 'prompt');
                return true;
            }

            if (state.activeCmd === 'area' && state.points.length >= 3) {
                const area = Math.abs(Utils.polygonArea(state.points));
                const perimeter = state.points.reduce((sum, p, i) => {
                    const next = state.points[(i + 1) % state.points.length];
                    return sum + Utils.dist(p, next);
                }, 0);
                UI.log(`Area = ${area.toFixed(4)}, Perimeter = ${perimeter.toFixed(4)}`);
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            // Polar array - accept default angle with Enter
            if (state.activeCmd === 'arraypolar' && state.cmdOptions.waitingForAngle) {
                this.completePolarArray();
                Renderer.draw();
                return true;
            }

            // Polar array - accept default items with Enter
            if (state.activeCmd === 'arraypolar' && state.cmdOptions.waitingForItems) {
                state.cmdOptions.waitingForItems = false;
                state.cmdOptions.waitingForAngle = true;
                UI.log('ARRAYPOLAR: Specify angle to fill <360>:', 'prompt');
                return true;
            }

            if (state.activeCmd === 'imageattach' && state.step === 1) {
                this.createImageEntity(state.cmdOptions.imageInsert, this.getImageDefaultCorner());
                return true;
            }

            // INSERT - accept default scale with Enter
            if (state.activeCmd === 'insert' && state.cmdOptions.waitingForScale) {
                state.cmdOptions.insertScale = { x: 1, y: 1 };
                state.cmdOptions.waitingForScale = false;
                state.cmdOptions.waitingForRotation = true;
                UI.log(`INSERT: Specify rotation angle <0>:`, 'prompt');
                return true;
            }

            // INSERT - accept default rotation with Enter
            if (state.activeCmd === 'insert' && state.cmdOptions.waitingForRotation) {
                state.cmdOptions.insertRotation = 0;
                state.cmdOptions.waitingForRotation = false;
                UI.log('INSERT: Specify insertion point:', 'prompt');
                return true;
            }

            // INSERT - finish on empty Enter during placement
            if (state.activeCmd === 'insert' && state.cmdOptions.insertBlockName && !state.cmdOptions.waitingForScale && !state.cmdOptions.waitingForRotation) {
                this.finishCommand(true);
                return true;
            }

            // WIPEOUT - finish on Enter
            if (state.activeCmd === 'wipeout' && state.points.length >= 3) {
                this.createWipeout();
                return true;
            }

            // REVCLOUD - accept default arc length on Enter
            if (state.activeCmd === 'revcloud' && state.step === 0) {
                state.step = 1;
                UI.log('REVCLOUD: Specify first point:', 'prompt');
                return true;
            }

            // REVCLOUD - close on Enter
            if (state.activeCmd === 'revcloud' && state.points.length >= 3) {
                this.createRevcloud(state.points);
                return true;
            }

            // MATCHPROP - finish on Enter
            if (state.activeCmd === 'matchprop' && state.cmdOptions.matchSource) {
                this.finishCommand();
                return true;
            }

            // VIEW - toggle default on enter
            if (state.activeCmd === 'view') {
                this.listNamedViews();
                return true;
            }

            // SOLID - finish on Enter (need 3-4 points)
            if (state.activeCmd === 'solid' && state.points.length >= 3) {
                this.createSolidEntity();
                return true;
            }

            // FILTER - default to All on Enter
            if (state.activeCmd === 'filter' && CAD.cmdOptions.filterStep === 'mode') {
                this.executeFilterAll();
                return true;
            }

            // JUSTIFYTEXT - default to Left on Enter
            if (state.activeCmd === 'justifytext' && !state.cmdOptions.needSelection) {
                this.executeJustifyText('left');
                return true;
            }

            // ALIGN - finish or scale prompt
            if (state.activeCmd === 'align' && state.step === 2) {
                this.executeAlign(false);
                return true;
            }

            // QDIM - place dimension line
            if (state.activeCmd === 'qdim' && state.cmdOptions.qdimReady) {
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            // GROUP - auto-name on empty enter
            if (state.activeCmd === 'group' && state.cmdOptions.groupStep === 'name') {
                this.executeGroup(`Group_${Date.now()}`);
                return true;
            }

            // TABLE - use defaults on enter for dimension prompts
            if (state.activeCmd === 'table' && ['rows', 'cols', 'cellw', 'cellh'].includes(state.cmdOptions.tableStep)) {
                if (state.cmdOptions.tableStep === 'rows') {
                    state.cmdOptions.tableStep = 'cols';
                    UI.log(`TABLE: Enter number of columns <${state.cmdOptions.tableCols}>:`, 'prompt');
                } else if (state.cmdOptions.tableStep === 'cols') {
                    state.cmdOptions.tableStep = 'cellw';
                    UI.log(`TABLE: Enter cell width <${state.cmdOptions.tableCellW}>:`, 'prompt');
                } else if (state.cmdOptions.tableStep === 'cellw') {
                    state.cmdOptions.tableStep = 'cellh';
                    UI.log(`TABLE: Enter cell height <${state.cmdOptions.tableCellH}>:`, 'prompt');
                } else if (state.cmdOptions.tableStep === 'cellh') {
                    this.createTable();
                }
                return true;
            }

            if (state.activeCmd === 'leader' && state.step === 2) {
                UI.log('LEADER: Text required to finish leader.', 'error');
                return true;
            }

            // New AutoCAD LT feature empty-input handlers
            if (state.activeCmd === 'mleader' && state.step === 2) {
                UI.log('MLEADER: Text required to finish multileader.', 'error');
                return true;
            }

            if (state.activeCmd === 'trace' && state.cmdOptions.traceStep === 'width') {
                state.cmdOptions.traceStep = 'points';
                UI.log(`TRACE: Width = ${state.cmdOptions.traceWidth}. Specify first point:`, 'prompt');
                return true;
            }

            if (state.activeCmd === 'tolerance') {
                const tStep = state.cmdOptions.toleranceStep;
                if (tStep === 'datum1' || tStep === 'datum2' || tStep === 'datum3') {
                    // Skip optional datum on Enter
                    this.handleToleranceInput('');
                    return true;
                }
                if (tStep === 'symbol' || tStep === 'value1') {
                    UI.log('TOLERANCE: Value required.', 'error');
                    return true;
                }
            }

            if (state.activeCmd === 'pagesetup') {
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'quickcalc') {
                UI.log('Enter expression or "exit":', 'prompt');
                return true;
            }

            if (state.activeCmd === 'mleaderstyle' || state.activeCmd === 'mlstyle') {
                this.finishCommand();
                return true;
            }

            if (state.activeCmd) {
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            return false;
        }

        if (state.activeCmd === 'style') {
            if (state.cmdOptions.styleStep === 'font') {
                // Setting font for new style
                const styleName = state.cmdOptions.newStyleName;
                CAD.textStyles[styleName] = { font: input || 'Arial, sans-serif', bold: false, italic: false };
                CAD.currentTextStyle = styleName;
                UI.log(`Style "${styleName}" created and set as current.`);
                this.finishCommand();
                return true;
            }
            const upper = input.toUpperCase();
            if (upper === 'NEW') {
                state.cmdOptions.styleStep = 'name';
                UI.log('STYLE: Enter new style name:', 'prompt');
                return true;
            }
            if (state.cmdOptions.styleStep === 'name') {
                state.cmdOptions.newStyleName = input;
                state.cmdOptions.styleStep = 'font';
                UI.log('STYLE: Enter font family (e.g. Arial, Times New Roman, Courier New):', 'prompt');
                return true;
            }
            // Try to set existing style
            if (CAD.textStyles[input] || CAD.textStyles[upper]) {
                const name = CAD.textStyles[input] ? input : upper;
                CAD.currentTextStyle = name;
                UI.log(`Text style set to "${name}" (${CAD.textStyles[name].font}).`);
            } else {
                UI.log(`Style "${input}" not found. Use NEW to create.`, 'error');
            }
            this.finishCommand();
            return true;
        }

        if (state.activeCmd === 'dimstyle') {
            const step = state.cmdOptions.dimStyleStep || 'prompt';
            if (step === 'prompt') {
                const option = input.toLowerCase();
                if (!option || option === 'set' || option === 's') {
                    state.cmdOptions.dimStyleStep = 'set';
                    UI.log('DIMSTYLE: Enter style name to set:', 'prompt');
                } else if (option === 'list' || option === 'l') {
                    const styles = CAD.dimStyles.map(style => style.name).join(', ') || 'None';
                    UI.log(`DIMSTYLE: Available styles: ${styles}`);
                    this.finishCommand(true);
                } else if (option === 'save' || option === 'sa') {
                    state.cmdOptions.dimStyleStep = 'save';
                    UI.log('DIMSTYLE: Enter new style name to save current settings:', 'prompt');
                } else {
                    UI.log('DIMSTYLE: Invalid option. Use List/Set/Save.', 'error');
                }
                return true;
            }
            if (step === 'set') {
                if (!CAD.applyDimStyle(input)) {
                    UI.log(`DIMSTYLE: Style "${input}" not found.`, 'error');
                } else {
                    UI.log(`DIMSTYLE: Current style set to "${CAD.currentDimStyle}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
            if (step === 'save') {
                if (!input) {
                    UI.log('DIMSTYLE: Enter a style name.', 'error');
                    return true;
                }
                CAD.saveCurrentDimStyle(input);
                CAD.applyDimStyle(input);
                UI.log(`DIMSTYLE: Style "${input}" saved.`, 'success');
                this.finishCommand(true);
                return true;
            }
        }

        if (state.activeCmd === 'layout') {
            const step = state.cmdOptions.layoutStep || 'prompt';
            if (step === 'prompt') {
                const option = input.toLowerCase();
                if (!option || option === 'set' || option === 's') {
                    state.cmdOptions.layoutStep = 'set';
                    UI.log('LAYOUT: Enter layout name to set current:', 'prompt');
                } else if (option === 'new' || option === 'n') {
                    state.cmdOptions.layoutStep = 'new';
                    UI.log('LAYOUT: Enter new layout name:', 'prompt');
                } else if (option === 'list' || option === 'l') {
                    const layouts = CAD.layouts.map(layout => layout.name).join(', ');
                    UI.log(`LAYOUT: Available layouts: ${layouts}`);
                    this.finishCommand(true);
                } else if (option === 'delete' || option === 'd') {
                    state.cmdOptions.layoutStep = 'delete';
                    UI.log('LAYOUT: Enter layout name to delete:', 'prompt');
                } else {
                    UI.log('LAYOUT: Invalid option. Use New/Set/List/Delete.', 'error');
                }
                return true;
            }
            if (step === 'new') {
                if (!input) {
                    UI.log('LAYOUT: Enter a layout name.', 'error');
                    return true;
                }
                if (!CAD.addLayout(input)) {
                    UI.log(`LAYOUT: Layout "${input}" already exists.`, 'error');
                } else {
                    CAD.setCurrentLayout(input);
                    UI.renderLayoutTabs();
                    Renderer.draw();
                    UI.log(`LAYOUT: Created "${input}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
            if (step === 'set') {
                if (!CAD.setCurrentLayout(input)) {
                    UI.log(`LAYOUT: Layout "${input}" not found.`, 'error');
                } else {
                    UI.renderLayoutTabs();
                    Renderer.draw();
                    UI.log(`LAYOUT: Current layout set to "${input}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
            if (step === 'delete') {
                if (!CAD.removeLayout(input)) {
                    UI.log(`LAYOUT: Unable to delete layout "${input}".`, 'error');
                } else {
                    UI.renderLayoutTabs();
                    Renderer.draw();
                    UI.log(`LAYOUT: Deleted "${input}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
        }

        if (state.activeCmd === 'layerstate') {
            const step = state.cmdOptions.layerStateStep || 'prompt';
            if (step === 'prompt') {
                const option = input.toLowerCase();
                if (!option || option === 'restore' || option === 'r') {
                    state.cmdOptions.layerStateStep = 'restore';
                    UI.log('LAYERSTATE: Enter layer state name to restore:', 'prompt');
                } else if (option === 'save' || option === 's') {
                    state.cmdOptions.layerStateStep = 'save';
                    UI.log('LAYERSTATE: Enter name to save current layer state:', 'prompt');
                } else if (option === 'list' || option === 'l') {
                    const names = Object.keys(CAD.layerStates);
                    UI.log(`LAYERSTATE: Available states: ${names.length ? names.join(', ') : 'None'}`);
                    this.finishCommand(true);
                } else if (option === 'delete' || option === 'd') {
                    state.cmdOptions.layerStateStep = 'delete';
                    UI.log('LAYERSTATE: Enter layer state name to delete:', 'prompt');
                } else {
                    UI.log('LAYERSTATE: Invalid option. Use Save/Restore/List/Delete.', 'error');
                }
                return true;
            }
            if (step === 'save') {
                if (!input) {
                    UI.log('LAYERSTATE: Enter a name.', 'error');
                    return true;
                }
                CAD.saveLayerState(input);
                UI.log(`LAYERSTATE: Saved "${input}".`, 'success');
                this.finishCommand(true);
                return true;
            }
            if (step === 'restore') {
                if (!CAD.restoreLayerState(input)) {
                    UI.log(`LAYERSTATE: State "${input}" not found.`, 'error');
                } else {
                    UI.updateLayerUI();
                    Renderer.draw();
                    UI.log(`LAYERSTATE: Restored "${input}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
            if (step === 'delete') {
                if (!CAD.deleteLayerState(input)) {
                    UI.log(`LAYERSTATE: State "${input}" not found.`, 'error');
                } else {
                    UI.log(`LAYERSTATE: Deleted "${input}".`, 'success');
                }
                this.finishCommand(true);
                return true;
            }
        }

        if (state.activeCmd === 'leader' && state.step === 2) {
            this.completeLeaderCommand(input);
            return true;
        }

        // DIVIDE - number of segments input
        if (state.activeCmd === 'divide' && state.cmdOptions.divideTarget) {
            const num = parseInt(input);
            if (!isNaN(num) && num >= 2) {
                this.executeDivide(state.cmdOptions.divideTarget, num);
                return true;
            }
            UI.log('DIVIDE: Enter a valid number (2 or more).', 'error');
            return true;
        }

        // MEASURE - distance input
        if (state.activeCmd === 'measure' && state.cmdOptions.measureTarget) {
            const dist = parseFloat(input);
            if (!isNaN(dist) && dist > 0) {
                this.executeMeasure(state.cmdOptions.measureTarget, dist);
                return true;
            }
            UI.log('MEASURE: Enter a valid positive distance.', 'error');
            return true;
        }

        // REVCLOUD - arc length input
        if (state.activeCmd === 'revcloud' && state.step === 0) {
            const arcLen = parseFloat(input);
            if (!isNaN(arcLen) && arcLen > 0) {
                CAD.cmdOptions.revcloudArcLen = arcLen;
                state.step = 1;
                UI.log('REVCLOUD: Specify first point:', 'prompt');
                return true;
            }
            // If not a number, accept default and start picking
            state.step = 1;
            UI.log('REVCLOUD: Specify first point:', 'prompt');
            return true;
        }

        // VIEW command
        if (state.activeCmd === 'view') {
            const value = input.toLowerCase();
            if (state.cmdOptions.viewAction === 'save') {
                this.saveNamedView(input.trim());
                return true;
            }
            if (state.cmdOptions.viewAction === 'restore') {
                this.restoreNamedView(input.trim());
                return true;
            }
            if (state.cmdOptions.viewAction === 'delete') {
                this.deleteNamedView(input.trim());
                return true;
            }
            if (value === 's' || value === 'save') {
                state.cmdOptions.viewAction = 'save';
                UI.log('VIEW: Enter name for current view:', 'prompt');
                return true;
            }
            if (value === 'r' || value === 'restore') {
                state.cmdOptions.viewAction = 'restore';
                const viewNames = Object.keys(CAD.namedViews || {});
                UI.log(`VIEW: Available views: ${viewNames.length ? viewNames.join(', ') : 'None'}`);
                UI.log('VIEW: Enter view name to restore:', 'prompt');
                return true;
            }
            if (value === 'd' || value === 'delete') {
                state.cmdOptions.viewAction = 'delete';
                UI.log('VIEW: Enter view name to delete:', 'prompt');
                return true;
            }
            if (value === 'l' || value === 'list') {
                this.listNamedViews();
                return true;
            }
            UI.log('VIEW: Unknown option. [Save/Restore/Delete/List]', 'error');
            return true;
        }

        // LAYLCK - lock layer
        if (state.activeCmd === 'laylck') {
            this.lockLayer(input.trim(), true);
            return true;
        }

        // LAYULK - unlock layer
        if (state.activeCmd === 'layulk') {
            this.lockLayer(input.trim(), false);
            return true;
        }

        // DIMORDINATE - axis option
        if (state.activeCmd === 'dimordinate' && state.step === 1) {
            const opt = input.toLowerCase();
            if (opt === 'x' || opt === 'xdatum') {
                CAD.cmdOptions.dimOrdAxis = 'x';
                UI.log('DIMORDINATE: X datum selected. Specify leader endpoint:', 'prompt');
                return true;
            }
            if (opt === 'y' || opt === 'ydatum') {
                CAD.cmdOptions.dimOrdAxis = 'y';
                UI.log('DIMORDINATE: Y datum selected. Specify leader endpoint:', 'prompt');
                return true;
            }
        }

        // ==========================================
        // PHASE 2 INPUT HANDLERS
        // ==========================================

        // LAYDEL
        if (state.activeCmd === 'laydel') {
            this.executeLayDel(input.trim());
            return true;
        }

        // LAYMERGE
        if (state.activeCmd === 'laymerge') {
            if (!state.cmdOptions.mergeSource) {
                state.cmdOptions.mergeSource = input.trim();
                UI.log('LAYMERGE: Enter destination layer name:', 'prompt');
                return true;
            }
            this.executeLayMerge(state.cmdOptions.mergeSource, input.trim());
            return true;
        }

        // FILTER
        if (state.activeCmd === 'filter') {
            return this.handleFilterInput(input);
        }

        // SCALETEXT
        if (state.activeCmd === 'scaletext' && !state.cmdOptions.needSelection) {
            const height = parseFloat(input);
            if (!isNaN(height) && height > 0) {
                this.executeScaleText(height);
                return true;
            }
            UI.log('SCALETEXT: Enter a valid positive height.', 'error');
            return true;
        }

        // JUSTIFYTEXT
        if (state.activeCmd === 'justifytext' && !state.cmdOptions.needSelection) {
            this.executeJustifyText(input.trim());
            return true;
        }

        // FIND
        if (state.activeCmd === 'find') {
            return this.handleFindInput(input);
        }

        // ALIGN
        if (state.activeCmd === 'align' && !state.cmdOptions.needSelection) {
            const opt = input.toLowerCase();
            if (state.step === 2 && (opt === 'y' || opt === 'yes')) {
                this.executeAlign(true);
                return true;
            }
            if (state.step === 2 && (opt === 'n' || opt === 'no' || opt === '')) {
                this.executeAlign(false);
                return true;
            }
        }

        // SOLID - number of points input
        if (state.activeCmd === 'solid' && state.points.length >= 3) {
            // Just treat text input as done
            this.createSolidEntity();
            return true;
        }

        // DIMSPACE
        if (state.activeCmd === 'dimspace' && state.cmdOptions.dimspaceBase) {
            const spacing = parseFloat(input);
            if (!isNaN(spacing) && spacing > 0) {
                this.executeDimSpace(spacing);
                return true;
            }
            UI.log('DIMSPACE: Enter a valid positive spacing value.', 'error');
            return true;
        }

        if (state.activeCmd === 'osnap') {
            const value = input.toLowerCase();
            const modes = {
                end: 'endpoint',
                endpoint: 'endpoint',
                mid: 'midpoint',
                midpoint: 'midpoint',
                cen: 'center',
                center: 'center',
                int: 'intersection',
                intersection: 'intersection',
                per: 'perpendicular',
                perpendicular: 'perpendicular',
                tan: 'tangent',
                tangent: 'tangent',
                nea: 'nearest',
                nearest: 'nearest',
                qua: 'quadrant',
                quadrant: 'quadrant',
                nod: 'node',
                node: 'node'
            };
            if (value === 'on' || value === 'off') {
                CAD.osnapEnabled = value === 'on';
                UI.log(`OSNAP: ${CAD.osnapEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            if (value === 'all') {
                Object.keys(CAD.snapModes).forEach(mode => {
                    CAD.snapModes[mode] = true;
                });
                UI.log('OSNAP: All modes enabled.');
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            if (value === 'none') {
                Object.keys(CAD.snapModes).forEach(mode => {
                    CAD.snapModes[mode] = false;
                });
                UI.log('OSNAP: All modes disabled.');
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            if (value === 'list') {
                const enabled = Object.entries(CAD.snapModes)
                    .filter(([, enabled]) => enabled)
                    .map(([mode]) => mode);
                UI.log(`OSNAP: Enabled modes: ${enabled.length ? enabled.join(', ') : 'None'}.`, 'prompt');
                this.finishCommand();
                return true;
            }
            const modeKey = modes[value];
            if (modeKey) {
                CAD.snapModes[modeKey] = !CAD.snapModes[modeKey];
                UI.log(`OSNAP: ${modeKey} ${CAD.snapModes[modeKey] ? 'enabled' : 'disabled'}.`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            UI.log(`OSNAP: Unknown option "${input}".`, 'error');
            return true;
        }

        if (state.activeCmd === 'polar') {
            const value = input.toLowerCase();
            if (value === 'on' || value === 'off') {
                CAD.polarEnabled = value === 'on';
                UI.log(`POLAR: ${CAD.polarEnabled ? 'ON' : 'OFF'}`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            if (value === 'angle') {
                UI.log(`POLAR: Enter new angle <${CAD.polarAngle}>:`, 'prompt');
                return true;
            }
            const angle = parseFloat(input);
            if (!Number.isNaN(angle)) {
                CAD.polarAngle = Math.abs(angle) || 45;
                UI.log(`POLAR: Angle set to ${CAD.polarAngle}`);
                UI.updateStatusBar();
                this.finishCommand();
                return true;
            }
            UI.log(`POLAR: Unknown option "${input}".`, 'error');
            return true;
        }

        // Check for coordinate input
        const lastPoint = state.points.length > 0 ? state.points[state.points.length - 1] : null;
        const coord = Utils.parseCoordInput(input, lastPoint);

        if (coord && state.activeCmd) {
            this.handleClick(coord);
            return true;
        }

        // Check for numeric input (for offset distance, scale factor, etc.)
        const num = parseFloat(input);
        if (!isNaN(num)) {
            if (state.activeCmd === 'offset' && state.step === 0) {
                CAD.offsetDist = Math.abs(num);
                state.step = 1;
                UI.log('OFFSET: Select object to offset:', 'prompt');
                return true;
            }

            if (state.activeCmd === 'scale' && state.step === 1) {
                if (state.cmdOptions.scaleMode === 'reference') {
                    // Reference mode - first number is reference length
                    state.cmdOptions.refLength = num;
                    UI.log(`Reference length: ${num}`);
                    UI.log('SCALE: Specify new length:', 'prompt');
                    state.step = 5; // Special step for new length input
                } else {
                    // Direct scale factor input
                    this.applyScale(state.points[0], num, state.cmdOptions.scaleCopy);
                }
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'imageattach' && state.step === 1) {
                const scale = Math.abs(num) || 1;
                state.cmdOptions.imageScale = scale;
                CAD.imageAttachScale = scale;
                state.step = 2;
                UI.log(`IMAGEATTACH: Specify rotation angle <${CAD.imageAttachRotation}>:`, 'prompt');
                return true;
            }

            if (state.activeCmd === 'imageattach' && state.step === 2) {
                const rotation = num;
                state.cmdOptions.imageRotation = rotation;
                CAD.imageAttachRotation = rotation;
                this.createImageEntity(state.cmdOptions.imageInsert, state.cmdOptions.imageScale, rotation);
                return true;
            }

            if (state.activeCmd === 'scale' && state.step === 5) {
                // Reference mode - new length entered after reference length
                const refLen = state.cmdOptions.refLength || 1;
                if (refLen > 0) {
                    const scale = num / refLen;
                    this.applyScale(state.points[0], scale, state.cmdOptions.scaleCopy);
                }
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'scale' && state.step === 3 && state.cmdOptions.scaleMode === 'reference') {
                // Reference mode by points - numeric new length input
                const refDist = Utils.dist(state.points[1], state.points[2]);
                if (refDist > 0) {
                    const scale = num / refDist;
                    this.applyScale(state.points[0], scale, state.cmdOptions.scaleCopy);
                }
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'rotate' && state.step === 1) {
                // Direct angle input
                const angle = Utils.degToRad(num);
                CAD.saveUndoState('Rotate');
                state.getSelectedEntities().forEach(entity => {
                    const rotated = Geometry.rotateEntity(entity, state.points[0], angle);
                    CAD.updateEntity(entity.id, rotated, true);
                });
                UI.log(`${state.selectedIds.length} objects rotated ${num.toFixed(2)}°`);
                state.clearSelection();
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            if (state.activeCmd === 'circle' && state.step === 1) {
                // Radius input for circle
                CAD.addEntity({
                    type: 'circle',
                    center: { ...state.points[0] },
                    r: num
                });
                UI.log(`Circle created with radius ${num.toFixed(4)}`);
                this.finishCommand();
                Renderer.draw();
                return true;
            }

            // TEXT - height input
            if (state.activeCmd === 'text' && state.step === 1) {
                CAD.cmdOptions.textHeight = num;
                state.step = 2;
                UI.log('TEXT: Specify rotation angle <0>:', 'prompt');
                return true;
            }

            // TEXT - rotation input
            if (state.activeCmd === 'text' && state.step === 2) {
                CAD.cmdOptions.textRotation = num;
                state.step = 3;
                UI.log('TEXT: Enter text:', 'prompt');
                return true;
            }

            // MTEXT - height input
            if (state.activeCmd === 'mtext' && state.cmdOptions.waitingForHeight) {
                CAD.cmdOptions.textHeight = num;
                state.cmdOptions.waitingForHeight = false;
                UI.log('MTEXT: Specify opposite corner:', 'prompt');
                return true;
            }

            // POINT - set PDMODE
            if (state.activeCmd === 'point' && input.toLowerCase() === 's') {
                const mode = prompt('Enter PDMODE (0=dot, 2=+, 3=X, 32=square, 64=circle):', CAD.pointDisplayMode);
                if (mode !== null) {
                    CAD.pointDisplayMode = parseInt(mode) || 3;
                    UI.log(`Point display mode set to ${CAD.pointDisplayMode}`);
                    Renderer.draw();
                }
                return true;
            }

            // OFFSETGAPTYPE setting
            if (state.activeCmd === 'offsetgaptype') {
                const val = Math.max(0, Math.min(2, Math.round(num)));
                CAD.offsetGapType = val;
                const types = ['Extend', 'Fillet', 'Chamfer'];
                UI.log(`OFFSETGAPTYPE set to ${val} (${types[val]})`);
                this.finishCommand();
                return true;
            }

            // PDMODE setting
            if (state.activeCmd === 'pdmode') {
                CAD.pointDisplayMode = Math.round(num);
                UI.log(`PDMODE set to ${CAD.pointDisplayMode}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            // PDSIZE setting
            if (state.activeCmd === 'pdsize') {
                CAD.pointDisplaySize = Math.abs(num) || 5;
                UI.log(`PDSIZE set to ${CAD.pointDisplaySize}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            // TEXTSIZE setting
            if (state.activeCmd === 'textsize') {
                CAD.textHeight = Math.abs(num) || 10;
                UI.log(`TEXTSIZE set to ${CAD.textHeight}`);
                this.finishCommand();
                return true;
            }

            // DIMTXT setting (dimension text height)
            if (state.activeCmd === 'dimtxt') {
                CAD.dimTextHeight = Math.abs(num) || 2.5;
                CAD.saveCurrentDimStyle(CAD.currentDimStyle);
                UI.log(`DIMTXT set to ${CAD.dimTextHeight}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            // DIMASZ setting (dimension arrow size)
            if (state.activeCmd === 'dimasz') {
                CAD.dimArrowSize = Math.abs(num) || 2.5;
                CAD.saveCurrentDimStyle(CAD.currentDimStyle);
                UI.log(`DIMASZ set to ${CAD.dimArrowSize}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            // DIMSCALE setting (overall dimension scale)
            if (state.activeCmd === 'dimscale') {
                CAD.dimScale = Math.abs(num) || 1;
                CAD.saveCurrentDimStyle(CAD.currentDimStyle);
                UI.log(`DIMSCALE set to ${CAD.dimScale}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            if (state.activeCmd === 'dimdec') {
                CAD.dimPrecision = Math.max(0, Math.round(num));
                CAD.saveCurrentDimStyle(CAD.currentDimStyle);
                UI.log(`DIMDEC set to ${CAD.dimPrecision}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            if (state.activeCmd === 'ltscale') {
                CAD.lineTypeScale = Math.abs(num) || 1;
                UI.log(`LTSCALE set to ${CAD.lineTypeScale}`);
                Renderer.draw();
                this.finishCommand();
                return true;
            }

            // Polygon - number of sides
            if (state.activeCmd === 'polygon' && state.step === 0) {
                state.cmdOptions.sides = Math.max(3, Math.round(num));
                state.step = 1;
                UI.log(`POLYGON: ${state.cmdOptions.sides} sides. Specify center of polygon:`, 'prompt');
                return true;
            }

            // Array - number of rows
            if ((state.activeCmd === 'array' || state.activeCmd === 'arrayrect') && state.step === 0) {
                state.cmdOptions.arrayRows = Math.max(1, Math.round(num));
                UI.log(`ARRAY: Enter number of columns <1>:`, 'prompt');
                return true;
            }

            // Array - number of columns
            if ((state.activeCmd === 'array' || state.activeCmd === 'arrayrect') &&
                state.cmdOptions.arrayRows && !state.cmdOptions.arrayCols) {
                state.cmdOptions.arrayCols = Math.max(1, Math.round(num));
                UI.log('ARRAY: Specify first corner of array:', 'prompt');
                return true;
            }

            // Polar array - number of items
            if (state.activeCmd === 'arraypolar' && state.cmdOptions.waitingForItems) {
                state.cmdOptions.arrayItems = Math.max(2, Math.round(num));
                state.cmdOptions.waitingForItems = false;
                state.cmdOptions.waitingForAngle = true;
                UI.log('ARRAYPOLAR: Specify angle to fill <360>:', 'prompt');
                return true;
            }

            // Polar array - angle to fill
            if (state.activeCmd === 'arraypolar' && state.cmdOptions.waitingForAngle) {
                state.cmdOptions.arrayAngle = num;
                state.cmdOptions.waitingForAngle = false;
                this.completePolarArray();
                Renderer.draw();
                return true;
            }

            // Donut - inner diameter
            if (state.activeCmd === 'donut' && !state.cmdOptions.innerSet) {
                state.cmdOptions.donutInner = Math.abs(num);
                state.cmdOptions.innerSet = true;
                UI.log(`DONUT: Specify outside diameter <${state.cmdOptions.donutOuter}>:`, 'prompt');
                return true;
            }

            // Donut - outer diameter
            if (state.activeCmd === 'donut' && state.cmdOptions.innerSet && !state.cmdOptions.outerSet) {
                state.cmdOptions.donutOuter = Math.abs(num);
                state.cmdOptions.outerSet = true;
                UI.log('DONUT: Specify center of donut:', 'prompt');
                return true;
            }

            // INSERT - scale factor input
            if (state.activeCmd === 'insert' && state.cmdOptions.waitingForScale) {
                state.cmdOptions.insertScale = { x: num, y: num };
                state.cmdOptions.waitingForScale = false;
                state.cmdOptions.waitingForRotation = true;
                UI.log(`INSERT: Specify rotation angle <0>:`, 'prompt');
                return true;
            }

            // INSERT - rotation angle input
            if (state.activeCmd === 'insert' && state.cmdOptions.waitingForRotation) {
                state.cmdOptions.insertRotation = num;
                state.cmdOptions.waitingForRotation = false;
                UI.log('INSERT: Specify insertion point:', 'prompt');
                return true;
            }
        }

        if (state.activeCmd === 'qselect' && state.cmdOptions.waitingForQselectType) {
            const query = input.toLowerCase();
            if (query === 'list') {
                const types = this.getSelectableTypes();
                UI.log(`QSELECT types: ${types.length ? types.join(', ') : 'None'}`, 'prompt');
                return true;
            }
            state.cmdOptions.waitingForQselectType = false;
            this.selectByType(query);
            this.finishCommand();
            return true;
        }

        if (state.activeCmd === 'layer') {
            const tokens = input.trim().split(/\s+/);
            const action = tokens[0]?.toLowerCase();
            const name = tokens.slice(1).join(' ');
            if (!action) {
                UI.log('LAYER: Enter option [New/Set/On/Off/List]:', 'prompt');
                return true;
            }
            if (action === 'list') {
                CAD.layers.forEach(layer => {
                    const status = [
                        layer.visible ? 'On' : 'Off',
                        layer.frozen ? 'Frozen' : 'Thawed',
                        layer.locked ? 'Locked' : 'Unlocked'
                    ].join(', ');
                    UI.log(`  ${layer.name} (${status})`);
                });
                this.finishCommand();
                return true;
            }
            if (action === 'new') {
                if (!name) {
                    UI.log('LAYER: Enter new layer name.', 'error');
                    return true;
                }
                const layer = CAD.addLayer(name);
                if (!layer) {
                    UI.log(`LAYER: Layer "${name}" already exists.`, 'error');
                    return true;
                }
                CAD.setCurrentLayer(name);
                UI.updateLayerUI();
                UI.log(`LAYER: Layer "${name}" created and set current.`);
                this.finishCommand();
                return true;
            }
            if (action === 'set') {
                if (!name) {
                    UI.log('LAYER: Enter layer name to set current.', 'error');
                    return true;
                }
                if (!CAD.setCurrentLayer(name)) {
                    UI.log(`LAYER: Layer "${name}" not found.`, 'error');
                    return true;
                }
                UI.updateLayerUI();
                UI.log(`LAYER: Current layer set to "${name}".`);
                this.finishCommand();
                return true;
            }
            if (action === 'on' || action === 'off') {
                if (!name) {
                    UI.log(`LAYER: Enter layer name to turn ${action}.`, 'error');
                    return true;
                }
                const layer = CAD.getLayer(name);
                if (!layer) {
                    UI.log(`LAYER: Layer "${name}" not found.`, 'error');
                    return true;
                }
                layer.visible = action === 'on';
                UI.updateLayerUI();
                Renderer.draw();
                UI.log(`LAYER: Layer "${name}" turned ${action}.`);
                this.finishCommand();
                return true;
            }
            if (CAD.setCurrentLayer(input.trim())) {
                UI.updateLayerUI();
                UI.log(`LAYER: Current layer set to "${input.trim()}".`);
                this.finishCommand();
                return true;
            }
            UI.log(`LAYER: Unknown option "${input}".`, 'error');
            return true;
        }

        if (['layfrz', 'laythw', 'layon', 'layoff'].includes(state.activeCmd)) {
            const value = input.trim();
            const targetName = value ? value : CAD.currentLayer;
            const layer = CAD.getLayer(targetName);
            if (!layer) {
                UI.log(`LAYER: Layer "${targetName}" not found.`, 'error');
                return true;
            }
            if (state.activeCmd === 'layfrz') {
                layer.frozen = true;
            } else if (state.activeCmd === 'laythw') {
                layer.frozen = false;
            } else if (state.activeCmd === 'layoff') {
                layer.visible = false;
            } else {
                layer.visible = true;
            }
            UI.updateLayerUI();
            Renderer.draw();
            if (state.activeCmd === 'layfrz') {
                UI.log(`LAYER: Layer "${targetName}" frozen.`);
            } else if (state.activeCmd === 'laythw') {
                UI.log(`LAYER: Layer "${targetName}" thawed.`);
            } else {
                UI.log(`LAYER: Layer "${targetName}" ${layer.visible ? 'On' : 'Off'}.`);
            }
            this.finishCommand();
            return true;
        }

        if (state.activeCmd === 'linetype') {
            const value = input.toLowerCase();
            const options = this.getLinetypeOptions();
            if (value === 'list') {
                UI.log(`LINETYPE options: ${options.join(', ')}`, 'prompt');
                return true;
            }
            if (!options.includes(value)) {
                UI.log(`LINETYPE: Unknown linetype "${input}". Use LIST to see options.`, 'error');
                return true;
            }
            if (state.selectedIds.length > 0) {
                CAD.saveUndoState('Set Linetype');
                state.selectedIds.forEach(id => {
                    CAD.updateEntity(id, { lineType: value }, true);
                });
                UI.log(`LINETYPE set to ${value} for ${state.selectedIds.length} object(s).`);
                Renderer.draw();
            } else {
                CAD.lineType = value;
                UI.log(`LINETYPE set to ${CAD.lineType}.`);
            }
            this.finishCommand();
            return true;
        }

        // BLOCK - name input
        if (state.activeCmd === 'block' && state.cmdOptions.waitingForName) {
            const blockName = input.trim();
            if (!blockName) {
                UI.log('BLOCK: Invalid block name.', 'error');
                return true;
            }
            if (CAD.getBlock(blockName)) {
                UI.log(`BLOCK: Block "${blockName}" already exists. Enter a different name:`, 'prompt');
                return true;
            }
            state.cmdOptions.blockName = blockName;
            state.cmdOptions.waitingForName = false;
            state.cmdOptions.waitingForBasePoint = true;
            UI.log('BLOCK: Specify base point:', 'prompt');
            return true;
        }

        // INSERT - block name input
        if (state.activeCmd === 'insert' && state.cmdOptions.waitingForBlockName) {
            const blockName = input.trim();
            if (!CAD.getBlock(blockName)) {
                const blockList = CAD.getBlockList();
                UI.log(`INSERT: Block "${blockName}" not found. Available blocks: ${blockList.join(', ')}`, 'error');
                return true;
            }
            state.cmdOptions.insertBlockName = blockName;
            state.cmdOptions.waitingForBlockName = false;
            state.cmdOptions.waitingForScale = true;
            UI.log(`INSERT: Specify scale factor <1>:`, 'prompt');
            return true;
        }

        if (state.activeCmd === 'hatch') {
            const trimmed = input.trim();
            if (!trimmed) {
                UI.log(`Click inside a closed area or select a closed object.`, 'prompt');
                return true;
            }
            const lower = trimmed.toLowerCase();
            const patternShortcuts = { s: 'solid', d: 'diagonal', c: 'cross', o: 'dots', a: 'angle' };

            // Waiting for sub-option input
            if (CAD.cmdOptions.waitingForHatchScale) {
                const val = parseFloat(trimmed);
                if (isNaN(val) || val <= 0) {
                    UI.log('HATCH: Invalid scale. Enter a positive number.', 'error');
                } else {
                    CAD.hatchScale = val;
                    UI.log(`HATCH: Scale set to ${CAD.hatchScale}.`);
                }
                CAD.cmdOptions.waitingForHatchScale = false;
                UI.log(`Pattern=${CAD.hatchPattern.toUpperCase()}, Scale=${CAD.hatchScale}, Angle=${CAD.hatchAngle}°. Click to apply or [Pattern/Scale/Angle]:`, 'prompt');
                return true;
            }
            if (CAD.cmdOptions.waitingForHatchAngle) {
                const val = parseFloat(trimmed);
                if (isNaN(val)) {
                    UI.log('HATCH: Invalid angle. Enter a number in degrees.', 'error');
                } else {
                    CAD.hatchAngle = val;
                    UI.log(`HATCH: Angle set to ${CAD.hatchAngle}°.`);
                }
                CAD.cmdOptions.waitingForHatchAngle = false;
                UI.log(`Pattern=${CAD.hatchPattern.toUpperCase()}, Scale=${CAD.hatchScale}, Angle=${CAD.hatchAngle}°. Click to apply or [Pattern/Scale/Angle]:`, 'prompt');
                return true;
            }
            if (CAD.cmdOptions.waitingForHatchPattern) {
                if (lower === 'list') {
                    UI.log(`HATCH patterns: ${this.getHatchPatternOptions()}`, 'prompt');
                    return true;
                }
                const cleaned = lower.replace(/[\s_-]+/g, '');
                const resolved = patternShortcuts[cleaned] || cleaned;
                this.setHatchPattern(resolved);
                CAD.cmdOptions.waitingForHatchPattern = false;
                UI.log(`Pattern=${CAD.hatchPattern.toUpperCase()}, Scale=${CAD.hatchScale}, Angle=${CAD.hatchAngle}°. Click to apply or [Pattern/Scale/Angle]:`, 'prompt');
                return true;
            }

            // Top-level options
            if (lower === 'p' || lower === 'pattern') {
                CAD.cmdOptions.waitingForHatchPattern = true;
                UI.log(`HATCH: Enter pattern name or [List] <${CAD.hatchPattern}>:`, 'prompt');
                return true;
            }
            if (lower === 'sc' || lower === 'scale') {
                CAD.cmdOptions.waitingForHatchScale = true;
                UI.log(`HATCH: Enter scale factor <${CAD.hatchScale}>:`, 'prompt');
                return true;
            }
            if (lower === 'an' || lower === 'angle') {
                CAD.cmdOptions.waitingForHatchAngle = true;
                UI.log(`HATCH: Enter angle in degrees <${CAD.hatchAngle}>:`, 'prompt');
                return true;
            }
            if (lower === 'list') {
                UI.log(`HATCH patterns: ${this.getHatchPatternOptions()}`, 'prompt');
                return true;
            }

            // Direct pattern entry (backward compat)
            const cleaned = lower.replace(/[\s_-]+/g, '');
            const resolved = patternShortcuts[cleaned] || cleaned;
            if (this.hatchPatterns.includes(resolved) || this.hatchPatternAliases[resolved]) {
                this.setHatchPattern(resolved);
                UI.log(`Pattern=${CAD.hatchPattern.toUpperCase()}, Scale=${CAD.hatchScale}, Angle=${CAD.hatchAngle}°. Click to apply or [Pattern/Scale/Angle]:`, 'prompt');
            } else {
                UI.log(`HATCH: Unknown option "${trimmed}". Try Pattern, Scale, Angle, or List.`, 'error');
            }
            return true;
        }

        // HATCHEDIT command input
        if (state.activeCmd === 'hatchedit') {
            const lower = input.trim().toLowerCase();
            const target = CAD.cmdOptions.hatchEditTarget;

            if (!target) {
                // Waiting for selection
                return false;
            }

            if (CAD.cmdOptions.waitingForHEScale) {
                const val = parseFloat(input.trim());
                if (isNaN(val) || val <= 0) {
                    UI.log('HATCHEDIT: Invalid scale.', 'error');
                } else {
                    CAD.saveUndoState('HatchEdit Scale');
                    CAD.updateEntity(target.id, { scale: val, renderLines: [] }, true);
                    UI.log(`HATCHEDIT: Scale set to ${val}.`);
                    Renderer.draw();
                }
                CAD.cmdOptions.waitingForHEScale = false;
                UI.log('HATCHEDIT: [Pattern/Scale/Angle/Delete] or Enter to finish:', 'prompt');
                return true;
            }
            if (CAD.cmdOptions.waitingForHEAngle) {
                const val = parseFloat(input.trim());
                if (isNaN(val)) {
                    UI.log('HATCHEDIT: Invalid angle.', 'error');
                } else {
                    CAD.saveUndoState('HatchEdit Angle');
                    CAD.updateEntity(target.id, { angle: val, renderLines: [] }, true);
                    UI.log(`HATCHEDIT: Angle set to ${val}°.`);
                    Renderer.draw();
                }
                CAD.cmdOptions.waitingForHEAngle = false;
                UI.log('HATCHEDIT: [Pattern/Scale/Angle/Delete] or Enter to finish:', 'prompt');
                return true;
            }
            if (CAD.cmdOptions.waitingForHEPattern) {
                if (lower === 'list') {
                    UI.log(`Patterns: ${this.getHatchPatternOptions()}`, 'prompt');
                    return true;
                }
                const cleaned = lower.replace(/[\s_-]+/g, '');
                const aliases = this.hatchPatternAliases;
                const resolved = aliases[cleaned] || cleaned;
                if (this.hatchPatterns.includes(resolved)) {
                    CAD.saveUndoState('HatchEdit Pattern');
                    CAD.updateEntity(target.id, {
                        patternName: resolved,
                        hatch: { pattern: resolved },
                        renderLines: []
                    }, true);
                    UI.log(`HATCHEDIT: Pattern set to ${resolved.toUpperCase()}.`);
                    Renderer.draw();
                } else {
                    UI.log(`HATCHEDIT: Unknown pattern "${input.trim()}".`, 'error');
                }
                CAD.cmdOptions.waitingForHEPattern = false;
                UI.log('HATCHEDIT: [Pattern/Scale/Angle/Delete] or Enter to finish:', 'prompt');
                return true;
            }

            if (!lower || lower === '') {
                this.finishCommand();
                return true;
            }
            if (lower === 'p' || lower === 'pattern') {
                CAD.cmdOptions.waitingForHEPattern = true;
                UI.log(`HATCHEDIT: Enter pattern name or [List] <${target.patternName || 'solid'}>:`, 'prompt');
                return true;
            }
            if (lower === 'sc' || lower === 'scale') {
                CAD.cmdOptions.waitingForHEScale = true;
                UI.log(`HATCHEDIT: Enter scale factor <${target.scale || 1}>:`, 'prompt');
                return true;
            }
            if (lower === 'an' || lower === 'angle') {
                CAD.cmdOptions.waitingForHEAngle = true;
                UI.log(`HATCHEDIT: Enter angle in degrees <${target.angle || 0}>:`, 'prompt');
                return true;
            }
            if (lower === 'd' || lower === 'delete') {
                CAD.saveUndoState('HatchEdit Delete');
                CAD.removeEntity(target.id);
                UI.log('HATCHEDIT: Hatch deleted.');
                Renderer.draw();
                this.finishCommand();
                return true;
            }
            UI.log('HATCHEDIT: [Pattern/Scale/Angle/Delete] or Enter to finish:', 'prompt');
            return true;
        }

        // Undo last point during LINE or POLYLINE drawing
        if ((inputLower === 'u' || inputLower === 'undo') &&
            (state.activeCmd === 'line' || state.activeCmd === 'polyline' || state.activeCmd === 'spline')) {
            if (state.points.length > 1) {
                // Remove the last point
                state.points.pop();
                // For line, we also need to undo the last created entity
                if (state.activeCmd === 'line' && CAD.entities.length > 0) {
                    const lastEntity = CAD.entities[CAD.entities.length - 1];
                    if (lastEntity.type === 'line') {
                        CAD.removeEntity(lastEntity.id, true);
                        UI.log('LINE: Last segment undone. Specify next point:', 'prompt');
                    }
                }
                if (state.activeCmd === 'polyline') {
                    UI.log('PLINE: Last point undone. Specify next point or [Arc/Close/Undo]:', 'prompt');
                }
                if (state.activeCmd === 'spline') {
                    UI.log('SPLINE: Last point undone. Specify next point:', 'prompt');
                }
                Renderer.draw();
            } else if (state.points.length === 1) {
                state.points = [];
                UI.log(`${state.activeCmd.toUpperCase()}: Cannot undo - specify first point:`, 'prompt');
            } else {
                UI.log('Nothing to undo.', 'error');
            }
            return true;
        }

        // Check for special command options

        // SCALE options: Copy, Reference, Points
        if (state.activeCmd === 'scale') {
            const option = inputLower;

            if ((option === 'c' || option === 'copy') && state.step === 1) {
                state.cmdOptions.scaleCopy = true;
                UI.log(`SCALE: Copy mode enabled. Specify scale factor or [Reference] <${CAD.lastScaleFactor}>:`, 'prompt');
                return true;
            }

            if ((option === 'r' || option === 'reference') && state.step === 1) {
                state.cmdOptions.scaleMode = 'reference';
                UI.log('SCALE: Specify reference length or [Points] <1>:', 'prompt');
                return true;
            }

            if ((option === 'p' || option === 'points') && state.step === 1 && state.cmdOptions.scaleMode === 'reference') {
                state.step = 2;
                UI.log('SCALE: Specify first reference point:', 'prompt');
                return true;
            }
        }

        if (state.activeCmd === 'fillet' && inputLower === 'r') {
            const radius = prompt('Enter fillet radius:', CAD.filletRadius || '0');
            if (radius !== null) {
                CAD.filletRadius = Math.abs(parseFloat(radius)) || 0;
                UI.log(`FILLET: Radius = ${CAD.filletRadius}. Select first object:`, 'prompt');
            }
            return true;
        }

        if (state.activeCmd === 'chamfer' && inputLower === 'd') {
            const d1 = prompt('Enter first chamfer distance:', CAD.chamferDist1 || '0');
            if (d1 !== null) {
                CAD.chamferDist1 = Math.abs(parseFloat(d1)) || 0;
                const d2 = prompt('Enter second chamfer distance:', CAD.chamferDist1);
                CAD.chamferDist2 = d2 !== null ? Math.abs(parseFloat(d2)) || CAD.chamferDist1 : CAD.chamferDist1;
                UI.log(`CHAMFER: Distances = ${CAD.chamferDist1}, ${CAD.chamferDist2}. Select first line:`, 'prompt');
            }
            return true;
        }

        // ==========================================
        // PHASE 3 INPUT HANDLING
        // ==========================================

        // CHPROP input
        if (state.activeCmd === 'chprop' && state.cmdOptions.chpropStep) {
            return this.handleChpropInput(input);
        }

        // DRAWORDER input
        if (state.activeCmd === 'draworder' && state.cmdOptions.draworderStep === 'option') {
            const opt = input.toLowerCase();
            if (opt === 'f' || opt === 'front') {
                this.executeDrawOrder('front');
            } else if (opt === 'b' || opt === 'back') {
                this.executeDrawOrder('back');
            } else if (opt === 'a' || opt === 'above') {
                UI.log('DRAWORDER: Select reference object:', 'prompt');
                state.cmdOptions.draworderStep = 'ref';
                state.cmdOptions.draworderAction = 'above';
            } else if (opt === 'u' || opt === 'under') {
                UI.log('DRAWORDER: Select reference object:', 'prompt');
                state.cmdOptions.draworderStep = 'ref';
                state.cmdOptions.draworderAction = 'below';
            } else {
                UI.log('DRAWORDER: Invalid option. [Above/Under/Front/Back]:', 'prompt');
            }
            return true;
        }

        // GROUP name input
        if (state.activeCmd === 'group' && state.cmdOptions.groupStep === 'name') {
            const groupName = input || `Group_${Date.now()}`;
            this.executeGroup(groupName);
            return true;
        }

        // ARRAYPATH count input
        if (state.activeCmd === 'arraypath' && state.cmdOptions.arraypathStep === 'count') {
            const count = parseInt(input);
            if (isNaN(count) || count < 2) {
                UI.log('ARRAYPATH: Enter a valid count (2 or more):', 'prompt');
                return true;
            }
            this.executeArrayPath(count);
            return true;
        }

        // MLINE options input
        if (state.activeCmd === 'mline' && state.step === 0) {
            const opt = input.toLowerCase();
            if (opt === 'j' || opt === 'justification') {
                UI.log('MLINE: Enter justification [Top/Zero/Bottom] <Top>:', 'prompt');
                state.cmdOptions.mlineInputStep = 'just';
                return true;
            }
            if (opt === 's' || opt === 'scale') {
                UI.log(`MLINE: Enter mline scale <${state.cmdOptions.mlineScale}>:`, 'prompt');
                state.cmdOptions.mlineInputStep = 'scale';
                return true;
            }
            if (state.cmdOptions.mlineInputStep === 'just') {
                if (opt === 't' || opt === 'top') state.cmdOptions.mlineJust = 'top';
                else if (opt === 'z' || opt === 'zero') state.cmdOptions.mlineJust = 'zero';
                else if (opt === 'b' || opt === 'bottom') state.cmdOptions.mlineJust = 'bottom';
                state.cmdOptions.mlineInputStep = null;
                UI.log(`MLINE: Justification = ${state.cmdOptions.mlineJust}. Specify start point:`, 'prompt');
                return true;
            }
            if (state.cmdOptions.mlineInputStep === 'scale') {
                const s = parseFloat(opt);
                if (!isNaN(s) && s > 0) state.cmdOptions.mlineScale = s;
                state.cmdOptions.mlineInputStep = null;
                UI.log(`MLINE: Scale = ${state.cmdOptions.mlineScale}. Specify start point:`, 'prompt');
                return true;
            }
        }

        // TABLE dimension input
        if (state.activeCmd === 'table' && state.cmdOptions.tableStep === 'rows') {
            const rows = parseInt(input);
            if (!isNaN(rows) && rows > 0) state.cmdOptions.tableRows = rows;
            state.cmdOptions.tableStep = 'cols';
            UI.log(`TABLE: Enter number of columns <${state.cmdOptions.tableCols}>:`, 'prompt');
            return true;
        }
        if (state.activeCmd === 'table' && state.cmdOptions.tableStep === 'cols') {
            const cols = parseInt(input);
            if (!isNaN(cols) && cols > 0) state.cmdOptions.tableCols = cols;
            state.cmdOptions.tableStep = 'cellw';
            UI.log(`TABLE: Enter cell width <${state.cmdOptions.tableCellW}>:`, 'prompt');
            return true;
        }
        if (state.activeCmd === 'table' && state.cmdOptions.tableStep === 'cellw') {
            const w = parseFloat(input);
            if (!isNaN(w) && w > 0) state.cmdOptions.tableCellW = w;
            state.cmdOptions.tableStep = 'cellh';
            UI.log(`TABLE: Enter cell height <${state.cmdOptions.tableCellH}>:`, 'prompt');
            return true;
        }
        if (state.activeCmd === 'table' && state.cmdOptions.tableStep === 'cellh') {
            const h = parseFloat(input);
            if (!isNaN(h) && h > 0) state.cmdOptions.tableCellH = h;
            this.createTable();
            return true;
        }

        // XCLIP options handling
        if (state.activeCmd === 'xclip') {
            const option = input.toLowerCase();
            if (state.cmdOptions.xclipMode === 'options') {
                if (option === 'on') {
                    if (state.cmdOptions.xclipTarget && state.cmdOptions.xclipTarget.xclip) {
                        state.cmdOptions.xclipTarget.xclip.enabled = true;
                        CAD.modified = true;
                        UI.log('XCLIP: Clipping enabled.');
                    }
                    this.finishCommand();
                    Renderer.draw();
                    return true;
                }
                if (option === 'off') {
                    if (state.cmdOptions.xclipTarget && state.cmdOptions.xclipTarget.xclip) {
                        state.cmdOptions.xclipTarget.xclip.enabled = false;
                        CAD.modified = true;
                        UI.log('XCLIP: Clipping disabled.');
                    }
                    this.finishCommand();
                    Renderer.draw();
                    return true;
                }
                if (option === 'd' || option === 'delete') {
                    if (state.cmdOptions.xclipTarget) {
                        delete state.cmdOptions.xclipTarget.xclip;
                        CAD.modified = true;
                        UI.log('XCLIP: Clip boundary deleted.');
                    }
                    this.finishCommand();
                    Renderer.draw();
                    return true;
                }
                if (option === 'n' || option === 'new' || option === '') {
                    UI.log('XCLIP: [Select polyline/Rectangular/Polygonal] <Rectangular>:', 'prompt');
                    state.cmdOptions.xclipMode = 'newtype';
                    return true;
                }
            }
            if (state.cmdOptions.xclipMode === 'newtype') {
                if (option === 'r' || option === 'rectangular' || option === '') {
                    state.cmdOptions.xclipMode = 'rect1';
                    state.points = [];
                    UI.log('XCLIP: Specify first corner of clip boundary:', 'prompt');
                    return true;
                }
                if (option === 'p' || option === 'polygonal') {
                    state.cmdOptions.xclipMode = 'poly';
                    state.points = [];
                    state.step = 0;
                    UI.log('XCLIP: Specify first point of polygonal clip boundary:', 'prompt');
                    return true;
                }
            }
            if (state.cmdOptions.xclipMode === 'poly' && (option === '' || option === 'enter')) {
                if (state.points.length >= 3) {
                    this.applyXClip(state.cmdOptions.xclipTarget, [...state.points]);
                } else {
                    UI.log('XCLIP: Need at least 3 points for a polygonal boundary.', 'error');
                }
                return true;
            }
            return true;
        }

        // PEDIT options handling
        if (state.activeCmd === 'pedit' && state.cmdOptions.peditTarget) {
            const option = input.toLowerCase();
            const target = state.cmdOptions.peditTarget;

            // Handle movevertex mode: coordinate input moves the current vertex
            if (state.cmdOptions.peditMode === 'movevertex') {
                const coord = Utils.parseCoordinate(input);
                if (coord) {
                    const vi = state.cmdOptions.vertexIndex || 0;
                    CAD.saveUndoState('PEDIT Move vertex');
                    target.points[vi] = { x: coord.x, y: coord.y };
                    CAD.updateEntity(target.id, target, true);
                    UI.log(`Vertex ${vi} moved. [N/P/M/I/D/X]:`, 'prompt');
                    state.cmdOptions.peditMode = 'editvertex';
                    Renderer.draw();
                } else {
                    UI.log('Invalid coordinate. Enter x,y:', 'prompt');
                }
                return true;
            }

            // Handle width mode: numeric input sets width
            if (state.cmdOptions.peditMode === 'width') {
                const width = parseFloat(input);
                if (!isNaN(width) && width >= 0) {
                    CAD.saveUndoState('PEDIT Width');
                    target.width = width;
                    CAD.updateEntity(target.id, target, true);
                    UI.log(`Polyline width set to ${width}.`);
                    Renderer.draw();
                }
                this.finishCommand();
                return true;
            }

            if (option === 'c' || option === 'close') {
                // Close polyline
                if (target.type === 'polyline' && target.points.length >= 3) {
                    if (!Utils.isPolygonClosed(target.points)) {
                        CAD.saveUndoState('PEDIT Close');
                        target.points.push({ ...target.points[0] });
                        target.closed = true;
                        CAD.updateEntity(target.id, target, true);
                        UI.log('Polyline closed.');
                        Renderer.draw();
                    } else {
                        UI.log('Polyline is already closed.');
                    }
                }
                this.finishCommand();
                return true;
            }

            if (option === 'o' || option === 'open') {
                // Open polyline
                if (target.type === 'polyline' && target.points.length >= 3) {
                    if (Utils.isPolygonClosed(target.points)) {
                        CAD.saveUndoState('PEDIT Open');
                        target.points.pop();
                        target.closed = false;
                        CAD.updateEntity(target.id, target, true);
                        UI.log('Polyline opened.');
                        Renderer.draw();
                    } else {
                        UI.log('Polyline is already open.');
                    }
                }
                this.finishCommand();
                return true;
            }

            if (option === 'j' || option === 'join') {
                // Join nearby lines/polylines
                UI.log('PEDIT Join: Select objects to join:', 'prompt');
                state.cmdOptions.peditMode = 'join';
                state.cmdOptions.needSelection = true;
                return true;
            }

            if (option === 's' || option === 'spline') {
                // Convert to spline curve
                if (target.type === 'polyline') {
                    CAD.saveUndoState('PEDIT Spline');
                    target.isSpline = true;
                    CAD.updateEntity(target.id, target, true);
                    UI.log('Polyline converted to spline.');
                    Renderer.draw();
                }
                this.finishCommand();
                return true;
            }

            if (option === 'd' || option === 'decurve') {
                // Remove spline curve
                if (target.type === 'polyline') {
                    CAD.saveUndoState('PEDIT Decurve');
                    target.isSpline = false;
                    CAD.updateEntity(target.id, target, true);
                    UI.log('Spline removed from polyline.');
                    Renderer.draw();
                }
                this.finishCommand();
                return true;
            }

            if (option === 'w' || option === 'width') {
                state.cmdOptions.peditMode = 'width';
                UI.log('PEDIT Width: Enter new width for all segments <' + (target.width || 0) + '>:', 'prompt');
                return true;
            }

            if (option === 'e' || option === 'edit') {
                // Edit vertex mode
                state.cmdOptions.peditMode = 'editvertex';
                state.cmdOptions.vertexIndex = 0;
                UI.log('PEDIT Edit vertex [Next/Previous/Move/Insert/Delete/eXit]:', 'prompt');
                return true;
            }

            if (option === 'x' || option === 'exit') {
                this.finishCommand();
                return true;
            }

            if (state.cmdOptions.peditMode === 'editvertex') {
                const sub = input.toLowerCase();
                const pts = target.points;
                let vi = state.cmdOptions.vertexIndex || 0;

                if (sub === 'n' || sub === 'next') {
                    vi = (vi + 1) % pts.length;
                    state.cmdOptions.vertexIndex = vi;
                    UI.log(`Vertex ${vi} of ${pts.length} (${pts[vi].x.toFixed(2)}, ${pts[vi].y.toFixed(2)}). [N/P/M/I/D/X]:`,'prompt');
                } else if (sub === 'p' || sub === 'previous') {
                    vi = (vi - 1 + pts.length) % pts.length;
                    state.cmdOptions.vertexIndex = vi;
                    UI.log(`Vertex ${vi} of ${pts.length} (${pts[vi].x.toFixed(2)}, ${pts[vi].y.toFixed(2)}). [N/P/M/I/D/X]:`,'prompt');
                } else if (sub === 'm' || sub === 'move') {
                    state.cmdOptions.peditMode = 'movevertex';
                    UI.log(`Move vertex ${vi}: specify new location:`, 'prompt');
                } else if (sub === 'd' || sub === 'delete') {
                    if (pts.length > 2) {
                        CAD.saveUndoState('PEDIT Delete vertex');
                        pts.splice(vi, 1);
                        if (vi >= pts.length) state.cmdOptions.vertexIndex = pts.length - 1;
                        CAD.updateEntity(target.id, target, true);
                        UI.log(`Vertex deleted. ${pts.length} vertices remaining. [N/P/M/I/D/X]:`, 'prompt');
                        Renderer.draw();
                    } else {
                        UI.log('Cannot delete: minimum 2 vertices required.', 'error');
                    }
                } else if (sub === 'x' || sub === 'exit') {
                    this.finishCommand();
                } else {
                    UI.log('Edit vertex: [Next/Previous/Move/Delete/eXit]:', 'prompt');
                }
                return true;
            }

            UI.log('PEDIT: Unknown option. [Close/Open/Join/Width/Edit vertex/Spline/Decurve/eXit]:', 'prompt');
            return true;
        }

        // TEXT - text content input (step 3)
        if (state.activeCmd === 'text' && state.step === 3 && input.length > 0) {
            this.completeTextCommand(input);
            Renderer.draw();
            return true;
        }

        // ===== NEW AUTOCAD LT FEATURE INPUT HANDLERS =====

        // MLEADER - text input (step 2)
        if (state.activeCmd === 'mleader' && state.step === 2) {
            this.completeMLeaderCommand(input);
            Renderer.draw();
            return true;
        }

        // MLEADERSTYLE options
        if (state.activeCmd === 'mleaderstyle') {
            this.handleMLeaderStyleInput(input);
            return true;
        }

        // ATTDEF - multi-step text input
        if (state.activeCmd === 'attdef' && state.cmdOptions.attdefStep) {
            this.handleAttDefInput(input);
            return true;
        }

        // ATTEDIT
        if (state.activeCmd === 'attedit') {
            this.handleAttEditInput(input);
            return true;
        }

        // TOLERANCE - symbol/value input
        if (state.activeCmd === 'tolerance' && state.cmdOptions.toleranceStep) {
            this.handleToleranceInput(input);
            return true;
        }

        // MLSTYLE options
        if (state.activeCmd === 'mlstyle') {
            this.handleMLStyleInput(input);
            return true;
        }

        // TRACE - width input
        if (state.activeCmd === 'trace' && state.cmdOptions.traceStep === 'width') {
            const w = parseFloat(input);
            if (!isNaN(w) && w > 0) {
                state.cmdOptions.traceWidth = w;
            }
            state.cmdOptions.traceStep = 'points';
            UI.log(`TRACE: Width = ${state.cmdOptions.traceWidth}. Specify first point:`, 'prompt');
            return true;
        }

        // PAGESETUP options
        if (state.activeCmd === 'pagesetup') {
            this.handlePageSetupInput(input);
            return true;
        }

        // VPSCALE - scale input
        if (state.activeCmd === 'vpscale') {
            this.handleVpScaleInput(input);
            return true;
        }

        // IMAGECLIP options
        if (state.activeCmd === 'imageclip' && state.cmdOptions.clipTarget) {
            this.handleImageClipInput(input);
            return true;
        }

        // FIELD type selection
        if (state.activeCmd === 'field' && state.cmdOptions.fieldStep === 'type') {
            this.handleFieldTypeInput(input);
            return true;
        }

        // QUICKCALC expression
        if (state.activeCmd === 'quickcalc') {
            this.evaluateQuickCalc(input);
            return true;
        }

        // Not a coordinate - treat as command
        return false;
    },

    // ==========================================
    // NEW AUTOCAD LT FEATURE IMPLEMENTATIONS
    // ==========================================

    // --- MLEADER ---
    handleMLeaderClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('MLEADER: Specify landing location:', 'prompt');
        } else if (state.step === 2) {
            UI.log('MLEADER: Enter text content:', 'prompt');
        }
    },

    completeMLeaderCommand(text) {
        const points = CAD.points;
        if (!text || points.length < 2) {
            UI.log('MLEADER: Text required to finish multileader.', 'error');
            return;
        }
        const style = CAD.getMLeaderStyle();
        const lastPt = points[points.length - 1];
        const dir = lastPt.x >= points[0].x ? 1 : -1;
        const textPos = {
            x: lastPt.x + dir * (style.doglegLength || 8),
            y: lastPt.y
        };
        CAD.addEntity({
            type: 'mleader',
            points: points.map(p => ({ ...p })),
            text: text,
            textPosition: textPos,
            height: style.textHeight || CAD.textHeight || 2.5,
            arrowType: style.arrowType || 'closed',
            arrowSize: style.arrowSize || 3,
            doglegLength: style.doglegLength || 8,
            mleaderStyle: CAD.currentMLeaderStyle
        });
        UI.log('Multileader created.');
        this.finishCommand();
    },

    handleMLeaderStyleInput(input) {
        const option = input.toLowerCase();
        const state = CAD;

        if (state.cmdOptions.mleaderStyleStep === 'name') {
            const name = input.trim();
            if (!name) { UI.log('Enter a style name.', 'error'); return; }
            const existing = CAD.getMLeaderStyle();
            CAD.mleaderStyles.push({
                name: name,
                arrowType: existing.arrowType,
                arrowSize: existing.arrowSize,
                landingGap: existing.landingGap,
                textHeight: existing.textHeight,
                doglegLength: existing.doglegLength,
                contentType: existing.contentType
            });
            CAD.currentMLeaderStyle = name;
            UI.log(`MLEADERSTYLE: Style "${name}" created and set as current.`);
            this.finishCommand();
            return;
        }
        if (state.cmdOptions.mleaderStyleStep === 'set') {
            const found = CAD.mleaderStyles.find(s => s.name.toLowerCase() === input.toLowerCase());
            if (found) {
                CAD.currentMLeaderStyle = found.name;
                UI.log(`MLEADERSTYLE: Current style set to "${found.name}".`);
            } else {
                UI.log(`MLEADERSTYLE: Style "${input}" not found.`, 'error');
            }
            this.finishCommand();
            return;
        }
        if (state.cmdOptions.mleaderStyleStep === 'delete') {
            const idx = CAD.mleaderStyles.findIndex(s => s.name.toLowerCase() === input.toLowerCase());
            if (idx > 0) {
                if (CAD.currentMLeaderStyle === CAD.mleaderStyles[idx].name) {
                    CAD.currentMLeaderStyle = 'Standard';
                }
                CAD.mleaderStyles.splice(idx, 1);
                UI.log(`MLEADERSTYLE: Style "${input}" deleted.`);
            } else if (idx === 0) {
                UI.log('Cannot delete the Standard style.', 'error');
            } else {
                UI.log(`Style "${input}" not found.`, 'error');
            }
            this.finishCommand();
            return;
        }

        if (option === 'list' || option === 'l') {
            CAD.mleaderStyles.forEach(s => {
                UI.log(`  ${s.name === CAD.currentMLeaderStyle ? '* ' : '  '}${s.name}: arrow=${s.arrowType}, arrowSize=${s.arrowSize}, textH=${s.textHeight}, dogleg=${s.doglegLength}`, 'info');
            });
            this.finishCommand();
        } else if (option === 'set' || option === 's') {
            state.cmdOptions.mleaderStyleStep = 'set';
            UI.log('MLEADERSTYLE: Enter style name to set:', 'prompt');
        } else if (option === 'new' || option === 'n') {
            state.cmdOptions.mleaderStyleStep = 'name';
            UI.log('MLEADERSTYLE: Enter new style name:', 'prompt');
        } else if (option === 'delete' || option === 'd') {
            state.cmdOptions.mleaderStyleStep = 'delete';
            UI.log('MLEADERSTYLE: Enter style name to delete:', 'prompt');
        } else {
            UI.log('MLEADERSTYLE: Invalid option. Use [List/Set/New/Delete].', 'error');
        }
    },

    executeMLeaderCollect() {
        const mleaders = CAD.selectedIds
            .map(id => CAD.getEntity(id))
            .filter(e => e && e.type === 'mleader');
        if (mleaders.length < 2) {
            UI.log('MLEADERCOLLECT: Select at least 2 multileaders.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('MLEADERCOLLECT');
        const first = mleaders[0];
        const collectedText = mleaders.map(m => m.text).join('\n');
        CAD.updateEntity(first.id, { text: collectedText }, true);
        for (let i = 1; i < mleaders.length; i++) {
            CAD.removeEntity(mleaders[i].id, true);
        }
        UI.log(`MLEADERCOLLECT: Collected ${mleaders.length} leaders into one.`);
        this.finishCommand();
    },

    executeMLeaderAlign() {
        const mleaders = CAD.selectedIds
            .map(id => CAD.getEntity(id))
            .filter(e => e && e.type === 'mleader');
        if (mleaders.length < 2) {
            UI.log('MLEADERALIGN: Select at least 2 multileaders.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('MLEADERALIGN');
        // Align text positions to match the first leader's Y coordinate
        const targetY = mleaders[0].textPosition ? mleaders[0].textPosition.y : mleaders[0].points[mleaders[0].points.length - 1].y;
        for (let i = 1; i < mleaders.length; i++) {
            const ml = mleaders[i];
            if (ml.textPosition) {
                ml.textPosition.y = targetY;
            }
            // Align last leader point Y to match
            if (ml.points && ml.points.length > 0) {
                ml.points[ml.points.length - 1].y = targetY;
            }
            CAD.updateEntity(ml.id, ml, true);
        }
        UI.log(`MLEADERALIGN: Aligned ${mleaders.length} leaders.`);
        Renderer.draw();
        this.finishCommand();
    },

    // --- ATTDEF ---
    handleAttDefInput(input) {
        const state = CAD;
        if (state.cmdOptions.attdefStep === 'tag') {
            state.cmdOptions.attdefTag = input.toUpperCase().replace(/\s/g, '_');
            state.cmdOptions.attdefStep = 'prompt';
            UI.log('ATTDEF: Enter attribute prompt text:', 'prompt');
        } else if (state.cmdOptions.attdefStep === 'prompt') {
            state.cmdOptions.attdefPrompt = input;
            state.cmdOptions.attdefStep = 'default';
            UI.log('ATTDEF: Enter default value:', 'prompt');
        } else if (state.cmdOptions.attdefStep === 'default') {
            state.cmdOptions.attdefDefault = input;
            state.cmdOptions.attdefStep = 'place';
            UI.log('ATTDEF: Click to place attribute definition:', 'prompt');
        }
    },

    handleAttDefClick(point) {
        const state = CAD;
        if (state.cmdOptions.attdefStep !== 'place') return;

        const height = CAD.textHeight || 10;
        CAD.addEntity({
            type: 'text',
            position: { ...point },
            text: state.cmdOptions.attdefTag || 'ATTRIBUTE',
            height: height,
            textStyle: CAD.currentTextStyle,
            isAttDef: true,
            attTag: state.cmdOptions.attdefTag || 'ATTRIBUTE',
            attPrompt: state.cmdOptions.attdefPrompt || '',
            attDefault: state.cmdOptions.attdefDefault || ''
        });
        UI.log(`ATTDEF: Attribute "${state.cmdOptions.attdefTag}" placed. Include it when creating a block.`);
        this.finishCommand();
    },

    executeAttEdit() {
        const state = CAD;
        const selected = state.selectedIds.map(id => CAD.getEntity(id)).filter(Boolean);
        const blockRef = selected.find(e => e.type === 'block' || e.type === 'insert');
        if (!blockRef) {
            UI.log('ATTEDIT: Select a block reference with attributes.', 'error');
            this.finishCommand();
            return;
        }
        const blockDef = CAD.blocks[blockRef.blockName || blockRef.name];
        if (!blockDef) {
            UI.log('ATTEDIT: Block definition not found.', 'error');
            this.finishCommand();
            return;
        }
        const attDefs = (blockDef.entities || []).filter(e => e.isAttDef);
        if (attDefs.length === 0 && (!blockRef.attributes || blockRef.attributes.length === 0)) {
            UI.log('ATTEDIT: Block has no attributes.', 'error');
            this.finishCommand();
            return;
        }
        CAD.saveUndoState('ATTEDIT');
        if (!blockRef.attributes) blockRef.attributes = [];
        state.cmdOptions.atteditBlock = blockRef;
        state.cmdOptions.atteditDefs = attDefs;
        state.cmdOptions.atteditIndex = 0;
        if (attDefs.length > 0) {
            const att = attDefs[0];
            const current = (blockRef.attributes.find(a => a.tag === att.attTag) || {}).value || att.attDefault || '';
            UI.log(`ATTEDIT: [${att.attTag}] ${att.attPrompt || att.attTag} <${current}>:`, 'prompt');
        } else {
            const att = blockRef.attributes[0];
            UI.log(`ATTEDIT: [${att.tag}] <${att.value}>:`, 'prompt');
        }
    },

    handleAttEditInput(input) {
        const state = CAD;
        const blockRef = state.cmdOptions.atteditBlock;
        if (!blockRef) { this.finishCommand(); return; }
        const attDefs = state.cmdOptions.atteditDefs || [];
        const attrs = blockRef.attributes || [];
        const idx = state.cmdOptions.atteditIndex || 0;

        if (attDefs.length > 0 && idx < attDefs.length) {
            const att = attDefs[idx];
            const existing = attrs.find(a => a.tag === att.attTag);
            const value = input || att.attDefault || '';
            if (existing) {
                existing.value = value;
            } else {
                attrs.push({ tag: att.attTag, value: value });
            }
        } else if (idx < attrs.length) {
            if (input) attrs[idx].value = input;
        }

        state.cmdOptions.atteditIndex = idx + 1;
        const nextIdx = idx + 1;
        if (attDefs.length > 0 && nextIdx < attDefs.length) {
            const nextAtt = attDefs[nextIdx];
            const cur = (attrs.find(a => a.tag === nextAtt.attTag) || {}).value || nextAtt.attDefault || '';
            UI.log(`ATTEDIT: [${nextAtt.attTag}] ${nextAtt.attPrompt || nextAtt.attTag} <${cur}>:`, 'prompt');
        } else if (nextIdx < attrs.length) {
            UI.log(`ATTEDIT: [${attrs[nextIdx].tag}] <${attrs[nextIdx].value}>:`, 'prompt');
        } else {
            blockRef.attributes = attrs;
            CAD.updateEntity(blockRef.id, blockRef, true);
            UI.log('ATTEDIT: Attributes updated.');
            this.finishCommand();
        }
    },

    // --- TOLERANCE (GD&T) ---
    toleranceSymbols: {
        'u': '\u2316',   // Position
        'r': '\u27c2',   // Perpendicularity
        'p': '\u2225',   // Parallelism
        'a': '\u2220',   // Angularity
        'y': '\u232d',   // Cylindricity
        'c': '\u25ce',   // Concentricity
        's': '\u232f',   // Symmetry
        't': '\u23e5',   // Flatness (using substitute)
        'l': '\u23e4',   // Straightness (using substitute)
        'i': '\u25cb',   // Circularity
        'x': '\u2197',   // Runout
        'w': '\u2197\u2197', // Total runout
    },

    handleToleranceInput(input) {
        const state = CAD;
        const step = state.cmdOptions.toleranceStep;

        if (step === 'symbol') {
            const sym = this.toleranceSymbols[input.toLowerCase()];
            if (sym) {
                if (!state.cmdOptions.toleranceFrames) state.cmdOptions.toleranceFrames = [];
                state.cmdOptions.currentFrame = { symbol: sym };
                state.cmdOptions.toleranceStep = 'value1';
                UI.log('TOLERANCE: Enter tolerance value 1 (prefix with D for diameter symbol):', 'prompt');
            } else {
                UI.log('TOLERANCE: Invalid symbol. Use u/r/p/a/y/c/s/t/l/i/x/w.', 'error');
            }
            return;
        }
        if (step === 'value1') {
            const frame = state.cmdOptions.currentFrame;
            if (input.toLowerCase().startsWith('d')) {
                frame.diameterSymbol = true;
                frame.tolerance1 = input.substring(1);
            } else {
                frame.tolerance1 = input;
            }
            state.cmdOptions.toleranceStep = 'datum1';
            UI.log('TOLERANCE: Enter primary datum reference (or Enter to skip):', 'prompt');
            return;
        }
        if (step === 'datum1') {
            const frame = state.cmdOptions.currentFrame;
            if (input) frame.datum1 = input.toUpperCase();
            state.cmdOptions.toleranceStep = 'datum2';
            UI.log('TOLERANCE: Enter secondary datum (or Enter to skip):', 'prompt');
            return;
        }
        if (step === 'datum2') {
            const frame = state.cmdOptions.currentFrame;
            if (input) frame.datum2 = input.toUpperCase();
            state.cmdOptions.toleranceStep = 'datum3';
            UI.log('TOLERANCE: Enter tertiary datum (or Enter to finish frame):', 'prompt');
            return;
        }
        if (step === 'datum3') {
            const frame = state.cmdOptions.currentFrame;
            if (input) frame.datum3 = input.toUpperCase();
            state.cmdOptions.toleranceFrames.push(frame);
            state.cmdOptions.toleranceStep = 'place';
            UI.log('TOLERANCE: Click to place the feature control frame:', 'prompt');
            return;
        }
    },

    handleToleranceClick(point) {
        const state = CAD;
        if (state.cmdOptions.toleranceStep !== 'place') return;

        CAD.addEntity({
            type: 'tolerance',
            position: { ...point },
            height: CAD.dimTextHeight || 2.5,
            frames: state.cmdOptions.toleranceFrames || []
        });
        UI.log('Tolerance frame created.');
        this.finishCommand();
    },

    // --- QUICKCALC ---
    showQuickCalc() {
        UI.log('=== QuickCalc Calculator ===', 'info');
        UI.log('Enter mathematical expression (e.g., 2+3, sqrt(16), sin(45), pi*5^2)', 'info');
        UI.log('Functions: sqrt, sin, cos, tan, asin, acos, atan, abs, ceil, floor, round, log, exp', 'info');
        UI.log('Constants: pi, e', 'info');
        UI.log('Type an expression or "exit" to close:', 'prompt');
    },

    evaluateQuickCalc(input) {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'x') {
            this.finishCommand();
            return;
        }
        try {
            // Safe math evaluation
            let expr = input
                .replace(/\bpi\b/gi, String(Math.PI))
                .replace(/\be\b/gi, String(Math.E))
                .replace(/\bsqrt\b/gi, 'Math.sqrt')
                .replace(/\bsin\b/gi, 'Math.sin')
                .replace(/\bcos\b/gi, 'Math.cos')
                .replace(/\btan\b/gi, 'Math.tan')
                .replace(/\basin\b/gi, 'Math.asin')
                .replace(/\bacos\b/gi, 'Math.acos')
                .replace(/\batan\b/gi, 'Math.atan')
                .replace(/\babs\b/gi, 'Math.abs')
                .replace(/\bceil\b/gi, 'Math.ceil')
                .replace(/\bfloor\b/gi, 'Math.floor')
                .replace(/\bround\b/gi, 'Math.round')
                .replace(/\blog\b/gi, 'Math.log')
                .replace(/\bexp\b/gi, 'Math.exp')
                .replace(/\^/g, '**');
            // Only allow safe characters: digits, operators, parens, Math.xxx calls
            if (/^[0-9+\-*/().%,\s*]+$/.test(expr) || /^[0-9+\-*/().%,\s*Math.sqrtsincoetanabceilogexpfloorundpw]+$/.test(expr)) {
                const result = Function('"use strict"; return (' + expr + ')')();
                UI.log(`  = ${result}`, 'info');
            } else {
                UI.log('QUICKCALC: Expression contains invalid characters.', 'error');
            }
        } catch (e) {
            UI.log(`QUICKCALC: Error evaluating "${input}": ${e.message}`, 'error');
        }
        UI.log('Enter another expression or "exit":', 'prompt');
    },

    // --- MLSTYLE ---
    handleMLStyleInput(input) {
        const state = CAD;
        const option = input.toLowerCase();

        if (state.cmdOptions.mlstyleStep === 'name') {
            const name = input.trim();
            if (!name) { UI.log('Enter a style name.', 'error'); return; }
            const existing = CAD.getMultilineStyle();
            CAD.multilineStyles.push({
                name: name,
                elements: JSON.parse(JSON.stringify(existing.elements)),
                showJoints: existing.showJoints,
                startCap: existing.startCap,
                endCap: existing.endCap
            });
            CAD.currentMultilineStyle = name;
            UI.log(`MLSTYLE: Style "${name}" created and set as current.`);
            this.finishCommand();
            return;
        }
        if (state.cmdOptions.mlstyleStep === 'set') {
            const found = CAD.multilineStyles.find(s => s.name.toLowerCase() === input.toLowerCase());
            if (found) {
                CAD.currentMultilineStyle = found.name;
                UI.log(`MLSTYLE: Current style set to "${found.name}".`);
            } else {
                UI.log(`MLSTYLE: Style "${input}" not found.`, 'error');
            }
            this.finishCommand();
            return;
        }
        if (state.cmdOptions.mlstyleStep === 'delete') {
            const idx = CAD.multilineStyles.findIndex(s => s.name.toLowerCase() === input.toLowerCase());
            if (idx > 0) {
                if (CAD.currentMultilineStyle === CAD.multilineStyles[idx].name) {
                    CAD.currentMultilineStyle = 'Standard';
                }
                CAD.multilineStyles.splice(idx, 1);
                UI.log(`MLSTYLE: Deleted "${input}".`);
            } else if (idx === 0) {
                UI.log('Cannot delete the Standard style.', 'error');
            } else {
                UI.log(`Style "${input}" not found.`, 'error');
            }
            this.finishCommand();
            return;
        }
        if (state.cmdOptions.mlstyleStep === 'elements') {
            const n = parseInt(input);
            if (!isNaN(n) && n >= 1 && n <= 16) {
                const style = CAD.getMultilineStyle();
                style.elements = [];
                const spacing = 1.0 / n;
                for (let i = 0; i < n; i++) {
                    style.elements.push({
                        offset: (n - 1) / 2 * spacing - i * spacing,
                        color: '#ffffff',
                        linetype: 'Continuous'
                    });
                }
                UI.log(`MLSTYLE: Set ${n} elements for "${style.name}".`);
            } else {
                UI.log('Enter 1-16 elements.', 'error');
            }
            this.finishCommand();
            return;
        }

        if (option === 'list' || option === 'l') {
            CAD.multilineStyles.forEach(s => {
                const mark = s.name === CAD.currentMultilineStyle ? '* ' : '  ';
                UI.log(`  ${mark}${s.name}: ${s.elements.length} elements, joints=${s.showJoints}`, 'info');
            });
            this.finishCommand();
        } else if (option === 'set' || option === 's') {
            state.cmdOptions.mlstyleStep = 'set';
            UI.log('MLSTYLE: Enter style name to set:', 'prompt');
        } else if (option === 'new' || option === 'n') {
            state.cmdOptions.mlstyleStep = 'name';
            UI.log('MLSTYLE: Enter new style name:', 'prompt');
        } else if (option === 'delete' || option === 'd') {
            state.cmdOptions.mlstyleStep = 'delete';
            UI.log('MLSTYLE: Enter style name to delete:', 'prompt');
        } else if (option === 'elements' || option === 'e') {
            state.cmdOptions.mlstyleStep = 'elements';
            UI.log('MLSTYLE: Enter number of line elements (1-16):', 'prompt');
        } else {
            UI.log('MLSTYLE: Invalid option. Use [List/Set/New/Delete/Elements].', 'error');
        }
    },

    // --- TRACE ---
    handleTraceClick(point) {
        const state = CAD;
        state.points.push(point);
        state.step++;

        if (state.step === 1) {
            UI.log('TRACE: Specify next point:', 'prompt');
        } else if (state.step >= 2) {
            const width = state.cmdOptions.traceWidth || 1;
            const p1 = state.points[state.points.length - 2];
            const p2 = state.points[state.points.length - 1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const perpAngle = angle + Math.PI / 2;
            const hw = width / 2;
            const dx = Math.cos(perpAngle) * hw;
            const dy = Math.sin(perpAngle) * hw;

            CAD.addEntity({
                type: 'trace',
                points: [
                    { x: p1.x + dx, y: p1.y + dy },
                    { x: p1.x - dx, y: p1.y - dy },
                    { x: p2.x - dx, y: p2.y - dy },
                    { x: p2.x + dx, y: p2.y + dy }
                ],
                width: width,
                p1: { ...p1 },
                p2: { ...p2 }
            });
            UI.log('Trace segment created. Specify next point or Enter to finish:', 'prompt');
        }
    },

    // --- PAGESETUP ---
    handlePageSetupInput(input) {
        const state = CAD;
        const option = input.toLowerCase();
        const ps = CAD.getPageSetup();

        if (state.cmdOptions.pagesetupStep === 'papersize') {
            const sizes = {
                'a4': { w: 210, h: 297, name: 'ISO A4' },
                'a3': { w: 297, h: 420, name: 'ISO A3' },
                'a2': { w: 420, h: 594, name: 'ISO A2' },
                'a1': { w: 594, h: 841, name: 'ISO A1' },
                'a0': { w: 841, h: 1189, name: 'ISO A0' },
                'letter': { w: 216, h: 279, name: 'Letter' },
                'legal': { w: 216, h: 356, name: 'Legal' },
                'tabloid': { w: 279, h: 432, name: 'Tabloid' },
                'ansi a': { w: 216, h: 279, name: 'ANSI A' },
                'ansi b': { w: 279, h: 432, name: 'ANSI B' },
                'ansi c': { w: 432, h: 559, name: 'ANSI C' },
                'ansi d': { w: 559, h: 864, name: 'ANSI D' }
            };
            const size = sizes[option];
            if (size) {
                ps.paperSize = size.name;
                if (ps.orientation === 'Landscape') {
                    ps.paperWidth = Math.max(size.w, size.h);
                    ps.paperHeight = Math.min(size.w, size.h);
                } else {
                    ps.paperWidth = Math.min(size.w, size.h);
                    ps.paperHeight = Math.max(size.w, size.h);
                }
                CAD.setPageSetup(null, ps);
                // Also update the layout paper dimensions
                const layout = CAD.getLayout(CAD.currentLayout);
                if (layout && layout.paper) {
                    layout.paper.width = ps.paperWidth;
                    layout.paper.height = ps.paperHeight;
                }
                UI.log(`PAGESETUP: Paper set to ${size.name} (${ps.paperWidth}x${ps.paperHeight}mm).`);
            } else {
                UI.log('PAGESETUP: Unknown size. Use A4/A3/A2/A1/A0/Letter/Legal/Tabloid/ANSI A-D.', 'error');
            }
            state.cmdOptions.pagesetupStep = null;
            UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
            return;
        }
        if (state.cmdOptions.pagesetupStep === 'scale') {
            if (option === 'fit') {
                ps.plotScale = 'Fit';
            } else {
                const parts = input.split(':');
                if (parts.length === 2) {
                    ps.plotScale = input;
                    ps.plotScaleCustom = parseFloat(parts[0]) / parseFloat(parts[1]);
                } else {
                    const val = parseFloat(input);
                    if (!isNaN(val) && val > 0) {
                        ps.plotScale = input;
                        ps.plotScaleCustom = val;
                    } else {
                        UI.log('Enter scale as ratio (1:50) or number or "Fit".', 'error');
                        return;
                    }
                }
            }
            CAD.setPageSetup(null, ps);
            UI.log(`PAGESETUP: Scale set to ${ps.plotScale}.`);
            state.cmdOptions.pagesetupStep = null;
            UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
            return;
        }
        if (state.cmdOptions.pagesetupStep === 'margins') {
            const parts = input.split(/[,\s]+/).map(Number);
            if (parts.length >= 4 && parts.every(n => !isNaN(n) && n >= 0)) {
                ps.margins = { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
                CAD.setPageSetup(null, ps);
                UI.log(`PAGESETUP: Margins set to T=${parts[0]} R=${parts[1]} B=${parts[2]} L=${parts[3]}.`);
            } else if (parts.length === 1 && !isNaN(parts[0])) {
                ps.margins = { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
                CAD.setPageSetup(null, ps);
                UI.log(`PAGESETUP: All margins set to ${parts[0]}.`);
            } else {
                UI.log('Enter margins as "top,right,bottom,left" or single value.', 'error');
                return;
            }
            state.cmdOptions.pagesetupStep = null;
            UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
            return;
        }

        if (option === 'paper' || option === 'p') {
            state.cmdOptions.pagesetupStep = 'papersize';
            UI.log('PAGESETUP: Enter paper size (A4/A3/A2/A1/A0/Letter/Legal/Tabloid):', 'prompt');
        } else if (option === 'orientation' || option === 'o') {
            ps.orientation = ps.orientation === 'Landscape' ? 'Portrait' : 'Landscape';
            const w = ps.paperWidth;
            ps.paperWidth = ps.paperHeight;
            ps.paperHeight = w;
            CAD.setPageSetup(null, ps);
            const layout = CAD.getLayout(CAD.currentLayout);
            if (layout && layout.paper) {
                layout.paper.width = ps.paperWidth;
                layout.paper.height = ps.paperHeight;
            }
            UI.log(`PAGESETUP: Orientation set to ${ps.orientation} (${ps.paperWidth}x${ps.paperHeight}mm).`);
            Renderer.draw();
            UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
        } else if (option === 'scale' || option === 's') {
            state.cmdOptions.pagesetupStep = 'scale';
            UI.log(`PAGESETUP: Enter plot scale (Fit, 1:1, 1:2, 1:50, etc.) <${ps.plotScale}>:`, 'prompt');
        } else if (option === 'margins' || option === 'm') {
            state.cmdOptions.pagesetupStep = 'margins';
            UI.log(`PAGESETUP: Enter margins (top,right,bottom,left) <${ps.margins.top},${ps.margins.right},${ps.margins.bottom},${ps.margins.left}>:`, 'prompt');
        } else if (option === 'plotarea' || option === 'a') {
            const areas = ['Layout', 'Extents', 'Window'];
            const current = areas.indexOf(ps.plotArea);
            ps.plotArea = areas[(current + 1) % areas.length];
            CAD.setPageSetup(null, ps);
            UI.log(`PAGESETUP: Plot area set to ${ps.plotArea}.`);
            UI.log('Options: [Paper/Orientation/Scale/Margins/plotArea]:', 'prompt');
        } else if (option === 'exit' || option === 'x' || option === '') {
            this.finishCommand();
        } else {
            UI.log('PAGESETUP: Use [Paper/Orientation/Scale/Margins/plotArea] or Enter to exit.', 'error');
        }
    },

    // --- VPSCALE ---
    handleVpScaleInput(input) {
        const layout = CAD.getLayout(CAD.currentLayout);
        if (!layout) { this.finishCommand(); return; }

        let scale = 1;
        const parts = input.split(':');
        if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (!isNaN(num) && !isNaN(den) && den !== 0) {
                scale = num / den;
            }
        } else {
            scale = parseFloat(input);
        }

        if (isNaN(scale) || scale <= 0) {
            UI.log('VPSCALE: Invalid scale. Enter ratio like 1:50 or decimal like 0.02.', 'error');
            return;
        }

        // Find the active viewport
        const vp = layout.viewports.find(v => v.id === CAD.activeViewportId);
        if (vp) {
            vp.viewScale = scale;
            UI.log(`VPSCALE: Viewport scale set to ${input} (factor: ${scale}).`);
            Renderer.draw();
        } else {
            UI.log('VPSCALE: No active viewport found.', 'error');
        }
        this.finishCommand();
    },

    // --- IMAGECLIP ---
    handleImageClipInput(input) {
        const state = CAD;
        const option = input.toLowerCase();

        if (option === 'on') {
            CAD.saveUndoState('IMAGECLIP');
            state.cmdOptions.clipTarget.clipEnabled = true;
            CAD.updateEntity(state.cmdOptions.clipTarget.id, state.cmdOptions.clipTarget, true);
            UI.log('IMAGECLIP: Clipping enabled.');
            this.finishCommand();
        } else if (option === 'off') {
            CAD.saveUndoState('IMAGECLIP');
            state.cmdOptions.clipTarget.clipEnabled = false;
            CAD.updateEntity(state.cmdOptions.clipTarget.id, state.cmdOptions.clipTarget, true);
            UI.log('IMAGECLIP: Clipping disabled.');
            this.finishCommand();
        } else if (option === 'delete' || option === 'd') {
            CAD.saveUndoState('IMAGECLIP');
            delete state.cmdOptions.clipTarget.clipBoundary;
            state.cmdOptions.clipTarget.clipEnabled = false;
            CAD.updateEntity(state.cmdOptions.clipTarget.id, state.cmdOptions.clipTarget, true);
            UI.log('IMAGECLIP: Clip boundary deleted.');
            this.finishCommand();
        } else if (option === 'new' || option === 'n') {
            state.cmdOptions.clipStep = 'corner1';
            UI.log('IMAGECLIP: Specify first corner of clip rectangle:', 'prompt');
        } else {
            UI.log('IMAGECLIP: Use [ON/OFF/Delete/New].', 'error');
        }
    },

    handleImageClipClick(point) {
        const state = CAD;
        if (!state.cmdOptions.clipTarget) return;

        if (state.cmdOptions.clipStep === 'corner1') {
            state.cmdOptions.clipCorner1 = { ...point };
            state.cmdOptions.clipStep = 'corner2';
            UI.log('IMAGECLIP: Specify opposite corner:', 'prompt');
        } else if (state.cmdOptions.clipStep === 'corner2') {
            const c1 = state.cmdOptions.clipCorner1;
            const c2 = point;
            CAD.saveUndoState('IMAGECLIP');
            state.cmdOptions.clipTarget.clipBoundary = {
                type: 'rect',
                p1: { x: Math.min(c1.x, c2.x), y: Math.min(c1.y, c2.y) },
                p2: { x: Math.max(c1.x, c2.x), y: Math.max(c1.y, c2.y) }
            };
            state.cmdOptions.clipTarget.clipEnabled = true;
            CAD.updateEntity(state.cmdOptions.clipTarget.id, state.cmdOptions.clipTarget, true);
            UI.log('IMAGECLIP: Clip boundary set.');
            this.finishCommand();
        }
    },

    // --- FIELD ---
    handleFieldTypeInput(input) {
        const state = CAD;
        const option = input.toLowerCase();
        const validTypes = ['date', 'filename', 'author', 'area', 'numobjects', 'title', 'custom'];

        if (validTypes.includes(option)) {
            state.cmdOptions.fieldType = option;
            state.cmdOptions.fieldStep = 'place';
            UI.log('FIELD: Click to place the field:', 'prompt');
        } else {
            UI.log('FIELD: Invalid type. Use [Date/Filename/Author/Area/NumObjects/Title/Custom].', 'error');
        }
    },

    handleFieldClick(point) {
        const state = CAD;
        if (state.cmdOptions.fieldStep !== 'place') return;

        const fieldType = state.cmdOptions.fieldType || 'date';
        const evaluated = this.evaluateField(fieldType);
        const height = CAD.textHeight || 10;

        CAD.addEntity({
            type: 'field',
            position: { ...point },
            height: height,
            fieldType: fieldType,
            fieldExpression: `%<\\AcVar ${fieldType}>%`,
            evaluatedText: evaluated,
            textStyle: CAD.currentTextStyle
        });

        // Track the field for updates
        CAD.fields.push({
            id: CAD.entities[CAD.entities.length - 1].id,
            type: fieldType
        });

        UI.log(`Field (${fieldType}) created: "${evaluated}"`);
        this.finishCommand();
    },

    evaluateField(type) {
        switch (type) {
            case 'date':
                return new Date().toLocaleDateString();
            case 'filename':
                return CAD.drawingName || 'Untitled';
            case 'author':
                return 'BrowserCAD User';
            case 'area':
                return '---';
            case 'numobjects':
                return String(CAD.entities.length);
            case 'title':
                return CAD.drawingName || 'Untitled';
            case 'custom':
                return '---';
            default:
                return '---';
        }
    },

    // --- COUNT ---
    executeCount() {
        const entities = CAD.entities.filter(e => {
            const layer = CAD.getLayer(e.layer);
            return !layer || (layer.visible && !layer.frozen);
        });

        const byType = {};
        const byBlock = {};

        entities.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
            if (e.type === 'block' || e.type === 'insert') {
                const name = e.blockName || e.name || 'unnamed';
                byBlock[name] = (byBlock[name] || 0) + 1;
            }
        });

        return { byType, byBlock, total: entities.length };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Commands;
}
