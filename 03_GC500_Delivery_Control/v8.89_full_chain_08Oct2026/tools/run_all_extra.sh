# sourced by run_all.sh: each release's own checks on the combined candidate ($PAGE, $E, $S, R() come from run_all.sh)
# DATA accounting for the whole chain: live -> v8.88all must be exactly v8.86's moves (v8.87 and v8.88 change no DATA);
# v8.88all -> the full chain must be exactly v8.89's master changes.
if [ -z "$SKIP_CHAIN_IDENTITY" ] && [ -f build/GC500_v8.88all/GC500_Delivery_Control_hosted.html ]; then
 python3 v8.86_event_portables_days_DRAFT/tests/test_data886.py $B/base_live.html build/GC500_v8.88all/GC500_Delivery_Control_hosted.html meet_points_03Oct2026/event_portables_plan.json > $E/data886_chain.log 2>&1; echo "data886 (live -> v8.84..v8.88) exit $? $(tail -1 $E/data886_chain.log)"
 python3 v8.89_master_map_DRAFT/tests/test_identity889.py build/GC500_v8.88all/GC500_Delivery_Control_hosted.html $PAGE > $E/identity889_chain.log 2>&1; echo "identity889 (v8.88all -> full) exit $? $(tail -1 $E/identity889_chain.log)"
fi
mkdir -p $S/combined_shots
for m in "" 1; do w=$([ -n "$m" ] && echo phone || echo laptop)
 GC500_CACHE=$(mktemp -d -p $S) MOB=$m OUT=$S/combined_shots timeout 600 node v8.86_event_portables_days_DRAFT/tests/test_ep886.cjs > $E/ep886_$w.log 2>&1; echo "ep886_$w exit $? $(tail -1 $E/ep886_$w.log)"
 GC500_CACHE=$(mktemp -d -p $S) MOB=$m OUT=$S/combined_shots timeout 600 node v8.88_costs_transport_DRAFT/tests/test_transport888.cjs > $E/transport888_$w.log 2>&1; echo "transport888_$w exit $? $(tail -1 $E/transport888_$w.log)"
 R v8.65_costs_one_source_DRAFT/tests/test_costs865.cjs "$m" $E/costs865_$w.log
 GC500_CACHE=$(mktemp -d -p $S) MOB=$m LOCAL=$PWD/${EXPLORER_DIR:-v8.87_map_explorer_DRAFT/explorer} timeout 900 node v8.87_map_explorer_DRAFT/tests/test_explorer887.cjs > $E/explorer887_$w.log 2>&1; echo "explorer887_$w exit $? $(tail -1 $E/explorer887_$w.log)"
done
GC500_CACHE=$(mktemp -d -p $S) W=2560 H=1370 OUT=$S/combined_shots timeout 600 node v8.88_costs_transport_DRAFT/tests/test_transport888.cjs > $E/transport888_2560.log 2>&1; echo "transport888_2560 exit $? $(tail -1 $E/transport888_2560.log)"
