#!/bin/bash
# Final candidate: live + v8.84 .. v8.89 + v8.93 (maps aligned) + v8.94 (lighting audit) + v8.91 + v8.92 + v8.95 (Baseplan 7 Oct)
# + v8.91 truck flow + v8.92 polish, in the order 893 -> 894 -> 891 -> 892 -> 895 (each patch's footer guard accepts it). Usage: build_final.sh <label>
set -e
cd /home/user/fish/03_GC500_Delivery_Control
P=()
for f in v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
         v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py \
         v8.88_costs_transport_DRAFT/patch_v888.py v8.89_master_map_DRAFT/patch_v889.py \
         v8.93_maps_aligned_DRAFT/patch_v893.py v8.94_lighting_basis_DRAFT/patch_v894.py \
         v8.91_truck_flow_DRAFT/patch_v891.py v8.92_a_plus_pass_DRAFT/patch_v892.py \
         v8.95_baseplan_07oct_DRAFT/patch_v895.py; do
  [ -f "$f" ] && P+=("$f") || { echo "MISSING: $f"; exit 2; }
done
echo "patches: ${#P[@]}"; printf '  %s\n' "${P[@]}"
toolchain/build.sh "${1:-v8.95final}" "${P[@]}"
