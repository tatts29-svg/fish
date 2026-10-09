"""Author: Andrew Fisher. Reusable financial snapshot arithmetic checks; no I/O."""
import collections
import math

REQUIRED_MODELS = (
    "pl752", "ticks", "pl770", "rehire", "cj", "finance", "money",
    "fenceSplit", "source949", "contracts",
)
REQUIRED_METADATA = (
    "recordUnchanged", "cacheCleared", "photoIndexReady", "nativeVersion",
    "sha256", "pageErrors", "consoleErrors", "blockedRequests",
)


def audit(root):
    """Return aggregate checks and informational grouping differences only."""
    for key in REQUIRED_METADATA:
        if key not in root:
            raise ValueError("Missing snapshot metadata: " + key)
    x = root["models"]
    for key in REQUIRED_MODELS:
        if key not in x or x[key] is None:
            raise ValueError("Missing financial model: " + key)
    if not root["photoIndexReady"]:
        raise ValueError("Snapshot photo index was not ready")
    M, H, P, R, X = (x[k] for k in ("money", "finance", "pl770", "rehire", "cj"))
    T, B, F, C, supplier = (x[k] for k in ("ticks", "pl752", "fenceSplit", "contracts", "source949"))
    checks = []

    def check(name, actual, expected, tolerance=0.005):
        valid = all(isinstance(v, (int, float)) and math.isfinite(v) for v in (actual, expected))
        checks.append({"name": name, "actual": actual, "expected": expected,
                       "tolerance": tolerance,
                       "pass": valid and abs(actual - expected) < tolerance})

    def flag(name, value):
        checks.append({"name": name, "actual": bool(value), "expected": True, "pass": bool(value)})

    def total(rows, key):
        return sum((row.get(key) or 0) for row in rows)

    flag("record unchanged", root["recordUnchanged"])
    flag("cache cleared", root["cacheCleared"])
    check("runtime errors or blocked requests", sum(len(root[k]) for k in ("pageErrors", "consoleErrors", "blockedRequests")), 0)
    check("native contract lines", len(C), M["charge"]["contracts_all"])
    check("branch lines", total(B, "lines"), len(C))
    check("stream lines", total(M["streams"], "lines"), len(C))
    check("unknown lines", total(B, "none"), M["charge"]["contracts_unknown"])
    check("unknown stream lines", total(M["streams"], "unrated"), M["charge"]["contracts_unknown"])
    check("priced + settled + unknown lines", M["charge"]["contracts_lines"] + total(B, "decided") + total(B, "none"), len(C))
    check("raw subhire count", sum(bool(r.get("subhired")) for r in C), M["cost"]["subhire_lines"])
    check("branch subhire count", total(B, "subLines"), M["cost"]["subhire_lines"])
    for b in B:
        check(b["code"] + " contract components", b["contract"] + b["card"] + b["transport"], b["total"])
        check(b["code"] + " native line count", b["lines"], sum(r["branch_code"] == b["code"] for r in C))
        branch = next(g for g in M["charge"]["by_branch"] if g["code"] == b["code"])
        check(b["code"] + " money branch total", b["total"], branch["charge"])
    for side, value in (("charge", M["charge"]["total"]), ("cost", M["cost"]["known"])):
        check("stream " + side, total(M["streams"], side), value)
        check("rounded stream " + side, total(M["streams"], side + "0"), math.floor(value + 0.5))
    check("eight cost categories", total(M["categories"], "amount"), M["cost"]["known"])
    check("Revenue components", sum(M["charge"][k] for k in ("contracts", "labour", "fencing", "other", "servicing")) + M["charge"]["race"]["amount"], M["charge"]["total"])
    check("difference", M["charge"]["total"] - M["cost"]["known"], M["difference"])
    check("ticks Revenue", T["total"], M["charge"]["labour"])
    check("ticks count", T["ticks"], M["charge"]["labour_ticks"])
    check("ticks branches amount", sum(v["amount"] for v in T["byBranch"].values()), T["total"])
    check("ticks categories count", sum(T[k]["ticks"] for k in ("install", "cleaning", "fire_ext", "other")), T["ticks"])
    for side, key in (("now", "revNow"), ("job", "revJob")):
        check("ledger Revenue " + side, total(P["rev"], side), P[key])
    for side, key in (("now", "direct"), ("job", "directJob")):
        check("ledger costs " + side, total(P["cost"], side), P[key])
    for key in ("revenue", "revenueJob", "costs", "costsJob", "quotes"):
        flag("native ledger check " + key, P["checks"][key])
    check("Revenue now shared", P["revNow"], M["charge"]["total"])
    check("Revenue job shared", P["revJob"], X["revenue"]["job"])
    check("known costs shared", P["costNow"], M["cost"]["known"])
    check("costs job shared", P["costJob"], X["job"])
    check("costs current plus overhead", P["direct"] + P["over"], P["costNow"])
    check("costs job plus overhead", P["directJob"] + P["overJob"], P["costJob"])
    check("CJ source known", X["known"], X["plKnown"])
    check("CJ source parts", X["plParts"], X["plKnown"])
    check("CJ job partitions", X["known"] + X["toCome"], X["job"])
    check("H cost job wages split", P["costJob"] + X["wages"]["job"], H["costTotal"]["job"])
    check("H known cost + wage", M["cost"]["known"] + X["wages"]["toDate"], H["costTotal"]["toDate"])
    check("job difference", P["diff"]["job"], P["revJob"] - H["costTotal"]["job"])
    for side, revenue, direct in (("now", P["revNow"], P["direct"]), ("job", P["revJob"], P["directJob"])):
        check("gross difference " + side, P["gm"][side], revenue - direct)
        check("gross fraction " + side, P["gm"]["pc" + side.title()], P["gm"][side] / revenue, 1e-12)
    # The legacy model deliberately calculates this fraction from whole-dollar
    # displayed totals. Do not confuse it with the unrounded monetary difference.
    check("printed-difference fraction", P["diff"]["pcNow"], M["difference0"] / M["charge"]["total"], 1e-12)
    revenue = {r["key"]: r for r in P["rev"]}
    cost = {r["key"]: r for r in P["cost"]}
    recovery = {r["name"]: r for r in P["rec"]}
    for side in ("now", "job"):
        check("Transport grouped recovery " + side, recovery["Transport Recovery"][side],
              (revenue["transport"][side] + revenue["pump"][side]) / (cost["transport"][side] + cost["pump"][side]), 1e-12)
        check("Consumables recovery " + side, recovery["Consumables Recovery"][side], revenue["cons"][side] / cost["cons"][side], 1e-12)
        # These snapshots retain bundled fencing Revenue and unpriced wages;
        # withholding the two recovery ratios is required for this release.
        flag("Rehire ratio withheld " + side, recovery["Rehire Recovery"][side] is None)
        flag("Install ratio withheld " + side, recovery["Installation Recovery"][side] is None)
    check("approved quote split", sum(P["qk"].values()), M["cost"]["rehire"])
    check("servicing ledger split", revenue["pump"]["now"] + revenue["cons"]["now"], M["charge"]["servicing"])
    check("fencing docket split", F["gear"] + F["docket_labour"], F["paid"])
    check("fencing installation split", F["docket_labour"] + F["green"], F["installation"])
    check("fencing full direct costs", F["paid"] + F["green"], next(c["amount"] for c in M["categories"] if c["key"] == "fencing"))
    for key in ("rev", "revToCome", "revJob", "cost", "costToCome", "costJob", "lines"):
        check("Rehire group " + key, total(R["groups"], key), R["totals"][key])
    for key in ("revJob", "costJob", "costMissing", "forecastMissing"):
        check("Rehire current grouping " + key, total(R["byBranch"], key), R["totals"][key])
    check("Rehire share now", R["totals"]["shareNow"], R["totals"]["rev"] / M["charge"]["total"], 1e-12)
    check("Rehire share job", R["totals"]["share"], R["totals"]["revJob"] / X["revenue"]["job"], 1e-12)
    check("Rehire bundled cover", P["rhCover"], R["totals"]["revJob"] / (R["totals"]["costJob"] + total(R["groups"], "installation")), 1e-12)
    coverage = R["coverage"]
    check("Rehire coverage partition", coverage["inGroups"] + coverage["notCounted"] + coverage["coatesOwn"], coverage["lines"])
    check("Rehire nontransport contract scope", coverage["lines"], sum(not r.get("charge_line") for r in C))
    check("Rehire group scope excludes dockets", total([g for g in R["groups"] if not g["what"].startswith("Fencing")], "lines"), coverage["inGroups"])
    check("supplier forecast total", total(supplier, "estimate"), cost["rehire"]["estimate949"])
    check("missing forecast count", sum(g.get("costJob") is None for g in R["groups"]), R["totals"]["forecastMissing"])
    for g in R["groups"]:
        if g["costJob"] is not None:
            check("Rehire time " + g["what"], (g.get("cost") or 0) + (g.get("costToCome") or 0), g["costJob"])
    for row in H["costs"]:
        check("H branch " + row["stream"], sum(row["by"].values()), row["job"])
        check("H time " + row["stream"], row["toDate"] + row["toCome"], row["job"])
    for key in ("toDate", "toCome", "job"):
        check("H cost totals " + key, total(H["costs"], key), H["costTotal"][key])
    check("H cost branch total", sum(H["costTotal"]["by"].values()), H["costTotal"]["job"])
    for key in ("onRecord", "toCome", "job", "billed", "unbilled"):
        check("H Revenue total " + key, total(H["inv"], key), H["invTotal"][key])
    check("H Revenue now", H["invTotal"]["onRecord"], P["revNow"])
    check("H Revenue job", H["invTotal"]["job"], P["revJob"])
    check("H demob sum", total(H["demob"], "total"), H["demobTotal"])
    check("H demob branches", sum(H["demobBy"].values()), H["demobTotal"])
    check("H people job", total(H["people"]["rows"], "job"), X["wages"]["job"])
    check("H PO money", H["receiptedSum"] + H["notConfirmed"], H["poSum"])
    check("H PO counts", sum(H["counts"].values()), len(H["pos"]))

    # This comparison is informative, not a failed reconciliation. v9.61 names
    # the two different grouping bases; aggregate branch costs must not be moved
    # merely to make a Revenue-branch recovery comparison equal Finance.
    grouping = {}
    for key in ("costBranch", "revenueBranch"):
        by = collections.defaultdict(float)
        for row in supplier:
            by[row[key]] += row["estimate"]
        grouping[key] = {b: round(v, 2) for b, v in sorted(by.items())}
    info = [{"kind": "scope", "name": "Supplier forecast grouping",
             "basis": "Rehire recovery groups by Revenue branch; Finance uses the documented Direct cost branch. These branch subtotals need not match.",
             "supplierForecastsByBranch": grouping}]
    return checks, info
