# BrowserCAD

BrowserCAD is a browser-based CAD experience inspired by AutoCAD workflows. It supports classic command-line entry, a ribbon interface, and a growing set of drawing, modify, and utility commands — all in pure HTML/CSS/JavaScript with zero dependencies.

## Quick Start

1. Open `index.html` in a browser (or serve with a local HTTP server).
2. Click in the command line and type commands like `LINE`, `OFFSET`, or `IMAGEATTACH`.
3. Use **Space** or **Enter** to accept default values (just like AutoCAD).

## Command Line Basics

- **Enter/Space**: confirm default values or finish steps.
- **Esc**: cancel the active command.
- **Arrow Up/Down**: command history.
- **Tab**: autocomplete commands.

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
| STRETCH | `S` | Stretch objects via window selection. |
| JOIN | `J` | Join line/polyline segments. |
| PEDIT | `PE` | Edit polylines (Close/Open/Join/Spline/Decurve). |
| ERASE | `E` | Erase objects. |
| EXPLODE | `X` | Explode objects (rects, polylines, blocks). |
| ARRAY | `AR` | Rectangular array. |
| ARRAYPOLAR | `ARPO` | Polar array. |
| MATCHPROP | `MA` | Copy layer, color, and linetype from source to destination objects. |
| ALIGN | `AL` | Align objects using source/destination point pairs with optional scale. |
| SCALETEXT | `ST` | Scale selected text objects to a new height. |
| JUSTIFYTEXT | `JT` | Set text justification (Left/Center/Right). |
| DIVIDE | `DIV` | Place point markers at equal intervals along an object. |
| MEASURE | `ME` | Place point markers at a specified distance along an object. |
| OVERKILL | `OVERKILL` | Remove duplicate/overlapping entities. |

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

## Dimension Commands

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

### DIMORDINATE workflow

1. Run `DIMORDINATE` (or `DOR`).
2. Click the feature point to measure.
3. Click the leader endpoint (direction determines X or Y datum).
4. Optionally type `X` or `Y` before clicking to force axis.

### QDIM workflow

1. Select objects (lines, circles, arcs, rectangles).
2. Run `QDIM`.
3. Click to place the dimension line — dimensions are auto-generated for every selected object.

## Inquiry Commands

| Command | Alias | Description |
| --- | --- | --- |
| DISTANCE | `DI` | Measure distance. |
| AREA | `AA` | Measure area. |
| ID | `ID` | Read a coordinate. |
| LIST | `LI` | List selected entity properties. |

## Selection Commands

| Command | Alias | Description |
| --- | --- | --- |
| SELECTALL | `ALL` | Select all entities. |
| SELECTWINDOW |  | Window selection mode (left-to-right). |
| SELECTCROSSING |  | Crossing selection mode (right-to-left). |
| QSELECT |  | Select by object type (use `LIST` to see available types). |
| SELECTSIMILAR |  | Select all objects matching the first selected object's type. |
| FILTER | `FI` | Select entities by Type, Layer, or Color filter. |

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
| APPLOAD | `LOAD` | Load AutoLISP scripts from file. |
| VIEW | `VIEW` | Named views — Save, Restore, Delete, or List saved views. |
| FIND | `FIND` | Search and replace text in all text/mtext entities. |
| PURGE | `PU` | Remove unused layers and unreferenced block definitions. |

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

## File Commands

| Command | Alias | Description |
| --- | --- | --- |
| NEW | `NEW` | Start a new drawing. |
| SAVE | `SAVE` | Save to local storage. |
| OPEN | `OPEN` | Load from local storage. |
| EXPORT | `DXFOUT` | Export to DXF. |

Export also supports SVG and JSON formats via the title bar menu.

## AutoLISP Guide

BrowserCAD includes a lightweight AutoLISP interpreter for scripting and automation. Enter expressions in the command line using parentheses:

```
(+ 1 2 3)
(setq x 10)
(command "circle" '(0 0) 50)
```

### Loading LISP scripts

Use `APPLOAD` (or `LOAD`) to upload a `.lsp` file from your machine. The script is loaded into the session and can define new functions/commands.

### Common AutoLISP helpers

- `(command "line" '(0 0) '(100 0))` - run a built-in command with arguments.
- `(getpoint "Pick a point:")` - prompt for a point.
- `(getstring "Name:")` - prompt for text input.
- `(getreal "Enter a value:")` - prompt for a real number.
- `(getint "Enter an integer:")` - prompt for an integer.
- `(entsel "Select object:")` - select a single entity.
- `(ssget)` - select multiple entities.
- `(entget (car (entsel)))` - get entity data from a selection.

### Tips

- Use **Space** or **Enter** to submit LISP expressions.
- Use `(help)` inside AutoLISP for available functions.

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
  storage.js        File I/O — DXF/SVG/JSON export, local storage
  state.js          Global state management (entities, layers, undo/redo)
  autolisp.js       AutoLISP interpreter (tokenizer, parser, evaluator)
  ui.js             User interface, command input, ribbon, properties panel
  utils.js          Utility functions (vector math, distance, transforms)
```

---

Try it live: https://ch4itu.github.io/HTMLCAD/
