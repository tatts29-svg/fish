# Service request log extracts (Railway HTTP log, read-only), 29 Sep 2026

Times UTC. The phone is Andrew's Samsung (Android). `499` is the proxy's code for "the client closed the request before the service answered".

## 24 Sep 2026, 22:38–22:48 — WC12 at the circuit, poor signal

```
22:38:09.193 POST /api/files 499 14044ms        upload abandoned by the phone after 14 s
22:38:30.324 POST /api/files 200 17996ms        WC12 · 1002565 place 2 stored (18 s)
22:38:36.110 POST .../thumb   499 5369ms         preview abandoned, then
22:38:40.654 POST .../thumb   200 2885ms         preview stored
22:39:00.916 POST /api/files 200 23130ms        a second copy of the same upload (browser retry), 23 s
22:39:00.931 PUT  /api/doc/dropPhotos/WC12 200   the whole list written
22:39:01.343 POST /api/files 499 394ms
22:39:01.992 PUT  /api/doc/dropPhotos/WC12 200   the whole list written again, one second later
22:39:58.191 POST /api/files 499 14800ms        abandoned
22:40:03.892 POST /api/files 200 4068ms         WC12 · 1200601 place 2 stored
22:40:07.134 POST /api/files 200 65312ms        WC12 · 1200601 place 1 stored — 65 seconds
22:40:07.787 PUT  /api/doc/dropPhotos/WC12 200   the whole list written
22:40:07.938 POST /api/files 499 64419ms        abandoned after 64 s
22:41:35.626 GET  /v/Coates-GC500-2026 304      the page opened again (view link)
22:42:49.977 GET  /e/<edit token> 304           the page opened again (edit link)
22:46:32 … 22:47:31                              all three places taken again; the 22:38–22:40 files left on the service
```

## 28 Sep 2026, 18:16–18:36 — the evening pass on the phone (good signal)

```
18:16:42.574 POST /api/files 200  783ms         P44 · 198481 place 4 (aerial) stored
18:16:43.084 PUT  /api/doc/dropPhotos/P44 200
18:16:50.486 PUT  /api/doc/dropPhotos/P44 200   a second whole-list write 7 s later, no upload between: the aerial is gone from the list
18:17:52.287 POST /api/files 200  699ms         P44 · 198481 place 2 stored, and kept
18:23:30.076 POST /api/files 200  615ms         P17 place 2 stored
18:23:30.606 PUT  /api/doc/dropPhotos/P17 200
18:23:51.331 POST /api/files 200  605ms         P17 place 1 stored
18:23:51.833 PUT  /api/doc/dropPhotos/P17 200   the list written without the place-2 file from 21 s earlier
18:24:05.514 POST /api/files 200  524ms         P17 place 2 taken again, and kept
18:29:49.772 POST /api/files 200  636ms         WC17 · 1327223 place 2 stored
18:29:50.280 PUT  /api/doc/dropPhotos/WC17 200
18:30:51.891 PUT  /api/doc/dropPhotos/WC17 200  a whole-list write a minute later, no upload between: 1327223 place 2 gone. Never re-taken — put back by v7.41's Put back.
```

No DELETE of a photograph document appears anywhere in either window. Every loss is a whole-list PUT that did not carry a photograph the service already held.
