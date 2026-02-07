/* ============================================
   BrowserCAD - Rendering Module
   ============================================ */

const Renderer = {
    canvas: null,
    ctx: null,
    viewport: null,

    // Colors
    colors: {
        background: '#1a1a1a',
        gridMinor: '#252525',
        gridMajor: '#353535',
        axisX: '#803030',
        axisY: '#308030',
        cursor: '#ffffff',
        selection: '#3399ff',
        selectionFill: 'rgba(51, 153, 255, 0.15)',
        hover: '#ffcc00',  // Yellow-orange for hover highlight
        crossWindow: 'rgba(0, 255, 100, 0.15)',
        crossWindowBorder: 'rgba(0, 255, 100, 0.5)',
        windowSelect: 'rgba(0, 100, 255, 0.15)',
        windowSelectBorder: 'rgba(0, 100, 255, 0.5)',
        preview: '#888888',
        snap: {
            endpoint: '#00ff00',
            midpoint: '#00ffff',
            center: '#ff00ff',
            intersection: '#ffff00',
            grid: '#808080',
            nearest: '#ff8800',
            perpendicular: '#00ff88',
            tangent: '#ff88ff',
            quadrant: '#ffaa00',
            node: '#66ff66'
        }
    },
    hatchPatterns: new Map(),
    imageCache: new Map(),

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init(canvasId, viewportId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.viewport = document.getElementById(viewportId);

        this.resize();
        requestAnimationFrame(() => this.resize());
        window.addEventListener('resize', () => this.resize());

        return this;
    },

    resize() {
        if (!this.viewport || !this.canvas) return;

        this.canvas.width = this.viewport.clientWidth;
        this.canvas.height = this.viewport.clientHeight;
        this.draw();
    },

    // ==========================================
    // MAIN DRAW FUNCTION
    // ==========================================

    draw() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const state = CAD;
        const layout = state.getLayout(state.currentLayout);
        const isPaper = layout && layout.type === 'paper';

        // Clear canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply view transformation
        ctx.translate(state.pan.x, state.pan.y);
        ctx.scale(state.zoom, state.zoom);

        if (isPaper) {
            this.drawLayout(layout);
        } else {
            // Draw grid
            if (state.showGrid) {
                this.drawGrid();
            }

            // Draw entities
            this.drawEntities();
        }

        // Draw grips on selected entities
        this.drawGrips();

        // Draw preview (for active command)
        this.drawPreview();

        // Draw selection window
        this.drawSelectionWindow();

        // Reset transform for screen-space drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Draw crosshair cursor
        this.drawCursor();

        // Draw mobile touch target indicator
        this.drawMobileTouchTarget();

        // Draw snap indicator
        this.drawSnapIndicator();

        // Draw tracking lines (polar and object snap tracking)
        this.drawTrackingLines();

        // Draw dynamic input (coordinate display near cursor)
        if (CAD.dynamicInputEnabled) {
            this.drawDynamicInput();
        }

        // Draw UCS icon
        this.drawUCSIcon();
    },

    drawPaperLayout(layout = null, zoom = null) {
        const state = CAD;
        const activeLayout = layout || state.getLayout(state.currentLayout);
        if (!activeLayout || activeLayout.type !== 'paper' || !activeLayout.paper) return;

        const ctx = this.ctx;
        const { width, height, margin } = activeLayout.paper;
        const effectiveZoom = zoom ?? state.zoom;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(6 / effectiveZoom, 6 / effectiveZoom, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1 / effectiveZoom;
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.fill();
        ctx.stroke();

        if (margin) {
            ctx.strokeStyle = '#999999';
            ctx.setLineDash([5 / effectiveZoom, 5 / effectiveZoom]);
            ctx.beginPath();
            ctx.rect(margin, margin, width - margin * 2, height - margin * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    },

    drawLayout(layout) {
        if (!layout) return;
        this.drawPaperLayout(layout, CAD.zoom);
        this.drawPaperEntities(layout, CAD.zoom);
        this.drawViewports(layout, { zoom: CAD.zoom });
    },

    renderLayoutToContext(ctx, layout, options = {}) {
        if (!layout || layout.type !== 'paper' || !layout.paper) return;
        const { width, height } = layout.paper;
        const scale = options.scale ?? 1;

        const previousContext = this.ctx;
        const previousCanvas = this.canvas;

        this.ctx = ctx;
        this.canvas = { width: width * scale, height: height * scale };

        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        this.drawPaperLayout(layout, scale);
        this.drawPaperEntities(layout, scale);
        this.drawViewports(layout, { zoom: scale });

        this.ctx = previousContext;
        this.canvas = previousCanvas;
    },

    // ==========================================
    // GRID DRAWING
    // ==========================================

    drawGrid() {
        const ctx = this.ctx;
        const state = CAD;

        const spacing = state.gridSpacing;
        const subdivisions = state.gridSubdivisions;
        const minorSpacing = spacing / subdivisions;

        // Calculate visible area
        const topLeft = Utils.screenToWorld(0, 0, state.pan, state.zoom);
        const bottomRight = Utils.screenToWorld(this.canvas.width, this.canvas.height, state.pan, state.zoom);

        const startX = Math.floor(topLeft.x / minorSpacing) * minorSpacing;
        const startY = Math.floor(topLeft.y / minorSpacing) * minorSpacing;
        const endX = Math.ceil(bottomRight.x / minorSpacing) * minorSpacing;
        const endY = Math.ceil(bottomRight.y / minorSpacing) * minorSpacing;

        // Minor grid lines
        ctx.strokeStyle = this.colors.gridMinor;
        ctx.lineWidth = 0.5 / state.zoom;
        ctx.beginPath();

        for (let x = startX; x <= endX; x += minorSpacing) {
            if (Math.abs(x % spacing) > 0.001) {
                ctx.moveTo(x, topLeft.y);
                ctx.lineTo(x, bottomRight.y);
            }
        }

        for (let y = startY; y <= endY; y += minorSpacing) {
            if (Math.abs(y % spacing) > 0.001) {
                ctx.moveTo(topLeft.x, y);
                ctx.lineTo(bottomRight.x, y);
            }
        }

        ctx.stroke();

        // Major grid lines
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 1 / state.zoom;
        ctx.beginPath();

        const majorStartX = Math.floor(topLeft.x / spacing) * spacing;
        const majorStartY = Math.floor(topLeft.y / spacing) * spacing;

        for (let x = majorStartX; x <= endX; x += spacing) {
            if (x !== 0) {
                ctx.moveTo(x, topLeft.y);
                ctx.lineTo(x, bottomRight.y);
            }
        }

        for (let y = majorStartY; y <= endY; y += spacing) {
            if (y !== 0) {
                ctx.moveTo(topLeft.x, y);
                ctx.lineTo(bottomRight.x, y);
            }
        }

        ctx.stroke();

        // Axes
        ctx.lineWidth = 1.5 / state.zoom;

        // X axis (red)
        ctx.strokeStyle = this.colors.axisX;
        ctx.beginPath();
        ctx.moveTo(topLeft.x, 0);
        ctx.lineTo(bottomRight.x, 0);
        ctx.stroke();

        // Y axis (green)
        ctx.strokeStyle = this.colors.axisY;
        ctx.beginPath();
        ctx.moveTo(0, topLeft.y);
        ctx.lineTo(0, bottomRight.y);
        ctx.stroke();
    },

    // ==========================================
    // ENTITY DRAWING
    // ==========================================

    drawEntities() {
        this.drawEntityList(CAD.entities, { zoom: CAD.zoom });
    },

    drawPaperEntities(layout, zoom = CAD.zoom) {
        if (!layout || !layout.entities || layout.entities.length === 0) return;
        this.drawEntityList(layout.entities, { zoom, includeSelection: false });
    },

    drawViewports(layout, options = {}) {
        if (!layout || !layout.viewports) return;
        const zoom = options.zoom ?? CAD.zoom;
        layout.viewports.forEach(viewport => this.drawViewport(viewport, zoom));
    },

    drawViewport(viewport, zoom = CAD.zoom) {
        if (!viewport) return;

        const ctx = this.ctx;
        const state = CAD;
        const { centerPoint, width, height, viewCenter, viewScale } = viewport;

        if (!centerPoint || !width || !height || !viewCenter || !viewScale) return;

        const left = centerPoint.x - width / 2;
        const top = centerPoint.y - height / 2;
        const effectiveZoom = zoom * viewScale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, width, height);
        ctx.clip();

        ctx.translate(centerPoint.x, centerPoint.y);
        ctx.scale(viewScale, viewScale);
        ctx.translate(-viewCenter.x, -viewCenter.y);

        this.drawEntityList(state.entities, { zoom: effectiveZoom });

        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, width, height);
        ctx.strokeStyle = viewport.id === state.activeViewportId ? this.colors.accent : '#9aa0a6';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash(viewport.id === state.activeViewportId ? [6 / zoom, 4 / zoom] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    },

    drawEntityList(entities, options = {}) {
        const ctx = this.ctx;
        const state = CAD;
        const zoom = options.zoom ?? state.zoom;
        const includeSelection = options.includeSelection !== false;

        entities.forEach(entity => {
            if (entity._hidden) return;
            const layer = state.getLayer(entity.layer);
            if (!layer || !state.isLayerVisible(entity.layer)) return;

            const isSelected = includeSelection && state.isSelected(entity.id);
            const isHovered = includeSelection && state.hoveredId === entity.id && !isSelected;

            // Determine color: selected > hovered > normal
            let color;
            if (isSelected) {
                color = this.colors.selection;
            } else if (isHovered) {
                color = this.colors.hover;
            } else {
                color = state.getEntityColor(entity);
            }

            if (entity.type === 'hatch') {
                this.drawHatchFill(entity, color, zoom, isSelected, isHovered);
                return;
            }

            if (entity.type === 'image') {
                this.drawImageEntity(entity, color, isSelected, isHovered);
                return;
            }

            if (entity.type === 'wipeout') {
                this.drawWipeoutEntity(entity, color, isSelected, isHovered);
                return;
            }

            ctx.beginPath();
            ctx.strokeStyle = color;

            // Line width: based on lineweight, boosted for selection/hover
            const baseLineWeight = this.getLineWeight(entity);
            let lineWidth = baseLineWeight;
            if (isSelected) {
                lineWidth = Math.max(baseLineWeight + 1, 2);
            } else if (isHovered) {
                lineWidth = Math.max(baseLineWeight + 0.5, 1.5);
            }
            ctx.lineWidth = lineWidth / zoom;

            // Line dash: selected = dashed, others use linetype
            ctx.setLineDash(isSelected ? [5 / zoom, 3 / zoom] : this.getLineDash(entity, zoom));

            this.drawEntity(entity, ctx);

            // Wide polyline: fill the outline shape
            if (entity.type === 'polyline' && entity.width && entity.width > 0) {
                ctx.fillStyle = color;
                ctx.fill();
                ctx.stroke();
            }
            // Handle hatch fill
            else if (entity.hatch) {
                const hatchStyle = this.getHatchStyle(entity, color);
                ctx.save();
                ctx.fillStyle = hatchStyle.fillStyle;
                ctx.globalAlpha = hatchStyle.alpha;
                ctx.fill();
                ctx.restore();
                if (!entity.noStroke) {
                    ctx.stroke();
                }
            } else {
                ctx.stroke();
            }
        });

        ctx.setLineDash([]);
    },

    normalizeLineType(value) {
        if (!value) return null;
        return value.toString().trim().toLowerCase();
    },

    getEffectiveLineType(entity) {
        const entityLineType = this.normalizeLineType(entity.lineType);
        if (entityLineType && entityLineType !== 'bylayer') {
            return entityLineType;
        }
        const layer = CAD.getLayer(entity.layer);
        const layerLineType = this.normalizeLineType(layer?.lineType);
        if (layerLineType) return layerLineType;
        const current = this.normalizeLineType(CAD.lineType);
        return current || 'continuous';
    },

    getLineDash(entity, zoom = CAD.zoom) {
        const lineType = this.getEffectiveLineType(entity);
        const scale = CAD.lineTypeScale || 1;
        const basePatterns = {
            continuous: [],
            dashed: [10, 6],
            dotted: [2, 6],
            dashdot: [10, 4, 2, 4],
            center: [12, 4, 2, 4],
            phantom: [12, 4, 2, 4, 2, 4],
            hidden: [6, 4]
        };
        const pattern = basePatterns[lineType] || [];
        if (pattern.length === 0) return [];
        return pattern.map(value => (value * scale) / zoom);
    },

    getLineWeight(entity) {
        const resolved = this.resolveLineWeight(entity.lineWeight);
        if (resolved !== null) return resolved;
        const layer = CAD.getLayer(entity.layer);
        const layerWeight = this.resolveLineWeight(layer?.lineWeight);
        if (layerWeight !== null) return layerWeight;
        return 1;
    },

    resolveLineWeight(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') {
            if (value > 10) {
                const mmWeight = value / 100;
                return Math.max(1, mmWeight * 2);
            }
            return Math.max(1, value);
        }
        const normalized = value.toString().trim().toLowerCase();
        if (!normalized || normalized === 'default' || normalized === 'bylayer') return null;
        const parsed = parseFloat(normalized);
        if (Number.isNaN(parsed)) return null;
        return Math.max(1, parsed * 2);
    },

    getImage(src) {
        if (!src) return null;
        if (!this.imageCache.has(src)) {
            const img = new Image();
            img.onload = () => this.draw();
            img.src = src;
            this.imageCache.set(src, img);
        }
        return this.imageCache.get(src);
    },

    drawImageEntity(entity, color, isSelected, isHovered) {
        const ctx = this.ctx;
        const image = this.getImage(entity.src);
        if (!image || !image.complete) return;

        const width = entity.width ?? Math.abs(entity.p2.x - entity.p1.x);
        const height = entity.height ?? Math.abs(entity.p2.y - entity.p1.y);
        const rotation = Utils.degToRad(entity.rotation || 0);
        const minX = entity.p1.x;
        const minY = entity.p1.y;

        ctx.save();
        ctx.globalAlpha = entity.opacity ?? 0.6;
        ctx.translate(minX, minY);
        if (rotation) {
            ctx.rotate(rotation);
        }
        ctx.drawImage(image, 0, 0, width, height);
        ctx.restore();

        if (isSelected || isHovered) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = (isSelected ? 2 : 1.5) / CAD.zoom;
            ctx.setLineDash(isSelected ? [5 / CAD.zoom, 3 / CAD.zoom] : []);
            ctx.translate(minX, minY);
            if (rotation) {
                ctx.rotate(rotation);
            }
            ctx.strokeRect(0, 0, width, height);
            ctx.restore();
        }
    },

    getHatchStyle(entity, color) {
        const hatch = typeof entity.hatch === 'object' ? entity.hatch : { pattern: 'solid' };
        const pattern = hatch.pattern || 'solid';

        if (pattern === 'solid') {
            return { fillStyle: color, alpha: 0.2 };
        }

        const fillStyle = this.getHatchPattern(pattern, color);
        return { fillStyle, alpha: 0.6 };
    },

    getHatchPattern(pattern, color) {
        const zoomKey = Math.round(CAD.zoom * 100);
        const key = `${pattern}-${color}-${zoomKey}`;
        if (this.hatchPatterns.has(key)) {
            return this.hatchPatterns.get(key);
        }

        const size = Math.max(4, 8 / CAD.zoom);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = Math.max(0.5, 1 / CAD.zoom);

        switch (pattern) {
            case 'diagonal':
            case 'angle':
            case 'ansi31':
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.stroke();
                break;
            case 'ansi32': // Double diagonal
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(size * 0.5, 0);
                ctx.moveTo(size * 0.5, size);
                ctx.lineTo(size, size * 0.5);
                ctx.stroke();
                break;
            case 'ansi33': // Diagonal sparse
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.stroke();
                break;
            case 'ansi34': // Diagonal thick
                ctx.lineWidth = Math.max(1, 2 / CAD.zoom);
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.stroke();
                break;
            case 'ansi35': // Reverse diagonal
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(size, size);
                ctx.stroke();
                break;
            case 'ansi36': // Horizontal lines
                ctx.beginPath();
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(size, size * 0.5);
                ctx.stroke();
                break;
            case 'ansi38': // Diagonal + horizontal
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(size, size * 0.5);
                ctx.stroke();
                break;
            case 'cross':
            case 'ansi37':
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(size, size);
                ctx.stroke();
                break;
            case 'dots':
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, Math.max(0.5, size / 6), 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'brick': {
                ctx.beginPath();
                // Horizontal lines
                ctx.moveTo(0, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(size, size * 0.5);
                // Staggered verticals
                ctx.moveTo(size * 0.5, 0);
                ctx.lineTo(size * 0.5, size * 0.5);
                ctx.moveTo(0, size * 0.5);
                ctx.lineTo(0, size);
                ctx.stroke();
                break;
            }
            case 'honey': {
                const s = size * 0.5;
                ctx.beginPath();
                // Hexagon pattern
                ctx.moveTo(s * 0.5, 0);
                ctx.lineTo(s * 1.5, 0);
                ctx.lineTo(s * 2, s * 0.87);
                ctx.lineTo(s * 1.5, s * 1.73);
                ctx.lineTo(s * 0.5, s * 1.73);
                ctx.lineTo(0, s * 0.87);
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'earth': {
                ctx.beginPath();
                // Random-looking short dashes
                for (let i = 0; i < 6; i++) {
                    const x1 = (i * 37 + 7) % size;
                    const y1 = (i * 23 + 11) % size;
                    const len = size * 0.2;
                    const ang = (i * 50) * Math.PI / 180;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
                }
                ctx.stroke();
                break;
            }
            case 'grass': {
                ctx.beginPath();
                // Short upward strokes
                const gs = size / 3;
                for (let gy = 0; gy < 3; gy++) {
                    for (let gx = 0; gx < 3; gx++) {
                        if ((gx + gy) % 2 === 0) {
                            const bx = gx * gs + gs * 0.5;
                            const by = gy * gs + gs;
                            ctx.moveTo(bx, by);
                            ctx.lineTo(bx, by - gs * 0.6);
                        }
                    }
                }
                ctx.stroke();
                break;
            }
            case 'steel': {
                ctx.beginPath();
                // Steel - diagonal with perpendicular ticks
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                const mid = size * 0.5;
                ctx.moveTo(mid - size * 0.15, mid - size * 0.15);
                ctx.lineTo(mid + size * 0.15, mid + size * 0.15);
                ctx.stroke();
                break;
            }
            case 'insul': {
                ctx.beginPath();
                // Insulation - wavy pattern
                const step = size / 4;
                ctx.moveTo(0, size * 0.5);
                for (let x = 0; x <= size; x += step) {
                    const y = size * 0.5 + Math.sin((x / size) * Math.PI * 2) * size * 0.3;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                break;
            }
            case 'net':
            case 'net3': {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, size);
                ctx.stroke();
                break;
            }
            case 'dash': {
                ctx.beginPath();
                ctx.moveTo(size * 0.1, size * 0.5);
                ctx.lineTo(size * 0.4, size * 0.5);
                ctx.moveTo(size * 0.6, size * 0.5);
                ctx.lineTo(size * 0.9, size * 0.5);
                ctx.stroke();
                break;
            }
            case 'square': {
                ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);
                break;
            }
            case 'zigzag': {
                ctx.beginPath();
                ctx.moveTo(0, size * 0.75);
                ctx.lineTo(size * 0.25, size * 0.25);
                ctx.lineTo(size * 0.5, size * 0.75);
                ctx.lineTo(size * 0.75, size * 0.25);
                ctx.lineTo(size, size * 0.75);
                ctx.stroke();
                break;
            }
            default:
                ctx.beginPath();
                ctx.moveTo(0, size);
                ctx.lineTo(size, 0);
                ctx.stroke();
        }

        const patternFill = this.ctx.createPattern(canvas, 'repeat');
        this.hatchPatterns.set(key, patternFill);
        return patternFill;
    },

    drawHatchFill(entity, color, zoom, isSelected, isHovered) {
        const ctx = this.ctx;
        const boundary = entity.boundary || entity.points || [];
        const boundaryPoints = Geometry.Hatch.getBoundaryPoints(boundary);
        if (!boundaryPoints || boundaryPoints.length < 3) return;

        const pattern = entity.patternName || (entity.hatch && entity.hatch.pattern) || 'solid';
        const patternLower = pattern.toLowerCase();

        // Ensure renderLines are generated for non-solid patterns
        if (patternLower !== 'solid' && (!entity.renderLines || entity.renderLines.length === 0)) {
            this.ensureHatchRenderLines(entity);
        }

        ctx.save();

        // Build clip path from boundary
        ctx.beginPath();
        ctx.moveTo(boundaryPoints[0].x, boundaryPoints[0].y);
        for (let i = 1; i < boundaryPoints.length; i++) {
            ctx.lineTo(boundaryPoints[i].x, boundaryPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();

        if (patternLower === 'solid') {
            // Solid fill — semi-transparent color
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            boundaryPoints.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            const pad = Math.max(maxX - minX, maxY - minY) * 0.1;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.25;
            ctx.fillRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
        } else if (entity.renderLines && entity.renderLines.length > 0) {
            // Draw geometric render lines (proper world-space patterns)
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(0.5, 1 / zoom);
            ctx.globalAlpha = 1.0;
            entity.renderLines.forEach(seg => {
                if (!seg || !seg.p1 || !seg.p2) return;
                ctx.moveTo(seg.p1.x, seg.p1.y);
                ctx.lineTo(seg.p2.x, seg.p2.y);
            });
            ctx.stroke();
        }

        ctx.restore();

        // Draw boundary outline for selection/hover
        if (isSelected || isHovered) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(boundaryPoints[0].x, boundaryPoints[0].y);
            for (let i = 1; i < boundaryPoints.length; i++) {
                ctx.lineTo(boundaryPoints[i].x, boundaryPoints[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = isSelected ? this.colors.selection : this.colors.hover;
            ctx.lineWidth = (isSelected ? 2 : 1.5) / zoom;
            ctx.setLineDash(isSelected ? [5 / zoom, 3 / zoom] : []);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    },

    traceEntityPath(entity, ctx, forceClose = false) {
        if (Array.isArray(entity.boundary)) {
            const points = Geometry.Hatch.getBoundaryPoints(entity.boundary);
            if (points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
            }
            return;
        }
        switch (entity.type) {
            case 'line':
                ctx.moveTo(entity.p1.x, entity.p1.y);
                ctx.lineTo(entity.p2.x, entity.p2.y);
                break;
            case 'circle':
                ctx.arc(entity.center.x, entity.center.y, entity.r, 0, Math.PI * 2);
                ctx.closePath();
                break;
            case 'arc':
                ctx.arc(entity.center.x, entity.center.y, entity.r, entity.start, entity.end);
                if (forceClose) {
                    ctx.closePath();
                }
                break;
            case 'rect':
                ctx.rect(entity.p1.x, entity.p1.y, entity.p2.x - entity.p1.x, entity.p2.y - entity.p1.y);
                ctx.closePath();
                break;
            case 'polyline': {
                if (entity.points.length > 0) {
                    if (entity.isSpline && entity.points.length >= 2) {
                        this.drawSplineCurve(entity.points, ctx);
                    } else {
                        ctx.moveTo(entity.points[0].x, entity.points[0].y);
                        for (let i = 1; i < entity.points.length; i++) {
                            ctx.lineTo(entity.points[i].x, entity.points[i].y);
                        }
                    }
                    if (forceClose || entity.closed || Utils.isPolygonClosed(entity.points)) {
                        ctx.closePath();
                    }
                }
                break;
            }
            case 'ellipse':
                ctx.save();
                ctx.translate(entity.center.x, entity.center.y);
                ctx.rotate(entity.rotation || 0);
                ctx.scale(entity.rx, entity.ry);
                ctx.arc(0, 0, 1, 0, Math.PI * 2);
                ctx.restore();
                ctx.closePath();
                break;
            default:
                break;
        }
    },

    drawEntity(entity, ctx) {
        switch (entity.type) {
            case 'line':
                ctx.moveTo(entity.p1.x, entity.p1.y);
                ctx.lineTo(entity.p2.x, entity.p2.y);
                break;

            case 'circle':
                ctx.arc(entity.center.x, entity.center.y, entity.r, 0, Math.PI * 2);
                break;

            case 'arc':
                ctx.arc(entity.center.x, entity.center.y, entity.r, entity.start, entity.end);
                break;

            case 'rect':
                ctx.rect(entity.p1.x, entity.p1.y, entity.p2.x - entity.p1.x, entity.p2.y - entity.p1.y);
                break;

            case 'polyline':
                if (entity.points.length > 0) {
                    if (entity.width && entity.width > 0) {
                        // Wide polyline: draw as filled polygon outline
                        this._drawWidePolyline(entity, ctx);
                    } else if (entity.isSpline && entity.points.length >= 2) {
                        this.drawSplineCurve(entity.points, ctx);
                    } else {
                        ctx.moveTo(entity.points[0].x, entity.points[0].y);
                        for (let i = 1; i < entity.points.length; i++) {
                            ctx.lineTo(entity.points[i].x, entity.points[i].y);
                        }
                    }
                    if (!entity.width && (entity.closed || Utils.isPolygonClosed(entity.points))) {
                        ctx.closePath();
                    }
                }
                break;

            case 'region':
                // Render region like a closed polyline with subtle fill
                if (entity.points && entity.points.length > 0) {
                    ctx.moveTo(entity.points[0].x, entity.points[0].y);
                    for (let i = 1; i < entity.points.length; i++) {
                        ctx.lineTo(entity.points[i].x, entity.points[i].y);
                    }
                    ctx.closePath();
                }
                break;

            case 'leader':
                if (entity.points && entity.points.length > 0) {
                    ctx.moveTo(entity.points[0].x, entity.points[0].y);
                    for (let i = 1; i < entity.points.length; i++) {
                        ctx.lineTo(entity.points[i].x, entity.points[i].y);
                    }
                }
                if (entity.text) {
                    ctx.save();
                    ctx.font = `${entity.height || 10}px Arial`;
                    ctx.fillStyle = ctx.strokeStyle;
                    const textPos = entity.textPosition || entity.points[entity.points.length - 1];
                    ctx.fillText(entity.text, textPos.x, textPos.y);
                    ctx.restore();
                }
                break;

            case 'ellipse':
                ctx.save();
                ctx.translate(entity.center.x, entity.center.y);
                ctx.rotate(entity.rotation || 0);
                ctx.scale(entity.rx, entity.ry);
                ctx.arc(0, 0, 1, 0, Math.PI * 2);
                ctx.restore();
                break;

            case 'text':
                ctx.save();
                // Font size is in world units - zoom is already applied to the context
                ctx.font = `${entity.height}px Arial`;
                ctx.fillStyle = ctx.strokeStyle;
                const textPos = entity.position || entity.point || { x: 0, y: 0 };
                ctx.translate(textPos.x, textPos.y);
                if (entity.rotation) {
                    const rotation = Math.abs(entity.rotation) > Math.PI * 2 + 0.001
                        ? Utils.degToRad(entity.rotation)
                        : entity.rotation;
                    ctx.rotate(-rotation); // Negative for correct rotation direction
                }
                ctx.fillText(entity.text, 0, entity.height * 0.3); // Offset for baseline
                ctx.restore();
                break;

            case 'mtext':
                ctx.save();
                ctx.font = `${entity.height}px Arial`;
                ctx.fillStyle = ctx.strokeStyle;
                const mtextPos = entity.position || entity.point || { x: 0, y: 0 };
                ctx.translate(mtextPos.x, mtextPos.y);
                if (entity.rotation) {
                    const rotation = Math.abs(entity.rotation) > Math.PI * 2 + 0.001
                        ? Utils.degToRad(entity.rotation)
                        : entity.rotation;
                    ctx.rotate(-rotation);
                }

                // Draw multiline text
                const lines = entity.text.split('\n');
                const lineHeight = entity.height * 1.2;
                lines.forEach((line, index) => {
                    ctx.fillText(line, 0, entity.height + index * lineHeight);
                });

                // Draw bounding box if selected
                if (CAD.selectedIds.includes(entity.id)) {
                    ctx.strokeStyle = this.colors.selection;
                    ctx.lineWidth = 1 / CAD.zoom;
                    const textWidth = entity.width || Math.max(...lines.map(l => ctx.measureText(l).width));
                    const textHeight = lines.length * lineHeight;
                    ctx.strokeRect(0, -entity.height, textWidth, textHeight);
                }
                ctx.restore();
                break;

            case 'point':
                // Draw point based on PDMODE setting
                const pdmode = CAD.pointDisplayMode || 3;
                const pdsize = (CAD.pointDisplaySize || 5) / CAD.zoom;
                const px = entity.position.x;
                const py = entity.position.y;

                switch (pdmode) {
                    case 0: // Dot
                        ctx.beginPath();
                        ctx.arc(px, py, 1 / CAD.zoom, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 1: // Nothing (invisible)
                        break;
                    case 2: // Plus (+)
                        ctx.moveTo(px - pdsize, py);
                        ctx.lineTo(px + pdsize, py);
                        ctx.moveTo(px, py - pdsize);
                        ctx.lineTo(px, py + pdsize);
                        break;
                    case 3: // X (default)
                        ctx.moveTo(px - pdsize, py - pdsize);
                        ctx.lineTo(px + pdsize, py + pdsize);
                        ctx.moveTo(px + pdsize, py - pdsize);
                        ctx.lineTo(px - pdsize, py + pdsize);
                        break;
                    case 4: // Short vertical line
                        ctx.moveTo(px, py - pdsize);
                        ctx.lineTo(px, py + pdsize);
                        break;
                    case 32: // Square
                        ctx.strokeRect(px - pdsize, py - pdsize, pdsize * 2, pdsize * 2);
                        break;
                    case 33: // Square with X
                        ctx.strokeRect(px - pdsize, py - pdsize, pdsize * 2, pdsize * 2);
                        ctx.moveTo(px - pdsize, py - pdsize);
                        ctx.lineTo(px + pdsize, py + pdsize);
                        ctx.moveTo(px + pdsize, py - pdsize);
                        ctx.lineTo(px - pdsize, py + pdsize);
                        break;
                    case 34: // Square with +
                        ctx.strokeRect(px - pdsize, py - pdsize, pdsize * 2, pdsize * 2);
                        ctx.moveTo(px - pdsize, py);
                        ctx.lineTo(px + pdsize, py);
                        ctx.moveTo(px, py - pdsize);
                        ctx.lineTo(px, py + pdsize);
                        break;
                    case 64: // Circle
                        ctx.beginPath();
                        ctx.arc(px, py, pdsize, 0, Math.PI * 2);
                        ctx.stroke();
                        break;
                    case 65: // Circle with X
                        ctx.beginPath();
                        ctx.arc(px, py, pdsize, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(px - pdsize, py - pdsize);
                        ctx.lineTo(px + pdsize, py + pdsize);
                        ctx.moveTo(px + pdsize, py - pdsize);
                        ctx.lineTo(px - pdsize, py + pdsize);
                        break;
                    case 66: // Circle with +
                        ctx.beginPath();
                        ctx.arc(px, py, pdsize, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(px - pdsize, py);
                        ctx.lineTo(px + pdsize, py);
                        ctx.moveTo(px, py - pdsize);
                        ctx.lineTo(px, py + pdsize);
                        break;
                    default: // Default to X
                        ctx.moveTo(px - pdsize, py - pdsize);
                        ctx.lineTo(px + pdsize, py + pdsize);
                        ctx.moveTo(px + pdsize, py - pdsize);
                        ctx.lineTo(px - pdsize, py + pdsize);
                }
                break;

            case 'donut':
                // Draw donut as two concentric circles with fill
                ctx.arc(entity.center.x, entity.center.y, entity.outerRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(entity.center.x, entity.center.y, entity.innerRadius, 0, Math.PI * 2);
                // Fill between circles
                ctx.save();
                ctx.fillStyle = ctx.strokeStyle;
                ctx.globalAlpha = 0.3;
                ctx.fill('evenodd');
                ctx.globalAlpha = 1.0;
                ctx.restore();
                break;

            case 'dimension':
                this.drawDimension(entity, ctx);
                break;

            case 'block':
                // Draw block reference by expanding its entities
                this.drawBlockReference(entity, ctx);
                break;
            case 'insert':
                this.drawInsertEntity(entity, ctx);
                break;
            case 'hatch':
                // Hatch entities are rendered via drawHatchFill in drawEntityList
                break;
        }
    },

    drawBlockReference(blockRef, ctx) {
        // Get expanded entities from the block definition
        const expandedEntities = CAD.getBlockEntities(blockRef);

        if (expandedEntities.length === 0) {
            // Block not found or empty - draw a placeholder
            const ip = blockRef.insertPoint;
            const size = 10 / CAD.zoom;

            ctx.save();
            ctx.strokeStyle = '#ff0000'; // Red for missing block
            ctx.lineWidth = 1 / CAD.zoom;
            ctx.setLineDash([2 / CAD.zoom, 2 / CAD.zoom]);

            // Draw an X at the insertion point
            ctx.beginPath();
            ctx.moveTo(ip.x - size, ip.y - size);
            ctx.lineTo(ip.x + size, ip.y + size);
            ctx.moveTo(ip.x + size, ip.y - size);
            ctx.lineTo(ip.x - size, ip.y + size);
            ctx.stroke();

            // Draw block name
            ctx.font = `${12 / CAD.zoom}px Arial`;
            ctx.fillStyle = '#ff0000';
            ctx.fillText(`[${blockRef.blockName}]`, ip.x + size, ip.y - size);

            ctx.restore();
            return;
        }

        // Save current stroke style (for selection/hover highlighting)
        const currentStrokeStyle = ctx.strokeStyle;
        const currentLineWidth = ctx.lineWidth;
        const currentLineDash = ctx.getLineDash();

        // Draw each entity in the block
        expandedEntities.forEach(entity => {
            ctx.beginPath();
            // Use the block's selection color for all its entities
            ctx.strokeStyle = currentStrokeStyle;
            ctx.lineWidth = currentLineWidth;
            ctx.setLineDash(currentLineDash);
            this.drawEntity(entity, ctx);
            ctx.stroke();
        });
    },

    drawInsertEntity(insertRef, ctx, depth = 0) {
        if (depth > 10) {
            return;
        }

        const block = CAD.getBlock(insertRef.blockName);
        if (!block || !block.entities || block.entities.length === 0) {
            return;
        }

        const basePoint = block.basePoint || { x: 0, y: 0 };
        const scaleX = insertRef.scaleX ?? insertRef.scale?.x ?? 1;
        const scaleY = insertRef.scaleY ?? insertRef.scale?.y ?? 1;
        const rotation = insertRef.rotation || 0;
        const insertX = insertRef.insertPoint?.x ?? insertRef.x ?? 0;
        const insertY = insertRef.insertPoint?.y ?? insertRef.y ?? 0;

        ctx.save();
        ctx.translate(insertX, insertY);
        if (rotation) {
            ctx.rotate(rotation);
        }
        ctx.scale(scaleX, scaleY);
        ctx.translate(-basePoint.x, -basePoint.y);

        block.entities.forEach(entity => {
            if (!entity) return;
            ctx.beginPath();
            if (entity.type === 'insert') {
                this.drawInsertEntity(entity, ctx, depth + 1);
            } else {
                this.drawEntity(entity, ctx);
            }
            ctx.stroke();
        });

        ctx.restore();
    },

    drawHatchRenderLines(entity, color, zoom = CAD.zoom) {
        const ctx = this.ctx;
        const hatch = entity.renderLines && entity.renderLines.length
            ? entity.renderLines
            : this.ensureHatchRenderLines(entity);
        if (!hatch || hatch.length === 0) {
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / zoom;
        hatch.forEach(segment => {
            if (!segment || !segment.p1 || !segment.p2) return;
            ctx.moveTo(segment.p1.x, segment.p1.y);
            ctx.lineTo(segment.p2.x, segment.p2.y);
        });
        ctx.stroke();
        ctx.restore();
    },

    ensureHatchRenderLines(entity) {
        const boundary = entity.boundary || entity.points || [];
        const isEdgeBoundary = Array.isArray(boundary)
            && boundary.length > 0
            && (boundary[0].type || boundary[0].p1 || boundary[0].p2);
        if (entity.renderLines && entity.renderLines.length > 0 && !isEdgeBoundary) {
            return entity.renderLines;
        }

        if (typeof entity.generateRenderLines === 'function') {
            entity.renderLines = entity.generateRenderLines();
            return entity.renderLines;
        }
        if (typeof Geometry !== 'undefined' && Geometry.Hatch) {
            const pattern = entity.patternName || entity.pattern || entity.hatch?.pattern || 'ANSI31';
            const hatch = new Geometry.Hatch(boundary, pattern, entity.scale || 1, entity.angle || 0);
            entity.renderLines = hatch.generateRenderLines();
            return entity.renderLines;
        }
        return [];
    },

    drawDimension(entity, ctx) {
        // Use CAD settings for dimension appearance (DIMTXT, DIMASZ)
        const dimTextHeight = CAD.dimTextHeight || 2.5;
        const dimArrowSize = CAD.dimArrowSize || 2.5;
        const textHeight = dimTextHeight;
        const arrowSize = dimArrowSize;
        const extensionOffset = dimTextHeight * 0.5;
        const extensionGap = dimTextHeight * 0.2;

        ctx.save();
        ctx.font = `${textHeight}px Arial`;
        ctx.fillStyle = ctx.strokeStyle;

        if (entity.dimType === 'linear' || entity.dimType === 'aligned') {
            const p1 = entity.p1;
            const p2 = entity.p2;
            const dimPos = entity.dimLinePos;

            // Determine if horizontal or vertical
            const isHorizontal = Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y);

            let dimP1, dimP2;
            if (entity.dimType === 'aligned') {
                // Aligned dimension follows the points
                dimP1 = { ...p1 };
                dimP2 = { ...p2 };
            } else if (isHorizontal) {
                dimP1 = { x: p1.x, y: dimPos.y };
                dimP2 = { x: p2.x, y: dimPos.y };
            } else {
                dimP1 = { x: dimPos.x, y: p1.y };
                dimP2 = { x: dimPos.x, y: p2.y };
            }

            // Draw extension lines (with gap near the points)
            const ext1Dir = Math.sign(dimP1.y - p1.y) || 1;
            const ext2Dir = Math.sign(dimP2.y - p2.y) || 1;
            ctx.moveTo(p1.x, p1.y + extensionGap * ext1Dir);
            ctx.lineTo(dimP1.x, dimP1.y + extensionOffset * ext1Dir);
            ctx.moveTo(p2.x, p2.y + extensionGap * ext2Dir);
            ctx.lineTo(dimP2.x, dimP2.y + extensionOffset * ext2Dir);

            // Draw dimension line
            ctx.moveTo(dimP1.x, dimP1.y);
            ctx.lineTo(dimP2.x, dimP2.y);

            // Draw arrows
            const angle = Utils.angle(dimP1, dimP2);
            this.drawArrow(ctx, dimP1, angle, arrowSize);
            this.drawArrow(ctx, dimP2, angle + Math.PI, arrowSize);

            // Draw text (centered on dimension line)
            const midX = (dimP1.x + dimP2.x) / 2;
            const midY = (dimP1.y + dimP2.y) / 2;
            ctx.save();
            ctx.translate(midX, midY);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            // Offset text above the dimension line
            ctx.fillText(entity.text, 0, -textHeight * 0.3);
            ctx.restore();

        } else if (entity.dimType === 'radius' || entity.dimType === 'diameter') {
            const center = entity.center;
            const dimPos = entity.dimLinePos;
            const angle = Utils.angle(center, dimPos);

            // Line from center to edge (or through for diameter)
            const edgePoint = {
                x: center.x + entity.radius * Math.cos(angle),
                y: center.y + entity.radius * Math.sin(angle)
            };

            if (entity.dimType === 'diameter') {
                const oppositeEdge = {
                    x: center.x - entity.radius * Math.cos(angle),
                    y: center.y - entity.radius * Math.sin(angle)
                };
                ctx.moveTo(oppositeEdge.x, oppositeEdge.y);
                ctx.lineTo(edgePoint.x, edgePoint.y);
                this.drawArrow(ctx, oppositeEdge, angle, arrowSize);
            } else {
                ctx.moveTo(center.x, center.y);
                ctx.lineTo(edgePoint.x, edgePoint.y);
            }

            this.drawArrow(ctx, edgePoint, angle + Math.PI, arrowSize);

            // Draw text
            const textX = center.x + (entity.radius * 0.6) * Math.cos(angle);
            const textY = center.y + (entity.radius * 0.6) * Math.sin(angle);
            ctx.save();
            ctx.translate(textX, textY);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(entity.text, 0, -textHeight * 0.3);
            ctx.restore();

        } else if (entity.dimType === 'ordinate') {
            const fp = entity.featurePoint;
            const le = entity.leaderEnd;

            // Draw leader line (two segments: feature to bend, bend to endpoint)
            if (entity.isXDatum) {
                // X ordinate: horizontal then vertical leader
                const bend = { x: le.x, y: fp.y };
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(bend.x, bend.y);
                ctx.lineTo(le.x, le.y);
            } else {
                // Y ordinate: vertical then horizontal leader
                const bend = { x: fp.x, y: le.y };
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(bend.x, bend.y);
                ctx.lineTo(le.x, le.y);
            }

            // Draw text at leader endpoint
            ctx.save();
            ctx.translate(le.x, le.y);
            ctx.textAlign = entity.isXDatum ? 'center' : 'left';
            ctx.textBaseline = 'bottom';
            const textOffset = textHeight * 0.5;
            if (entity.isXDatum) {
                ctx.fillText(entity.text, 0, -textOffset);
            } else {
                ctx.fillText(entity.text, textOffset, textHeight * 0.3);
            }
            ctx.restore();

        } else if (entity.dimType === 'arclength') {
            // Draw arc length dimension
            const center = entity.center;
            const r = entity.radius;
            const start = entity.startAngle;
            const end = entity.endAngle;
            let sweep = end - start;
            if (sweep < 0) sweep += 2 * Math.PI;

            // Draw offset arc
            const offsetR = r + 15 / CAD.zoom;
            ctx.arc(center.x, center.y, offsetR, start, start + sweep);

            // Draw radial ticks at start/end
            const tickLen = 5 / CAD.zoom;
            const startPt = { x: center.x + r * Math.cos(start), y: center.y + r * Math.sin(start) };
            const startOut = { x: center.x + (offsetR + tickLen) * Math.cos(start), y: center.y + (offsetR + tickLen) * Math.sin(start) };
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(startOut.x, startOut.y);

            const endA = start + sweep;
            const endPt = { x: center.x + r * Math.cos(endA), y: center.y + r * Math.sin(endA) };
            const endOut = { x: center.x + (offsetR + tickLen) * Math.cos(endA), y: center.y + (offsetR + tickLen) * Math.sin(endA) };
            ctx.moveTo(endPt.x, endPt.y);
            ctx.lineTo(endOut.x, endOut.y);

            // Draw text at midpoint
            const midAngle = start + sweep / 2;
            const textPt = {
                x: center.x + (offsetR + textHeight) * Math.cos(midAngle),
                y: center.y + (offsetR + textHeight) * Math.sin(midAngle)
            };
            ctx.save();
            ctx.translate(textPt.x, textPt.y);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.text, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    },

    drawArrow(ctx, point, angle, size) {
        const x = point.x;
        const y = point.y;
        const a1 = angle + Math.PI - 0.3;
        const a2 = angle + Math.PI + 0.3;

        ctx.moveTo(x, y);
        ctx.lineTo(x + size * Math.cos(a1), y + size * Math.sin(a1));
        ctx.moveTo(x, y);
        ctx.lineTo(x + size * Math.cos(a2), y + size * Math.sin(a2));
    },

    drawWipeoutEntity(entity, color, isSelected, isHovered) {
        const ctx = this.ctx;
        const state = CAD;

        ctx.save();

        // Draw filled background polygon (masks entities behind it)
        ctx.beginPath();
        if (entity.points && entity.points.length > 0) {
            ctx.moveTo(entity.points[0].x, entity.points[0].y);
            for (let i = 1; i < entity.points.length; i++) {
                ctx.lineTo(entity.points[i].x, entity.points[i].y);
            }
            ctx.closePath();
        }
        ctx.fillStyle = this.colors.background;
        ctx.fill();

        // Draw border if selected or hovered
        if (isSelected || isHovered) {
            ctx.strokeStyle = isSelected ? this.colors.selection : this.colors.hover;
            ctx.lineWidth = (isSelected ? 2 : 1.5) / state.zoom;
            ctx.setLineDash(isSelected ? [5 / state.zoom, 3 / state.zoom] : [3 / state.zoom, 3 / state.zoom]);
            ctx.stroke();
        }

        ctx.restore();
    },

    // ==========================================
    // PREVIEW DRAWING
    // ==========================================

    drawPreview() {
        const ctx = this.ctx;
        const state = CAD;

        if (!state.activeCmd) return;
        if (state.activeCmd !== 'imageattach' && state.points.length === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = this.colors.preview;
        ctx.lineWidth = 1 / state.zoom;
        ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);

        const lastPoint = state.points.length ? state.points[state.points.length - 1] : null;
        let endPoint = state.tempEnd || state.cursor;

        // Apply ortho if enabled
        if (state.orthoEnabled && state.points.length > 0) {
            endPoint = Utils.applyOrtho(lastPoint, endPoint);
        }

        switch (state.activeCmd) {
            case 'line':
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                break;

            case 'polyline':
                // Draw confirmed segments solid
                ctx.setLineDash([]);
                ctx.moveTo(state.points[0].x, state.points[0].y);
                for (let i = 1; i < state.points.length; i++) {
                    ctx.lineTo(state.points[i].x, state.points[i].y);
                }
                ctx.stroke();

                // Draw preview segment dashed
                ctx.beginPath();
                ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                break;

            case 'spline': {
                if (state.points.length === 1) {
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    break;
                }

                // Draw confirmed spline solid
                ctx.setLineDash([]);
                ctx.beginPath();
                this.drawSplineCurve(state.points, ctx);
                ctx.stroke();

                // Draw preview spline dashed with current cursor point
                ctx.beginPath();
                ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
                const previewPoints = [...state.points, endPoint];
                this.drawSplineCurve(previewPoints, ctx);
                break;
            }

            case 'circle':
                const radius = Utils.dist(state.points[0], endPoint);
                ctx.arc(state.points[0].x, state.points[0].y, radius, 0, Math.PI * 2);
                break;

            case 'arc':
                if (state.step === 1) {
                    // Show radius line from center
                    ctx.moveTo(state.points[0].x, state.points[0].y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                } else if (state.step === 2) {
                    // Show arc preview
                    const r = Utils.dist(state.points[0], state.points[1]);
                    const startAngle = Utils.angle(state.points[0], state.points[1]);
                    const endAngle = Utils.angle(state.points[0], endPoint);
                    ctx.arc(state.points[0].x, state.points[0].y, r, startAngle, endAngle);
                }
                break;

            case 'rect':
                ctx.rect(
                    state.points[0].x, state.points[0].y,
                    endPoint.x - state.points[0].x,
                    endPoint.y - state.points[0].y
                );
                break;

            case 'mview':
                ctx.rect(
                    state.points[0].x, state.points[0].y,
                    endPoint.x - state.points[0].x,
                    endPoint.y - state.points[0].y
                );
                break;

            case 'ellipse':
                if (state.step === 1) {
                    // Show major axis
                    ctx.moveTo(state.points[0].x, state.points[0].y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                } else if (state.step === 2) {
                    // Show ellipse preview
                    const center = Utils.midpoint(state.points[0], state.points[1]);
                    const rx = Utils.dist(state.points[0], state.points[1]) / 2;
                    const ry = Utils.dist(center, endPoint);
                    const rotation = Utils.angle(state.points[0], state.points[1]);

                    ctx.save();
                    ctx.translate(center.x, center.y);
                    ctx.rotate(rotation);
                    ctx.scale(rx, ry);
                    ctx.arc(0, 0, 1, 0, Math.PI * 2);
                    ctx.restore();
                }
                break;

            case 'move':
            case 'copy':
                if (state.points.length === 1) {
                    const delta = {
                        x: endPoint.x - state.points[0].x,
                        y: endPoint.y - state.points[0].y
                    };

                    state.getSelectedEntities().forEach(entity => {
                        const preview = Geometry.moveEntity(entity, delta);
                        this.drawEntity(preview, ctx);
                    });
                }
                break;

            case 'rotate':
                if (state.points.length === 1) {
                    const angle = Utils.angle(state.points[0], endPoint);

                    // Draw rotation reference line
                    ctx.moveTo(state.points[0].x, state.points[0].y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.stroke();

                    // Draw rotated entities preview
                    ctx.beginPath();
                    state.getSelectedEntities().forEach(entity => {
                        const preview = Geometry.rotateEntity(entity, state.points[0], angle);
                        this.drawEntity(preview, ctx);
                    });
                }
                break;

            case 'scale':
                if (state.points.length === 2) {
                    const baseDist = Utils.dist(state.points[0], state.points[1]);
                    const currentDist = Utils.dist(state.points[0], endPoint);
                    const scale = currentDist / baseDist;

                    state.getSelectedEntities().forEach(entity => {
                        const preview = Geometry.scaleEntity(entity, state.points[0], scale);
                        this.drawEntity(preview, ctx);
                    });
                }
                break;

            case 'mirror':
                if (state.points.length === 1) {
                    // Draw mirror line
                    ctx.moveTo(state.points[0].x, state.points[0].y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.stroke();

                    // Draw mirrored entities preview
                    ctx.beginPath();
                    state.getSelectedEntities().forEach(entity => {
                        const preview = Geometry.mirrorEntity(entity, state.points[0], endPoint);
                        this.drawEntity(preview, ctx);
                    });
                }
                break;

            case 'spline':
                // Draw confirmed spline curve solid
                if (state.points.length >= 2) {
                    ctx.setLineDash([]);
                    this.drawSplineCurve(state.points, ctx);
                    ctx.stroke();

                    // Draw preview extending to cursor - dashed
                    ctx.beginPath();
                    ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);
                    const allPts = [...state.points, endPoint];
                    // Draw just the last curve segment with the preview point
                    const previewPts = state.points.length >= 2
                        ? [state.points[state.points.length - 2], lastPoint, endPoint]
                        : [lastPoint, endPoint];
                    if (previewPts.length >= 3) {
                        const padded = [previewPts[0], ...previewPts, previewPts[previewPts.length - 1]];
                        const p0 = padded[padded.length - 4];
                        const p1 = padded[padded.length - 3];
                        const p2 = padded[padded.length - 2];
                        const p3 = padded[padded.length - 1];
                        ctx.moveTo(p1.x, p1.y);
                        const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
                        const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
                        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
                    } else {
                        ctx.moveTo(lastPoint.x, lastPoint.y);
                        ctx.lineTo(endPoint.x, endPoint.y);
                    }
                } else {
                    // Only one point - draw a line to cursor
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                }
                break;

            case 'imageattach':
                if (state.cmdOptions.imageInsert) {
                    const insert = state.cmdOptions.imageInsert;
                    if (state.step === 1) {
                        ctx.rect(
                            insert.x, insert.y,
                            endPoint.x - insert.x,
                            endPoint.y - insert.y
                        );
                    } else if (state.step === 2) {
                        const imageData = state.cmdOptions.imageData;
                        const scale = state.cmdOptions.imageScale || 1;
                        if (imageData) {
                            const width = imageData.width * scale;
                            const height = imageData.height * scale;
                            const angle = Utils.angle(insert, endPoint);
                            ctx.save();
                            ctx.translate(insert.x, insert.y);
                            ctx.rotate(angle);
                            ctx.rect(0, 0, width, height);
                            ctx.restore();
                        }
                    }
                }
                break;
        }

        ctx.stroke();
        ctx.setLineDash([]);
    },

    // ==========================================
    // SELECTION WINDOW
    // ==========================================

    drawGrips() {
        const ctx = this.ctx;
        const state = CAD;
        if (state.selectedIds.length === 0 || state.activeCmd) return;

        const zoom = state.zoom;
        const gripSize = 5 / zoom; // 5 pixels in screen space

        state.selectedIds.forEach(id => {
            const entity = state.getEntity(id);
            if (!entity) return;

            const grips = Geometry.getGripPoints(entity);
            grips.forEach((grip, i) => {
                const isActive = state.activeGrip &&
                    state.activeGrip.entityId === id &&
                    state.activeGrip.gripIndex === grip.index;
                const isHovered = state.hoveredGrip &&
                    state.hoveredGrip.entityId === id &&
                    state.hoveredGrip.gripIndex === grip.index;

                ctx.fillStyle = isActive ? '#ff3333' : (isHovered ? '#ff6666' : '#3399ff');
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1 / zoom;

                ctx.beginPath();
                ctx.rect(
                    grip.point.x - gripSize / 2,
                    grip.point.y - gripSize / 2,
                    gripSize,
                    gripSize
                );
                ctx.fill();
                ctx.stroke();
            });
        });
    },

    drawSelectionWindow() {
        const ctx = this.ctx;
        const state = CAD;

        if (!state.selectionMode || !state.selectStart) return;

        const start = state.selectStart;
        const end = state.tempEnd || state.cursor;

        if (!end) return;

        const w = end.x - start.x;
        const h = end.y - start.y;
        const isCrossing = w < 0;

        ctx.beginPath();
        ctx.fillStyle = isCrossing ? this.colors.crossWindow : this.colors.windowSelect;
        ctx.strokeStyle = isCrossing ? this.colors.crossWindowBorder : this.colors.windowSelectBorder;
        ctx.lineWidth = 1 / state.zoom;

        if (isCrossing) {
            ctx.setLineDash([5 / state.zoom, 3 / state.zoom]);
        }

        ctx.rect(start.x, start.y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
    },

    // ==========================================
    // CURSOR DRAWING
    // ==========================================

    drawCursor() {
        const ctx = this.ctx;
        const state = CAD;

        const screen = Utils.worldToScreen(state.cursor.x, state.cursor.y, state.pan, state.zoom);

        // Check if full-screen crosshair is enabled (CAD-like)
        const fullCrosshair = state.fullCrosshair || false;

        ctx.strokeStyle = this.colors.cursor;
        ctx.lineWidth = 1;

        ctx.beginPath();

        if (fullCrosshair) {
            // Full-screen crosshair (like CAD with CURSORSIZE = 100)
            ctx.moveTo(0, screen.y);
            ctx.lineTo(this.canvas.width, screen.y);
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, this.canvas.height);
        } else {
            // Small crosshair
            const size = state.crosshairSize || 15;
            ctx.moveTo(screen.x - size, screen.y);
            ctx.lineTo(screen.x + size, screen.y);
            ctx.moveTo(screen.x, screen.y - size);
            ctx.lineTo(screen.x, screen.y + size);
        }
        ctx.stroke();

        // Small box at center (pick aperture)
        ctx.strokeRect(screen.x - 3, screen.y - 3, 6, 6);
    },

    /**
     * Draw a larger touch target indicator on mobile devices.
     * Shows a prominent circle at cursor position during active drawing commands.
     */
    drawMobileTouchTarget() {
        // Only show on touch devices with an active drawing command
        if (!('ontouchstart' in window) || !CAD.activeCmd || CAD.points.length === 0) return;

        const ctx = this.ctx;
        const state = CAD;
        const end = state.tempEnd || state.cursor;
        if (!end) return;

        const screen = Utils.worldToScreen(end.x, end.y, state.pan, state.zoom);

        // Draw a larger, semi-transparent target circle
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 160, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = 'rgba(0, 160, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // ==========================================
    // SNAP INDICATOR
    // ==========================================

    drawSnapIndicator() {
        const ctx = this.ctx;
        const state = CAD;

        if (!(state.osnapEnabled || state.gridSnapEnabled) || !state.snapPoint) return;

        const screen = Utils.worldToScreen(state.snapPoint.x, state.snapPoint.y, state.pan, state.zoom);
        const size = 8;

        ctx.strokeStyle = this.colors.snap[state.snapType] || '#00ff00';
        ctx.lineWidth = 2;

        ctx.beginPath();

        switch (state.snapType) {
            case 'endpoint':
                // Square
                ctx.strokeRect(screen.x - size, screen.y - size, size * 2, size * 2);
                break;

            case 'midpoint':
                // Triangle
                ctx.moveTo(screen.x, screen.y - size);
                ctx.lineTo(screen.x + size, screen.y + size);
                ctx.lineTo(screen.x - size, screen.y + size);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'center':
                // Circle
                ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'intersection':
                // X
                ctx.moveTo(screen.x - size, screen.y - size);
                ctx.lineTo(screen.x + size, screen.y + size);
                ctx.moveTo(screen.x + size, screen.y - size);
                ctx.lineTo(screen.x - size, screen.y + size);
                ctx.stroke();
                break;

            case 'grid':
                // Plus sign
                ctx.moveTo(screen.x - size / 2, screen.y);
                ctx.lineTo(screen.x + size / 2, screen.y);
                ctx.moveTo(screen.x, screen.y - size / 2);
                ctx.lineTo(screen.x, screen.y + size / 2);
                ctx.stroke();
                break;

            case 'nearest':
                // Diamond
                ctx.moveTo(screen.x, screen.y - size);
                ctx.lineTo(screen.x + size, screen.y);
                ctx.lineTo(screen.x, screen.y + size);
                ctx.lineTo(screen.x - size, screen.y);
                ctx.closePath();
                ctx.stroke();
                break;

            case 'perpendicular':
                // Right angle symbol
                ctx.moveTo(screen.x - size, screen.y + size);
                ctx.lineTo(screen.x - size, screen.y - size);
                ctx.lineTo(screen.x + size, screen.y - size);
                ctx.stroke();
                break;

            case 'tangent':
                // Circle with horizontal tangent line
                ctx.arc(screen.x, screen.y, size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(screen.x - size, screen.y + size * 0.7);
                ctx.lineTo(screen.x + size, screen.y + size * 0.7);
                ctx.stroke();
                break;

            case 'quadrant':
                // Diamond rotated 45 degrees (AutoCAD standard quadrant indicator)
                ctx.moveTo(screen.x, screen.y - size);
                ctx.lineTo(screen.x + size, screen.y);
                ctx.lineTo(screen.x, screen.y + size);
                ctx.lineTo(screen.x - size, screen.y);
                ctx.closePath();
                ctx.stroke();
                // Small cross in center
                ctx.beginPath();
                ctx.moveTo(screen.x - size * 0.35, screen.y);
                ctx.lineTo(screen.x + size * 0.35, screen.y);
                ctx.moveTo(screen.x, screen.y - size * 0.35);
                ctx.lineTo(screen.x, screen.y + size * 0.35);
                ctx.stroke();
                break;

            case 'node':
                // Circle with cross (AutoCAD standard node/point indicator)
                ctx.arc(screen.x, screen.y, size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(screen.x - size, screen.y);
                ctx.lineTo(screen.x + size, screen.y);
                ctx.moveTo(screen.x, screen.y - size);
                ctx.lineTo(screen.x, screen.y + size);
                ctx.stroke();
                break;

            default:
                // Default: crosshair
                ctx.moveTo(screen.x - size, screen.y);
                ctx.lineTo(screen.x + size, screen.y);
                ctx.moveTo(screen.x, screen.y - size);
                ctx.lineTo(screen.x, screen.y + size);
                ctx.stroke();
        }
    },

    // ==========================================
    // TRACKING LINES
    // ==========================================

    drawTrackingLines() {
        const ctx = this.ctx;
        const state = CAD;

        // Don't draw tracking lines if no active command or no points
        if (!state.activeCmd || state.points.length === 0) return;

        const cursorWorld = state.cursorWorld;
        if (!cursorWorld) return;

        const lastPoint = state.points[state.points.length - 1];
        const cursorScreen = Utils.worldToScreen(cursorWorld.x, cursorWorld.y, state.pan, state.zoom);
        const lastScreen = Utils.worldToScreen(lastPoint.x, lastPoint.y, state.pan, state.zoom);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        // Polar tracking lines (if enabled)
        if (state.polarEnabled) {
            const polarAngle = state.polarAngle || 45;
            const angle = Utils.angleDeg(lastPoint, cursorWorld);
            const nearestPolar = Math.round(angle / polarAngle) * polarAngle;
            const tolerance = 5; // degrees

            // Check if cursor is near a polar angle
            if (Math.abs(Utils.normalizeAngle(angle) - Utils.normalizeAngle(nearestPolar)) < tolerance ||
                Math.abs(Utils.normalizeAngle(angle) - Utils.normalizeAngle(nearestPolar) + 360) % 360 < tolerance) {

                ctx.strokeStyle = '#00ffff';
                ctx.beginPath();

                // Draw line from last point through cursor, extending to canvas edges
                const radians = Utils.degToRad(nearestPolar);
                const extendDist = Math.max(this.canvas.width, this.canvas.height) * 2;

                const extPoint = Utils.polarPoint(lastPoint, radians, extendDist);
                const extScreen = Utils.worldToScreen(extPoint.x, extPoint.y, state.pan, state.zoom);

                ctx.moveTo(lastScreen.x, lastScreen.y);
                ctx.lineTo(extScreen.x, extScreen.y);
                ctx.stroke();

                // Draw angle label
                const midX = (lastScreen.x + cursorScreen.x) / 2;
                const midY = (lastScreen.y + cursorScreen.y) / 2 - 15;
                ctx.font = '11px Arial';
                ctx.fillStyle = '#00ffff';
                ctx.fillText(`${nearestPolar}°`, midX, midY);
            }
        }

        // Ortho tracking lines (if enabled)
        if (state.orthoEnabled && !state.polarEnabled) {
            const dx = Math.abs(cursorWorld.x - lastPoint.x);
            const dy = Math.abs(cursorWorld.y - lastPoint.y);

            ctx.strokeStyle = '#00ff00';
            ctx.beginPath();

            if (dx > dy) {
                // Horizontal constraint
                ctx.moveTo(0, lastScreen.y);
                ctx.lineTo(this.canvas.width, lastScreen.y);
            } else {
                // Vertical constraint
                ctx.moveTo(lastScreen.x, 0);
                ctx.lineTo(lastScreen.x, this.canvas.height);
            }
            ctx.stroke();
        }

        // Object Snap Tracking lines (if there's a snap point)
        if (state.osnapEnabled && state.snapPoint && state.snapType !== 'grid') {
            const snapScreen = Utils.worldToScreen(state.snapPoint.x, state.snapPoint.y, state.pan, state.zoom);

            ctx.strokeStyle = '#ffff00';

            // Draw horizontal tracking line from snap point
            const horizontalDist = Math.abs(cursorWorld.y - state.snapPoint.y);
            const horizontalTolerance = 5 / state.zoom;
            if (horizontalDist < horizontalTolerance) {
                ctx.beginPath();
                ctx.moveTo(snapScreen.x, snapScreen.y);
                ctx.lineTo(cursorScreen.x, snapScreen.y);
                ctx.stroke();
            }

            // Draw vertical tracking line from snap point
            const verticalDist = Math.abs(cursorWorld.x - state.snapPoint.x);
            const verticalTolerance = 5 / state.zoom;
            if (verticalDist < verticalTolerance) {
                ctx.beginPath();
                ctx.moveTo(snapScreen.x, snapScreen.y);
                ctx.lineTo(snapScreen.x, cursorScreen.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    },

    // ==========================================
    // UCS ICON
    // ==========================================

    drawDynamicInput() {
        const ctx = this.ctx;
        const state = CAD;
        const cursor = state.cursor;
        if (!cursor) return;

        const screen = Utils.worldToScreen(cursor.x, cursor.y, state.pan, state.zoom);
        const hasBasePoint = state.activeCmd && state.points && state.points.length > 0;
        const basePoint = hasBasePoint ? state.points[state.points.length - 1] : null;

        // Position: below and to the right of cursor
        const offsetX = 25;
        const offsetY = 25;
        const boxH = 20;
        const fontSize = 12;
        const padding = 6;

        ctx.save();
        ctx.font = `${fontSize}px "Consolas", "Courier New", monospace`;

        let text1, text2;
        if (basePoint) {
            // Show distance and angle from last point
            const dx = cursor.x - basePoint.x;
            const dy = cursor.y - basePoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(-dy, dx) * 180 / Math.PI; // Negate Y for CAD-convention
            text1 = dist.toFixed(4);
            text2 = (angle < 0 ? angle + 360 : angle).toFixed(2) + '\u00B0';
        } else {
            // Show absolute coordinates
            text1 = cursor.x.toFixed(4);
            text2 = cursor.y.toFixed(4);
        }

        const w1 = ctx.measureText(text1).width + padding * 2;
        const w2 = ctx.measureText(text2).width + padding * 2;
        const gap = 4;
        const totalW = w1 + gap + w2;

        const bx = screen.x + offsetX;
        const by = screen.y + offsetY;

        // Background boxes
        ctx.fillStyle = 'rgba(30, 30, 40, 0.85)';
        ctx.strokeStyle = '#5588cc';
        ctx.lineWidth = 1;

        // Box 1 (distance or X)
        this._roundRect(ctx, bx, by, w1, boxH, 3);
        ctx.fill();
        ctx.stroke();

        // Box 2 (angle or Y)
        this._roundRect(ctx, bx + w1 + gap, by, w2, boxH, 3);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ccddff';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(text1, bx + padding, by + boxH / 2);
        ctx.fillText(text2, bx + w1 + gap + padding, by + boxH / 2);

        // Labels
        if (basePoint) {
            ctx.fillStyle = '#8899aa';
            ctx.font = `9px "Consolas", monospace`;
            ctx.fillText('Dist', bx + 2, by - 3);
            ctx.fillText('Angle', bx + w1 + gap + 2, by - 3);
        } else {
            ctx.fillStyle = '#8899aa';
            ctx.font = `9px "Consolas", monospace`;
            ctx.fillText('X', bx + 2, by - 3);
            ctx.fillText('Y', bx + w1 + gap + 2, by - 3);
        }

        ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    drawUCSIcon() {
        const ctx = this.ctx;
        const x = 40;
        const y = this.canvas.height - 60;
        const len = 30;

        ctx.lineWidth = 2;

        // X axis (red)
        ctx.strokeStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x + len, y);
        ctx.lineTo(x + len - 5, y - 3);
        ctx.lineTo(x + len - 5, y + 3);
        ctx.closePath();
        ctx.fillStyle = '#ff4444';
        ctx.fill();

        // X label
        ctx.font = '10px Arial';
        ctx.fillText('X', x + len + 4, y + 3);

        // Y axis (green)
        ctx.strokeStyle = '#44ff44';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - len);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x, y - len);
        ctx.lineTo(x - 3, y - len + 5);
        ctx.lineTo(x + 3, y - len + 5);
        ctx.closePath();
        ctx.fillStyle = '#44ff44';
        ctx.fill();

        // Y label
        ctx.fillText('Y', x - 3, y - len - 4);

        // Origin circle
        ctx.strokeStyle = '#888888';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
    },

    // ==========================================
    // SPLINE CURVE RENDERING
    // ==========================================

    /**
     * Draw a smooth Catmull-Rom spline through the given points.
     * Converts Catmull-Rom segments to cubic Bezier for canvas rendering.
     */
    _drawWidePolyline(entity, ctx) {
        // Draw a polyline with constant width as a filled shape
        const points = entity.points;
        const w = entity.width / 2;
        if (points.length < 2 || w <= 0) return;

        // Build offset outlines (left and right)
        const leftPts = [];
        const rightPts = [];

        for (let i = 0; i < points.length; i++) {
            let nx, ny;
            if (i === 0) {
                const dx = points[1].x - points[0].x;
                const dy = points[1].y - points[0].y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                nx = -dy / len;
                ny = dx / len;
            } else if (i === points.length - 1) {
                const dx = points[i].x - points[i - 1].x;
                const dy = points[i].y - points[i - 1].y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                nx = -dy / len;
                ny = dx / len;
            } else {
                // Average normals of adjacent segments
                const dx1 = points[i].x - points[i - 1].x;
                const dy1 = points[i].y - points[i - 1].y;
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
                const dx2 = points[i + 1].x - points[i].x;
                const dy2 = points[i + 1].y - points[i].y;
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
                nx = (-dy1 / len1 + -dy2 / len2) / 2;
                ny = (dx1 / len1 + dx2 / len2) / 2;
                const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
                nx /= nlen;
                ny /= nlen;
            }
            leftPts.push({ x: points[i].x + nx * w, y: points[i].y + ny * w });
            rightPts.push({ x: points[i].x - nx * w, y: points[i].y - ny * w });
        }

        // Draw as filled polygon
        ctx.moveTo(leftPts[0].x, leftPts[0].y);
        for (let i = 1; i < leftPts.length; i++) {
            ctx.lineTo(leftPts[i].x, leftPts[i].y);
        }
        if (entity.closed) {
            ctx.lineTo(leftPts[0].x, leftPts[0].y);
            for (let i = rightPts.length - 1; i >= 0; i--) {
                ctx.lineTo(rightPts[i].x, rightPts[i].y);
            }
            ctx.closePath();
        } else {
            // Connect to right side and go back
            for (let i = rightPts.length - 1; i >= 0; i--) {
                ctx.lineTo(rightPts[i].x, rightPts[i].y);
            }
            ctx.closePath();
        }
    },

    drawSplineCurve(points, ctx) {
        if (points.length < 2) return;

        if (points.length === 2) {
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            return;
        }

        // Pad the control points array: duplicate first and last for open curves
        const pts = [points[0], ...points, points[points.length - 1]];

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < pts.length - 2; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2];

            // Convert Catmull-Rom to cubic Bezier control points
            const cp1 = {
                x: p1.x + (p2.x - p0.x) / 6,
                y: p1.y + (p2.y - p0.y) / 6
            };
            const cp2 = {
                x: p2.x - (p3.x - p1.x) / 6,
                y: p2.y - (p3.y - p1.y) / 6
            };

            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
        }
    },

    /**
     * Generate interpolated points along a Catmull-Rom spline.
     * Used for DXF export and hit testing.
     */
    getSplinePoints(controlPoints, segments) {
        if (controlPoints.length < 2) return [...controlPoints];

        const segsPerSpan = segments || 20;
        const result = [];
        const pts = [controlPoints[0], ...controlPoints, controlPoints[controlPoints.length - 1]];

        for (let i = 1; i < pts.length - 2; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2];

            const numSegs = (i === pts.length - 3) ? segsPerSpan : segsPerSpan;
            for (let j = 0; j <= (i === pts.length - 3 ? numSegs : numSegs - 1); j++) {
                const t = j / numSegs;
                const t2 = t * t;
                const t3 = t2 * t;

                const x = 0.5 * ((2 * p1.x) +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

                const y = 0.5 * ((2 * p1.y) +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

                result.push({ x, y });
            }
        }

        return result;
    },

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    getCanvasSize() {
        return {
            width: this.canvas ? this.canvas.width : 0,
            height: this.canvas ? this.canvas.height : 0
        };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
