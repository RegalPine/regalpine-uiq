import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadLayoutConfig } from '../../apps/cli/src/commands/layout-config';
import { CliError } from '../../apps/cli/src/errors';

function writeTempConfig(name: string, data: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'uiq-layout-cfg-'));
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(data), 'utf-8');
  return path;
}

describe('P8: loadLayoutConfig', () => {
  it('loads valid minimal config', () => {
    const path = writeTempConfig('valid.json', {
      version: '1.0.0',
      scope: 'page',
      layout: { enabled: true },
    });
    const config = loadLayoutConfig(path);
    expect(config.version).toBe('1.0.0');
    expect(config.scope).toBe('page');
    expect(config.layout.enabled).toBe(true);
  });

  it('loads config with groups and targets', () => {
    const path = writeTempConfig('full.json', {
      version: '1.0.0',
      scope: 'page',
      layout: {
        enabled: true,
        groups: [{ id: 'g1', subjectIds: ['a', 'b'], axis: 'x', reference: 10 }],
        targets: [{ targetId: 't1', metricId: 'LAYOUT.ALIGNMENT', config: { maxDeviation: 2 } }],
      },
    });
    const config = loadLayoutConfig(path);
    expect(config.layout.groups).toHaveLength(1);
    expect(config.layout.targets).toHaveLength(1);
  });

  it('rejects non-object input', () => {
    const path = writeTempConfig('null.json', null);
    expect(() => loadLayoutConfig(path)).toThrow(CliError);
  });

  it('rejects wrong version', () => {
    const path = writeTempConfig('bad-version.json', {
      version: '2.0.0',
      scope: 'page',
      layout: { enabled: true },
    });
    expect(() => loadLayoutConfig(path)).toThrow('布局配置版本必须为 "1.0.0"');
  });

  it('rejects missing scope', () => {
    const path = writeTempConfig('no-scope.json', {
      version: '1.0.0',
      layout: { enabled: true },
    });
    expect(() => loadLayoutConfig(path)).toThrow('scope');
  });

  it('rejects missing layout object', () => {
    const path = writeTempConfig('no-layout.json', {
      version: '1.0.0',
      scope: 'page',
    });
    expect(() => loadLayoutConfig(path)).toThrow('layout');
  });

  it('rejects non-boolean enabled', () => {
    const path = writeTempConfig('bad-enabled.json', {
      version: '1.0.0',
      scope: 'page',
      layout: { enabled: 'yes' },
    });
    expect(() => loadLayoutConfig(path)).toThrow('enabled');
  });

  it('rejects unsupported top-level fields', () => {
    const path = writeTempConfig('extra.json', {
      version: '1.0.0',
      scope: 'page',
      layout: { enabled: true },
      unknownField: true,
    });
    expect(() => loadLayoutConfig(path)).toThrow('unknownField');
  });

  it('rejects non-existent file', () => {
    expect(() => loadLayoutConfig('/nonexistent/path.json')).toThrow('无法读取布局配置');
  });

  it('rejects invalid JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'uiq-layout-cfg-'));
    const path = join(dir, 'bad.json');
    writeFileSync(path, 'not json', 'utf-8');
    expect(() => loadLayoutConfig(path)).toThrow('无法读取布局配置');
  });
});
