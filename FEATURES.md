# AutoCAD vs. BrowserCAD Feature Coverage

This checklist compares commonly expected AutoCAD features against what is **present in this repository**. Items are checked when a matching command/UI exists in the codebase; unchecked items were not found during a repo scan.

Legend: **[x] implemented**, **[ ] missing (not found in repo)**

## 1) 2D Drafting & Draw Commands
BrowserCAD has strong support for core 2D primitives.
- [x] Line (LINE)
- [x] Polyline (PLINE)
- [x] Circle (CIRCLE)
- [x] Arc (ARC)
- [x] Rectangle (RECTANG)
- [x] Ellipse (ELLIPSE)
- [x] Polygon (POLYGON)
- [x] Spline (SPLINE)
- [x] Construction Lines (XLINE, RAY)
- [x] Points (POINT) + PDMODE/PDSIZE
- [x] Donut (DONUT)
- [x] Revision Cloud (REVCLOUD)
- [x] Wipeout (WIPEOUT)
- [x] Hatch (HATCH)
- [x] Boundary (BOUNDARY)
- [x] Region (REGION)
- [x] Multiline (MLINE)
- [ ] Multiline Styles (MLSTYLE)
- [ ] Trace (TRACE)
- [ ] Helix (HELIX)

## 2) Modify & Edit Commands
A broad set of 2D editing tools is implemented.
- [x] Move (MOVE)
- [x] Copy (COPY)
- [x] Rotate (ROTATE)
- [x] Scale (SCALE) + Reference mode
- [x] Mirror (MIRROR)
- [x] Erase (ERASE)
- [x] Explode (EXPLODE)
- [x] Offset (OFFSET)
- [x] Trim (TRIM)
- [x] Extend (EXTEND)
- [x] Fillet (FILLET)
- [x] Chamfer (CHAMFER)
- [x] Stretch (STRETCH)
- [x] Lengthen (LENGTHEN)
- [x] Break (BREAK)
- [x] Join (JOIN)
- [x] Array (ARRAY) - Rectangular
- [x] Polar Array (ARRAYPOLAR)
- [x] Path Array (ARRAYPATH)
- [x] Align (ALIGN)
- [x] Divide (DIVIDE)
- [x] Measure (MEASURE)
- [x] Reverse (REVERSE)
- [x] Overkill (OVERKILL)
- [x] Polyline Edit (PEDIT)
- [x] Copy with Basepoint (COPYBASE)
- [x] Paste as Block (PASTEBLOCK)
- [ ] Parametric Constraints (Geometric/Dimensional)

## 3) Annotation & Dimensions
Dimensioning and basic text tools are present; advanced styling is limited.
- [x] Single Line Text (TEXT)
- [x] Multiline Text (MTEXT)
- [x] Text Properties (SCALETEXT, JUSTIFYTEXT)
- [x] Linear Dimension (DIMLINEAR)
- [x] Aligned Dimension (DIMALIGNED)
- [x] Angular Dimension (DIMANGULAR)
- [x] Radius/Diameter (DIMRADIUS, DIMDIAMETER)
- [x] Arc Length Dimension (DIMARC)
- [x] Ordinate Dimension (DIMORDINATE)
- [x] Quick Dimension (QDIM)
- [x] Baseline/Continue (DIMBASELINE, DIMCONTINUE)
- [x] Dimension Break (DIMBREAK)
- [x] Dimension Space (DIMSPACE)
- [x] Leaders (LEADER)
- [x] Tables (TABLE)
- [ ] Dimension Styles Manager (DIMSTYLE)
- [ ] Multi-Leaders (MLEADER)
- [ ] Fields (FIELD)
- [ ] Geometric Tolerances (TOLERANCE)

## 4) Layers & Properties
Layer management is robust; advanced layer states are missing.
- [x] Layer Management (LAYER)
- [x] Layer Freeze/Thaw (LAYFRZ, LAYTHW)
- [x] Layer Lock/Unlock (LAYLCK, LAYULK)
- [x] Layer Isolate/Unisolate (LAYISO, LAYUNISO)
- [x] Layer Delete (LAYDEL)
- [x] Layer Merge (LAYMERGE)
- [x] Match Properties (MATCHPROP)
- [x] Change Properties (CHPROP)
- [ ] Layer States Manager (LAYERSTATE)
- [ ] ByBlock / ByLayer object property logic

## 5) Blocks & References
Basic internal block handling is present; external reference features are missing.
- [x] Create Block (BLOCK)
- [x] Insert Block (INSERT)
- [ ] Define Attributes (ATTDEF)
- [ ] Edit Attributes (ATTEDIT / EATTEDIT)
- [ ] Dynamic Blocks (Parameters/Actions)
- [ ] External References (XREF)
- [ ] Image Clip (IMAGECLIP)

## 6) View & Navigation
Core navigation exists; 3D navigation is not present.
- [x] Zoom (ZOOM) - Extents/Window/All
- [x] Pan (PAN)
- [x] Named Views (VIEW)
- [x] Regen (REGEN)
- [x] Draw Order (DRAWORDER)
- [x] Isolate/Hide Objects (ISOLATEOBJECTS, HIDEOBJECTS)
- [ ] Orbit (3DORBIT)
- [ ] Steering Wheels
- [ ] Viewcube

## 7) System & Utilities
A strong set of utilities and drafting aids is implemented.
- [x] Undo/Redo (UNDO, REDO)
- [x] Distance (DIST)
- [x] Area (AREA)
- [x] List Properties (LIST)
- [x] Find & Replace (FIND)
- [x] Purge (PURGE)
- [x] Groups (GROUP, UNGROUP)
- [x] Object Snap (OSNAP) - End/Mid/Cen/Int/Perp/Tan/Near
- [x] Grid & Snap (GRID, SNAP)
- [x] Ortho Mode (ORTHO)
- [x] Polar Tracking (POLAR)
- [x] Selection Cycling
- [x] Filter Selection (FILTER, QSELECT, SELECTSIMILAR)
- [x] Image Attachment (IMAGEATTACH)
- [ ] Parametric Constraints
- [ ] Calculator (QUICKCALC)
- [ ] Design Center (ADCENTER)

## 8) Programming & Scripting
AutoLISP support exists; advanced IDE/integration does not.
- [x] AutoLISP Interpreter
- [x] Load Script (APPLOAD)
- [ ] Visual LISP Editor (VLIDE)
- [ ] VBA / .NET Support
- [ ] Action Recorder

## 9) Paper Space & Layouts (Missing)
Currently Model Space only.
- [ ] Layout Tabs
- [ ] Viewports (MVIEW)
- [ ] Page Setup
- [ ] Title Blocks
- [ ] Viewport Scaling (XP)

## 10) 3D Modeling (Missing)
The engine is strictly 2D.
- [ ] 3D Navigation (Cube, Orbit)
- [ ] Visual Styles (Realistic, Shaded, X-Ray)
- [ ] Solid Modeling (Box, Sphere, Extrude, Revolve, Loft, Sweep)
- [ ] Mesh Modeling
- [ ] Boolean Operations (Union, Subtract, Intersect)
- [ ] Rendering (Materials, Lights)

## 11) File I/O
- [x] Save/Open - LocalStorage
- [x] Export - DXF
- [x] Export - JSON
- [ ] DWG Support
- [ ] PDF Import/Export
- [ ] Plot/Print (PLOT)
