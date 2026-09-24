# UIQ CLI Reference

## Commands

```bash
uiq measure <target> [--subjects <selector>] [--output <file>] [--allow-external] [--auth-state <file>]
uiq analyze <target|snapshot.json> [--output <file>] [--allow-external] [--auth-state <file>]
uiq evaluate <snapshot.json>
uiq conformance <snapshot.json> --level <core|standard|browser|full>
uiq regression --baseline <baseline.json> --current <analysis.json>
uiq snapshot <target> --output <file> [--subjects <selector>] [--allow-external] [--auth-state <file>]
uiq report <analysis.json> [--format <json|markdown|html>] [--output <file>]
uiq auth-save <target> --output <file> [--allow-external]
uiq install-skill [--agent <qoder|claude|codex|kiro>] [--copy]
```

## Auth State (Login-Protected Pages)

Use `--auth-state <file>` with browser commands (`measure`, `analyze`, `snapshot`) to access login-protected pages. The file is a Playwright `storageState` JSON (cookies + localStorage).

### Generating Auth State

**Option A: Playwright MCP Tools (Skill-native, preferred)**

The Skill can use Playwright MCP tools directly to handle login, then export storageState via `evaluate_script`. See [Auth Workflow](../workflows/auth.md).

**Option B: UIQ CLI auth-save**

```bash
# Open browser, login manually, press Enter to save
uiq auth-save "https://app.example.com/login" --output auth.json --allow-external
```

**Option C: Playwright codegen**

```bash
# Record login flow, then export storageState in the generated script
npx playwright codegen "https://app.example.com/login"
```

### Usage

```bash
# Use in subsequent captures
uiq analyze "https://app.example.com/dashboard" --auth-state auth.json --allow-external
```

## Install Skill

Install UIQ Skill to an Agent's skills directory:

```bash
# Install to Qoder (default, symlink)
uiq install-skill

# Install to specific Agent
uiq install-skill --agent claude
uiq install-skill --agent codex
uiq install-skill --agent kiro

# Use copy mode instead of symlink
uiq install-skill --copy
```

Supported agents: `qoder`, `claude`, `codex`, `kiro`

## Machine Output

Always prefer:

```bash
--format json
```

## Human Output

Supported:

```bash
--format terminal
--format markdown
--format html
```

## Exit Codes

```text
0 SUCCESS
1 POLICY_BLOCK
2 CONFORMANCE_FAILURE
3 EXECUTION_ERROR
4 INVALID_CONFIGURATION
5 INPUT_ERROR
```

## Version

Reproducible analysis must use explicit versions.

Do not use:

```text
latest
```
