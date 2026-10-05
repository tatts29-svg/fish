/* Author: Andrew Fisher. Supporting notes use the existing disclosure state. */
function fencePresentationFold851(scope, key, title, body) {
  const esc = fenceComponentsEscape849;
  const open = FENCE_COMPONENTS_VIEW849.folds.get(scope + ':' + key) ? ' open' : '';
  return '<details class="fc849-fold" data-fc849-fold="' + esc(key) + '" data-fc851-notes' + open + '><summary data-tw840-focus="fc851-' + esc(scope) + '-' + esc(key) + '">' + esc(title) + '</summary><div class="fc849-fold-body">' + body + '</div></details>';
}
