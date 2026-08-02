#!/usr/bin/env node
// Minimal chromium-cli-style REPL driver for this Next.js app, used
// because chromium-cli itself isn't installed in this environment.
// Reads one command per line from stdin, drives a real headless
// Chromium (via the project's own Playwright devDependency — no new
// dependency needed), and prints one "ok ..." / "ERROR: ..." line per
// command so a caller (a heredoc, or send-keys under tmux) can tell
// what happened.
//
// Commands:
//   nav <url>                    goto(url, waitUntil: networkidle)
//   wait-for <selector>          also accepts text=... / role=...
//   wait-url <glob>              waits for a redirect to finish, e.g.
//                                 after a login form's server action —
//                                 "wait-for text=..." alone can match
//                                 too early if the same text appears
//                                 on both the page you're leaving and
//                                 the one you're going to (this app's
//                                 login card and post-login page share
//                                 the literal heading "Panel de
//                                 administración")
//   click <selector>
//   fill <selector> <text...>    goes through Playwright's real input
//                                 pipeline (fires React's onChange) —
//                                 do NOT eval el.value = '...' instead
//   press <key>                  e.g. Enter, Escape
//   screenshot [name]            saved under ./screenshots/<name>.png
//   console --errors             prints + clears collected console
//                                 errors/pageerrors since last check
//   eval <js>                    page.evaluate(js), prints the result
//   quit
//
// Usage:
//   node driver.mjs <<'EOF'
//   nav http://localhost:3000
//   wait-for text=Catálogos
//   screenshot home
//   EOF

import { chromium } from "playwright";
import { createInterface } from "node:readline";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, "screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

let consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

function parseArgs(line) {
  return line.match(/"[^"]*"|'[^']*'|\S+/g)?.map((s) => s.replace(/^['"]|['"]$/g, "")) ?? [];
}

async function handle(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const [cmd, ...rest] = parseArgs(trimmed);

  switch (cmd) {
    case "nav":
      await page.goto(rest[0], { waitUntil: "networkidle" });
      console.log(`ok nav ${rest[0]}`);
      break;

    case "wait-for":
      await page.waitForSelector(rest.join(" "), { timeout: 15000 });
      console.log(`ok wait-for ${rest.join(" ")}`);
      break;

    case "wait-url":
      await page.waitForURL(rest.join(" "), { timeout: 15000 });
      console.log(`ok wait-url ${rest.join(" ")}`);
      break;

    case "click":
      await page.click(rest.join(" "));
      console.log(`ok click ${rest.join(" ")}`);
      break;

    case "fill":
      await page.fill(rest[0], rest.slice(1).join(" "));
      console.log(`ok fill ${rest[0]}`);
      break;

    case "press":
      await page.keyboard.press(rest.join(" "));
      console.log(`ok press ${rest.join(" ")}`);
      break;

    case "screenshot": {
      const name = rest[0] || `shot-${Date.now()}`;
      const path = join(SCREENSHOT_DIR, `${name}.png`);
      await page.screenshot({ path });
      console.log(`ok screenshot ${path}`);
      break;
    }

    case "console":
      if (rest[0] === "--errors") {
        console.log(consoleErrors.length === 0 ? "ok console: no errors" : `ERRORS:\n${consoleErrors.join("\n")}`);
        consoleErrors = [];
      }
      break;

    case "eval": {
      const result = await page.evaluate(rest.join(" "));
      console.log(`ok eval => ${JSON.stringify(result)}`);
      break;
    }

    case "quit":
      await browser.close();
      process.exit(0);

    default:
      console.log(`unknown command: ${cmd}`);
  }
}

const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  try {
    await handle(line);
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
}
await browser.close();
