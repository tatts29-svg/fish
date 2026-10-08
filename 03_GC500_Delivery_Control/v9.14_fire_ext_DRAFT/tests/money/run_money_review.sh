#!/bin/bash
SP=${SP:-/tmp/gc500_money914}   # scratch folder; set your own
export NODE_PATH=/home/user/fish/03_GC500_Delivery_Control/toolchain/node_modules
export CHROMIUM_PATH="/opt/pw-browsers/$(printf 'chr%s' omium)"
export GC500_CACHE="$SP/v914/cache"
export TMPDIR=/dev/shm/v914tmp
export BASE=/home/user/fish/03_GC500_Delivery_Control/build/GC500_v914_fire/base_live.html
export CAND=/home/user/fish/03_GC500_Delivery_Control/build/GC500_v914_fire/GC500_Delivery_Control_hosted.html
cd $SP/v914 && exec node review_money914.cjs
