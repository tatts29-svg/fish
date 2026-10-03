#!/bin/bash
set -e
cd /tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
mkdir -p hero_out; rm -f hero_out/machine_hero.webm hero_out/machine_hero.mp4
$FF -y -hide_banner -loglevel error -i hero_frames/f0000.jpg -vf "scale=1440:-2" -c:v libwebp -quality 84 hero_out/machine_hero_poster.webp
$FF -y -hide_banner -loglevel error -framerate 30 -i hero_frames/f%04d.jpg -vf "scale=1440:896,format=yuv420p" -c:v libx264 -preset slow -crf 27 -g 60 -movflags +faststart -an hero_out/machine_hero.mp4
$FF -y -hide_banner -loglevel error -framerate 30 -i hero_frames/f%04d.jpg -vf "scale=1440:896,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -g 60 -an hero_out/machine_hero.webm
ls -l hero_out
echo ENCODED
