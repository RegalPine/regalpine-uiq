/**
 * @uiq/theme — 主题覆盖、完整性与覆盖率（IMPL-09 §20-25、IMPL-19 §18）。
 * 依赖白名单：@uiq/core + @uiq/tokens（ARCH-01 §4.2）；禁止 browser/rules/diagnostic 反向依赖（IMPL-09 §64）。
 */
export type { ThemeCoverage } from './coverage';
export { themeCoverage } from './coverage';

export { applyTheme } from './theme-resolver';

export type {
  ThemeIntegrity,
  ThemeIssue,
  ThemeIssueCode,
  ThemeValidationResult,
} from './theme-validator';
export { validateTheme } from './theme-validator';
