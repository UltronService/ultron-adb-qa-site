const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 2400 } });
  await p.goto("http://127.0.0.1:43123/schedule", { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(1500);
  const buttons = p.getByRole("button", { name: /查看排程/ });
  if ((await buttons.count()) >= 1) await buttons.nth(0).click();
  await p.waitForTimeout(7000);
  const collapse = p.getByRole("button", { name: /收起|展開完整/ });
  console.log("BTN_COUNT", await collapse.count());
  for (let i = 0; i < await collapse.count(); i++) {
    console.log("BTN", i, await collapse.nth(i).innerText());
  }
  const el = p.locator("text=/完整表格|完整欄位|收起/").first();
  if (await el.count()) {
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: "C:/Users/User/Desktop/qa_schedule_table_open.png", fullPage: true });
  // also crop around collapse if present
  const btn = p.getByRole("button", { name: /收起/ }).first();
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    console.log("BOX", box);
    await p.screenshot({
      path: "C:/Users/User/Desktop/qa_schedule_table_open_focus.png",
      clip: {
        x: Math.max(0, (box?.x || 40) - 40),
        y: Math.max(0, (box?.y || 200) - 80),
        width: 1200,
        height: 900,
      },
    });
  }
  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
