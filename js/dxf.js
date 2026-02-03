/* ============================================
   BrowserCAD - DXF Parser/Exporter
   ============================================ */

const DXF = {
    utils: {
        parsePoint(iterator) {
            const point = { x: 0, y: 0, z: 0 };
            const peek = iterator.peek();
            if (!peek || peek.code !== 10) {
                return point;
            }
            point.x = parseFloat(iterator.next().value) || 0;
            if (iterator.peek() && iterator.peek().code === 20) {
                point.y = parseFloat(iterator.next().value) || 0;
            }
            if (iterator.peek() && iterator.peek().code === 30) {
                point.z = parseFloat(iterator.next().value) || 0;
            }
            return point;
        },
        getImgPath(handle, data) {
            if (!handle || !data || !data.imageDefs) return '';
            return data.imageDefs[handle]?.path || '';
        },
        toDegrees(radians) {
            return radians * (180 / Math.PI);
        },
        parseAciColor(hexColor) {
            if (!hexColor) return 7;
            const clean = hexColor.replace('#', '');
            if (clean.length !== 6) return 7;
            const r = parseInt(clean.slice(0, 2), 16);
            const g = parseInt(clean.slice(2, 4), 16);
            const b = parseInt(clean.slice(4, 6), 16);
            if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 7;
            if (r > 200 && g > 200 && b > 200) return 7;
            if (r > 200 && g < 100 && b < 100) return 1;
            if (r < 100 && g > 200 && b < 100) return 3;
            if (r < 100 && g < 100 && b > 200) return 5;
            if (r > 200 && g > 200 && b < 100) return 2;
            if (r < 100 && g > 200 && b > 200) return 4;
            if (r > 200 && g < 100 && b > 200) return 6;
            return 7;
        },
        hexToInt(hexColor) {
            if (!hexColor) return 0;
            const clean = hexColor.replace('#', '');
            const intVal = parseInt(clean, 16);
            return Number.isNaN(intVal) ? 0 : intVal;
        },
        hexToRgb(hexColor) {
            if (!hexColor) return null;
            const clean = hexColor.replace('#', '');
            if (clean.length !== 6) return null;
            const r = parseInt(clean.slice(0, 2), 16);
            const g = parseInt(clean.slice(2, 4), 16);
            const b = parseInt(clean.slice(4, 6), 16);
            if ([r, g, b].some(v => Number.isNaN(v))) return null;
            return { r, g, b };
        },
        radToDeg(radians) {
            return radians * (180 / Math.PI);
        },
        degToRad(degrees) {
            return degrees * (Math.PI / 180);
        },
        isPolygonClosed(points) {
            if (!points || points.length < 3) return false;
            const first = points[0];
            const last = points[points.length - 1];
            return Math.abs(first.x - last.x) < 0.0001 && Math.abs(first.y - last.y) < 0.0001;
        }
    },

    parse(text) {
        const lines = text.replace(/\r\n/g, '\n').split('\n');
        let index = 0;

        const iterator = {
            next() {
                if (index >= lines.length) return null;
                const code = parseInt(lines[index]?.trim() || '', 10);
                const value = (lines[index + 1] ?? '').trim();
                index += 2;
                if (Number.isNaN(code)) return null;
                return { code, value };
            },
            peek() {
                if (index >= lines.length) return null;
                const code = parseInt(lines[index]?.trim() || '', 10);
                const value = (lines[index + 1] ?? '').trim();
                if (Number.isNaN(code)) return null;
                return { code, value };
            }
        };

        const data = {
            header: { $ACADVER: 'AC1015', $INSUNITS: 4, $EXTMIN: { x: 0, y: 0 }, $EXTMAX: { x: 0, y: 0 } },
            layers: { '0': { name: '0', color: 7, visible: true, frozen: false, locked: false } },
            linetypes: {},
            styles: {},
            blocks: {},
            imageDefs: {},
            entities: []
        };

        const parseHeaderVar = (name, tags) => {
            if (name === '$ACADVER' && tags[1]) {
                data.header.$ACADVER = tags[1];
            } else if (name === '$INSUNITS' && tags[70]) {
                data.header.$INSUNITS = parseInt(tags[70], 10) || data.header.$INSUNITS;
            } else if (name === '$EXTMIN') {
                data.header.$EXTMIN = {
                    x: parseFloat(tags[10] ?? 0) || 0,
                    y: parseFloat(tags[20] ?? 0) || 0
                };
            } else if (name === '$EXTMAX') {
                data.header.$EXTMAX = {
                    x: parseFloat(tags[10] ?? 0) || 0,
                    y: parseFloat(tags[20] ?? 0) || 0
                };
            }
        };

        const readTagMap = (endCodes = [0]) => {
            const tags = {};
            while (iterator.peek() && !endCodes.includes(iterator.peek().code)) {
                const tag = iterator.next();
                tags[tag.code] = tag.value;
            }
            return tags;
        };

        const parseLayer = () => {
            const tags = readTagMap([0]);
            const name = tags[2] || '0';
            const flags = parseInt(tags[70] ?? '0', 10) || 0;
            const color = Math.abs(parseInt(tags[62] ?? '7', 10) || 7);
            data.layers[name] = {
                name,
                color,
                visible: color >= 0,
                frozen: (flags & 1) === 1,
                locked: (flags & 4) === 4
            };
        };

        const parseLinetype = () => {
            const tags = readTagMap([0]);
            const name = tags[2] || 'DASHED';
            const pattern = [];
            Object.keys(tags).forEach(key => {
                if (parseInt(key, 10) === 49) {
                    pattern.push(parseFloat(tags[key]) || 0);
                }
            });
            data.linetypes[name] = { pattern };
        };

        const parseStyle = () => {
            const tags = readTagMap([0]);
            const name = tags[2] || 'STANDARD';
            const font = tags[3] || 'arial.ttf';
            data.styles[name] = { font };
        };

        const parseBlockEntities = () => {
            const entities = [];
            while (iterator.peek()) {
                const peek = iterator.peek();
                if (peek.code === 0 && peek.value === 'ENDBLK') {
                    iterator.next();
                    break;
                }
                if (peek.code === 0) {
                    const entity = parseEntity();
                    if (entity) entities.push(entity);
                } else {
                    iterator.next();
                }
            }
            return entities;
        };

        const parseBlock = () => {
            const tags = readTagMap([0]);
            const name = tags[2] || 'BLOCK';
            const flags = parseInt(tags[70] ?? '0', 10) || 0;
            const origin = {
                x: parseFloat(tags[10] ?? 0) || 0,
                y: parseFloat(tags[20] ?? 0) || 0
            };
            const block = {
                origin,
                entities: parseBlockEntities()
            };
            if (flags & 4 || flags & 32) {
                block.isXref = true;
                block.path = tags[1] || '';
            }
            data.blocks[name] = block;
        };

        const parseImageDef = () => {
            const tags = readTagMap([0]);
            const handle = tags[5];
            if (!handle) return;
            data.imageDefs[handle] = {
                path: tags[1] || '',
                width: parseFloat(tags[10] ?? 0) || 0,
                height: parseFloat(tags[20] ?? 0) || 0
            };
        };

        const parseHatchFromTags = (tags, layer) => {
            const xCoords = Array.isArray(tags[10]) ? tags[10] : (tags[10] !== undefined ? [tags[10]] : []);
            const yCoords = Array.isArray(tags[20]) ? tags[20] : (tags[20] !== undefined ? [tags[20]] : []);
            const counts = Array.isArray(tags[93]) ? tags[93] : (tags[93] !== undefined ? [tags[93]] : []);
            const boundaryCount = parseInt(counts[0] ?? '0', 10) || Math.min(xCoords.length, yCoords.length);
            const points = [];
            for (let i = 0; i < Math.min(boundaryCount, xCoords.length, yCoords.length); i += 1) {
                const x = parseFloat(xCoords[i]);
                const y = parseFloat(yCoords[i]);
                if (!Number.isNaN(x) && !Number.isNaN(y)) {
                    points.push({ x, y });
                }
            }
            const rawPattern = tags[2] || 'solid';
            const pattern = DXF._normalizeDXFPatternName(rawPattern);
            const isSolid = parseInt(tags[70] ?? '0', 10) === 1 || pattern === 'solid';
            if (points.length >= 3) {
                return {
                    type: 'hatch',
                    layer,
                    points,
                    pattern: isSolid ? 'solid' : pattern,
                    noStroke: true
                };
            }
            const edgeTypeRaw = Array.isArray(tags[72]) ? tags[72][0] : tags[72];
            const edgeType = parseInt(edgeTypeRaw ?? '0', 10);
            if (edgeType === 2) {
                const centerX = parseFloat(tags[10]);
                const centerY = parseFloat(tags[20]);
                const radius = parseFloat(tags[40]);
                if (![centerX, centerY, radius].some(Number.isNaN)) {
                    return {
                        type: 'circle',
                        layer,
                        center: { x: centerX, y: centerY },
                        r: radius,
                        hatch: { pattern: isSolid ? 'solid' : pattern },
                        noStroke: true
                    };
                }
            }
            return null;
        };

        const parseEntity = () => {
            const typeTag = iterator.next();
            if (!typeTag || typeTag.code !== 0) return null;
            const type = typeTag.value;

            const tags = {};
            while (iterator.peek() && iterator.peek().code !== 0) {
                const tag = iterator.next();
                if (!tags[tag.code]) {
                    tags[tag.code] = tag.value;
                } else if (Array.isArray(tags[tag.code])) {
                    tags[tag.code].push(tag.value);
                } else {
                    tags[tag.code] = [tags[tag.code], tag.value];
                }
            }

            const layer = tags[8] || '0';

            if (type === 'LINE') {
                return {
                    type: 'line',
                    layer,
                    p1: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    p2: { x: parseFloat(tags[11] ?? 0) || 0, y: parseFloat(tags[21] ?? 0) || 0 }
                };
            }

            if (type === 'CIRCLE') {
                return {
                    type: 'circle',
                    layer,
                    center: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    r: parseFloat(tags[40] ?? 0) || 0
                };
            }

            if (type === 'ARC') {
                return {
                    type: 'arc',
                    layer,
                    center: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    r: parseFloat(tags[40] ?? 0) || 0,
                    start: parseFloat(tags[51] ?? 0) || 0,
                    end: parseFloat(tags[50] ?? 0) || 0
                };
            }

            if (type === 'TEXT') {
                return {
                    type: 'text',
                    layer,
                    text: tags[1] || '',
                    point: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    height: parseFloat(tags[40] ?? 0) || 0,
                    rotation: parseFloat(tags[50] ?? 0) || 0
                };
            }

            if (type === 'MTEXT') {
                const parts = [];
                if (tags[1]) parts.push(tags[1]);
                if (tags[3]) {
                    const extras = Array.isArray(tags[3]) ? tags[3] : [tags[3]];
                    parts.push(...extras);
                }
                return {
                    type: 'mtext',
                    layer,
                    text: parts.join('').replace(/\\P/g, '\n'),
                    point: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    height: parseFloat(tags[40] ?? 0) || 0,
                    width: parseFloat(tags[41] ?? 0) || 0,
                    rotation: parseFloat(tags[50] ?? 0) || 0
                };
            }

            if (type === 'POINT') {
                return {
                    type: 'point',
                    layer,
                    point: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 }
                };
            }

            if (type === 'LWPOLYLINE') {
                const points = [];
                const xs = Array.isArray(tags[10]) ? tags[10] : [tags[10]].filter(Boolean);
                const ys = Array.isArray(tags[20]) ? tags[20] : [tags[20]].filter(Boolean);
                const bulges = Array.isArray(tags[42]) ? tags[42] : [tags[42]].filter(Boolean);
                for (let i = 0; i < xs.length; i += 1) {
                    points.push({
                        x: parseFloat(xs[i] ?? 0) || 0,
                        y: parseFloat(ys[i] ?? 0) || 0,
                        bulge: parseFloat(bulges[i] ?? 0) || 0
                    });
                }
                const flags = parseInt(tags[70] ?? '0', 10) || 0;
                return {
                    type: 'lwpolyline',
                    layer,
                    closed: (flags & 1) === 1,
                    points
                };
            }

            if (type === 'POLYLINE') {
                const flags = parseInt(tags[70] ?? '0', 10) || 0;
                const points = [];
                while (iterator.peek()) {
                    const peek = iterator.peek();
                    if (peek.code === 0 && peek.value === 'VERTEX') {
                        iterator.next();
                        const vtags = readTagMap([0]);
                        points.push({
                            x: parseFloat(vtags[10] ?? 0) || 0,
                            y: parseFloat(vtags[20] ?? 0) || 0,
                            bulge: parseFloat(vtags[42] ?? 0) || 0
                        });
                        continue;
                    }
                    if (peek.code === 0 && peek.value === 'SEQEND') {
                        iterator.next();
                        break;
                    }
                    iterator.next();
                }
                return {
                    type: 'lwpolyline',
                    layer,
                    closed: (flags & 1) === 1,
                    points
                };
            }

            if (type === 'SPLINE') {
                const points = [];
                const xs = Array.isArray(tags[10]) ? tags[10] : [tags[10]].filter(Boolean);
                const ys = Array.isArray(tags[20]) ? tags[20] : [tags[20]].filter(Boolean);
                for (let i = 0; i < xs.length; i += 1) {
                    points.push({
                        x: parseFloat(xs[i] ?? 0) || 0,
                        y: parseFloat(ys[i] ?? 0) || 0,
                        bulge: 0
                    });
                }
                return {
                    type: 'spline',
                    layer,
                    points
                };
            }

            if (type === 'ELLIPSE') {
                const center = { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 };
                const majorX = parseFloat(tags[11] ?? 0) || 0;
                const majorY = parseFloat(tags[21] ?? 0) || 0;
                const ratio = parseFloat(tags[40] ?? 1) || 1;
                const rx = Math.sqrt(majorX * majorX + majorY * majorY);
                const ry = rx * ratio;
                const rotation = Math.atan2(majorY, majorX);
                return {
                    type: 'ellipse',
                    layer,
                    center,
                    rx,
                    ry,
                    rotation
                };
            }

            if (type === 'INSERT') {
                const blockName = tags[2] || '';
                const block = data.blocks[blockName];
                const entity = {
                    type: block && block.isXref ? 'xref' : 'insert',
                    layer,
                    blockName,
                    p: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    scale: {
                        x: parseFloat(tags[41] ?? 1) || 1,
                        y: parseFloat(tags[42] ?? 1) || 1
                    },
                    rotation: parseFloat(tags[50] ?? 0) || 0
                };
                if (!block) {
                    entity.type = 'xref';
                    entity.path = tags[1] || '';
                } else if (block.isXref) {
                    entity.path = block.path || '';
                }
                return entity;
            }

            if (type === 'LEADER') {
                const xs = Array.isArray(tags[10]) ? tags[10] : [tags[10]].filter(Boolean);
                const ys = Array.isArray(tags[20]) ? tags[20] : [tags[20]].filter(Boolean);
                const points = [];
                for (let i = 0; i < Math.min(xs.length, ys.length); i += 1) {
                    points.push({ x: parseFloat(xs[i] ?? 0) || 0, y: parseFloat(ys[i] ?? 0) || 0 });
                }
                return {
                    type: 'leader',
                    layer,
                    points,
                    text: tags[3] || ''
                };
            }

            if (type === 'HATCH') {
                const hatch = parseHatchFromTags(tags, layer);
                if (hatch) return hatch;
            }

            if (type === 'SOLID') {
                const points = [];
                [[10, 20], [11, 21], [12, 22], [13, 23]].forEach(pair => {
                    const x = parseFloat(tags[pair[0]] ?? 0);
                    const y = parseFloat(tags[pair[1]] ?? 0);
                    if (!Number.isNaN(x) && !Number.isNaN(y)) {
                        points.push({ x, y });
                    }
                });
                return {
                    type: 'solid',
                    layer,
                    points
                };
            }

            if (type === 'DIMENSION') {
                return {
                    type: 'dimension',
                    layer,
                    p1: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    p2: { x: parseFloat(tags[11] ?? 0) || 0, y: parseFloat(tags[21] ?? 0) || 0 },
                    text: tags[1] || ''
                };
            }

            if (type === 'IMAGE') {
                return {
                    type: 'image',
                    layer,
                    defHandle: tags[340] || '',
                    p: { x: parseFloat(tags[10] ?? 0) || 0, y: parseFloat(tags[20] ?? 0) || 0 },
                    u: { x: parseFloat(tags[11] ?? 0) || 0, y: parseFloat(tags[21] ?? 0) || 0 },
                    v: { x: parseFloat(tags[12] ?? 0) || 0, y: parseFloat(tags[22] ?? 0) || 0 },
                    size: { w: parseFloat(tags[13] ?? 0) || 0, h: parseFloat(tags[23] ?? 0) || 0 }
                };
            }

            return null;
        };

        while (iterator.peek()) {
            const tag = iterator.next();
            if (!tag) break;
            if (tag.code === 0 && tag.value === 'SECTION') {
                const nameTag = iterator.next();
                const sectionName = nameTag?.value || '';

                if (sectionName === 'HEADER') {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        const varTag = iterator.next();
                        if (!varTag || varTag.code !== 9) continue;
                        const name = varTag.value;
                        const tags = readTagMap([0, 9]);
                        parseHeaderVar(name, tags);
                    }
                } else if (sectionName === 'TABLES') {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        if (peek.code === 0 && peek.value === 'TABLE') {
                            iterator.next();
                            const tableName = iterator.next()?.value || '';
                            while (iterator.peek()) {
                                const tablePeek = iterator.peek();
                                if (tablePeek.code === 0 && tablePeek.value === 'ENDTAB') {
                                    iterator.next();
                                    break;
                                }
                                if (tablePeek.code === 0 && tablePeek.value === 'LAYER') {
                                    iterator.next();
                                    parseLayer();
                                    continue;
                                }
                                if (tablePeek.code === 0 && tablePeek.value === 'LTYPE') {
                                    iterator.next();
                                    parseLinetype();
                                    continue;
                                }
                                if (tablePeek.code === 0 && tablePeek.value === 'STYLE') {
                                    iterator.next();
                                    parseStyle();
                                    continue;
                                }
                                iterator.next();
                            }
                        } else {
                            iterator.next();
                        }
                    }
                } else if (sectionName === 'BLOCKS') {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        if (peek.code === 0 && peek.value === 'BLOCK') {
                            iterator.next();
                            parseBlock();
                            continue;
                        }
                        iterator.next();
                    }
                } else if (sectionName === 'OBJECTS') {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        if (peek.code === 0 && peek.value === 'IMAGEDEF') {
                            iterator.next();
                            parseImageDef();
                            continue;
                        }
                        iterator.next();
                    }
                } else if (sectionName === 'ENTITIES') {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        if (peek.code === 0) {
                            const entity = parseEntity();
                            if (entity) data.entities.push(entity);
                            continue;
                        }
                        iterator.next();
                    }
                } else {
                    while (iterator.peek()) {
                        const peek = iterator.peek();
                        if (peek.code === 0 && peek.value === 'ENDSEC') {
                            iterator.next();
                            break;
                        }
                        iterator.next();
                    }
                }
            }
        }

        return data;
    },

    getEntityColor(entity, state) {
        if (entity.color && entity.color !== 'ByLayer' && entity.color !== 'ByBlock') return entity.color;
        const layer = state.layers?.find?.(l => l.name === entity.layer) || state.layers?.[entity.layer];
        return layer?.color || '#ffffff';
    },

    getDrawingExtents(state) {
        if (typeof state.getEntityExtents === 'function') {
            let minX = 0, minY = 0, maxX = 1000, maxY = 1000;
            state.entities.forEach(entity => {
                const ext = state.getEntityExtents(entity);
                if (ext) {
                    minX = Math.min(minX, ext.minX);
                    minY = Math.min(minY, ext.minY);
                    maxX = Math.max(maxX, ext.maxX);
                    maxY = Math.max(maxY, ext.maxY);
                }
            });
            return { minX, minY, maxX, maxY };
        }
        return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    },

    getAciColor(hexColor) {
        const rgb = DXF.utils.hexToRgb(hexColor);
        if (!rgb) return 7;
        if (rgb.r > 200 && rgb.g > 200 && rgb.b > 200) return 7;
        if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) return 1;
        if (rgb.r < 100 && rgb.g > 200 && rgb.b < 100) return 3;
        if (rgb.r < 100 && rgb.g < 100 && rgb.b > 200) return 5;
        if (rgb.r > 200 && rgb.g > 200 && rgb.b < 100) return 2;
        if (rgb.r < 100 && rgb.g > 200 && rgb.b > 200) return 4;
        if (rgb.r > 200 && rgb.g < 100 && rgb.b > 200) return 6;
        return 7;
    },

    getLayerLineWeight(lineWeight) {
        if (!lineWeight) return null;
        const normalized = lineWeight.toString().trim().toLowerCase();
        if (!normalized || normalized === 'default' || normalized === 'bylayer') return null;
        const parsed = parseFloat(normalized);
        if (Number.isNaN(parsed)) return null;
        return Math.round(parsed * 100);
    },

    _normalizeDXFPatternName(pattern) {
        const raw = (pattern || '').toString().trim().toLowerCase();
        const map = {
            solid: 'solid',
            ansi31: 'ansi31',
            ansi32: 'ansi32',
            ansi33: 'ansi33',
            ansi34: 'ansi34',
            ansi35: 'ansi35',
            ansi36: 'ansi36',
            ansi37: 'ansi37',
            ansi38: 'ansi38',
            angle: 'ansi31',
            diagonal: 'ansi31',
            cross: 'ansi37',
            dots: 'dots',
            brick: 'brick',
            earth: 'earth',
            grass: 'grass',
            honey: 'honey',
            insul: 'insul',
            net: 'net',
            net3: 'net3',
            dash: 'dash',
            square: 'square',
            steel: 'steel',
            zigzag: 'zigzag',
            swamp: 'swamp',
            trans: 'trans'
        };
        return map[raw] || raw || 'solid';
    },

    _getDXFPatternName(pattern) {
        const map = {
            solid: 'SOLID',
            diagonal: 'ANSI31',
            cross: 'ANSI37',
            dots: 'DOTS',
            angle: 'ANSI31',
            ansi31: 'ANSI31',
            ansi32: 'ANSI32',
            ansi33: 'ANSI33',
            ansi34: 'ANSI34',
            ansi35: 'ANSI35',
            ansi36: 'ANSI36',
            ansi37: 'ANSI37',
            ansi38: 'ANSI38',
            brick: 'BRICK',
            earth: 'EARTH',
            grass: 'GRASS',
            honey: 'HONEY',
            insul: 'INSUL',
            net: 'NET',
            net3: 'NET3',
            dash: 'DASH',
            square: 'SQUARE',
            steel: 'STEEL',
            swamp: 'SWAMP',
            trans: 'TRANS',
            zigzag: 'ZIGZAG'
        };
        return map[pattern] || pattern.toUpperCase();
    },

    _getDXFPatternDef(pattern) {
        let dxf = '';
        dxf += '75\n0\n';
        dxf += '76\n1\n';

        switch (pattern) {
            case 'diagonal':
            case 'ansi31':
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n1\n';
                dxf += '53\n45.0\n';
                dxf += '43\n0.0\n44\n0.0\n45\n-1.0\n46\n1.0\n79\n0\n';
                break;
            case 'cross':
            case 'ansi37':
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n2\n';
                dxf += '53\n45.0\n43\n0.0\n44\n0.0\n45\n-1.0\n46\n1.0\n79\n0\n';
                dxf += '53\n135.0\n43\n0.0\n44\n0.0\n45\n-1.0\n46\n1.0\n79\n0\n';
                break;
            case 'dots':
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n2\n';
                dxf += '53\n0.0\n43\n0.0\n44\n0.0\n45\n0.0\n46\n3.175\n79\n2\n';
                dxf += '49\n0.0\n49\n-3.175\n';
                dxf += '53\n90.0\n43\n0.0\n44\n0.0\n45\n0.0\n46\n3.175\n79\n2\n';
                dxf += '49\n0.0\n49\n-3.175\n';
                break;
            case 'ansi32':
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n2\n';
                dxf += '53\n45.0\n43\n0.0\n44\n0.0\n45\n-1.0\n46\n1.0\n79\n0\n';
                dxf += '53\n45.0\n43\n0.5\n44\n0.5\n45\n-1.0\n46\n1.0\n79\n0\n';
                break;
            case 'brick':
                dxf += '52\n0.0\n41\n6.35\n';
                dxf += '78\n2\n';
                dxf += '53\n0.0\n43\n0.0\n44\n0.0\n45\n0.0\n46\n6.35\n79\n0\n';
                dxf += '53\n90.0\n43\n0.0\n44\n0.0\n45\n0.0\n46\n6.35\n79\n2\n';
                dxf += '49\n3.175\n49\n-3.175\n';
                break;
            case 'honey':
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n3\n';
                dxf += '53\n0.0\n43\n0.0\n44\n0.0\n45\n5.5\n46\n3.175\n79\n2\n';
                dxf += '49\n3.175\n49\n-2.325\n';
                dxf += '53\n120.0\n43\n0.0\n44\n0.0\n45\n5.5\n46\n3.175\n79\n2\n';
                dxf += '49\n3.175\n49\n-2.325\n';
                dxf += '53\n60.0\n43\n0.0\n44\n0.0\n45\n5.5\n46\n3.175\n79\n2\n';
                dxf += '49\n3.175\n49\n-2.325\n';
                break;
            default:
                dxf += '52\n0.0\n41\n3.175\n';
                dxf += '78\n1\n';
                dxf += '53\n45.0\n43\n0.0\n44\n0.0\n45\n-1.0\n46\n1.0\n79\n0\n';
                break;
        }

        return dxf;
    },

    generateHatchDXF(entity, colorInt) {
        let dxf = '';
        const hatchData = entity.hatch;
        const pattern = (typeof hatchData === 'string' ? hatchData : hatchData?.pattern || 'solid').toLowerCase();
        const isSolid = pattern === 'solid';
        const dxfPatternName = this._getDXFPatternName(pattern);

        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n';
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n';
        dxf += '2\n' + dxfPatternName + '\n';
        dxf += '70\n' + (isSolid ? 1 : 0) + '\n';
        dxf += '71\n0\n';
        dxf += '91\n1\n';

        if (entity.type === 'circle') {
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n2\n';
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n0.0\n51\n360.0\n73\n1\n97\n0\n';
        } else if (entity.type === 'ellipse') {
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
                if (!entity.points || (!entity.closed && !DXF.utils.isPolygonClosed(entity.points))) {
                    return '';
                }
                pts = entity.points.map(p => ({ x: p.x, y: -p.y }));
            }
            if (pts.length < 3) return '';
            dxf += '92\n2\n72\n0\n73\n1\n';
            dxf += '93\n' + pts.length + '\n';
            pts.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
            });
            dxf += '97\n0\n';
        }

        if (!isSolid) {
            dxf += this._getDXFPatternDef(pattern);
        }

        return dxf;
    },

    hatchEntityToDXF(entity, colorInt, state) {
        const clipIds = entity.clipIds || [];
        if (clipIds.length === 0) {
            return this.generateHatchDXF(entity, colorInt);
        }

        let dxf = '';
        const hatchData = entity.hatch;
        const pattern = (typeof hatchData === 'string' ? hatchData : hatchData?.pattern || 'solid').toLowerCase();
        const isSolid = pattern === 'solid';
        const dxfPatternName = this._getDXFPatternName(pattern);

        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n';
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n';
        dxf += '2\n' + dxfPatternName + '\n';
        dxf += '70\n' + (isSolid ? 1 : 0) + '\n';
        dxf += '71\n0\n';
        dxf += '91\n' + clipIds.length + '\n';

        clipIds.forEach(id => {
            const clipEntity = state?.getEntity?.(id) || CAD?.getEntity?.(id);
            if (!clipEntity) return;
            dxf += this._hatchBoundaryPath(clipEntity);
        });

        if (!isSolid) {
            dxf += this._getDXFPatternDef(pattern);
        }

        return dxf;
    },

    _hatchBoundaryPath(entity) {
        let dxf = '';

        if (entity.type === 'circle') {
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n2\n';
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n0.0\n51\n360.0\n73\n1\n';
            dxf += '97\n0\n';
        } else if (entity.type === 'rect') {
            const pts = [
                { x: entity.p1.x, y: -entity.p1.y },
                { x: entity.p2.x, y: -entity.p1.y },
                { x: entity.p2.x, y: -entity.p2.y },
                { x: entity.p1.x, y: -entity.p2.y }
            ];
            dxf += '92\n2\n';
            dxf += '72\n0\n';
            dxf += '73\n1\n';
            dxf += '93\n' + pts.length + '\n';
            pts.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
            });
            dxf += '97\n0\n';
        } else if (entity.type === 'polyline' && entity.points) {
            const pts = entity.points.map(p => ({ x: p.x, y: -p.y }));
            dxf += '92\n2\n';
            dxf += '72\n0\n';
            dxf += '73\n1\n';
            dxf += '93\n' + pts.length + '\n';
            pts.forEach(p => {
                dxf += '10\n' + p.x + '\n20\n' + p.y + '\n';
            });
            dxf += '97\n0\n';
        } else if (entity.type === 'ellipse') {
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
            dxf += '72\n2\n';
            dxf += '10\n' + entity.center.x + '\n';
            dxf += '20\n' + (-entity.center.y) + '\n';
            dxf += '40\n' + entity.r + '\n';
            dxf += '50\n' + (-DXF.utils.radToDeg(entity.end)) + '\n';
            dxf += '51\n' + (-DXF.utils.radToDeg(entity.start)) + '\n';
            dxf += '73\n1\n';
            dxf += '97\n0\n';
        } else if (entity.type === 'line') {
            dxf += '92\n1\n';
            dxf += '93\n1\n';
            dxf += '72\n1\n';
            dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n';
            dxf += '11\n' + entity.p2.x + '\n21\n' + (-entity.p2.y) + '\n';
            dxf += '97\n0\n';
        }

        return dxf;
    },

    donutHatchToDXF(entity, colorInt) {
        let dxf = '';
        dxf += '0\nHATCH\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n0.0\n20\n0.0\n30\n0.0\n';
        dxf += '210\n0.0\n220\n0.0\n230\n1.0\n';
        dxf += '2\nSOLID\n';
        dxf += '70\n1\n';
        dxf += '71\n0\n';
        dxf += '91\n2\n';
        dxf += '92\n1\n';
        dxf += '93\n1\n';
        dxf += '72\n2\n';
        dxf += '10\n' + entity.center.x + '\n';
        dxf += '20\n' + (-entity.center.y) + '\n';
        dxf += '40\n' + entity.outerRadius + '\n';
        dxf += '50\n0.0\n51\n360.0\n73\n1\n';
        dxf += '97\n0\n';
        dxf += '92\n17\n';
        dxf += '93\n1\n';
        dxf += '72\n2\n';
        dxf += '10\n' + entity.center.x + '\n';
        dxf += '20\n' + (-entity.center.y) + '\n';
        dxf += '40\n' + entity.innerRadius + '\n';
        dxf += '50\n0.0\n51\n360.0\n73\n0\n';
        dxf += '97\n0\n';
        return dxf;
    },

    splineToDXF(entity, colorInt) {
        let dxf = '';
        dxf += '0\nSPLINE\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '70\n' + (entity.closed ? 1 : 0) + '\n';
        dxf += '71\n3\n';
        dxf += '72\n' + entity.points.length + '\n';
        dxf += '73\n' + entity.points.length + '\n';
        entity.points.forEach(p => {
            dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n30\n0.0\n';
        });
        return dxf;
    },

    dimensionToDXF(entity, colorInt) {
        let dxf = '';
        if (!entity.p1 || !entity.p2) return dxf;
        dxf += '0\nLINE\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n30\n0.0\n';
        dxf += '11\n' + entity.p2.x + '\n21\n' + (-entity.p2.y) + '\n31\n0.0\n';
        if (entity.text) {
            const midX = (entity.p1.x + entity.p2.x) / 2;
            const midY = (entity.p1.y + entity.p2.y) / 2;
            dxf += '0\nTEXT\n';
            dxf += '8\n' + (entity.layer || '0') + '\n';
            dxf += '420\n' + colorInt + '\n';
            dxf += '10\n' + midX + '\n20\n' + (-midY) + '\n30\n0.0\n';
            dxf += '40\n' + (entity.height || 10) + '\n';
            dxf += '1\n' + entity.text + '\n';
        }
        return dxf;
    },

    leaderToDXF(entity, colorInt) {
        let dxf = '';
        const points = entity.points || [];
        if (points.length < 2) return dxf;
        dxf += '0\nLWPOLYLINE\n';
        dxf += '8\n' + (entity.layer || '0') + '\n';
        dxf += '420\n' + colorInt + '\n';
        dxf += '90\n' + points.length + '\n';
        dxf += '70\n0\n';
        points.forEach(p => {
            dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
        });
        if (entity.text) {
            const pos = entity.textPosition || points[points.length - 1];
            dxf += '0\nTEXT\n';
            dxf += '8\n' + (entity.layer || '0') + '\n';
            dxf += '420\n' + colorInt + '\n';
            dxf += '10\n' + pos.x + '\n20\n' + (-pos.y) + '\n30\n0.0\n';
            dxf += '40\n' + (entity.height || 10) + '\n';
            dxf += '1\n' + entity.text + '\n';
        }
        return dxf;
    },

    entityToDXF(entity, state) {
        let dxf = '';
        const color = this.getEntityColor(entity, state);
        const colorInt = DXF.utils.hexToInt(color);

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
                dxf += '50\n' + (-DXF.utils.radToDeg(entity.end)) + '\n';
                dxf += '51\n' + (-DXF.utils.radToDeg(entity.start)) + '\n';
                break;
            case 'rect':
                dxf += '0\nLWPOLYLINE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '90\n4\n';
                dxf += '70\n1\n';
                dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p1.y) + '\n';
                dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p1.y) + '\n';
                dxf += '10\n' + entity.p2.x + '\n20\n' + (-entity.p2.y) + '\n';
                dxf += '10\n' + entity.p1.x + '\n20\n' + (-entity.p2.y) + '\n';
                break;
            case 'polyline':
                if (entity.isSpline && entity.points.length >= 2) {
                    dxf += this.splineToDXF(entity, colorInt);
                } else {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + entity.layer + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    if (entity.lineType && entity.lineType !== 'continuous') {
                        dxf += '6\n' + entity.lineType.toUpperCase() + '\n';
                    }
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n' + (entity.closed || DXF.utils.isPolygonClosed(entity.points) ? 1 : 0) + '\n';
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;
            case 'ellipse': {
                dxf += '0\nELLIPSE\n';
                dxf += '8\n' + entity.layer + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                const majorX = entity.rx * Math.cos(entity.rotation || 0);
                const majorY = entity.rx * Math.sin(entity.rotation || 0);
                dxf += '11\n' + majorX + '\n';
                dxf += '21\n' + (-majorY) + '\n';
                dxf += '31\n0.0\n';
                dxf += '40\n' + (entity.ry / entity.rx) + '\n';
                dxf += '41\n0.0\n';
                dxf += '42\n' + (Math.PI * 2) + '\n';
                break;
            }
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
                dxf += '0\nINSERT\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '2\n' + entity.blockName + '\n';
                dxf += '10\n' + entity.insertPoint.x + '\n';
                dxf += '20\n' + (-entity.insertPoint.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '41\n' + (entity.scale?.x || 1) + '\n';
                dxf += '42\n' + (entity.scale?.y || 1) + '\n';
                dxf += '43\n1.0\n';
                dxf += '50\n' + (-DXF.utils.radToDeg(entity.rotation || 0)) + '\n';
                break;
            case 'hatch':
                dxf += this.hatchEntityToDXF(entity, colorInt, state);
                break;
            case 'dimension':
                dxf += this.dimensionToDXF(entity, colorInt);
                break;
            case 'leader':
                dxf += this.leaderToDXF(entity, colorInt);
                break;
            case 'region':
                if (entity.points && entity.points.length > 0) {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + (entity.layer || '0') + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n1\n';
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;
            case 'donut':
                dxf += '0\nCIRCLE\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.outerRadius + '\n';
                dxf += '0\nCIRCLE\n';
                dxf += '8\n' + (entity.layer || '0') + '\n';
                dxf += '420\n' + colorInt + '\n';
                dxf += '10\n' + entity.center.x + '\n';
                dxf += '20\n' + (-entity.center.y) + '\n';
                dxf += '30\n0.0\n';
                dxf += '40\n' + entity.innerRadius + '\n';
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
                dxf += '41\n' + (entity.width || 0) + '\n';
                dxf += '71\n1\n';
                dxf += '1\n' + (entity.text || '') + '\n';
                if (entity.rotation) {
                    dxf += '50\n' + entity.rotation + '\n';
                }
                break;
            case 'wipeout':
                if (entity.points && entity.points.length > 0) {
                    dxf += '0\nLWPOLYLINE\n';
                    dxf += '8\n' + (entity.layer || '0') + '\n';
                    dxf += '420\n' + colorInt + '\n';
                    dxf += '90\n' + entity.points.length + '\n';
                    dxf += '70\n1\n';
                    entity.points.forEach(p => {
                        dxf += '10\n' + p.x + '\n20\n' + (-p.y) + '\n';
                    });
                }
                break;
            case 'image':
                break;
        }

        if (entity.hatch && entity.type !== 'hatch' && entity.type !== 'donut') {
            dxf += this.generateHatchDXF(entity, colorInt);
        }

        return dxf;
    },

    export(state) {
        const lines = [];
        const add = (code, value) => {
            lines.push(String(code));
            lines.push(String(value));
        };

        const layers = Array.isArray(state.layers) ? state.layers : Object.values(state.layers || {});
        const blocks = state.blocks || {};
        const entities = state.entities || [];
        const extents = this.getDrawingExtents(state);

        add(0, 'SECTION');
        add(2, 'HEADER');
        add(9, '$ACADVER');
        add(1, 'AC1015');
        add(9, '$INSBASE');
        add(10, 0.0);
        add(20, 0.0);
        add(30, 0.0);
        add(9, '$EXTMIN');
        add(10, extents.minX);
        add(20, -extents.maxY);
        add(9, '$EXTMAX');
        add(10, extents.maxX);
        add(20, -extents.minY);
        add(9, '$MEASUREMENT');
        add(70, 1);
        add(9, '$LUNITS');
        add(70, 2);
        add(9, '$INSUNITS');
        add(70, 4);
        add(0, 'ENDSEC');

        add(0, 'SECTION');
        add(2, 'TABLES');
        add(0, 'TABLE');
        add(2, 'LTYPE');
        add(70, 3);
        ['ByBlock', 'ByLayer', 'CONTINUOUS'].forEach(name => {
            add(0, 'LTYPE');
            add(2, name);
            add(70, 0);
            add(3, name === 'CONTINUOUS' ? 'Solid line' : '');
            add(72, 65);
            add(73, 0);
            add(40, 0.0);
        });
        add(0, 'ENDTAB');

        add(0, 'TABLE');
        add(2, 'STYLE');
        add(70, 1);
        add(0, 'STYLE');
        add(2, 'Standard');
        add(70, 0);
        add(40, 0.0);
        add(41, 1.0);
        add(50, 0.0);
        add(71, 0);
        add(42, 2.5);
        add(3, 'txt');
        add(0, 'ENDTAB');

        add(0, 'TABLE');
        add(2, 'LAYER');
        add(70, layers.length);
        layers.forEach(layer => {
            const flags = (layer.frozen ? 1 : 0) + (layer.locked ? 4 : 0);
            const colorIndex = this.getAciColor(layer.color);
            const layerColor = layer.visible === false ? -Math.abs(colorIndex) : colorIndex;
            const lineTypeName = (layer.lineType || 'Continuous').toString().toUpperCase();
            const lineWeight = this.getLayerLineWeight(layer.lineWeight);
            add(0, 'LAYER');
            add(2, layer.name);
            add(70, flags);
            add(62, layerColor);
            add(6, lineTypeName);
            if (lineWeight !== null) {
                add(370, lineWeight);
            }
        });
        add(0, 'ENDTAB');
        add(0, 'ENDSEC');

        const imageDefs = new Map();
        let imageHandleCounter = 1;
        const assignImageHandle = (entity) => {
            if (!entity || entity.type !== 'image') return null;
            if (entity.__dxfHandle) return entity.__dxfHandle;
            const handle = imageHandleCounter.toString(16).toUpperCase().padStart(4, '0');
            imageHandleCounter += 1;
            imageDefs.set(handle, {
                path: entity.src || '',
                width: entity.width || 0,
                height: entity.height || 0
            });
            entity.__dxfHandle = handle;
            return handle;
        };

        Object.values(blocks).forEach(block => {
            (block.entities || []).forEach(assignImageHandle);
        });
        entities.forEach(assignImageHandle);

        add(0, 'SECTION');
        add(2, 'BLOCKS');
        Object.values(blocks).forEach(block => {
            add(0, 'BLOCK');
            add(8, '0');
            add(2, block.name);
            add(70, block.isXref ? 4 : 0);
            add(10, block.basePoint?.x ?? 0);
            add(20, -(block.basePoint?.y ?? 0));
            add(30, 0.0);
            add(3, block.name);
            if (block.isXref && block.path) {
                add(1, block.path);
            }
            (block.entities || []).forEach(entity => {
                if (entity.type === 'image') {
                    const handle = assignImageHandle(entity);
                    lines.push('0', 'IMAGE');
                    lines.push('8', entity.layer || '0');
                    lines.push('10', entity.p1?.x || 0);
                    lines.push('20', -(entity.p1?.y || 0));
                    const rotation = DXF.utils.degToRad(entity.rotation || 0);
                    const width = entity.width || 0;
                    const height = entity.height || 0;
                    const cos = Math.cos(rotation);
                    const sin = Math.sin(rotation);
                    lines.push('11', width * cos);
                    lines.push('21', width * sin);
                    lines.push('12', -height * sin);
                    lines.push('22', height * cos);
                    lines.push('13', width);
                    lines.push('23', height);
                    lines.push('340', handle || '');
                } else {
                    const entityDxf = this.entityToDXF(entity, state);
                    if (entityDxf) {
                        lines.push(...entityDxf.trim().split('\n'));
                    }
                }
            });
            add(0, 'ENDBLK');
            add(8, '0');
        });
        add(0, 'ENDSEC');

        if (imageDefs.size) {
            add(0, 'SECTION');
            add(2, 'OBJECTS');
            imageDefs.forEach((def, handle) => {
                add(0, 'IMAGEDEF');
                add(5, handle);
                add(1, def.path || '');
                add(10, def.width || 0);
                add(20, def.height || 0);
            });
            add(0, 'ENDSEC');
        }

        add(0, 'SECTION');
        add(2, 'ENTITIES');
        entities.forEach(entity => {
            if (entity.type === 'image') {
                const handle = assignImageHandle(entity);
                lines.push('0', 'IMAGE');
                lines.push('8', entity.layer || '0');
                lines.push('10', entity.p1?.x || 0);
                lines.push('20', -(entity.p1?.y || 0));
                const rotation = DXF.utils.degToRad(entity.rotation || 0);
                const width = entity.width || 0;
                const height = entity.height || 0;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                lines.push('11', width * cos);
                lines.push('21', width * sin);
                lines.push('12', -height * sin);
                lines.push('22', height * cos);
                lines.push('13', width);
                lines.push('23', height);
                lines.push('340', handle || '');
            } else {
                const entityDxf = this.entityToDXF(entity, state);
                if (entityDxf) {
                    lines.push(...entityDxf.trim().split('\n'));
                }
            }
        });
        add(0, 'ENDSEC');
        add(0, 'EOF');

        return lines.join('\n');
    }
};

if (typeof window !== 'undefined') {
    window.DXF = DXF;
}
