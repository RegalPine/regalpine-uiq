export class MeasurementError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MeasurementError';
  }
}

export type UnitSystem = 'px' | 'em' | 'rem' | 'pt' | 'percent' | 'dimensionless';

export interface UnitValue {
  readonly value: number;
  readonly unit: UnitSystem;
}

export interface ConversionContext {
  readonly rootFontSize?: number;
  readonly parentFontSize?: number;
}
