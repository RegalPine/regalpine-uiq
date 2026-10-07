# UIQ Auth Workflow

## Purpose

Handle authentication and SPA navigation for pages that require login
or clicking through interactions before UIQ analysis.

The Skill uses **playwright-cli** to automate browser interactions
(login, SPA navigation, menu clicks, etc.),
then passes the resulting state to UIQ browser commands via `--auth-state`.

## When to Use

Activate this workflow when:

- The target URL redirects to a login page
- The target URL requires authentication cookies or tokens
- The target is a SPA page that requires clicking through menus/interactions
- Browser capture returns login page content instead of the intended page

## Execution

### Option A: playwright-cli Skill (Preferred)

Use the **playwright-cli** skill to automate browser interactions:

**Login-only scenario:**

```
1. playwright-cli: navigate to login URL
2. playwright-cli: fill username/password
3. playwright-cli: click login button
4. playwright-cli: wait for post-login URL
5. playwright-cli: export storageState → /tmp/uiq-auth-state.json
```

**SPA navigation scenario (login + navigate to target page):**

```
1. playwright-cli: navigate to login URL
2. playwright-cli: fill username/password → click login
3. playwright-cli: wait for post-login URL
4. playwright-cli: click menu items / navigate to target SPA route
5. playwright-cli: wait for target page content to render
6. playwright-cli: export storageState → /tmp/uiq-auth-state.json
7. Note the current page URL (e.g., https://app.example.com/settings/profile)
```

Then pass to UIQ:

```bash
uiq analyze <final-spa-url> --auth-state /tmp/uiq-auth-state.json --allow-external
```

### Option B: Playwright CLI Script

Use `npx playwright` to run a login/navigation script:

```bash
# Generate a script with codegen
npx playwright codegen <login-url>

# Or run a saved script that exports storageState
node login-and-navigate.js
```

Example script (login + SPA navigation):

```javascript
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Login
  await page.goto('<login-url>');
  await page.fill('#username', '<username>');
  await page.fill('#password', '<password>');
  await page.click('#login-btn');
  await page.waitForURL('<post-login-url>');

  // Step 2: SPA navigation — click through to target page
  await page.click('[data-testid="settings-menu"]');
  await page.click('[data-testid="profile-link"]');
  await page.waitForSelector('[data-testid="profile-page"]');

  // Step 3: Export state
  await context.storageState({ path: '/tmp/uiq-auth-state.json' });
  console.log('Current URL:', page.url());
  await browser.close();
})();
```

### Option C: UIQ CLI auth-save Command

Use the built-in `auth-save` command for manual login:

```bash
uiq auth-save <login-url> --output /tmp/uiq-auth-state.json --allow-external
```

This opens a headed browser, user logs in manually and navigates to the target page,
presses Enter to save.

## Integration

After obtaining auth state, use `--auth-state` with any browser command:

```bash
uiq measure <target> --auth-state <file> --allow-external
uiq analyze <target> --auth-state <file> --allow-external
uiq snapshot <target> --output snap.json --auth-state <file> --allow-external
```

## SPA Navigation Pattern

For SPA pages that require multiple clicks to reach:

```
playwright-cli (navigate + interact)
  → export storageState + note final URL
    → uiq analyze <final-url> --auth-state <file>
```

Key points:

- playwright-cli handles all browser interactions (click, fill, navigate, wait)
- UIQ CLI handles the quality analysis on the final page state
- The `--auth-state` carries cookies + localStorage so UIQ can access the page
- UIQ re-navigates to the final URL with the exported state, so the URL must be directly accessible with that auth state

## Notes

- Auth state files contain cookies and localStorage; treat as sensitive data.
- Auth state expires when session cookies expire; re-export as needed.
- Only browser commands (`measure`, `analyze`, `snapshot`) accept `--auth-state`.
- Offline commands (`evaluate`, `conformance`, `regression`, `report`) do not need it.
- For SPA targets, ensure the final URL is a stable route (not a transient hash or modal state).
