Author: Andrew Fisher

The architecture refinement preserves the complete existing building source, source roof heights and footprints, placement, circuit, simulation, cameras and nominal pit garages. It adds generic coastal facade detail only to the exact elevations selected by v7.92. It does not identify or reconstruct a named landmark.

Private photographs 20675, 20677, 20682, 20687 and 20692 were visually inspected alongside the v7.94 desktop tour baseline at sections 02, 04, 07 and 10. The references support pale continuous balcony slabs, dark recessed residential glazing, visible slab soffits, glass or masonry balcony fronts, slender upper rails, vertical structural divisions, and darker street-level facade bases. The original photographs remain private and are not included here.

The implementation adds actual side faces to the window recesses and balcony rails, darker indirect lighting beneath slabs, local derivative-filtered window divisions and restrained window variation. Existing deterministic profiles retain their allocation. The pale terraces profile keeps masonry fronts; the other profiles use opaque shaded glass representations, consistent with the existing single opaque draw. No transparency pass, texture, sampler or per-frame geometry rebuild is added. Folded horizontal handrail caps now face upward; v7.92 generated these caps with downward normals.

CPU checks on the hosted source passed 38 assertions:

- 2,730 source rows, including all 26 nominal pit garages, remain unchanged.
- All 354 eligible facades on 80 tower parts remain detailed across all 10 eligible circuit sectors. Sectors 6 and 11 contain no eligible towers; the dense synthetic fixture covers all 12 sectors.
- Actual triangles increase from 77,308 to 85,432 within the unchanged 150,000 total and 12,500-per-sector caps. Physical balcony slabs increase from 2,420 to 3,542. One draw call is retained; the architecture mesh uses 9,226,656 GPU bytes.
- Maximum declared balcony projection remains 1.463785 m, matching v7.92. Rotated and reversed isolated footprints at three metre scales and both ground and elevated bases remain within the original vertical envelope and 1.473 m maximum projection.
- Complete mesh vertices and indices reproduce exactly after disposal and reinstallation. All tested vertices, indices, normals and triangle winding are valid; handrail cap normals independently face upward.
- Compile, link and upload failures each release all new GPU handles exactly once. The existing full-lap failure wrapper resumes original rendering without retrying allocations each frame.
- Day/night draws allocate no new geometry or programs. Shared sources, route, pit geometry, simulation, camera and collision sentinel remain unchanged after installation, draws and reinstallation.

Validation command: `node evidence/architecture794_checks.cjs [SOURCE_HTML] [OUTPUT_JSON]` from this release folder. JavaScript syntax and Python syntax checks also pass. The guarded build patch replaces the exact v7.92 module once and rejects repeat or wrong-base use.

GPU shader compilation, real-device smoothness, and integrated desktop/phone visual acceptance remain the release owner's checks. These CPU results do not establish photorealism or a visual quality rating. The pre-existing partial-height duplicate facade selection behaviour is unchanged; the actual hosted eligibility remains identical to v7.92.
