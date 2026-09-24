/** UIQ-ARCH-01 §15.3：六值退出码契约。 */
export const EXIT_CODES = {
  SUCCESS: 0,
  POLICY_BLOCK: 1,
  CONFORMANCE_FAILURE: 2,
  EXECUTION_ERROR: 3,
  INVALID_CONFIGURATION: 4,
  INPUT_ERROR: 5,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export type CliErrorCode = keyof typeof EXIT_CODES;

/** 携带退出码与错误码的 CLI 错误；runCli 统一转换为 ERROR response。 */
export class CliError extends Error {
  constructor(
    readonly errorCode: CliErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CliError';
  }

  get exitCode(): ExitCode {
    return EXIT_CODES[this.errorCode];
  }
}
