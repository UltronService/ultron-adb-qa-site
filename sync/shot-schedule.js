const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1400 } });
  await p.goto("http://127.0.0.1:43123/schedule", { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(2000);
  const buttons = p.getByRole("button", { name: /查看排程/ });
  const n = await buttons.count();
  console.log("buttons", n);
  if (n >= 2) await buttons.nth(1).click();
  else if (n >= 1) await buttons.nth(0).click();
  await p.waitForTimeout(5000);
  const text = await p.locator("body").innerText();
  console.log("SNIP", JSON.stringify(text.slice(0, 1000)));
  await p.screenshot({ path: "C:/Users/User/Desktop/qa_schedule_176.png", fullPage: true });
  await b.close();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
