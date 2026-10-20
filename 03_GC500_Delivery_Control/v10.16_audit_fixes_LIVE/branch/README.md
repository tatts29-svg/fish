# Customer-charge branch allocation

Author: Andrew Fisher

A manually entered customer charge already reached the combined Revenue total, but its selected branch was lost in the final P&L and Finance allocation. It appeared under Shared job / allocation pending. The branch adapter now reads exactly the same usable, non-docket customer-charge rows as the existing combined money model and uses the existing branch reader: explicit branch first, otherwise the reference branch. An unassigned charge remains shared.

This is an allocation correction only. Charge amounts, source rates, date rules, supplier costs and native records are unchanged. Docket-derived charges and Coates Direct-cost entries retain their separate existing paths. Zero contributes nothing; negative manual charges remain invalid under the existing entry rules. No credit or new charge feature is introduced.

The focused GET-only browser check passes 38 assertions: unchanged current saved totals; explicit branch; amount edits; reassignment and removal; reference inheritance and explicit precedence; unassigned charges; numeric text and branch normalisation; positive, zero and rejected negative amounts; multiple branches to the cent; existing date semantics; Finance reconciliation; and restored in-memory state. The combined waiver regression also passes all 23 assertions, including its previously failing branch check. Four source guards verify the exact two-fragment change and refuse repeated or mismatched input. Original-source financial evidence and detailed output remain private. Root owns combined release checks and publication.
