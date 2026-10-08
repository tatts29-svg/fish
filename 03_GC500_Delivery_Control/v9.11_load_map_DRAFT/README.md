Author: Andrew Fisher

DRAFT — compact Timeline and geographic load-order map.

The map sits beside the complete daily delivery order. Each load keeps its native identity; numbers follow the current arrival sequence. Separate labels identify nearby drops and loads sharing a destination. Visible labels remain tied to the original confirmed ground positions. References with only a report point, approximate drawing position or inset callout remain explicitly unplaced.

Order controls use the existing day-order save. Selecting a map label alone does not change the order. Search filtering never silently renumbers or removes loads from the day’s order list. A selected building stays selected by its stable load identity after reordering.

The street/satellite view reuses the application’s configured map provider. It is independent of the main map and keeps the load list usable if imagery is unavailable. No new key, coordinate, road route or operational record is embedded by the patch.

Native load cards are arranged more compactly, keeping references, arrival facts, asset details, progress lights and existing actions. Crew and Traffic control fields remain readable in both editing and viewing modes. Today imagery/weather, header panels and existing navigation remain.

Build with `patch_v911.py BASE OUTPUT` from the current staff-selector release. Tests cover source preservation, location/order semantics, captured native reorders, provider imagery, nearby labels, responsive card layout and existing navigation. Detailed evidence remains in the private release folder. This folder is not yet approved for publication.
