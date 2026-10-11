  // Author: Andrew Fisher. A service activity, with no new mesh or programme denominator.
  {
    const operations = evidence.operations.filter(operation => operation.type === 'scrim_existing');
    const pending = evidence.pending.filter(operation => operation.type === 'scrim_existing');
    if (operations.length || pending.length) {
      const row = empty({id:'scrim_existing',label:'Scrim applied to existing fence',unit:'m',kind:'recorded-only',
        note:'Existing-fence activity only; no new mesh, bracing quantity, programme percentage or charge is inferred.'});
      row.recorded = pending.length ? null : round(operations.reduce((sum, operation) => sum + operation.quantity, 0));
      row.recordCount = operations.length;
      row.missing = pending.length > 0;
      row.evidencePending = pending.length > 0;
      row.comparison = 'Recorded only · existing fence';
      row.issues.push(row.note, ...pending.map(operation => operation.reason));
      result.summaryRows.push(row);
    }
  }
