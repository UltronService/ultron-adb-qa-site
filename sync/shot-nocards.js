const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1800 } });
  await p.goto("http://127.0.0.1:43123/schedule", { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(1500);
  const buttons = p.getByRole("button", { name: /查看排程/ });
  if ((await buttons.count()) >= 1) await buttons.nth(0).click();
  await p.waitForTimeout(7000);
  const body = await p.locator("body").innerText();
  console.log("HAS_CARD_HINT", /素材清單/.test(body) && /細節/.test(body));
  console.log("HAS_TABLE", /名稱/.test(body) && /秒數|類型/.test(body));
  console.log("HAS_GANTT", /今日甘特圖|甘特/.test(body));
  // click a gantt bar if present
  const bar = p.locator("[class*='gantt'] button, [class*='gantt'] [role='button'], .schedule-gantt button, [data-project-id]").first();
  if (await bar.count()) {
    await bar.click();
    await p.waitForTimeout(800);
    console.log("CLICKED_BAR");
  } else {
    // try clicking text of a project time range in gantt area
    const t = p.locator("text=/14:00|18:31/").first();
    if (await t.count()) { await t.click(); await p.waitForTimeout(800); console.log("CLICKED_TEXT"); }
  }
  await p.screenshot({ path: "C:/Users/User/Desktop/qa_schedule_no_cards.png", fullPage: true });
  // focus table area
  const table = p.locator("table").first();
  if (await table.count()) {
    await table.scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await p.screenshot({ path: "C:/Users/User/Desktop/qa_schedule_table_only.png", fullPage: false });
  }
  await b.close();
  console.log("DONE");
})().catch((e) => { console.error(e); process.exit(1); });
