/**
 * IMPL-07 §43：从 User-Agent 识别浏览器名称与版本。
 * 纯函数，便于 Node 单元测试。
 */
export interface BrowserInfo {
  readonly name: string;
  readonly version: string;
}

const PATTERNS: readonly { readonly name: string; readonly regex: RegExp }[] = [
  { name: 'Edge', regex: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
  { name: 'Opera', regex: /(?:OPR|Opera)\/([\d.]+)/ },
  { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
  { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
  { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
];

export function detectBrowser(userAgent: string): BrowserInfo {
  for (const { name, regex } of PATTERNS) {
    const match = regex.exec(userAgent);
    const version = match?.[1];
    if (match !== null && version !== undefined) {
      return { name, version };
    }
  }
  return { name: 'Unknown', version: '0' };
}
