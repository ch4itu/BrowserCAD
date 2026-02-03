/* ============================================
   BrowserCAD - DXF Parser/Exporter
   ============================================ */

const DXF = (() => {
    const DEFAULT_HEADER = {
        $ACADVER: 'AC1015',
        $INSUNITS: 4
    };

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
                const color = Math.abs(parseIntValue(layerTags[62], 7));
                data.layers[name] = {
                    name,
                    color,
                    visible: color >= 0,
                    frozen: (flags & 1) === 1,
                    locked: (flags & 4) === 4
                };
            }
        }
    };

    const parseLwPolyline = (tags) => {
        const points = [];
        const bulges = [];
        const vertexCount = parseIntValue(tags[90], 0);
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

    const parseEntity = (type, reader) => {
        const tags = parseEntityTags(reader);
        const layer = tags[8] || '0';
        switch (type) {
            case 'LINE':
                return {
                    type: 'line',
                    layer,
                    // 10/20/30 = start X/Y/Z, 11/21/31 = end X/Y/Z
                    p1: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    p2: { x: parseNumber(tags[11]), y: parseNumber(tags[21]), z: parseNumber(tags[31]) }
                };
            case 'CIRCLE':
                return {
                    type: 'circle',
                    layer,
                    // 10/20/30 = center X/Y/Z, 40 = radius
                    center: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    r: parseNumber(tags[40])
                };
            case 'ARC':
                return {
                    type: 'arc',
                    layer,
                    // 10/20/30 = center X/Y/Z, 40 = radius, 50/51 = start/end angles (degrees)
                    center: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    r: parseNumber(tags[40]),
                    start: parseNumber(tags[50]),
                    end: parseNumber(tags[51])
                };
            case 'LWPOLYLINE': {
                const poly = parseLwPolyline(tags);
                return {
                    type: 'lwpolyline',
                    layer,
                    points: poly.points,
                    closed: poly.closed
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
                    // 1/3 = text string, 10/20/30 = insertion point, 40 = height, 50 = rotation
                    text: textChunks.join('') || '',
                    point: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    height: parseNumber(tags[40], 0),
                    rotation: parseNumber(tags[50], 0)
                };
            }
            case 'INSERT': {
                const scaleX = parseNumber(tags[41], 1);
                const scaleY = parseNumber(tags[42], scaleX || 1);
                return {
                    type: 'insert',
                    layer,
                    // 2 = block name, 10/20/30 = insertion point, 41/42 = scale, 50 = rotation
                    blockName: tags[2] || '',
                    p: { x: parseNumber(tags[10]), y: parseNumber(tags[20]), z: parseNumber(tags[30]) },
                    scale: { x: scaleX || 1, y: scaleY || 1 },
                    rotation: parseNumber(tags[50], 0)
                };
            }
            case 'HATCH': {
                const points = [];
                let pendingX = null;
                tags.list.forEach(tag => {
                    if (tag.code === 10) {
                        pendingX = parseNumber(tag.value);
                    } else if (tag.code === 20 && pendingX !== null) {
                        points.push({ x: pendingX, y: parseNumber(tag.value) });
                        pendingX = null;
                    }
                });
                return {
                    type: 'hatch',
                    layer,
                    // 2 = pattern name, 91 = loop count, 41 = scale, 52 = angle
                    pattern: tags[2] || 'ANSI31',
                    loopCount: parseIntValue(tags[91], 0),
                    scale: parseNumber(tags[41], 1),
                    angle: parseNumber(tags[52], 0),
                    points
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
                while (reader.peek()) {
                    const inner = reader.peek();
                    if (inner.code === 0 && inner.value === 'ENDBLK') {
                        reader.next();
                        break;
                    }
                    if (inner.code === 0) {
                        const entityType = reader.next().value;
                        const entity = parseEntity(entityType, reader);
                        if (entity) {
                            entities.push(entity);
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
        while (reader.peek()) {
            const peek = reader.peek();
            if (peek.code === 0 && peek.value === 'ENDSEC') {
                reader.next();
                break;
            }
            if (peek.code === 0) {
                const type = reader.next().value;
                const entity = parseEntity(type, reader);
                if (entity) {
                    data.entities.push(entity);
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

    const writeTables = (out, layers = []) => {
        out.push('0', 'SECTION', '2', 'TABLES');
        out.push('0', 'TABLE', '2', 'LAYER', '70', String(layers.length || 1));
        const layerList = layers.length ? layers : [{ name: '0', color: 7, visible: true, frozen: false, locked: false }];
        layerList.forEach(layer => {
            const flags = (layer.frozen ? 1 : 0) | (layer.locked ? 4 : 0);
            const color = layer.color ?? 7;
            out.push('0', 'LAYER');
            out.push('2', layer.name || '0');
            out.push('70', String(flags));
            out.push('62', String(color));
            out.push('6', 'CONTINUOUS');
        });
        out.push('0', 'ENDTAB');
        out.push('0', 'ENDSEC');
    };

    const writeEntityLine = (out, entity) => {
        out.push('0', 'LINE');
        out.push('8', entity.layer || '0');
        // 10/20/30 = start X/Y/Z, 11/21/31 = end X/Y/Z
        out.push('10', formatNumber(entity.p1?.x), '20', formatNumber(entity.p1?.y), '30', formatNumber(entity.p1?.z || 0));
        out.push('11', formatNumber(entity.p2?.x), '21', formatNumber(entity.p2?.y), '31', formatNumber(entity.p2?.z || 0));
    };

    const writeEntityCircle = (out, entity) => {
        out.push('0', 'CIRCLE');
        out.push('8', entity.layer || '0');
        // 10/20/30 = center X/Y/Z, 40 = radius
        out.push('10', formatNumber(entity.center?.x), '20', formatNumber(entity.center?.y), '30', formatNumber(entity.center?.z || 0));
        out.push('40', formatNumber(entity.r || 0));
    };

    const writeEntityArc = (out, entity) => {
        out.push('0', 'ARC');
        out.push('8', entity.layer || '0');
        // 10/20/30 = center X/Y/Z, 40 = radius, 50/51 = start/end angles
        out.push('10', formatNumber(entity.center?.x), '20', formatNumber(entity.center?.y), '30', formatNumber(entity.center?.z || 0));
        out.push('40', formatNumber(entity.r || 0));
        out.push('50', formatNumber(entity.start || 0));
        out.push('51', formatNumber(entity.end || 0));
    };

    const writeEntityLwPolyline = (out, entity) => {
        const points = entity.points || [];
        const closedFlag = entity.closed ? 1 : 0;
        out.push('0', 'LWPOLYLINE');
        out.push('8', entity.layer || '0');
        // 90 = vertex count, 70 = closed flag
        out.push('90', String(points.length));
        out.push('70', String(closedFlag));
        points.forEach(point => {
            // 10/20/30 = vertex X/Y/Z, 42 = bulge
            out.push('10', formatNumber(point.x));
            out.push('20', formatNumber(point.y));
            if (point.z !== undefined) {
                out.push('30', formatNumber(point.z));
            }
            if (point.bulge) {
                out.push('42', formatNumber(point.bulge));
            }
        });
    };

    const writeEntityText = (out, entity, isMText = false) => {
        out.push('0', isMText ? 'MTEXT' : 'TEXT');
        out.push('8', entity.layer || '0');
        // 10/20/30 = insertion X/Y/Z, 40 = height, 1 = text, 50 = rotation
        out.push('10', formatNumber(entity.point?.x), '20', formatNumber(entity.point?.y), '30', formatNumber(entity.point?.z || 0));
        out.push('40', formatNumber(entity.height || 0));
        out.push('1', entity.text || '');
        if (entity.rotation) {
            out.push('50', formatNumber(entity.rotation));
        }
    };

    const writeEntityInsert = (out, entity) => {
        const insertPoint = entity.insertPoint || entity.p || { x: entity.x || 0, y: entity.y || 0, z: 0 };
        const scale = entity.scale || { x: entity.scaleX ?? 1, y: entity.scaleY ?? 1 };
        const rotation = entity.rotation || 0;
        const rotationDeg = Math.abs(rotation) <= Math.PI * 2 + 0.001 ? rotation * (180 / Math.PI) : rotation;
        out.push('0', 'INSERT');
        out.push('8', entity.layer || '0');
        out.push('2', entity.blockName || '');
        out.push('10', formatNumber(insertPoint.x), '20', formatNumber(insertPoint.y), '30', formatNumber(insertPoint.z || 0));
        out.push('41', formatNumber(scale.x ?? 1));
        out.push('42', formatNumber(scale.y ?? 1));
        out.push('50', formatNumber(rotationDeg));
    };

    const getHatchBoundaryPoints = (entity, state) => {
        if (entity.points && entity.points.length) return entity.points;
        if (entity.boundary && entity.boundary.length && entity.boundary[0].x !== undefined) {
            return entity.boundary;
        }
        if (entity.clipIds && state?.getEntity) {
            const clip = state.getEntity(entity.clipIds[0]);
            if (clip?.points) return clip.points;
            if (clip?.type === 'circle') {
                const points = [];
                const steps = 36;
                for (let i = 0; i < steps; i++) {
                    const angle = (Math.PI * 2 * i) / steps;
                    points.push({
                        x: clip.center.x + Math.cos(angle) * clip.r,
                        y: clip.center.y + Math.sin(angle) * clip.r
                    });
                }
                return points;
            }
        }
        return [];
    };

    const writeEntityHatch = (out, entity, state) => {
        const points = getHatchBoundaryPoints(entity, state);
        if (!points.length) return;
        const pattern = (entity.patternName || entity.pattern || entity.hatch?.pattern || 'ANSI31').toUpperCase();
        const scale = entity.scale || 1;
        const angle = entity.angle || 0;
        out.push('0', 'HATCH');
        out.push('8', entity.layer || '0');
        out.push('2', pattern);
        out.push('70', '0');
        out.push('71', '0');
        out.push('91', '1');
        out.push('92', '2');
        out.push('72', '1');
        out.push('73', '1');
        out.push('93', String(points.length));
        points.forEach(point => {
            out.push('10', formatNumber(point.x));
            out.push('20', formatNumber(point.y));
        });
        out.push('97', '0');
        out.push('75', '0');
        out.push('52', formatNumber(angle));
        out.push('41', formatNumber(scale));
    };

    const writeBlocksSection = (out, blocks = {}, state = null) => {
        out.push('0', 'SECTION', '2', 'BLOCKS');
        Object.values(blocks).forEach(block => {
            const basePoint = block.basePoint || block.origin || { x: 0, y: 0, z: 0 };
            out.push('0', 'BLOCK');
            out.push('2', block.name || 'BLOCK');
            out.push('70', '0');
            out.push('10', formatNumber(basePoint.x), '20', formatNumber(basePoint.y), '30', formatNumber(basePoint.z || 0));
            out.push('3', block.name || 'BLOCK');
            out.push('1', '');
            (block.entities || []).forEach(entity => {
                writeEntity(out, entity, state);
            });
            out.push('0', 'ENDBLK');
        });
        out.push('0', 'ENDSEC');
    };

    const writeEntity = (out, entity, state) => {
        switch (entity.type) {
            case 'line':
                writeEntityLine(out, entity);
                break;
            case 'circle':
                writeEntityCircle(out, entity);
                break;
            case 'arc':
                writeEntityArc(out, entity);
                break;
            case 'lwpolyline':
            case 'polyline':
                writeEntityLwPolyline(out, entity);
                break;
            case 'text':
                writeEntityText(out, entity, false);
                break;
            case 'mtext':
                writeEntityText(out, entity, true);
                break;
            case 'insert':
            case 'block':
                writeEntityInsert(out, entity);
                break;
            case 'hatch':
                writeEntityHatch(out, entity, state);
                break;
            default:
                break;
        }
    };

    const writeEntitiesSection = (out, entities = [], state = null) => {
        out.push('0', 'SECTION', '2', 'ENTITIES');
        entities.forEach(entity => writeEntity(out, entity, state));
        out.push('0', 'ENDSEC');
    };

    const generateDXF = (stateOrEntities = [], layers = []) => {
        const state = Array.isArray(stateOrEntities)
            ? { entities: stateOrEntities, layers, blocks: {} }
            : (stateOrEntities || { entities: [], layers: [], blocks: {} });
        const out = [];
        out.push('0', 'SECTION', '2', 'HEADER');
        out.push('9', '$ACADVER', '1', DEFAULT_HEADER.$ACADVER);
        out.push('9', '$INSUNITS', '70', String(DEFAULT_HEADER.$INSUNITS));
        out.push('0', 'ENDSEC');
        writeTables(out, state.layers || []);
        writeBlocksSection(out, state.blocks || {}, state);
        writeEntitiesSection(out, state.entities || [], state);
        out.push('0', 'EOF');
        return out.join('\n');
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
