# Supplier daily PDF continuation

Author: Andrew Fisher

The remaining-delivery renderer previously rejected a day with more rows than its fixed A4 portrait content area. That also blocked the combined run-sheet export. The correction keeps each day on one page when it fits and continues the same day on additional pages when necessary. Each continuation repeats the date, daily capacity and day page count. Stop numbers continue; each destination, quantity, asset list and QR code appears once. Page subtotals distinguish a sheet from the full day's quantity.

The table style, body font, 18 mm vector QR codes, destinations, row order, supplier quantities, dates and shared-record checks are retained. The patch changes only the supplier remaining-delivery PDF function and requires the exact previous function hash. It does not update the release footer; root owns integration and publication.

Focused verification exports the current receipt day, three remaining days and the combined document against native 6075 with writes blocked. The overflowing day produces two clearly labelled pages; the other days remain one page and the combined document contains five pages. The actual generated PDFs are checked for every stop and destination, asset numbers, A4 portrait dimensions, page counts, bounded text and matching vector QR links. Raw PDFs and images remain private. Both pages of the overflow day were visually inspected.
