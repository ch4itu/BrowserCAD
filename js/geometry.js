/* ============================================
   BrowserCAD - Geometry Engine Module
   ============================================ */

const Geometry = {
    // ==========================================
    // LINE-LINE INTERSECTION
    // ==========================================

    // Line-line intersection (infinite lines)
    lineLineIntersection(p1, p2, p3, p4) {
        const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (Math.abs(d) < 1e-10) return null; // Parallel or coincident

        const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;

        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    },

    // Segment-segment intersection (bounded)
    segmentSegmentIntersection(p1, p2, p3, p4) {
        const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (Math.abs(d) < 1e-10) return null;

        const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
        const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y)
            };
        }
        return null;
    },

    // ==========================================
    // LINE-CIRCLE INTERSECTION
    // ==========================================

    lineCircleIntersection(lineP1, lineP2, center, radius) {
        const d = Utils.vector(lineP1, lineP2);
        const f = Utils.vector(center, lineP1);

        const a = Utils.dot(d, d);
        const b = 2 * Utils.dot(f, d);
        const c = Utils.dot(f, f) - radius * radius;

        let discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return [];

        const points = [];
        discriminant = Math.sqrt(discriminant);

        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        if (t1 >= 0 && t1 <= 1) {
            points.push({
                x: lineP1.x + t1 * d.x,
                y: lineP1.y + t1 * d.y
            });
        }

        if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
            points.push({
                x: lineP1.x + t2 * d.x,
                y: lineP1.y + t2 * d.y
            });
        }

        return points;
    },

    // ==========================================
    // CIRCLE-CIRCLE INTERSECTION
    // ==========================================

    circleCircleIntersection(c1, r1, c2, r2) {
        const d = Utils.dist(c1, c2);

        // No intersection cases
        if (d > r1 + r2) return []; // Too far apart
        if (d < Math.abs(r1 - r2)) return []; // One inside the other
        if (d === 0 && r1 === r2) return []; // Coincident

        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const h = Math.sqrt(r1 * r1 - a * a);

        const px = c1.x + a * (c2.x - c1.x) / d;
        const py = c1.y + a * (c2.y - c1.y) / d;

        return [
            {
                x: px + h * (c2.y - c1.y) / d,
                y: py - h * (c2.x - c1.x) / d
            },
            {
                x: px - h * (c2.y - c1.y) / d,
                y: py + h * (c2.x - c1.x) / d
            }
        ];
    },

    // ==========================================
    // GET ENTITY SEGMENTS
    // ==========================================

    getEntitySegments(entity) {
        switch (entity.type) {
            case 'line':
                return [{ type: 'line', p1: entity.p1, p2: entity.p2 }];

            case 'polyline':
                const segments = [];
                for (let i = 0; i < entity.points.length - 1; i++) {
                    segments.push({
                        type: 'line',
                        p1: entity.points[i],
                        p2: entity.points[i + 1]
                    });
                }
                return segments;

            case 'rect':
                const p1 = entity.p1, p2 = entity.p2;
                return [
                    { type: 'line', p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p1.y } },
                    { type: 'line', p1: { x: p2.x, y: p1.y }, p2: { x: p2.x, y: p2.y } },
                    { type: 'line', p1: { x: p2.x, y: p2.y }, p2: { x: p1.x, y: p2.y } },
                    { type: 'line', p1: { x: p1.x, y: p2.y }, p2: { x: p1.x, y: p1.y } }
                ];

            case 'circle':
                return [{ type: 'circle', center: entity.center, r: entity.r }];

            case 'arc':
                return [{ type: 'arc', center: entity.center, r: entity.r, start: entity.start, end: entity.end }];

            case 'ellipse':
                return [{ type: 'ellipse', center: entity.center, rx: entity.rx, ry: entity.ry, rotation: entity.rotation || 0 }];

            default:
                return [];
        }
    },

    // ==========================================
    // FIND INTERSECTIONS BETWEEN TWO ENTITIES
    // ==========================================

    findIntersections(entity1, entity2) {
        const segs1 = this.getEntitySegments(entity1);
        const segs2 = this.getEntitySegments(entity2);
        const intersections = [];

        segs1.forEach(s1 => {
            segs2.forEach(s2 => {
                const pts = this.segmentIntersection(s1, s2);
                intersections.push(...pts);
            });
        });

        return Utils.uniquePoints(intersections);
    },

    segmentIntersection(s1, s2) {
        // Line-Line
        if (s1.type === 'line' && s2.type === 'line') {
            const pt = this.segmentSegmentIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
            return pt ? [pt] : [];
        }

        // Line-Circle
        if (s1.type === 'line' && s2.type === 'circle') {
            return this.lineCircleIntersection(s1.p1, s1.p2, s2.center, s2.r);
        }
        if (s1.type === 'circle' && s2.type === 'line') {
            return this.lineCircleIntersection(s2.p1, s2.p2, s1.center, s1.r);
        }

        // Circle-Circle
        if (s1.type === 'circle' && s2.type === 'circle') {
            return this.circleCircleIntersection(s1.center, s1.r, s2.center, s2.r);
        }

        // Line-Arc (simplified - treat arc as circle for now)
        if (s1.type === 'line' && s2.type === 'arc') {
            const pts = this.lineCircleIntersection(s1.p1, s1.p2, s2.center, s2.r);
            return pts.filter(p => this.isPointOnArc(p, s2));
        }
        if (s1.type === 'arc' && s2.type === 'line') {
            const pts = this.lineCircleIntersection(s2.p1, s2.p2, s1.center, s1.r);
            return pts.filter(p => this.isPointOnArc(p, s1));
        }

        return [];
    },

    isPointOnArc(point, arc) {
        const angle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
        let start = arc.start;
        let end = arc.end;

        // Normalize angles
        while (start < 0) start += Math.PI * 2;
        while (end < 0) end += Math.PI * 2;
        let a = angle;
        while (a < 0) a += Math.PI * 2;

        if (start <= end) {
            return a >= start && a <= end;
        } else {
            return a >= start || a <= end;
        }
    },

    // ==========================================
    // OFFSET OPERATIONS
    // ==========================================

    offsetLine(p1, p2, distance, side) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return null;

        const nx = -dy / len;
        const ny = dx / len;
        const d = distance * side;

        return {
            p1: { x: p1.x + nx * d, y: p1.y + ny * d },
            p2: { x: p2.x + nx * d, y: p2.y + ny * d }
        };
    },

    getOffsetSide(lineP1, lineP2, clickPoint) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const nx = -dy;
        const ny = dx;

        const vx = clickPoint.x - lineP1.x;
        const vy = clickPoint.y - lineP1.y;

        return (vx * nx + vy * ny) > 0 ? 1 : -1;
    },

    offsetCircle(center, radius, distance, clickPoint) {
        const currentDist = Utils.dist(center, clickPoint);
        const newRadius = currentDist > radius ? radius + distance : radius - distance;

        if (newRadius <= 0) return null;

        return {
            center: { ...center },
            r: newRadius
        };
    },

    offsetRect(p1, p2, distance, clickPoint) {
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        const isInside = clickPoint.x > minX && clickPoint.x < maxX &&
                         clickPoint.y > minY && clickPoint.y < maxY;
        const sign = isInside ? -1 : 1;

        const nMinX = minX - distance * sign;
        const nMaxX = maxX + distance * sign;
        const nMinY = minY - distance * sign;
        const nMaxY = maxY + distance * sign;

        if (nMaxX <= nMinX || nMaxY <= nMinY) return null;

        return {
            p1: { x: nMinX, y: nMinY },
            p2: { x: nMaxX, y: nMaxY }
        };
    },

    offsetPolyline(entity, distance, clickPoint) {
        if (entity.points.length < 2) return null;

        // Find closest segment to determine offset side
        let closestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < entity.points.length - 1; i++) {
            const d = Utils.distToSegment(clickPoint, entity.points[i], entity.points[i + 1]);
            if (d < minDist) {
                minDist = d;
                closestIdx = i;
            }
        }

        const side = this.getOffsetSide(entity.points[closestIdx], entity.points[closestIdx + 1], clickPoint);

        // Offset all segments
        const offsetLines = [];
        for (let i = 0; i < entity.points.length - 1; i++) {
            const offset = this.offsetLine(entity.points[i], entity.points[i + 1], distance, side);
            if (offset) offsetLines.push(offset);
        }

        if (offsetLines.length === 0) return null;

        // OFFSETGAPTYPE: 0=Extend (default), 1=Fillet, 2=Chamfer
        const gapType = (typeof CAD !== 'undefined' && CAD.offsetGapType) || 0;

        // Find intersection points between adjacent offset lines
        const newPoints = [];
        const isClosed = Utils.isPolygonClosed(entity.points);

        // Helper to handle corner between two offset lines
        const handleCorner = (line1, line2, originalCorner) => {
            const inter = this.lineLineIntersection(line1.p1, line1.p2, line2.p1, line2.p2);

            // Handle based on OFFSETGAPTYPE - check this FIRST for all corners
            switch (gapType) {
                case 1: // Fillet (arc) - always use arc at corners
                    // Create fillet arc from the offset endpoints around the original corner
                    const arcPoints = this.createFilletArc(line1.p2, line2.p1, originalCorner, distance);
                    return arcPoints.length > 0 ? arcPoints : (inter ? [inter] : [line1.p2, line2.p1]);

                case 2: // Chamfer (straight line) - connect endpoints with line
                    // Return both endpoints to create a chamfer line
                    return [line1.p2, line2.p1];

                default: // 0 = Extend (sharp corners)
                    // Find intersection and extend to it (original CAD behavior)
                    if (inter) {
                        const onLine1 = this.pointOnLineExtended(inter, line1.p1, line1.p2);
                        const onLine2 = this.pointOnLineExtended(inter, line2.p1, line2.p2);
                        if (onLine1 && onLine2) {
                            return [inter];
                        }
                    }
                    // Fallback: extend to intersection if possible
                    return inter ? [inter] : [line1.p2];
            }
        };

        if (isClosed) {
            const gapPoints = handleCorner(
                offsetLines[offsetLines.length - 1],
                offsetLines[0],
                entity.points[0]
            );
            newPoints.push(...gapPoints);
        } else {
            newPoints.push(offsetLines[0].p1);
        }

        for (let i = 0; i < offsetLines.length - 1; i++) {
            const gapPoints = handleCorner(
                offsetLines[i],
                offsetLines[i + 1],
                entity.points[i + 1]
            );
            newPoints.push(...gapPoints);
        }

        if (isClosed) {
            newPoints.push(newPoints[0]);
        } else {
            newPoints.push(offsetLines[offsetLines.length - 1].p2);
        }

        return { points: newPoints };
    },

    // Helper to create fillet arc points for offset gaps
    createFilletArc(p1, p2, center, radius) {
        const points = [];
        const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
        const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

        // Determine arc direction
        let startAngle = angle1;
        let endAngle = angle2;
        let deltaAngle = endAngle - startAngle;

        // Normalize to shortest arc
        while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        // Generate arc points
        const numSegments = Math.max(3, Math.ceil(Math.abs(deltaAngle) / (Math.PI / 8)));
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const angle = startAngle + t * deltaAngle;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        }

        return points;
    },

    // Helper to check if point is on extended line
    pointOnLineExtended(point, lineP1, lineP2) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return false;

        // Project point onto line
        const t = ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / (len * len);

        // Check if projection is reasonably close
        const projX = lineP1.x + t * dx;
        const projY = lineP1.y + t * dy;
        const dist = Math.hypot(point.x - projX, point.y - projY);

        return dist < 0.001;
    },

    // ==========================================
    // TRIM OPERATIONS
    // ==========================================

    trimLine(entity, clickPoint, allEntities) {
        // Find all intersection points
        let cuts = [];

        allEntities.forEach(other => {
            if (other.id === entity.id) return;
            const pts = this.findIntersections(entity, other);
            cuts.push(...pts);
        });

        if (cuts.length === 0) return null;

        // Add line endpoints
        cuts.push(entity.p1, entity.p2);

        // Sort by distance from p1
        cuts.sort((a, b) => Utils.dist(entity.p1, a) - Utils.dist(entity.p1, b));

        // Remove duplicates
        cuts = Utils.uniquePoints(cuts);

        // Find which segment was clicked
        let clickedIdx = -1;
        let minDist = Infinity;

        for (let i = 0; i < cuts.length - 1; i++) {
            const mid = Utils.midpoint(cuts[i], cuts[i + 1]);
            const d = Utils.dist(clickPoint, mid);
            if (d < minDist) {
                minDist = d;
                clickedIdx = i;
            }
        }

        // Build new segments (excluding clicked one)
        const newEntities = [];
        for (let i = 0; i < cuts.length - 1; i++) {
            if (i === clickedIdx) continue;
            if (Utils.dist(cuts[i], cuts[i + 1]) < 0.001) continue;

            newEntities.push({
                type: 'line',
                p1: { ...cuts[i] },
                p2: { ...cuts[i + 1] }
            });
        }

        return newEntities;
    },

    trimCircle(entity, clickPoint, allEntities) {
        // Find all intersection points
        let cuts = [];

        allEntities.forEach(other => {
            if (other.id === entity.id) return;
            const pts = this.findIntersections(entity, other);
            cuts.push(...pts);
        });

        if (cuts.length < 2) return null;

        // Convert to angles
        const angles = cuts.map(p => ({
            point: p,
            angle: Math.atan2(p.y - entity.center.y, p.x - entity.center.x)
        }));

        // Sort by angle
        angles.sort((a, b) => a.angle - b.angle);

        // Find clicked angle
        const clickAngle = Math.atan2(clickPoint.y - entity.center.y, clickPoint.x - entity.center.x);

        // Find which arc segment was clicked
        let clickedIdx = -1;
        for (let i = 0; i < angles.length; i++) {
            const start = angles[i].angle;
            const end = angles[(i + 1) % angles.length].angle;

            let inArc = false;
            if (start <= end) {
                inArc = clickAngle >= start && clickAngle <= end;
            } else {
                inArc = clickAngle >= start || clickAngle <= end;
            }

            if (inArc) {
                clickedIdx = i;
                break;
            }
        }

        if (clickedIdx === -1) return null;

        // Create arcs for remaining segments
        const newEntities = [];
        for (let i = 0; i < angles.length; i++) {
            if (i === clickedIdx) continue;

            newEntities.push({
                type: 'arc',
                center: { ...entity.center },
                r: entity.r,
                start: angles[i].angle,
                end: angles[(i + 1) % angles.length].angle
            });
        }

        return newEntities;
    },

    // ==========================================
    // HIT TESTING
    // ==========================================

    hitTest(point, entity, tolerance) {
        switch (entity.type) {
            case 'line':
                return Utils.distToSegment(point, entity.p1, entity.p2) < tolerance;

            case 'circle':
                return Math.abs(Utils.dist(point, entity.center) - entity.r) < tolerance;

            case 'arc':
                const dist = Math.abs(Utils.dist(point, entity.center) - entity.r);
                if (dist >= tolerance) return false;
                return this.isPointOnArc(point, entity);

            case 'rect':
                return Utils.distToRect(point, entity.p1, entity.p2) < tolerance;

            case 'polyline':
                for (let i = 0; i < entity.points.length - 1; i++) {
                    if (Utils.distToSegment(point, entity.points[i], entity.points[i + 1]) < tolerance) {
                        return true;
                    }
                }
                return false;

            case 'leader':
                if (entity.points) {
                    for (let i = 0; i < entity.points.length - 1; i++) {
                        if (Utils.distToSegment(point, entity.points[i], entity.points[i + 1]) < tolerance) {
                            return true;
                        }
                    }
                }
                if (entity.text) {
                    const height = entity.height || 10;
                    const textWidth = entity.text.length * height * 0.6;
                    const pos = entity.textPosition || entity.points[entity.points.length - 1];
                    return point.x >= pos.x &&
                           point.x <= pos.x + textWidth &&
                           point.y >= pos.y - height &&
                           point.y <= pos.y;
                }
                return false;

            case 'ellipse':
                // Simplified ellipse hit test
                const dx = (point.x - entity.center.x) / entity.rx;
                const dy = (point.y - entity.center.y) / entity.ry;
                const ellipseDist = Math.sqrt(dx * dx + dy * dy);
                return Math.abs(ellipseDist - 1) < tolerance / Math.min(entity.rx, entity.ry);

            case 'text':
                // Simple bounding box test for text
                const textWidth = entity.text.length * entity.height * 0.6;
                return point.x >= entity.position.x &&
                       point.x <= entity.position.x + textWidth &&
                       point.y >= entity.position.y - entity.height &&
                       point.y <= entity.position.y;

            case 'image': {
                const width = entity.width ?? Math.abs(entity.p2.x - entity.p1.x);
                const height = entity.height ?? Math.abs(entity.p2.y - entity.p1.y);
                const rotation = Utils.degToRad(entity.rotation || 0);
                const cos = Math.cos(-rotation);
                const sin = Math.sin(-rotation);
                const dx = point.x - entity.p1.x;
                const dy = point.y - entity.p1.y;
                const localX = dx * cos - dy * sin;
                const localY = dx * sin + dy * cos;
                return localX >= -tolerance &&
                       localX <= width + tolerance &&
                       localY >= -tolerance &&
                       localY <= height + tolerance;
            }

            case 'donut':
                // Hit test for donut - check if point is between inner and outer radius
                const donutDist = Utils.dist(point, entity.center);
                return donutDist >= entity.innerRadius - tolerance &&
                       donutDist <= entity.outerRadius + tolerance;

            case 'wipeout':
                // Hit test for wipeout - check boundary edges
                if (entity.points) {
                    for (let i = 0; i < entity.points.length - 1; i++) {
                        if (Utils.distToSegment(point, entity.points[i], entity.points[i + 1]) < tolerance) {
                            return true;
                        }
                    }
                    // Also check if point is inside the polygon
                    return Utils.pointInPolygon(point, entity.points);
                }
                return false;

            case 'dimension':
                // Hit test for dimension - check dimension line
                if (entity.dimType === 'linear' || entity.dimType === 'aligned') {
                    return Utils.distToSegment(point, entity.p1, entity.p2) < tolerance * 2;
                } else if (entity.dimType === 'radius' || entity.dimType === 'diameter') {
                    return Utils.dist(point, entity.center) < entity.radius + tolerance;
                } else if (entity.dimType === 'ordinate') {
                    return Utils.distToSegment(point, entity.featurePoint, entity.leaderEnd) < tolerance * 2;
                } else if (entity.dimType === 'arclength') {
                    const dist = Math.abs(Utils.dist(point, entity.center) - entity.radius);
                    return dist < tolerance * 2;
                }
                return false;

            case 'region':
                // Region is a closed polyline - test boundary and interior
                if (entity.points) {
                    for (let i = 0; i < entity.points.length - 1; i++) {
                        if (Utils.distToSegment(point, entity.points[i], entity.points[i + 1]) < tolerance) {
                            return true;
                        }
                    }
                    return Utils.pointInPolygon(point, entity.points);
                }
                return false;

            case 'hatch': {
                // Hit test for hatch - check if point is inside the boundary polygon
                const hatchBoundary = entity.boundary || entity.points || [];
                const hatchPoints = Hatch.getBoundaryPoints(hatchBoundary);
                if (hatchPoints && hatchPoints.length >= 3) {
                    // Check boundary edges first
                    for (let i = 0; i < hatchPoints.length; i++) {
                        const a = hatchPoints[i];
                        const b = hatchPoints[(i + 1) % hatchPoints.length];
                        if (Utils.distToSegment(point, a, b) < tolerance) {
                            return true;
                        }
                    }
                    // Check if inside the filled area
                    return Utils.pointInPolygon(point, hatchPoints);
                }
                return false;
            }

            case 'point':
                return Utils.dist(point, entity.position) < tolerance;

            case 'block':
                // Hit test for block reference - check expanded entities
                const expandedEntities = CAD.getBlockEntities(entity);
                for (const expanded of expandedEntities) {
                    if (this.hitTest(point, expanded, tolerance)) {
                        return true;
                    }
                }
                // Also check insertion point
                return Utils.dist(point, entity.insertPoint) < tolerance;

            default:
                return false;
        }
    },

    // ==========================================
    // SNAP POINT DETECTION
    // ==========================================

    findSnapPoints(point, entities, snapModes, tolerance, gridSize, fromPoint = null) {
        const snaps = [];
        const snapFromPoint = fromPoint || (CAD.points && CAD.points.length > 0
            ? CAD.points[CAD.points.length - 1]
            : null);

        // Grid snap
        if (snapModes.grid) {
            const gridPoint = Utils.snapPointToGrid(point, gridSize);
            snaps.push({
                point: gridPoint,
                type: 'grid',
                distance: Utils.dist(point, gridPoint)
            });
        }

        entities.forEach(entity => {
            // Endpoint snap
            if (snapModes.endpoint) {
                const endpoints = this.getEndpoints(entity);
                endpoints.forEach(ep => {
                    const d = Utils.dist(point, ep);
                    if (d < tolerance) {
                        snaps.push({ point: ep, type: 'endpoint', distance: d });
                    }
                });
            }

            // Midpoint snap
            if (snapModes.midpoint) {
                const midpoints = this.getMidpoints(entity);
                midpoints.forEach(mp => {
                    const d = Utils.dist(point, mp);
                    if (d < tolerance) {
                        snaps.push({ point: mp, type: 'midpoint', distance: d });
                    }
                });
            }

            // Center snap
            if (snapModes.center) {
                const centers = this.getCenters(entity);
                centers.forEach(cp => {
                    const d = Utils.dist(point, cp);
                    if (d < tolerance) {
                        snaps.push({ point: cp, type: 'center', distance: d });
                    }
                });
            }

            // Nearest snap
            if (snapModes.nearest) {
                const nearest = this.getNearestPoint(point, entity);
                if (nearest) {
                    const d = Utils.dist(point, nearest);
                    if (d < tolerance) {
                        snaps.push({ point: nearest, type: 'nearest', distance: d });
                    }
                }
            }

            // Perpendicular snap - requires a "from point" in the current drawing operation
            if (snapModes.perpendicular && snapFromPoint) {
                // Check if cursor is near the entity first (like nearest snap)
                const nearestPt = this.getNearestPoint(point, entity);
                if (nearestPt) {
                    const distToEntity = Utils.dist(point, nearestPt);
                    if (distToEntity < tolerance) {
                        // Cursor is near entity — calculate perpendicular foot from fromPoint
                        const perpPoint = this.getPerpendicularPoint(snapFromPoint, entity);
                        if (perpPoint) {
                            const distToPerp = Utils.dist(point, perpPoint);
                            if (distToPerp < tolerance * 2) {
                                snaps.push({ point: perpPoint, type: 'perpendicular', distance: distToPerp });
                            }
                        }
                    }
                }
            }

            // Tangent snap - requires a "from point"
            if (snapModes.tangent && snapFromPoint) {
                const nearestPt = this.getNearestPoint(point, entity);
                if (nearestPt) {
                    const distToEntity = Utils.dist(point, nearestPt);
                    if (distToEntity < tolerance) {
                        const tangentPt = this.getTangentPoint(snapFromPoint, entity);
                        if (tangentPt) {
                            const distToTangent = Utils.dist(point, tangentPt);
                            if (distToTangent < tolerance * 2) {
                                snaps.push({ point: tangentPt, type: 'tangent', distance: distToTangent });
                            }
                        }
                    }
                }
            }

            // Quadrant snap - 0, 90, 180, 270 degree points on circles, arcs, ellipses
            if (snapModes.quadrant) {
                const quadrants = this.getQuadrantPoints(entity);
                quadrants.forEach(qp => {
                    const d = Utils.dist(point, qp);
                    if (d < tolerance) {
                        snaps.push({ point: qp, type: 'quadrant', distance: d });
                    }
                });
            }

            // Node snap - snaps to point entities
            if (snapModes.node) {
                if (entity.type === 'point' && entity.position) {
                    const d = Utils.dist(point, entity.position);
                    if (d < tolerance) {
                        snaps.push({ point: entity.position, type: 'node', distance: d });
                    }
                }
            }

            // Extension snap - extends lines/arcs beyond endpoints
            if (snapModes.extension) {
                const extPt = this._getExtensionPoint(point, entity, tolerance);
                if (extPt) {
                    const d = Utils.dist(point, extPt);
                    snaps.push({ point: extPt, type: 'extension', distance: d });
                }
            }
        });

        // Intersection snap
        if (snapModes.intersection) {
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const intersections = this.findIntersections(entities[i], entities[j]);
                    intersections.forEach(ip => {
                        const d = Utils.dist(point, ip);
                        if (d < tolerance) {
                            snaps.push({ point: ip, type: 'intersection', distance: d });
                        }
                    });
                }
            }
        }

        // Apparent Intersection snap - intersections of extended entities
        if (snapModes.appint) {
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const appInts = this._findApparentIntersections(entities[i], entities[j]);
                    appInts.forEach(ip => {
                        const d = Utils.dist(point, ip);
                        if (d < tolerance) {
                            snaps.push({ point: ip, type: 'appint', distance: d });
                        }
                    });
                }
            }
        }

        // Sort by priority then distance and return best snap
        const priority = {
            intersection: 0,
            endpoint: 1,
            midpoint: 2,
            center: 3,
            quadrant: 4,
            node: 5,
            perpendicular: 6,
            tangent: 7,
            extension: 8,
            appint: 9,
            nearest: 10,
            grid: 11
        };

        snaps.sort((a, b) => {
            const pa = priority[a.type] ?? 99;
            const pb = priority[b.type] ?? 99;
            if (pa !== pb) return pa - pb;
            return a.distance - b.distance;
        });
        return snaps.length > 0 ? snaps[0] : null;
    },

    _getExtensionPoint(point, entity, tolerance) {
        // Extend lines and arcs beyond their endpoints
        if (entity.type === 'line') {
            const dx = entity.p2.x - entity.p1.x;
            const dy = entity.p2.y - entity.p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-10) return null;
            // Project point onto the infinite line
            const t = ((point.x - entity.p1.x) * dx + (point.y - entity.p1.y) * dy) / (len * len);
            // Only snap to extension (beyond endpoints, not between them)
            if (t >= 0 && t <= 1) return null;
            const proj = { x: entity.p1.x + t * dx, y: entity.p1.y + t * dy };
            const d = Utils.dist(point, proj);
            if (d < tolerance) return proj;
        }
        if (entity.type === 'arc') {
            // Extend arc beyond its start/end angles
            const d = Utils.dist(point, entity.center);
            if (Math.abs(d - entity.r) > tolerance) return null;
            const angle = Math.atan2(point.y - entity.center.y, point.x - entity.center.x);
            // Check if angle is OUTSIDE the arc range
            let s = entity.start, e = entity.end;
            // Normalize
            const inArc = this._angleInArc(angle, s, e);
            if (inArc) return null; // Already on the arc, not an extension
            return {
                x: entity.center.x + entity.r * Math.cos(angle),
                y: entity.center.y + entity.r * Math.sin(angle)
            };
        }
        return null;
    },

    _angleInArc(angle, start, end) {
        // Normalize angles to [0, 2PI)
        const PI2 = Math.PI * 2;
        let a = ((angle % PI2) + PI2) % PI2;
        let s = ((start % PI2) + PI2) % PI2;
        let e = ((end % PI2) + PI2) % PI2;
        if (s <= e) return a >= s && a <= e;
        return a >= s || a <= e; // Wraps around
    },

    _findApparentIntersections(ent1, ent2) {
        // Find intersections of entities extended as infinite lines/circles
        const results = [];
        if (ent1.type === 'line' && ent2.type === 'line') {
            const ip = this.lineLineIntersection(ent1.p1, ent1.p2, ent2.p1, ent2.p2);
            if (ip) {
                // Check that it's NOT already a real intersection (at least one entity needs extending)
                const t1 = this._paramOnSegment(ip, ent1.p1, ent1.p2);
                const t2 = this._paramOnSegment(ip, ent2.p1, ent2.p2);
                if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) {
                    results.push(ip);
                }
            }
        }
        return results;
    },

    _paramOnSegment(point, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-10) return 0;
        return ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / len2;
    },

    getEndpoints(entity) {
        switch (entity.type) {
            case 'line':
                return [entity.p1, entity.p2];
            case 'polyline':
                return [...entity.points];
            case 'rect':
                return [
                    entity.p1,
                    { x: entity.p2.x, y: entity.p1.y },
                    entity.p2,
                    { x: entity.p1.x, y: entity.p2.y }
                ];
            case 'arc':
                return [
                    Utils.polarPoint(entity.center, entity.start, entity.r),
                    Utils.polarPoint(entity.center, entity.end, entity.r)
                ];
            case 'block':
                // Get endpoints from all entities in the block
                const endpoints = [entity.insertPoint]; // Include insertion point
                const expandedEntities = CAD.getBlockEntities(entity);
                expandedEntities.forEach(expanded => {
                    const eps = this.getEndpoints(expanded);
                    endpoints.push(...eps);
                });
                return endpoints;
            default:
                return [];
        }
    },

    getMidpoints(entity) {
        switch (entity.type) {
            case 'line':
                return [Utils.midpoint(entity.p1, entity.p2)];
            case 'polyline':
                const mids = [];
                for (let i = 0; i < entity.points.length - 1; i++) {
                    mids.push(Utils.midpoint(entity.points[i], entity.points[i + 1]));
                }
                return mids;
            case 'rect':
                return [
                    Utils.midpoint(entity.p1, { x: entity.p2.x, y: entity.p1.y }),
                    Utils.midpoint({ x: entity.p2.x, y: entity.p1.y }, entity.p2),
                    Utils.midpoint(entity.p2, { x: entity.p1.x, y: entity.p2.y }),
                    Utils.midpoint({ x: entity.p1.x, y: entity.p2.y }, entity.p1)
                ];
            case 'block':
                // Get midpoints from all entities in the block
                const blockMids = [];
                const expandedEntities = CAD.getBlockEntities(entity);
                expandedEntities.forEach(expanded => {
                    const mps = this.getMidpoints(expanded);
                    blockMids.push(...mps);
                });
                return blockMids;
            default:
                return [];
        }
    },

    getCenters(entity) {
        switch (entity.type) {
            case 'circle':
            case 'arc':
            case 'ellipse':
            case 'donut':
                return [entity.center];
            case 'rect':
                return [Utils.midpoint(entity.p1, entity.p2)];
            case 'block':
                // Get centers from all entities in the block, plus the insertion point
                const centers = [entity.insertPoint];
                const expandedEntities = CAD.getBlockEntities(entity);
                expandedEntities.forEach(expanded => {
                    const ctrs = this.getCenters(expanded);
                    centers.push(...ctrs);
                });
                return centers;
            default:
                return [];
        }
    },

    getQuadrantPoints(entity) {
        const quadrantAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        switch (entity.type) {
            case 'circle':
            case 'donut': {
                const cx = entity.center.x;
                const cy = entity.center.y;
                const r = entity.r;
                return [
                    { x: cx + r, y: cy },     // 0 degrees (right)
                    { x: cx, y: cy + r },      // 90 degrees (down in canvas / up in math)
                    { x: cx - r, y: cy },      // 180 degrees (left)
                    { x: cx, y: cy - r }       // 270 degrees (up in canvas / down in math)
                ];
            }
            case 'arc': {
                const cx = entity.center.x;
                const cy = entity.center.y;
                const r = entity.r;
                const points = [];
                quadrantAngles.forEach(angle => {
                    if (this.isAngleOnArc(angle, entity)) {
                        points.push(Utils.polarPoint(entity.center, angle, r));
                    }
                });
                return points;
            }
            case 'ellipse': {
                const cx = entity.center.x;
                const cy = entity.center.y;
                const rx = entity.rx || 0;
                const ry = entity.ry || 0;
                const rotation = entity.rotation || 0;
                // Quadrant points on an unrotated ellipse, then rotate
                const unrotated = [
                    { x: rx, y: 0 },      // 0 degrees
                    { x: 0, y: ry },       // 90 degrees
                    { x: -rx, y: 0 },      // 180 degrees
                    { x: 0, y: -ry }       // 270 degrees
                ];
                const cosR = Math.cos(rotation);
                const sinR = Math.sin(rotation);
                return unrotated.map(p => ({
                    x: cx + p.x * cosR - p.y * sinR,
                    y: cy + p.x * sinR + p.y * cosR
                }));
            }
            default:
                return [];
        }
    },

    // ==========================================
    // GRIP POINTS - Control points for each entity type
    // ==========================================

    getGripPoints(entity) {
        switch (entity.type) {
            case 'line':
                return [
                    { point: { ...entity.p1 }, type: 'endpoint', index: 0 },
                    { point: Utils.midpoint(entity.p1, entity.p2), type: 'midpoint', index: 1 },
                    { point: { ...entity.p2 }, type: 'endpoint', index: 2 }
                ];
            case 'circle':
            case 'donut':
                return [
                    { point: { ...entity.center }, type: 'center', index: 0 },
                    { point: { x: entity.center.x + (entity.r || entity.outerRadius), y: entity.center.y }, type: 'quadrant', index: 1 },
                    { point: { x: entity.center.x, y: entity.center.y + (entity.r || entity.outerRadius) }, type: 'quadrant', index: 2 },
                    { point: { x: entity.center.x - (entity.r || entity.outerRadius), y: entity.center.y }, type: 'quadrant', index: 3 },
                    { point: { x: entity.center.x, y: entity.center.y - (entity.r || entity.outerRadius) }, type: 'quadrant', index: 4 }
                ];
            case 'arc': {
                const startPt = Utils.polarPoint(entity.center, entity.start, entity.r);
                const endPt = Utils.polarPoint(entity.center, entity.end, entity.r);
                const midAngle = (entity.start + entity.end) / 2;
                // Handle wrap-around for arc midpoint
                let mid = midAngle;
                if (entity.end < entity.start) mid = midAngle + Math.PI;
                const midPt = Utils.polarPoint(entity.center, mid, entity.r);
                return [
                    { point: { ...entity.center }, type: 'center', index: 0 },
                    { point: startPt, type: 'endpoint', index: 1 },
                    { point: midPt, type: 'midpoint', index: 2 },
                    { point: endPt, type: 'endpoint', index: 3 }
                ];
            }
            case 'rect':
                return [
                    { point: { ...entity.p1 }, type: 'corner', index: 0 },
                    { point: { x: (entity.p1.x + entity.p2.x) / 2, y: entity.p1.y }, type: 'midpoint', index: 1 },
                    { point: { x: entity.p2.x, y: entity.p1.y }, type: 'corner', index: 2 },
                    { point: { x: entity.p2.x, y: (entity.p1.y + entity.p2.y) / 2 }, type: 'midpoint', index: 3 },
                    { point: { ...entity.p2 }, type: 'corner', index: 4 },
                    { point: { x: (entity.p1.x + entity.p2.x) / 2, y: entity.p2.y }, type: 'midpoint', index: 5 },
                    { point: { x: entity.p1.x, y: entity.p2.y }, type: 'corner', index: 6 },
                    { point: { x: entity.p1.x, y: (entity.p1.y + entity.p2.y) / 2 }, type: 'midpoint', index: 7 }
                ];
            case 'polyline': {
                const grips = [];
                let idx = 0;
                for (let i = 0; i < entity.points.length; i++) {
                    grips.push({ point: { ...entity.points[i] }, type: 'vertex', index: idx++ });
                    if (i < entity.points.length - 1) {
                        grips.push({ point: Utils.midpoint(entity.points[i], entity.points[i + 1]), type: 'midpoint', index: idx++ });
                    }
                }
                // Midpoint between last and first if closed
                if (entity.closed && entity.points.length > 2) {
                    grips.push({ point: Utils.midpoint(entity.points[entity.points.length - 1], entity.points[0]), type: 'midpoint', index: idx++ });
                }
                return grips;
            }
            case 'ellipse':
                return [
                    { point: { ...entity.center }, type: 'center', index: 0 },
                    { point: Utils.polarPoint(entity.center, entity.rotation || 0, entity.rx), type: 'axis', index: 1 },
                    { point: Utils.polarPoint(entity.center, (entity.rotation || 0) + Math.PI / 2, entity.ry), type: 'axis', index: 2 },
                    { point: Utils.polarPoint(entity.center, (entity.rotation || 0) + Math.PI, entity.rx), type: 'axis', index: 3 },
                    { point: Utils.polarPoint(entity.center, (entity.rotation || 0) + 3 * Math.PI / 2, entity.ry), type: 'axis', index: 4 }
                ];
            case 'text':
                return [
                    { point: { ...entity.position }, type: 'insertion', index: 0 }
                ];
            case 'point':
                return [
                    { point: { ...entity.position }, type: 'position', index: 0 }
                ];
            case 'block':
                return [
                    { point: { ...(entity.insertPoint || entity.p) }, type: 'insertion', index: 0 }
                ];
            case 'dimension': {
                const dgrips = [];
                if (entity.p1) dgrips.push({ point: { ...entity.p1 }, type: 'defpoint', index: 0 });
                if (entity.p2) dgrips.push({ point: { ...entity.p2 }, type: 'defpoint', index: 1 });
                if (entity.dimLinePos) dgrips.push({ point: { ...entity.dimLinePos }, type: 'dimline', index: 2 });
                if (entity.center) dgrips.push({ point: { ...entity.center }, type: 'center', index: 0 });
                return dgrips;
            }
            case 'spline': {
                const sgrips = [];
                const pts = entity.controlPoints || entity.fitPoints || entity.points || [];
                pts.forEach((p, i) => {
                    sgrips.push({ point: { ...p }, type: 'controlpoint', index: i });
                });
                return sgrips;
            }
            case 'leader': {
                const lgrips = [];
                (entity.points || []).forEach((p, i) => {
                    lgrips.push({ point: { ...p }, type: 'vertex', index: i });
                });
                return lgrips;
            }
            default:
                return [];
        }
    },

    moveGrip(entity, gripIndex, newPoint) {
        // Returns updated entity properties based on which grip was moved
        switch (entity.type) {
            case 'line':
                if (gripIndex === 0) return { p1: { ...newPoint } };
                if (gripIndex === 1) {
                    // Midpoint drag: move entire line
                    const oldMid = Utils.midpoint(entity.p1, entity.p2);
                    const dx = newPoint.x - oldMid.x;
                    const dy = newPoint.y - oldMid.y;
                    return {
                        p1: { x: entity.p1.x + dx, y: entity.p1.y + dy },
                        p2: { x: entity.p2.x + dx, y: entity.p2.y + dy }
                    };
                }
                if (gripIndex === 2) return { p2: { ...newPoint } };
                break;
            case 'circle': {
                if (gripIndex === 0) return { center: { ...newPoint } };
                // Quadrant grips change radius
                const newR = Utils.dist(entity.center, newPoint);
                return { r: newR };
            }
            case 'donut': {
                if (gripIndex === 0) return { center: { ...newPoint } };
                const newOuterR = Utils.dist(entity.center, newPoint);
                const ratio = entity.innerRadius / entity.outerRadius;
                return { outerRadius: newOuterR, innerRadius: newOuterR * ratio, r: newOuterR };
            }
            case 'arc': {
                if (gripIndex === 0) return { center: { ...newPoint } };
                if (gripIndex === 1) {
                    // Start point: change start angle and radius
                    return {
                        start: Utils.angle(entity.center, newPoint),
                        r: Utils.dist(entity.center, newPoint)
                    };
                }
                if (gripIndex === 2) {
                    // Midpoint: change radius only
                    return { r: Utils.dist(entity.center, newPoint) };
                }
                if (gripIndex === 3) {
                    return {
                        end: Utils.angle(entity.center, newPoint),
                        r: Utils.dist(entity.center, newPoint)
                    };
                }
                break;
            }
            case 'rect': {
                // Corner grips (0,2,4,6) modify corners; midpoint grips (1,3,5,7) move edges
                switch (gripIndex) {
                    case 0: return { p1: { ...newPoint } };
                    case 1: return { p1: { x: entity.p1.x, y: newPoint.y }, p2: { ...entity.p2 } };
                    case 2: return { p1: { x: entity.p1.x, y: newPoint.y }, p2: { x: newPoint.x, y: entity.p2.y } };
                    case 3: return { p1: { ...entity.p1 }, p2: { x: newPoint.x, y: entity.p2.y } };
                    case 4: return { p2: { ...newPoint } };
                    case 5: return { p1: { ...entity.p1 }, p2: { x: entity.p2.x, y: newPoint.y } };
                    case 6: return { p1: { x: newPoint.x, y: entity.p1.y }, p2: { x: entity.p2.x, y: newPoint.y } };
                    case 7: return { p1: { x: newPoint.x, y: entity.p1.y } };
                }
                break;
            }
            case 'polyline': {
                const points = [...entity.points.map(p => ({ ...p }))];
                // Vertex grips have even indices (0, 2, 4...), midpoint grips have odd (1, 3, 5...)
                // But our grip list alternates: vertex, mid, vertex, mid...
                // Count through to find which type this is
                let vertexIdx = 0;
                let midIdx = 0;
                let countIdx = 0;
                const numPts = entity.points.length;
                const numMids = entity.closed ? numPts : numPts - 1;
                for (let i = 0; i < numPts; i++) {
                    if (countIdx === gripIndex) {
                        // Vertex grip
                        points[i] = { ...newPoint };
                        return { points };
                    }
                    countIdx++;
                    if (i < numPts - 1 || entity.closed) {
                        if (countIdx === gripIndex) {
                            // Midpoint grip: move both adjacent vertices equally
                            const nextI = (i + 1) % numPts;
                            const oldMid = Utils.midpoint(entity.points[i], entity.points[nextI]);
                            const dx = newPoint.x - oldMid.x;
                            const dy = newPoint.y - oldMid.y;
                            points[i] = { x: entity.points[i].x + dx, y: entity.points[i].y + dy };
                            points[nextI] = { x: entity.points[nextI].x + dx, y: entity.points[nextI].y + dy };
                            return { points };
                        }
                        countIdx++;
                    }
                }
                break;
            }
            case 'ellipse': {
                if (gripIndex === 0) return { center: { ...newPoint } };
                if (gripIndex === 1 || gripIndex === 3) {
                    return { rx: Utils.dist(entity.center, newPoint) };
                }
                if (gripIndex === 2 || gripIndex === 4) {
                    return { ry: Utils.dist(entity.center, newPoint) };
                }
                break;
            }
            case 'text':
                return { position: { ...newPoint } };
            case 'point':
                return { position: { ...newPoint } };
            case 'block':
                return { insertPoint: { ...newPoint } };
            case 'dimension': {
                if (gripIndex === 0 && entity.p1) return { p1: { ...newPoint } };
                if (gripIndex === 1 && entity.p2) return { p2: { ...newPoint } };
                if (gripIndex === 2 && entity.dimLinePos) return { dimLinePos: { ...newPoint } };
                if (entity.center) return { center: { ...newPoint } };
                break;
            }
            case 'spline': {
                const pts = entity.controlPoints ? 'controlPoints' : (entity.fitPoints ? 'fitPoints' : 'points');
                const arr = [...(entity[pts] || []).map(p => ({ ...p }))];
                if (gripIndex >= 0 && gripIndex < arr.length) {
                    arr[gripIndex] = { ...newPoint };
                    return { [pts]: arr };
                }
                break;
            }
            case 'leader': {
                const pts = [...(entity.points || []).map(p => ({ ...p }))];
                if (gripIndex >= 0 && gripIndex < pts.length) {
                    pts[gripIndex] = { ...newPoint };
                    return { points: pts };
                }
                break;
            }
        }
        return null;
    },

    getNearestPoint(point, entity) {
        switch (entity.type) {
            case 'line':
                return Utils.closestPointOnSegment(point, entity.p1, entity.p2);
            case 'circle':
                const angle = Math.atan2(point.y - entity.center.y, point.x - entity.center.x);
                return Utils.polarPoint(entity.center, angle, entity.r);
            case 'polyline': {
                let minDist = Infinity;
                let nearest = null;
                for (let i = 0; i < entity.points.length - 1; i++) {
                    const p = Utils.closestPointOnSegment(point, entity.points[i], entity.points[i + 1]);
                    const d = Utils.dist(point, p);
                    if (d < minDist) {
                        minDist = d;
                        nearest = p;
                    }
                }
                return nearest;
            }
            case 'arc': {
                const arcAngle = Math.atan2(point.y - entity.center.y, point.x - entity.center.x);
                if (this.isAngleOnArc(arcAngle, entity)) {
                    return Utils.polarPoint(entity.center, arcAngle, entity.r);
                }
                // If not on arc, return nearest arc endpoint
                const ep1 = Utils.polarPoint(entity.center, entity.start, entity.r);
                const ep2 = Utils.polarPoint(entity.center, entity.end, entity.r);
                return Utils.dist(point, ep1) < Utils.dist(point, ep2) ? ep1 : ep2;
            }
            case 'rect': {
                const corners = [
                    entity.p1,
                    { x: entity.p2.x, y: entity.p1.y },
                    entity.p2,
                    { x: entity.p1.x, y: entity.p2.y }
                ];
                let minDistR = Infinity;
                let nearestR = null;
                for (let i = 0; i < 4; i++) {
                    const p = Utils.closestPointOnSegment(point, corners[i], corners[(i + 1) % 4]);
                    const d = Utils.dist(point, p);
                    if (d < minDistR) {
                        minDistR = d;
                        nearestR = p;
                    }
                }
                return nearestR;
            }
            case 'ellipse': {
                // Approximate nearest point on ellipse
                const ea = Math.atan2(point.y - entity.center.y, point.x - entity.center.x);
                return {
                    x: entity.center.x + (entity.rx || entity.r) * Math.cos(ea),
                    y: entity.center.y + (entity.ry || entity.r) * Math.sin(ea)
                };
            }
            default:
                return null;
        }
    },

    // Get perpendicular point from a point to an entity
    getPerpendicularPoint(fromPoint, entity) {
        switch (entity.type) {
            case 'line':
                return this.perpendicularToLine(fromPoint, entity.p1, entity.p2);
            case 'polyline':
                // Find perpendicular to closest segment
                let minDist = Infinity;
                let perpPoint = null;
                for (let i = 0; i < entity.points.length - 1; i++) {
                    const pp = this.perpendicularToLine(fromPoint, entity.points[i], entity.points[i + 1]);
                    if (pp) {
                        const d = Utils.dist(fromPoint, pp);
                        if (d < minDist) {
                            minDist = d;
                            perpPoint = pp;
                        }
                    }
                }
                return perpPoint;
            case 'circle':
                // Perpendicular to circle is from center through the from point
                const angle = Math.atan2(fromPoint.y - entity.center.y, fromPoint.x - entity.center.x);
                return Utils.polarPoint(entity.center, angle, entity.r);
            case 'arc': {
                // Perpendicular to arc is from center through the from point, if on arc
                const arcAngle = Math.atan2(fromPoint.y - entity.center.y, fromPoint.x - entity.center.x);
                if (this.isAngleOnArc(arcAngle, entity)) {
                    return Utils.polarPoint(entity.center, arcAngle, entity.r);
                }
                return null;
            }
            case 'rect': {
                // Treat rect as 4 line segments
                const corners = [
                    entity.p1,
                    { x: entity.p2.x, y: entity.p1.y },
                    entity.p2,
                    { x: entity.p1.x, y: entity.p2.y }
                ];
                let minDist2 = Infinity;
                let perpPoint2 = null;
                for (let i = 0; i < 4; i++) {
                    const pp = this.perpendicularToLine(fromPoint, corners[i], corners[(i + 1) % 4]);
                    if (pp) {
                        const d = Utils.dist(fromPoint, pp);
                        if (d < minDist2) {
                            minDist2 = d;
                            perpPoint2 = pp;
                        }
                    }
                }
                return perpPoint2;
            }
            default:
                return null;
        }
    },

    // Get tangent point from an external point to a circle/arc entity
    getTangentPoint(fromPoint, entity) {
        if (entity.type !== 'circle' && entity.type !== 'arc') return null;

        const cx = entity.center.x;
        const cy = entity.center.y;
        const r = entity.r;
        const dx = fromPoint.x - cx;
        const dy = fromPoint.y - cy;
        const distSq = dx * dx + dy * dy;

        // Point must be outside the circle for an external tangent
        if (distSq <= r * r) return null;

        const dist = Math.sqrt(distSq);
        // Angle from center to fromPoint
        const angleToFrom = Math.atan2(dy, dx);
        // Half-angle of the tangent lines
        const halfAngle = Math.acos(r / dist);

        // Two tangent points
        const tp1 = Utils.polarPoint(entity.center, angleToFrom + halfAngle, r);
        const tp2 = Utils.polarPoint(entity.center, angleToFrom - halfAngle, r);

        // For arcs, check that the tangent point lies on the arc
        if (entity.type === 'arc') {
            const onArc1 = this.isAngleOnArc(Math.atan2(tp1.y - cy, tp1.x - cx), entity);
            const onArc2 = this.isAngleOnArc(Math.atan2(tp2.y - cy, tp2.x - cx), entity);
            if (onArc1 && onArc2) {
                // Both on arc — return the closer one to the cursor
                return Utils.dist(fromPoint, tp1) < Utils.dist(fromPoint, tp2) ? tp1 : tp2;
            }
            if (onArc1) return tp1;
            if (onArc2) return tp2;
            return null;
        }

        // Return the tangent point closer to the cursor (fromPoint)
        return Utils.dist(fromPoint, tp1) < Utils.dist(fromPoint, tp2) ? tp1 : tp2;
    },

    // Check if an angle falls on an arc's angular range
    isAngleOnArc(angle, arc) {
        let start = arc.start;
        let end = arc.end;
        // Normalize to [0, 2π)
        const TWO_PI = Math.PI * 2;
        start = ((start % TWO_PI) + TWO_PI) % TWO_PI;
        end = ((end % TWO_PI) + TWO_PI) % TWO_PI;
        angle = ((angle % TWO_PI) + TWO_PI) % TWO_PI;

        if (start <= end) {
            return angle >= start && angle <= end;
        } else {
            return angle >= start || angle <= end;
        }
    },

    // Calculate perpendicular point from a point to a line segment
    perpendicularToLine(point, lineP1, lineP2) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) return null; // Line has zero length

        // Calculate projection parameter
        const t = ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / lenSq;

        // Check if perpendicular point is on the segment
        if (t < 0 || t > 1) return null;

        return {
            x: lineP1.x + t * dx,
            y: lineP1.y + t * dy
        };
    },

    // ==========================================
    // ENTITY TRANSFORMATIONS
    // ==========================================

    moveEntity(entity, delta) {
        const moved = JSON.parse(JSON.stringify(entity));

        switch (moved.type) {
            case 'line':
                moved.p1.x += delta.x;
                moved.p1.y += delta.y;
                moved.p2.x += delta.x;
                moved.p2.y += delta.y;
                break;
            case 'circle':
            case 'arc':
            case 'ellipse':
                moved.center.x += delta.x;
                moved.center.y += delta.y;
                break;
            case 'rect':
                moved.p1.x += delta.x;
                moved.p1.y += delta.y;
                moved.p2.x += delta.x;
                moved.p2.y += delta.y;
                break;
            case 'polyline':
                moved.points.forEach(p => {
                    p.x += delta.x;
                    p.y += delta.y;
                });
                break;
            case 'text':
                moved.position.x += delta.x;
                moved.position.y += delta.y;
                break;
            case 'image':
                moved.p1.x += delta.x;
                moved.p1.y += delta.y;
                moved.p2 = {
                    x: moved.p1.x + (moved.width ?? Math.abs(moved.p2.x - moved.p1.x)),
                    y: moved.p1.y + (moved.height ?? Math.abs(moved.p2.y - moved.p1.y))
                };
                break;
            case 'block':
                moved.insertPoint.x += delta.x;
                moved.insertPoint.y += delta.y;
                break;
            case 'point':
                moved.position.x += delta.x;
                moved.position.y += delta.y;
                break;
            case 'donut':
                moved.center.x += delta.x;
                moved.center.y += delta.y;
                break;
        }

        return moved;
    },

    rotateEntity(entity, center, angle) {
        const rotated = JSON.parse(JSON.stringify(entity));

        switch (rotated.type) {
            case 'line':
                rotated.p1 = Utils.rotatePoint(rotated.p1, center, angle);
                rotated.p2 = Utils.rotatePoint(rotated.p2, center, angle);
                break;
            case 'circle':
                rotated.center = Utils.rotatePoint(rotated.center, center, angle);
                break;
            case 'arc':
                rotated.center = Utils.rotatePoint(rotated.center, center, angle);
                rotated.start += angle;
                rotated.end += angle;
                break;
            case 'ellipse':
                rotated.center = Utils.rotatePoint(rotated.center, center, angle);
                rotated.rotation = (rotated.rotation || 0) + angle;
                break;
            case 'rect':
                // Convert to polyline for rotation
                const corners = [
                    rotated.p1,
                    { x: rotated.p2.x, y: rotated.p1.y },
                    rotated.p2,
                    { x: rotated.p1.x, y: rotated.p2.y },
                    rotated.p1
                ];
                return {
                    ...rotated,
                    type: 'polyline',
                    points: corners.map(p => Utils.rotatePoint(p, center, angle))
                };
            case 'polyline':
                rotated.points = rotated.points.map(p => Utils.rotatePoint(p, center, angle));
                break;
            case 'text':
                rotated.position = Utils.rotatePoint(rotated.position, center, angle);
                rotated.rotation = (rotated.rotation || 0) + Utils.radToDeg(angle);
                break;
            case 'image':
                rotated.p1 = Utils.rotatePoint(rotated.p1, center, angle);
                rotated.rotation = (rotated.rotation || 0) + Utils.radToDeg(angle);
                rotated.p2 = {
                    x: rotated.p1.x + (rotated.width ?? Math.abs(rotated.p2.x - rotated.p1.x)),
                    y: rotated.p1.y + (rotated.height ?? Math.abs(rotated.p2.y - rotated.p1.y))
                };
                break;
            case 'block':
                rotated.insertPoint = Utils.rotatePoint(rotated.insertPoint, center, angle);
                rotated.rotation = (rotated.rotation || 0) + angle;
                break;
            case 'point':
                rotated.position = Utils.rotatePoint(rotated.position, center, angle);
                break;
            case 'donut':
                rotated.center = Utils.rotatePoint(rotated.center, center, angle);
                break;
        }

        return rotated;
    },

    scaleEntity(entity, center, scale) {
        const scaled = JSON.parse(JSON.stringify(entity));

        switch (scaled.type) {
            case 'line':
                scaled.p1 = Utils.scalePoint(scaled.p1, center, scale);
                scaled.p2 = Utils.scalePoint(scaled.p2, center, scale);
                break;
            case 'circle':
                scaled.center = Utils.scalePoint(scaled.center, center, scale);
                scaled.r *= scale;
                break;
            case 'arc':
                scaled.center = Utils.scalePoint(scaled.center, center, scale);
                scaled.r *= scale;
                break;
            case 'ellipse':
                scaled.center = Utils.scalePoint(scaled.center, center, scale);
                scaled.rx *= scale;
                scaled.ry *= scale;
                break;
            case 'rect':
                scaled.p1 = Utils.scalePoint(scaled.p1, center, scale);
                scaled.p2 = Utils.scalePoint(scaled.p2, center, scale);
                break;
            case 'polyline':
                scaled.points = scaled.points.map(p => Utils.scalePoint(p, center, scale));
                break;
            case 'text':
                scaled.position = Utils.scalePoint(scaled.position, center, scale);
                scaled.height *= scale;
                break;
            case 'image':
                scaled.p1 = Utils.scalePoint(scaled.p1, center, scale);
                scaled.width = (scaled.width ?? Math.abs(scaled.p2.x - scaled.p1.x)) * scale;
                scaled.height = (scaled.height ?? Math.abs(scaled.p2.y - scaled.p1.y)) * scale;
                scaled.scale = (scaled.scale ?? 1) * scale;
                scaled.p2 = {
                    x: scaled.p1.x + scaled.width,
                    y: scaled.p1.y + scaled.height
                };
                break;
            case 'block':
                scaled.insertPoint = Utils.scalePoint(scaled.insertPoint, center, scale);
                scaled.scale = {
                    x: (scaled.scale?.x || 1) * scale,
                    y: (scaled.scale?.y || 1) * scale
                };
                break;
            case 'point':
                scaled.position = Utils.scalePoint(scaled.position, center, scale);
                break;
            case 'donut':
                scaled.center = Utils.scalePoint(scaled.center, center, scale);
                scaled.innerRadius *= scale;
                scaled.outerRadius *= scale;
                break;
        }

        return scaled;
    },

    mirrorEntity(entity, lineP1, lineP2) {
        const mirrored = JSON.parse(JSON.stringify(entity));

        switch (mirrored.type) {
            case 'line':
                mirrored.p1 = Utils.mirrorPoint(mirrored.p1, lineP1, lineP2);
                mirrored.p2 = Utils.mirrorPoint(mirrored.p2, lineP1, lineP2);
                break;
            case 'circle':
                mirrored.center = Utils.mirrorPoint(mirrored.center, lineP1, lineP2);
                break;
            case 'arc':
                mirrored.center = Utils.mirrorPoint(mirrored.center, lineP1, lineP2);
                // Swap and negate angles for mirror
                const tempStart = mirrored.start;
                mirrored.start = -mirrored.end;
                mirrored.end = -tempStart;
                break;
            case 'ellipse':
                mirrored.center = Utils.mirrorPoint(mirrored.center, lineP1, lineP2);
                mirrored.rotation = -(mirrored.rotation || 0);
                break;
            case 'rect':
                mirrored.p1 = Utils.mirrorPoint(mirrored.p1, lineP1, lineP2);
                mirrored.p2 = Utils.mirrorPoint(mirrored.p2, lineP1, lineP2);
                break;
            case 'polyline':
                mirrored.points = mirrored.points.map(p => Utils.mirrorPoint(p, lineP1, lineP2));
                break;
            case 'text':
                mirrored.position = Utils.mirrorPoint(mirrored.position, lineP1, lineP2);
                break;
            case 'image':
                mirrored.p1 = Utils.mirrorPoint(mirrored.p1, lineP1, lineP2);
                mirrored.rotation = -(mirrored.rotation || 0);
                mirrored.p2 = {
                    x: mirrored.p1.x + (mirrored.width ?? Math.abs(mirrored.p2.x - mirrored.p1.x)),
                    y: mirrored.p1.y + (mirrored.height ?? Math.abs(mirrored.p2.y - mirrored.p1.y))
                };
                break;
            case 'block':
                mirrored.insertPoint = Utils.mirrorPoint(mirrored.insertPoint, lineP1, lineP2);
                // Mirror the scale (flip X for vertical mirror, Y for horizontal)
                const mirrorAngle = Math.atan2(lineP2.y - lineP1.y, lineP2.x - lineP1.x);
                mirrored.rotation = -((mirrored.rotation || 0) - 2 * mirrorAngle);
                // Flip one axis of the scale to achieve mirroring
                mirrored.scale = {
                    x: -(mirrored.scale?.x || 1),
                    y: (mirrored.scale?.y || 1)
                };
                break;
            case 'point':
                mirrored.position = Utils.mirrorPoint(mirrored.position, lineP1, lineP2);
                break;
            case 'donut':
                mirrored.center = Utils.mirrorPoint(mirrored.center, lineP1, lineP2);
                break;
        }

        return mirrored;
    },

    // ==========================================
    // FILLET AND CHAMFER
    // ==========================================

    filletLines(line1, line2, radius) {
        // Find intersection point of the two lines (infinite lines)
        const intersection = this.lineLineIntersection(
            line1.p1, line1.p2, line2.p1, line2.p2
        );

        if (!intersection) return null;

        // If radius is 0, just trim to intersection
        if (radius === 0) {
            // Determine which endpoints to keep
            const d1p1 = Utils.dist(line1.p1, intersection);
            const d1p2 = Utils.dist(line1.p2, intersection);
            const d2p1 = Utils.dist(line2.p1, intersection);
            const d2p2 = Utils.dist(line2.p2, intersection);

            return {
                line1: {
                    p1: d1p1 > d1p2 ? line1.p1 : intersection,
                    p2: d1p1 > d1p2 ? intersection : line1.p2
                },
                line2: {
                    p1: d2p1 > d2p2 ? line2.p1 : intersection,
                    p2: d2p1 > d2p2 ? intersection : line2.p2
                },
                arc: null
            };
        }

        // Calculate the angle between the lines
        const angle1 = Utils.angle(intersection, line1.p1);
        const angle2 = Utils.angle(intersection, line2.p1);

        // Find the bisector angle
        let bisector = (angle1 + angle2) / 2;
        if (Math.abs(angle1 - angle2) > Math.PI) {
            bisector += Math.PI;
        }

        // Calculate fillet arc center
        const sinHalfAngle = Math.sin(Math.abs(angle2 - angle1) / 2);
        if (sinHalfAngle === 0) return null;

        const centerDist = radius / sinHalfAngle;
        const arcCenter = {
            x: intersection.x + centerDist * Math.cos(bisector),
            y: intersection.y + centerDist * Math.sin(bisector)
        };

        // Find tangent points on each line
        const tangent1 = this.closestPointOnLine(arcCenter, line1.p1, line1.p2);
        const tangent2 = this.closestPointOnLine(arcCenter, line2.p1, line2.p2);

        // Create the fillet arc
        const startAngle = Utils.angle(arcCenter, tangent1);
        const endAngle = Utils.angle(arcCenter, tangent2);

        // Trim the lines to the tangent points
        const d1p1 = Utils.dist(line1.p1, tangent1);
        const d1p2 = Utils.dist(line1.p2, tangent1);
        const d2p1 = Utils.dist(line2.p1, tangent2);
        const d2p2 = Utils.dist(line2.p2, tangent2);

        return {
            line1: {
                type: 'line',
                p1: d1p1 > d1p2 ? line1.p1 : tangent1,
                p2: d1p1 > d1p2 ? tangent1 : line1.p2
            },
            line2: {
                type: 'line',
                p1: d2p1 > d2p2 ? line2.p1 : tangent2,
                p2: d2p1 > d2p2 ? tangent2 : line2.p2
            },
            arc: {
                type: 'arc',
                center: arcCenter,
                r: radius,
                start: startAngle,
                end: endAngle
            }
        };
    },

    closestPointOnLine(point, lineP1, lineP2) {
        const dx = lineP2.x - lineP1.x;
        const dy = lineP2.y - lineP1.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) return { ...lineP1 };

        const t = Math.max(0, Math.min(1,
            ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / lengthSq
        ));

        return {
            x: lineP1.x + t * dx,
            y: lineP1.y + t * dy
        };
    },

    chamferLines(line1, line2, dist1, dist2) {
        // Find intersection point (infinite lines)
        const intersection = this.lineLineIntersection(
            line1.p1, line1.p2, line2.p1, line2.p2
        );

        if (!intersection) return null;

        // If distances are 0, just trim to intersection
        if (dist1 === 0 && dist2 === 0) {
            return this.filletLines(line1, line2, 0);
        }

        // Calculate chamfer points on each line
        const d1p1 = Utils.dist(line1.p1, intersection);
        const d1p2 = Utils.dist(line1.p2, intersection);
        const d2p1 = Utils.dist(line2.p1, intersection);
        const d2p2 = Utils.dist(line2.p2, intersection);

        // Determine direction from intersection
        const dir1 = d1p1 > d1p2 ?
            { x: line1.p1.x - intersection.x, y: line1.p1.y - intersection.y } :
            { x: line1.p2.x - intersection.x, y: line1.p2.y - intersection.y };
        const dir2 = d2p1 > d2p2 ?
            { x: line2.p1.x - intersection.x, y: line2.p1.y - intersection.y } :
            { x: line2.p2.x - intersection.x, y: line2.p2.y - intersection.y };

        // Normalize directions
        const len1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
        const len2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);

        const chamferP1 = {
            x: intersection.x + (dir1.x / len1) * dist1,
            y: intersection.y + (dir1.y / len1) * dist1
        };
        const chamferP2 = {
            x: intersection.x + (dir2.x / len2) * dist2,
            y: intersection.y + (dir2.y / len2) * dist2
        };

        return {
            line1: {
                type: 'line',
                p1: d1p1 > d1p2 ? line1.p1 : chamferP1,
                p2: d1p1 > d1p2 ? chamferP1 : line1.p2
            },
            line2: {
                type: 'line',
                p1: d2p1 > d2p2 ? line2.p1 : chamferP2,
                p2: d2p1 > d2p2 ? chamferP2 : line2.p2
            },
            chamferLine: {
                type: 'line',
                p1: chamferP1,
                p2: chamferP2
            }
        };
    },

    // Extend a line to meet the nearest boundary entity
    extendLine(entity, clickPoint, allEntities) {
        if (entity.type !== 'line') return null;

        // Determine which end to extend based on click point
        const distToP1 = Utils.dist(clickPoint, entity.p1);
        const distToP2 = Utils.dist(clickPoint, entity.p2);
        const extendFromP1 = distToP1 < distToP2;

        // Direction of the line
        const dx = entity.p2.x - entity.p1.x;
        const dy = entity.p2.y - entity.p1.y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return null;

        // Extend the line infinitely in the direction
        const extendDist = 100000; // Large distance
        let extP1, extP2;

        if (extendFromP1) {
            // Extend from p1 (backward direction)
            extP1 = {
                x: entity.p1.x - (dx / len) * extendDist,
                y: entity.p1.y - (dy / len) * extendDist
            };
            extP2 = entity.p1;
        } else {
            // Extend from p2 (forward direction)
            extP1 = entity.p2;
            extP2 = {
                x: entity.p2.x + (dx / len) * extendDist,
                y: entity.p2.y + (dy / len) * extendDist
            };
        }

        // Find closest intersection with any boundary
        let closestInt = null;
        let minDist = Infinity;

        for (const boundary of allEntities) {
            let intersections = [];

            if (boundary.type === 'line') {
                const int = this.lineLineIntersection(extP1, extP2, boundary.p1, boundary.p2);
                if (int && this.pointOnSegment(int, boundary.p1, boundary.p2)) {
                    intersections.push(int);
                }
            } else if (boundary.type === 'circle') {
                const ints = this.lineCircleIntersection(extP1, extP2, boundary.center, boundary.r);
                intersections.push(...ints);
            } else if (boundary.type === 'arc') {
                const ints = this.lineCircleIntersection(extP1, extP2, boundary.center, boundary.r);
                ints.forEach(int => {
                    if (this.pointOnArc(int, boundary)) {
                        intersections.push(int);
                    }
                });
            } else if (boundary.type === 'rect') {
                const corners = [
                    boundary.p1,
                    { x: boundary.p2.x, y: boundary.p1.y },
                    boundary.p2,
                    { x: boundary.p1.x, y: boundary.p2.y }
                ];
                for (let i = 0; i < 4; i++) {
                    const int = this.lineLineIntersection(extP1, extP2, corners[i], corners[(i + 1) % 4]);
                    if (int && this.pointOnSegment(int, corners[i], corners[(i + 1) % 4])) {
                        intersections.push(int);
                    }
                }
            } else if (boundary.type === 'polyline') {
                for (let i = 0; i < boundary.points.length - 1; i++) {
                    const int = this.lineLineIntersection(extP1, extP2, boundary.points[i], boundary.points[i + 1]);
                    if (int && this.pointOnSegment(int, boundary.points[i], boundary.points[i + 1])) {
                        intersections.push(int);
                    }
                }
            }

            // Find the closest intersection in the extend direction
            for (const int of intersections) {
                const refPoint = extendFromP1 ? entity.p1 : entity.p2;
                const dist = Utils.dist(refPoint, int);

                // Only consider points in the extend direction
                const toInt = { x: int.x - refPoint.x, y: int.y - refPoint.y };
                const extDir = extendFromP1
                    ? { x: -dx, y: -dy }
                    : { x: dx, y: dy };
                const dotProduct = toInt.x * extDir.x + toInt.y * extDir.y;

                if (dotProduct > 0 && dist < minDist && dist > 0.001) {
                    minDist = dist;
                    closestInt = int;
                }
            }
        }

        if (closestInt) {
            // Return the extended line
            return extendFromP1
                ? { type: 'line', p1: closestInt, p2: { ...entity.p2 } }
                : { type: 'line', p1: { ...entity.p1 }, p2: closestInt };
        }

        return null;
    },

    // Extend an arc to meet the nearest boundary entity
    extendArc(entity, clickPoint, allEntities) {
        if (entity.type !== 'arc') return null;

        // Determine which end to extend based on click point
        const startPoint = {
            x: entity.center.x + entity.r * Math.cos(entity.start),
            y: entity.center.y + entity.r * Math.sin(entity.start)
        };
        const endPoint = {
            x: entity.center.x + entity.r * Math.cos(entity.end),
            y: entity.center.y + entity.r * Math.sin(entity.end)
        };

        const distToStart = Utils.dist(clickPoint, startPoint);
        const distToEnd = Utils.dist(clickPoint, endPoint);
        const extendStart = distToStart < distToEnd;

        // Find intersections with boundary entities on the arc's circle
        let closestAngle = null;
        let minAngleDist = Infinity;

        for (const boundary of allEntities) {
            let intersections = [];

            if (boundary.type === 'line') {
                const ints = this.lineCircleIntersection(boundary.p1, boundary.p2, entity.center, entity.r);
                intersections.push(...ints.filter(int => this.pointOnSegment(int, boundary.p1, boundary.p2)));
            } else if (boundary.type === 'circle') {
                const ints = this.circleCircleIntersection(entity.center, entity.r, boundary.center, boundary.r);
                intersections.push(...ints);
            }

            for (const int of intersections) {
                const angle = Math.atan2(int.y - entity.center.y, int.x - entity.center.x);

                // Check if this angle is in the extension direction
                if (extendStart) {
                    // Extending from start in decreasing angle direction
                    let angleDist = entity.start - angle;
                    while (angleDist < 0) angleDist += 2 * Math.PI;
                    while (angleDist > 2 * Math.PI) angleDist -= 2 * Math.PI;

                    if (angleDist > 0.001 && angleDist < minAngleDist) {
                        minAngleDist = angleDist;
                        closestAngle = angle;
                    }
                } else {
                    // Extending from end in increasing angle direction
                    let angleDist = angle - entity.end;
                    while (angleDist < 0) angleDist += 2 * Math.PI;
                    while (angleDist > 2 * Math.PI) angleDist -= 2 * Math.PI;

                    if (angleDist > 0.001 && angleDist < minAngleDist) {
                        minAngleDist = angleDist;
                        closestAngle = angle;
                    }
                }
            }
        }

        if (closestAngle !== null) {
            return extendStart
                ? { type: 'arc', center: { ...entity.center }, r: entity.r, start: closestAngle, end: entity.end }
                : { type: 'arc', center: { ...entity.center }, r: entity.r, start: entity.start, end: closestAngle };
        }

        return null;
    },

    breakLine(entity, breakPoint1, breakPoint2) {
        if (entity.type !== 'line') return null;

        // Project break points onto line
        const proj1 = this.closestPointOnLine(breakPoint1, entity.p1, entity.p2);
        const proj2 = this.closestPointOnLine(breakPoint2, entity.p1, entity.p2);

        // Calculate distances along line
        const lineLen = Utils.dist(entity.p1, entity.p2);
        const t1 = Utils.dist(entity.p1, proj1) / lineLen;
        const t2 = Utils.dist(entity.p1, proj2) / lineLen;

        const tMin = Math.min(t1, t2);
        const tMax = Math.max(t1, t2);

        const result = [];

        // First segment (if not at start)
        if (tMin > 0.001) {
            result.push({
                type: 'line',
                p1: { ...entity.p1 },
                p2: {
                    x: entity.p1.x + tMin * (entity.p2.x - entity.p1.x),
                    y: entity.p1.y + tMin * (entity.p2.y - entity.p1.y)
                }
            });
        }

        // Second segment (if not at end)
        if (tMax < 0.999) {
            result.push({
                type: 'line',
                p1: {
                    x: entity.p1.x + tMax * (entity.p2.x - entity.p1.x),
                    y: entity.p1.y + tMax * (entity.p2.y - entity.p1.y)
                },
                p2: { ...entity.p2 }
            });
        }

        return result;
    }
};

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    contains(point) {
        return (
            point.x >= this.x &&
            point.x <= this.x + this.width &&
            point.y >= this.y &&
            point.y <= this.y + this.height
        );
    }

    intersects(range) {
        return !(
            range.x > this.x + this.width ||
            range.x + range.width < this.x ||
            range.y > this.y + this.height ||
            range.y + range.height < this.y
        );
    }
}

class QuadTree {
    constructor(boundary, capacity = 4) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.entities = [];
        this.divided = false;
        this.northwest = null;
        this.northeast = null;
        this.southwest = null;
        this.southeast = null;
    }

    subdivide() {
        const { x, y, width, height } = this.boundary;
        const halfW = width / 2;
        const halfH = height / 2;

        this.northwest = new QuadTree(new Rectangle(x, y, halfW, halfH), this.capacity);
        this.northeast = new QuadTree(new Rectangle(x + halfW, y, halfW, halfH), this.capacity);
        this.southwest = new QuadTree(new Rectangle(x, y + halfH, halfW, halfH), this.capacity);
        this.southeast = new QuadTree(new Rectangle(x + halfW, y + halfH, halfW, halfH), this.capacity);
        this.divided = true;
    }

    insert(entity) {
        const bbox = entity.getBoundingBox ? entity.getBoundingBox() : entity.boundingBox;
        if (!bbox || !this._bboxIntersects(bbox, this.boundary)) {
            return false;
        }

        if (!this.divided && this.entities.length < this.capacity) {
            this.entities.push(entity);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
            const existing = this.entities;
            this.entities = [];
            for (const item of existing) {
                this._insertIntoChildren(item);
            }
        }

        return this._insertIntoChildren(entity);
    }

    _insertIntoChildren(entity) {
        const bbox = entity.getBoundingBox ? entity.getBoundingBox() : entity.boundingBox;
        if (!bbox) {
            return false;
        }

        let inserted = false;
        if (this._bboxIntersects(bbox, this.northwest.boundary)) {
            this.northwest.insert(entity);
            inserted = true;
        }
        if (this._bboxIntersects(bbox, this.northeast.boundary)) {
            this.northeast.insert(entity);
            inserted = true;
        }
        if (this._bboxIntersects(bbox, this.southwest.boundary)) {
            this.southwest.insert(entity);
            inserted = true;
        }
        if (this._bboxIntersects(bbox, this.southeast.boundary)) {
            this.southeast.insert(entity);
            inserted = true;
        }

        return inserted;
    }

    retrieve(range, out = [], seen = null) {
        if (!this.boundary.intersects(range)) {
            return out;
        }

        for (const entity of this.entities) {
            const bbox = entity.getBoundingBox ? entity.getBoundingBox() : entity.boundingBox;
            if (bbox && this._bboxIntersects(bbox, range)) {
                if (!seen || !seen.has(entity)) {
                    out.push(entity);
                    if (seen) {
                        seen.add(entity);
                    }
                }
            }
        }

        if (this.divided) {
            this.northwest.retrieve(range, out, seen);
            this.northeast.retrieve(range, out, seen);
            this.southwest.retrieve(range, out, seen);
            this.southeast.retrieve(range, out, seen);
        }

        return out;
    }

    query(range, found = [], foundSet = null) {
        return this.retrieve(range, found, foundSet);
    }

    clear() {
        this.entities.length = 0;
        if (this.divided) {
            this.northwest.clear();
            this.northeast.clear();
            this.southwest.clear();
            this.southeast.clear();
        }
        this.northwest = null;
        this.northeast = null;
        this.southwest = null;
        this.southeast = null;
        this.divided = false;
    }

    _bboxIntersects(bbox, rect) {
        return !(
            bbox.minX > rect.x + rect.width ||
            bbox.maxX < rect.x ||
            bbox.minY > rect.y + rect.height ||
            bbox.maxY < rect.y
        );
    }
}

Geometry.Rectangle = Rectangle;
Geometry.QuadTree = QuadTree;

class Line {
    constructor(p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) {
        this.type = 'line';
        this.p1 = p1;
        this.p2 = p2;
    }

    getBoundingBox() {
        return {
            minX: Math.min(this.p1.x, this.p2.x),
            minY: Math.min(this.p1.y, this.p2.y),
            maxX: Math.max(this.p1.x, this.p2.x),
            maxY: Math.max(this.p1.y, this.p2.y)
        };
    }
}

class Circle {
    constructor(center = { x: 0, y: 0 }, r = 0) {
        this.type = 'circle';
        this.center = center;
        this.r = r;
    }

    getBoundingBox() {
        return {
            minX: this.center.x - this.r,
            minY: this.center.y - this.r,
            maxX: this.center.x + this.r,
            maxY: this.center.y + this.r
        };
    }
}

class Arc {
    constructor(center = { x: 0, y: 0 }, r = 0, start = 0, end = 0) {
        this.type = 'arc';
        this.center = center;
        this.r = r;
        this.start = start;
        this.end = end;
    }

    getBoundingBox() {
        const angles = [this.start, this.end];
        const normalize = angle => {
            const twoPi = Math.PI * 2;
            let a = angle % twoPi;
            if (a < 0) a += twoPi;
            return a;
        };
        const start = normalize(this.start);
        const end = normalize(this.end);
        const inRange = (angle) => {
            if (start <= end) {
                return angle >= start && angle <= end;
            }
            return angle >= start || angle <= end;
        };
        const quadrants = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
        quadrants.forEach(angle => {
            if (inRange(angle)) angles.push(angle);
        });
        const points = angles.map(angle => ({
            x: this.center.x + Math.cos(angle) * this.r,
            y: this.center.y + Math.sin(angle) * this.r
        }));
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
        };
    }
}

class LwPolyline {
    constructor(points = [], closed = false) {
        this.type = 'lwpolyline';
        this.points = points;
        this.closed = closed;
    }

    getBoundingBox() {
        if (!this.points.length) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        let minX = this.points[0].x;
        let minY = this.points[0].y;
        let maxX = this.points[0].x;
        let maxY = this.points[0].y;
        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        return { minX, minY, maxX, maxY };
    }
}

class Text {
    constructor(position = { x: 0, y: 0 }, text = '', height = 0) {
        this.type = 'text';
        this.position = position;
        this.text = text;
        this.height = height;
    }

    getBoundingBox() {
        const width = (this.text?.length || 0) * (this.height || 0) * 0.6;
        return {
            minX: this.position.x,
            minY: this.position.y,
            maxX: this.position.x + width,
            maxY: this.position.y + (this.height || 0)
        };
    }
}

class Insert {
    constructor(blockName = '', x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0) {
        this.type = 'insert';
        this.blockName = blockName;
        this.x = x;
        this.y = y;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.rotation = rotation;
    }

    getBoundingBox(state = null) {
        const resolvedState = state || (typeof CAD !== 'undefined' ? CAD : null);
        if (!resolvedState || !resolvedState.getBlockEntities) {
            return {
                minX: this.x,
                minY: this.y,
                maxX: this.x + 1,
                maxY: this.y + 1
            };
        }

        const blockRef = {
            blockName: this.blockName,
            insertPoint: { x: this.x, y: this.y },
            scale: { x: this.scaleX, y: this.scaleY },
            rotation: this.rotation
        };
        const entities = resolvedState.getBlockEntities(blockRef);
        if (!entities.length) {
            return {
                minX: this.x,
                minY: this.y,
                maxX: this.x + 1,
                maxY: this.y + 1
            };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        entities.forEach(entity => {
            const bbox = Insert.getEntityBoundingBox(entity, resolvedState);
            if (!bbox) return;
            minX = Math.min(minX, bbox.minX);
            minY = Math.min(minY, bbox.minY);
            maxX = Math.max(maxX, bbox.maxX);
            maxY = Math.max(maxY, bbox.maxY);
        });

        if (!Number.isFinite(minX)) {
            return {
                minX: this.x,
                minY: this.y,
                maxX: this.x + 1,
                maxY: this.y + 1
            };
        }

        return { minX, minY, maxX, maxY };
    }

    static getEntityBoundingBox(entity, state) {
        if (!entity) return null;
        if (entity.getBoundingBox) {
            return entity.getBoundingBox(state);
        }
        switch (entity.type) {
            case 'line':
                return {
                    minX: Math.min(entity.p1.x, entity.p2.x),
                    minY: Math.min(entity.p1.y, entity.p2.y),
                    maxX: Math.max(entity.p1.x, entity.p2.x),
                    maxY: Math.max(entity.p1.y, entity.p2.y)
                };
            case 'circle':
                return {
                    minX: entity.center.x - entity.r,
                    minY: entity.center.y - entity.r,
                    maxX: entity.center.x + entity.r,
                    maxY: entity.center.y + entity.r
                };
            case 'arc': {
                const arc = new Arc(entity.center, entity.r, entity.start, entity.end);
                return arc.getBoundingBox();
            }
            case 'polyline':
            case 'lwpolyline': {
                const points = entity.points || [];
                if (!points.length) return null;
                let minX = points[0].x;
                let minY = points[0].y;
                let maxX = points[0].x;
                let maxY = points[0].y;
                points.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                });
                return { minX, minY, maxX, maxY };
            }
            case 'text':
            case 'mtext': {
                const text = entity.text || '';
                const height = entity.height || 0;
                const width = text.length * height * 0.6;
                const point = entity.position || entity.point || { x: 0, y: 0 };
                return {
                    minX: point.x,
                    minY: point.y,
                    maxX: point.x + width,
                    maxY: point.y + height
                };
            }
            case 'block': {
                if (!state || !state.getBlockEntities) return null;
                const expanded = state.getBlockEntities(entity);
                if (!expanded.length) return null;
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;
                expanded.forEach(item => {
                    const bbox = Insert.getEntityBoundingBox(item, state);
                    if (!bbox) return;
                    minX = Math.min(minX, bbox.minX);
                    minY = Math.min(minY, bbox.minY);
                    maxX = Math.max(maxX, bbox.maxX);
                    maxY = Math.max(maxY, bbox.maxY);
                });
                return { minX, minY, maxX, maxY };
            }
            case 'hatch': {
                const hatchBoundary = entity.boundary || entity.points || [];
                const hatchPts = Hatch.getBoundaryPoints(hatchBoundary);
                if (!hatchPts || hatchPts.length === 0) return null;
                let minX = hatchPts[0].x;
                let minY = hatchPts[0].y;
                let maxX = hatchPts[0].x;
                let maxY = hatchPts[0].y;
                hatchPts.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
                return { minX, minY, maxX, maxY };
            }
            default:
                return null;
        }
    }
}

class Hatch {
    constructor(boundary = [], patternName = 'ANSI31', scale = 1, angle = 0) {
        this.type = 'hatch';
        this.boundary = boundary;
        this.patternName = (patternName || 'ANSI31').toLowerCase();
        this.scale = scale || 1;
        this.angle = angle || 0;
        this.renderLines = [];
    }

    /**
     * Pattern definitions matching AutoCAD standards.
     * Each pattern has one or more line families with:
     *   angle: degrees from horizontal
     *   spacing: base spacing in drawing units (scaled by this.scale)
     *   offset: perpendicular offset for dash patterns (0 = continuous)
     *   dashes: null for continuous, array of [dash, gap, ...] for dashed
     */
    static getPatternDefinition(patternName) {
        const p = (patternName || '').toLowerCase();
        switch (p) {
            case 'ansi31':
            case 'diagonal':
            case 'angle':
                // 45° diagonal lines, standard ANSI steel
                return { families: [{ angle: 45, spacing: 3.175 }] };
            case 'ansi32':
                // 45° double diagonal (steel in section), close spacing
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 45, spacing: 3.175, phase: 1.5875 }
                ]};
            case 'ansi33':
                // 45° diagonal, wider spacing (brass/bronze)
                return { families: [{ angle: 45, spacing: 6.35 }] };
            case 'ansi34':
                // 45° diagonal thick (plastic/rubber)
                return { families: [
                    { angle: 45, spacing: 6.35 },
                    { angle: 45, spacing: 6.35, phase: 1.0 }
                ]};
            case 'ansi35':
                // 135° reverse diagonal (fire brick)
                return { families: [{ angle: 135, spacing: 3.175 }] };
            case 'ansi36':
                // Horizontal lines (white metal/zinc)
                return { families: [{ angle: 0, spacing: 3.175 }] };
            case 'ansi37':
            case 'cross':
                // Cross-hatch: 0° + 90°
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 135, spacing: 3.175 }
                ]};
            case 'ansi38':
                // Diagonal + horizontal cross
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 0, spacing: 3.175 }
                ]};
            case 'brick':
                return { families: [
                    { angle: 0, spacing: 5 },
                    { angle: 90, spacing: 10, dashes: [5, 5] }
                ], complex: true };
            case 'honey':
                return { families: [
                    { angle: 0, spacing: 4.5 },
                    { angle: 60, spacing: 4.5 },
                    { angle: 120, spacing: 4.5 }
                ], complex: true };
            case 'earth':
                return { families: [
                    { angle: 0, spacing: 6, dashes: [3, 2] },
                    { angle: 45, spacing: 6, dashes: [2, 3] },
                    { angle: 90, spacing: 6, dashes: [1, 4] }
                ], complex: true };
            case 'grass':
                return { families: [
                    { angle: 90, spacing: 7, dashes: [3, 4] },
                    { angle: 45, spacing: 10, dashes: [2, 5] }
                ], complex: true };
            case 'steel':
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 135, spacing: 12, dashes: [2, 10] }
                ], complex: true };
            case 'insul':
                return { families: [
                    { angle: 0, spacing: 6 }
                ], complex: true };
            case 'net':
                return { families: [
                    { angle: 0, spacing: 4 },
                    { angle: 90, spacing: 4 }
                ]};
            case 'net3':
                return { families: [
                    { angle: 0, spacing: 4 },
                    { angle: 60, spacing: 4 },
                    { angle: 120, spacing: 4 }
                ]};
            case 'dash':
                return { families: [
                    { angle: 0, spacing: 3.175, dashes: [3, 2] }
                ]};
            case 'square':
                return { families: [
                    { angle: 0, spacing: 5 },
                    { angle: 90, spacing: 5 }
                ]};
            case 'zigzag':
                return { families: [
                    { angle: 45, spacing: 6, dashes: [4, 0] },
                    { angle: 135, spacing: 6, dashes: [4, 0], phase: 3 }
                ], complex: true };
            case 'dots':
                return { families: [
                    { angle: 0, spacing: 4, dashes: [0.01, 3.99] },
                    { angle: 90, spacing: 4, dashes: [0.01, 3.99] }
                ], complex: true };
            case 'solid':
                return { solid: true, families: [] };
            // ANSI patterns (industry standard)
            case 'ansi31':
                return { families: [{ angle: 45, spacing: 3.175 }] };
            case 'ansi32':
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 45, spacing: 3.175, phase: 1.5875 }
                ]};
            case 'ansi33':
                return { families: [
                    { angle: 45, spacing: 5 },
                    { angle: 45, spacing: 5, phase: 1.67 },
                    { angle: 45, spacing: 5, phase: 3.34 }
                ]};
            case 'ansi34':
                return { families: [
                    { angle: 45, spacing: 6.35 },
                    { angle: -45, spacing: 6.35 }
                ]};
            case 'ansi35':
                return { families: [
                    { angle: 45, spacing: 6.35 },
                    { angle: 0, spacing: 6.35 }
                ]};
            case 'ansi36':
                return { families: [
                    { angle: 45, spacing: 5 },
                    { angle: -45, spacing: 5, dashes: [6, 1.5] }
                ]};
            case 'ansi37':
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 135, spacing: 3.175 }
                ]};
            case 'ansi38':
                return { families: [
                    { angle: 45, spacing: 3.175 },
                    { angle: 135, spacing: 6.35 }
                ]};
            // Architectural patterns
            case 'ar-b816':
            case 'ar-brstd':
                return { families: [
                    { angle: 0, spacing: 8 },
                    { angle: 90, spacing: 16, dashes: [8, 0], phase: 0 }
                ]};
            case 'ar-b88':
                return { families: [
                    { angle: 0, spacing: 8 },
                    { angle: 90, spacing: 8, dashes: [8, 0] }
                ]};
            case 'ar-brelm':
                return { families: [
                    { angle: 0, spacing: 5 },
                    { angle: 0, spacing: 5, phase: 2.5 },
                    { angle: 90, spacing: 10, dashes: [5, 0] }
                ]};
            case 'ar-conc':
                return { families: [
                    { angle: 0, spacing: 6, dashes: [4, 2] },
                    { angle: 60, spacing: 6, dashes: [2, 4] },
                    { angle: 120, spacing: 6, dashes: [2, 4] }
                ]};
            case 'ar-hbone':
                return { families: [
                    { angle: 45, spacing: 4 },
                    { angle: -45, spacing: 4, phase: 2 }
                ]};
            case 'ar-parq1':
                return { families: [
                    { angle: 0, spacing: 8, dashes: [8, 0] },
                    { angle: 90, spacing: 8, dashes: [8, 0] },
                    { angle: 0, spacing: 8, phase: 4, dashes: [8, 0] }
                ]};
            case 'ar-rroof':
                return { families: [
                    { angle: 0, spacing: 4, dashes: [12, 2] },
                    { angle: 0, spacing: 4, phase: 7, dashes: [12, 2] }
                ]};
            case 'ar-rshke':
                return { families: [
                    { angle: 0, spacing: 6 },
                    { angle: 90, spacing: 12, dashes: [6, 6] }
                ]};
            case 'ar-sand':
                return { families: [
                    { angle: 0, spacing: 2, dashes: [0.01, 2] },
                    { angle: 60, spacing: 3, dashes: [0.01, 3] },
                    { angle: 120, spacing: 4, dashes: [0.01, 4] }
                ], complex: true };
            // Material patterns
            case 'brass':
                return { families: [
                    { angle: 0, spacing: 3.175 },
                    { angle: 0, spacing: 3.175, phase: 1.5875, dashes: [3, 2] }
                ]};
            case 'clay':
                return { families: [
                    { angle: 0, spacing: 3 },
                    { angle: 0, spacing: 3, phase: 1.5 },
                    { angle: 0, spacing: 3, phase: 0.75 }
                ]};
            case 'cork':
                return { families: [
                    { angle: 45, spacing: 3 },
                    { angle: 135, spacing: 3, dashes: [3, 2] }
                ]};
            case 'flex':
                return { families: [
                    { angle: 0, spacing: 4, dashes: [6, 1.5, 0.01, 1.5] }
                ]};
            case 'gravel':
                return { families: [
                    { angle: 0, spacing: 4, dashes: [0.01, 2, 0.01, 1] },
                    { angle: 60, spacing: 5, dashes: [0.01, 3, 0.01, 1.5] },
                    { angle: 120, spacing: 4.5, dashes: [0.01, 2.5, 0.01, 1] }
                ], complex: true };
            case 'hex':
                return { families: [
                    { angle: 0, spacing: 5 },
                    { angle: 60, spacing: 5 },
                    { angle: 120, spacing: 5 }
                ]};
            case 'sacncr':
                return { families: [
                    { angle: 45, spacing: 4, dashes: [4, 1.5, 0.01, 1.5] },
                    { angle: -45, spacing: 4, dashes: [4, 1.5, 0.01, 1.5] }
                ]};
            case 'trans':
                return { families: [
                    { angle: 0, spacing: 3 },
                    { angle: 90, spacing: 6, dashes: [3, 3] }
                ]};
            case 'dolmit':
                return { families: [
                    { angle: 0, spacing: 4 },
                    { angle: 45, spacing: 4, dashes: [4, 2] }
                ]};
            case 'plast':
                return { families: [
                    { angle: 0, spacing: 3 },
                    { angle: 60, spacing: 3, dashes: [4, 2] }
                ]};
            case 'line':
                return { families: [{ angle: 0, spacing: 3.175 }] };
            case 'triang':
                return { families: [
                    { angle: 60, spacing: 5, dashes: [5, 0] },
                    { angle: 120, spacing: 5, dashes: [5, 0] },
                    { angle: 0, spacing: 5, dashes: [5, 0] }
                ]};
            default:
                return { families: [{ angle: 45, spacing: 3.175 }] };
        }
    }

    generateRenderLines() {
        const boundaryPoints = Hatch.getBoundaryPoints(this.boundary);
        if (!boundaryPoints || boundaryPoints.length < 3) {
            this.renderLines = [];
            return this.renderLines;
        }

        const patternDef = Hatch.getPatternDefinition(this.patternName);
        if (patternDef.solid || !patternDef.families.length) {
            this.renderLines = [];
            return this.renderLines;
        }

        const allSegments = [];

        patternDef.families.forEach(family => {
            // Effective angle = pattern family angle + user angle
            const effectiveAngle = (family.angle || 0) + (this.angle || 0);
            // Effective spacing = family spacing * user scale
            const effectiveSpacing = (family.spacing || 3.175) * this.scale;

            const segs = Hatch._generateScanlines(
                boundaryPoints, effectiveAngle, effectiveSpacing,
                family.dashes, family.phase
            );
            segs.forEach(s => allSegments.push(s));
        });

        this.renderLines = allSegments;
        return allSegments;
    }

    /**
     * Generate scanlines at a given angle through a boundary polygon.
     * Returns array of {p1, p2} segments clipped to the boundary.
     */
    static _generateScanlines(boundaryPoints, angleDeg, spacing, dashes, phaseOffset) {
        if (!boundaryPoints || boundaryPoints.length < 3) return [];

        const radians = angleDeg * (Math.PI / 180);
        const cos = Math.cos(-radians);
        const sin = Math.sin(-radians);
        const rotatePoint = (p) => ({
            x: p.x * cos - p.y * sin,
            y: p.x * sin + p.y * cos
        });
        const invCos = Math.cos(radians);
        const invSin = Math.sin(radians);
        const inverseRotatePoint = (p) => ({
            x: p.x * invCos - p.y * invSin,
            y: p.x * invSin + p.y * invCos
        });

        const rotated = boundaryPoints.map(rotatePoint);
        const bbox = Hatch.getPointsBoundingBox(rotated);

        const effSpacing = Math.max(spacing, 0.001);
        const maxDim = Math.max(bbox.maxY - bbox.minY, bbox.maxX - bbox.minX);
        const clampedSpacing = Math.min(effSpacing, maxDim || 1);
        // Limit total line count to prevent performance issues
        const maxLines = 500;
        const adjustedSpacing = Math.max(clampedSpacing, maxDim / maxLines);

        const startY = bbox.minY + (phaseOffset || 0);
        const segments = [];

        for (let y = startY; y <= bbox.maxY; y += adjustedSpacing) {
            // Also scan below startY if phase pushed us up
            if (y < bbox.minY) continue;

            const intersections = [];
            for (let i = 0; i < rotated.length; i++) {
                const a = rotated[i];
                const b = rotated[(i + 1) % rotated.length];
                if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
                    const t = (y - a.y) / (b.y - a.y);
                    const x = a.x + t * (b.x - a.x);
                    intersections.push(x);
                }
            }
            intersections.sort((a, b) => a - b);

            for (let i = 0; i + 1 < intersections.length; i += 2) {
                const x1 = intersections[i];
                const x2 = intersections[i + 1];

                if (dashes && dashes.length >= 2) {
                    // Generate dashed segments
                    const dashPattern = dashes;
                    let x = x1;
                    let dashIdx = 0;
                    while (x < x2) {
                        const dashLen = dashPattern[dashIdx % dashPattern.length] * (spacing / 3.175);
                        const isDash = (dashIdx % 2 === 0);
                        const segEnd = Math.min(x + dashLen, x2);
                        if (isDash && segEnd > x) {
                            segments.push({
                                p1: inverseRotatePoint({ x: x, y }),
                                p2: inverseRotatePoint({ x: segEnd, y })
                            });
                        }
                        x += dashLen;
                        dashIdx++;
                    }
                } else {
                    // Continuous line
                    segments.push({
                        p1: inverseRotatePoint({ x: x1, y }),
                        p2: inverseRotatePoint({ x: x2, y })
                    });
                }
            }
        }

        // Fill below phaseOffset too
        if (phaseOffset && phaseOffset > 0) {
            for (let y = startY - adjustedSpacing; y >= bbox.minY; y -= adjustedSpacing) {
                const intersections = [];
                for (let i = 0; i < rotated.length; i++) {
                    const a = rotated[i];
                    const b = rotated[(i + 1) % rotated.length];
                    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
                        const t = (y - a.y) / (b.y - a.y);
                        const x = a.x + t * (b.x - a.x);
                        intersections.push(x);
                    }
                }
                intersections.sort((a, b) => a - b);
                for (let i = 0; i + 1 < intersections.length; i += 2) {
                    segments.push({
                        p1: inverseRotatePoint({ x: intersections[i], y }),
                        p2: inverseRotatePoint({ x: intersections[i + 1], y })
                    });
                }
            }
        }

        return segments;
    }

    static getBoundaryPoints(boundary) {
        if (!boundary) return [];
        if (Array.isArray(boundary)) {
            if (boundary.length === 0) return [];
            if (boundary[0].x !== undefined) {
                return boundary;
            }
            if (boundary[0].type || boundary[0].p1 || boundary[0].p2) {
                return Hatch.edgesToPoints(boundary);
            }
        }
        if (boundary.points) {
            return boundary.points;
        }
        return [];
    }

    static chainLines(lines) {
        if (!lines.length) return [];
        const remaining = lines.slice();
        const loop = [remaining[0].p1, remaining[0].p2];
        remaining.splice(0, 1);
        const matches = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
        while (remaining.length) {
            const end = loop[loop.length - 1];
            const index = remaining.findIndex(line => matches(line.p1, end) || matches(line.p2, end));
            if (index === -1) break;
            const line = remaining.splice(index, 1)[0];
            if (matches(line.p1, end)) {
                loop.push(line.p2);
            } else {
                loop.push(line.p1);
            }
        }
        return loop;
    }

    getBoundaryEdges() {
        return Hatch.getBoundaryEdges(this.boundary);
    }

    static getBoundaryEdges(boundary) {
        if (!boundary) return [];
        if (Array.isArray(boundary)) {
            if (boundary.length === 0) return [];
            const first = boundary[0];
            if (first.type === 'line' || first.type === 'arc') {
                return boundary.map(edge => Hatch.normalizeEdge(edge)).filter(Boolean);
            }
            if (first.p1 && first.p2) {
                return boundary.map(edge => ({
                    type: 'line',
                    start: edge.p1,
                    end: edge.p2
                }));
            }
            if (first.x !== undefined) {
                return Hatch.pointsToEdges(boundary);
            }
        }
        if (boundary.points) {
            return Hatch.pointsToEdges(boundary.points);
        }
        return [];
    }

    static normalizeEdge(edge) {
        if (!edge) return null;
        if (edge.type === 'line') {
            return {
                type: 'line',
                start: edge.start || edge.p1,
                end: edge.end || edge.p2
            };
        }
        if (edge.type === 'arc') {
            return {
                type: 'arc',
                center: edge.center,
                radius: edge.radius ?? edge.r ?? 0,
                start: edge.start,
                end: edge.end,
                ccw: edge.ccw !== undefined ? edge.ccw : true
            };
        }
        return null;
    }

    static pointsToEdges(points) {
        if (!points || points.length < 2) return [];
        const edges = [];
        for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length];
            edges.push({ type: 'line', start, end });
        }
        return edges;
    }

    static edgesToPoints(edges) {
        if (!edges || edges.length === 0) return [];
        const points = [];
        edges.forEach(edge => {
            if (edge.type === 'arc' && edge.center) {
                const radius = edge.radius ?? edge.r ?? 0;
                const start = edge.start ?? 0;
                const end = edge.end ?? 0;
                const ccw = edge.ccw !== false;
                const total = ccw ? (end - start) : (start - end);
                const sweep = total >= 0 ? total : (Math.PI * 2 + total);
                // Adaptive step count based on arc length
                const arcLen = Math.abs(sweep) * radius;
                const steps = Math.max(8, Math.min(64, Math.ceil(arcLen / 2)));
                for (let i = 0; i <= steps; i++) {
                    const angle = start + (ccw ? 1 : -1) * (sweep * (i / steps));
                    points.push({
                        x: edge.center.x + Math.cos(angle) * radius,
                        y: edge.center.y + Math.sin(angle) * radius
                    });
                }
            } else {
                const start = edge.start || edge.p1;
                if (start) {
                    points.push(start);
                }
            }
        });
        return points;
    }

    static getPointsBoundingBox(points) {
        if (!points || points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }
        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;
        points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        return { minX, minY, maxX, maxY };
    }

    static collectIntersections(points, dir, normal, offset) {
        const intersections = [];
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            const hit = Hatch.intersectLineSegment(a, b, dir, normal, offset);
            if (hit) {
                intersections.push(hit);
            }
        }
        intersections.sort((p1, p2) => {
            const t1 = p1.x * dir.x + p1.y * dir.y;
            const t2 = p2.x * dir.x + p2.y * dir.y;
            return t1 - t2;
        });
        return intersections;
    }

    static collectEdgeIntersections(edges, dir, normal, offset) {
        const hits = [];
        edges.forEach(edge => {
            if (edge.type === 'arc') {
                Hatch.intersectLineArc(edge, dir, normal, offset).forEach(point => hits.push(point));
            } else {
                const start = edge.start || edge.p1;
                const end = edge.end || edge.p2;
                const hit = Hatch.intersectLineSegment(start, end, dir, normal, offset);
                if (hit) hits.push(hit);
            }
        });
        hits.sort((p1, p2) => {
            const t1 = p1.x * dir.x + p1.y * dir.y;
            const t2 = p2.x * dir.x + p2.y * dir.y;
            return t1 - t2;
        });
        return hits;
    }

    static intersectLineSegment(a, b, dir, normal, offset) {
        const denom = (b.x - a.x) * normal.x + (b.y - a.y) * normal.y;
        if (Math.abs(denom) < 1e-10) return null;
        const t = (offset - (a.x * normal.x + a.y * normal.y)) / denom;
        if (t < 0 || t > 1) return null;
        return {
            x: a.x + t * (b.x - a.x),
            y: a.y + t * (b.y - a.y)
        };
    }

    static intersectLineArc(edge, dir, normal, offset) {
        const center = edge.center;
        if (!center) return [];
        const radius = edge.radius ?? edge.r ?? 0;
        if (!radius) return [];
        const lineOrigin = {
            x: normal.x * offset,
            y: normal.y * offset
        };
        const dx = lineOrigin.x - center.x;
        const dy = lineOrigin.y - center.y;
        const b = 2 * (dir.x * dx + dir.y * dy);
        const c = dx * dx + dy * dy - radius * radius;
        const discriminant = b * b - 4 * c;
        if (discriminant < 0) return [];
        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / 2;
        const t2 = (-b + sqrtDisc) / 2;
        const points = [
            { x: lineOrigin.x + dir.x * t1, y: lineOrigin.y + dir.y * t1 },
            { x: lineOrigin.x + dir.x * t2, y: lineOrigin.y + dir.y * t2 }
        ];
        const start = Hatch.normalizeAngle(edge.start);
        const end = Hatch.normalizeAngle(edge.end);
        const ccw = edge.ccw !== false;
        return points.filter(point => {
            const angle = Hatch.normalizeAngle(Math.atan2(point.y - center.y, point.x - center.x));
            return Hatch.isAngleOnArc(angle, start, end, ccw);
        });
    }

    static normalizeAngle(angle) {
        const twoPi = Math.PI * 2;
        if (Math.abs(angle) > twoPi + 0.001) {
            angle = angle * (Math.PI / 180);
        }
        let normalized = angle % twoPi;
        if (normalized < 0) normalized += twoPi;
        return normalized;
    }

    static isAngleOnArc(angle, start, end, ccw = true) {
        if (ccw) {
            if (start <= end) return angle >= start && angle <= end;
            return angle >= start || angle <= end;
        }
        if (end <= start) return angle <= start && angle >= end;
        return angle <= start || angle >= end;
    }
}

Geometry.Line = Line;
Geometry.Circle = Circle;
Geometry.Arc = Arc;
Geometry.LwPolyline = LwPolyline;
Geometry.Text = Text;
Geometry.Insert = Insert;
Geometry.Hatch = Hatch;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Geometry;
}
