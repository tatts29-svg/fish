/* Author: Andrew Fisher. TEST ONLY — never on the service. Loaded in front of a local server by test_tracker.js:
     FAKE_NOW=2026-10-23T07:59:58+10:00 node -r ./fake_clock.js server.js
   The server's clock starts at FAKE_NOW and runs on from there in real time, so a test can stand just before 08:00 on
   a service day and step over it. server.js itself has no clock setting of its own: nothing here ships. */
'use strict';
const start = Date.parse(process.env.FAKE_NOW || '');
if (Number.isFinite(start)) {
  const RealDate = Date, realNow = RealDate.now.bind(RealDate), offset = start - realNow();
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(realNow() + offset); else super(...a); }
    static now() { return realNow() + offset; }
  }
  global.Date = FakeDate;
}
