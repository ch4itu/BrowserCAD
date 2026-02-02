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

    export(state) {
        const lines = [];
        const add = (code, value) => {
            lines.push(String(code));
            lines.push(String(value));
        };

        const layers = {};
        if (Array.isArray(state.layers)) {
            state.layers.forEach(layer => {
                layers[layer.name] = layer;
            });
        } else if (state.layers && typeof state.layers === 'object') {
            Object.assign(layers, state.layers);
        }
        if (!layers['0']) {
            layers['0'] = { name: '0', color: 7, visible: true, frozen: false, locked: false };
        }

        const blocks = state.blocks || {};

        const imageDefs = {};
        let imageHandleCounter = 1;
        const ensureImageDef = (entity) => {
            if (entity.defHandle) {
                imageDefs[entity.defHandle] = imageDefs[entity.defHandle] || {
                    path: entity.path || '',
                    width: entity.size?.w || 0,
                    height: entity.size?.h || 0
                };
                return entity.defHandle;
            }
            const handle = imageHandleCounter.toString(16).toUpperCase().padStart(4, '0');
            imageHandleCounter += 1;
            imageDefs[handle] = {
                path: entity.path || '',
                width: entity.size?.w || 0,
                height: entity.size?.h || 0
            };
            return handle;
        };

        const writeEntity = (entity) => {
            if (entity.type === 'line') {
                add(0, 'LINE');
                add(8, entity.layer || '0');
                add(10, entity.p1?.x || 0);
                add(20, entity.p1?.y || 0);
                add(11, entity.p2?.x || 0);
                add(21, entity.p2?.y || 0);
                return;
            }
            if (entity.type === 'circle') {
                add(0, 'CIRCLE');
                add(8, entity.layer || '0');
                add(10, entity.center?.x || 0);
                add(20, entity.center?.y || 0);
                add(40, entity.r || 0);
                return;
            }
            if (entity.type === 'lwpolyline') {
                add(0, 'LWPOLYLINE');
                add(8, entity.layer || '0');
                add(70, entity.closed ? 1 : 0);
                add(90, entity.points?.length || 0);
                entity.points?.forEach(point => {
                    add(10, point.x || 0);
                    add(20, point.y || 0);
                    if (point.bulge) {
                        add(42, point.bulge);
                    }
                });
                return;
            }
            if (entity.type === 'text') {
                add(0, 'TEXT');
                add(8, entity.layer || '0');
                add(10, entity.point?.x || 0);
                add(20, entity.point?.y || 0);
                add(40, entity.height || 0);
                add(1, entity.text || '');
                add(50, entity.rotation || 0);
                return;
            }
            if (entity.type === 'insert') {
                add(0, 'INSERT');
                add(8, entity.layer || '0');
                add(2, entity.blockName || '');
                add(10, entity.p?.x || 0);
                add(20, entity.p?.y || 0);
                add(41, entity.scale?.x ?? 1);
                add(42, entity.scale?.y ?? 1);
                add(50, entity.rotation || 0);
                return;
            }
            if (entity.type === 'xref') {
                add(0, 'INSERT');
                add(8, entity.layer || '0');
                add(2, entity.blockName || entity.name || '');
                add(10, entity.p?.x || 0);
                add(20, entity.p?.y || 0);
                add(41, entity.scale?.x ?? 1);
                add(42, entity.scale?.y ?? 1);
                add(50, entity.rotation || 0);
                return;
            }
            if (entity.type === 'image') {
                const handle = ensureImageDef(entity);
                add(0, 'IMAGE');
                add(8, entity.layer || '0');
                add(10, entity.p?.x || 0);
                add(20, entity.p?.y || 0);
                add(11, entity.u?.x || 0);
                add(21, entity.u?.y || 0);
                add(12, entity.v?.x || 0);
                add(22, entity.v?.y || 0);
                add(13, entity.size?.w || 0);
                add(23, entity.size?.h || 0);
                add(340, handle);
            }
        };

        add(0, 'SECTION');
        add(2, 'HEADER');
        add(9, '$ACADVER');
        add(1, 'AC1015');
        add(9, '$INSUNITS');
        add(70, state.insUnits ?? 4);
        add(9, '$EXTMIN');
        add(10, state.extMin?.x ?? 0);
        add(20, state.extMin?.y ?? 0);
        add(9, '$EXTMAX');
        add(10, state.extMax?.x ?? 0);
        add(20, state.extMax?.y ?? 0);
        add(0, 'ENDSEC');

        add(0, 'SECTION');
        add(2, 'TABLES');
        add(0, 'TABLE');
        add(2, 'LAYER');
        Object.values(layers).forEach(layer => {
            add(0, 'LAYER');
            add(2, layer.name);
            const flags = (layer.frozen ? 1 : 0) | (layer.locked ? 4 : 0);
            add(70, flags);
            const color = layer.color ?? DXF.utils.parseAciColor(layer.hex || '#ffffff');
            add(62, layer.visible === false ? -Math.abs(color) : Math.abs(color));
        });
        add(0, 'ENDTAB');

        add(0, 'TABLE');
        add(2, 'LTYPE');
        add(0, 'LTYPE');
        add(2, 'CONTINUOUS');
        add(70, 0);
        add(3, 'Solid line');
        add(72, 65);
        add(73, 0);
        add(40, 0);
        add(0, 'ENDTAB');

        add(0, 'TABLE');
        add(2, 'STYLE');
        add(0, 'STYLE');
        add(2, 'STANDARD');
        add(3, 'arial.ttf');
        add(70, 0);
        add(0, 'ENDTAB');
        add(0, 'ENDSEC');

        add(0, 'SECTION');
        add(2, 'BLOCKS');
        Object.entries(blocks).forEach(([name, block]) => {
            add(0, 'BLOCK');
            add(2, name);
            add(70, block.isXref ? 4 : 0);
            add(10, block.origin?.x ?? 0);
            add(20, block.origin?.y ?? 0);
            if (block.isXref && block.path) {
                add(1, block.path);
            }
            block.entities?.forEach(entity => writeEntity(entity));
            add(0, 'ENDBLK');
        });
        add(0, 'ENDSEC');

        const entities = state.entities || [];
        entities.forEach(entity => {
            if (entity.type === 'image') {
                ensureImageDef(entity);
            }
        });

        add(0, 'SECTION');
        add(2, 'OBJECTS');
        Object.entries(imageDefs).forEach(([handle, def]) => {
            add(0, 'IMAGEDEF');
            add(5, handle);
            add(1, def.path || '');
            add(10, def.width || 0);
            add(20, def.height || 0);
        });
        add(0, 'ENDSEC');

        add(0, 'SECTION');
        add(2, 'ENTITIES');
        entities.forEach(entity => writeEntity(entity));
        add(0, 'ENDSEC');
        add(0, 'EOF');

        return lines.join('\n');
    }
};

if (typeof window !== 'undefined') {
    window.DXF = DXF;
}
