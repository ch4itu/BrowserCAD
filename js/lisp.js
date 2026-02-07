/* ============================================
   BrowserCAD - Lisp Interpreter Module
   ============================================ */

const Lisp = {
    // Environment for variables
    globalEnv: {},

    // User-defined functions
    userFunctions: {},

    // Command history for LISP
    history: [],

    // Pending user input callbacks
    pendingInput: null,
    inputType: null,
    inputPrompt: null,
    inputCallback: null,

    // ==========================================
    // TOKENIZER
    // ==========================================

    tokenize(code) {
        const tokens = [];
        let i = 0;

        while (i < code.length) {
            const char = code[i];

            // Skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Comments
            if (char === ';') {
                while (i < code.length && code[i] !== '\n') i++;
                continue;
            }

            // Single quote (for quoting)
            if (char === "'") {
                tokens.push({ type: 'quote' });
                i++;
                continue;
            }

            // Parentheses
            if (char === '(' || char === ')') {
                tokens.push(char);
                i++;
                continue;
            }

            // Strings — handles nested parens, escape sequences, and unterminated strings
            if (char === '"') {
                let str = '';
                i++; // Skip opening quote
                while (i < code.length && code[i] !== '"') {
                    if (code[i] === '\\' && i + 1 < code.length) {
                        i++;
                        switch (code[i]) {
                            case 'n': str += '\n'; break;
                            case 't': str += '\t'; break;
                            case '\\': str += '\\'; break;
                            case '"': str += '"'; break;
                            default: str += code[i];
                        }
                    } else {
                        // All characters (including parens) are literal inside strings
                        str += code[i];
                    }
                    i++;
                }
                if (i >= code.length) {
                    // Unterminated string — report gracefully instead of crashing
                    throw new Error('Unterminated string literal');
                }
                i++; // Skip closing quote
                tokens.push({ type: 'string', value: str });
                continue;
            }

            // Numbers and symbols
            let token = '';
            while (i < code.length && !/[\s()"';]/.test(code[i])) {
                token += code[i];
                i++;
            }

            if (token) {
                // Check if it's a number
                const num = parseFloat(token);
                if (!isNaN(num) && isFinite(num)) {
                    tokens.push({ type: 'number', value: num });
                } else {
                    tokens.push({ type: 'symbol', value: token.toUpperCase() });
                }
            }
        }

        return tokens;
    },

    // ==========================================
    // PARSER
    // ==========================================

    parse(tokens) {
        let pos = 0;

        const parseExpr = () => {
            if (pos >= tokens.length) return null;

            const token = tokens[pos];

            // Handle quote: 'expr becomes (QUOTE expr)
            if (token && token.type === 'quote') {
                pos++; // Skip the quote token
                const quotedExpr = parseExpr();
                return [{ type: 'symbol', value: 'QUOTE' }, quotedExpr];
            }

            if (token === '(') {
                pos++; // Skip '('
                const list = [];
                while (pos < tokens.length && tokens[pos] !== ')') {
                    const expr = parseExpr();
                    if (expr !== null) list.push(expr);
                }
                pos++; // Skip ')'
                return list;
            } else if (token === ')') {
                throw new Error('Unexpected )');
            } else {
                pos++;
                return token;
            }
        };

        const expressions = [];
        while (pos < tokens.length) {
            const expr = parseExpr();
            if (expr !== null) expressions.push(expr);
        }

        return expressions;
    },

    // ==========================================
    // EVALUATOR
    // ==========================================

    // Step counter for runaway-loop protection
    _evalSteps: 0,
    _maxEvalSteps: 100000,

    async evaluate(expr, env = this.globalEnv) {
        // Runaway protection — bail after _maxEvalSteps recursive evals
        if (++this._evalSteps > this._maxEvalSteps) {
            throw new Error('Execution limit exceeded (possible infinite loop)');
        }

        // Null/undefined
        if (expr === null || expr === undefined) {
            return null;
        }

        // Atoms (numbers, strings)
        if (typeof expr === 'object' && expr.type === 'number') {
            return expr.value;
        }
        if (typeof expr === 'object' && expr.type === 'string') {
            return expr.value;
        }

        // Symbols (variables)
        if (typeof expr === 'object' && expr.type === 'symbol') {
            const name = expr.value;

            // Check for special constants
            if (name === 'T') return true;
            if (name === 'NIL') return null;
            if (name === 'PI') return Math.PI;

            // Check environment
            if (name in env) return env[name];
            if (name in this.globalEnv) return this.globalEnv[name];

            // Unknown variable
            return null;
        }

        // Lists (function calls)
        if (Array.isArray(expr)) {
            if (expr.length === 0) return null;

            const first = expr[0];
            const funcName = typeof first === 'object' && first.type === 'symbol'
                ? first.value
                : null;

            // Special forms
            if (funcName === 'QUOTE' || funcName === "'") {
                return expr[1];
            }

            if (funcName === 'SETQ') {
                const results = [];
                for (let i = 1; i < expr.length; i += 2) {
                    const varName = expr[i].value;
                    const value = await this.evaluate(expr[i + 1], env);
                    this.globalEnv[varName] = value;
                    results.push(value);
                }
                return results[results.length - 1];
            }

            if (funcName === 'IF') {
                const condition = await this.evaluate(expr[1], env);
                if (condition && condition !== null) {
                    return await this.evaluate(expr[2], env);
                } else if (expr.length > 3) {
                    return await this.evaluate(expr[3], env);
                }
                return null;
            }

            if (funcName === 'COND') {
                for (let i = 1; i < expr.length; i++) {
                    const clause = expr[i];
                    const condition = await this.evaluate(clause[0], env);
                    if (condition && condition !== null) {
                        let result = null;
                        for (let j = 1; j < clause.length; j++) {
                            result = await this.evaluate(clause[j], env);
                        }
                        return result;
                    }
                }
                return null;
            }

            if (funcName === 'WHILE') {
                let result = null;
                while (true) {
                    const condition = await this.evaluate(expr[1], env);
                    if (!condition || condition === null) break;
                    for (let i = 2; i < expr.length; i++) {
                        result = await this.evaluate(expr[i], env);
                    }
                }
                return result;
            }

            if (funcName === 'REPEAT') {
                const count = await this.evaluate(expr[1], env);
                let result = null;
                for (let i = 0; i < count; i++) {
                    for (let j = 2; j < expr.length; j++) {
                        result = await this.evaluate(expr[j], env);
                    }
                }
                return result;
            }

            if (funcName === 'FOREACH') {
                const varName = expr[1].value;
                const list = await this.evaluate(expr[2], env);
                let result = null;
                if (Array.isArray(list)) {
                    for (const item of list) {
                        env[varName] = item;
                        for (let i = 3; i < expr.length; i++) {
                            result = await this.evaluate(expr[i], env);
                        }
                    }
                }
                return result;
            }

            if (funcName === 'PROGN') {
                let result = null;
                for (let i = 1; i < expr.length; i++) {
                    result = await this.evaluate(expr[i], env);
                }
                return result;
            }

            if (funcName === 'DEFUN') {
                const name = expr[1].value;
                const params = expr[2].map(p => p.value);
                const body = expr.slice(3);
                this.userFunctions[name] = { params, body };
                return name;
            }

            if (funcName === 'LAMBDA') {
                const params = expr[1].map(p => p.value);
                const body = expr.slice(2);
                return { type: 'lambda', params, body, env: { ...env } };
            }

            if (funcName === 'AND') {
                for (let i = 1; i < expr.length; i++) {
                    const val = await this.evaluate(expr[i], env);
                    if (!val || val === null) return null;
                }
                return true;
            }

            if (funcName === 'OR') {
                for (let i = 1; i < expr.length; i++) {
                    const val = await this.evaluate(expr[i], env);
                    if (val && val !== null) return val;
                }
                return null;
            }

            // Evaluate all arguments for regular functions
            const func = funcName ? this.getFunction(funcName) : await this.evaluate(first, env);
            const args = [];
            for (let i = 1; i < expr.length; i++) {
                args.push(await this.evaluate(expr[i], env));
            }

            // Call the function
            if (typeof func === 'function') {
                return await func.apply(this, args);
            }

            // User-defined function
            if (func && func.type === 'lambda') {
                const newEnv = { ...func.env };
                for (let i = 0; i < func.params.length; i++) {
                    newEnv[func.params[i]] = args[i];
                }
                let result = null;
                for (const bodyExpr of func.body) {
                    result = await this.evaluate(bodyExpr, newEnv);
                }
                return result;
            }

            // User-defined function by name
            if (funcName && this.userFunctions[funcName]) {
                const userFunc = this.userFunctions[funcName];
                const newEnv = { ...env };
                for (let i = 0; i < userFunc.params.length; i++) {
                    newEnv[userFunc.params[i]] = args[i];
                }
                let result = null;
                for (const bodyExpr of userFunc.body) {
                    result = await this.evaluate(bodyExpr, newEnv);
                }
                return result;
            }

            throw new Error(`Unknown function: ${funcName}`);
        }

        return expr;
    },

    // ==========================================
    // BUILT-IN FUNCTIONS
    // ==========================================

    getFunction(name) {
        const functions = {
            // ========== MATH FUNCTIONS ==========
            '+': (...args) => args.reduce((a, b) => a + b, 0),
            '-': (...args) => args.length === 1 ? -args[0] : args.reduce((a, b) => a - b),
            '*': (...args) => args.reduce((a, b) => a * b, 1),
            '/': (...args) => args.reduce((a, b) => a / b),
            '1+': (n) => n + 1,
            '1-': (n) => n - 1,
            'ABS': (n) => Math.abs(n),
            'SIN': (n) => Math.sin(n),
            'COS': (n) => Math.cos(n),
            'TAN': (n) => Math.tan(n),
            'ATAN': (y, x) => x !== undefined ? Math.atan2(y, x) : Math.atan(y),
            'SQRT': (n) => Math.sqrt(n),
            'EXPT': (base, exp) => Math.pow(base, exp),
            'EXP': (n) => Math.exp(n),
            'LOG': (n) => Math.log(n),
            'MIN': (...args) => Math.min(...args),
            'MAX': (...args) => Math.max(...args),
            'REM': (a, b) => a % b,
            'GCD': (a, b) => {
                a = Math.abs(a);
                b = Math.abs(b);
                while (b) { [a, b] = [b, a % b]; }
                return a;
            },
            'FIX': (n) => Math.trunc(n),
            'FLOAT': (n) => parseFloat(n),

            // ========== COMPARISON ==========
            '=': (a, b) => a === b ? true : null,
            '/=': (a, b) => a !== b ? true : null,
            '<': (a, b) => a < b ? true : null,
            '>': (a, b) => a > b ? true : null,
            '<=': (a, b) => a <= b ? true : null,
            '>=': (a, b) => a >= b ? true : null,
            'EQ': (a, b) => a === b ? true : null,
            'EQUAL': (a, b) => JSON.stringify(a) === JSON.stringify(b) ? true : null,

            // ========== LIST FUNCTIONS ==========
            'LIST': (...args) => args,
            'CONS': (a, b) => Array.isArray(b) ? [a, ...b] : [a, b],
            'CAR': (list) => Array.isArray(list) && list.length > 0 ? list[0] : null,
            'CDR': (list) => Array.isArray(list) && list.length > 1 ? list.slice(1) : null,
            'CADR': (list) => Array.isArray(list) && list.length > 1 ? list[1] : null,
            'CADDR': (list) => Array.isArray(list) && list.length > 2 ? list[2] : null,
            'CAAR': (list) => {
                if (Array.isArray(list) && list.length > 0 && Array.isArray(list[0])) {
                    return list[0][0];
                }
                return null;
            },
            'LAST': (list) => Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null,
            'NTH': (n, list) => Array.isArray(list) ? list[n] : null,
            'LENGTH': (list) => Array.isArray(list) ? list.length : (typeof list === 'string' ? list.length : 0),
            'REVERSE': (list) => Array.isArray(list) ? [...list].reverse() : null,
            'APPEND': (...lists) => lists.flat(),
            'MEMBER': (item, list) => {
                if (!Array.isArray(list)) return null;
                const idx = list.findIndex(x => JSON.stringify(x) === JSON.stringify(item));
                return idx >= 0 ? list.slice(idx) : null;
            },
            'ASSOC': (key, alist) => {
                if (!Array.isArray(alist)) return null;
                for (const item of alist) {
                    if (Array.isArray(item) && item[0] === key) return item;
                }
                return null;
            },
            'SUBST': (newItem, oldItem, list) => {
                if (!Array.isArray(list)) return list;
                return list.map(item =>
                    JSON.stringify(item) === JSON.stringify(oldItem) ? newItem :
                    Array.isArray(item) ? functions['SUBST'](newItem, oldItem, item) : item
                );
            },
            'MAPCAR': async (func, ...lists) => {
                const len = Math.min(...lists.map(l => l.length));
                const result = [];
                for (let i = 0; i < len; i++) {
                    const args = lists.map(l => l[i]);
                    if (func.type === 'lambda') {
                        const newEnv = { ...func.env };
                        for (let j = 0; j < func.params.length; j++) {
                            newEnv[func.params[j]] = args[j];
                        }
                        let res = null;
                        for (const bodyExpr of func.body) {
                            res = await Lisp.evaluate(bodyExpr, newEnv);
                        }
                        result.push(res);
                    }
                }
                return result;
            },
            'APPLY': async (func, args) => {
                if (func.type === 'lambda') {
                    const newEnv = { ...func.env };
                    for (let i = 0; i < func.params.length; i++) {
                        newEnv[func.params[i]] = args[i];
                    }
                    let res = null;
                    for (const bodyExpr of func.body) {
                        res = await Lisp.evaluate(bodyExpr, newEnv);
                    }
                    return res;
                }
                return null;
            },

            // ========== STRING FUNCTIONS ==========
            'STRCAT': (...args) => args.join(''),
            'STRLEN': (str) => str ? str.length : 0,
            'SUBSTR': (str, start, len) => str ? str.substring(start - 1, len ? start - 1 + len : undefined) : '',
            'STRCASE': (str, upper) => str ? (upper ? str.toLowerCase() : str.toUpperCase()) : '',
            'ATOI': (str) => parseInt(str) || 0,
            'ATOF': (str) => parseFloat(str) || 0.0,
            'ITOA': (num) => String(Math.trunc(num)),
            'RTOS': (num, mode, prec) => {
                prec = prec || 4;
                return num.toFixed(prec);
            },
            'ANGTOS': (angle, mode, prec) => {
                prec = prec || 4;
                const deg = angle * 180 / Math.PI;
                return deg.toFixed(prec);
            },
            'ASCII': (str) => str ? str.charCodeAt(0) : 0,
            'CHR': (code) => String.fromCharCode(code),

            // ========== TYPE CHECKING ==========
            'NULL': (x) => (x === null || x === undefined || (Array.isArray(x) && x.length === 0)) ? true : null,
            'ATOM': (x) => !Array.isArray(x) ? true : null,
            'LISTP': (x) => Array.isArray(x) ? true : null,
            'NUMBERP': (x) => typeof x === 'number' ? true : null,
            'MINUSP': (x) => typeof x === 'number' && x < 0 ? true : null,
            'ZEROP': (x) => x === 0 ? true : null,
            'TYPE': (x) => {
                if (x === null || x === undefined) return 'NIL';
                if (typeof x === 'number') return x % 1 === 0 ? 'INT' : 'REAL';
                if (typeof x === 'string') return 'STR';
                if (Array.isArray(x)) return 'LIST';
                if (typeof x === 'object' && x.type === 'ename') return 'ENAME';
                return 'SYM';
            },

            // ========== LOGICAL ==========
            'NOT': (x) => (!x || x === null) ? true : null,
            'BOOLE': (op, a, b) => {
                const ops = { 1: (x, y) => x & y, 6: (x, y) => x ^ y, 7: (x, y) => x | y };
                return ops[op] ? ops[op](a, b) : 0;
            },

            // ========== UTILITY ==========
            'EVAL': async (expr) => await Lisp.evaluate(expr),
            'READ': (str) => {
                const tokens = Lisp.tokenize(str);
                const parsed = Lisp.parse(tokens);
                return parsed[0];
            },

            // ========== OUTPUT ==========
            'PRINT': (x) => { UI.log(Lisp.toString(x)); return x; },
            'PRINC': (x) => { UI.log(typeof x === 'string' ? x : Lisp.toString(x)); return x; },
            'PRIN1': (x) => { UI.log(Lisp.toString(x)); return x; },
            'PROMPT': (msg) => { UI.log(msg); return null; },
            'ALERT': (msg) => { alert(msg); return null; },
            'TERPRI': () => { UI.log(''); return null; },

            // ========== CAD SPECIFIC - GEOMETRY ==========
            'DISTANCE': (p1, p2) => Utils.dist(
                { x: p1[0], y: p1[1] },
                { x: p2[0], y: p2[1] }
            ),
            'ANGLE': (p1, p2) => Utils.angle(
                { x: p1[0], y: p1[1] },
                { x: p2[0], y: p2[1] }
            ),
            'POLAR': (pt, ang, dist) => {
                const x = pt[0] + dist * Math.cos(ang);
                const y = pt[1] + dist * Math.sin(ang);
                return [x, y, 0];
            },
            'INTERS': (p1, p2, p3, p4, onseg) => {
                const result = Geometry.segmentSegmentIntersection(
                    { x: p1[0], y: p1[1] },
                    { x: p2[0], y: p2[1] },
                    { x: p3[0], y: p3[1] },
                    { x: p4[0], y: p4[1] }
                );
                return result ? [result.x, result.y, 0] : null;
            },

            // ========== CAD SPECIFIC - USER INPUT ==========
            'GETPOINT': async (basePoint, prompt) => {
                return await Lisp.getUserInput('point', prompt || 'Specify point:');
            },
            'GETCORNER': async (basePoint, prompt) => {
                return await Lisp.getUserInput('corner', prompt || 'Specify corner:', basePoint);
            },
            'GETDIST': async (basePoint, prompt) => {
                return await Lisp.getUserInput('dist', prompt || 'Specify distance:');
            },
            'GETANGLE': async (basePoint, prompt) => {
                return await Lisp.getUserInput('angle', prompt || 'Specify angle:');
            },
            'GETORIENT': async (basePoint, prompt) => {
                return await Lisp.getUserInput('angle', prompt || 'Specify orientation:');
            },
            'GETREAL': async (prompt) => {
                return await Lisp.getUserInput('real', prompt || 'Enter a real number:');
            },
            'GETINT': async (prompt) => {
                return await Lisp.getUserInput('int', prompt || 'Enter an integer:');
            },
            'GETSTRING': async (allowSpaces, prompt) => {
                return await Lisp.getUserInput('string', prompt || 'Enter text:');
            },
            'GETKWORD': async (prompt) => {
                return await Lisp.getUserInput('keyword', prompt || 'Enter option:');
            },
            'INITGET': (bits, keywords) => {
                Lisp.initgetBits = bits;
                Lisp.initgetKeywords = keywords;
                return null;
            },

            // ========== CAD SPECIFIC - ENTITY ACCESS ==========
            'ENTSEL': async (prompt) => {
                return await Lisp.getUserInput('entsel', prompt || 'Select object:');
            },
            'SSGET': async (mode, pt1, pt2, filterList) => {
                if (!mode || mode === 'I') {
                    // Implied selection (use current selection)
                    if (CAD.selectedIds.length > 0) {
                        return { type: 'sset', ids: [...CAD.selectedIds] };
                    }
                }
                // Interactive selection
                return await Lisp.getUserInput('ssget', 'Select objects:');
            },
            'SSLENGTH': (ss) => ss && ss.ids ? ss.ids.length : 0,
            'SSNAME': (ss, index) => {
                if (ss && ss.ids && index < ss.ids.length) {
                    return { type: 'ename', id: ss.ids[index] };
                }
                return null;
            },
            'SSADD': (ename, ss) => {
                if (!ss) return { type: 'sset', ids: ename ? [ename.id] : [] };
                if (ename) ss.ids.push(ename.id);
                return ss;
            },
            'SSDEL': (ename, ss) => {
                if (ss && ename) {
                    ss.ids = ss.ids.filter(id => id !== ename.id);
                }
                return ss;
            },
            'SSMEMB': (ename, ss) => {
                if (ss && ename && ss.ids.includes(ename.id)) return ename;
                return null;
            },

            'ENTGET': (ename) => {
                if (!ename || !ename.id) return null;
                const entity = CAD.getEntity(ename.id);
                if (!entity) return null;
                return Lisp.entityToAssocList(entity);
            },
            'ENTMOD': (elist) => {
                const id = Lisp.getAssoc(-1, elist);
                if (!id) return null;

                const entity = CAD.getEntity(id.id);
                if (!entity) return null;

                CAD.saveUndoState('LISP ENTMOD');
                Lisp.assocListToEntity(elist, entity);
                Renderer.draw();
                return elist;
            },
            'ENTMAKE': (elist) => {
                const entityData = Lisp.assocListToNewEntity(elist);
                if (!entityData) return null;

                CAD.saveUndoState('LISP ENTMAKE');
                const entity = CAD.addEntity(entityData, true);
                Renderer.draw();
                return Lisp.entityToAssocList(entity);
            },
            'ENTDEL': (ename) => {
                if (!ename || !ename.id) return null;
                CAD.saveUndoState('LISP ENTDEL');
                CAD.removeEntity(ename.id, true);
                Renderer.draw();
                return ename;
            },
            'ENTNEXT': (ename) => {
                const entities = CAD.entities;
                if (!ename) {
                    return entities.length > 0 ? { type: 'ename', id: entities[0].id } : null;
                }
                const idx = entities.findIndex(e => e.id === ename.id);
                if (idx >= 0 && idx < entities.length - 1) {
                    return { type: 'ename', id: entities[idx + 1].id };
                }
                return null;
            },
            'ENTLAST': () => {
                const entities = CAD.entities;
                return entities.length > 0
                    ? { type: 'ename', id: entities[entities.length - 1].id }
                    : null;
            },

            // ========== CAD SPECIFIC - COMMANDS ==========
            'COMMAND': async (...args) => {
                // Helper to extract value from token or return as-is
                const getValue = (v) => {
                    if (v && typeof v === 'object' && v.type === 'number') return v.value;
                    if (v && typeof v === 'object' && v.type === 'string') return v.value;
                    return v;
                };

                for (let i = 0; i < args.length; i++) {
                    let arg = getValue(args[i]);

                    if (typeof arg === 'string') {
                        if (arg === '') {
                            // Empty string acts as Enter
                            Commands.handleInput('');
                        } else if (arg.startsWith('_')) {
                            // Command name
                            Commands.execute(arg.substring(1));
                        } else {
                            // Try as command or input
                            if (!Commands.handleInput(arg)) {
                                Commands.execute(arg);
                            }
                        }
                    } else if (Array.isArray(arg)) {
                        // Point - extract values from token objects
                        const x = getValue(arg[0]);
                        const y = getValue(arg[1]);
                        Commands.handleClick({ x: x, y: y });
                    } else if (typeof arg === 'number') {
                        Commands.handleInput(String(arg));
                    }
                    // Small delay to allow command processing
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                Renderer.draw();
                return null;
            },

            // ========== CAD SPECIFIC - SYSTEM ==========
            'GETVAR': (name) => {
                const vars = {
                    'CMDNAMES': CAD.activeCmd || '',
                    'LASTPOINT': CAD.cursor ? [CAD.cursor.x, CAD.cursor.y, 0] : [0, 0, 0],
                    'VIEWCTR': [CAD.pan.x, CAD.pan.y, 0],
                    'VIEWSIZE': Renderer.canvas ? Renderer.canvas.height / CAD.zoom : 1000,
                    'CLAYER': CAD.currentLayer,
                    'SNAPMODE': CAD.snapEnabled ? 1 : 0,
                    'GRIDMODE': CAD.showGrid ? 1 : 0,
                    'ORTHOMODE': CAD.orthoEnabled ? 1 : 0,
                    'OSMODE': Lisp.getOsmode(),
                    'CMDECHO': 1,
                    'ERRNO': 0
                };
                return vars[name.toUpperCase()] !== undefined ? vars[name.toUpperCase()] : null;
            },
            'SETVAR': (name, value) => {
                switch (name.toUpperCase()) {
                    case 'CLAYER':
                        CAD.setCurrentLayer(value);
                        UI.updateLayerUI();
                        break;
                    case 'SNAPMODE':
                        CAD.snapEnabled = value !== 0;
                        UI.updateStatusBar();
                        break;
                    case 'GRIDMODE':
                        CAD.showGrid = value !== 0;
                        UI.updateStatusBar();
                        Renderer.draw();
                        break;
                    case 'ORTHOMODE':
                        CAD.orthoEnabled = value !== 0;
                        UI.updateStatusBar();
                        break;
                    case 'OSMODE':
                        Lisp.setOsmode(value);
                        break;
                }
                return value;
            },

            // ========== CAD SPECIFIC - TABLES ==========
            'TBLSEARCH': (table, name) => {
                if (table.toUpperCase() === 'LAYER') {
                    const layer = CAD.getLayer(name);
                    if (layer) {
                        return [[0, 'LAYER'], [2, layer.name], [70, layer.locked ? 4 : 0], [62, Lisp.colorToACI(layer.color)]];
                    }
                }
                return null;
            },
            'TBLNEXT': (table, rewind) => {
                // Simplified implementation
                if (table.toUpperCase() === 'LAYER' && CAD.layers.length > 0) {
                    const layer = CAD.layers[0];
                    return [[0, 'LAYER'], [2, layer.name], [70, 0], [62, 7]];
                }
                return null;
            },

            // ========== LAYER FUNCTIONS ==========
            'LAYERP': (name) => CAD.getLayer(name) ? true : null,
        };

        functions['HELP'] = () => {
            const names = Object.keys(functions).sort();
            UI.log('Lisp functions:');
            const chunkSize = 12;
            for (let i = 0; i < names.length; i += chunkSize) {
                UI.log(names.slice(i, i + chunkSize).join(', '));
            }
            return true;
        };

        return functions[name] || null;
    },

    // ==========================================
    // ENTITY CONVERSION HELPERS
    // ==========================================

    entityToAssocList(entity) {
        const list = [
            [-1, { type: 'ename', id: entity.id }],
            [0, entity.type.toUpperCase()],
            [8, entity.layer]
        ];

        switch (entity.type) {
            case 'line':
                list.push([10, entity.p1.x], [20, entity.p1.y], [30, 0]);
                list.push([11, entity.p2.x], [21, entity.p2.y], [31, 0]);
                break;
            case 'circle':
                list.push([10, entity.center.x], [20, entity.center.y], [30, 0]);
                list.push([40, entity.r]);
                break;
            case 'arc':
                list.push([10, entity.center.x], [20, entity.center.y], [30, 0]);
                list.push([40, entity.r]);
                list.push([50, entity.start * 180 / Math.PI]);
                list.push([51, entity.end * 180 / Math.PI]);
                break;
            case 'polyline':
                list.push([70, Utils.isPolygonClosed(entity.points) ? 1 : 0]);
                entity.points.forEach(p => {
                    list.push([10, p.x], [20, p.y], [30, 0]);
                });
                break;
            case 'text':
                list.push([10, entity.position.x], [20, entity.position.y], [30, 0]);
                list.push([40, entity.height]);
                list.push([1, entity.text]);
                break;
        }

        return list;
    },

    assocListToEntity(elist, entity) {
        const get = (code) => {
            for (const item of elist) {
                if (item[0] === code) return item[1];
            }
            return null;
        };

        entity.layer = get(8) || entity.layer;

        switch (entity.type) {
            case 'line':
                if (get(10) !== null) entity.p1.x = get(10);
                if (get(20) !== null) entity.p1.y = get(20);
                if (get(11) !== null) entity.p2.x = get(11);
                if (get(21) !== null) entity.p2.y = get(21);
                break;
            case 'circle':
                if (get(10) !== null) entity.center.x = get(10);
                if (get(20) !== null) entity.center.y = get(20);
                if (get(40) !== null) entity.r = get(40);
                break;
            case 'arc':
                if (get(10) !== null) entity.center.x = get(10);
                if (get(20) !== null) entity.center.y = get(20);
                if (get(40) !== null) entity.r = get(40);
                if (get(50) !== null) entity.start = get(50) * Math.PI / 180;
                if (get(51) !== null) entity.end = get(51) * Math.PI / 180;
                break;
            case 'text':
                if (get(10) !== null) entity.position.x = get(10);
                if (get(20) !== null) entity.position.y = get(20);
                if (get(40) !== null) entity.height = get(40);
                if (get(1) !== null) entity.text = get(1);
                break;
        }
    },

    assocListToNewEntity(elist) {
        const get = (code) => {
            for (const item of elist) {
                if (item[0] === code) return item[1];
            }
            return null;
        };

        const type = get(0);
        if (!type) return null;

        const entity = { type: type.toLowerCase(), layer: get(8) || CAD.currentLayer };

        switch (entity.type) {
            case 'line':
                entity.p1 = { x: get(10) || 0, y: get(20) || 0 };
                entity.p2 = { x: get(11) || 0, y: get(21) || 0 };
                break;
            case 'circle':
                entity.center = { x: get(10) || 0, y: get(20) || 0 };
                entity.r = get(40) || 10;
                break;
            case 'arc':
                entity.center = { x: get(10) || 0, y: get(20) || 0 };
                entity.r = get(40) || 10;
                entity.start = (get(50) || 0) * Math.PI / 180;
                entity.end = (get(51) || 90) * Math.PI / 180;
                break;
            case 'text':
                entity.position = { x: get(10) || 0, y: get(20) || 0 };
                entity.height = get(40) || 10;
                entity.text = get(1) || '';
                break;
            default:
                return null;
        }

        return entity;
    },

    getAssoc(code, elist) {
        for (const item of elist) {
            if (item[0] === code) return item[1];
        }
        return null;
    },

    // ==========================================
    // USER INPUT HANDLING
    // ==========================================

    async getUserInput(type, prompt, basePoint = null) {
        return new Promise((resolve) => {
            this.pendingInput = resolve;
            this.inputType = type;
            this.inputPrompt = prompt;
            this.inputBasePoint = basePoint;

            UI.log(prompt, 'prompt');
            CAD.lispInputMode = true;
            CAD.lispInputType = type;
        });
    },

    handleUserInput(value) {
        if (!this.pendingInput) return false;

        let result = null;

        switch (this.inputType) {
            case 'point':
            case 'corner':
                if (value && value.x !== undefined) {
                    result = [value.x, value.y, 0];
                }
                break;
            case 'dist':
                result = parseFloat(value);
                break;
            case 'angle':
                result = parseFloat(value) * Math.PI / 180;
                break;
            case 'real':
                result = parseFloat(value);
                break;
            case 'int':
                result = parseInt(value);
                break;
            case 'string':
            case 'keyword':
                result = value;
                break;
            case 'entsel':
                if (value && value.entity) {
                    result = [{ type: 'ename', id: value.entity.id }, [value.point.x, value.point.y, 0]];
                }
                break;
            case 'ssget':
                if (value && value.ids) {
                    result = { type: 'sset', ids: value.ids };
                }
                break;
        }

        CAD.lispInputMode = false;
        CAD.lispInputType = null;

        const resolve = this.pendingInput;
        this.pendingInput = null;
        this.inputType = null;
        resolve(result);

        return true;
    },

    // ==========================================
    // OSMODE HELPERS
    // ==========================================

    getOsmode() {
        let mode = 0;
        if (CAD.snapModes.endpoint) mode |= 1;
        if (CAD.snapModes.midpoint) mode |= 2;
        if (CAD.snapModes.center) mode |= 4;
        if (CAD.snapModes.intersection) mode |= 32;
        if (CAD.snapModes.perpendicular) mode |= 128;
        if (CAD.snapModes.tangent) mode |= 256;
        if (CAD.snapModes.nearest) mode |= 512;
        return mode;
    },

    setOsmode(mode) {
        CAD.snapModes.endpoint = (mode & 1) !== 0;
        CAD.snapModes.midpoint = (mode & 2) !== 0;
        CAD.snapModes.center = (mode & 4) !== 0;
        CAD.snapModes.intersection = (mode & 32) !== 0;
        CAD.snapModes.perpendicular = (mode & 128) !== 0;
        CAD.snapModes.tangent = (mode & 256) !== 0;
        CAD.snapModes.nearest = (mode & 512) !== 0;
    },

    colorToACI(hex) {
        const rgb = Utils.hexToRgb(hex);
        if (!rgb) return 7;
        if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) return 1;
        if (rgb.r > 200 && rgb.g > 200 && rgb.b < 100) return 2;
        if (rgb.r < 100 && rgb.g > 200 && rgb.b < 100) return 3;
        if (rgb.r < 100 && rgb.g > 200 && rgb.b > 200) return 4;
        if (rgb.r < 100 && rgb.g < 100 && rgb.b > 200) return 5;
        if (rgb.r > 200 && rgb.g < 100 && rgb.b > 200) return 6;
        return 7;
    },

    // ==========================================
    // STRING CONVERSION
    // ==========================================

    toString(value) {
        if (value === null || value === undefined) return 'nil';
        if (value === true) return 'T';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') return `"${value}"`;
        if (value.type === 'ename') return `<Entity name: ${value.id}>`;
        if (value.type === 'sset') return `<Selection set: ${value.ids.length} entities>`;
        if (value.type === 'lambda') return '<Function>';
        if (Array.isArray(value)) {
            return '(' + value.map(v => this.toString(v)).join(' ') + ')';
        }
        return String(value);
    },

    // ==========================================
    // MAIN EXECUTION
    // ==========================================

    async execute(code) {
        // Reset step counter for each top-level execution
        this._evalSteps = 0;
        try {
            this.history.push(code);
            const tokens = this.tokenize(code);
            const expressions = this.parse(tokens);

            // Race the evaluation against a 10-second timeout
            const evalPromise = (async () => {
                let result = null;
                for (const expr of expressions) {
                    result = await this.evaluate(expr);
                }
                return result;
            })();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Execution timed out (10s limit)')), 10000)
            );

            return await Promise.race([evalPromise, timeoutPromise]);
        } catch (error) {
            UI.log(`; error: ${error.message}`, 'error');
            console.error('LISP Error:', error);
            return null;
        }
    },

    // ==========================================
    // LOAD LISP FILE/CODE
    // ==========================================

    async load(code) {
        UI.log(`; Loading LISP code...`);
        const result = await this.execute(code);
        UI.log(`; LISP loaded.`);
        return result;
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lisp;
}
