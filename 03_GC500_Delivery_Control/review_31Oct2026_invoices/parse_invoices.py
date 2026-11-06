"""Author: Andrew Fisher. Read-only: the V8s' Coates invoices (text from pdftotext -layout) as JSON, and each one against the
Baseplan (12) export's Billed Amount, contract by contract and line by line. The invoices and the JSON stay private.

    python3 -I parse_invoices.py <txt_dir> <bp12.json> <out.json>
"""
import json, re, sys
from pathlib import Path

txt_dir, bp_path, out_path = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
bp = json.loads(bp_path.read_text(encoding='utf-8'))
money = lambda s: float(s.replace('$', '').replace(',', '')) if s else None
MONEY = r'\$?(-?[\d,]+\.\d{2})'

def bp_contract(c):
    # to_json keys sheets by the first seven digits; the eight-digit contracts 1000xxxx carry one digit more
    for k in bp:
        if k.startswith('_') or k == 'Delivery Dockets': continue
        sheet = bp['_sheet'].get(k, '')
        if re.match(r'^\s*%s\b' % re.escape(c), sheet) or k == c: return k
    return None

def first(rx, text, flags=0):
    m = re.search(rx, text, flags)
    return m.group(1).strip() if m else None

rows = []
for f in sorted(txt_dir.glob('*.txt')):
    t = f.read_text(encoding='utf-8', errors='replace')
    hire = 'Hire Schedule No' in t
    inv = {'file': f.stem, 'format': 'hire' if hire else 'sale', 'reprint': 'REPRINT' in t}
    if hire:
        inv['invoice'] = first(r'Tax Invoice Number\s+(\d+)', t)
        inv['contract'] = first(r'Hire Schedule No\s+(\d+)', t)
        inv['date'] = first(r'Invoice Date\s+(\d{2}/\d{2}/\d{4})', t)
        inv['hire_charges'] = money(first(r'Hire Charges\s+' + MONEY, t))
        inv['other_charges'] = money(first(r'Other Charges\s+' + MONEY, t))
        inv['ex_gst'] = money(first(r'Price Excluding GST\s+' + MONEY, t))
        inv['total'] = money(first(r'Invoice Total\s+' + MONEY, t))
        inv['due'] = money(first(r'Total Amount Due\s+' + MONEY, t))
        m = re.search(r'www\.coates\.com\.au\s+' + MONEY, t)
        inv['gst'] = money(m.group(1)) if m else None
        inv['waiver'] = money(first(r'LTD Waiver Charge\s+' + MONEY, t))
        # a hire line can wrap: the period, days, rate and total often sit on the next line, the description's tail after it
        recs, cur = [], None
        for ln in t.splitlines():
            if re.search(r'Hire Charges\s+\$|Coates Hire Operations Pty Limited|PRODUCT INFORMATION|Equipment with a', ln):
                if cur: recs.append(cur); cur = None
                continue
            m = re.match(r'^\s*(\d+)\s+(\d+)\s+(-?[\d.]+)\s+(\S.*)$', ln)
            if m and not re.match(r'^\s*\d{1,2}/\d{2}/\d{4}', ln):
                if cur: recs.append(cur)
                cur = {'inv_line': int(m.group(1)), 'ha_line': int(m.group(2)), 'qty': float(m.group(3)), 'text': m.group(4)}
            elif cur and ln.strip():
                cur['text'] += '  ' + ln.strip()
        if cur: recs.append(cur)
        lines = []
        for r in recs:
            body = r['text']
            amts = re.findall(r'\$(-?[\d,]+\.\d{2})', body)
            dates = re.findall(r'(\d{1,2}/\d{2}/\d{4} \d{2}:\d{2})', body)
            days = first(r'\b([\d]+\.\d{2})@?\s', body + ' ')
            if not amts: continue
            lines.append({'inv_line': r['inv_line'], 'ha_line': r['ha_line'], 'qty': r['qty'], 'desc': re.split(r'\s{2,}', body.strip())[0],
                          'from': dates[0] if dates else None, 'to': dates[1] if len(dates) > 1 else None, 'days': float(days) if days and dates else None,
                          'status': first(r'\b(Onhire|Returned|Offhire|Off Hire|Delivered|Pending)\b', body),
                          'line_total': money(amts[-1]), 'raw': re.sub(r'\s{2,}', '  ', body.strip())[:260]})
        inv['lines'] = lines
    else:
        inv['invoice'] = first(r'Invoice Number\s+(\d+)', t)
        inv['contract'] = first(r'Reference\s+(\d+)', t)
        inv['date'] = first(r'(\d{2}/\d{2}/\d{4})\s*\n\s*.*?Date', t, re.S) or first(r'(\d{2}/\d{2}/\d{4})', t)
        inv['ex_gst'] = money(first(r'Total Sales\s+' + MONEY, t))
        inv['gst'] = money(first(r'\bGST\s+' + MONEY + r'\s*\n', t))
        inv['total'] = money(first(r'Total Amount\s+' + MONEY, t))
        lines = []
        for ln in t.splitlines():
            m = re.match(r'^\s*(\S+)\s+(\S.*?)\s{2,}(-?[\d.]+)\s+\$(-?[\d,]+\.\d{2}).*?\$(-?[\d,]+\.\d{2})\s+\$(-?[\d,]+\.\d{2})\s+\$(-?[\d,]+\.\d{2})\s*$', ln)
            if m: lines.append({'item': m.group(1), 'desc': m.group(2).strip(), 'qty': float(m.group(3)), 'unit': money(m.group(4)),
                                'line_total': money(m.group(5)), 'gst': money(m.group(6)), 'amount': money(m.group(7))})
        inv['lines'] = lines
    inv['lines_sum'] = round(sum(l['line_total'] or 0 for l in inv['lines']), 2)
    k = bp_contract(inv['contract'] or '')
    inv['bp_key'] = k
    if k:
        L = bp[k]
        inv['bp_sheet'] = bp['_sheet'][k]; inv['bp_branch'] = bp['_branch'][k]
        inv['bp_billed'] = round(sum(float(l.get('Billed Amount') or 0) for l in L if isinstance(l.get('Billed Amount'), (int, float))), 2)
        byline = {str(l.get('Line')): l for l in L}
        diffs = []
        if inv['format'] == 'hire':
            for l in inv['lines']:
                b = byline.get(str(l['ha_line']))
                bb = float(b.get('Billed Amount') or 0) if b and isinstance(b.get('Billed Amount'), (int, float)) else None
                if bb is None or l['line_total'] is None or abs(bb - l['line_total']) > 0.005:
                    diffs.append({'ha_line': l['ha_line'], 'desc': l['desc'], 'invoice': l['line_total'], 'baseplan': bb})
            seen = {str(l['ha_line']) for l in inv['lines']}
            for ln_, b in byline.items():
                if isinstance(b.get('Billed Amount'), (int, float)) and float(b['Billed Amount']) and ln_ not in seen:
                    diffs.append({'ha_line': ln_, 'desc': b.get('Description'), 'invoice': None, 'baseplan': float(b['Billed Amount'])})
        inv['line_diffs'] = diffs
    rows.append(inv)

out_path.write_text(json.dumps(rows, indent=1), encoding='utf-8')
tot_inv = tot_bp = 0.0
for r in sorted(rows, key=lambda r: (r.get('bp_branch') or '', r.get('contract') or '')):
    tot_inv += r.get('ex_gst') or 0; tot_bp += r.get('bp_billed') or 0
    d = (r.get('ex_gst') or 0) - (r.get('bp_billed') or 0)
    print('%-5s %-9s inv %-9s %-10s %-4s ex %11s gst %10s tot %11s | lines %2d sum %11.2f | BP %11s | diff %+9.2f | line diffs %d%s' % (
        r.get('bp_branch'), r.get('contract'), r.get('invoice'), r.get('date'), r['format'], '%.2f' % (r.get('ex_gst') or 0), r.get('gst'), r.get('total'),
        len(r['lines']), r['lines_sum'], r.get('bp_billed'), d, len(r.get('line_diffs') or []), ' REPRINT' if r['reprint'] else ''))
print('TOTAL invoices ex GST %.2f | Baseplan billed on these contracts %.2f | diff %+.2f | invoices %d' % (tot_inv, tot_bp, tot_inv - tot_bp, len(rows)))
