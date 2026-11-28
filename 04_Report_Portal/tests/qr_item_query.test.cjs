"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const code = fs.readFileSync(path.join(__dirname, "..", "qr_item_query.js"), "utf8");

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.events = {};
    this.textContent = "";
  }
  append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
  replaceChildren() { this.children.forEach(n => { n.parent = null; }); this.children = []; }
  remove() { this.parent.children = this.parent.children.filter(n => n !== this); this.parent = null; }
  setAttribute(key, val) { this.attrs[key] = val; }
  removeAttribute(key) { delete this.attrs[key]; if (key === "href") delete this.href; }
  addEventListener(type, fn) { this.events[type] = fn; }
  fire(type) {
    const e = {currentTarget:this, preventDefault() { this.defaultPrevented = true; }};
    this.events[type]?.(e);
    return e;
  }
  get isConnected() { return this.tag === "body" || Boolean(this.parent?.isConnected); }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  find(tag) {
    if (tag === this.tag) return this;
    for (const c of this.children) { const found = c.find(tag); if (found) return found; }
  }
}

function fixture(now = "2026-11-28T07:00:00+10:00") {
  const body = new Element("body");
  const window = new Element("window");
  class Clock extends Date { static now() { return Date.parse(now); } }
  // No fetch, storage, network, mail client, or navigation API is available to these tests.
  vm.runInNewContext(code, {window, document:{body, createElement:tag => new Element(tag)}, Date:Clock});
  const api = window.QRItemQuery;
  function row(input) {
    const b = api.button({scope:"personal", subject:"Example Worker", company:"Sample Co",
      assetId:"007-A", assetName:"Angle grinder", snapshot:"28 Nov 2026, 07:15 AEST", ...input});
    body.append(b);
    return b;
  }
  return {body, api, row, window};
}

test("asking about a personal asset builds only its scoped, editable email draft", () => {
  const {body, row} = fixture();
  const b = row({assetId:"007-A?&+", assetName:"Grinder & guard\nfor workshop",
    barcode:"do-not-expose-card", token:"do-not-expose-token"});
  assert.equal(body.find("a"), undefined);
  b.fire("click");
  const d = body.find("dialog");
  assert.equal(d.open,true);
  assert.equal(d.attrs["aria-labelledby"],"item-query-title");
  assert.equal(d.find("button").focused,true);
  const mail = new URL(d.find("a").href);
  assert.equal(mail.protocol,"mailto:");
  assert.equal(mail.pathname,"thomas.maher@coates.com.au");
  assert.equal(mail.searchParams.get("subject"),"MMG Dugald River | Item query | 007-A?&+");
  assert.match(mail.searchParams.get("body"),/Item: Grinder & guard for workshop/);
  assert.match(mail.searchParams.get("body"),/Asset number: 007-A\?&\+/);
  assert.match(mail.searchParams.get("body"),/Worker: Example Worker\r\nCompany: Sample Co/);
  assert.match(mail.searchParams.get("body"),/snapshot: 28 Nov 2026, 07:15 AEST/);
  assert.doesNotMatch(mail.href,/do-not-expose/);
  assert.equal(d.find("a").textContent,"Open email draft");
});

test("offer both named recipients and default to the verified Queensland shift only within roster", () => {
  const cases = [
    ["2026-11-25T05:59:59+10:00","both"], ["2026-11-25T06:00:00+10:00","thomas"],
    ["2026-11-28T17:59:59+10:00","thomas"],["2026-11-28T18:00:00+10:00","cody"],
    ["2026-11-29T05:59:59+10:00","cody"],["2026-11-29T06:00:00+10:00","thomas"],
    ["2026-12-02T05:59:59+10:00","cody"], ["2026-12-02T06:00:00+10:00","both"]
  ];
  for (const [date, expected] of cases) {
    const {body, row} = fixture(date);
    row().fire("click");
    const select=body.find("select"), a=body.find("a");
    assert.equal(select.value,expected);
    assert.equal(select.children.length,3);
    for (const [key,address] of [["both","thomas.maher@coates.com.au,cody.mitchell@coates.com.au"],
      ["cody","cody.mitchell@coates.com.au"],["thomas","thomas.maher@coates.com.au"]]) {
      select.value=key;select.fire("change");
      assert.equal(new URL(a.href).pathname,address);
    }
  }
});

test("company drafts, cancellation, print, stale rows and subject changes are isolated", () => {
  const {body, api, row, window}=fixture();
  const old=row({});
  old.fire("click");
  const first=body.find("dialog"), oldLink=first.find("a"), oldSelect=first.find("select");
  assert.equal(first.fire("cancel").defaultPrevented,true);
  assert.equal(body.find("dialog"),undefined);
  assert.equal(oldLink.href,undefined);
  assert.equal(old.focused,true);
  old.fire("click");
  window.fire("beforeprint");
  assert.equal(body.find("dialog"),undefined);
  old.fire("click");
  const staleLink=body.find("a");
  api.reset();
  assert.equal(staleLink.href,undefined);
  oldSelect.fire("change");old.fire("click");
  assert.equal(oldLink.href,undefined);
  assert.equal(body.find("dialog"),undefined);
  const business=row({scope:"company",subject:"Second Crew",company:"PRIVATE-OTHER",assetId:"R-100"});
  business.fire("click");
  const mail=new URL(body.find("a").href);
  const message=mail.searchParams.get("body");
  assert.match(message,/Company: Second Crew/);
  assert.match(message,/Asset number: R-100/);
  assert.doesNotMatch(message,/Worker:|007-A|PRIVATE-OTHER|Example Worker/);
  body.find("dialog").find("button").fire("click");
  assert.equal(business.focused,true);
});

test("invalid scope and missing identity cannot create actionable controls", () => {
  const {body, row}=fixture();
  for (const overrides of [{scope:"manager"},{subject:" "},{assetName:""}]) {
    const b=row(overrides);
    assert.equal(b.hidden,true);b.fire("click");assert.equal(body.find("dialog"),undefined);
  }
  const b=row({assetId:"",snapshot:""});
  b.fire("click");
  const bodyText=new URL(body.find("a").href).searchParams.get("body");
  assert.doesNotMatch(bodyText,/Asset number|snapshot:/);
  assert.match(bodyText,/Item: Angle grinder/);
});
