# Header panel arrangement

Author: Andrew Fisher.

The clock, race countdown and shared-record panels occupy a full desktop row below the brand and search. Panel height, figures and lights scale on wide screens. Phones and short screens retain a compact header, and the native scroll-collapse behaviour gives space back to the page.

`header908.css` is included by the release patch. Existing values, controls and graphic treatments remain native. Screen-only rules preserve print behaviour.

`tests/test_header908.cjs` checks the real page at phone, laptop and wide-screen sizes, including menus, collapse, scrolling and printing. Use the shared browser lock and a private evidence directory. Detailed screenshots and results remain outside Git.
