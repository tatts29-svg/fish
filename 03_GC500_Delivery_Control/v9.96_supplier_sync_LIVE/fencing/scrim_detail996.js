    // Author: Andrew Fisher. A source-linked activity without a programme denominator.
    if (row.id === 'scrim_existing') {
      const reading = fenceValue848(row, 'done');
      return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">FENCING · RECORDED WORK</span><h2 id="tw840-dialog-title">' + escape(row.label) + '</h2></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><div class="tw840-detail-summary"><strong>' + reading.html + '<small> m</small></strong><span>' + (row.evidencePending ? 'Source review required' : 'Recorded service activity') + '</span></div>' + linkedFenceDetails(row.id) + '<details class="tw853-basis"><summary>More info</summary><p>' + escape(row.note) + '</p>' + groupNotes(row.issues) + '</details><button type="button" class="tw840-destination" data-tw840-destination="fencing" data-tw840-focus="dialog-destination">Open Fencing →</button>';
    }
