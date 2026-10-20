# Supplier allocation core

Author: Andrew Fisher.

`supplier_core1088.js` replaces the existing core while retaining its
`SupplierPo1014` browser global and CommonJS exports:
`calculate`, `key`, `cents`, `productCents`, `GEAR` and `LABOUR`.

The supplier-only gear categories add `bases` and `misc`. A billed bases or
materials line can join an existing red record, including a components-only
record. This does not create physical quantities or customer charge columns.
Green records remain labour-only; blue collections remain counts-only.

An original materials paper without a native record can use a dated `misc`
extra. It requires a nonblank ID, valid work date, positive numeric quantity
and rate, nonblank unit, and source evidence:

```js
{
  id: 'example-material-line',
  date: '2026-10-01',
  column: 'misc',
  name: 'Example material',
  qty: 3,
  unit: 'roll',
  rate: 12.35,
  source: {
    file: 'example-materials-paper.pdf',
    sha256: 'b'.repeat(64),
    page: 2,
    reference: 'MATERIAL-EXAMPLE'
  }
}
```

This example is synthetic. Original source evidence and financial allocations
remain private. Additional evidence metadata is retained on source objects,
records, lines and extras.

Daily team-leader extras keep their existing validation and labour category.
`extrasTotal` includes all valid extras; runtime consumers must classify each
extra by its column. Materials extras must enter gear costs, not Installation.
The core does not assert that its stored evidence matches a real file; the
native writer must verify the original and exact source record before saving.

The existing identity, date, supplier, branch, total, decimal and duplicate
guards remain. An unpriced green note cannot be represented by empty lines or
a zero quantity; it stays outside the allocation until its billing is resolved.
No invoice, receipt, payment or physical completion is inferred.

Run `node test_supplier_core1088.cjs` from this directory. The tests use synthetic
values and include parity against the previous core, components-only bases,
materials evidence and category validation, duplicate claims, exact cents and
preservation of independent prior orders.
