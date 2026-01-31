/* ============================================
   BrowserCAD - Utilities Module
   ============================================ */

const Utils = {
    // ==========================================
    // MATH HELPERS
    // ==========================================

    // Distance between two points
    dist(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    },

    // Squared distance (faster for comparisons)
    distSq(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return dx * dx + dy * dy;
    },

    // Angle between two points (in radians)
    angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    },

    // Angle in degrees
    angleDeg(p1, p2) {
        return this.angle(p1, p2) * (180 / Math.PI);
    },

    // Normalize angle to 0-360 degrees
    normalizeAngle(deg) {
        while (deg < 0) deg += 360;
        while (deg >= 360) deg -= 360;
        return deg;
    },

    // Degrees to radians
    degToRad(deg) {
        return deg * (Math.PI / 180);
    },

    // Radians to degrees
    radToDeg(rad) {
        return rad * (180 / Math.PI);
    },

    // Midpoint between two points
    midpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    },

    // Lerp between two points
    lerp(p1, p2, t) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    },

    // Point from polar coordinates
    polarPoint(center, angle, distance) {
        return {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance
        };
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Round to specified precision
    round(value, precision = 4) {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    },

    // Snap value to grid
    snapToGrid(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    },

    // Snap point to grid
    snapPointToGrid(point, gridSize) {
        return {
            x: this.snapToGrid(point.x, gridSize),
            y: this.snapToGrid(point.y, gridSize)
        };
    },

    // ==========================================
    // POINT/LINE DISTANCE CALCULATIONS
    // ==========================================

    // Distance from point to line segment
    distToSegment(p, v, w) {
        const l2 = this.distSq(v, w);
        if (l2 === 0) return this.dist(p, v);

        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = this.clamp(t, 0, 1);

        return this.dist(p, {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        });
    },

    // Closest point on line segment to point
    closestPointOnSegment(p, v, w) {
        const l2 = this.distSq(v, w);
        if (l2 === 0) return { ...v };

        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = this.clamp(t, 0, 1);

        return {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        };
    },

    // Distance from point to infinite line
    distToLine(p, lineP1, lineP2) {
        const num = Math.abs(
            (lineP2.y - lineP1.y) * p.x -
            (lineP2.x - lineP1.x) * p.y +
            lineP2.x * lineP1.y -
            lineP2.y * lineP1.x
        );
        const den = this.dist(lineP1, lineP2);
        return den === 0 ? this.dist(p, lineP1) : num / den;
    },

    // Perpendicular point on line from point
    perpendicularPoint(p, lineP1, lineP2) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const t = ((p.x - lineP1.x) * dx + (p.y - lineP1.y) * dy) / (dx * dx + dy * dy);

        return {
            x: lineP1.x + t * dx,
            y: lineP1.y + t * dy
        };
    },

    // Distance from point to rectangle (outline)
    distToRect(p, p1, p2) {
        const corners = [
            p1,
            { x: p2.x, y: p1.y },
            p2,
            { x: p1.x, y: p2.y }
        ];

        let minDist = Infinity;
        for (let i = 0; i < 4; i++) {
            const d = this.distToSegment(p, corners[i], corners[(i + 1) % 4]);
            if (d < minDist) minDist = d;
        }
        return minDist;
    },

    // Check if point is inside rectangle
    pointInRect(p, p1, p2) {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
    },

    // ==========================================
    // COORDINATE TRANSFORMATIONS
    // ==========================================

    // Screen to world coordinates
    screenToWorld(sx, sy, pan, zoom) {
        return {
            x: (sx - pan.x) / zoom,
            y: (sy - pan.y) / zoom
        };
    },

    // World to screen coordinates
    worldToScreen(wx, wy, pan, zoom) {
        return {
            x: wx * zoom + pan.x,
            y: wy * zoom + pan.y
        };
    },

    // Rotate point around center
    rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = point.x - center.x;
        const dy = point.y - center.y;

        return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos
        };
    },

    // Scale point from center
    scalePoint(point, center, scale) {
        return {
            x: center.x + (point.x - center.x) * scale,
            y: center.y + (point.y - center.y) * scale
        };
    },

    // Mirror point across line
    mirrorPoint(point, lineP1, lineP2) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
        const b = 2 * dx * dy / (dx * dx + dy * dy);

        const x2 = a * (point.x - lineP1.x) + b * (point.y - lineP1.y) + lineP1.x;
        const y2 = b * (point.x - lineP1.x) - a * (point.y - lineP1.y) + lineP1.y;

        return { x: x2, y: y2 };
    },

    // ==========================================
    // VECTOR OPERATIONS
    // ==========================================

    // Vector from p1 to p2
    vector(p1, p2) {
        return {
            x: p2.x - p1.x,
            y: p2.y - p1.y
        };
    },

    // Vector length
    vectorLength(v) {
        return Math.hypot(v.x, v.y);
    },

    // Normalize vector
    normalize(v) {
        const len = this.vectorLength(v);
        if (len === 0) return { x: 0, y: 0 };
        return {
            x: v.x / len,
            y: v.y / len
        };
    },

    // Dot product
    dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    },

    // Cross product (2D - returns scalar)
    cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    },

    // Perpendicular vector (rotate 90 degrees CCW)
    perpendicular(v) {
        return { x: -v.y, y: v.x };
    },

    // Add vectors
    addVectors(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    },

    // Subtract vectors
    subVectors(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    },

    // Scale vector
    scaleVector(v, s) {
        return { x: v.x * s, y: v.y * s };
    },

    // ==========================================
    // POLYGON HELPERS
    // ==========================================

    // Check if polygon is closed
    isPolygonClosed(points, tolerance = 0.001) {
        if (points.length < 3) return false;
        const first = points[0];
        const last = points[points.length - 1];
        return this.dist(first, last) < tolerance;
    },

    // Polygon area (signed - positive for CCW)
    polygonArea(points) {
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area / 2;
    },

    // Polygon centroid
    polygonCentroid(points) {
        let cx = 0, cy = 0;
        const n = points.length;
        const area = this.polygonArea(points);

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const factor = points[i].x * points[j].y - points[j].x * points[i].y;
            cx += (points[i].x + points[j].x) * factor;
            cy += (points[i].y + points[j].y) * factor;
        }

        const f = 1 / (6 * area);
        return { x: cx * f, y: cy * f };
    },

    // Point in polygon test (ray casting)
    pointInPolygon(point, polygon) {
        let inside = false;
        const n = polygon.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            if (((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    },

    // Point in ellipse test (supports rotation)
    pointInEllipse(point, ellipse) {
        const rotation = ellipse.rotation || 0;
        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const dx = point.x - ellipse.center.x;
        const dy = point.y - ellipse.center.y;
        const rx = ellipse.rx || 0;
        const ry = ellipse.ry || 0;
        if (rx === 0 || ry === 0) return false;

        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        const norm = (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry);
        return norm <= 1;
    },

    // ==========================================
    // FORMATTING HELPERS
    // ==========================================

    // Format coordinate for display
    formatCoord(value, precision = 4) {
        return value.toFixed(precision);
    },

    // Format point for display
    formatPoint(point, precision = 4) {
        return `${this.formatCoord(point.x, precision)}, ${this.formatCoord(point.y, precision)}`;
    },

    // Format distance for display
    formatDistance(distance, precision = 4) {
        return distance.toFixed(precision);
    },

    // Format angle for display (in degrees)
    formatAngle(radians, precision = 2) {
        return (radians * 180 / Math.PI).toFixed(precision) + '°';
    },

    // Parse coordinate input (supports formats like "100,200" or "100 200" or "@50<45")
    parseCoordInput(input, currentPoint = null) {
        input = input.trim();

        // Relative polar: @distance<angle
        if (input.startsWith('@') && input.includes('<')) {
            if (!currentPoint) return null;
            const parts = input.substring(1).split('<');
            const distance = parseFloat(parts[0]);
            const angle = parseFloat(parts[1]) * Math.PI / 180;
            if (isNaN(distance) || isNaN(angle)) return null;

            return {
                x: currentPoint.x + distance * Math.cos(angle),
                y: currentPoint.y + distance * Math.sin(angle)
            };
        }

        // Relative cartesian: @dx,dy
        if (input.startsWith('@')) {
            if (!currentPoint) return null;
            const coords = input.substring(1).split(/[,\s]+/);
            if (coords.length < 2) return null;

            const dx = parseFloat(coords[0]);
            const dy = parseFloat(coords[1]);
            if (isNaN(dx) || isNaN(dy)) return null;

            return {
                x: currentPoint.x + dx,
                y: currentPoint.y + dy
            };
        }

        // Absolute: x,y
        const coords = input.split(/[,\s]+/);
        if (coords.length < 2) return null;

        const x = parseFloat(coords[0]);
        const y = parseFloat(coords[1]);
        if (isNaN(x) || isNaN(y)) return null;

        return { x, y };
    },

    // ==========================================
    // COLOR HELPERS
    // ==========================================

    // Hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    // RGB to Hex
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    // Hex to integer (for DXF)
    hexToInt(hex) {
        return parseInt(hex.replace('#', ''), 16);
    },

    // ==========================================
    // ARRAY HELPERS
    // ==========================================

    // Remove duplicates from array of points
    uniquePoints(points, tolerance = 0.001) {
        const result = [];
        points.forEach(p => {
            if (!result.find(e => this.dist(e, p) < tolerance)) {
                result.push(p);
            }
        });
        return result;
    },

    // ==========================================
    // APPLY ORTHO MODE
    // ==========================================

    applyOrtho(start, end) {
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);

        if (dx > dy) {
            return { x: end.x, y: start.y };
        } else {
            return { x: start.x, y: end.y };
        }
    },

    // Apply polar tracking
    applyPolar(start, end, polarAngle = 45) {
        const angle = this.angleDeg(start, end);
        const dist = this.dist(start, end);

        // Find nearest polar angle
        const nearestAngle = Math.round(angle / polarAngle) * polarAngle;
        const radians = this.degToRad(nearestAngle);

        return {
            x: start.x + dist * Math.cos(radians),
            y: start.y + dist * Math.sin(radians)
        };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
