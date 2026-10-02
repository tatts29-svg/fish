#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only checks of the protected v7.92 source.

Usage: python3 protected_source_checks.py BASE_HTML CANDIDATE_HTML [OUTPUT_JSON]
Add --self-test to prove that representative protected-source edits are rejected.
No network requests, browser actions, credentials or record writes are performed.
"""

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def once(text, marker):
    if text.count(marker) != 1:
        raise ValueError("expected a unique source boundary")
    return text.index(marker)


def between(text, start, end):
    i = once(text, start)
    j = text.find(end, i + len(start))
    if j < 0:
        raise ValueError("missing closing source boundary")
    return text[i:j]


def part(text, number):
    start = once(text, "/* GC3D part " + str(number) + " ")
    match = re.search(r"/\* GC3D part (?:[1-7]|2b) ", text[start + 1:])
    end = start + 1 + match.start() if match else text.find("</script>", start)
    if end < 0:
        raise ValueError("missing closing renderer boundary")
    return text[start:end]


def data_literal(text):
    matches = list(re.finditer(r"\bconst\s+DATA\s*=\s*", text))
    if len(matches) != 1:
        raise ValueError("expected a single DATA declaration")
    tail = text[matches[0].end():]
    parsed, length = json.JSONDecoder().raw_decode(tail)
    return tail[:length], parsed


def car_part_with_permitted_visual_changes(text):
    result = part(text, 3)
    replacements = (
        (" if(!S.detail781Enabled){\n /* start gantry: five red lamps, one at a time, then out */",
         " /* start gantry: five red lamps, one at a time, then out */"),
        (" }\n /* aviation lights on the tallest towers */",
         " /* aviation lights on the tallest towers */"),
        ("if(!S.detail781Enabled&&S.gantry){const m=S.sim||{},t=clock;",
         "if(S.gantry){const m=S.sim||{},t=clock;"),
        ("vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),L=normalize(mix(vec3(.45,.8,.4),vec3(-.55,.45,.70),uDetail781));if(dot(N,V)<0.)N=-N;",
         "vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),L=normalize(mix(vec3(.45,.8,.4),vec3(-.35,.78,.52),uDetail781));if(dot(N,V)<0.)N=-N;"),
    )
    for before, after in replacements:
        once(result, before)
        result = result.replace(before, after, 1)
    return result


def run_checks(base, candidate):
    checks = []

    def equal(name, extract, expected=None):
        try:
            a = expected(base) if expected else extract(base)
            b = extract(candidate)
            checks.append({"name": name, "pass": a == b,
                           "baseBytes": len(a.encode("utf-8")),
                           "candidateBytes": len(b.encode("utf-8")),
                           "baseSha256": sha(a), "candidateSha256": sha(b)})
        except (ValueError, IndexError, KeyError) as error:
            checks.append({"name": name, "pass": False, "error": str(error)})

    equal("entire operational page prefix before renderer part 1 is byte-identical",
          lambda s: s[:once(s, "/* GC3D part 1 ")])
    equal("embedded DATA literal is byte-identical", lambda s: data_literal(s)[0])
    try:
        checks.append({"name": "embedded DATA is semantically unchanged",
                       "pass": data_literal(base)[1] == data_literal(candidate)[1]})
    except (ValueError, IndexError) as error:
        checks.append({"name": "embedded DATA is semantically unchanged", "pass": False,
                       "error": str(error)})
    equal("complete route, widths, curvature, speed profile and pit alignment construction unchanged",
          lambda s: between(s, " /* key plan → world:", " /* ----- static batches ----- */"))
    equal("original metre scale and vehicle tuning unchanged",
          lambda s: between(s, "G.M_PER_PT = ", "/* Day Race is the production default."))
    equal("original unit conversions and pace control unchanged",
          lambda s: between(s, "G.units=function(T){",
                            "/* ---------- init: GL context, key plan geometry, static batches ---------- */"))
    equal("original car hull and car model unchanged",
          lambda s: between(s, "G.carHull=function(){", "G.simReset=function(){"))
    equal("original simulation reset, pose and physics step unchanged",
          lambda s: between(s, "G.simReset=function(){",
                            "/* everything that is rebuilt each frame:"))
    equal("complete original car/dynamics part changes limited to restored start lights and daylight direction",
          lambda s: part(s, 3), car_part_with_permitted_visual_changes)
    equal("original view choices, camera director and frame function bodies unchanged",
          lambda s: between(s, "/* GC3D part 4 ", "G.render=function(){"))
    equal("registered surroundings, pit lane and existing building source unchanged",
          lambda s: part(s, 5))
    equal("original sound section unchanged", lambda s: part(s, 7))

    # Compare references without writing URLs, embedded media or private contents to evidence.
    media = re.compile(r'''["']([^"'\r\n]*\.(?:mp4|webm|m3u8)(?:\?[^"'\r\n]*)?)["']''')
    a, b = Counter(media.findall(base)), Counter(media.findall(candidate))
    checks.append({"name": "video media reference multiset unchanged", "pass": bool(a) and a == b,
                   "baseReferences": sum(a.values()), "candidateReferences": sum(b.values()),
                   "referenceSha256": sha(json.dumps(sorted(a.items())))})

    protected = ("step", "simReset", "pose", "carHull", "carModel", "camStep",
                 "framedFov", "setView", "setPace", "units", "defaultTune")
    counts = {name: len(re.findall(r"\bG\." + name + r"\s*=", candidate)) for name in protected}
    checks.append({"name": "candidate has one original assignment per protected car/physics/camera function",
                   "pass": all(n == 1 for n in counts.values()), "assignmentCounts": counts})
    checks.append({"name": "short-section preview override is absent and complete-lap module present",
                   "pass": "G.preview781=" not in candidate and "G.fullLap788=" in candidate
                           and "G.photoRefinement792=" in candidate})
    return checks


def self_tests(base, candidate):
    samples = (
        ("prefix change", "<!doctype", "<!doctypE"),
        ("car change", "G.carHull=function(){", "G.carHull=function(){/* changed */"),
        ("physics change", "G.step=function(dt){", "G.step=function(dt){/* changed */"),
        ("camera change", "G.camStep=function(dt){", "G.camStep=function(dt){/* changed */"),
        ("extra camera override", "G.photoRefinement792=", "G.camStep=function(){};G.photoRefinement792="),
    )
    results = []
    for name, before, after in samples:
        if before not in candidate:
            results.append({"name": name, "pass": False, "error": "mutation anchor absent"})
            continue
        altered = candidate.replace(before, after, 1)
        results.append({"name": name, "pass": any(not c["pass"] for c in run_checks(base, altered))})
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("output", nargs="?", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    # Read bytes first: newline normalisation must not conceal an altered prefix.
    base, candidate = (p.read_bytes().decode("utf-8") for p in (args.base, args.candidate))
    checks = run_checks(base, candidate)
    mutations = self_tests(base, candidate) if args.self_test else []
    passed = all(c["pass"] for c in checks + mutations)
    evidence = {
        "author": "Andrew Fisher", "checkedAtUtc": datetime.now(timezone.utc).isoformat(),
        "scope": "Read-only protected source comparison; not a publication or browser-performance assertion",
        "base": {"path": str(args.base), "bytes": len(base.encode("utf-8")), "sha256": sha(base)},
        "candidate": {"path": str(args.candidate), "bytes": len(candidate.encode("utf-8")), "sha256": sha(candidate)},
        "pass": passed, "checks": checks, "mutationChecks": mutations,
        "limits": [
            "Visual shaders, materials, static facade/vegetation detail and rendering/lifecycle wrappers intentionally change.",
            "Original camera/physics bodies are identical; frame scheduling may pause while hidden or context-lost.",
            "Source preservation is not verification of live records or GPU performance; browser checks remain required.",
            "Function-assignment counting is a narrow guard, not a general JavaScript semantic proof.",
        ],
    }
    if args.output:
        args.output.write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps({"pass": passed, "checksPassed": sum(c["pass"] for c in checks),
                      "checksTotal": len(checks), "mutationChecksPassed": sum(c["pass"] for c in mutations),
                      "mutationChecksTotal": len(mutations), "candidateSha256": sha(candidate),
                      "failed": [c["name"] for c in checks + mutations if not c["pass"]]}))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
