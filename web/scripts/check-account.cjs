/* Run against a running web app. See docs/user-dashboard.md for setup. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.ACCOUNT_BASE_URL || "http://localhost:3005";
const output = path.join(process.cwd(), "output", "account-dashboard");
const key = "nestt.account.preview.v1";
const pages = [
  ["/account", "Welcome home, Raihan.", "overview"],
  ["/account/orders", "My orders", "orders"],
  ["/account/orders/NST-10482", "Order #NST-10482", "order-details"],
  ["/account/addresses", "My addresses", "addresses"],
  ["/account/profile", "Profile & security", "profile"],
  ["/account/wishlist", "Saved for your space.", "wishlist"],
];

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  const errors = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const goto = async (url, heading) => {
    await page.goto(`${base}${url}`);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  };
  const state = () =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  try {
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 950 });
      for (const [url, heading, name] of pages) {
        await goto(url, heading);
        await page.locator("img").evaluateAll((images) =>
          images.forEach((image) => {
            image.loading = "eager";
          }),
        );
        await page.waitForFunction(() =>
          [...document.querySelectorAll("img")].every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${url} overflows at ${width}px`,
        );
        if (width === 1440 || width === 390)
          await page.screenshot({
            path: path.join(output, `${name}-${width}.png`),
            fullPage: true,
          });
      }
    }
    console.log(
      "PASS: six routes at 1440, 768, 390 and 360px; all images loaded; no page overflow.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await goto("/account/orders", "My orders");
    await page.getByRole("tab", { name: "In progress" }).click();
    assert.equal(await page.locator(".order-card").count(), 2);
    await page.getByRole("tab", { name: "In progress" }).press("ArrowRight");
    assert.equal(
      await page
        .getByRole("tab", { name: "Delivered" })
        .getAttribute("aria-selected"),
      "true",
    );
    await page
      .getByRole("searchbox", {
        name: "Search orders by order number or product",
      })
      .fill("not-a-real-order");
    await page.getByRole("heading", { name: "No orders found." }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    assert.equal(await page.locator(".order-card").count(), 4);
    await page.getByRole("button", { name: "Next page" }).click();
    await page.getByText("Showing 5–8 of 8 orders").waitFor();
    console.log(
      "PASS: order filtering, search, clear filters, keyboard tabs and pagination.",
    );

    await goto("/account/orders/NST-10470", "Order #NST-10470");
    await page
      .getByRole("button", { name: "Cancel order", exact: true })
      .click();
    await page
      .getByLabel("Reason for cancellation")
      .selectOption("Changed my mind");
    await page.getByRole("button", { name: "Confirm cancellation" }).click();
    await page
      .getByRole("heading", { name: "This order has been cancelled." })
      .waitFor();
    await page.reload();
    await page
      .getByRole("heading", { name: "This order has been cancelled." })
      .waitFor();
    assert.equal(
      (await state()).orders.find((o) => o.id === "NST-10470").cancelReason,
      "Changed my mind",
    );
    await goto("/account/orders/NST-10482", "Order #NST-10482");
    assert.equal(
      await page
        .getByRole("button", { name: "Cancel order", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Delivery updates", exact: true })
      .click();
    await page.getByRole("dialog", { name: "Your delivery journey" }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await goto("/account/orders/NST-10396", "Order #NST-10396");
    await page.getByRole("button", { name: "Request a return" }).click();
    await page.getByLabel("Reason for return").selectOption("Damaged item");
    await page
      .getByLabel("Additional details")
      .fill("A scratch on the armrest.");
    await page.getByRole("button", { name: "Record demo return" }).click();
    await page.getByRole("heading", { name: "Your return requests" }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Request a return" }).count(),
      0,
    );
    await page.reload();
    await page.getByRole("heading", { name: "Your return requests" }).waitFor();
    assert.equal(
      (await state()).orders.find((o) => o.id === "NST-10396").returns.length,
      1,
    );
    console.log(
      "PASS: cancellation persistence and eligibility, tracking dialog/Escape, return submission and duplicate prevention.",
    );

    await goto("/account/addresses", "My addresses");
    await page.getByRole("button", { name: "Add new address" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Address label").fill("Studio");
    await dialog.getByLabel("Division").selectOption("Dhaka");
    await dialog.getByLabel("District / City").fill("Dhaka");
    await dialog.getByLabel("Area / Thana").fill("Dhanmondi");
    await dialog.getByLabel("Address line").fill("House 8, Road 27");
    await dialog.getByRole("textbox", { name: /^Phone/ }).fill("invalid");
    await dialog.getByRole("button", { name: "Save address" }).click();
    await dialog.getByRole("alert").waitFor();
    await dialog
      .getByRole("textbox", { name: /^Phone/ })
      .fill("+8801700000001");
    await dialog.getByLabel("Set as default shipping address").check();
    await dialog.getByRole("button", { name: "Save address" }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.reload();
    await page.getByRole("heading", { name: "Studio", exact: true }).waitFor();
    let saved = await state();
    assert.equal(saved.addresses.length, 3);
    assert.equal(saved.addresses.filter((a) => a.isDefaultShipping).length, 1);
    assert.equal(
      saved.addresses.find((a) => a.isDefaultShipping).label,
      "Studio",
    );
    const studio = page
      .locator(".address-card")
      .filter({
        has: page.getByRole("heading", { name: "Studio", exact: true }),
      });
    await studio.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("button", { name: "Delete address", exact: true })
      .click();
    await page.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key)).addresses.length === 2,
      key,
    );
    saved = await state();
    assert.equal(saved.addresses.filter((a) => a.isDefaultShipping).length, 1);
    assert.equal(saved.addresses.filter((a) => a.isDefaultBilling).length, 1);
    console.log(
      "PASS: address validation, create/save/reload, unique defaults, delete and default reassignment.",
    );

    await goto("/account/wishlist", "Saved for your space.");
    await page
      .getByRole("button", {
        name: "Remove Oslo High-Back Recliner from wishlist",
      })
      .click();
    assert.equal(await page.locator(".wishlist-card").count(), 5);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await page.locator(".wishlist-card").count(), 6);
    await page.getByLabel("Sort wishlist").selectOption("low");
    assert.match(
      await page.locator(".wishlist-card").first().textContent(),
      /Aero/,
    );
    const oslo = page
      .locator(".wishlist-card")
      .filter({
        has: page.getByRole("heading", { name: "Oslo High-Back Recliner" }),
      });
    await oslo.getByRole("button", { name: "Choose options" }).click();
    await page.getByLabel("Quantity", { exact: true }).fill("8");
    await page.getByRole("button", { name: /Add to bag ·/ }).click();
    await page
      .getByRole("dialog", { name: "Your bag (8)", exact: true })
      .waitFor();
    await page
      .getByRole("button", {
        name: "Increase Oslo High-Back Recliner quantity",
      })
      .click();
    assert.equal((await state()).bag[0].quantity, 8);
    await page
      .getByRole("button", {
        name: "Decrease Oslo High-Back Recliner quantity",
      })
      .click();
    await page
      .getByRole("dialog", { name: "Your bag (7)", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.reload();
    await page
      .getByRole("heading", { name: "Saved for your space." })
      .waitFor();
    assert.equal((await state()).bag[0].quantity, 7);
    for (let i = 0; i < 6; i++)
      await page.locator(".wishlist-remove").first().click();
    await page
      .getByRole("heading", { name: "Make room for your favourites." })
      .waitFor();
    console.log(
      "PASS: wishlist remove/undo, price sorting, empty state, product options, bag stock limits and persistence.",
    );

    await goto("/account/profile", "Profile & security");
    await page.getByLabel("Full name", { exact: true }).fill("Nadia Ahmed");
    await page.getByLabel("Email address").fill("nadia@example.com");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page
      .getByRole("heading", { name: "Nadia Ahmed", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("heading", { name: "Nadia Ahmed", exact: true })
      .waitFor();
    assert.equal((await state()).profile.isEmailVerified, false);
    await page.getByRole("tab", { name: "Security", exact: true }).click();
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page.route("**/api/account/password-reset", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "The account service is unavailable.",
        }),
      }),
    );
    await page
      .getByRole("dialog")
      .getByLabel("Email address")
      .fill("qa@example.com");
    await page.getByRole("button", { name: "Send verification code" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "The account service is unavailable." })
      .waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Sign out", exact: true })
      .last()
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "You’ve left the demo account." })
      .waitFor();
    await page.getByRole("button", { name: "Open demo account" }).click();
    await page.getByRole("heading", { name: "Profile & security" }).waitFor();
    const raw = JSON.stringify(await state());
    assert.equal(raw.includes("password"), false);
    console.log(
      "PASS: profile save/reload, verification reset, service-error UX, sign out/resume; no passwords stored.",
    );

    await goto(
      "/account/orders/NOT-A-REAL-ORDER",
      "We couldn’t find that order.",
    );
    assert.equal(
      errors.length,
      0,
      `Uncaught browser errors: ${errors.join("\n")}`,
    );
    console.log(
      "PASS: unknown order fallback and zero uncaught browser errors.",
    );
    await fs.writeFile(
      path.join(output, "checks.json"),
      JSON.stringify(
        {
          passed: true,
          viewportWidths: [1440, 768, 390, 360],
          routes: pages.map((p) => p[0]),
          browserErrors: errors,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
