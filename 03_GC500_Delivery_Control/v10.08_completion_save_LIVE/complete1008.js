/* Author: Andrew Fisher. One small icon; completion stays on the existing verified physical record. */
function completeGlyph1008(){
 return '<svg class="complete1008-glyph" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false"><path class="complete1008-ring" d="M11 2h10l9 9v10l-9 9H11l-9-9V11Z"/><path class="complete1008-inset" d="M12 5h8l7 7v8l-7 7h-8l-7-7v-8Z"/><path class="complete1008-check" d="m9 16 5 5 10-11"/></svg>';
}
function completeVerified1008(key){
 return typeof window.gc500IsComplete897==='function'&&window.gc500IsComplete897(key);
}
