# BrowserCAD

BrowserCAD is a browser-based CAD experience inspired by industry-standard CAD workflows. It supports classic command-line entry, a ribbon interface, and a growing set of drawing, modify, and utility commands — all in pure HTML/CSS/JavaScript with zero dependencies by default (Google Drive APIs load dynamically when you use Drive features).

## Quick Start

1. Open `index.html` in a browser (or serve with a local HTTP server).
2. Click in the command line and type commands like `LINE`, `OFFSET`, or `IMAGEATTACH`.
3. Use **Space** or **Enter** to accept default values (as in many CAD tools).

## Help & Documentation

- Press **F1** or run `HELP`/`?` to display the in-app quick reference.
- Run `HELP <command>` (example: `HELP TRIM`) for command-specific guidance.
- Mobile users can access **Help** from the menu drawer.

## Command Line Basics

- **Enter/Space**: confirm default values or finish steps.
- **Esc**: cancel the active command.
- **Arrow Up/Down**: command history.
- **Tab**: autocomplete commands.

## Interface Overview

- **Desktop UI**: Ribbon tabs, command line, status toggles, properties panel, and layout tabs.
- **Selection ribbon**: Contextual prompts for modify commands and selection workflows.
- **Layer management**: Layer list, visibility, lock/freeze, and layer state manager.
- **Layout tabs**: Model and paper space backgrounds (viewports/plotting pending).

## Mobile & Touch Interface

- **Draw bar** replaces the command line, with prompt text and contextual sub-actions.
- **Actions**: Done, Undo, Redo, Close (for polylines), and Cancel.
- **Inputs**: Numeric keypad toggle, system keyboard (`Aa`), and tap-to-draw.
- **Tool tabs**: Draw, Modify, Dims, View, Snap tool rows for touch workflows.
- **Snap toggles**: OSNAP, Grid, Ortho, Polar, and Pan mode from the Snap tab.

## Drawing Commands

| Command | Alias | Description |
| --- | --- | --- |
| LINE | `L` | Draw lines. |
| PLINE | `PL` | Draw polylines. |
| CIRCLE | `C` | Draw circles. |
| ARC | `A` | Draw arcs. |
| RECT | `REC` | Draw rectangles. |
| ELLIPSE | `EL` | Draw ellipses. |
| TEXT | `T` | Add single-line text. |
| MTEXT | `MT` | Add multi-line text. |
| LEADER | `LE` | Add a leader with text. |
| POLYGON | `POL` | Draw a regular polygon. |
| DONUT | `DO` | Draw donuts. |
| RAY | `RAY` | Draw rays. |
| XLINE | `XL` | Draw construction lines. |
| SPLINE | `SPL` | Draw splines. |
| HATCH | `H` | Hatch closed areas. |
| IMAGEATTACH | `IMAGE`, `ATTACH` | Attach an image for tracing. |
| REVCLOUD | `RC` | Draw revision cloud markup. |
| WIPEOUT | `WIPEOUT` | Create masking polygon that hides background entities. |
| SOLID | `SO` | Create filled triangle/quad solid shapes. |
| REGION | `REG` | Detect closed boundary at click point and create a region entity. |
| BOUNDARY | `BO` | Detect enclosing boundary at click point and create a polyline. |
| MLINE | `ML` | Draw multiple parallel lines. |
| TABLE | `TB` | Create a table grid. |
| TRACE | `TRACE` | Draw thick filled bands (pairs of points). |

### IMAGEATTACH workflow

1. Run `IMAGEATTACH`.
2. Choose an image file.
3. Specify insertion point.
4. Specify scale factor (or click a corner).
5. Specify rotation angle.

Defaults for scale/rotation are reused when you press **Enter** or **Space**.

### REVCLOUD workflow

1. Run `REVCLOUD` (or `RC`).
2. Enter arc length or press **Enter** for the default.
3. Click points to form the cloud outline.
4. Close the cloud by clicking near the start point or press **Enter**.

### SOLID workflow

1. Run `SOLID` (or `SO`).
2. Click 3 points (triangle) or 4 points (quad).
3. Press **Enter** after 3 points for a triangle, or click a 4th point for a quad.

## Modify Commands

| Command | Alias | Description |
| --- | --- | --- |
| MOVE | `M` | Move objects. |
| COPY | `CO` | Copy objects. |
| ROTATE | `RO` | Rotate objects. |
| SCALE | `SC` | Scale objects (supports Copy/Reference). |
| MIRROR | `MI` | Mirror objects. |
| OFFSET | `O` | Offset entities (uses `OFFSETGAPTYPE` for polylines/rects). |
| TRIM | `TR` | Trim objects. |
| EXTEND | `EX` | Extend objects. |
| FILLET | `F` | Fillet between two lines. |
| CHAMFER | `CHA` | Chamfer between two lines. |
| BREAK | `BR` | Break an object. |
| LENGTHEN | `LEN` | Lengthen/shorten lines and arcs. |
| STRETCH | `S` | Stretch objects via window selection. |
| JOIN | `J` | Join line/polyline segments. |
| PEDIT | `PE` | Edit polylines (Close/Open/Join/Spline/Decurve). |
| ERASE | `E` | Erase objects. |
| EXPLODE | `X` | Explode objects (rects, polylines, blocks). |
| ARRAY | `AR` | Rectangular array. |
| ARRAYPOLAR | `ARPO` | Polar array. |
| ARRAYPATH |  | Array objects along a path. |
| MATCHPROP | `MA` | Copy layer, color, and linetype from source to destination objects. |
| ALIGN | `AL` | Align objects using source/destination point pairs with optional scale. |
| SCALETEXT | `ST` | Scale selected text objects to a new height. |
| JUSTIFYTEXT | `JT` | Set text justification (Left/Center/Right). |
| DIVIDE | `DIV` | Place point markers at equal intervals along an object. |
| MEASURE | `ME` | Place point markers at a specified distance along an object. |
| OVERKILL | `OVERKILL` | Remove duplicate/overlapping entities. |
| CHPROP | `CH` | Change properties (color/layer/linetype/etc.). |
| DRAWORDER | `DR` | Move objects front/back/above/below. |
| TEXTTOFRONT |  | Bring text/dims/leaders to the front. |
| ISOLATEOBJECTS |  | Isolate selected objects; hide others. |
| HIDEOBJECTS |  | Hide selected objects temporarily. |
| UNISOLATEOBJECTS |  | Restore hidden objects. |
| GROUP | `G` | Group objects for selection. |
| UNGROUP |  | Ungroup objects. |
| COPYBASE |  | Copy with a base point. |
| PASTEBLOCK |  | Paste clipboard as a block reference. |
| REVERSE |  | Reverse line/arc/polyline direction. |
| IMAGECLIP | `ICL` | Clip an image to a rectangular boundary (New/ON/OFF/Delete). |

### MATCHPROP workflow

1. Run `MATCHPROP` (or `MA`).
2. Click the **source** object whose properties you want to copy.
3. Click one or more **destination** objects.
4. Press **Enter** to finish.

### ALIGN workflow

1. Select objects to align.
2. Run `ALIGN` (or `AL`).
3. Click first source point, then first destination point.
4. Click second source point, then second destination point.
5. Choose whether to scale objects to fit (`Y`/`N`).

## Block Commands

| Command | Alias | Description |
| --- | --- | --- |
| BLOCK | `B`, `BMAKE` | Create a block from selected objects. |
| INSERT | `I`, `DDINSERT` | Insert a block reference. |
| ATTDEF | `ATT` | Define block attributes (tag, prompt, default value). |
| ATTEDIT | `ATE` | Edit attribute values on block references. |

### BLOCK workflow

1. Select the objects you want to include in the block.
2. Run `BLOCK` (or `B`).
3. Enter a name for the block.
4. Specify the base point (insertion point).
5. The original objects are replaced with a block reference.

### INSERT workflow

1. Run `INSERT` (or `I`).
2. Enter the block name (available blocks are listed).
3. Specify scale factor (default: 1).
4. Specify rotation angle (default: 0).
5. Click to place the block. Press **Enter** to finish.

Block references can be moved, rotated, scaled, mirrored, and copied like any other entity. Use `EXPLODE` to convert a block reference back to individual entities.

### ATTDEF workflow

1. Run `ATTDEF` (or `ATT`).
2. Enter the attribute tag (identifier name).
3. Enter the prompt text (shown when inserting the block).
4. Enter a default value.
5. Enter text height.
6. Click to place the attribute definition.

### ATTEDIT workflow

1. Select a block reference containing attributes.
2. Run `ATTEDIT` (or `ATE`).
3. Enter `tag=value` pairs to update attribute values (e.g. `TITLE=New Title`).
4. Press **Enter** to finish editing.

## Dimension & Annotation Commands

| Command | Alias | Description |
| --- | --- | --- |
| DIMLINEAR | `DIM` | Linear dimension. |
| DIMALIGNED | `DAL` | Aligned dimension. |
| DIMANGULAR | `DAN` | Angular dimension. |
| DIMRADIUS | `DRA` | Radius dimension. |
| DIMDIAMETER | `DDI` | Diameter dimension. |
| DIMBASELINE |  | Baseline dimension from last linear dimension. |
| DIMCONTINUE |  | Continue dimension from last linear dimension. |
| DIMORDINATE | `DOR` | Ordinate dimension (X or Y datum value with leader). |
| QDIM | `QDIM` | Quick dimension — auto-creates dimensions for selected objects. |
| DIMARC | `DIMARC` | Arc length dimension (select arc, place dimension arc). |
| DIMBREAK | `DIMBREAK` | Toggle dimension line break on/off. |
| DIMSPACE | `DIMSPACE` | Evenly space selected dimension lines at a given interval. |
| MLEADER | `MLD` | Create multileader with line segments and text. |
| MLEADERSTYLE | `MLDS` | Create and manage multileader styles. |
| MLEADERALIGN |  | Align text positions of selected multileaders. |
| MLEADERCOLLECT |  | Collect multiple leaders into a single multileader. |
| TOLERANCE | `TOL` | Insert GD&T feature control frames. |
| FIELD |  | Insert dynamic field (Date, Filename, Author, NumObjects, Title). |

### DIMORDINATE workflow

1. Run `DIMORDINATE` (or `DOR`).
2. Click the feature point to measure.
3. Click the leader endpoint (direction determines X or Y datum).
4. Optionally type `X` or `Y` before clicking to force axis.

### QDIM workflow

1. Select objects (lines, circles, arcs, rectangles).
2. Run `QDIM`.
3. Click to place the dimension line — dimensions are auto-generated for every selected object.

### MLEADER workflow

1. Run `MLEADER` (or `MLD`).
2. Click to place leader points (line segments).
3. Press **Enter** to finish placing points.
4. Click to place the text position.
5. Enter the leader text.

### TOLERANCE workflow

1. Run `TOLERANCE` (or `TOL`).
2. Enter the geometric characteristic symbol (e.g., `p` for position, `r` for perpendicularity).
3. Enter tolerance value (e.g., `0.05`).
4. Enter datum references (e.g., `A B` or press **Enter** to skip).
5. Click to place the feature control frame.

Symbols: `u` Position, `r` Perpendicularity, `p` Parallelism, `a` Angularity, `c` Concentricity, `s` Symmetry, `t` Circular Runout, `x` Total Runout, `f` Flatness, `n` Cylindricity, `o` Roundness, `l` Straightness, `pf` Profile Surface, `pl` Profile Line.

### FIELD workflow

1. Run `FIELD`.
2. Choose a field type: **Date**, **Filename**, **Author**, **NumObjects**, or **Title**.
3. Click to place the field.

Fields display dynamic values and can be refreshed with `REGEN`.

## Inquiry Commands

| Command | Alias | Description |
| --- | --- | --- |
| DISTANCE | `DI` | Measure distance. |
| AREA | `AA` | Measure area. |
| ID | `ID` | Read a coordinate. |
| LIST | `LI` | List selected entity properties. |
| QUICKCALC | `QC` | Open the in-line calculator for math expressions. |
| COUNT |  | Count entities by type and list block reference counts. |

## Selection Commands

| Command | Alias | Description |
| --- | --- | --- |
| SELECTALL | `ALL` | Select all entities. |
| SELECTWINDOW |  | Window selection mode (left-to-right). |
| SELECTCROSSING |  | Crossing selection mode (right-to-left). |
| QSELECT |  | Select by object type (use `LIST` to see available types). |
| SELECTSIMILAR |  | Select all objects matching the first selected object's type. |
| FILTER | `FI` | Select entities by Type, Layer, or Color filter. |
| SELECTPREVIOUS |  | Re-select the last selection set. |

### Selection cycling

When multiple objects overlap at the click point, clicking again in the same spot cycles through them one by one. The command line shows `Cycling (1/N)` feedback.

### FILTER workflow

1. Run `FILTER` (or `FI`).
2. Choose filter mode: **Type**, **Layer**, **Color**, or **All**.
3. Enter the value to match (e.g. `line`, `0`, `#ff0000`).
4. All matching visible entities are selected.

## Layer Commands

| Command | Alias | Description |
| --- | --- | --- |
| LAYER |  | Create, set, and toggle layer visibility (New/Set/On/Off/List). |
| LAYFRZ | `LAYFRZ` | Freeze a layer (turn off visibility). |
| LAYTHW | `LAYTHW` | Thaw a layer (turn on visibility). |
| LAYON | `LAYON` | Turn layer visibility on. |
| LAYOFF | `LAYOFF` | Turn layer visibility off. |
| LAYLCK | `LAYLOCK` | Lock a layer (prevents entity modification). |
| LAYULK | `LAYUNLOCK` | Unlock a layer. |
| LAYDEL | `LAYDELETE` | Delete a layer (entities moved to layer "0"). |
| LAYISO | `LAYISOLATE` | Click an object to isolate its layer; all other layers are hidden. |
| LAYUNISO | `LAYUNISOLATE` | Restore layer visibility after isolation. |
| LAYMERGE | `LAYMRG` | Merge source layer into destination (moves entities, deletes source). |

## View & Utility Commands

| Command | Alias | Description |
| --- | --- | --- |
| ZOOM | `Z` | Zoom (All/Extents/Window/Center). |
| PAN | `P` | Pan view. |
| REGEN | `RE` | Regenerate display. |
| UNDO | `U` | Undo last action. |
| REDO | `Y` | Redo last action. |
| APPLOAD | `LOAD` | Load Lisp scripts from file. |
| VIEW | `VIEW` | Named views — Save, Restore, Delete, or List saved views. |
| FIND | `FIND` | Search and replace text in all text/mtext entities. |
| PURGE | `PU` | Remove unused layers and unreferenced block definitions. |
| MVIEW |  | Create a paper space viewport. |
| MSPACE |  | Activate model space inside a viewport. |
| PSPACE |  | Return to paper space. |
| PLOT |  | Plot the current layout to PDF. |
| PAGESETUP | `PSETUP` | Configure paper size, orientation, scale, and margins. |
| VPSCALE | `XP` | Set viewport scale factor. |

### VIEW workflow

1. Run `VIEW`.
2. Choose an option:
   - **Save** — enter a name to save the current pan/zoom as a named view.
   - **Restore** — enter a name to restore a previously saved view.
   - **Delete** — remove a named view.
   - **List** — show all saved view names.

### FIND workflow

1. Run `FIND`.
2. Enter the search string.
3. Enter the replacement string (or press **Enter** to find-only and select matches).

## Settings Commands

| Command | Description |
| --- | --- |
| GRID | Toggle grid. |
| SNAP | Toggle snap. |
| ORTHO | Toggle ortho mode. |
| OSNAP | Toggle object snap or enable specific modes (End/Mid/Cen/Int/Per/Tan/Nea). |
| POLAR | Toggle polar tracking or set polar angle. |
| OFFSETGAPTYPE | Set gap type (0=Extend, 1=Fillet, 2=Chamfer). |
| PDMODE | Set point display mode. |
| PDSIZE | Set point display size. |
| TEXTSIZE | Set text height. |
| DIMTXT | Set dimension text height. |
| DIMASZ | Set dimension arrow size. |
| DIMSCALE | Set overall dimension scale. |
| DIMDEC | Set dimension precision (decimal places). |
| LINETYPE | Set current or selected linetype (continuous/dashed/dotted/dashdot). |
| LTSCALE | Set global linetype scale. |
| MLEADERSTYLE | Create/manage multileader styles (arrow, text, landing). |
| MLSTYLE | Create/manage multiline styles (element offsets, caps). |
| DIMSTYLE | Save/restore dimension variable presets. |

## Drafting Aids & Snaps

- **OSNAP modes**: endpoint, midpoint, center, intersection, perpendicular, tangent, nearest.
- **Grid snap**: snap to grid points (F9 on desktop).
- **Ortho**: constrain input to orthogonal directions (F8).
- **Polar tracking**: angle-based tracking (F10).
- **Active geometry snapping**: OSNAP considers the in-progress segment during drawing.
- **Selection cycling**: click repeatedly to cycle overlapping objects.

## File Commands

| Command | Alias | Description |
| --- | --- | --- |
| NEW | `NEW` | Start a new drawing. |
| SAVE | `SAVE` | Save to local storage. |
| OPEN | `OPEN` | Load from local storage. |
| EXPORT | `DXFOUT` | Export to DXF. |

### Import/Export Formats

- **DXF**: Import and export (module-based with legacy fallback).
- **SVG**: Import and export (geometry conversion).
- **JSON**: Import and export (native scene data).

### Local + Drive Storage

- **Local storage**: Save/Open from the browser.
- **Google Drive**: Open and Save (Drive APIs load on demand).

## Properties & Styles

The Properties panel reflects per-entity attributes, including color overrides (defaulting to ByLayer), and dimension variables can be adjusted via DIMTXT, DIMASZ, DIMSCALE, and DIMDEC commands.

## Layouts & Layer States

BrowserCAD includes layout tabs (Model + Paper Space), viewport creation, and a lightweight layer state manager. Use `LAYOUT` to create/switch/delete layouts, `MVIEW` to create viewports, `MSPACE`/`PSPACE` to toggle the active space, and `PLOT` for PDF output. `PAGESETUP` configures paper size, orientation, scale, and margins. `VPSCALE` (or `XP`) sets viewport scale. `LAYERSTATE` saves/restores named layer configurations.

Styles can be managed via `DIMSTYLE` (dimension presets), `MLEADERSTYLE` (multileader arrow/text/landing settings), and `MLSTYLE` (multiline element offsets and end caps).

## Lisp Guide

BrowserCAD includes a lightweight Lisp interpreter compatible with standard CAD scripts for scripting and automation. Enter expressions in the command line using parentheses:

```
(+ 1 2 3)
(setq x 10)
(command "circle" '(0 0) 50)
```

### Loading Lisp scripts

Use `APPLOAD` (or `LOAD`) to upload a `.lsp` file from your machine. The script is loaded into the session and can define new functions/commands.

### Common Lisp helpers

- `(command "line" '(0 0) '(100 0))` - run a built-in command with arguments.
- `(getpoint "Pick a point:")` - prompt for a point.
- `(getstring "Name:")` - prompt for text input.
- `(getreal "Enter a value:")` - prompt for a real number.
- `(getint "Enter an integer:")` - prompt for an integer.
- `(entsel "Select object:")` - select a single entity.
- `(ssget)` - select multiple entities.
- `(entget (car (entsel)))` - get entity data from a selection.

### Tips

- Use **Space** or **Enter** to submit Lisp expressions.
- Use `(help)` inside Lisp for available functions.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+F1** | Collapse/expand ribbon |
| **F2** | Toggle grid |
| **F3** | Toggle object snap (OSNAP) |
| **F8** | Toggle ortho mode |
| **F10** | Toggle polar tracking |
| **Esc** | Cancel active command |
| **Space/Enter** | Confirm / repeat last command |
| **Middle mouse** | Pan |
| **Scroll wheel** | Zoom in/out |
| **Double middle-click** | Zoom extents |

## Architecture

```
index.html          Application shell with ribbon interface
css/style.css       UI styling
js/
  app.js            Initialization and viewport events
  commands.js       All command implementations
  geometry.js       Geometric algorithms (intersections, offsets, snapping)
  renderer.js       Canvas 2D rendering engine
  dxf.js            DXF import/export module
  storage.js        File I/O — DXF/SVG/JSON import/export, local storage, Drive
  state.js          Global state management (entities, layers, undo/redo)
  lisp.js           Lisp interpreter (tokenizer, parser, evaluator)
  ui.js             User interface, command input, ribbon, properties panel
  utils.js          Utility functions (vector math, distance, transforms)
```

---

Try it live: https://ch4itu.github.io/BrowserCAD/

## Legal Disclaimer
This project is an independent open-source work. Certain software, scripting languages, and file formats mentioned herein are registered trademarks of their respective owners. This application is not affiliated with, endorsed by, or sponsored by those owners. Uses of these terms are for descriptive purposes only.
