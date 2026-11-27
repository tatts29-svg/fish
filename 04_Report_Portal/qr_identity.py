"""Match current SiteIQ activity to one verified roster subject on its raw employer."""
from collections import defaultdict


def _pair(row):
    if not isinstance(row, dict):
        return ('', '')
    # Facts carry a second, presentation-only company label. Never use it in
    # preference to their raw employer field, even when that field is empty.
    return (row.get('hirer', ''), row.get('employer', row.get('company', '')))


def _valid(pair):
    return all(isinstance(v, str) and v.strip() for v in pair)


def _key(pair):
    name, employer = pair
    parts = name.casefold().split()
    # RENTAL_STOCK uses "given - surname". A punctuation mark inside a
    # surname or employer is meaningful and must survive this operation.
    if _separated(parts):
        parts.remove('-')
    return (' '.join(parts), ' '.join(employer.casefold().split()))


def _separated(parts):
    return len(parts) > 2 and parts.count('-') == 1 and '-' not in (parts[0], parts[-1])


def _badges(row):
    values = [row.get('barcode')]
    for field in ('badges', 'barcodes'):
        additional = row.get(field, ())
        if isinstance(additional, (tuple, list, set)):
            values.extend(additional)
    return {b for b in values if isinstance(b, str) and b}


def _aliases(row):
    return {_pair(a) for a in row.get('aliases', ()) if _valid(_pair(a))}


def _roster(people):
    groups = defaultdict(list)
    owners = defaultdict(set)
    incomplete_credentials = set()
    for row in people:
        if not isinstance(row, dict):
            continue
        pair = _pair(row)
        credentials = {('badge', b) for b in _badges(row)}
        for field in ('hirer_id', 'person_id'):
            if row.get(field):
                credentials.add((field, row[field]))
        if not _valid(pair):
            incomplete_credentials.update(credentials)
            continue
        key = _key(pair)
        groups[key].append(row)
        for alias in _aliases(row) | {pair}:
            owners['name', _key(alias)].add(key)
        for cred in credentials:
            owners[cred].add(key)

    disputed = set()
    for cred, keys in owners.items():
        if len(keys) > 1 or cred in incomplete_credentials:
            disputed.update(keys)
    for key, group in groups.items():
        if len(group) == 1:
            continue
        # Repeated equipment or an exactly repeated roster row is common. Two
        # independent badge records under one spelling can also be namesakes.
        shared_badge = set.intersection(*(_badges(r) for r in group))
        common_id = False
        for field in ('hirer_id', 'person_id'):
            ids = {r[field] for r in group if r.get(field)}
            if len(ids) > 1:
                disputed.add(key)
            if len(ids) == 1 and all(r.get(field) for r in group):
                common_id = True
        exact_pairs = {_pair(r) for r in group}
        if not common_id and (len(exact_pairs) > 1 or not shared_badge):
            disputed.add(key)
    return groups, disputed


def ambiguous_people(people):
    """Raw primary roster pairs with ambiguous identity or a contested credential."""
    groups, disputed = _roster(people)
    return {_pair(row) for key in disputed for row in groups[key]}


class IdentityIndex:
    """Indexes a single job's current facts and an entire verified roster once."""

    def __init__(self, data, people):
        groups, self.disputed = _roster(people)
        self.known = {_pair(row) for rows in groups.values() for row in rows}
        self.rejected = {key for key, rows in groups.items() if any(
            r.get('active') is False or r.get('inactive') or r.get('conflicting') for r in rows)}
        self.ambiguous = {_pair(row) for key in self.disputed for row in groups[key]}
        self.facts = defaultdict(lambda: defaultdict(set))
        self.native_owners = defaultdict(set)
        self.origins = defaultdict(lambda: defaultdict(set))
        for source in ('workers', 'hires', 'movements', 'draws'):
            for row in data.get(source, ()):
                pair = _pair(row)
                if not _valid(pair):
                    continue
                key = _key(pair)
                ids = self.facts[key][pair]
                if source != 'workers':
                    self.origins[key][source].add(pair)
                if row.get('hirer_id'):
                    ids.add(row['hirer_id'])
                    self.native_owners[row['hirer_id']].add(key)

    def has_activity(self, person):
        pairs = _aliases(person) | {_pair(person)}
        return any(_valid(pair) and _key(pair) in self.facts for pair in pairs)

    def native_ids(self, pairs):
        return {value for pair in pairs for value in self.facts.get(_key(pair), {}).get(pair, ())}

    def _cross_source_separator(self, key):
        # This exception applies only to the known difference between rental
        # "given - surname" and unseparated transaction/sales rows. A workers
        # summary without its underlying source cannot establish that origin.
        origins = self.origins.get(key, {})
        rental = origins.get('hires', set())
        if len(rental) != 1 or len(origins) < 2 or any(len(rows) != 1 for rows in origins.values()):
            return False
        raw = next(iter(rental))
        if not _separated(raw[0].split()):
            return False
        ordinary = set().union(*(rows for origin, rows in origins.items() if origin != 'hires'))
        return (all('-' not in p[0].split() for p in ordinary)
                and self.facts[key].keys() == rental | ordinary)

    def match(self, person, *, resolve_spelling=True):
        """Return raw fact pairs, an empty set for no activity, or None for a dispute."""
        main = _pair(person)
        if main not in self.known or main in self.ambiguous or person.get('active') is False:
            return None
        explicit = _aliases(person) | {main}
        keys = {_key(pair) for pair in explicit}
        if keys & (self.disputed | self.rejected):
            return None
        result = set()
        native_ids = {person['hirer_id']} if person.get('hirer_id') else set()
        for key in keys:
            possible = self.facts.get(key, {})
            if not possible:
                continue
            ids = {i for values in possible.values() for i in values}
            native_ids.update(ids)
            if len(native_ids) > 1:
                return None
            # Distinct raw spellings in the source may be namesakes. Both may
            # be used only if each is explicitly reviewed or has the same ID.
            linked = len(ids) == 1 and all(values == ids for values in possible.values())
            if len(possible) > 1 and not (possible.keys() <= explicit or linked or self._cross_source_separator(key)):
                return None
            result.update(possible if resolve_spelling else possible.keys() & explicit)
        if any(self.native_owners.get(i, set()) - keys for i in native_ids):
            return None
        return result


def matched_pairs(data, person, all_people):
    """Resolve one scanned roster subject without rebuilding any historical links."""
    return IdentityIndex(data, all_people).match(person)
