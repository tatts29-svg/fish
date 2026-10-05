function fenceComponentLinks849(row, suppliedCache) {
  const cache = suppliedCache || {books:new Map(), links:new Map()}, cacheKey = JSON.stringify([row.book || 'red',row.recordId || '',row.papers || []]);
  if (cache.links.has(cacheKey)) return cache.links.get(cacheKey);
  const esc = fenceComponentsEscape849, links = [], seen = new Map();
  const add = (label, url, page) => {
    const safe = fenceComponentsUrl849(url, page);
    if (!safe) return;
    const parsed = new URL(safe), pageOnly = /^#page=\d+$/.test(parsed.hash);
    const base = parsed.origin + parsed.pathname + parsed.search;
    const key = pageOnly ? base + parsed.hash : safe;
    if (seen.has(key)) return;
    // Prefer a reviewed page over the same file's unqualified link. Different
    // reviewed pages remain distinct and reachable.
    if (!parsed.hash && [...seen.keys()].some(value => value.startsWith(base + '#page=') && /^#page=\d+$/.test(value.slice(base.length)))) return;
    if (pageOnly && seen.has(base)) {
      const prior = seen.get(base), preferred = prior.label + ' · page ' + parsed.hash.slice(6);
      links[prior.index] = '<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(preferred) + '</a>';
      seen.delete(base); seen.set(key, {index:prior.index,label:prior.label}); return;
    }
    seen.set(key, {index:links.length,label});
    links.push('<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>');
  };
  let record = null;
  try {
    const book = row.book === 'blue' ? 'blue' : 'red';
    if (!cache.books.has(book)) cache.books.set(book, book === 'blue' ? typeof collectionRows === 'function' ? collectionRows() : [] : typeof allDockets === 'function' ? allDockets() : []);
    const records = cache.books.get(book);
    const matches = records.filter(item => String(item.id || '') === row.recordId);
    if (matches.length === 1) record = matches[0];
  } catch (_) {}
  if (record) {
    try {
      const review = typeof fenceReviewContext836 === 'function' ? fenceReviewContext836(record) : null;
      if (review?.paper?.result?.state === 'ready') add('Original docket', review.paper.result.url);
      if (review?.state === 'current' && review.po && review.summarySource && typeof photoFor === 'function') {
        const paper = photoFor({id:review.summarySource.id});
        if (paper.state === 'ready') add('P/O ' + review.po.number + ' · supplier summary', paper.url);
      }
    } catch (_) {}
    try {
      const pointers = [...(typeof docketPapersOf === 'function' ? docketPapersOf(record.id) : []), ...(typeof docketPapersByName === 'function' ? docketPapersByName(record) : [])];
      for (const pointer of pointers) {
        const paper = typeof photoFor === 'function' ? photoFor(pointer) : null;
        if (paper?.state === 'ready') add(paper.file?.title || paper.file?.name || 'Attached paper', paper.url, pointer.reviewedPage);
      }
    } catch (_) {}
  }
  for (const pointer of row.papers || []) {
    try {
      const paper = typeof photoFor === 'function' ? photoFor(pointer) : null;
      if (paper?.state === 'ready') add((paper.file?.title || paper.file?.name || 'Reviewed paper') + (Number.isSafeInteger(pointer.page) ? ' · page ' + pointer.page : ''), paper.url, pointer.page);
    } catch (_) {}
  }
  const action = '<button type="button" data-fc849-record="' + esc(row.recordId || '') + '" data-fc849-book="' + esc(row.book || 'red') + '">' + (record ? 'Open record' : 'Open Fencing') + '</button>';
  const html = '<div class="fc849-links">' + action + links.join('') + '</div>';
  cache.links.set(cacheKey, html); return html;
}
