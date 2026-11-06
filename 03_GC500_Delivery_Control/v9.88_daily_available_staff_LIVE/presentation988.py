"""Author: Andrew Fisher. Compact supporting copy and repeated Demob descriptions."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply_presentation988(s):
    path = 'GC500_Delivery_Control_hosted.html'
    s = rep(s,
        "+' installed. Assigned numbers do not establish arrival. Left includes installation not yet recorded. Separate waste tanks are excluded from this toilet total.</p>':'') + compactPlan847(summary.plan);",
        "+' installed</p>':'') + compactPlan847(summary.plan);",
        'Keep receipt figures concise on the Today toilet card', path)
    s = rep(s,
        "const expanded = (area.id === 'toilets' ? epScopeHtml870() : '') + (fence ? fencingRows() + renderFenceComponents849(renderedDay, 'today')",
        "const expanded = (area.id === 'toilets' ? '<p class=\"tw841-group-note\" data-toilet988-basis>Assigned numbers do not establish arrival. Left includes installation not yet recorded. Separate waste tanks are excluded from this toilet total.</p>' + epScopeHtml870() : '') + (fence ? fencingRows() + renderFenceComponents849(renderedDay, 'today')",
        'Retain toilet receipt basis inside the existing detail fold', path)
    s = rep(s,
        "escape(area.id + '-group-fold') + '\"><span>View details</span></summary><div class=\"tw841-group-content\">'",
        "escape(area.id + '-group-fold') + '\"><span>' + (area.id === 'toilets' ? 'More info' : 'View details') + '</span></summary><div class=\"tw841-group-content\">'",
        'Name the existing toilet detail fold More info', path)
    s = rep(s,
        "function rowHtml816(r, extra){\n\tconst ed = canEdit(), what = [(r.a.item_types || []).join(', ') || r.a.product || kindWord(r.a), r.a.name].filter(Boolean).join(' · ');",
        """function demobDescription988(asset){
 const primary = (asset.item_types || []).join(', ') || asset.product || kindWord(asset), seen = new Set();
 return [primary, asset.name].filter(Boolean).flatMap(value => String(value).split(/\\s*·\\s*/)).map(value => value.trim()).filter(value => {
  const normalized = value.replace(/\\s+/g, ' ').toLocaleLowerCase('en-AU');
  if (!normalized || seen.has(normalized)) return false;
  seen.add(normalized); return true;
 }).join(' · ');
}
function rowHtml816(r, extra){
\tconst ed = canEdit(), what = demobDescription988(r.a);""",
        'Show each complete Demob description segment once', path)
    s = rep(s,
        "+' · owner and costing branch are recorded separately.</p><div class=\"units925-company-list\">'",
        "+'</p><div class=\"units925-company-list\">'",
        'Keep supplier identity and quantity counts concise', path)
    s = rep(s,
        'Choose a company for its identified units, quantity-only stock, supplier delivery plan and original quotes. Ownership is recorded per item; a location may contain more than one company.</p><div class="supplier932-tabs"',
        'Choose a company for its identified units, quantity-only stock, supplier delivery plan and original quotes. Ownership is recorded per item; a location may contain more than one company. Owner and costing branch are recorded separately.</p><div class="supplier932-tabs"',
        'Retain ownership explanation in existing company More info', path)
    return s
