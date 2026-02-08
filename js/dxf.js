/* ============================================
   BrowserCAD - DXF Parser/Exporter
   ============================================
   Coordinate convention:
   - DXF uses Y-up coordinate system
   - BrowserCAD internal uses Y-down (canvas)
   - This module works in DXF space for parsing (returns raw DXF coords)
   - mapDxfEntityToCad in storage.js handles Y-flip + angle conversion
   - Export functions handle Y-flip + angle conversion for writing
   ============================================ */

const DXF = (() => {
    const DEFAULT_HEADER = {
        $ACADVER: 'AC1015',
        $INSUNITS: 4
    };

    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;

    const parseNumber = (value, fallback = 0) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const parseIntValue = (value, fallback = 0) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const formatNumber = (value) => {
        const num = Number.isFinite(value) ? value : 0;
        return num.toFixed(6);
    };

    // ============================================
    // Handle system for AC1015 compliance
    // ============================================
    let _handleCounter = 0;
    // Start at 0x100 to avoid reserved/well-known handle ranges (0x00–0xFF)
    const resetHandles = () => { _handleCounter = 0x100; };
    const nextHandle = () => {
        const h = _handleCounter.toString(16).toUpperCase();
        _handleCounter++;
        return h;
    };
    // Get current handle counter value (for $HANDSEED)
    const getHandleSeed = () => _handleCounter.toString(16).toUpperCase();

    // Format the DXF output array as CRLF-separated code/value pairs
    const formatOutput = (out) => {
        const result = [];
        for (let i = 0; i < out.length; i += 2) {
            result.push(String(out[i]));
            result.push(String(out[i + 1]));
        }
        return result.join('\r\n') + '\r\n';
    };

    // Write entity header with handle and owner (330 is always written)
    const writeEntityHeader = (out, dxfType, entity, ownerHandle) => {
        out.push('0', dxfType);
        out.push('5', nextHandle());
        out.push('330', ownerHandle || '0');
        out.push('100', 'AcDbEntity');
        out.push('8', entity.layer || '0');
    };

    // Convert 24-bit RGB integer to #RRGGBB hex string
    const intToHex = (intColor) => {
        if (!intColor && intColor !== 0) return null;
        const n = parseInt(intColor, 10);
        if (!Number.isFinite(n) || n < 0) return null;
        const r = (n >> 16) & 0xFF;
        const g = (n >> 8) & 0xFF;
        const b = n & 0xFF;
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // Parse DXF tolerance string into frames array
    const parseTolString = (str) => {
        if (!str) return [{ symbol: '', tolerance1: '', datum1: '', datum2: '', datum3: '' }];
        const frames = [];
        const parts = str.split('%%v');
        let frame = { symbol: '', tolerance1: '', datum1: '', datum2: '', datum3: '' };
        let fieldIdx = 0;
        for (const part of parts) {
            const cleaned = part.replace(/%%c/g, '');
            if (fieldIdx === 0) {
                // First part may contain symbol + tolerance
                const match = cleaned.match(/^([^\d]*)(.*)$/);
                if (match) {
                    frame.symbol = match[1] || '';
                    frame.tolerance1 = match[2] || '';
                }
                frame.diameterSymbol = part.includes('%%c');
            } else if (fieldIdx === 1) frame.datum1 = cleaned;
            else if (fieldIdx === 2) frame.datum2 = cleaned;
            else if (fieldIdx === 3) {
                frame.datum3 = cleaned;
                frames.push(frame);
                frame = { symbol: '', tolerance1: '', datum1: '', datum2: '', datum3: '' };
                fieldIdx = -1;
            }
            fieldIdx++;
        }
        if (frame.symbol || frame.tolerance1 || frame.datum1) frames.push(frame);
        if (frames.length === 0) frames.push({ symbol: '', tolerance1: str, datum1: '', datum2: '', datum3: '' });
        return frames;
    };

    // Convert #RRGGBB hex to 24-bit RGB integer
    const hexToInt = (hex) => {
        if (!hex || typeof hex !== 'string') return 0;
        hex = hex.replace('#', '');
        return parseInt(hex, 16) || 0;
    };

    const readPairs = (lines) => {
        let index = 0;
        const next = () => {
            if (index >= lines.length - 1) return null;
            const code = parseInt(lines[index]?.trim() ?? '', 10);
            const value = (lines[index + 1] ?? '').trim();
            index += 2;
            if (Number.isNaN(code)) return null;
            return { code, value };
        };
        const peek = () => {
            if (index >= lines.length - 1) return null;
            const code = parseInt(lines[index]?.trim() ?? '', 10);
            const value = (lines[index + 1] ?? '').trim();
            if (Number.isNaN(code)) return null;
            return { code, value };
        };
        return { next, peek };
    };

    // ==========================================
    // PARSING
    // ==========================================

    const parseHeader = (reader, data) => {
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0 && peek.value === 'ENDSEC') {
                reader.next();
                break;
            }
            const pair = reader.next();
            if (!pair) break;
            if (pair.code === 9) {
                const name = pair.value;
                const values = {};
                while (reader.peek() && reader.peek().code !== 9 && reader.peek().code !== 0) {
                    const tag = reader.next();
                    values[tag.code] = tag.value;
                }
                if (name === '$ACADVER' && values[1]) {
                    data.header.$ACADVER = values[1];
                } else if (name === '$INSUNITS' && values[70]) {
                    data.header.$INSUNITS = parseIntValue(values[70], data.header.$INSUNITS);
                } else if (name === '$EXTMIN') {
                    data.header.$EXTMIN = {
                        x: parseNumber(values[10]),
                        y: parseNumber(values[20])
                    };
                } else if (name === '$EXTMAX') {
                    data.header.$EXTMAX = {
                        x: parseNumber(values[10]),
                        y: parseNumber(values[20])
                    };
                } else if (name === '$CLAYER' && values[8]) {
                    data.header.$CLAYER = values[8];
                } else if (name === '$PDMODE' && values[70]) {
                    data.header.$PDMODE = parseIntValue(values[70]);
                } else if (name === '$PDSIZE' && values[40]) {
                    data.header.$PDSIZE = parseNumber(values[40]);
                } else if (name === '$DIMSCALE' && values[40]) {
                    data.header.$DIMSCALE = parseNumber(values[40]);
                } else if (name === '$DIMTXT' && values[40]) {
                    data.header.$DIMTXT = parseNumber(values[40]);
                }
            }
        }
    };

    const parseTables = (reader, data) => {
        let currentTable = null;
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0 && peek.value === 'ENDSEC') {
                reader.next();
                break;
            }
            const pair = reader.next();
            if (!pair) break;
            if (pair.code === 0 && pair.value === 'TABLE') {
                const nameTag = reader.next();
                currentTable = nameTag?.code === 2 ? nameTag.value : null;
            } else if (pair.code === 0 && pair.value === 'ENDTAB') {
                currentTable = null;
            } else if (pair.code === 0 && currentTable === 'LAYER' && pair.value === 'LAYER') {
                const layerTags = {};
                while (reader.peek() && reader.peek().code !== 0) {
                    const tag = reader.next();
                    layerTags[tag.code] = tag.value;
                }
                const name = layerTags[2] || '0';
                const flags = parseIntValue(layerTags[70]);
                const rawColor = parseIntValue(layerTags[62], 7);
                const color = Math.abs(rawColor);
                const layerObj = {
                    name,
                    color,
                    visible: rawColor >= 0,
                    frozen: (flags & 1) === 1,
                    locked: (flags & 4) === 4
                };
                // Linetype (code 6)
                if (layerTags[6]) {
                    layerObj.lineType = layerTags[6];
                }
                // Lineweight (code 370) - in hundredths of mm
                if (layerTags[370] !== undefined) {
                    layerObj.lineWeight = parseIntValue(layerTags[370]);
                }
                // True color (code 420)
                if (layerTags[420]) {
                    layerObj.trueColor = intToHex(layerTags[420]);
                }
                data.layers[name] = layerObj;
            } else if (pair.code === 0 && currentTable === 'LTYPE' && pair.value === 'LTYPE') {
                const ltypeTags = { dashes: [] };
                while (reader.peek() && reader.peek().code !== 0) {
                    const tag = reader.next();
                    if (tag.code === 2) ltypeTags.name = tag.value;
                    else if (tag.code === 3) ltypeTags.description = tag.value;
                    else if (tag.code === 73) ltypeTags.numDashes = parseIntValue(tag.value);
                    else if (tag.code === 49) ltypeTags.dashes.push(parseNumber(tag.value));
                    else if (tag.code === 40) ltypeTags.patternLength = parseNumber(tag.value);
                }
                if (ltypeTags.name) {
                    if (!data.linetypes) data.linetypes = {};
                    data.linetypes[ltypeTags.name.toUpperCase()] = ltypeTags;
                }
            } else if (pair.code === 0 && currentTable === 'DIMSTYLE' && pair.value === 'DIMSTYLE') {
                const dimTags = {};
                while (reader.peek() && reader.peek().code !== 0) {
                    const tag = reader.next();
                    dimTags[tag.code] = tag.value;
                }
                if (dimTags[2]) {
                    if (!data.dimstyles) data.dimstyles = {};
                    data.dimstyles[dimTags[2]] = {
                        name: dimTags[2],
                        dimscale: parseNumber(dimTags[40], 1),
                        dimtxt: parseNumber(dimTags[140], 2.5),
                        dimasz: parseNumber(dimTags[41], 2.5)
                    };
                }
            } else if (pair.code === 0 && currentTable === 'STYLE' && pair.value === 'STYLE') {
                const styleTags = {};
                while (reader.peek() && reader.peek().code !== 0) {
                    const tag = reader.next();
                    styleTags[tag.code] = tag.value;
                }
                if (styleTags[2]) {
                    if (!data.textstyles) data.textstyles = {};
                    data.textstyles[styleTags[2]] = {
                        name: styleTags[2],
                        height: parseNumber(styleTags[40]),
                        widthFactor: parseNumber(styleTags[41], 1),
                        font: styleTags[3] || ''
                    };
                }
            }
        }
    };

    const parseLwPolyline = (tags) => {
        const points = [];
        let current = null;
        tags.list.forEach(tag => {
            if (tag.code === 10) {
                if (current) points.push(current);
                current = { x: parseNumber(tag.value), y: 0, bulge: 0 };
            } else if (tag.code === 20 && current) {
                current.y = parseNumber(tag.value);
            } else if (tag.code === 30 && current) {
                current.z = parseNumber(tag.value);
            } else if (tag.code === 42 && current) {
                current.bulge = parseNumber(tag.value);
            }
        });
        if (current) points.push(current);
        const vertexCount = parseIntValue(tags[90], 0);
        if (vertexCount && points.length < vertexCount) {
            while (points.length < vertexCount) {
                points.push({ x: 0, y: 0, bulge: 0 });
            }
        }
        const closed = (parseIntValue(tags[70]) & 1) === 1;
        return { points, closed };
    };

    const parseEntityTags = (reader) => {
        const tags = { list: [] };
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0) break;
            const tag = reader.next();
            tags.list.push(tag);
            if (tags[tag.code] === undefined) {
                tags[tag.code] = tag.value;
            }
        }
        return tags;
    };

    // Extract common style info from entity tags
    const getEntityStyle = (tags) => {
        const style = {};
        // Layer (code 8 - already extracted)
        // Color: ACI color (code 62), True color (code 420)
        if (tags[420]) {
            style.trueColor = intToHex(tags[420]);
        }
        if (tags[62]) {
            style.aciColor = parseIntValue(tags[62]);
        }
        // Linetype (code 6)
        if (tags[6]) {
            style.lineType = tags[6];
        }
        // Lineweight (code 370)
        if (tags[370] !== undefined) {
            style.lineWeight = parseIntValue(tags[370]);
        }
        return style;
    };

    // All values returned in DXF coordinate space (Y-up, angles in degrees)
    const parseEntity = (type, reader) => {
        const tags = parseEntityTags(reader);
        const layer = tags[8] || '0';
        const style = getEntityStyle(tags);

        switch (type) {
            case 'LINE':
                return {
                    type: 'line',
                    layer,
                    ...style,
                    p1: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    p2: { x: parseNumber(tags[11]), y: parseNumber(tags[21]), z: parseNumber(tags[31]) }
                };
            case 'CIRCLE':
                return {
                    type: 'circle',
                    layer,
                    ...style,
                    center: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    r: parseNumber(tags[40])
                };
            case 'ARC':
                return {
                    type: 'arc',
                    layer,
                    ...style,
                    center: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    r: parseNumber(tags[40]),
                    // Return angles in DEGREES (raw DXF values)
                    // mapDxfEntityToCad handles deg→rad conversion + Y-flip swap
                    start: parseNumber(tags[50]),
                    end: parseNumber(tags[51])
                };
            case 'LWPOLYLINE': {
                const poly = parseLwPolyline(tags);
                return {
                    type: 'polyline',
                    layer,
                    ...style,
                    points: poly.points,
                    closed: poly.closed
                };
            }
            case 'POLYLINE': {
                // Old-style POLYLINE with VERTEX entities - just parse the header tags
                // The actual vertices are parsed in parseEntities
                return {
                    type: 'polyline_header',
                    layer,
                    ...style,
                    flags: parseIntValue(tags[70]),
                    points: [],
                    closed: (parseIntValue(tags[70]) & 1) === 1
                };
            }
            case 'TEXT':
            case 'MTEXT': {
                const textChunks = [];
                tags.list.forEach(tag => {
                    if (tag.code === 1 || tag.code === 3) {
                        textChunks.push(tag.value);
                    }
                });
                return {
                    type: type.toLowerCase(),
                    layer,
                    ...style,
                    text: textChunks.join('') || '',
                    position: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    height: parseNumber(tags[40], 10),
                    // Rotation in DEGREES (raw DXF value)
                    rotation: parseNumber(tags[50], 0),
                    // MTEXT width (code 41)
                    width: parseNumber(tags[41], 0)
                };
            }
            case 'POINT':
                return {
                    type: 'point',
                    layer,
                    ...style,
                    point: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) }
                };
            case 'ELLIPSE': {
                // DXF ELLIPSE: center (10/20), major axis endpoint relative to center (11/21),
                // ratio minor/major (40), start param (41), end param (42)
                const majorX = parseNumber(tags[11]);
                const majorY = parseNumber(tags[21]);
                const ratio = parseNumber(tags[40], 1);
                const majorRadius = Math.sqrt(majorX * majorX + majorY * majorY);
                const minorRadius = majorRadius * ratio;
                // Rotation is derived from the major axis direction
                const rotation = Math.atan2(majorY, majorX);
                return {
                    type: 'ellipse',
                    layer,
                    ...style,
                    center: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    rx: majorRadius,
                    ry: minorRadius,
                    // Rotation in RADIANS (derived from geometry, not a raw DXF angle)
                    rotation: rotation,
                    startParam: parseNumber(tags[41], 0),
                    endParam: parseNumber(tags[42], Math.PI * 2)
                };
            }
            case 'SPLINE': {
                // Parse control points and fit points
                const controlPoints = [];
                const fitPoints = [];
                const knots = [];
                let readingControl = false;
                let readingFit = false;
                let cpCurrent = null;
                let fpCurrent = null;
                tags.list.forEach(tag => {
                    if (tag.code === 10) {
                        if (cpCurrent) controlPoints.push(cpCurrent);
                        cpCurrent = { x: parseNumber(tag.value), y: 0 };
                        readingControl = true;
                        readingFit = false;
                    } else if (tag.code === 20 && cpCurrent && readingControl) {
                        cpCurrent.y = parseNumber(tag.value);
                    } else if (tag.code === 11) {
                        if (fpCurrent) fitPoints.push(fpCurrent);
                        fpCurrent = { x: parseNumber(tag.value), y: 0 };
                        readingFit = true;
                        readingControl = false;
                    } else if (tag.code === 21 && fpCurrent && readingFit) {
                        fpCurrent.y = parseNumber(tag.value);
                    } else if (tag.code === 40) {
                        knots.push(parseNumber(tag.value));
                    }
                });
                if (cpCurrent) controlPoints.push(cpCurrent);
                if (fpCurrent) fitPoints.push(fpCurrent);
                // Prefer fit points for smoother curves
                const points = fitPoints.length >= 2 ? fitPoints : controlPoints;
                const flags = parseIntValue(tags[70]);
                return {
                    type: 'spline',
                    layer,
                    ...style,
                    points: points,
                    controlPoints: controlPoints,
                    fitPoints: fitPoints,
                    knots: knots,
                    degree: parseIntValue(tags[71], 3),
                    closed: (flags & 1) !== 0,
                    flags: flags
                };
            }
            case 'LEADER': {
                const leaderPoints = [];
                let lpCurrent = null;
                tags.list.forEach(tag => {
                    if (tag.code === 10) {
                        if (lpCurrent) leaderPoints.push(lpCurrent);
                        lpCurrent = { x: parseNumber(tag.value), y: 0 };
                    } else if (tag.code === 20 && lpCurrent) {
                        lpCurrent.y = parseNumber(tag.value);
                    }
                });
                if (lpCurrent) leaderPoints.push(lpCurrent);
                if (leaderPoints.length < 2) return null;
                return {
                    type: 'leader',
                    layer,
                    ...style,
                    points: leaderPoints,
                    text: tags[3] || '',
                    height: parseNumber(tags[40], 0)
                };
            }
            case 'SOLID':
            case 'TRACE':
            case '3DFACE': {
                // 4 corner points: 10/20, 11/21, 12/22, 13/23
                const solidPoints = [];
                for (const [xCode, yCode] of [[10,20],[11,21],[12,22],[13,23]]) {
                    if (tags[xCode] !== undefined) {
                        solidPoints.push({
                            x: parseNumber(tags[xCode]),
                            y: parseNumber(tags[yCode])
                        });
                    }
                }
                if (solidPoints.length < 3) return null;
                return {
                    type: type === 'TRACE' ? 'trace' : 'solid',
                    layer,
                    ...style,
                    points: solidPoints
                };
            }
            case 'DIMENSION': {
                const dimType = parseIntValue(tags[70]) & 0x07; // Low 3 bits = dim type
                return {
                    type: 'dimension',
                    layer,
                    ...style,
                    dimType: dimType,
                    // Definition point (10/20)
                    defPoint: { x: parseNumber(tags[10]), y: parseNumber(tags[20]) },
                    // Middle point of dimension text (11/21)
                    textMid: { x: parseNumber(tags[11]), y: parseNumber(tags[21]) },
                    // First extension line origin (13/23)
                    ext1: { x: parseNumber(tags[13]), y: parseNumber(tags[23]) },
                    // Second extension line origin (14/24)
                    ext2: { x: parseNumber(tags[14]), y: parseNumber(tags[24]) },
                    // Rotation angle for linear dims (code 50)
                    rotation: parseNumber(tags[50]),
                    // Dimension text override (code 1)
                    text: tags[1] || '',
                    // Block name for rendered graphics (code 2)
                    blockName: tags[2] || '',
                    // Dimension style (code 3)
                    dimStyle: tags[3] || 'STANDARD'
                };
            }
            case 'INSERT': {
                const scaleX = parseNumber(tags[41], 1);
                const scaleY = parseNumber(tags[42], scaleX || 1);
                return {
                    type: 'insert',
                    layer,
                    ...style,
                    blockName: tags[2] || '',
                    p: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    scale: { x: scaleX || 1, y: scaleY || 1 },
                    // Rotation in DEGREES (raw DXF value)
                    rotation: parseNumber(tags[50], 0)
                };
            }
            case 'HATCH': {
                const edges = [];
                let loopCount = 0;
                let solid = 0;
                for (let i = 0; i < tags.list.length; i++) {
                    const tag = tags.list[i];
                    if (tag.code === 91) {
                        loopCount = parseIntValue(tag.value, 0);
                    }
                    if (tag.code === 70) {
                        solid = parseIntValue(tag.value, 0);
                    }
                    if (tag.code === 93) {
                        let edgeCount = parseIntValue(tag.value, 0);
                        let edgesParsed = 0;
                        for (let j = i + 1; j < tags.list.length && edgesParsed < edgeCount; j++) {
                            const edgeTag = tags.list[j];
                            if (edgeTag.code === 72) {
                                const edgeType = parseIntValue(edgeTag.value, 0);
                                if (edgeType === 1) {
                                    const edge = { type: 'line', start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
                                    for (let k = j + 1; k < tags.list.length; k++) {
                                        const dataTag = tags.list[k];
                                        if (dataTag.code === 72 || dataTag.code === 97 || dataTag.code === 75) {
                                            j = k - 1;
                                            break;
                                        }
                                        if (dataTag.code === 10) edge.start.x = parseNumber(dataTag.value);
                                        if (dataTag.code === 20) edge.start.y = parseNumber(dataTag.value);
                                        if (dataTag.code === 11) edge.end.x = parseNumber(dataTag.value);
                                        if (dataTag.code === 21) edge.end.y = parseNumber(dataTag.value);
                                    }
                                    edges.push(edge);
                                    edgesParsed += 1;
                                } else if (edgeType === 2) {
                                    const edge = { type: 'arc', center: { x: 0, y: 0 }, radius: 0, start: 0, end: 0, ccw: true };
                                    for (let k = j + 1; k < tags.list.length; k++) {
                                        const dataTag = tags.list[k];
                                        if (dataTag.code === 72 || dataTag.code === 97 || dataTag.code === 75) {
                                            j = k - 1;
                                            break;
                                        }
                                        if (dataTag.code === 10) edge.center.x = parseNumber(dataTag.value);
                                        if (dataTag.code === 20) edge.center.y = parseNumber(dataTag.value);
                                        if (dataTag.code === 40) edge.radius = parseNumber(dataTag.value);
                                        // Hatch edge arc angles in DEGREES
                                        if (dataTag.code === 50) edge.start = parseNumber(dataTag.value);
                                        if (dataTag.code === 51) edge.end = parseNumber(dataTag.value);
                                        if (dataTag.code === 73) edge.ccw = parseIntValue(dataTag.value, 1) === 1;
                                    }
                                    edges.push(edge);
                                    edgesParsed += 1;
                                }
                            }
                        }
                    }
                }

                // Also try to extract polyline boundary (code 10/20 pairs in sequence)
                const boundaryPoints = [];
                let hasBoundaryFlag = false;
                for (let i = 0; i < tags.list.length; i++) {
                    if (tags.list[i].code === 92) {
                        const bType = parseIntValue(tags.list[i].value);
                        if ((bType & 2) !== 0) hasBoundaryFlag = true; // polyline boundary
                    }
                }
                if (hasBoundaryFlag || edges.length === 0) {
                    // Collect all 10/20 pairs that are boundary vertices
                    let inBoundary = false;
                    for (let i = 0; i < tags.list.length; i++) {
                        const t = tags.list[i];
                        if (t.code === 92) {
                            inBoundary = true;
                            continue;
                        }
                        if (t.code === 75 || t.code === 76 || t.code === 97) {
                            inBoundary = false;
                        }
                        if (inBoundary && t.code === 10) {
                            const pt = { x: parseNumber(t.value), y: 0 };
                            if (i + 1 < tags.list.length && tags.list[i + 1].code === 20) {
                                pt.y = parseNumber(tags.list[i + 1].value);
                            }
                            boundaryPoints.push(pt);
                        }
                    }
                }

                return {
                    type: 'hatch',
                    layer,
                    ...style,
                    pattern: tags[2] || 'ANSI31',
                    loopCount,
                    solid,
                    scale: parseNumber(tags[41], 1),
                    angle: parseNumber(tags[52], 0),
                    boundary: edges.length > 0 ? edges : undefined,
                    boundaryPoints: boundaryPoints.length >= 3 ? boundaryPoints : undefined
                };
            }
            case 'TOLERANCE': {
                return {
                    type: 'tolerance',
                    layer,
                    ...style,
                    position: {
                        x: parseNumber(tags[10] || 0),
                        y: parseNumber(tags[20] || 0)
                    },
                    height: parseNumber(tags[40] || 5),
                    frames: parseTolString(tags[1] || '')
                };
            }
            case 'ATTDEF': {
                return {
                    type: 'attdef',
                    layer,
                    ...style,
                    position: {
                        x: parseNumber(tags[10] || 0),
                        y: parseNumber(tags[20] || 0)
                    },
                    height: parseNumber(tags[40] || 2.5),
                    rotation: parseNumber(tags[50] || 0) * Math.PI / 180,
                    tag: tags[2] || '',
                    prompt: tags[3] || '',
                    defaultValue: tags[1] || '',
                    flags: parseInt(tags[70] || '0')
                };
            }
            case 'ATTRIB': {
                return {
                    type: 'attrib',
                    layer,
                    ...style,
                    position: {
                        x: parseNumber(tags[10] || 0),
                        y: parseNumber(tags[20] || 0)
                    },
                    height: parseNumber(tags[40] || 2.5),
                    rotation: parseNumber(tags[50] || 0) * Math.PI / 180,
                    tag: tags[2] || '',
                    value: tags[1] || '',
                    flags: parseInt(tags[70] || '0')
                };
            }
            case 'WIPEOUT': {
                // WIPEOUT uses group codes similar to IMAGE
                const wpPoints = [];
                if (Array.isArray(tags[14])) {
                    for (let i = 0; i < tags[14].length; i++) {
                        wpPoints.push({
                            x: parseNumber(tags[14][i]),
                            y: parseNumber((tags[24] || [])[i] || 0)
                        });
                    }
                }
                // Fallback: use insertion point and size to create boundary
                if (wpPoints.length === 0 && tags[10] !== undefined) {
                    const ix = parseNumber(tags[10]);
                    const iy = parseNumber(tags[20] || 0);
                    const ux = parseNumber(tags[11] || 100);
                    const vy = parseNumber(tags[22] || 100);
                    wpPoints.push(
                        { x: ix, y: iy },
                        { x: ix + ux, y: iy },
                        { x: ix + ux, y: iy + vy },
                        { x: ix, y: iy + vy }
                    );
                }
                if (wpPoints.length < 3) return null;
                return {
                    type: 'wipeout',
                    layer,
                    ...style,
                    points: wpPoints
                };
            }
            case 'VIEWPORT': {
                return {
                    type: 'viewport',
                    layer,
                    ...style,
                    center: {
                        x: parseNumber(tags[10] || 0),
                        y: parseNumber(tags[20] || 0)
                    },
                    width: parseNumber(tags[40] || 200),
                    height: parseNumber(tags[41] || 150),
                    viewCenter: {
                        x: parseNumber(tags[12] || 0),
                        y: parseNumber(tags[22] || 0)
                    },
                    viewHeight: parseNumber(tags[45] || 100),
                    status: parseInt(tags[68] || '0'),
                    id: parseInt(tags[69] || '0')
                };
            }
            default:
                return null;
        }
    };

    const parseBlocks = (reader, data) => {
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0 && peek.value === 'ENDSEC') {
                reader.next();
                break;
            }
            if (peek.code === 0 && peek.value === 'BLOCK') {
                reader.next();
                const blockTags = parseEntityTags(reader);
                const name = blockTags[2] || 'BLOCK';
                const basePoint = {
                    x: parseNumber(blockTags[10]),
                    y: parseNumber(blockTags[20]),
                    z: parseNumber(blockTags[30])
                };
                const entities = [];
                let polylineHeader = null;
                while (reader.peek()) {
                    const inner = reader.peek();
                    if (inner.code === 0 && inner.value === 'ENDBLK') {
                        reader.next();
                        // consume ENDBLK tags
                        while (reader.peek() && reader.peek().code !== 0) reader.next();
                        break;
                    }
                    if (inner.code === 0) {
                        const entityType = reader.next().value;
                        if (entityType === 'VERTEX' && polylineHeader) {
                            const vtags = parseEntityTags(reader);
                            const vx = parseNumber(vtags[10]);
                            const vy = parseNumber(vtags[20]);
                            polylineHeader.points.push({ x: vx, y: vy, bulge: parseNumber(vtags[42]) });
                        } else if (entityType === 'SEQEND' && polylineHeader) {
                            parseEntityTags(reader); // consume SEQEND tags
                            entities.push(polylineHeader);
                            polylineHeader = null;
                        } else {
                            const entity = parseEntity(entityType, reader);
                            if (entity) {
                                if (entity.type === 'polyline_header') {
                                    polylineHeader = {
                                        type: 'polyline',
                                        layer: entity.layer,
                                        points: [],
                                        closed: entity.closed,
                                        ...getEntityStyle({ list: [] })
                                    };
                                } else {
                                    entities.push(entity);
                                }
                            }
                        }
                    } else {
                        reader.next();
                    }
                }
                data.blocks[name] = {
                    name,
                    origin: basePoint,
                    entities
                };
                continue;
            }
            reader.next();
        }
    };

    const parseEntities = (reader, data) => {
        let polylineHeader = null;
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0 && peek.value === 'ENDSEC') {
                reader.next();
                break;
            }
            if (peek.code === 0) {
                const type = reader.next().value;
                // Handle old-style POLYLINE/VERTEX/SEQEND
                if (type === 'VERTEX' && polylineHeader) {
                    const vtags = parseEntityTags(reader);
                    const vx = parseNumber(vtags[10]);
                    const vy = parseNumber(vtags[20]);
                    polylineHeader.points.push({ x: vx, y: vy, bulge: parseNumber(vtags[42]) });
                } else if (type === 'SEQEND' && polylineHeader) {
                    parseEntityTags(reader); // consume SEQEND tags
                    data.entities.push(polylineHeader);
                    polylineHeader = null;
                } else {
                    const entity = parseEntity(type, reader);
                    if (entity) {
                        if (entity.type === 'polyline_header') {
                            polylineHeader = {
                                type: 'polyline',
                                layer: entity.layer,
                                points: [],
                                closed: entity.closed
                            };
                            if (entity.lineType) polylineHeader.lineType = entity.lineType;
                            if (entity.trueColor) polylineHeader.trueColor = entity.trueColor;
                            if (entity.aciColor) polylineHeader.aciColor = entity.aciColor;
                        } else {
                            data.entities.push(entity);
                        }
                    }
                }
            } else {
                reader.next();
            }
        }
    };

    const parseDXF = (dxfString) => {
        const lines = dxfString.replace(/\r\n/g, '\n').split('\n');
        const reader = readPairs(lines);
        const data = {
            header: { ...DEFAULT_HEADER, $EXTMIN: { x: 0, y: 0 }, $EXTMAX: { x: 0, y: 0 } },
            layers: { '0': { name: '0', color: 7, visible: true, frozen: false, locked: false } },
            blocks: {},
            entities: []
        };

        while (reader.peek()) {
            const pair = reader.next();
            if (!pair) break;
            if (pair.code === 0 && pair.value === 'SECTION') {
                const section = reader.next();
                const name = section?.code === 2 ? section.value : '';
                if (name === 'HEADER') {
                    parseHeader(reader, data);
                } else if (name === 'TABLES') {
                    parseTables(reader, data);
                } else if (name === 'BLOCKS') {
                    parseBlocks(reader, data);
                } else if (name === 'ENTITIES') {
                    parseEntities(reader, data);
                } else {
                    while (reader.peek()) {
                        const peek = reader.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            reader.next();
                            break;
                        }
                        reader.next();
                    }
                }
            }
        }

        return data;
    };

    // ==========================================
    // EXPORT - All write functions convert from
    // CAD internal (Y-down, radians) to DXF (Y-up, degrees)
    // ==========================================

    const writeColor = (out, entity) => {
        // Write ACI color (code 62) and/or true color (code 420)
        const color = entity.color;
        if (color && typeof color === 'string' && color.startsWith('#')) {
            out.push('420', String(hexToInt(color)));
        }
    };

    const writeLinetype = (out, entity) => {
        if (entity.lineType && entity.lineType !== 'continuous') {
            out.push('6', entity.lineType.toUpperCase());
        }
    };

    const writeCommonStyle = (out, entity) => {
        writeColor(out, entity);
        writeLinetype(out, entity);
    };

    const writeTables = (out, layers = [], state = null) => {
        out.push('0', 'SECTION', '2', 'TABLES');

        // VPORT table (required)
        const vportTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'VPORT');
        out.push('5', vportTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '1');
        out.push('0', 'VPORT');
        out.push('5', nextHandle());
        out.push('330', vportTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbViewportTableRecord');
        out.push('2', '*ACTIVE');
        out.push('70', '0');
        out.push('10', '0.0', '20', '0.0');
        out.push('11', '1.0', '21', '1.0');
        out.push('12', '0.0', '22', '0.0');
        out.push('40', '1000.0');
        out.push('41', '1.0');
        out.push('0', 'ENDTAB');

        // LTYPE table
        const ltypeTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'LTYPE');
        out.push('5', ltypeTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '4');
        // ByBlock
        out.push('0', 'LTYPE');
        out.push('5', nextHandle());
        out.push('330', ltypeTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbLinetypeTableRecord');
        out.push('2', 'BYBLOCK', '70', '0', '3', '', '72', '65', '73', '0', '40', '0.0');
        // ByLayer
        out.push('0', 'LTYPE');
        out.push('5', nextHandle());
        out.push('330', ltypeTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbLinetypeTableRecord');
        out.push('2', 'BYLAYER', '70', '0', '3', '', '72', '65', '73', '0', '40', '0.0');
        // Continuous
        out.push('0', 'LTYPE');
        out.push('5', nextHandle());
        out.push('330', ltypeTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbLinetypeTableRecord');
        out.push('2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0');
        // Dashed
        out.push('0', 'LTYPE');
        out.push('5', nextHandle());
        out.push('330', ltypeTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbLinetypeTableRecord');
        out.push('2', 'DASHED', '70', '0', '3', '__ __ __ __', '72', '65', '73', '2', '40', '0.75');
        out.push('49', '0.5', '74', '0', '49', '-0.25', '74', '0');
        out.push('0', 'ENDTAB');

        // LAYER table
        const layerTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'LAYER');
        out.push('5', layerTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', String(layers.length || 1));
        const layerList = layers.length ? layers : [{ name: '0', color: 7, visible: true, frozen: false, locked: false }];
        layerList.forEach(layer => {
            const flags = (layer.frozen ? 1 : 0) | (layer.locked ? 4 : 0);
            const color = layer.color ?? 7;
            out.push('0', 'LAYER');
            out.push('5', nextHandle());
            out.push('330', layerTableHandle);
            out.push('100', 'AcDbSymbolTableRecord');
            out.push('100', 'AcDbLayerTableRecord');
            out.push('2', layer.name || '0');
            out.push('70', String(flags));
            out.push('62', String(layer.visible === false ? -Math.abs(color) : color));
            out.push('6', layer.lineType || 'CONTINUOUS');
            if (layer.lineWeight !== undefined && layer.lineWeight !== 'Default') {
                const lw = typeof layer.lineWeight === 'number' ? layer.lineWeight : -1;
                out.push('370', String(lw));
            }
        });
        out.push('0', 'ENDTAB');

        // STYLE table
        const styleTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'STYLE');
        out.push('5', styleTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '1');
        out.push('0', 'STYLE');
        out.push('5', nextHandle());
        out.push('330', styleTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbTextStyleTableRecord');
        out.push('2', 'STANDARD', '70', '0', '40', '0.0', '41', '1.0', '3', 'txt');
        out.push('0', 'ENDTAB');

        // VIEW table (empty but required)
        out.push('0', 'TABLE');
        out.push('2', 'VIEW');
        out.push('5', nextHandle());
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '0');
        out.push('0', 'ENDTAB');

        // UCS table (empty but required)
        out.push('0', 'TABLE');
        out.push('2', 'UCS');
        out.push('5', nextHandle());
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '0');
        out.push('0', 'ENDTAB');

        // APPID table (required)
        const appidTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'APPID');
        out.push('5', appidTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '1');
        out.push('0', 'APPID');
        out.push('5', nextHandle());
        out.push('330', appidTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbRegAppTableRecord');
        out.push('2', 'ACAD');
        out.push('70', '0');
        out.push('0', 'ENDTAB');

        // DIMSTYLE table
        const dimStyleTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'DIMSTYLE');
        out.push('5', dimStyleTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', '1');
        out.push('0', 'DIMSTYLE');
        out.push('105', nextHandle());
        out.push('330', dimStyleTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbDimStyleTableRecord');
        out.push('2', 'STANDARD');
        out.push('70', '0');
        out.push('40', '1.0');   // DIMSCALE
        out.push('140', '2.5');  // DIMTXT
        out.push('41', '2.5');   // DIMASZ
        out.push('0', 'ENDTAB');

        // BLOCK_RECORD table (must be last table in TABLES section)
        const userBlocks = Object.values(state?.blocks || {}).filter(
            b => b.name !== '*Model_Space' && b.name !== '*Paper_Space'
        );
        const blockRecTableHandle = nextHandle();
        out.push('0', 'TABLE');
        out.push('2', 'BLOCK_RECORD');
        out.push('5', blockRecTableHandle);
        out.push('330', '0');
        out.push('100', 'AcDbSymbolTable');
        out.push('70', String(2 + userBlocks.length));

        const modelSpaceHandle = nextHandle();
        out.push('0', 'BLOCK_RECORD');
        out.push('5', modelSpaceHandle);
        out.push('330', blockRecTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbBlockTableRecord');
        out.push('2', '*Model_Space');

        const paperSpaceHandle = nextHandle();
        out.push('0', 'BLOCK_RECORD');
        out.push('5', paperSpaceHandle);
        out.push('330', blockRecTableHandle);
        out.push('100', 'AcDbSymbolTableRecord');
        out.push('100', 'AcDbBlockTableRecord');
        out.push('2', '*Paper_Space');

        const blockHandles = {};
        userBlocks.forEach(block => {
            const h = nextHandle();
            out.push('0', 'BLOCK_RECORD');
            out.push('5', h);
            out.push('330', blockRecTableHandle);
            out.push('100', 'AcDbSymbolTableRecord');
            out.push('100', 'AcDbBlockTableRecord');
            out.push('2', block.name || 'BLOCK');
            blockHandles[block.name] = h;
        });

        out.push('0', 'ENDTAB');
        out.push('0', 'ENDSEC');

        return { modelSpaceHandle, paperSpaceHandle, blockHandles };
    };

    // Y-flip helper: negate Y for export
    const fy = (y) => -(y || 0);

    const writeEntityLine = (out, entity, ownerHandle) => {
        writeEntityHeader(out, 'LINE', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbLine');
        out.push('10', formatNumber(entity.p1?.x), '20', formatNumber(fy(entity.p1?.y)), '30', formatNumber(entity.p1?.z || 0));
        out.push('11', formatNumber(entity.p2?.x), '21', formatNumber(fy(entity.p2?.y)), '31', formatNumber(entity.p2?.z || 0));
    };

    const writeEntityCircle = (out, entity, ownerHandle) => {
        writeEntityHeader(out, 'CIRCLE', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbCircle');
        out.push('10', formatNumber(entity.center?.x), '20', formatNumber(fy(entity.center?.y)), '30', formatNumber(entity.center?.z || 0));
        out.push('40', formatNumber(entity.r || 0));
    };

    const writeEntityArc = (out, entity, ownerHandle) => {
        writeEntityHeader(out, 'ARC', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbCircle');
        out.push('10', formatNumber(entity.center?.x), '20', formatNumber(fy(entity.center?.y)), '30', formatNumber(entity.center?.z || 0));
        out.push('40', formatNumber(entity.r || 0));
        out.push('100', 'AcDbArc');
        // Convert internal radians to DXF degrees with Y-flip:
        // Swap start/end and negate to reverse the Y-flip transformation
        out.push('50', formatNumber(-(entity.end || 0) * RAD2DEG));
        out.push('51', formatNumber(-(entity.start || 0) * RAD2DEG));
    };

    const writeEntityLwPolyline = (out, entity, ownerHandle) => {
        const points = entity.points || [];
        const bulges = entity.bulges || [];
        const closedFlag = entity.closed ? 1 : 0;
        writeEntityHeader(out, 'LWPOLYLINE', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbPolyline');
        out.push('90', String(points.length));
        out.push('70', String(closedFlag));
        points.forEach((point, idx) => {
            out.push('10', formatNumber(point.x));
            out.push('20', formatNumber(fy(point.y)));
            if (point.z !== undefined) {
                out.push('30', formatNumber(point.z));
            }
            // Check both point.bulge and entity.bulges array
            const bulge = point.bulge || bulges[idx] || 0;
            if (Math.abs(bulge) > 1e-10) {
                // Negate bulge to compensate for Y-flip
                out.push('42', formatNumber(-bulge));
            }
        });
    };

    const writeEntityText = (out, entity, isMText = false, ownerHandle) => {
        writeEntityHeader(out, isMText ? 'MTEXT' : 'TEXT', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', isMText ? 'AcDbMText' : 'AcDbText');
        const pos = entity.position || { x: 0, y: 0 };
        out.push('10', formatNumber(pos.x), '20', formatNumber(fy(pos.y)), '30', formatNumber(pos.z || 0));
        out.push('40', formatNumber(entity.height || 0));
        out.push('1', entity.text || '');
        if (entity.rotation) {
            // Negate rotation for Y-flip (internal CCW in Y-down → CCW in Y-up)
            out.push('50', formatNumber(-(entity.rotation || 0) * RAD2DEG));
        }
        if (isMText && entity.width) {
            out.push('41', formatNumber(entity.width));
        }
    };

    const writeEntityPoint = (out, entity, ownerHandle) => {
        writeEntityHeader(out, 'POINT', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbPoint');
        const pos = entity.position || { x: 0, y: 0 };
        out.push('10', formatNumber(pos.x), '20', formatNumber(fy(pos.y)), '30', '0.0');
    };

    const writeEntityEllipse = (out, entity, ownerHandle) => {
        writeEntityHeader(out, 'ELLIPSE', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbEllipse');
        out.push('10', formatNumber(entity.center?.x), '20', formatNumber(fy(entity.center?.y)), '30', '0.0');
        // Major axis endpoint relative to center
        const rx = entity.rx || 0;
        const ry = entity.ry || 0;
        const rot = -(entity.rotation || 0); // Negate for Y-flip
        const majorX = rx * Math.cos(rot);
        const majorY = rx * Math.sin(rot);
        out.push('11', formatNumber(majorX), '21', formatNumber(majorY), '31', '0.0');
        // Ratio of minor to major
        const ratio = rx > 0 ? ry / rx : 1;
        out.push('40', formatNumber(ratio));
        out.push('41', '0.0');                          // start parameter
        out.push('42', formatNumber(Math.PI * 2));      // end parameter (full ellipse)
    };

    const writeEntitySpline = (out, entity, ownerHandle) => {
        let points = entity.points || [];
        if (points.length < 2) return;
        const degree = 3;
        const closed = entity.closed ? 1 : 0;

        // For closed splines, remove the duplicate closing point
        if (closed && points.length >= 3) {
            const first = points[0], last = points[points.length - 1];
            if (Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - (last.y)) < 1e-6) {
                points = points.slice(0, -1);
            }
        }

        writeEntityHeader(out, 'SPLINE', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbSpline');
        out.push('70', String(closed ? 11 : 8)); // flags: 8=planar, 1=closed, 2=periodic
        out.push('71', String(degree));

        // Use points as fit points
        const numFit = points.length;
        // For fit point spline, generate clamped knots
        const numKnots = numFit + degree + 1;
        out.push('72', String(numKnots));
        out.push('73', '0'); // 0 control points (fit point spline)
        out.push('74', String(numFit));

        // Knot values - clamped uniform
        for (let i = 0; i < degree + 1; i++) {
            out.push('40', '0.0');
        }
        for (let i = 1; i < numFit - degree; i++) {
            out.push('40', formatNumber(i));
        }
        for (let i = 0; i < degree + 1; i++) {
            out.push('40', formatNumber(Math.max(1, numFit - degree)));
        }

        // Fit points (code 11/21/31)
        points.forEach(pt => {
            out.push('11', formatNumber(pt.x), '21', formatNumber(fy(pt.y)), '31', '0.0');
        });
    };

    const writeEntityLeader = (out, entity, ownerHandle) => {
        const points = entity.points || [];
        if (points.length < 2) return;
        writeEntityHeader(out, 'LEADER', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbLeader');
        out.push('3', 'STANDARD'); // dimension style name
        out.push('71', '1');  // arrowhead flag
        out.push('72', '0');  // leader path type (straight)
        out.push('73', '0');  // leader creation flag
        out.push('76', String(points.length));
        points.forEach(pt => {
            out.push('10', formatNumber(pt.x), '20', formatNumber(fy(pt.y)), '30', '0.0');
        });
    };

    const writeEntityInsert = (out, entity, ownerHandle) => {
        const insertPoint = entity.insertPoint || { x: entity.x || 0, y: entity.y || 0, z: 0 };
        const scale = entity.scale || { x: entity.scaleX ?? 1, y: entity.scaleY ?? 1 };
        const rotation = entity.rotation || 0;
        // Negate rotation for Y-flip
        const rotationDeg = -rotation * RAD2DEG;
        writeEntityHeader(out, 'INSERT', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbBlockReference');
        out.push('2', entity.blockName || '');
        out.push('10', formatNumber(insertPoint.x), '20', formatNumber(fy(insertPoint.y)), '30', formatNumber(insertPoint.z || 0));
        out.push('41', formatNumber(scale.x ?? 1));
        out.push('42', formatNumber(scale.y ?? 1));
        out.push('50', formatNumber(rotationDeg));
    };

    const getHatchBoundaryEdges = (entity, state) => {
        if (entity.getBoundaryEdges) return entity.getBoundaryEdges();
        if (entity.boundary && entity.boundary.length) {
            if (entity.boundary[0].type || entity.boundary[0].p1 || entity.boundary[0].p2) {
                return entity.boundary;
            }
            if (entity.boundary[0].x !== undefined) {
                return typeof Geometry !== 'undefined' && Geometry?.Hatch?.getBoundaryEdges
                    ? Geometry.Hatch.getBoundaryEdges(entity.boundary)
                    : [];
            }
        }
        if (entity.clipIds && state?.getEntity) {
            const clip = state.getEntity(entity.clipIds[0]);
            if (clip?.points && typeof Geometry !== 'undefined' && Geometry?.Hatch?.getBoundaryEdges) {
                return Geometry.Hatch.getBoundaryEdges(clip.points);
            }
        }
        return [];
    };

    const writeEntityHatch = (out, entity, state, ownerHandle) => {
        const edges = getHatchBoundaryEdges(entity, state);
        if (!edges.length) return;
        const rawPattern = entity.patternName || entity.pattern || entity.hatch?.pattern || 'ANSI31';
        const pattern = rawPattern.toUpperCase();
        const scale = entity.scale || 1;
        const angle = entity.angle || 0;
        const isSolid = entity.solid === 1 || rawPattern.toLowerCase() === 'solid';
        writeEntityHeader(out, 'HATCH', entity, ownerHandle);
        writeCommonStyle(out, entity);
        out.push('100', 'AcDbHatch');
        out.push('10', '0.0');
        out.push('20', '0.0');
        out.push('30', '0.0');
        out.push('210', '0.0');
        out.push('220', '0.0');
        out.push('230', '1.0');
        out.push('2', pattern);
        out.push('70', isSolid ? '1' : '0');
        out.push('71', '0');
        out.push('91', '1');
        out.push('92', '1');
        out.push('93', String(edges.length));
        edges.forEach(edge => {
            if (edge.type === 'arc') {
                out.push('72', '2');
                out.push('10', formatNumber(edge.center.x));
                out.push('20', formatNumber(fy(edge.center.y)));
                out.push('40', formatNumber(edge.radius ?? edge.r ?? 0));
                // Edge angles are in internal radians, convert to DXF degrees with Y-flip
                const startDeg = -(edge.end || 0) * RAD2DEG;
                const endDeg = -(edge.start || 0) * RAD2DEG;
                out.push('50', formatNumber(startDeg));
                out.push('51', formatNumber(endDeg));
                out.push('73', '1');
            } else {
                out.push('72', '1');
                const start = edge.start || edge.p1;
                const end = edge.end || edge.p2;
                out.push('10', formatNumber(start.x));
                out.push('20', formatNumber(fy(start.y)));
                out.push('11', formatNumber(end.x));
                out.push('21', formatNumber(fy(end.y)));
            }
        });
        out.push('75', '0');
        out.push('76', '1');
        out.push('52', formatNumber(angle));
        out.push('41', formatNumber(scale));
        out.push('77', '0');
        out.push('78', '0');
    };

    const writeEntityDimension = (out, entity, ownerHandle) => {
        // Export dimension as lines + text (decomposed)
        // This ensures broad compatibility
        if (entity.dimType === 'linear' || entity.dimType === 'aligned') {
            const p1 = entity.p1 || entity.start;
            const p2 = entity.p2 || entity.end;
            if (!p1 || !p2) return;
            const dimLineY = entity.dimLineY != null ? entity.dimLineY : (Math.min(p1.y, p2.y) - 20);

            // Extension lines
            writeEntityHeader(out, 'LINE', entity, ownerHandle);
            writeCommonStyle(out, entity);
            out.push('100', 'AcDbLine');
            out.push('10', formatNumber(p1.x), '20', formatNumber(fy(p1.y)), '30', '0.0');
            out.push('11', formatNumber(p1.x), '21', formatNumber(fy(dimLineY)), '31', '0.0');

            writeEntityHeader(out, 'LINE', entity, ownerHandle);
            out.push('100', 'AcDbLine');
            out.push('10', formatNumber(p2.x), '20', formatNumber(fy(p2.y)), '30', '0.0');
            out.push('11', formatNumber(p2.x), '21', formatNumber(fy(dimLineY)), '31', '0.0');

            // Dimension line
            writeEntityHeader(out, 'LINE', entity, ownerHandle);
            out.push('100', 'AcDbLine');
            out.push('10', formatNumber(p1.x), '20', formatNumber(fy(dimLineY)), '30', '0.0');
            out.push('11', formatNumber(p2.x), '21', formatNumber(fy(dimLineY)), '31', '0.0');

            // Text
            if (entity.text) {
                const midX = (p1.x + p2.x) / 2;
                const textH = entity.textHeight || 2.5;
                writeEntityHeader(out, 'TEXT', entity, ownerHandle);
                out.push('100', 'AcDbText');
                out.push('10', formatNumber(midX), '20', formatNumber(fy(dimLineY - textH * 1.5)), '30', '0.0');
                out.push('40', formatNumber(textH));
                out.push('1', entity.text);
            }
        } else if (entity.dimType === 'radius' || entity.dimType === 'diameter') {
            const center = entity.center;
            const textPos = entity.textPosition || entity.position;
            if (!center || !textPos) return;

            writeEntityHeader(out, 'LINE', entity, ownerHandle);
            writeCommonStyle(out, entity);
            out.push('100', 'AcDbLine');
            out.push('10', formatNumber(center.x), '20', formatNumber(fy(center.y)), '30', '0.0');
            out.push('11', formatNumber(textPos.x), '21', formatNumber(fy(textPos.y)), '31', '0.0');

            if (entity.text) {
                const textH = entity.textHeight || 2.5;
                writeEntityHeader(out, 'TEXT', entity, ownerHandle);
                out.push('100', 'AcDbText');
                out.push('10', formatNumber(textPos.x), '20', formatNumber(fy(textPos.y)), '30', '0.0');
                out.push('40', formatNumber(textH));
                out.push('1', entity.text);
            }
        } else if (entity.dimType === 'angular' || entity.dimType === 'arclength') {
            const center = entity.center;
            if (!center) return;
            const r = entity.radius || 0;
            const startA = entity.startAngle || 0;
            const endA = entity.endAngle || 0;
            const textH = entity.textHeight || 2.5;
            const dimR = r + 15;

            writeEntityHeader(out, 'ARC', entity, ownerHandle);
            writeCommonStyle(out, entity);
            out.push('100', 'AcDbCircle');
            out.push('10', formatNumber(center.x), '20', formatNumber(fy(center.y)), '30', '0.0');
            out.push('40', formatNumber(dimR));
            out.push('100', 'AcDbArc');
            out.push('50', formatNumber(-(endA || 0) * RAD2DEG));
            out.push('51', formatNumber(-(startA || 0) * RAD2DEG));

            if (entity.text) {
                let sweep = endA - startA;
                if (sweep < 0) sweep += 2 * Math.PI;
                const midAngle = startA + sweep / 2;
                const textR = dimR + textH;
                writeEntityHeader(out, 'TEXT', entity, ownerHandle);
                out.push('100', 'AcDbText');
                out.push('10', formatNumber(center.x + textR * Math.cos(midAngle)));
                out.push('20', formatNumber(fy(center.y + textR * Math.sin(midAngle))));
                out.push('30', '0.0');
                out.push('40', formatNumber(textH));
                out.push('1', entity.text);
            }
        }
    };

    const writeBlocksSection = (out, blocks = {}, state = null, modelSpaceHandle, paperSpaceHandle, blockHandles = {}) => {
        out.push('0', 'SECTION', '2', 'BLOCKS');

        // *Model_Space block (owner = Model_Space BLOCK_RECORD handle)
        out.push('0', 'BLOCK');
        out.push('5', nextHandle());
        out.push('330', modelSpaceHandle);
        out.push('100', 'AcDbEntity');
        out.push('8', '0');
        out.push('100', 'AcDbBlockBegin');
        out.push('2', '*Model_Space');
        out.push('70', '0');
        out.push('10', '0.0', '20', '0.0', '30', '0.0');
        out.push('3', '*Model_Space');
        out.push('1', '');
        out.push('0', 'ENDBLK');
        out.push('5', nextHandle());
        out.push('330', modelSpaceHandle);
        out.push('100', 'AcDbEntity');
        out.push('8', '0');
        out.push('100', 'AcDbBlockEnd');

        // *Paper_Space block (owner = Paper_Space BLOCK_RECORD handle)
        out.push('0', 'BLOCK');
        out.push('5', nextHandle());
        out.push('330', paperSpaceHandle);
        out.push('100', 'AcDbEntity');
        out.push('8', '0');
        out.push('100', 'AcDbBlockBegin');
        out.push('2', '*Paper_Space');
        out.push('70', '0');
        out.push('10', '0.0', '20', '0.0', '30', '0.0');
        out.push('3', '*Paper_Space');
        out.push('1', '');
        out.push('0', 'ENDBLK');
        out.push('5', nextHandle());
        out.push('330', paperSpaceHandle);
        out.push('100', 'AcDbEntity');
        out.push('8', '0');
        out.push('100', 'AcDbBlockEnd');

        // User-defined blocks (owner = their BLOCK_RECORD handle)
        Object.values(blocks).forEach(block => {
            if (block.name === '*Model_Space' || block.name === '*Paper_Space') return;
            const ownerHandle = blockHandles[block.name] || '0';
            const basePoint = block.basePoint || block.origin || { x: 0, y: 0, z: 0 };
            out.push('0', 'BLOCK');
            out.push('5', nextHandle());
            out.push('330', ownerHandle);
            out.push('100', 'AcDbEntity');
            out.push('8', '0');
            out.push('100', 'AcDbBlockBegin');
            out.push('2', block.name || 'BLOCK');
            out.push('70', '0');
            out.push('10', formatNumber(basePoint.x), '20', formatNumber(fy(basePoint.y)), '30', formatNumber(basePoint.z || 0));
            out.push('3', block.name || 'BLOCK');
            out.push('1', '');
            (block.entities || []).forEach(entity => {
                writeEntity(out, entity, state, ownerHandle);
            });
            out.push('0', 'ENDBLK');
            out.push('5', nextHandle());
            out.push('330', ownerHandle);
            out.push('100', 'AcDbEntity');
            out.push('8', '0');
            out.push('100', 'AcDbBlockEnd');
        });
        out.push('0', 'ENDSEC');
    };

    const writeEntity = (out, entity, state, ownerHandle) => {
        switch (entity.type) {
            case 'line':
                writeEntityLine(out, entity, ownerHandle);
                break;
            case 'circle':
                writeEntityCircle(out, entity, ownerHandle);
                break;
            case 'arc':
                writeEntityArc(out, entity, ownerHandle);
                break;
            case 'lwpolyline':
            case 'polyline':
                if (entity.isSpline && entity.points?.length >= 2) {
                    writeEntitySpline(out, entity, ownerHandle);
                } else {
                    writeEntityLwPolyline(out, entity, ownerHandle);
                }
                break;
            case 'text':
                writeEntityText(out, entity, false, ownerHandle);
                break;
            case 'mtext':
                writeEntityText(out, entity, true, ownerHandle);
                break;
            case 'point':
                writeEntityPoint(out, entity, ownerHandle);
                break;
            case 'ellipse':
                writeEntityEllipse(out, entity, ownerHandle);
                break;
            case 'insert':
            case 'block':
                writeEntityInsert(out, entity, ownerHandle);
                break;
            case 'hatch':
                writeEntityHatch(out, entity, state, ownerHandle);
                break;
            case 'leader':
                writeEntityLeader(out, entity, ownerHandle);
                break;
            case 'dimension':
                writeEntityDimension(out, entity, ownerHandle);
                break;
            case 'rect':
                // Export rect as closed LWPOLYLINE
                writeEntityLwPolyline(out, {
                    type: 'polyline',
                    layer: entity.layer,
                    color: entity.color,
                    lineType: entity.lineType,
                    closed: true,
                    points: [
                        { x: entity.p1.x, y: entity.p1.y },
                        { x: entity.p2.x, y: entity.p1.y },
                        { x: entity.p2.x, y: entity.p2.y },
                        { x: entity.p1.x, y: entity.p2.y }
                    ]
                }, ownerHandle);
                break;
            case 'mleader':
                writeEntityLeader(out, entity, ownerHandle);
                break;
            case 'tolerance': {
                const pos = entity.position || { x: 0, y: 0 };
                writeEntityHeader(out, 'TOLERANCE', entity, ownerHandle);
                writeCommonStyle(out, entity);
                out.push('100', 'AcDbFcf');
                out.push('10', formatNumber(pos.x), '20', formatNumber(fy(pos.y)), '30', '0.0');
                const tolStr = (entity.frames || []).map(f => {
                    let s = (f.symbol || '') + (f.diameterSymbol ? '%%c' : '') + (f.tolerance1 || '');
                    if (f.datum1) s += '%%v' + f.datum1;
                    if (f.datum2) s += '%%v' + f.datum2;
                    if (f.datum3) s += '%%v' + f.datum3;
                    return s;
                }).join('%%v');
                out.push('1', tolStr);
                break;
            }
            case 'trace': {
                const pts = entity.points || [];
                if (pts.length >= 4) {
                    writeEntityHeader(out, 'TRACE', entity, ownerHandle);
                    writeCommonStyle(out, entity);
                    out.push('100', 'AcDbTrace');
                    out.push('10', formatNumber(pts[0].x), '20', formatNumber(fy(pts[0].y)), '30', '0.0');
                    out.push('11', formatNumber(pts[1].x), '21', formatNumber(fy(pts[1].y)), '31', '0.0');
                    out.push('12', formatNumber(pts[2].x), '22', formatNumber(fy(pts[2].y)), '32', '0.0');
                    out.push('13', formatNumber(pts[3].x), '23', formatNumber(fy(pts[3].y)), '33', '0.0');
                }
                break;
            }
            case 'field': {
                const fp = entity.position || { x: 0, y: 0 };
                writeEntityHeader(out, 'TEXT', entity, ownerHandle);
                writeCommonStyle(out, entity);
                out.push('100', 'AcDbText');
                out.push('10', formatNumber(fp.x), '20', formatNumber(fy(fp.y)), '30', '0.0');
                out.push('40', formatNumber(entity.height || 10));
                out.push('1', entity.evaluatedText || entity.fieldExpression || '---');
                break;
            }
            case 'donut': {
                const dc = entity.center || { x: 0, y: 0 };
                writeEntityHeader(out, 'CIRCLE', entity, ownerHandle);
                writeCommonStyle(out, entity);
                out.push('100', 'AcDbCircle');
                out.push('10', formatNumber(dc.x), '20', formatNumber(fy(dc.y)), '30', '0.0');
                out.push('40', formatNumber(entity.outerRadius || 1));
                if (entity.innerRadius > 0) {
                    writeEntityHeader(out, 'CIRCLE', entity, ownerHandle);
                    writeCommonStyle(out, entity);
                    out.push('100', 'AcDbCircle');
                    out.push('10', formatNumber(dc.x), '20', formatNumber(fy(dc.y)), '30', '0.0');
                    out.push('40', formatNumber(entity.innerRadius));
                }
                break;
            }
            case 'solid': {
                const sp = entity.points || [];
                if (sp.length >= 3) {
                    writeEntityHeader(out, 'SOLID', entity, ownerHandle);
                    writeCommonStyle(out, entity);
                    out.push('100', 'AcDbTrace');
                    const codes = [[10,20],[11,21],[12,22],[13,23]];
                    for (let si = 0; si < Math.min(sp.length, 4); si++) {
                        out.push(String(codes[si][0]), formatNumber(sp[si].x));
                        out.push(String(codes[si][1]), formatNumber(fy(sp[si].y)));
                        out.push(String(codes[si][0] + 20), '0.0');
                    }
                    if (sp.length === 3) {
                        out.push('13', formatNumber(sp[2].x), '23', formatNumber(fy(sp[2].y)), '33', '0.0');
                    }
                }
                break;
            }
            case 'wipeout':
            case 'region':
            case 'revcloud': {
                const wp = entity.points || [];
                if (wp.length >= 3) {
                    writeEntityHeader(out, 'LWPOLYLINE', entity, ownerHandle);
                    writeCommonStyle(out, entity);
                    out.push('100', 'AcDbPolyline');
                    out.push('90', String(wp.length));
                    out.push('70', '1');
                    wp.forEach(p => {
                        out.push('10', formatNumber(p.x), '20', formatNumber(fy(p.y)));
                    });
                }
                break;
            }
            case 'image': {
                if (entity.p1 && entity.p2) {
                    writeEntityHeader(out, 'LWPOLYLINE', entity, ownerHandle);
                    writeCommonStyle(out, entity);
                    out.push('100', 'AcDbPolyline');
                    out.push('90', '4');
                    out.push('70', '1');
                    out.push('10', formatNumber(entity.p1.x), '20', formatNumber(fy(entity.p1.y)));
                    out.push('10', formatNumber(entity.p2.x), '20', formatNumber(fy(entity.p1.y)));
                    out.push('10', formatNumber(entity.p2.x), '20', formatNumber(fy(entity.p2.y)));
                    out.push('10', formatNumber(entity.p1.x), '20', formatNumber(fy(entity.p2.y)));
                }
                break;
            }
            case 'table': {
                if (entity.position) {
                    const tp = entity.position;
                    const rows = entity.rows || 3, cols = entity.cols || 3;
                    const rh = entity.rowHeight || 10, cw = entity.colWidth || 30;
                    for (let r = 0; r <= rows; r++) {
                        writeEntityHeader(out, 'LINE', entity, ownerHandle);
                        out.push('100', 'AcDbLine');
                        out.push('10', formatNumber(tp.x), '20', formatNumber(fy(tp.y + r * rh)), '30', '0.0');
                        out.push('11', formatNumber(tp.x + cols * cw), '21', formatNumber(fy(tp.y + r * rh)), '31', '0.0');
                    }
                    for (let c = 0; c <= cols; c++) {
                        writeEntityHeader(out, 'LINE', entity, ownerHandle);
                        out.push('100', 'AcDbLine');
                        out.push('10', formatNumber(tp.x + c * cw), '20', formatNumber(fy(tp.y)), '30', '0.0');
                        out.push('11', formatNumber(tp.x + c * cw), '21', formatNumber(fy(tp.y + rows * rh)), '31', '0.0');
                    }
                }
                break;
            }
            case 'mline': {
                const ml = entity.points || [];
                if (ml.length >= 2) {
                    for (let mi = 0; mi < ml.length - 1; mi++) {
                        writeEntityHeader(out, 'LINE', entity, ownerHandle);
                        writeCommonStyle(out, entity);
                        out.push('100', 'AcDbLine');
                        out.push('10', formatNumber(ml[mi].x), '20', formatNumber(fy(ml[mi].y)), '30', '0.0');
                        out.push('11', formatNumber(ml[mi + 1].x), '21', formatNumber(fy(ml[mi + 1].y)), '31', '0.0');
                    }
                }
                break;
            }
            default:
                break;
        }
    };

    const writeEntitiesSection = (out, entities = [], state = null, modelSpaceHandle) => {
        out.push('0', 'SECTION', '2', 'ENTITIES');
        entities.forEach(entity => writeEntity(out, entity, state, modelSpaceHandle));
        out.push('0', 'ENDSEC');
    };

    const writeObjectsSection = (out) => {
        out.push('0', 'SECTION', '2', 'OBJECTS');
        // Root dictionary (handle C by convention, owner = root)
        out.push('0', 'DICTIONARY');
        out.push('5', 'C');
        out.push('330', '0');
        out.push('100', 'AcDbDictionary');
        out.push('281', '1');
        out.push('0', 'ENDSEC');
    };

    const generateDXF = (stateOrEntities = [], layers = []) => {
        const state = Array.isArray(stateOrEntities)
            ? { entities: stateOrEntities, layers, blocks: {} }
            : (stateOrEntities || { entities: [], layers: [], blocks: {} });

        resetHandles();

        // Build body sections first so $HANDSEED reflects all allocated handles
        const body = [];

        // CLASSES section (empty but required for AC1015)
        body.push('0', 'SECTION', '2', 'CLASSES', '0', 'ENDSEC');

        // TABLES section (with BLOCK_RECORD table for proper handle ownership)
        const { modelSpaceHandle, paperSpaceHandle, blockHandles } =
            writeTables(body, state.layers || [], state);

        // BLOCKS section
        writeBlocksSection(body, state.blocks || {}, state, modelSpaceHandle, paperSpaceHandle, blockHandles);

        // ENTITIES section (entities owned by Model_Space BLOCK_RECORD)
        writeEntitiesSection(body, state.entities || [], state, modelSpaceHandle);

        // OBJECTS section (root dictionary)
        writeObjectsSection(body);

        // HEADER section (built last for correct $HANDSEED)
        const out = [];
        out.push('0', 'SECTION', '2', 'HEADER');
        out.push('9', '$ACADVER', '1', 'AC1015');
        out.push('9', '$ACADMAINTVER', '70', '6');
        out.push('9', '$DWGCODEPAGE', '3', 'ANSI_1252');
        out.push('9', '$HANDSEED', '5', getHandleSeed());
        out.push('9', '$INSBASE', '10', '0.0', '20', '0.0', '30', '0.0');
        out.push('9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0');
        out.push('9', '$EXTMAX', '10', '1000.0', '20', '1000.0', '30', '0.0');
        out.push('9', '$LIMMIN', '10', '0.0', '20', '0.0');
        out.push('9', '$LIMMAX', '10', '420.0', '20', '297.0');
        out.push('9', '$INSUNITS', '70', String(DEFAULT_HEADER.$INSUNITS));
        out.push('9', '$MEASUREMENT', '70', '1');
        out.push('9', '$LUNITS', '70', '2');
        out.push('9', '$LUPREC', '70', '4');
        out.push('9', '$AUNITS', '70', '0');
        out.push('9', '$AUPREC', '70', '2');
        out.push('9', '$TEXTSIZE', '40', '2.5');
        out.push('9', '$TEXTSTYLE', '7', 'Standard');
        out.push('9', '$CLAYER', '8', state.currentLayer || '0');
        out.push('0', 'ENDSEC');

        // Combine: HEADER + body (CLASSES, TABLES, BLOCKS, ENTITIES, OBJECTS) + EOF
        out.push(...body);
        out.push('0', 'EOF');

        return formatOutput(out);
    };

    const exportFromCadState = (state) => {
        return generateDXF(state || { entities: [], layers: [], blocks: {} });
    };

    return {
        parseDXF,
        generateDXF,
        parse: parseDXF,
        export: exportFromCadState
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DXF;
}
