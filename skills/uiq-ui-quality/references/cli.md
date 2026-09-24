# UIQ CLI Reference

## Commands

```bash
uiq measure <target> [--subjects <selector>] [--output <file>] [--allow-external]
uiq analyze <target|snapshot.json> [--output <file>] [--allow-external]
uiq evaluate <snapshot.json>
uiq conformance <snapshot.json> --level <core|standard|browser|full>
uiq regression --baseline <baseline.json> --current <analysis.json>
uiq snapshot <target> --output <file> [--subjects <selector>] [--allow-external]
uiq report <analysis.json> [--format <json|markdown|html>] [--output <file>]
```

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
