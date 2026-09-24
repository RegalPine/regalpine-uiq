# UIQ Auth Workflow

## Purpose

Handle authentication for login-protected pages before UIQ analysis.

The Skill uses Playwright MCP tools or CLI to manage login state,
then passes it to UIQ browser commands via `--auth-state`.

## When to Use

Activate this workflow when:

- The target URL redirects to a login page
- The target URL requires authentication cookies or tokens
- Browser capture returns login page content instead of the intended page

## Execution

### Option A: Playwright MCP Tools (Preferred)

Use Playwright MCP tools to handle login interactively:

```
1. navigate_page → target login URL
2. fill → username/password fields
3. click → login button
4. wait_for → post-login URL or element
5. evaluate_script → JSON.stringify(await context.storageState())
6. Write result to temp file (e.g., /tmp/uiq-auth-state.json)
```

Then pass to UIQ:

```bash
uiq analyze <target-url> --auth-state /tmp/uiq-auth-state.json --allow-external
```

### Option B: Playwright CLI Script

Use `npx playwright` to run a login script:

```bash
# Generate a login script with codegen
npx playwright codegen <login-url>

# Or run a saved script that exports storageState
node login-and-save.js
```

Example login script:

```javascript
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('<login-url>');
  await page.fill('#username', '<username>');
  await page.fill('#password', '<password>');
  await page.click('#login-btn');
  await page.waitForURL('<post-login-url>');
  await context.storageState({ path: '/tmp/uiq-auth-state.json' });
  await browser.close();
})();
```

### Option C: UIQ CLI auth-save Command

Use the built-in `auth-save` command for manual login:

```bash
uiq auth-save <login-url> --output /tmp/uiq-auth-state.json --allow-external
```

This opens a headed browser, user logs in manually, presses Enter to save.

## Integration

After obtaining auth state, use `--auth-state` with any browser command:

```bash
uiq measure <target> --auth-state <file> --allow-external
uiq analyze <target> --auth-state <file> --allow-external
uiq snapshot <target> --output snap.json --auth-state <file> --allow-external
```

## Notes

- Auth state files contain cookies and localStorage; treat as sensitive data.
- Auth state expires when session cookies expire; re-export as needed.
- Only browser commands (`measure`, `analyze`, `snapshot`) accept `--auth-state`.
- Offline commands (`evaluate`, `conformance`, `regression`, `report`) do not need it.
