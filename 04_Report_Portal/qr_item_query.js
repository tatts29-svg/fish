"use strict";

(() => {
  const controllers = {
    thomas: {name: "Thomas Maher", address: "thomas.maher@coates.com.au"},
    cody: {name: "Cody Mitchell", address: "cody.mitchell@coates.com.au"}
  };
  let items = new WeakMap();
  let dialog = null;

  // The confirmed Dugald River day and night roster runs from 25 Nov through
  // the final night shift ending 2 Dec. Other dates use both store contacts.
  function rosteredController(now) {
    const start = Date.parse("2026-11-25T06:00:00+10:00");
    const finish = Date.parse("2026-12-02T06:00:00+10:00");
    if (now < start || now >= finish) return "both";
    const hour = new Date(now + 10 * 60 * 60 * 1000).getUTCHours();
    return hour >= 6 && hour < 18 ? "thomas" : "cody";
  }

  function text(value) {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value).replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  }

  function element(tag, contents) {
    const node = document.createElement(tag);
    if (contents) node.textContent = contents;
    return node;
  }

  function dismiss(restoreFocus = false) {
    if (!dialog) return;
    const previous = dialog;
    dialog = null;
    previous.link.removeAttribute("href");
    if (previous.node.open) previous.node.close();
    previous.node.replaceChildren();
    previous.node.remove();
    if (restoreFocus && previous.trigger.isConnected) previous.trigger.focus();
  }

  function reset() {
    items = new WeakMap();
    dismiss();
  }

  function emailDraft(item, addresses) {
    const lines = [
      "Hello Dugald River tool store team,",
      "",
      "Please check the on-hire record for this item.",
      "",
      "Item: " + item.assetName
    ];
    if (item.assetId) lines.push("Asset number: " + item.assetId);
    if (item.scope === "personal") lines.push("Worker: " + item.subject);
    const company = item.scope === "company" ? item.subject : item.company;
    if (company) lines.push("Company: " + company);
    if (item.snapshot) lines.push("Rental stock snapshot: " + item.snapshot);
    lines.push("", "My query: ");
    const subject = "MMG Dugald River | Item query | " + (item.assetId || item.assetName);
    return "mailto:" + addresses.join(",") + "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\r\n"));
  }

  function show(event) {
    const trigger = event.currentTarget;
    const item = items.get(trigger);
    if (!item || !trigger.isConnected) return;
    dismiss();

    const node = element("dialog");
    node.className = "item-query-dialog screen-only";
    node.setAttribute("aria-labelledby", "item-query-title");
    const title = element("h2", "Query this item");
    title.id = "item-query-title";
    const close = element("button", "Close");
    close.type = "button";
    close.addEventListener("click", () => dismiss(true));
    const header = element("div");
    header.className = "item-query-header";
    header.append(title, close);

    const info = element("div");
    info.className = "item-query-record";
    info.append(element("strong", item.assetName));
    if (item.assetId) info.append(element("span", "Asset " + item.assetId));
    info.append(element("span", item.scope === "personal" && item.company
      ? item.subject + " · " + item.company : item.subject));
    if (item.snapshot) info.append(element("span", "Rental stock snapshot · " + item.snapshot));

    const label = element("label", "Tool store contact");
    label.htmlFor = "item-query-contact";
    const select = element("select");
    select.id = label.htmlFor;
    select.autocomplete = "off";
    const selected = rosteredController(Date.now());
    for (const [key, caption] of [
      ["both", "Thomas Maher and Cody Mitchell"],
      ["thomas", controllers.thomas.name], ["cody", controllers.cody.name]
    ]) {
      const option = element("option", caption + (key === selected && key !== "both" ? " · rostered now" : ""));
      option.value = key;
      select.append(option);
    }
    select.value = selected;

    const contact = element("p");
    contact.className = "item-query-address";
    const hint = element("p", "Add your question in the email draft, then review and send it.");
    const link = element("a", "Open email draft");
    link.className = "button item-query-compose";
    function updateDraft() {
      if (dialog?.node !== node || items.get(trigger) !== item) return;
      const recipients = select.value === "both"
        ? [controllers.thomas, controllers.cody] : [controllers[select.value]];
      contact.textContent = recipients.map(person => person.address).join(" · ");
      link.href = emailDraft(item, recipients.map(person => person.address));
    }
    select.addEventListener("change", updateDraft);
    node.append(header, info, label, select, contact, hint, link);
    node.addEventListener("cancel", event => { event.preventDefault(); dismiss(true); });
    dialog = {node, link, trigger};
    updateDraft();
    document.body.append(node);
    node.showModal();
    close.focus();
  }

  function button({scope, subject, company, assetId, assetName, snapshot}) {
    const node = element("button", "Query this item");
    node.type = "button";
    node.className = "item-query-button screen-only";
    const item = {scope, subject:text(subject), company:text(company), assetId:text(assetId),
      assetName:text(assetName), snapshot:text(snapshot)};
    if ((scope !== "personal" && scope !== "company") || !item.subject || !item.assetName) {
      node.hidden = true;
      return node;
    }
    node.setAttribute("aria-haspopup", "dialog");
    node.setAttribute("aria-label", "Query this item: " + item.assetName + (item.assetId ? ", asset " + item.assetId : ""));
    items.set(node, item);
    node.addEventListener("click", show);
    return node;
  }

  window.addEventListener("beforeprint", () => dismiss());
  window.QRItemQuery = Object.freeze({button, reset});
})();
