/* ============================================
   BrowserCAD - Storage Module
   ============================================ */

const Storage = {
    STORAGE_KEY: 'htmlcad_drawing',
    SETTINGS_KEY: 'htmlcad_settings',
    _googleApisLoadingPromise: null,

    loadGoogleApis(callback) {
        if (this._gisInited && this._gapiInited) {
            callback();
            return;
        }

        if (this._googleApisLoadingPromise) {
            this._googleApisLoadingPromise.then(callback).catch(() => {});
            return;
        }

        const loadScript = (src, errorMessage) => new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error(errorMessage)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(errorMessage));
            document.head.appendChild(script);
        });

        const gisReady = (typeof google !== 'undefined' && google.accounts)
            ? this.initGisClient()
            : loadScript('https://accounts.google.com/gsi/client', 'Error loading Google Identity Services.')
                .then(() => this.initGisClient());

        const gapiReady = (typeof gapi !== 'undefined')
            ? this.initGapiClient()
            : loadScript('https://apis.google.com/js/api.js', 'Error loading Google API Client.')
                .then(() => this.initGapiClient());

        this._googleApisLoadingPromise = Promise.all([gisReady, gapiReady]);

        this._googleApisLoadingPromise
            .then(() => callback())
            .catch((err) => {
                this._googleApisLoadingPromise = null;
                UI.log(err.message, 'error');
            });
    },

    // ==========================================
    // LOCAL STORAGE OPERATIONS
    // ==========================================

    saveToLocalStorage() {
        try {
            const data = CAD.toJSON();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            CAD.modified = false;
            UI.log('Drawing saved to local storage.');
            return true;
        } catch (e) {
            UI.log('Error saving drawing: ' + e.message, 'error');
            return false;
        }
    },

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                UI.log('No saved drawing found.');
                return false;
            }

            const data = JSON.parse(saved);
            CAD.fromJSON(data);
            UI.updateLayerUI();
            UI.renderLayoutTabs();
            Renderer.draw();
            UI.log('Drawing loaded from local storage.');
            return true;
        } catch (e) {
            UI.log('Error loading drawing: ' + e.message, 'error');
            return false;
        }
    },

    clearLocalStorage() {
        localStorage.removeItem(this.STORAGE_KEY);
        UI.log('Saved drawing cleared.');
    },

    hasSavedDrawing() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    // ==========================================
    // SETTINGS PERSISTENCE
    // ==========================================

    saveSettings() {
        try {
            const settings = {
                snapEnabled: CAD.snapEnabled,
                osnapEnabled: CAD.osnapEnabled,
                gridSnapEnabled: CAD.gridSnapEnabled,
                snapModes: CAD.snapModes,
                orthoEnabled: CAD.orthoEnabled,
                polarEnabled: CAD.polarEnabled,
                polarAngle: CAD.polarAngle,
                showGrid: CAD.showGrid,
                gridSpacing: CAD.gridSpacing,
                gridSubdivisions: CAD.gridSubdivisions,
                gridSize: CAD.gridSize,
                dimPrecision: CAD.dimPrecision,
                lineType: CAD.lineType,
                lineTypeScale: CAD.lineTypeScale
            };
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (!saved) return false;

            const settings = JSON.parse(saved);
            const { snapModes, ...rest } = settings;
            Object.assign(CAD, rest);
            if (snapModes) {
                CAD.snapModes = { ...CAD.snapModes, ...snapModes };
            }
            // Explicitly restore snap toggles (may be missing in older settings)
            if (settings.osnapEnabled !== undefined) CAD.osnapEnabled = settings.osnapEnabled;
            if (settings.gridSnapEnabled !== undefined) CAD.gridSnapEnabled = settings.gridSnapEnabled;
            UI.updateStatusBar();
            return true;
        } catch (e) {
            console.error('Error loading settings:', e);
            return false;
        }
    },

    // ==========================================
    // FILE EXPORT - JSON
    // ==========================================

    exportJSON() {
        try {
            const data = CAD.toJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            this.downloadBlob(blob, `${CAD.drawingName || 'drawing'}.json`);
            UI.log('Drawing exported as JSON.');
        } catch (e) {
            UI.log('Error exporting JSON: ' + e.message, 'error');
        }
    },

    // ==========================================
    // FILE EXPORT - DXF
    // ==========================================

    exportDXF() {
        try {
            const dxf = this.generateDXF();
            const blob = new Blob([dxf], { type: 'application/dxf' });
            this.downloadBlob(blob, `${CAD.drawingName || 'drawing'}.dxf`);
            UI.log('Drawing exported as DXF.');
        } catch (e) {
            UI.log('Error exporting DXF: ' + e.message, 'error');
        }
    },

    generateDXF() {
        if (typeof DXF !== 'undefined' && DXF.export) {
            return DXF.export(CAD);
        }
        return this.generateDXFLegacy();
    },

    getDrawingExtents() {
        let minX = 0, minY = 0, maxX = 1000, maxY = 1000;
        CAD.entities.forEach(entity => {
            const ext = CAD.getEntityExtents(entity);
            if (ext) {
                minX = Math.min(minX, ext.minX);
                minY = Math.min(minY, ext.minY);
                maxX = Math.max(maxX, ext.maxX);
                maxY = Math.max(maxY, ext.maxY);
            }
        });
        return { minX, minY, maxX, maxY };
    },

    fromDxfPoint(point) {
        return {
            x: point?.x || 0,
            y: -(point?.y || 0)
        };
    },

    generateDXFLegacy() {
        let dxf = '';

        // Calculate actual extents for header
        const { minX, minY, maxX, maxY } = this.getDrawingExtents();

        // Header section
        dxf += '0\nSECTION\n';
        dxf += '2\nHEADER\n';
        dxf += '9\n$ACADVER\n1\nAC1015\n';
        dxf += '9\n$INSBASE\n10\n0.0\n20\n0.0\n30\n0.0\n';
        dxf += '9\n$EXTMIN\n10\n' + minX + '\n20\n' + (-maxY) + '\n30\n0.0\n';
        dxf += '9\n$EXTMAX\n10\n' + maxX + '\n20\n' + (-minY) + '\n30\n0.0\n';
        dxf += '9\n$MEASUREMENT\n70\n1\n'; // Metric
        dxf += '9\n$LUNITS\n70\n2\n'; // Decimal
        dxf += '9\n$INSUNITS\n70\n4\n'; // Millimeters
        dxf += '0\nENDSEC\n';

        // Tables section
        dxf += '0\nSECTION\n';
        dxf += '2\nTABLES\n';

        // LTYPE table (line types - required by many DXF readers)
        dxf += '0\nTABLE\n';
        dxf += '2\nLTYPE\n';
        dxf += '70\n3\n';
        // ByBlock
        dxf += '0\nLTYPE\n';
        dxf += '2\nByBlock\n';
        dxf += '70\n0\n';
        dxf += '3\n\n';
        dxf += '72\n65\n';
        dxf += '73\n0\n';
        dxf += '40\n0.0\n';
        // ByLayer
        dxf += '0\nLTYPE\n';
        dxf += '2\nByLayer\n';
        dxf += '70\n0\n';
        dxf += '3\n\n';
        dxf += '72\n65\n';
        dxf += '73\n0\n';
        dxf += '40\n0.0\n';
        // Continuous
        dxf += '0\nLTYPE\n';
        dxf += '2\nCONTINUOUS\n';
        dxf += '70\n0\n';
        dxf += '3\nSolid line\n';
        dxf += '72\n65\n';
        dxf += '73\n0\n';
        dxf += '40\n0.0\n';
        dxf += '0\nENDTAB\n';

        // STYLE table (text styles - required for TEXT/MTEXT entities)
        dxf += '0\nTABLE\n';
        dxf += '2\nSTYLE\n';
        dxf += '70\n1\n';
        dxf += '0\nSTYLE\n';
        dxf += '2\nStandard\n';
        dxf += '70\n0\n';
        dxf += '40\n0.0\n'; // Fixed height (0 = not fixed)
        dxf += '41\n1.0\n'; // Width factor
        dxf += '50\n0.0\n'; // Oblique angle
        dxf += '71\n0\n'; // Text generation flags
        dxf += '42\n2.5\n'; // Last height used
        dxf += '3\ntxt\n'; // Primary font file
        dxf += '0\nENDTAB\n';

        // LAYER table
        dxf += '0\nTABLE\n';
        dxf += '2\nLAYER\n';
        dxf += '70\n' + CAD.layers.length + '\n';

        CAD.layers.forEach(layer => {
            const flags = (layer.frozen ? 1 : 0) + (layer.locked ? 4 : 0);
            const colorIndex = this.getAciColor(layer.color);
            const layerColor = layer.visible === false ? -Math.abs(colorIndex) : colorIndex;
            const lineTypeName = (layer.lineType || 'Continuous').toString().toUpperCase();
            const lineWeight = this.getLayerLineWeight(layer.lineWeight);
            dxf += '0\nLAYER\n';
            dxf += '2\n' + layer.name + '\n';
            dxf += '70\n' + flags + '\n';
            dxf += '62\n' + layerColor + '\n';
            dxf += '6\n' + lineTypeName + '\n';
            if (lineWeight !== null) {
                dxf += '370\n' + lineWeight + '\n';
            }
        });

        dxf += '0\nENDTAB\n';
        dxf += '0\nENDSEC\n';

        // Blocks section (for block definitions)
        dxf += '0\nSECTION\n';
        dxf += '2\nBLOCKS\n';

        // Add each block definition
        const blockNames = CAD.getBlockList();
        blockNames.forEach(name => {
            const block = CAD.getBlock(name);
            if (block) {
                dxf += this.blockToDXF(block);
            }
        });

        dxf += '0\nENDSEC\n';

        // Entities section
        dxf += '0\nSECTION\n';
        dxf += '2\nENTITIES\n';

        CAD.entities.forEach(entity => {
            dxf += this.entityToDXF(entity);
        });

        dxf += '0\nENDSEC\n';
        dxf += '0\nEOF\n';

        return dxf;
    },

    blockToDXF(block) {
        let dxf = '';

        // Block header
        dxf += '0\nBLOCK\n';
        dxf += '8\n0\n'; // Layer
        dxf += '2\n' + block.name + '\n'; // Block name
        dxf += '70\n0\n'; // Block flags
        dxf += '10\n' + block.basePoint.x + '\n'; // Base point X
        dxf += '20\n' + (-block.basePoint.y) + '\n'; // Base point Y
        dxf += '30\n0.0\n'; // Base point Z
        dxf += '3\n' + block.name + '\n'; // Block name again

        // Block entities
        block.entities.forEach(entity => {
            dxf += this.entityToDXF(entity);
        });

        // End block
        dxf += '0\nENDBLK\n';
        dxf += '8\n0\n';

        return dxf;
    },

    entityToDXF(entity) {
        let dxf = '';
        const color = CAD.getEntityColor(entity);
        const colorInt = Utils.hexToInt(color);

        switch (entity.type) {
            case 'line':
                dxf += '0\nLINE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                if (entity.lineType && entity.lineType !== 'continuous') {
                    dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
                }
                dxf += '10\n' + entity.p1.x + '\n';
                dxf += '20\n' + (-entity.p1.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '11\n' + entity.p2.x + '\n';
                dxf += '21\n' + (-entity.p2.y) + '\n';
                dxf += '31\n0.0\n';
                break;

            case 'circle':
                dxf += '0\nCIRCLE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                if (entity.lineType && entity.lineType !== 'continuous') {
                    dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
                }
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.r + '\n';
                break;

            case 'arc':
                dxf += '0\nARC\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                if (entity.lineType && entity.lineType !== 'continuous') {
                    dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
                }
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.r + '\n';
                // Convert radians to degrees and flip for DXF coordinate system
                dxf += '50\n' + (-Utils.radToDeg(entity.end)) + '\n';
                dxf += '51\n' + (-Utils.radToDeg(entity.start)) + '\n';
                break;

            case 'rect':
                dxf += '0\nLWPOLYLINE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '90\n4\n';
                dxf += '70\n1\n'; // Closed
                dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n';
                dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p1.y) + '\n';
                dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p2.y) + '\n';
                dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p2.y) + '\n';
                break;

            case 'polyline':
                if (entity.isSpline && entity.points.length >= 2) {
                    // Export as DXF SPLINE with fit points
                    dxf += this.splineToDXF(entity, colorInt);
                } else {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + entity.layer + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    if (entity.lineType && entity.lineType !== 'continuous') {
                        dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
                    }
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n' + (entity.closed || Utils.isPolygonClosed(entity.points) ? 1 : 0) + '\n';
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;

            case 'ellipse':
                dxf += '0\nELLIPSE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                // Major axis endpoint relative to center
                const majorX = entity.rx * Math.cos(entity.rotation || 0);
                const majorY = entity.rx * Math.sin(entity.rotation || 0);
                dxf += '11\n' + majorX + '\n';
                dxf += '21\n' + (-majorY) + '\n';
                dxf += '31\n0.0\n';
                // Ratio of minor to major axis
                dxf += '40\n' + (entity.ry / entity.rx) + '\n';
                dxf += '41\n0.0\n'; // Start parameter
                dxf += '42\n' + (Math.PI * 2) + '\n'; // End parameter
                break;

            case 'text':
                dxf += '0\nTEXT\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.position.x + '\n';
                dxf += '20\n' + (-entity.position.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.height + '\n';
                dxf += '1\n' + entity.text + '\n';
                if (entity.rotation) {
                    dxf += '50\n' + entity.rotation + '\n';
                }
                break;

            case 'point':
                dxf += '0\nPOINT\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.position.x + '\n';
                dxf += '20\n' + (-entity.position.y) + '\n';
                dxf += '30\n0.0\n';
                break;

            case 'block':
                // Block reference (INSERT)
                dxf += '0\nINSERT\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '2\n' + entity.blockName + '\n'; // Block name
                dxf += '10\n' + entity.insertPoint.x + '\n'; // Insertion point X
                dxf += '20\n' + (-entity.insertPoint.y) + '\n'; // Insertion point Y
                dxf += '30\n0.0\n'; // Insertion point Z
                dxf += '41\n' + (entity.scale?.x || 1) + '\n'; // X scale
                dxf += '42\n' + (entity.scale?.y || 1) + '\n'; // Y scale
                dxf += '43\n1.0\n'; // Z scale
                dxf += '50\n' + (-Utils.radToDeg(entity.rotation || 0)) + '\n'; // Rotation angle
                break;

            case 'hatch':
                dxf += this.hatchEntityToDXF(entity, colorInt);
                break;

            case 'dimension':
                dxf += this.dimensionToDXF(entity, colorInt);
                break;

            case 'leader':
                dxf += this.leaderToDXF(entity, colorInt);
                break;

            case 'region':
                // Export region as a closed LWPOLYLINE
                if (entity.points && entity.points.length > 0) {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + (entity.layer || '0') + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n1\n'; // Closed
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;

            case 'donut':
                // Export donut as two circles (outer and inner)
                dxf += '0\nCIRCLE\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.outerRadius + '\n';
                // Inner circle
                dxf += '0\nCIRCLE\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.innerRadius + '\n';
                // Also export as a solid hatch between the two circles
                dxf += this.donutHatchToDXF(entity, colorInt);
                break;

            case 'mtext':
                dxf += '0\nMTEXT\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.position.x + '\n';
                dxf += '20\n' + (-entity.position.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + (entity.height || 10) + '\n';
                dxf += '41\n' + (entity.width || 0) + '\n'; // Reference column width
                dxf += '71\n1\n'; // Attachment point: top left
                dxf += '1\n' + (entity.text || '') + '\n';
                if (entity.rotation) {
                    dxf += '50\n' + entity.rotation + '\n';
                }
                break;

            case 'wipeout':
                // Export wipeout boundary as LWPOLYLINE (DXF WIPEOUT is proprietary)
                if (entity.points && entity.points.length > 0) {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + (entity.layer || '0') + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n1\n'; // Closed
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;

            case 'image':
                // Export image boundary as a rectangle LWPOLYLINE
                if (entity.p1 && entity.p2) {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + (entity.layer || '0') + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    dxf += '90\n4\n';
                    dxf += '70\n1\n'; // Closed
                    dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n';
                    dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p1.y) + '\n';
                    dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p2.y) + '\n';
                    dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p2.y) + '\n';
                }
                break;

            case 'mleader':
                // Export as LEADER entity for compatibility
                dxf += '  0\nLEADER\n';
                dxf += '  8\n' + layer + '\n';
                if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                dxf += '  3\nStandard\n';
                dxf += ' 76\n3\n'; // leader path type: spline=0, straight=3
                dxf += ' 73\n0\n'; // no arrowhead in legacy (drawn by viewer)
                dxf += ' 40\n' + (entity.height || 2.5) + '\n'; // text height
                (entity.points || []).forEach(p => {
                    dxf += ' 10\n' + p.x.toFixed(6) + '\n 20\n' + (-p.y).toFixed(6) + '\n 30\n0.0\n';
                });
                break;
            case 'tolerance':
                // Export as TOLERANCE entity
                dxf += '  0\nTOLERANCE\n';
                dxf += '  8\n' + layer + '\n';
                if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                dxf += ' 10\n' + (entity.position.x).toFixed(6) + '\n';
                dxf += ' 20\n' + (-entity.position.y).toFixed(6) + '\n';
                dxf += ' 30\n0.0\n';
                // Encode tolerance string
                const tolStr = (entity.frames || []).map(f => {
                    let s = (f.symbol || '') + (f.diameterSymbol ? '%%c' : '') + (f.tolerance1 || '');
                    if (f.datum1) s += '%%v' + f.datum1;
                    if (f.datum2) s += '%%v' + f.datum2;
                    if (f.datum3) s += '%%v' + f.datum3;
                    return s;
                }).join('%%v');
                dxf += '  1\n' + tolStr + '\n';
                break;
            case 'trace':
                // DXF TRACE entity - 4 corner points
                dxf += '  0\nTRACE\n';
                dxf += '  8\n' + layer + '\n';
                if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                if (entity.points && entity.points.length >= 4) {
                    dxf += ' 10\n' + entity.points[0].x.toFixed(6) + '\n 20\n' + (-entity.points[0].y).toFixed(6) + '\n 30\n0.0\n';
                    dxf += ' 11\n' + entity.points[1].x.toFixed(6) + '\n 21\n' + (-entity.points[1].y).toFixed(6) + '\n 31\n0.0\n';
                    dxf += ' 12\n' + entity.points[2].x.toFixed(6) + '\n 22\n' + (-entity.points[2].y).toFixed(6) + '\n 32\n0.0\n';
                    dxf += ' 13\n' + entity.points[3].x.toFixed(6) + '\n 23\n' + (-entity.points[3].y).toFixed(6) + '\n 33\n0.0\n';
                }
                break;
            case 'field':
                // Export as TEXT with evaluated content
                dxf += '  0\nTEXT\n';
                dxf += '  8\n' + layer + '\n';
                if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                dxf += ' 10\n' + (entity.position.x).toFixed(6) + '\n';
                dxf += ' 20\n' + (-entity.position.y).toFixed(6) + '\n';
                dxf += ' 30\n0.0\n';
                dxf += ' 40\n' + (entity.height || 10) + '\n';
                dxf += '  1\n' + (entity.evaluatedText || entity.fieldExpression || '---') + '\n';
                break;
            case 'solid':
                if (entity.points && entity.points.length >= 3) {
                    dxf += '  0\nSOLID\n';
                    dxf += '  8\n' + layer + '\n';
                    if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                    const solidCodes = [[10,20],[11,21],[12,22],[13,23]];
                    for (let si = 0; si < Math.min(entity.points.length, 4); si++) {
                        dxf += ' ' + solidCodes[si][0] + '\n' + entity.points[si].x.toFixed(6) + '\n';
                        dxf += ' ' + solidCodes[si][1] + '\n' + (-entity.points[si].y).toFixed(6) + '\n';
                        dxf += ' ' + (solidCodes[si][0] + 20) + '\n0.0\n';
                    }
                    if (entity.points.length === 3) {
                        dxf += ' 13\n' + entity.points[2].x.toFixed(6) + '\n 23\n' + (-entity.points[2].y).toFixed(6) + '\n 33\n0.0\n';
                    }
                }
                break;
            case 'revcloud':
                if (entity.points && entity.points.length > 0) {
                    dxf += '  0\nLWPOLYLINE\n';
                    dxf += '  8\n' + layer + '\n';
                    if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                    dxf += ' 90\n' + entity.points.length + '\n';
                    dxf += ' 70\n1\n';
                    entity.points.forEach(p => {
                        dxf += ' 10\n' + p.x.toFixed(6) + '\n 20\n' + (-p.y).toFixed(6) + '\n';
                    });
                }
                break;
            case 'table':
                if (entity.position) {
                    const tpos = entity.position;
                    const trows = entity.rows || 3, tcols = entity.cols || 3;
                    const trh = entity.rowHeight || 10, tcw = entity.colWidth || 30;
                    for (let r = 0; r <= trows; r++) {
                        dxf += '  0\nLINE\n  8\n' + layer + '\n';
                        if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                        dxf += ' 10\n' + tpos.x.toFixed(6) + '\n 20\n' + (-(tpos.y + r * trh)).toFixed(6) + '\n 30\n0.0\n';
                        dxf += ' 11\n' + (tpos.x + tcols * tcw).toFixed(6) + '\n 21\n' + (-(tpos.y + r * trh)).toFixed(6) + '\n 31\n0.0\n';
                    }
                    for (let c = 0; c <= tcols; c++) {
                        dxf += '  0\nLINE\n  8\n' + layer + '\n';
                        if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                        dxf += ' 10\n' + (tpos.x + c * tcw).toFixed(6) + '\n 20\n' + (-tpos.y).toFixed(6) + '\n 30\n0.0\n';
                        dxf += ' 11\n' + (tpos.x + c * tcw).toFixed(6) + '\n 21\n' + (-(tpos.y + trows * trh)).toFixed(6) + '\n 31\n0.0\n';
                    }
                }
                break;
            case 'mline':
                if (entity.points && entity.points.length >= 2) {
                    for (let mi = 0; mi < entity.points.length - 1; mi++) {
                        dxf += '  0\nLINE\n  8\n' + layer + '\n';
                        if (colorInt !== null) dxf += ' 62\n' + colorInt + '\n';
                        dxf += ' 10\n' + entity.points[mi].x.toFixed(6) + '\n 20\n' + (-entity.points[mi].y).toFixed(6) + '\n 30\n0.0\n';
                        dxf += ' 11\n' + entity.points[mi + 1].x.toFixed(6) + '\n 21\n' + (-entity.points[mi + 1].y).toFixed(6) + '\n 31\n0.0\n';
                    }
                }
                break;
        }

        // Add hatch if entity has it (for entities with inline hatch property)
        if (entity.hatch && entity.type !== 'hatch' && entity.type !== 'donut') {
            dxf += this.generateHatchDXF(entity, colorInt);
        }

        return dxf;
    },

    generateHatchDXF(entity, colorInt) {
        let dxf = '';
        const hatchData = entity.hatch;
        const pattern = (typeof hatchData === 'string' ? hatchData : hatchData?.pattern || 'solid').toLowerCase();
        const isSolid = pattern === 'solid';

        // Map internal pattern names to DXF pattern names
        const dxfPatternName = this._getDXFPatternName(pattern);

        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n';
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n';
        dxf += '2\n' + dxfPatternName + '\n';
        dxf += '70\n' + (isSolid ? 1 : 0) + '\n'; // Solid fill flag
        dxf += '71\n0\n'; // Non-associative
        dxf += '75\n0\n'; // Hatch style
        dxf += '76\n1\n'; // Pattern type: predefined
        if (!isSolid) {
            dxf += '52\n' + (entity.angle || 0) + '\n'; // Pattern angle
            dxf += '41\n' + (entity.scale || 1) + '\n'; // Pattern scale
        }
        dxf += '91\n1\n'; // 1 boundary path

        if (entity.type === 'circle') {
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n2\n';
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n0.0\n51\n360.0\n73\n1\n97\n0\n';
        } else if (entity.type === 'ellipse') {
            // Approximate ellipse boundary as polyline
            const numPts = 36;
            dxf += '92\n2\n72\n0\n73\n1\n';
            dxf += '93\n' + numPts + '\n';
            for (let j = 0; j < numPts; j++) {
                const angle = (j / numPts) * Math.PI * 2;
                const rot = entity.rotation || 0;
                const ex = entity.center.x + entity.rx * Math.cos(angle) * Math.cos(rot) - entity.ry * Math.sin(angle) * Math.sin(rot);
                const ey = entity.center.y + entity.rx * Math.cos(angle) * Math.sin(rot) + entity.ry * Math.sin(angle) * Math.cos(rot);
                dxf += '10\n' + ex + '\n20\n' + (-ey) + '\n';
            }
            dxf += '97\n0\n';
        } else {
            let pts = [];
            if (entity.type === 'rect') {
                pts = [
                    { x: entity.p1.x, y: -entity.p1.y },
                    { x: entity.p2.x, y: -entity.p1.y },
                    { x: entity.p2.x, y: -entity.p2.y },
                    { x: entity.p1.x, y: -entity.p2.y }
                ];
            } else if (entity.type === 'polyline') {
                if (!entity.points || !Utils.isPolygonClosed(entity.points)) {
                    return '';
                }
                pts = entity.points.map(p => ({ x: p.x, y: -p.y }));
            }

            if (pts.length > 0) {
                dxf += '92\n2\n72\n0\n73\n1\n';
                dxf += '93\n' + pts.length + '\n';
                pts.forEach(p => {
                    dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
                });
                dxf += '97\n0\n';
            }
        }

        // Pattern definition for non-solid hatches
        if (!isSolid) {
            dxf += this._getDXFPatternDef(pattern);
        }

        return dxf;
    },

    /**
     * Map internal pattern name to DXF pattern name.
     */
    _getDXFPatternName(pattern) {
        const map = {
            'solid': 'SOLID',
            'diagonal': 'ANSI31',
            'cross': 'ANSI37',
            'dots': 'DOTS',
            'ansi31': 'ANSI31',
            'ansi32': 'ANSI32',
            'ansi33': 'ANSI33',
            'ansi34': 'ANSI34',
            'ansi35': 'ANSI35',
            'ansi36': 'ANSI36',
            'ansi37': 'ANSI37',
            'ansi38': 'ANSI38',
            'brick': 'BRICK',
            'earth': 'EARTH',
            'grass': 'GRASS',
            'honey': 'HONEY',
            'hound': 'HOUND',
            'insul': 'INSUL',
            'net': 'NET',
            'net3': 'NET3',
            'dash': 'DASH',
            'square': 'SQUARE',
            'steel': 'STEEL',
            'swamp': 'SWAMP',
            'trans': 'TRANS',
            'zigzag': 'ZIGZAG'
        };
        return map[pattern] || pattern.toUpperCase();
    },

    /**
     * Generate DXF pattern definition lines for non-solid hatches.
     */
    _getDXFPatternDef(pattern) {
        let dxf = '';
        // Helper: write one DXF pattern line definition
        // 53=angle, 43=baseX, 44=baseY, 45=deltaX, 46=deltaY, 79=num dashes, 49=dash lengths
        const line = (angle, deltaX, deltaY, dashes) => {
            let s = '53\n' + angle + '\n43\n0.0\n44\n0.0\n45\n' + deltaX + '\n46\n' + deltaY + '\n';
            if (dashes && dashes.length > 0) {
                s += '79\n' + dashes.length + '\n';
                dashes.forEach(d => { s += '49\n' + d + '\n'; });
            } else {
                s += '79\n0\n';
            }
            return s;
        };

        switch (pattern) {
            case 'diagonal':
            case 'angle':
            case 'ansi31':
                dxf += '78\n1\n';
                dxf += line(45, -1, 1);
                break;
            case 'ansi32':
                dxf += '78\n2\n';
                dxf += line(45, -1, 1);
                dxf += line(45, -1, 1); // second parallel family, offset
                break;
            case 'ansi33':
                dxf += '78\n1\n';
                dxf += line(45, -2, 2);
                break;
            case 'ansi34':
                dxf += '78\n2\n';
                dxf += line(45, -2, 2);
                dxf += line(45, -2, 2);
                break;
            case 'ansi35':
                dxf += '78\n1\n';
                dxf += line(135, 1, 1);
                break;
            case 'ansi36':
                dxf += '78\n1\n';
                dxf += line(0, 0, 1);
                break;
            case 'cross':
            case 'ansi37':
                dxf += '78\n2\n';
                dxf += line(45, -1, 1);
                dxf += line(135, 1, 1);
                break;
            case 'ansi38':
                dxf += '78\n2\n';
                dxf += line(45, -1, 1);
                dxf += line(0, 0, 1);
                break;
            case 'dots':
                dxf += '78\n2\n';
                dxf += line(0, 0, 3.175, [0, -3.175]);
                dxf += line(90, 0, 3.175, [0, -3.175]);
                break;
            case 'brick':
                dxf += '78\n2\n';
                dxf += line(0, 0, 6.35);
                dxf += line(90, 0, 6.35, [3.175, -3.175]);
                break;
            case 'honey':
                dxf += '78\n3\n';
                dxf += line(0, 5.5, 3.175, [3.175, -2.325]);
                dxf += line(120, 5.5, 3.175, [3.175, -2.325]);
                dxf += line(60, 5.5, 3.175, [3.175, -2.325]);
                break;
            case 'net':
            case 'square':
                dxf += '78\n2\n';
                dxf += line(0, 0, 4);
                dxf += line(90, 0, 4);
                break;
            case 'net3':
                dxf += '78\n3\n';
                dxf += line(0, 0, 4);
                dxf += line(60, 0, 4);
                dxf += line(120, 0, 4);
                break;
            case 'dash':
                dxf += '78\n1\n';
                dxf += line(0, 0, 3.175, [3, -2]);
                break;
            case 'earth':
                dxf += '78\n3\n';
                dxf += line(0, 0, 6, [3, -2]);
                dxf += line(45, 0, 6, [2, -3]);
                dxf += line(90, 0, 6, [1, -4]);
                break;
            case 'grass':
                dxf += '78\n2\n';
                dxf += line(90, 0, 7, [3, -4]);
                dxf += line(45, 0, 10, [2, -5]);
                break;
            case 'steel':
                dxf += '78\n2\n';
                dxf += line(45, -1, 1);
                dxf += line(135, 0, 12, [2, -10]);
                break;
            case 'insul':
                dxf += '78\n1\n';
                dxf += line(0, 0, 6);
                break;
            case 'zigzag':
                dxf += '78\n2\n';
                dxf += line(45, 0, 6, [4, -4]);
                dxf += line(135, 0, 6, [4, -4]);
                break;
            default:
                dxf += '78\n1\n';
                dxf += line(45, -1, 1);
        }

        return dxf;
    },

    /**
     * Export a spline polyline as a DXF SPLINE entity with fit points.
     */
    splineToDXF(entity, colorInt) {
        let dxf = '';
        const pts = entity.points;
        const isClosed = entity.closed || Utils.isPolygonClosed(pts);

        dxf += '0\nSPLINE\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        if (entity.lineType && entity.lineType !== 'continuous') {
            dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
        }
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n'; // Normal vector
        dxf += '70\n' + (8 + (isClosed ? 1 : 0)) + '\n'; // Flags: 8=planar, 1=closed
        dxf += '71\n3\n'; // Degree: cubic
        dxf += '74\n' + pts.length + '\n'; // Number of fit points

        // Fit points (group codes 11/21/31)
        pts.forEach(p => {
            dxf += '11\n' + p.x + '\n';
            dxf += '21\n' + (-p.y) + '\n';
            dxf += '31\n0.0\n';
        });

        return dxf;
    },

    /**
     * Export a standalone hatch entity to DXF.
     * Resolves clip entity IDs to boundary geometry.
     */
    hatchEntityToDXF(entity, colorInt) {
        let dxf = '';
        const clipIds = entity.clipIds || [];

        // Resolve clip entities, falling back to stored boundary if clip entities are gone
        const clipEntities = clipIds.map(id => CAD.getEntity(id)).filter(Boolean);

        // If no clip entities found, use stored boundary points as a polyline
        let boundaryEntities = clipEntities;
        if (boundaryEntities.length === 0) {
            const boundary = entity.boundary || entity.points || [];
            const pts = (typeof Geometry !== 'undefined' && Geometry.Hatch)
                ? Geometry.Hatch.getBoundaryPoints(boundary)
                : boundary;
            if (!pts || pts.length < 3) return '';
            boundaryEntities = [{ type: 'polyline', points: pts, closed: true }];
        }

        const hatchData = entity.hatch;
        const pattern = (typeof hatchData === 'string' ? hatchData : hatchData?.pattern || 'solid').toLowerCase();
        const isSolid = pattern === 'solid';
        const dxfPatternName = this._getDXFPatternName(pattern);

        const hatchAngle = entity.angle || 0;
        const hatchScale = entity.scale || 1;

        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n'; // Elevation
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n'; // Normal
        dxf += '2\n' + dxfPatternName + '\n'; // Pattern name
        dxf += '70\n' + (isSolid ? 1 : 0) + '\n'; // Solid fill flag
        dxf += '71\n0\n'; // Non-associative
        dxf += '75\n0\n'; // Hatch style (0=Normal)
        dxf += '76\n1\n'; // Hatch pattern type (1=Predefined)
        if (!isSolid) {
            dxf += '52\n' + hatchAngle + '\n'; // Pattern angle
            dxf += '41\n' + hatchScale + '\n'; // Pattern scale
        }
        dxf += '91\n' + boundaryEntities.length + '\n'; // Number of boundary paths

        boundaryEntities.forEach(be => {
            dxf += this._hatchBoundaryPath(be);
        });

        // Pattern definition for non-solid
        if (!isSolid) {
            dxf += this._getDXFPatternDef(pattern);
        }

        return dxf;
    },

    /**
     * Generate a DXF hatch boundary path for a given entity.
     */
    _hatchBoundaryPath(entity) {
        let dxf = '';

        if (entity.type === 'circle') {
            dxf += '92\n1\n'; // External boundary
            dxf += '93\n1\n'; // One edge
            dxf += '72\n2\n'; // Circular arc edge
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n0.0\n51\n360.0\n73\n1\n';
            dxf += '97\n0\n'; // Source boundary objects
        } else if (entity.type === 'rect') {
            const pts = [
                { x: entity.p1.x, y: -entity.p1.y },
                { x: entity.p2.x, y: -entity.p1.y },
                { x: entity.p2.x, y: -entity.p2.y },
                { x: entity.p1.x, y: -entity.p2.y }
            ];
            dxf += '92\n2\n'; // Polyline boundary
            dxf += '72\n0\n'; // No bulge
            dxf += '73\n1\n'; // Closed
            dxf += '93\n' + pts.length + '\n';
            pts.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
            });
            dxf += '97\n0\n';
        } else if (entity.type === 'polyline' && entity.points) {
            const pts = entity.points.map(p => ({ x: p.x, y: -p.y }));
            dxf += '92\n2\n';
            dxf += '72\n0\n';
            dxf += '73\n1\n'; // Closed
            dxf += '93\n' + pts.length + '\n';
            pts.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
            });
            dxf += '97\n0\n';
        } else if (entity.type === 'ellipse') {
            // Approximate ellipse boundary as polyline
            const numPts = 36;
            dxf += '92\n2\n';
            dxf += '72\n0\n';
            dxf += '73\n1\n';
            dxf += '93\n' + numPts + '\n';
            for (let j = 0; j < numPts; j++) {
                const angle = (j / numPts) * Math.PI * 2;
                const rot = entity.rotation || 0;
                const ex = entity.center.x + entity.rx * Math.cos(angle) * Math.cos(rot) - entity.ry * Math.sin(angle) * Math.sin(rot);
                const ey = entity.center.y + entity.rx * Math.cos(angle) * Math.sin(rot) + entity.ry * Math.sin(angle) * Math.cos(rot);
                dxf += '10\n' + ex + '\n20\n' + (-ey) + '\n';
            }
            dxf += '97\n0\n';
        } else if (entity.type === 'arc') {
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n2\n'; // Circular arc edge
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n' + (-Utils.radToDeg(entity.end)) + '\n';
            dxf += '51\n' + (-Utils.radToDeg(entity.start)) + '\n';
            dxf += '73\n1\n';
            dxf += '97\n0\n';
        } else {
            // Fallback: try line segments
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n1\n'; // Line edge
            if (entity.type === 'line') {
                dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n';
                dxf += '11\n' + entity.p2.x + '\n21\n' + (-entity.p2.y) + '\n';
            }
            dxf += '97\n0\n';
        }

        return dxf;
    },

    /**
     * Export dimension entity as decomposed DXF entities (lines + text).
     * Full DXF DIMENSION entities are complex and require block definitions.
     * Decomposing ensures compatibility with all DXF readers.
     */
    dimensionToDXF(entity, colorInt) {
        let dxf = '';
        const layer = entity.layer || '0';
        const textHeight = CAD.dimTextHeight || 2.5;
        const arrowSize = CAD.dimArrowSize || 2.5;

        if (entity.dimType === 'linear' || entity.dimType === 'aligned') {
            const p1 = entity.p1;
            const p2 = entity.p2;
            const dimPos = entity.dimLinePos;
            const isHorizontal = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y);

            let dimP1, dimP2;
            if (entity.dimType === 'aligned') {
                dimP1 = { ...p1 };
                dimP2 = { ...p2 };
            } else if (isHorizontal) {
                dimP1 = { x: p1.x, y: dimPos.y };
                dimP2 = { x: p2.x, y: dimPos.y };
            } else {
                dimP1 = { x: dimPos.x, y: p1.y };
                dimP2 = { x: dimPos.x, y: p2.y };
            }

            // Extension lines
            dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + p1.x + '\n20\n' + (-p1.y) + '\n30\n0.0\n';
            dxf += '11\n' + dimP1.x + '\n21\n' + (-dimP1.y) + '\n31\n0.0\n';

            dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + p2.x + '\n20\n' + (-p2.y) + '\n30\n0.0\n';
            dxf += '11\n' + dimP2.x + '\n21\n' + (-dimP2.y) + '\n31\n0.0\n';

            // Dimension line
            dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + dimP1.x + '\n20\n' + (-dimP1.y) + '\n30\n0.0\n';
            dxf += '11\n' + dimP2.x + '\n21\n' + (-dimP2.y) + '\n31\n0.0\n';

            // Dimension text
            const midX = (dimP1.x + dimP2.x) / 2;
            const midY = (dimP1.y + dimP2.y) / 2;
            dxf += '0\nTEXT\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + midX + '\n20\n' + (-(midY - textHeight * 0.5)) + '\n30\n0.0\n';
            dxf += '40\n' + textHeight + '\n';
            dxf += '1\n' + (entity.text || '') + '\n';
            dxf += '72\n1\n'; // Center justified

        } else if (entity.dimType === 'radius' || entity.dimType === 'diameter') {
            const center = entity.center;
            const angle = Utils.angle(center, entity.dimLinePos);
            const edgePoint = {
                x: center.x + entity.radius * Math.cos(angle),
                y: center.y + entity.radius * Math.sin(angle)
            };

            // Radius/diameter line
            if (entity.dimType === 'diameter') {
                const oppositeEdge = {
                    x: center.x - entity.radius * Math.cos(angle),
                    y: center.y - entity.radius * Math.sin(angle)
                };
                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + oppositeEdge.x + '\n20\n' + (-oppositeEdge.y) + '\n30\n0.0\n';
                dxf += '11\n' + edgePoint.x + '\n21\n' + (-edgePoint.y) + '\n31\n0.0\n';
            } else {
                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + center.x + '\n20\n' + (-center.y) + '\n30\n0.0\n';
                dxf += '11\n' + edgePoint.x + '\n21\n' + (-edgePoint.y) + '\n31\n0.0\n';
            }

            // Dimension text
            const textX = center.x + (entity.radius * 0.6) * Math.cos(angle);
            const textY = center.y + (entity.radius * 0.6) * Math.sin(angle);
            dxf += '0\nTEXT\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + textX + '\n20\n' + (-textY) + '\n30\n0.0\n';
            dxf += '40\n' + textHeight + '\n';
            dxf += '1\n' + (entity.text || '') + '\n';

        } else if (entity.dimType === 'ordinate') {
            const fp = entity.featurePoint;
            const le = entity.leaderEnd;

            // Leader lines
            if (entity.isXDatum) {
                const bend = { x: le.x, y: fp.y };
                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + fp.x + '\n20\n' + (-fp.y) + '\n30\n0.0\n';
                dxf += '11\n' + bend.x + '\n21\n' + (-bend.y) + '\n31\n0.0\n';

                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + bend.x + '\n20\n' + (-bend.y) + '\n30\n0.0\n';
                dxf += '11\n' + le.x + '\n21\n' + (-le.y) + '\n31\n0.0\n';
            } else {
                const bend = { x: fp.x, y: le.y };
                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + fp.x + '\n20\n' + (-fp.y) + '\n30\n0.0\n';
                dxf += '11\n' + bend.x + '\n21\n' + (-bend.y) + '\n31\n0.0\n';

                dxf += '0\nLINE\n8\n' + layer + '\n420\n' + colorInt + '\n';
                dxf += '10\n' + bend.x + '\n20\n' + (-bend.y) + '\n30\n0.0\n';
                dxf += '11\n' + le.x + '\n21\n' + (-le.y) + '\n31\n0.0\n';
            }

            // Text
            dxf += '0\nTEXT\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + le.x + '\n20\n' + (-le.y) + '\n30\n0.0\n';
            dxf += '40\n' + textHeight + '\n';
            dxf += '1\n' + (entity.text || '') + '\n';

        } else if (entity.dimType === 'arclength') {
            const center = entity.center;
            const r = entity.radius;
            const startA = entity.startAngle;
            const endA = entity.endAngle;

            // Export arc dimension as an arc + text
            dxf += '0\nARC\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + center.x + '\n20\n' + (-center.y) + '\n30\n0.0\n';
            dxf += '40\n' + (r + 15) + '\n'; // Offset radius
            dxf += '50\n' + (-Utils.radToDeg(endA)) + '\n';
            dxf += '51\n' + (-Utils.radToDeg(startA)) + '\n';

            // Text at midpoint
            let sweep = endA - startA;
            if (sweep < 0) sweep += 2 * Math.PI;
            const midAngle = startA + sweep / 2;
            const textR = r + 15 + textHeight;
            dxf += '0\nTEXT\n8\n' + layer + '\n420\n' + colorInt + '\n';
            dxf += '10\n' + (center.x + textR * Math.cos(midAngle)) + '\n';
            dxf += '20\n' + (-(center.y + textR * Math.sin(midAngle))) + '\n30\n0.0\n';
            dxf += '40\n' + textHeight + '\n';
            dxf += '1\n' + (entity.text || '') + '\n';
        }

        return dxf;
    },

    /**
     * Export leader entity to DXF as lines + optional text.
     */
    leaderToDXF(entity, colorInt) {
        let dxf = '';
        const layer = entity.layer || '0';

        // Export leader as LWPOLYLINE
        if (entity.points && entity.points.length >= 2) {
            dxf += '0\nLWPOLYLINE\n';
            dxf += '8\n' + layer + '\n';
            dxf += '420\n' + colorInt + '\n';
            dxf += '90\n' + entity.points.length + '\n';
            dxf += '70\n0\n'; // Open
            entity.points.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
            });
        }

        // Export leader text
        if (entity.text) {
            const pos = entity.textPosition || entity.points[entity.points.length - 1];
            dxf += '0\nTEXT\n';
            dxf += '8\n' + layer + '\n';
            dxf += '420\n' + colorInt + '\n';
            dxf += '10\n' + pos.x + '\n20\n' + (-pos.y) + '\n30\n0.0\n';
            dxf += '40\n' + (entity.height || 10) + '\n';
            dxf += '1\n' + entity.text + '\n';
        }

        return dxf;
    },

    /**
     * Export donut as a solid hatch between outer and inner circles.
     */
    donutHatchToDXF(entity, colorInt) {
        let dxf = '';

        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n'; // Elevation
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n'; // Normal
        dxf += '2\nSOLID\n';
        dxf += '70\n1\n'; // Solid fill
        dxf += '71\n0\n'; // Non-associative
        dxf += '91\n2\n'; // Two boundary paths (outer + inner)

        // Outer boundary (counterclockwise)
        dxf += '92\n1\n';
        dxf += '93\n1\n';
        dxf += '72\n2\n'; // Circular arc
        dxf += '10\n' + entity.center.x + '\n';
        dxf += '20\n' + (-entity.center.y) + '\n';
        dxf += '40\n' + entity.outerRadius + '\n';
        dxf += '50\n0.0\n51\n360.0\n73\n1\n';
        dxf += '97\n0\n';

        // Inner boundary (clockwise - hole)
        dxf += '92\n17\n'; // 16 (outermost) + 1 (external)
        dxf += '93\n1\n';
        dxf += '72\n2\n';
        dxf += '10\n' + entity.center.x + '\n';
        dxf += '20\n' + (-entity.center.y) + '\n';
        dxf += '40\n' + entity.innerRadius + '\n';
        dxf += '50\n0.0\n51\n360.0\n73\n0\n'; // CCW=0 for inner
        dxf += '97\n0\n';

        return dxf;
    },

    getAciColor(hexColor) {
        // Simplified mapping - return white (7) for now
        // A full implementation would map to CAD Color Index
        const rgb = Utils.hexToRgb(hexColor);
        if (!rgb) return 7;

        // Simple approximation
        if (rgb.r > 200 && rgb.g > 200 && rgb.b > 200) return 7; // White
        if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) return 1; // Red
        if (rgb.r < 100 && rgb.g > 200 && rgb.b < 100) return 3; // Green
        if (rgb.r < 100 && rgb.g < 100 && rgb.b > 200) return 5; // Blue
        if (rgb.r > 200 && rgb.g > 200 && rgb.b < 100) return 2; // Yellow
        if (rgb.r < 100 && rgb.g > 200 && rgb.b > 200) return 4; // Cyan
        if (rgb.r > 200 && rgb.g < 100 && rgb.b > 200) return 6; // Magenta

        return 7; // Default white
    },

    getLayerLineWeight(lineWeight) {
        if (!lineWeight) return null;
        const normalized = lineWeight.toString().trim().toLowerCase();
        if (!normalized || normalized === 'default' || normalized === 'bylayer') return null;
        const parsed = parseFloat(normalized);
        if (Number.isNaN(parsed)) return null;
        return Math.round(parsed * 100);
    },

    // ==========================================
    // FILE EXPORT - SVG
    // ==========================================

    exportSVG() {
        try {
            const svg = this.generateSVG();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            this.downloadBlob(blob, `${CAD.drawingName || 'drawing'}.svg`);
            UI.log('Drawing exported as SVG.');
        } catch (e) {
            UI.log('Error exporting SVG: ' + e.message, 'error');
        }
    },

    generateSVG() {
        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        CAD.entities.forEach(entity => {
            const ext = CAD.getEntityExtents(entity);
            if (ext) {
                minX = Math.min(minX, ext.minX);
                minY = Math.min(minY, ext.minY);
                maxX = Math.max(maxX, ext.maxX);
                maxY = Math.max(maxY, ext.maxY);
            }
        });

        if (minX === Infinity) {
            minX = 0; minY = 0; maxX = 100; maxY = 100;
        }

        const padding = 10;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width} ${height}" width="${width}" height="${height}">\n`;
        svg += `<rect x="${minX - padding}" y="${minY - padding}" width="${width}" height="${height}" fill="#1a1a1a"/>\n`;

        CAD.entities.forEach(entity => {
            svg += this.entityToSVG(entity);
        });

        svg += '</svg>';
        return svg;
    },

    entityToSVG(entity) {
        const color = CAD.getEntityColor(entity);
        const style = `stroke="${color}" stroke-width="1" fill="none"`;

        switch (entity.type) {
            case 'line':
                return `<line x1="${entity.p1.x}" y1="${entity.p1.y}" x2="${entity.p2.x}" y2="${entity.p2.y}" ${style}/>\n`;

            case 'circle':
                const fill = entity.hatch ? `fill="${color}" fill-opacity="0.2"` : 'fill="none"';
                return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.r}" stroke="${color}" stroke-width="1" ${fill}/>\n`;

            case 'arc':
                const startX = entity.center.x + entity.r * Math.cos(entity.start);
                const startY = entity.center.y + entity.r * Math.sin(entity.start);
                const endX = entity.center.x + entity.r * Math.cos(entity.end);
                const endY = entity.center.y + entity.r * Math.sin(entity.end);
                const largeArc = Math.abs(entity.end - entity.start) > Math.PI ? 1 : 0;
                const sweep = entity.end > entity.start ? 1 : 0;
                return `<path d="M ${startX} ${startY} A ${entity.r} ${entity.r} 0 ${largeArc} ${sweep} ${endX} ${endY}" ${style}/>\n`;

            case 'rect':
                const rectFill = entity.hatch ? `fill="${color}" fill-opacity="0.2"` : 'fill="none"';
                return `<rect x="${Math.min(entity.p1.x, entity.p2.x)}" y="${Math.min(entity.p1.y, entity.p2.y)}" width="${Math.abs(entity.p2.x - entity.p1.x)}" height="${Math.abs(entity.p2.y - entity.p1.y)}" stroke="${color}" stroke-width="1" ${rectFill}/>\n`;

            case 'polyline': {
                const hasBulges = entity.bulges && entity.bulges.some(b => b && Math.abs(b) > 1e-10);
                const polyFill = entity.hatch ? `fill="${color}" fill-opacity="0.2"` : 'fill="none"';
                if (!hasBulges) {
                    // Simple polyline without arcs
                    const points = entity.points.map(p => `${p.x},${p.y}`).join(' ');
                    if (entity.closed) {
                        return `<polygon points="${points}" stroke="${color}" stroke-width="1" ${polyFill}/>\n`;
                    }
                    return `<polyline points="${points}" stroke="${color}" stroke-width="1" ${polyFill}/>\n`;
                }
                // Polyline with arc segments - use SVG path
                let d = '';
                if (entity.points.length > 0) {
                    d += `M ${entity.points[0].x} ${entity.points[0].y}`;
                    const numPts = entity.points.length;
                    const numSegs = entity.closed ? numPts : numPts - 1;
                    for (let i = 0; i < numSegs; i++) {
                        const p1 = entity.points[i];
                        const p2 = entity.points[(i + 1) % numPts];
                        const bulge = entity.bulges[i] || 0;
                        if (!bulge || Math.abs(bulge) < 1e-10) {
                            d += ` L ${p2.x} ${p2.y}`;
                        } else {
                            // Compute arc parameters for SVG A command
                            const s = bulge;
                            const dx = p2.x - p1.x;
                            const dy = p2.y - p1.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const r = dist * (1 + s * s) / (4 * Math.abs(s));
                            // large-arc-flag: arc > 180 degrees when |bulge| > 1
                            const largeArc = Math.abs(s) > 1 ? 1 : 0;
                            // sweep-flag: SVG sweep=1 means clockwise
                            // bulge > 0 means CCW arc, so sweep = 0
                            // bulge < 0 means CW arc, so sweep = 1
                            const sweep = s < 0 ? 1 : 0;
                            d += ` A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
                        }
                    }
                    if (entity.closed) {
                        d += ' Z';
                    }
                }
                return `<path d="${d}" stroke="${color}" stroke-width="1" ${polyFill}/>\n`;
            }

            case 'ellipse':
                const rot = (entity.rotation || 0) * 180 / Math.PI;
                const ellipseFill = entity.hatch ? `fill="${color}" fill-opacity="0.2"` : 'fill="none"';
                return `<ellipse cx="${entity.center.x}" cy="${entity.center.y}" rx="${entity.rx}" ry="${entity.ry}" transform="rotate(${rot} ${entity.center.x} ${entity.center.y})" stroke="${color}" stroke-width="1" ${ellipseFill}/>\n`;

            case 'text':
                return `<text x="${entity.position.x}" y="${entity.position.y}" fill="${color}" font-size="${entity.height}" font-family="Arial">${entity.text}</text>\n`;

            case 'hatch': {
                const boundary = entity.boundary || entity.points || [];
                const bPts = (typeof Geometry !== 'undefined' && Geometry.Hatch)
                    ? Geometry.Hatch.getBoundaryPoints(boundary) : boundary;
                if (!bPts || bPts.length < 3) return '';
                const patName = (entity.patternName || entity.hatch?.pattern || 'solid').toLowerCase();
                let hatchSvg = '<g class="hatch">\n';

                if (patName === 'solid') {
                    // Solid fill
                    const pts = bPts.map(p => `${p.x},${p.y}`).join(' ');
                    hatchSvg += `<polygon points="${pts}" fill="${color}" fill-opacity="0.25" stroke="none"/>\n`;
                } else {
                    // Clip path + render lines
                    const clipId = 'hatch-clip-' + (entity.id || Math.random().toString(36).slice(2));
                    const pts = bPts.map(p => `${p.x},${p.y}`).join(' ');
                    hatchSvg += `<defs><clipPath id="${clipId}"><polygon points="${pts}"/></clipPath></defs>\n`;
                    hatchSvg += `<g clip-path="url(#${clipId})">\n`;
                    // Ensure render lines exist
                    let rLines = entity.renderLines;
                    if (!rLines || rLines.length === 0) {
                        if (typeof Geometry !== 'undefined' && Geometry.Hatch) {
                            const h = new Geometry.Hatch(boundary, patName, entity.scale || 1, entity.angle || 0);
                            rLines = h.generateRenderLines();
                        }
                    }
                    if (rLines) {
                        rLines.forEach(seg => {
                            if (seg && seg.p1 && seg.p2) {
                                hatchSvg += `<line x1="${seg.p1.x}" y1="${seg.p1.y}" x2="${seg.p2.x}" y2="${seg.p2.y}" stroke="${color}" stroke-width="0.5"/>\n`;
                            }
                        });
                    }
                    hatchSvg += '</g>\n';
                }
                hatchSvg += '</g>\n';
                return hatchSvg;
            }

            case 'block':
                // Expand block and render each entity
                const expandedEntities = CAD.getBlockEntities(entity);
                let blockSvg = `<g class="block-${entity.blockName}">\n`;
                expandedEntities.forEach(expanded => {
                    blockSvg += this.entityToSVG(expanded);
                });
                blockSvg += '</g>\n';
                return blockSvg;

            case 'mleader': {
                let svg = '';
                const pts = entity.points || [];
                if (pts.length > 1) {
                    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1"/>`;
                    // Arrowhead at first point
                    const p0 = pts[0], p1 = pts[1];
                    const ang = Math.atan2(p0.y - p1.y, p0.x - p1.x);
                    const as = entity.arrowSize || 3;
                    const ax1 = p0.x - as * Math.cos(ang - 0.3);
                    const ay1 = p0.y - as * Math.sin(ang - 0.3);
                    const ax2 = p0.x - as * Math.cos(ang + 0.3);
                    const ay2 = p0.y - as * Math.sin(ang + 0.3);
                    svg += `<polygon points="${p0.x},${p0.y} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>`;
                }
                if (entity.text && entity.textPosition) {
                    const tp = entity.textPosition;
                    const h = entity.height || 2.5;
                    svg += `<text x="${tp.x}" y="${tp.y}" fill="${color}" font-size="${h}">${entity.text}</text>`;
                }
                return svg;
            }
            case 'tolerance': {
                let svg = '';
                const pos = entity.position || { x: 0, y: 0 };
                const h = entity.height || 5;
                let xOff = 0;
                (entity.frames || []).forEach(frame => {
                    const cells = [frame.symbol, (frame.diameterSymbol ? '\u2300' : '') + (frame.tolerance1 || ''), frame.datum1, frame.datum2, frame.datum3].filter(Boolean);
                    cells.forEach(text => {
                        const w = text.length * h * 0.8 + h;
                        svg += `<rect x="${pos.x + xOff}" y="${pos.y - h * 0.8}" width="${w}" height="${h * 1.6}" fill="none" stroke="${color}"/>`;
                        svg += `<text x="${pos.x + xOff + h * 0.3}" y="${pos.y + h * 0.3}" fill="${color}" font-size="${h}">${text}</text>`;
                        xOff += w;
                    });
                    xOff += h * 0.3;
                });
                return svg;
            }
            case 'trace': {
                if (entity.points && entity.points.length >= 4) {
                    const pts = entity.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    return `<polygon points="${pts}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
                }
                return '';
            }
            case 'field': {
                const fp = entity.position || { x: 0, y: 0 };
                const fh = entity.height || 10;
                const ft = entity.evaluatedText || entity.fieldExpression || '---';
                return `<text x="${fp.x}" y="${fp.y}" fill="${color}" font-size="${fh}">${ft}</text>`;
            }
            case 'mtext': {
                const mp = entity.position || { x: 0, y: 0 };
                const mh = entity.height || 10;
                const lines = (entity.text || '').split('\\P');
                let svg = '';
                lines.forEach((line, i) => {
                    svg += `<text x="${mp.x}" y="${mp.y + i * mh * 1.4}" fill="${color}" font-size="${mh}">${line.replace(/\\[^;]+;/g, '')}</text>`;
                });
                return svg;
            }
            case 'point': {
                const pp = entity.position || entity.point || { x: 0, y: 0 };
                return `<circle cx="${pp.x}" cy="${pp.y}" r="1.5" fill="${color}"/>`;
            }
            case 'leader': {
                const lPts = entity.points || [];
                if (lPts.length < 2) return '';
                const pathD = lPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                let svg = `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1"/>`;
                // Arrowhead
                const p0 = lPts[0], p1 = lPts[1];
                const ang = Math.atan2(p0.y - p1.y, p0.x - p1.x);
                const as = 3;
                svg += `<polygon points="${p0.x},${p0.y} ${p0.x - as * Math.cos(ang - 0.3)},${p0.y - as * Math.sin(ang - 0.3)} ${p0.x - as * Math.cos(ang + 0.3)},${p0.y - as * Math.sin(ang + 0.3)}" fill="${color}"/>`;
                if (entity.text) {
                    const last = lPts[lPts.length - 1];
                    const th = entity.height || 2.5;
                    svg += `<text x="${last.x + 2}" y="${last.y}" fill="${color}" font-size="${th}">${entity.text}</text>`;
                }
                return svg;
            }
            case 'dimension': {
                let svg = '';
                const de = entity;
                if (de.defPoint && de.textMidPoint) {
                    svg += `<line x1="${de.defPoint.x}" y1="${de.defPoint.y}" x2="${de.textMidPoint.x}" y2="${de.textMidPoint.y}" stroke="${color}" stroke-width="0.5"/>`;
                }
                if (de.text || de.measurement) {
                    const tp = de.textMidPoint || de.defPoint || { x: 0, y: 0 };
                    const th = de.textHeight || 2.5;
                    svg += `<text x="${tp.x}" y="${tp.y}" fill="${color}" font-size="${th}" text-anchor="middle">${de.text || (de.measurement ? de.measurement.toFixed(2) : '')}</text>`;
                }
                return svg;
            }
            case 'donut': {
                const dc = entity.center || { x: 0, y: 0 };
                let svg = `<circle cx="${dc.x}" cy="${dc.y}" r="${entity.outerRadius}" fill="${color}" opacity="0.3" stroke="${color}"/>`;
                if (entity.innerRadius > 0) {
                    svg += `<circle cx="${dc.x}" cy="${dc.y}" r="${entity.innerRadius}" fill="#1a1a1a" stroke="${color}"/>`;
                }
                return svg;
            }
            case 'solid': {
                if (entity.points && entity.points.length >= 3) {
                    const pts = entity.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    return `<polygon points="${pts}" fill="${color}" stroke="${color}" stroke-width="0.5" opacity="0.7"/>`;
                }
                return '';
            }
            case 'wipeout': {
                if (entity.points && entity.points.length >= 3) {
                    const pts = entity.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    return `<polygon points="${pts}" fill="#ffffff" stroke="#cccccc" stroke-width="0.5"/>`;
                }
                return '';
            }
            case 'image': {
                if (entity.p1 && entity.p2) {
                    const x = Math.min(entity.p1.x, entity.p2.x);
                    const y = Math.min(entity.p1.y, entity.p2.y);
                    const w = Math.abs(entity.p2.x - entity.p1.x);
                    const h = Math.abs(entity.p2.y - entity.p1.y);
                    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-dasharray="5,5"/>`;
                }
                return '';
            }
            case 'region': {
                if (entity.points && entity.points.length >= 3) {
                    const pts = entity.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    return `<polygon points="${pts}" fill="${color}" fill-opacity="0.2" stroke="${color}"/>`;
                }
                return '';
            }
            case 'revcloud': {
                if (entity.points && entity.points.length >= 3) {
                    const pts = entity.points;
                    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
                    for (let i = 1; i < pts.length; i++) {
                        const prev = pts[i - 1], curr = pts[i];
                        const dx = curr.x - prev.x, dy = curr.y - prev.y;
                        const r = Math.sqrt(dx * dx + dy * dy) * 0.6;
                        d += ` A${r.toFixed(2)},${r.toFixed(2)} 0 0,1 ${curr.x.toFixed(2)},${curr.y.toFixed(2)}`;
                    }
                    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1"/>`;
                }
                return '';
            }
            case 'table': {
                if (!entity.position) return '';
                const tp = entity.position;
                const rows = entity.rows || 3, cols = entity.cols || 3;
                const rh = entity.rowHeight || 10, cw = entity.colWidth || 30;
                let svg = '';
                for (let r = 0; r <= rows; r++) {
                    svg += `<line x1="${tp.x}" y1="${tp.y + r * rh}" x2="${tp.x + cols * cw}" y2="${tp.y + r * rh}" stroke="${color}" stroke-width="0.5"/>`;
                }
                for (let c = 0; c <= cols; c++) {
                    svg += `<line x1="${tp.x + c * cw}" y1="${tp.y}" x2="${tp.x + c * cw}" y2="${tp.y + rows * rh}" stroke="${color}" stroke-width="0.5"/>`;
                }
                return svg;
            }
            case 'mline': {
                if (entity.points && entity.points.length >= 2) {
                    const pts = entity.points;
                    let svg = '';
                    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
                    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1"/>`;
                    return svg;
                }
                return '';
            }

            default:
                return '';
        }
    },

    // ==========================================
    // FILE EXPORT - PDF
    // ==========================================

    exportPDF() {
        try {
            const blob = this.generatePDFBlob();
            if (blob) {
                this.downloadBlob(blob, `${CAD.drawingName || 'drawing'}.pdf`);
                UI.log('Drawing exported as PDF.');
            }
        } catch (e) {
            UI.log('Error exporting PDF: ' + e.message, 'error');
            console.error('PDF export error:', e);
        }
    },

    generatePDFBlob() {
        // 1. Get drawing extents
        const extents = this.getDrawingExtents();
        const padding = 20;
        const drawWidth = extents.maxX - extents.minX + padding * 2;
        const drawHeight = extents.maxY - extents.minY + padding * 2;

        if (drawWidth <= 0 || drawHeight <= 0) {
            UI.log('PDF Export: No geometry to export.', 'error');
            return null;
        }

        // 2. Determine page size and orientation (A4 in points: 595.28 x 841.89)
        const pageW = 595.28;
        const pageH = 841.89;
        const landscape = drawWidth > drawHeight;
        const pW = landscape ? pageH : pageW;
        const pH = landscape ? pageW : pageH;

        // 3. Calculate scale to fit drawing on page with margins
        const marginPt = 36; // 0.5 inch margin
        const availW = pW - marginPt * 2;
        const availH = pH - marginPt * 2;

        // 4. Canvas resolution: scale drawing to fill the available page area
        const dpi = 150;
        const ptToPixel = dpi / 72;
        const canvasW = Math.round(availW * ptToPixel);
        const canvasH = Math.round(availH * ptToPixel);

        // The zoom factor maps world units to canvas pixels
        const renderZoom = Math.min(canvasW / drawWidth, canvasH / drawHeight);

        // 5. Create offscreen canvas and render
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Center the drawing on the canvas
        const renderedW = drawWidth * renderZoom;
        const renderedH = drawHeight * renderZoom;
        const offsetX = (canvasW - renderedW) / 2;
        const offsetY = (canvasH - renderedH) / 2;

        // Save renderer state and swap in our offscreen context
        const prevCtx = Renderer.ctx;
        const prevCanvas = Renderer.canvas;
        const prevGetEntityColor = CAD.getEntityColor.bind(CAD);

        Renderer.ctx = ctx;
        Renderer.canvas = canvas;

        // Override getEntityColor to invert light colors for white-background PDF
        CAD.getEntityColor = function(entity) {
            const color = prevGetEntityColor(entity);
            // Convert white/light colors to black for printing
            if (!color || color === '#ffffff' || color === '#fff' || color === 'white') return '#000000';
            // Check if color is very light (would be invisible on white)
            if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                if (hex.length >= 6) {
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    if (brightness > 200) return '#000000';
                }
            }
            return color;
        };

        // Apply transformation: translate to center, then scale, then offset to drawing origin
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(offsetX, offsetY);
        ctx.scale(renderZoom, renderZoom);
        ctx.translate(-(extents.minX - padding), -(extents.minY - padding));

        // Render all entities using the existing drawEntityList (no selection highlighting)
        Renderer.drawEntityList(CAD.entities, { zoom: renderZoom, includeSelection: false });

        // Restore renderer and color function
        CAD.getEntityColor = prevGetEntityColor;
        Renderer.ctx = prevCtx;
        Renderer.canvas = prevCanvas;

        // 6. Get JPEG bytes from canvas
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const jpegBytes = this._dataUrlToUint8Array(dataUrl);

        // 7. Build the raw PDF
        const pdfBytes = this._buildPDF(jpegBytes, canvasW, canvasH, pW, pH, marginPt);
        return new Blob([pdfBytes], { type: 'application/pdf' });
    },

    _dataUrlToUint8Array(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    },

    _buildPDF(jpegBytes, imgW, imgH, pageW, pageH, margin) {
        // Minimal PDF 1.4 builder with one page containing one JPEG image.
        // Objects:
        //   1 - Catalog
        //   2 - Pages
        //   3 - Page
        //   4 - Image XObject (the JPEG)
        //   5 - Content stream (draws the image)
        //   6 - Resources dictionary (optional, kept inline on Page)

        const enc = new TextEncoder();
        const parts = [];   // collect Uint8Arrays
        const offsets = []; // byte offset of each object (1-indexed, offsets[0] unused)
        let pos = 0;

        function write(str) {
            const bytes = enc.encode(str);
            parts.push(bytes);
            pos += bytes.length;
        }

        function writeRaw(bytes) {
            parts.push(bytes);
            pos += bytes.length;
        }

        function startObj(id) {
            offsets[id] = pos;
            write(`${id} 0 obj\n`);
        }

        function endObj() {
            write('endobj\n');
        }

        // Header
        write('%PDF-1.4\n');
        // Binary comment to mark as binary PDF (recommended)
        write('%\xE2\xE3\xCF\xD3\n');

        // Object 1: Catalog
        startObj(1);
        write('<< /Type /Catalog /Pages 2 0 R >>\n');
        endObj();

        // Object 2: Pages
        startObj(2);
        write(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n`);
        endObj();

        // Image placement: fit the image within the printable area, centered
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const scaleImg = Math.min(availW / imgW, availH / imgH);
        const dispW = imgW * scaleImg;
        const dispH = imgH * scaleImg;
        const imgX = margin + (availW - dispW) / 2;
        const imgY = margin + (availH - dispH) / 2;

        // Object 5: Content stream - draws the image
        // PDF coordinate system: origin at bottom-left
        // cm operator: [sx 0 0 sy tx ty] scales and translates
        const contentStr = `q\n${dispW.toFixed(2)} 0 0 ${dispH.toFixed(2)} ${imgX.toFixed(2)} ${imgY.toFixed(2)} cm\n/Img1 Do\nQ\n`;

        startObj(5);
        write(`<< /Length ${contentStr.length} >>\nstream\n`);
        write(contentStr);
        write('\nendstream\n');
        endObj();

        // Object 3: Page
        startObj(3);
        write(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] `);
        write(`/Contents 5 0 R `);
        write(`/Resources << /XObject << /Img1 4 0 R >> >> >>\n`);
        endObj();

        // Object 4: Image XObject (JPEG)
        startObj(4);
        write(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} `);
        write(`/ColorSpace /DeviceRGB /BitsPerComponent 8 `);
        write(`/Filter /DCTDecode /Length ${jpegBytes.length} >>\n`);
        write('stream\n');
        writeRaw(jpegBytes);
        write('\nendstream\n');
        endObj();

        // Cross-reference table
        const xrefPos = pos;
        const numObjs = 6; // 0 through 5
        write('xref\n');
        write(`0 ${numObjs}\n`);
        write('0000000000 65535 f \n');
        for (let i = 1; i < numObjs; i++) {
            const off = (offsets[i] || 0).toString().padStart(10, '0');
            write(`${off} 00000 n \n`);
        }

        // Trailer
        write('trailer\n');
        write(`<< /Size ${numObjs} /Root 1 0 R >>\n`);
        write('startxref\n');
        write(`${xrefPos}\n`);
        write('%%EOF\n');

        // Combine all parts into one Uint8Array
        const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    },

    // ==========================================
    // FILE IMPORT
    // ==========================================

    importJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                CAD.fromJSON(data);
                UI.updateLayerUI();
                UI.renderLayoutTabs();
                Renderer.draw();
                UI.log('Drawing imported from JSON.');
            } catch (err) {
                UI.log('Error importing JSON: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    importDXF(file) {
        UI.log(`Opening DXF file: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                UI.log(`File loaded, parsing DXF (${content.length} bytes)...`);

                const moduleData = this.parseDXFWithModule(content);

                if (moduleData.entities.length > 0 || moduleData.layers.length > 0) {
                    // Clear existing and set up layers
                    CAD.entities = [];

                    // Add parsed layers (keep layer 0)
                    CAD.layers = [{ name: '0', color: '#ffffff', visible: true, locked: false, lineWeight: 'Default' }];
                    moduleData.layers.forEach(layer => {
                        if (layer.name !== '0') {
                            CAD.layers.push(layer);
                        } else {
                            // Update layer 0 color if specified
                            CAD.layers[0].color = layer.color;
                        }
                    });

                    CAD.blocks = moduleData.blocks;

                    // Add entities
                    moduleData.entities.forEach(entity => {
                        // Ensure layer exists
                        if (!CAD.getLayer(entity.layer)) {
                            CAD.layers.push({
                                name: entity.layer,
                                color: '#ffffff',
                                visible: true,
                                locked: false,
                                lineWeight: 'Default'
                            });
                        }
                        CAD.addEntity(entity, true);
                    });

                    // Ensure layers exist for block definition entities
                    Object.values(CAD.blocks).forEach(block => {
                        block.entities.forEach(entity => {
                            if (entity.layer && !CAD.getLayer(entity.layer)) {
                                CAD.layers.push({
                                    name: entity.layer,
                                    color: '#ffffff',
                                    visible: true,
                                    locked: false,
                                    lineWeight: 'Default'
                                });
                            }
                        });
                    });

                    UI.updateLayerUI();
                    UI.renderLayoutTabs();
                    Renderer.draw();
                    Commands.zoomExtents();
                    const blockCount = Object.keys(CAD.blocks).length;
                    UI.log(`DXF imported: ${moduleData.entities.length} entities, ${blockCount} blocks, ${CAD.layers.length} layers.`, 'success');
                } else {
                    UI.log('No entities found in DXF file.', 'error');
                }
            } catch (err) {
                UI.log('Error importing DXF: ' + err.message, 'error');
                console.error('DXF Import Error:', err);
            }
        };
        reader.onerror = (e) => {
            UI.log('Error reading file: ' + e.target.error.message, 'error');
        };
        reader.readAsText(file);
    },

    parseDXFWithModule(content) {
        if (typeof DXF === 'undefined' || !DXF.parse) {
            return { layers: [], blocks: {}, entities: [] };
        }
        try {
            const data = DXF.parse(content);
            return this.convertDxfDataToCad(data);
        } catch (err) {
            console.warn('DXF module parse failed, falling back to legacy parser.', err);
            return { layers: [], blocks: {}, entities: [] };
        }
    },

    convertDxfDataToCad(data) {
        if (!data) return { layers: [], blocks: {}, entities: [] };
        const layers = Object.values(data.layers || {}).map(layer => ({
            name: layer.name,
            color: layer.trueColor || this.aciToHex(layer.color ?? 7),
            visible: layer.visible !== false,
            frozen: layer.frozen || false,
            locked: layer.locked || false,
            lineType: layer.lineType || 'Continuous',
            lineWeight: layer.lineWeight !== undefined ? String(layer.lineWeight) : 'Default'
        }));

        const blocks = {};
        Object.entries(data.blocks || {}).forEach(([name, block]) => {
            blocks[name] = {
                name,
                basePoint: this.fromDxfPoint(block.origin || { x: 0, y: 0 }),
                entities: (block.entities || [])
                    .map(entity => this.mapDxfEntityToCad(entity, data, blocks))
                    .filter(Boolean),
                isXref: block.isXref || false,
                path: block.path || ''
            };
        });

        const entities = (data.entities || [])
            .map(entity => this.mapDxfEntityToCad(entity, data, blocks))
            .filter(Boolean);

        return { layers, blocks, entities };
    },

    mapDxfEntityToCad(entity, data, blocks = {}) {
        switch (entity.type) {
            case 'line':
                return {
                    type: 'line',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    p1: this.fromDxfPoint(entity.p1),
                    p2: this.fromDxfPoint(entity.p2)
                };
            case 'circle':
                return {
                    type: 'circle',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    center: this.fromDxfPoint(entity.center),
                    r: entity.r || 0,
                    hatch: entity.hatch || undefined,
                    noStroke: entity.noStroke
                };
            case 'arc':
                return {
                    type: 'arc',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    center: this.fromDxfPoint(entity.center),
                    r: entity.r || 0,
                    // Swap start/end and negate for Y-flip
                    // DXF angles are in degrees from dxf.js
                    start: -Utils.degToRad(entity.end || 0),
                    end: -Utils.degToRad(entity.start || 0)
                };
            case 'lwpolyline':
            case 'polyline': {
                const points = (entity.points || []).map(point => ({
                    x: point.x || 0,
                    y: -(point.y || 0)
                }));
                // Negate bulge values to compensate for Y-flip
                const bulges = (entity.points || []).map(point => -(point.bulge || 0));
                const resolvedPoints = this.expandBulgePolyline(points, bulges, entity.closed);
                return {
                    type: 'polyline',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    points: resolvedPoints,
                    closed: entity.closed || false
                };
            }
            case 'spline': {
                const points = (entity.points || []).map(point => ({
                    x: point.x || 0,
                    y: -(point.y || 0)
                }));
                return {
                    type: 'polyline',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    points,
                    isSpline: true,
                    closed: entity.closed || false
                };
            }
            case 'ellipse':
                return {
                    type: 'ellipse',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    lineType: entity.lineType ? entity.lineType.toLowerCase() : undefined,
                    center: this.fromDxfPoint(entity.center),
                    rx: entity.rx || 0,
                    ry: entity.ry || 0,
                    // Rotation is derived from geometry in dxf.js (radians), negate for Y-flip
                    rotation: -(entity.rotation || 0)
                };
            case 'text':
                return {
                    type: 'text',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    position: this.fromDxfPoint(entity.position || entity.point),
                    text: (entity.text || '').replace(/\\P/g, '\n'),
                    height: entity.height || 10,
                    // Rotation from dxf.js is in degrees, convert + negate for Y-flip
                    rotation: -Utils.degToRad(entity.rotation || 0)
                };
            case 'mtext':
                return {
                    type: 'mtext',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    position: this.fromDxfPoint(entity.position || entity.point),
                    text: (entity.text || '').replace(/\\P/g, '\n'),
                    height: entity.height || 10,
                    width: entity.width || 0,
                    // Rotation from dxf.js is in degrees, convert + negate for Y-flip
                    rotation: -Utils.degToRad(entity.rotation || 0)
                };
            case 'point':
                return {
                    type: 'point',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    position: this.fromDxfPoint(entity.point || entity.position)
                };
            case 'insert': {
                return {
                    type: 'block',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    blockName: entity.blockName || 'UNNAMED',
                    insertPoint: this.fromDxfPoint(entity.p || entity.insertPoint),
                    scale: {
                        x: entity.scale?.x ?? 1,
                        y: entity.scale?.y ?? 1
                    },
                    // Rotation from dxf.js is in degrees, convert + negate for Y-flip
                    rotation: -Utils.degToRad(entity.rotation || 0)
                };
            }
            case 'hatch': {
                // Extract boundary points from edges or boundaryPoints
                let hatchPoints = [];
                if (entity.boundaryPoints && entity.boundaryPoints.length >= 3) {
                    hatchPoints = entity.boundaryPoints.map(p => ({
                        x: p.x || 0,
                        y: -(p.y || 0)
                    }));
                } else if (entity.boundary && entity.boundary.length > 0) {
                    // Extract points from edge definitions
                    entity.boundary.forEach(edge => {
                        if (edge.type === 'line') {
                            hatchPoints.push({
                                x: edge.start.x,
                                y: -(edge.start.y || 0)
                            });
                        } else if (edge.type === 'arc') {
                            // Tessellate arc edges into points
                            const cx = edge.center.x;
                            const cy = edge.center.y;
                            const r = edge.radius || 0;
                            const startDeg = edge.start || 0;
                            const endDeg = edge.end || 360;
                            let sweep = endDeg - startDeg;
                            if (sweep <= 0) sweep += 360;
                            const steps = Math.max(8, Math.ceil(sweep / 10));
                            for (let i = 0; i <= steps; i++) {
                                const a = (startDeg + (sweep * i / steps)) * (Math.PI / 180);
                                hatchPoints.push({
                                    x: cx + r * Math.cos(a),
                                    y: -(cy + r * Math.sin(a))
                                });
                            }
                        }
                    });
                } else if (entity.points) {
                    hatchPoints = (entity.points || []).map(p => ({
                        x: p.x || 0,
                        y: -(p.y || 0)
                    }));
                }

                if (hatchPoints.length < 3) {
                    return null;
                }

                const isSolid = entity.solid === 1 || (entity.pattern || '').toLowerCase() === 'solid';
                const patternName = isSolid ? 'solid' : (entity.pattern || 'ansi31').toLowerCase();

                // Create proper hatch entity
                const hatchEntity = {
                    type: 'hatch',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    hatch: { pattern: patternName },
                    boundary: hatchPoints,
                    patternName: patternName,
                    scale: entity.scale || 1,
                    angle: entity.angle || 0,
                    renderLines: [],
                    clipIds: []
                };

                return hatchEntity;
            }
            case 'solid': {
                const solidPts = (entity.points || []).map(point => ({
                    x: point.x || 0,
                    y: -(point.y || 0)
                }));
                return {
                    type: 'polyline',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    points: solidPts,
                    closed: true,
                    hatch: { pattern: 'solid' },
                    noStroke: true
                };
            }
            case 'leader': {
                const leaderPts = (entity.points || []).map(point => ({
                    x: point.x || 0,
                    y: -(point.y || 0)
                }));
                if (leaderPts.length < 2) return null;
                const leader = {
                    type: 'leader',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    points: leaderPts
                };
                if (entity.text) {
                    leader.text = entity.text;
                }
                if (entity.height) {
                    leader.height = entity.height;
                }
                return leader;
            }
            case 'dimension': {
                // Convert DXF dimension to internal representation
                // DXF dim types: 0=linear, 1=aligned, 2=angular, 3=diameter, 4=radius
                const dimTypeMap = { 0: 'linear', 1: 'aligned', 2: 'angular', 3: 'diameter', 4: 'radius', 5: 'angular', 6: 'ordinate' };
                const dimTypeName = dimTypeMap[entity.dimType] || 'linear';
                const dim = {
                    type: 'dimension',
                    layer: entity.layer || '0',
                    color: entity.trueColor || undefined,
                    dimType: dimTypeName,
                    text: entity.text || ''
                };
                if (dimTypeName === 'linear' || dimTypeName === 'aligned') {
                    dim.p1 = this.fromDxfPoint(entity.ext1);
                    dim.p2 = this.fromDxfPoint(entity.ext2);
                    dim.textPosition = this.fromDxfPoint(entity.textMid);
                } else if (dimTypeName === 'radius' || dimTypeName === 'diameter') {
                    dim.center = this.fromDxfPoint(entity.defPoint);
                    dim.textPosition = this.fromDxfPoint(entity.textMid);
                } else if (dimTypeName === 'angular') {
                    dim.center = this.fromDxfPoint(entity.defPoint);
                    dim.p1 = this.fromDxfPoint(entity.ext1);
                    dim.p2 = this.fromDxfPoint(entity.ext2);
                    dim.textPosition = this.fromDxfPoint(entity.textMid);
                }
                return dim;
            }
            case 'xref': {
                const blockName = this.getXrefBlockName(entity);
                if (!blocks[blockName]) {
                    blocks[blockName] = {
                        name: blockName,
                        basePoint: { x: 0, y: 0 },
                        entities: [],
                        isXref: true,
                        path: entity.path || ''
                    };
                }
                return {
                    type: 'block',
                    layer: entity.layer || '0',
                    blockName,
                    insertPoint: this.fromDxfPoint(entity.p),
                    scale: {
                        x: entity.scale?.x ?? 1,
                        y: entity.scale?.y ?? 1
                    },
                    rotation: -Utils.degToRad(entity.rotation || 0)
                };
            }
            case 'image': {
                const src = DXF.utils.getImgPath(entity.defHandle, data);
                const p1 = this.fromDxfPoint(entity.p);
                const width = entity.size?.w || 0;
                const height = entity.size?.h || 0;
                const rotation = Math.atan2(entity.u?.y || 0, entity.u?.x || 1);
                return {
                    type: 'image',
                    layer: entity.layer || '0',
                    p1,
                    p2: { x: p1.x + width, y: p1.y + height },
                    width,
                    height,
                    rotation: -Utils.radToDeg(rotation),
                    src: src || '',
                    opacity: 0.6,
                    scale: 1
                };
            }
            case 'tolerance': {
                const pos = entity.position || { x: 0, y: 0 };
                return {
                    type: 'tolerance',
                    layer: entity.layer || '0',
                    color: entity.color,
                    position: { x: pos.x, y: -pos.y },
                    height: entity.height || 5,
                    frames: entity.frames || []
                };
            }
            case 'wipeout': {
                const pts = (entity.points || []).map(p => ({ x: p.x, y: -p.y }));
                if (pts.length < 3) return null;
                return {
                    type: 'wipeout',
                    layer: entity.layer || '0',
                    color: entity.color,
                    points: pts
                };
            }
            case 'attdef': {
                const adPos = entity.position || { x: 0, y: 0 };
                return {
                    type: 'text',
                    layer: entity.layer || '0',
                    color: entity.color,
                    position: { x: adPos.x, y: -adPos.y },
                    height: entity.height || 2.5,
                    rotation: entity.rotation ? -entity.rotation : 0,
                    text: entity.defaultValue || entity.tag || '',
                    textStyle: 'Standard',
                    tag: entity.tag,
                    prompt: entity.prompt
                };
            }
            case 'attrib': {
                const atPos = entity.position || { x: 0, y: 0 };
                return {
                    type: 'text',
                    layer: entity.layer || '0',
                    color: entity.color,
                    position: { x: atPos.x, y: -atPos.y },
                    height: entity.height || 2.5,
                    rotation: entity.rotation ? -entity.rotation : 0,
                    text: entity.value || '',
                    textStyle: 'Standard',
                    tag: entity.tag
                };
            }
            case 'viewport': {
                const vc = entity.center || { x: 0, y: 0 };
                return {
                    type: 'viewport',
                    layer: entity.layer || '0',
                    color: entity.color,
                    center: { x: vc.x, y: -vc.y },
                    width: entity.width || 200,
                    height: entity.height || 150,
                    viewCenter: entity.viewCenter ? { x: entity.viewCenter.x, y: -entity.viewCenter.y } : { x: 0, y: 0 },
                    viewHeight: entity.viewHeight || 100,
                    vpScale: entity.viewHeight ? (entity.height / entity.viewHeight) : 1
                };
            }
            case 'trace': {
                const trPts = (entity.points || []).map(p => ({ x: p.x, y: -p.y }));
                if (trPts.length < 3) return null;
                return {
                    type: 'trace',
                    layer: entity.layer || '0',
                    color: entity.color,
                    points: trPts,
                    width: 1
                };
            }
            default:
                return null;
        }
    },

    getXrefBlockName(entity) {
        if (entity.blockName) return entity.blockName;
        if (entity.path) {
            const base = entity.path.split(/[\\/]/).pop() || 'XREF';
            return base.replace(/\.[^/.]+$/, '') || 'XREF';
        }
        return 'XREF';
    },

    mergeDXFLayers(primaryLayers, moduleLayers) {
        const byName = new Map();
        primaryLayers.forEach(layer => byName.set(layer.name, layer));
        moduleLayers.forEach(layer => {
            if (!byName.has(layer.name)) {
                byName.set(layer.name, layer);
            }
        });
        return Array.from(byName.values());
    },

    mergeDXFBlocks(primaryBlocks, moduleBlocks) {
        const merged = { ...primaryBlocks };
        Object.entries(moduleBlocks).forEach(([name, block]) => {
            if (!merged[name]) {
                merged[name] = block;
            } else {
                merged[name].isXref = merged[name].isXref || block.isXref;
                merged[name].path = merged[name].path || block.path;
            }
        });
        return merged;
    },

    mergeDXFEntities(primaryEntities, moduleEntities) {
        const extras = moduleEntities.filter(entity => entity.type === 'image');
        return primaryEntities.concat(extras);
    },

    parseDXFLayers(content) {
        const layers = [];
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
        let i = 0;

        // Find TABLES section
        let inTablesSection = false;
        let inLayerTable = false;

        while (i < lines.length - 1) {
            // Find TABLES section
            if (lines[i] === '2' && lines[i + 1].toUpperCase() === 'TABLES') {
                inTablesSection = true;
                i += 2;
                continue;
            }

            // Find LAYER table within TABLES
            if (inTablesSection && lines[i] === '2' && lines[i + 1].toUpperCase() === 'LAYER') {
                inLayerTable = true;
                i += 2;
                continue;
            }

            // End of LAYER table
            if (inLayerTable && lines[i] === '0' && lines[i + 1].toUpperCase() === 'ENDTAB') {
                break;
            }

            // Parse individual layer entry
            if (inLayerTable && lines[i] === '0' && lines[i + 1].toUpperCase() === 'LAYER') {
                i += 2;
                const layerData = {};

                // Read layer properties until next 0 group code
                while (i < lines.length - 1 && lines[i] !== '0') {
                    const code = parseInt(lines[i]);
                    const value = lines[i + 1];
                    layerData[code] = value;
                    i += 2;
                }

                const layerName = layerData[2] || '0';
                const colorIndex = parseInt(layerData[62]) || 7;
                const color = this.aciToHex(colorIndex);
                const flags = parseInt(layerData[70]) || 0;
                const lineType = layerData[6];
                const lineWeight = this.getDXFLineWeight(layerData);

                layers.push({
                    name: layerName,
                    color: color,
                    visible: colorIndex >= 0, // Negative color = layer off
                    frozen: (flags & 1) !== 0,
                    locked: (flags & 4) !== 0,
                    lineType: lineType ? lineType.toString() : 'Continuous',
                    lineWeight: lineWeight !== null ? (lineWeight / 100).toFixed(2) : 'Default'
                });

                continue;
            }

            // End of TABLES section
            if (inTablesSection && lines[i] === '0' && lines[i + 1].toUpperCase() === 'ENDSEC') {
                break;
            }

            i++;
        }

        console.log(`DXF: Parsed ${layers.length} layers`);
        return layers;
    },

    aciToHex(colorIndex) {
        // CAD Color Index to Hex color mapping
        const aciColors = {
            1: '#ff0000',   // Red
            2: '#ffff00',   // Yellow
            3: '#00ff00',   // Green
            4: '#00ffff',   // Cyan
            5: '#0000ff',   // Blue
            6: '#ff00ff',   // Magenta
            7: '#ffffff',   // White
            8: '#808080',   // Gray
            9: '#c0c0c0',   // Light gray
            10: '#ff0000',
            11: '#ff7f7f',
            12: '#cc0000',
            20: '#ff3f00',
            30: '#ff7f00',
            40: '#ffbf00',
            50: '#ffff00',
            60: '#bfff00',
            70: '#7fff00',
            80: '#3fff00',
            90: '#00ff00',
            100: '#00ff3f',
            110: '#00ff7f',
            120: '#00ffbf',
            130: '#00ffff',
            140: '#00bfff',
            150: '#007fff',
            160: '#003fff',
            170: '#0000ff',
            180: '#3f00ff',
            190: '#7f00ff',
            200: '#bf00ff',
            210: '#ff00ff',
            220: '#ff00bf',
            230: '#ff007f',
            240: '#ff003f',
            250: '#333333',
            251: '#464646',
            252: '#585858',
            253: '#6b6b6b',
            254: '#808080',
            255: '#ffffff'
        };

        // Handle negative (layer off) by using absolute value
        const absIndex = Math.abs(colorIndex);
        return aciColors[absIndex] || '#ffffff';
    },

    dxfTrueColorToHex(colorInt) {
        const intVal = parseInt(colorInt);
        if (isNaN(intVal)) return null;
        const hex = intVal.toString(16).padStart(6, '0');
        return `#${hex}`;
    },

    getDXFValue(data, code) {
        const value = data[code];
        if (Array.isArray(value)) {
            return value[value.length - 1];
        }
        return value;
    },

    getDXFEntityColor(data) {
        const trueColor = this.getDXFValue(data, 420);
        if (trueColor !== undefined) {
            return this.dxfTrueColorToHex(trueColor);
        }
        const colorIndex = parseInt(this.getDXFValue(data, 62));
        if (!colorIndex || colorIndex === 256) {
            return null;
        }
        return this.aciToHex(colorIndex);
    },

    getDXFLineWeight(data) {
        const weight = parseInt(this.getDXFValue(data, 370));
        if (isNaN(weight) || weight === -1 || weight === -2 || weight === 0) {
            return null;
        }
        return weight;
    },

    applyDXFEntityStyle(entity, data) {
        entity.layer = this.getDXFValue(data, 8) || entity.layer || '0';
        const lineType = this.getDXFValue(data, 6);
        if (lineType) {
            entity.lineType = lineType.toLowerCase();
        }
        const color = this.getDXFEntityColor(data);
        if (color) {
            entity.color = color;
        }
        const lineWeight = this.getDXFLineWeight(data);
        if (lineWeight !== null) {
            entity.lineWeight = lineWeight;
        }
    },

    parseDXF(content) {
        const entities = [];
        // Handle different line endings (Windows \r\n, Unix \n, old Mac \r)
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
        let i = 0;

        console.log(`DXF: Total lines: ${lines.length}`);

        // Find ENTITIES section - look for 2/ENTITIES pattern (after 0/SECTION)
        let inEntitiesSection = false;
        while (i < lines.length - 1) {
            // Standard DXF: group code 2 followed by section name ENTITIES
            if (lines[i] === '2' && lines[i + 1].toUpperCase() === 'ENTITIES') {
                inEntitiesSection = true;
                i += 2;
                console.log(`DXF: Found ENTITIES section at line ${i}`);
                break;
            }
            // Some DXF variants have ENTITIES as standalone
            if (lines[i].toUpperCase() === 'ENTITIES') {
                inEntitiesSection = true;
                i++;
                console.log(`DXF: Found ENTITIES (standalone) at line ${i}`);
                break;
            }
            i++;
        }

        if (!inEntitiesSection) {
            console.log('DXF: ENTITIES section not found');
            UI.log('DXF: Could not find ENTITIES section in file.', 'error');
            return entities;
        }

        // Parse entities until ENDSEC
        while (i < lines.length - 1) {
            // Check for end of section
            if (lines[i] === '0' && lines[i + 1].toUpperCase() === 'ENDSEC') {
                break;
            }

            // New entity starts with group code 0
            if (lines[i] === '0') {
                const entityType = lines[i + 1].toUpperCase();
                i += 2;

                if (entityType === 'LINE') {
                    const result = this.parseDXFLine(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'CIRCLE') {
                    const result = this.parseDXFCircle(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'ARC') {
                    const result = this.parseDXFArc(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
                    const result = this.parseDXFPolyline(lines, i, entityType);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'TEXT' || entityType === 'MTEXT') {
                    const result = this.parseDXFText(lines, i, entityType);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'POINT') {
                    const result = this.parseDXFPoint(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'SPLINE') {
                    const result = this.parseDXFSpline(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'ELLIPSE') {
                    const result = this.parseDXFEllipse(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'HATCH') {
                    const result = this.parseDXFHatch(lines, i);
                    if (result) {
                        if (result.entity) {
                            entities.push(result.entity);
                        }
                        i = result.nextIndex;
                    }
                } else if (entityType === 'INSERT') {
                    const result = this.parseDXFInsert(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'LEADER') {
                    const result = this.parseDXFLeader(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else if (entityType === 'DIMENSION') {
                    // Skip DIMENSION entities (complex format requiring block defs)
                    const { nextIndex } = this.readDXFEntity(lines, i);
                    i = nextIndex;
                } else if (entityType === 'SOLID') {
                    // DXF SOLID is a filled triangle/quad - import as closed polyline
                    const result = this.parseDXFSolid(lines, i);
                    if (result) {
                        entities.push(result.entity);
                        i = result.nextIndex;
                    }
                } else {
                    // Unknown entity type — skip its data safely
                    const { nextIndex } = this.readDXFEntity(lines, i);
                    i = nextIndex;
                }
            } else {
                i++;
            }
        }

        console.log(`DXF: Parsed ${entities.length} entities`);
        return entities;
    },

    parseDXFBlocks(content) {
        const blocks = {};
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());
        let i = 0;

        let inBlocksSection = false;
        while (i < lines.length - 1) {
            if (lines[i] === '2' && lines[i + 1].toUpperCase() === 'BLOCKS') {
                inBlocksSection = true;
                i += 2;
                break;
            }
            if (lines[i].toUpperCase() === 'BLOCKS') {
                inBlocksSection = true;
                i++;
                break;
            }
            i++;
        }

        if (!inBlocksSection) {
            return blocks;
        }

        while (i < lines.length - 1) {
            if (lines[i] === '0' && lines[i + 1].toUpperCase() === 'ENDSEC') {
                break;
            }

            if (lines[i] === '0' && lines[i + 1].toUpperCase() === 'BLOCK') {
                i += 2;
                const header = this.readDXFEntity(lines, i);
                const blockData = header.data;
                i = header.nextIndex;

                const name = blockData[2] || 'UNNAMED';
                const basePoint = {
                    x: parseFloat(blockData[10]) || 0,
                    y: -(parseFloat(blockData[20]) || 0)
                };

                const entities = [];
                while (i < lines.length - 1) {
                    if (lines[i] === '0' && lines[i + 1].toUpperCase() === 'ENDBLK') {
                        i += 2;
                        break;
                    }

                    if (lines[i] === '0') {
                        const entityType = lines[i + 1].toUpperCase();
                        i += 2;
                        let result = null;

                        if (entityType === 'LINE') {
                            result = this.parseDXFLine(lines, i);
                        } else if (entityType === 'CIRCLE') {
                            result = this.parseDXFCircle(lines, i);
                        } else if (entityType === 'ARC') {
                            result = this.parseDXFArc(lines, i);
                        } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
                            result = this.parseDXFPolyline(lines, i, entityType);
                        } else if (entityType === 'TEXT' || entityType === 'MTEXT') {
                            result = this.parseDXFText(lines, i, entityType);
                        } else if (entityType === 'POINT') {
                            result = this.parseDXFPoint(lines, i);
                        } else if (entityType === 'SPLINE') {
                            result = this.parseDXFSpline(lines, i);
                        } else if (entityType === 'ELLIPSE') {
                            result = this.parseDXFEllipse(lines, i);
                        } else if (entityType === 'LEADER') {
                            result = this.parseDXFLeader(lines, i);
                        } else if (entityType === 'INSERT') {
                            result = this.parseDXFInsert(lines, i);
                        } else if (entityType === 'SOLID') {
                            result = this.parseDXFSolid(lines, i);
                        } else if (entityType === 'HATCH') {
                            result = this.parseDXFHatch(lines, i);
                        } else {
                            const skipped = this.readDXFEntity(lines, i);
                            i = skipped.nextIndex;
                        }

                        if (result) {
                            if (result.entity) {
                                entities.push(result.entity);
                            }
                            i = result.nextIndex;
                        }
                    } else {
                        i++;
                    }
                }

                blocks[name] = {
                    name,
                    basePoint,
                    entities,
                    description: '',
                    createdAt: Date.now()
                };

                continue;
            }

            i++;
        }

        return blocks;
    },

    // Helper to read DXF group code/value pairs until we hit group code 0
    readDXFEntity(lines, startIndex) {
        const data = {};
        let i = startIndex;

        while (i < lines.length - 1) {
            const code = parseInt(lines[i]);
            if (code === 0) break; // New entity starts

            const value = lines[i + 1];
            // Store values by group code (some codes can appear multiple times)
            if (data[code] === undefined) {
                data[code] = value;
            } else if (Array.isArray(data[code])) {
                data[code].push(value);
            } else {
                data[code] = [data[code], value];
            }
            i += 2;
        }

        return { data, nextIndex: i };
    },

    parseDXFLine(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const entity = {
            type: 'line',
            p1: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            },
            p2: {
                x: parseFloat(data[11]) || 0,
                y: -(parseFloat(data[21]) || 0)
            }
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFCircle(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const entity = {
            type: 'circle',
            center: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            },
            r: parseFloat(data[40]) || 1
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFArc(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const entity = {
            type: 'arc',
            center: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            },
            r: parseFloat(data[40]) || 1,
            start: -Utils.degToRad(parseFloat(data[51]) || 0),
            end: -Utils.degToRad(parseFloat(data[50]) || 360)
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFPolyline(lines, startIndex, entityType = 'LWPOLYLINE') {
        if (entityType === 'POLYLINE') {
            const header = this.readDXFEntity(lines, startIndex);
            const data = header.data;
            let i = header.nextIndex;
            const points = [];
            const bulges = [];

            while (i < lines.length - 1 && lines[i] === '0' && lines[i + 1].toUpperCase() === 'VERTEX') {
                i += 2;
                const vertex = this.readDXFEntity(lines, i);
                const vertexData = vertex.data;
                i = vertex.nextIndex;

                const vx = parseFloat(vertexData[10]);
                const vy = parseFloat(vertexData[20]);
                if (!isNaN(vx) && !isNaN(vy)) {
                    points.push({ x: vx, y: -vy });
                    // Negate bulge to compensate for Y-flip
                    bulges.push(-(parseFloat(vertexData[42]) || 0));
                }
            }

            if (i < lines.length - 1 && lines[i] === '0' && lines[i + 1].toUpperCase() === 'SEQEND') {
                i += 2;
            }

            const flags = parseInt(data[70]) || 0;
            const closed = (flags & 1) !== 0;
            const resolvedPoints = this.expandBulgePolyline(points, bulges, closed);

            const entity = {
                type: 'polyline',
                points: resolvedPoints,
                closed: closed
            };
            this.applyDXFEntityStyle(entity, data);

            return { entity, nextIndex: i };
        }

        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        // For LWPOLYLINE, vertices are stored with multiple group 10/20 codes
        const xCoords = Array.isArray(data[10]) ? data[10] : (data[10] !== undefined ? [data[10]] : []);
        const yCoords = Array.isArray(data[20]) ? data[20] : (data[20] !== undefined ? [data[20]] : []);
        const bulgeValues = Array.isArray(data[42]) ? data[42] : (data[42] !== undefined ? [data[42]] : []);

        const points = [];
        const bulges = [];
        for (let j = 0; j < xCoords.length; j++) {
            points.push({
                x: parseFloat(xCoords[j]) || 0,
                y: -(parseFloat(yCoords[j]) || 0)
            });
            // Negate bulge to compensate for Y-flip
            bulges.push(-(parseFloat(bulgeValues[j]) || 0));
        }

        // Check closed flag (group code 70, bit 1)
        const flags = parseInt(data[70]) || 0;
        const closed = (flags & 1) !== 0;
        const resolvedPoints = this.expandBulgePolyline(points, bulges, closed);

        const entity = {
            type: 'polyline',
            points: resolvedPoints,
            closed: closed
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFText(lines, startIndex, entityType = 'TEXT') {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);
        const isMtext = entityType === 'MTEXT';
        const textParts = [];

        const baseText = this.getDXFValue(data, 1);
        if (baseText) {
            textParts.push(baseText);
        }
        if (data[3]) {
            const extra = Array.isArray(data[3]) ? data[3] : [data[3]];
            textParts.push(...extra);
        }

        const entity = {
            type: isMtext ? 'mtext' : 'text',
            position: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            },
            text: textParts.join('').replace(/\\P/g, '\n'),
            height: parseFloat(data[40]) || 10,
            rotation: parseFloat(data[50]) || 0
        };

        if (isMtext && data[41]) {
            entity.width = parseFloat(data[41]) || 0;
        }
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFPoint(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const entity = {
            type: 'point',
            position: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            }
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFSpline(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        // Prefer fit points (11/21) over control points (10/20) for smoother curves
        let xCoords, yCoords;
        const fitX = Array.isArray(data[11]) ? data[11] : (data[11] !== undefined ? [data[11]] : []);
        const fitY = Array.isArray(data[21]) ? data[21] : (data[21] !== undefined ? [data[21]] : []);

        if (fitX.length >= 2) {
            // Use fit points - these are the actual curve-through points
            xCoords = fitX;
            yCoords = fitY;
        } else {
            // Fall back to control points
            xCoords = Array.isArray(data[10]) ? data[10] : (data[10] !== undefined ? [data[10]] : []);
            yCoords = Array.isArray(data[20]) ? data[20] : (data[20] !== undefined ? [data[20]] : []);
        }

        const points = [];
        for (let j = 0; j < xCoords.length; j++) {
            points.push({
                x: parseFloat(xCoords[j]) || 0,
                y: -(parseFloat(yCoords[j]) || 0)
            });
        }

        const flags = parseInt(data[70]) || 0;
        const entity = {
            type: 'polyline',
            points: points,
            isSpline: true,
            closed: (flags & 1) !== 0
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFEllipse(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const centerX = parseFloat(data[10]) || 0;
        const centerY = -(parseFloat(data[20]) || 0);
        // Major axis endpoint relative to center
        const majorX = parseFloat(data[11]) || 1;
        const majorY = -(parseFloat(data[21]) || 0);
        // Ratio of minor to major axis
        const ratio = parseFloat(data[40]) || 1;

        const majorRadius = Math.sqrt(majorX * majorX + majorY * majorY);
        const minorRadius = majorRadius * ratio;
        const rotation = Math.atan2(majorY, majorX);

        const entity = {
            type: 'ellipse',
            center: { x: centerX, y: centerY },
            rx: majorRadius,
            ry: minorRadius,
            rotation: rotation
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFInsert(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const entity = {
            type: 'block',
            blockName: this.getDXFValue(data, 2) || 'UNNAMED',
            insertPoint: {
                x: parseFloat(data[10]) || 0,
                y: -(parseFloat(data[20]) || 0)
            },
            scale: {
                x: parseFloat(data[41]) || 1,
                y: parseFloat(data[42]) || 1
            },
            rotation: -Utils.degToRad(parseFloat(data[50]) || 0)
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFLeader(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const xCoords = Array.isArray(data[10]) ? data[10] : (data[10] !== undefined ? [data[10]] : []);
        const yCoords = Array.isArray(data[20]) ? data[20] : (data[20] !== undefined ? [data[20]] : []);

        const points = [];
        for (let j = 0; j < xCoords.length; j++) {
            points.push({
                x: parseFloat(xCoords[j]) || 0,
                y: -(parseFloat(yCoords[j]) || 0)
            });
        }

        if (points.length < 2) return null;

        const entity = {
            type: 'leader',
            points: points,
            text: this.getDXFValue(data, 3) || ''
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFSolid(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        // DXF SOLID has 4 corner points (codes 10/20, 11/21, 12/22, 13/23)
        const points = [];
        for (const pair of [[10,20],[11,21],[12,22],[13,23]]) {
            const x = parseFloat(data[pair[0]]);
            const y = parseFloat(data[pair[1]]);
            if (!isNaN(x) && !isNaN(y)) {
                points.push({ x, y: -y });
            }
        }
        if (points.length < 3) return null;

        // Close the polygon
        points.push({ ...points[0] });

        const entity = {
            type: 'polyline',
            points: points,
            closed: true,
            isSolid: true,
            hatch: 'solid'
        };
        this.applyDXFEntityStyle(entity, data);

        return { entity, nextIndex };
    },

    parseDXFHatch(lines, startIndex) {
        const { data, nextIndex } = this.readDXFEntity(lines, startIndex);

        const patternName = (this.getDXFValue(data, 2) || 'solid').toLowerCase();
        const isSolid = parseInt(this.getDXFValue(data, 70)) === 1 || patternName === 'solid';
        const hatchAngle = parseFloat(this.getDXFValue(data, 52)) || 0;
        const hatchScale = parseFloat(this.getDXFValue(data, 41)) || 1;
        const resolvedPattern = isSolid ? 'solid' : patternName;

        // Try polyline boundary first
        const boundaryPoints = this.getDXFHatchPolyline(data);
        if (boundaryPoints.length >= 3) {
            const entity = {
                type: 'hatch',
                hatch: { pattern: resolvedPattern },
                boundary: boundaryPoints,
                patternName: resolvedPattern,
                scale: hatchScale,
                angle: hatchAngle,
                renderLines: [],
                clipIds: []
            };
            this.applyDXFEntityStyle(entity, data);
            return { entity, nextIndex };
        }

        // Try circular boundary
        const circleData = this.getDXFHatchCircle(data, patternName, isSolid);
        if (circleData) {
            // Convert circle to boundary points for proper hatch entity
            const steps = 36;
            const cx = circleData.center.x;
            const cy = circleData.center.y;
            const r = circleData.r;
            const circlePts = [];
            for (let i = 0; i < steps; i++) {
                const a = (Math.PI * 2 * i) / steps;
                circlePts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
            }
            const entity = {
                type: 'hatch',
                hatch: { pattern: resolvedPattern },
                boundary: circlePts,
                patternName: resolvedPattern,
                scale: hatchScale,
                angle: hatchAngle,
                renderLines: [],
                clipIds: []
            };
            this.applyDXFEntityStyle(entity, data);
            return { entity, nextIndex };
        }

        return { entity: null, nextIndex };
    },

    getDXFHatchPolyline(data) {
        const xCoords = Array.isArray(data[10]) ? data[10] : (data[10] !== undefined ? [data[10]] : []);
        const yCoords = Array.isArray(data[20]) ? data[20] : (data[20] !== undefined ? [data[20]] : []);

        const points = [];
        for (let i = 0; i < Math.min(xCoords.length, yCoords.length); i++) {
            const x = parseFloat(xCoords[i]);
            const y = parseFloat(yCoords[i]);
            if (!isNaN(x) && !isNaN(y)) {
                points.push({ x, y: -y });
            }
        }
        return points;
    },

    getDXFHatchCircle(data, patternName, isSolid) {
        const edgeType = parseInt(this.getDXFValue(data, 72));
        if (edgeType !== 2) {
            return null;
        }
        const centerX = parseFloat(this.getDXFValue(data, 10));
        const centerY = parseFloat(this.getDXFValue(data, 20));
        const radius = parseFloat(this.getDXFValue(data, 40));
        const startAngle = parseFloat(this.getDXFValue(data, 50)) || 0;
        const endAngle = parseFloat(this.getDXFValue(data, 51)) || 0;

        if ([centerX, centerY, radius].some(value => isNaN(value))) {
            return null;
        }

        if (Math.abs(endAngle - startAngle) >= 360) {
            return {
                type: 'circle',
                center: { x: centerX, y: -centerY },
                r: radius,
                hatch: { pattern: isSolid ? 'solid' : (patternName || 'solid') },
                noStroke: true
            };
        }

        return null;
    },

    expandBulgePolyline(points, bulges, closed) {
        if (points.length === 0) return [];
        if (!bulges || bulges.every(b => !b)) {
            return points;
        }

        const result = [points[0]];
        const limit = closed ? points.length : points.length - 1;

        for (let i = 0; i < limit; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length];
            const bulge = bulges[i] || 0;

            if (!bulge) {
                if (!(closed && i === limit - 1)) {
                    result.push(end);
                }
                continue;
            }

            const arcPoints = this.bulgeToArcPoints(start, end, bulge);
            if (arcPoints.length) {
                if (closed && i === limit - 1) {
                    arcPoints.pop();
                }
                result.push(...arcPoints);
            }
        }

        return result;
    },

    bulgeToArcPoints(start, end, bulge) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const chord = Math.sqrt(dx * dx + dy * dy);
        if (chord === 0) return [end];

        const theta = 4 * Math.atan(bulge);
        const radius = Math.abs(chord / (2 * Math.sin(theta / 2)));
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
        const perp = { x: -dy / chord, y: dx / chord };
        const offset = radius * Math.cos(theta / 2);
        const direction = bulge >= 0 ? 1 : -1;
        const center = {
            x: mid.x + perp.x * offset * direction,
            y: mid.y + perp.y * offset * direction
        };

        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const segments = Math.max(4, Math.ceil(Math.abs(theta) / (Math.PI / 8)));

        const points = [];
        for (let i = 1; i <= segments; i++) {
            const angle = startAngle + (theta * i) / segments;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        }

        return points;
    },

    openFile() {
        // Use empty accept to allow all files
        this.openFileDialog('', (file) => {
            const fileName = file.name;
            const ext = fileName.split('.').pop().toLowerCase();
            console.log('Opening file:', fileName, 'Extension:', ext);
            UI.log(`Opening file: ${fileName} (type: .${ext})`);

            if (ext === 'dxf') {
                console.log('Routing to DXF import');
                this.importDXF(file);
            } else if (ext === 'svg') {
                console.log('Routing to SVG import');
                this.importSVG(file);
            } else if (ext === 'json' || ext === 'htmlcad') {
                console.log('Routing to JSON import');
                this.importJSON(file);
            } else {
                UI.log(`Unsupported file format: .${ext}. Use .dxf, .json, or .svg`, 'error');
            }
        });
    },

    importSVG(file) {
        UI.log(`Opening SVG file: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const entities = this.parseSVG(content);

                if (entities.length > 0) {
                    CAD.entities = [];
                    entities.forEach(entity => CAD.addEntity(entity, true));
                    Renderer.draw();
                    Commands.zoomExtents();
                    UI.log(`SVG imported: ${entities.length} entities loaded.`, 'success');
                } else {
                    UI.log('No supported elements found in SVG file.', 'error');
                }
            } catch (err) {
                UI.log('Error importing SVG: ' + err.message, 'error');
                console.error('SVG Import Error:', err);
            }
        };
        reader.onerror = (e) => {
            UI.log('Error reading file: ' + e.target.error.message, 'error');
        };
        reader.readAsText(file);
    },

    parseSVG(content) {
        const entities = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'image/svg+xml');

        // Check for parsing errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid SVG file');
        }

        // Get viewBox for coordinate transformation
        const svg = doc.querySelector('svg');
        const viewBox = svg?.getAttribute('viewBox')?.split(/\s+/).map(Number) || [0, 0, 100, 100];

        // Parse line elements
        doc.querySelectorAll('line').forEach(el => {
            entities.push({
                type: 'line',
                p1: { x: parseFloat(el.getAttribute('x1')) || 0, y: parseFloat(el.getAttribute('y1')) || 0 },
                p2: { x: parseFloat(el.getAttribute('x2')) || 0, y: parseFloat(el.getAttribute('y2')) || 0 },
                layer: '0'
            });
        });

        // Parse circle elements
        doc.querySelectorAll('circle').forEach(el => {
            entities.push({
                type: 'circle',
                center: { x: parseFloat(el.getAttribute('cx')) || 0, y: parseFloat(el.getAttribute('cy')) || 0 },
                r: parseFloat(el.getAttribute('r')) || 1,
                layer: '0'
            });
        });

        // Parse ellipse elements
        doc.querySelectorAll('ellipse').forEach(el => {
            entities.push({
                type: 'ellipse',
                center: { x: parseFloat(el.getAttribute('cx')) || 0, y: parseFloat(el.getAttribute('cy')) || 0 },
                rx: parseFloat(el.getAttribute('rx')) || 1,
                ry: parseFloat(el.getAttribute('ry')) || 1,
                rotation: 0,
                layer: '0'
            });
        });

        // Parse rect elements
        doc.querySelectorAll('rect').forEach(el => {
            const x = parseFloat(el.getAttribute('x')) || 0;
            const y = parseFloat(el.getAttribute('y')) || 0;
            const width = parseFloat(el.getAttribute('width')) || 0;
            const height = parseFloat(el.getAttribute('height')) || 0;
            entities.push({
                type: 'rect',
                p1: { x: x, y: y },
                p2: { x: x + width, y: y + height },
                layer: '0'
            });
        });

        // Parse polyline elements
        doc.querySelectorAll('polyline').forEach(el => {
            const points = this.parseSVGPoints(el.getAttribute('points'));
            if (points.length >= 2) {
                entities.push({
                    type: 'polyline',
                    points: points,
                    closed: false,
                    layer: '0'
                });
            }
        });

        // Parse polygon elements
        doc.querySelectorAll('polygon').forEach(el => {
            const points = this.parseSVGPoints(el.getAttribute('points'));
            if (points.length >= 3) {
                entities.push({
                    type: 'polyline',
                    points: points,
                    closed: true,
                    layer: '0'
                });
            }
        });

        // Parse path elements (basic support)
        doc.querySelectorAll('path').forEach(el => {
            const d = el.getAttribute('d');
            if (d) {
                const pathEntities = this.parseSVGPath(d);
                entities.push(...pathEntities);
            }
        });

        // Parse text elements
        doc.querySelectorAll('text').forEach(el => {
            const x = parseFloat(el.getAttribute('x')) || 0;
            const y = parseFloat(el.getAttribute('y')) || 0;
            const text = el.textContent || '';
            if (text.trim()) {
                entities.push({
                    type: 'text',
                    position: { x: x, y: y },
                    text: text.trim(),
                    height: parseFloat(el.getAttribute('font-size')) || 12,
                    rotation: 0,
                    layer: '0'
                });
            }
        });

        console.log(`SVG: Parsed ${entities.length} entities`);
        return entities;
    },

    parseSVGPoints(pointsStr) {
        if (!pointsStr) return [];
        const points = [];
        const pairs = pointsStr.trim().split(/\s+|,/).filter(s => s);

        for (let i = 0; i < pairs.length - 1; i += 2) {
            const x = parseFloat(pairs[i]);
            const y = parseFloat(pairs[i + 1]);
            if (!isNaN(x) && !isNaN(y)) {
                points.push({ x, y });
            }
        }
        return points;
    },

    parseSVGPath(d) {
        const entities = [];
        const points = [];
        let currentX = 0, currentY = 0;
        let startX = 0, startY = 0;

        // Simple path parser - handles M, L, H, V, Z commands
        const commands = d.match(/[MLHVZCSQTAmlhvzcsqta][^MLHVZCSQTAmlhvzcsqta]*/g) || [];

        for (const cmd of commands) {
            const type = cmd[0];
            const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

            switch (type) {
                case 'M': // Move to (absolute)
                    if (points.length >= 2) {
                        entities.push({ type: 'polyline', points: [...points], layer: '0' });
                    }
                    points.length = 0;
                    currentX = args[0] || 0;
                    currentY = args[1] || 0;
                    startX = currentX;
                    startY = currentY;
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'm': // Move to (relative)
                    if (points.length >= 2) {
                        entities.push({ type: 'polyline', points: [...points], layer: '0' });
                    }
                    points.length = 0;
                    currentX += args[0] || 0;
                    currentY += args[1] || 0;
                    startX = currentX;
                    startY = currentY;
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'L': // Line to (absolute)
                    for (let i = 0; i < args.length; i += 2) {
                        currentX = args[i];
                        currentY = args[i + 1];
                        points.push({ x: currentX, y: currentY });
                    }
                    break;
                case 'l': // Line to (relative)
                    for (let i = 0; i < args.length; i += 2) {
                        currentX += args[i];
                        currentY += args[i + 1];
                        points.push({ x: currentX, y: currentY });
                    }
                    break;
                case 'H': // Horizontal line (absolute)
                    currentX = args[0];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'h': // Horizontal line (relative)
                    currentX += args[0];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'V': // Vertical line (absolute)
                    currentY = args[0];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'v': // Vertical line (relative)
                    currentY += args[0];
                    points.push({ x: currentX, y: currentY });
                    break;
                case 'Z':
                case 'z': // Close path
                    if (points.length >= 2) {
                        points.push({ x: startX, y: startY });
                        entities.push({ type: 'polyline', points: [...points], closed: true, layer: '0' });
                        points.length = 0;
                    }
                    currentX = startX;
                    currentY = startY;
                    break;
            }
        }

        // Add remaining points as polyline
        if (points.length >= 2) {
            entities.push({ type: 'polyline', points: [...points], layer: '0' });
        }

        return entities;
    },

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    openFileDialog(accept, callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                callback(e.target.files[0]);
            }
        };
        input.click();
    },

    // ==========================================
    // GOOGLE DRIVE INTEGRATION
    // ==========================================

    // State
    _gisInited: false,
    _gapiInited: false,
    _accessToken: null,
    _tokenClient: null,
    _currentDriveFileId: null,

    /**
     * Initialize the Google API client library (gapi).
     * Called once gapi.js has loaded.
     */
    initGapiClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client:picker', async () => {
                try {
                    await gapi.client.init({});
                    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                    this._gapiInited = true;
                    console.log('Google API client initialized.');
                    this._maybeEnableDriveButtons();
                    resolve();
                } catch (err) {
                    console.error('Error initializing GAPI client:', err);
                    reject(err);
                }
            });
        });
    },

    /**
     * Initialize Google Identity Services (GIS) token client.
     * Called once the GIS library has loaded.
     */
    initGisClient() {
        const config = window.CAD_CONFIG;
        if (!config || !config.clientId) {
            console.warn('CAD_CONFIG.clientId not set. Google Drive disabled.');
            return Promise.reject(new Error('CAD_CONFIG.clientId not set. Google Drive disabled.'));
        }

        this._tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: config.clientId,
            scope: config.scope,
            callback: '', // Set dynamically per-request
        });
        this._gisInited = true;
        console.log('Google Identity Services initialized.');
        this._maybeEnableDriveButtons();
        return Promise.resolve();
    },

    /**
     * Enable Drive menu items once both libraries are loaded.
     */
    _maybeEnableDriveButtons() {
        if (this._gisInited && this._gapiInited) {
            document.querySelectorAll('.drive-menu').forEach(el => {
                el.classList.add('drive-ready');
            });
        }
    },

    /**
     * Handle the Sign In / Sign Out button click.
     */
    handleGoogleSignIn() {
        this.loadGoogleApis(() => {
            if (this._accessToken) {
                // Sign out
                google.accounts.oauth2.revoke(this._accessToken, () => {
                    this._accessToken = null;
                    this._currentDriveFileId = null;
                    this._updateSignInUI(false);
                    UI.log('Signed out of Google.');
                });
                return;
            }

            // Sign in: request an access token
            this._getAccessToken().then(token => {
                if (token) {
                    this._updateSignInUI(true);
                    UI.log('Signed in to Google successfully.');
                }
            }).catch(err => {
                UI.log('Google sign-in failed: ' + err.message, 'error');
            });
        });
    },

    /**
     * Request an access token from GIS.
     * @param {boolean} forceNew - If true, discard cached token and request a new one.
     * Returns a Promise that resolves with the token string.
     */
    _getAccessToken(forceNew) {
        return new Promise((resolve, reject) => {
            if (!this._gisInited) {
                reject(new Error('Google Identity Services not loaded yet.'));
                return;
            }
            if (this._accessToken && !forceNew) {
                resolve(this._accessToken);
                return;
            }

            // Set callback for this token request
            this._tokenClient.callback = (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                this._accessToken = response.access_token;
                resolve(this._accessToken);
            };

            this._tokenClient.requestAccessToken({
                prompt: this._accessToken ? '' : 'consent'
            });
        });
    },

    /**
     * Update the sign-in button UI (desktop + mobile).
     */
    _updateSignInUI(signedIn) {
        const btn = document.getElementById('googleSignInBtn');
        const text = document.getElementById('googleSignInText');
        if (btn && text) {
            if (signedIn) {
                text.textContent = 'Sign Out';
                btn.classList.add('signed-in');
                btn.title = 'Sign out of Google';
            } else {
                text.textContent = 'Sign In';
                btn.classList.remove('signed-in');
                btn.title = 'Sign in with Google';
            }
        }

        // Update mobile menu sign-in label
        const mobileLabel = document.getElementById('mobileSignInLabel');
        const mobileItem = document.getElementById('mobileGoogleSignIn');
        if (mobileLabel) {
            mobileLabel.textContent = signedIn ? 'Sign Out of Google' : 'Sign In to Google';
        }
        if (mobileItem) {
            mobileItem.classList.toggle('drive-signed-in', signedIn);
        }
    },

    /**
     * Open the Google Drive Picker to select a CAD file.
     * Supports .dxf, .json, and .svg files.
     */
    openFromDrive() {
        this.loadGoogleApis(async () => {
            try {
                // Always get a fresh token for the Picker
                const token = await this._getAccessToken(true);
                this._updateSignInUI(true);

                // Show all files — DXF has no standard MIME type in Drive
                const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
                    .setMode(google.picker.DocsViewMode.LIST);

                // NOTE: Do NOT pass setDeveloperKey here. The Picker iframe runs
                // on Google's domain, so HTTP-referrer-restricted API keys get
                // blocked and cause a perpetual "Sign in" screen. The OAuth token
                // alone is sufficient for authenticated Picker access.
                const picker = new google.picker.PickerBuilder()
                    .setOAuthToken(token)
                    .setAppId(window.CAD_CONFIG.appId)
                    .addView(view)
                    .addView(new google.picker.DocsUploadView())
                    .setTitle('Open Drawing from Google Drive (.dxf, .json, .svg)')
                    .setCallback((data) => this._pickerOpenCallback(data))
                    .setOrigin(window.location.protocol + '//' + window.location.host)
                    .build();

                picker.setVisible(true);
            } catch (err) {
                UI.log('Could not open Drive picker: ' + err.message, 'error');
                console.error('Drive Picker error:', err);
            }
        });
    },

    /**
     * Picker callback for opening a file.
     * Detects format by extension and routes to the right parser.
     */
    async _pickerOpenCallback(data) {
        if (data.action !== google.picker.Action.PICKED) return;

        const file = data[google.picker.Response.DOCUMENTS][0];
        const fileId = file[google.picker.Document.ID];
        const fileName = file[google.picker.Document.NAME];
        const ext = fileName.split('.').pop().toLowerCase();

        if (!['dxf', 'json', 'svg', 'htmlcad'].includes(ext)) {
            UI.log(`Unsupported file format: .${ext}. Use .dxf, .json, or .svg`, 'error');
            return;
        }

        UI.log(`Loading "${fileName}" from Google Drive...`);

        try {
            // Use fetch API directly for reliable text content retrieval.
            // gapi.client.drive.files.get with alt=media can mangle non-standard
            // MIME types or binary-encode the response body.
            const token = this._accessToken;
            const fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
            const fetchResponse = await fetch(fetchUrl, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!fetchResponse.ok) {
                const errText = await fetchResponse.text();
                throw new Error(`HTTP ${fetchResponse.status}: ${errText}`);
            }

            const content = await fetchResponse.text();
            console.log(`Drive file loaded: ${content.length} bytes, ext: .${ext}`);

            if (!content || content.length === 0) {
                throw new Error('File appears to be empty.');
            }

            if (ext === 'json' || ext === 'htmlcad') {
                const jsonData = JSON.parse(content);
                CAD.fromJSON(jsonData);
            } else if (ext === 'dxf') {
                this._importDXFFromString(content);
            } else if (ext === 'svg') {
                this._importSVGFromString(content);
            }

            UI.updateLayerUI();
            UI.renderLayoutTabs();
            Renderer.draw();

            // Remember the file ID so we can update it later
            this._currentDriveFileId = fileId;
            CAD.drawingName = fileName.replace(/\.(dxf|json|svg|htmlcad)$/i, '');

            const fileNameEl = document.getElementById('fileName');
            if (fileNameEl) fileNameEl.textContent = fileName;

            UI.log(`Drawing "${fileName}" loaded from Google Drive.`, 'success');
        } catch (err) {
            UI.log('Error loading file from Drive: ' + err.message, 'error');
            console.error('Drive file load error:', err);
        }
    },

    /**
     * Import DXF from a raw string (used by Drive open).
     */
    _importDXFFromString(content) {
        const moduleData = this.parseDXFWithModule(content);

        CAD.entities = [];
        CAD.blocks = moduleData.blocks;
        CAD.layers = [{ name: '0', color: '#ffffff', visible: true, locked: false, lineWeight: 'Default' }];
        moduleData.layers.forEach(layer => {
            if (layer.name !== '0') {
                CAD.layers.push(layer);
            } else {
                CAD.layers[0].color = layer.color;
            }
        });

        moduleData.entities.forEach(entity => {
            if (!CAD.getLayer(entity.layer)) {
                CAD.layers.push({
                    name: entity.layer,
                    color: '#ffffff',
                    visible: true,
                    locked: false,
                    lineWeight: 'Default'
                });
            }
            CAD.addEntity(entity, true);
        });

        Object.values(CAD.blocks).forEach(block => {
            block.entities.forEach(entity => {
                if (entity.layer && !CAD.getLayer(entity.layer)) {
                    CAD.layers.push({
                        name: entity.layer,
                        color: '#ffffff',
                        visible: true,
                        locked: false,
                        lineWeight: 'Default'
                    });
                }
            });
        });

        if (moduleData.entities.length > 0) {
            Commands.zoomExtents();
        }
    },

    /**
     * Import SVG from a raw string (used by Drive open).
     */
    _importSVGFromString(content) {
        const entities = this.parseSVG(content);
        if (entities.length > 0) {
            CAD.entities = [];
            entities.forEach(entity => CAD.addEntity(entity, true));
            Commands.zoomExtents();
        }
    },

    /**
     * Prompt for filename and save to Drive.
     * Defaults to .dxf format.
     */
    saveToDrivePrompt() {
        this.loadGoogleApis(() => {
            const defaultName = (CAD.drawingName || 'drawing') + '.dxf';
            const filename = prompt('Save to Google Drive as:', defaultName);
            if (!filename) return;

            const ext = filename.split('.').pop().toLowerCase();
            let content, mimeType;

            if (ext === 'json' || ext === 'htmlcad') {
                content = JSON.stringify(CAD.toJSON(), null, 2);
                mimeType = 'application/json';
            } else if (ext === 'svg') {
                content = this.generateSVG();
                mimeType = 'image/svg+xml';
            } else {
                // Default to DXF — use text/plain so Google Drive stores it as
                // readable text. 'application/dxf' is non-standard and some
                // Drive/browser combos drop or mangle the content.
                content = this.generateDXF();
                mimeType = 'text/plain';
            }

            if (!content || content.length === 0) {
                UI.log('Error: No content to save. Draw something first.', 'error');
                return;
            }

            this.saveToDrive(content, filename, mimeType);
        });
    },

    /**
     * Save (create or update) a file on Google Drive.
     * @param {string} fileData - The file content string.
     * @param {string} filename - The filename to use.
     * @param {string} [mimeType='text/plain'] - MIME type of the file.
     */
    async saveToDrive(fileData, filename, mimeType) {
        try {
            const token = await this._getAccessToken();
            this._updateSignInUI(true);

            UI.log(`Saving "${filename}" to Google Drive...`);

            const effectiveMime = mimeType || 'text/plain';
            const fileContent = fileData;
            const metadata = {
                name: filename,
                mimeType: effectiveMime
            };

            // Use Blob-based multipart upload for reliable encoding.
            // String concatenation can break on certain characters.
            const metadataBlob = new Blob(
                [JSON.stringify(metadata)],
                { type: 'application/json; charset=UTF-8' }
            );
            const contentBlob = new Blob(
                [fileContent],
                { type: effectiveMime + '; charset=UTF-8' }
            );

            const boundary = '-------browsercad_boundary_' + Date.now();
            const CRLF = '\r\n';

            // Build multipart body using Blob parts for correct encoding
            const bodyParts = [
                '--' + boundary + CRLF,
                'Content-Type: application/json; charset=UTF-8' + CRLF + CRLF,
                metadataBlob,
                CRLF + '--' + boundary + CRLF,
                'Content-Type: ' + effectiveMime + '; charset=UTF-8' + CRLF,
                'Content-Transfer-Encoding: 8bit' + CRLF + CRLF,
                contentBlob,
                CRLF + '--' + boundary + '--'
            ];
            const multipartBody = new Blob(bodyParts);

            let url, method;

            if (this._currentDriveFileId) {
                // Update existing file
                url = `https://www.googleapis.com/upload/drive/v3/files/${this._currentDriveFileId}?uploadType=multipart`;
                method = 'PATCH';
            } else {
                // Create new file
                url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
                method = 'POST';
            }

            console.log(`Drive save: ${method} ${url}, size=${multipartBody.size}, mime=${effectiveMime}`);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'multipart/related; boundary=' + boundary
                },
                body: multipartBody
            });

            if (!response.ok) {
                const errText = await response.text();
                // If we got a 404 on PATCH (file deleted), retry as new file
                if (response.status === 404 && method === 'PATCH') {
                    console.warn('Drive file not found for update, creating new file...');
                    this._currentDriveFileId = null;
                    return this.saveToDrive(fileData, filename, mimeType);
                }
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const result = await response.json();
            this._currentDriveFileId = result.id;

            CAD.drawingName = filename.replace(/\.(dxf|json|svg|htmlcad)$/i, '');
            const fileNameEl = document.getElementById('fileName');
            if (fileNameEl) fileNameEl.textContent = filename;

            CAD.modified = false;
            UI.log(`Drawing saved to Google Drive as "${filename}".`, 'success');
        } catch (err) {
            UI.log('Error saving to Drive: ' + err.message, 'error');
            console.error('Drive save error:', err);
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
