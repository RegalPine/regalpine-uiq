import { MeasurementError } from './types';
import type { UnitValue, UnitSystem, ConversionContext } from './types';

const PX_PER_PT = 4 / 3;

export function toPx(input: UnitValue, context: ConversionContext = {}): number {
  if (!Number.isFinite(input.value)) {
    throw new MeasurementError('INVALID_UNIT', '单位转换需要有限数值');
  }
  switch (input.unit) {
    case 'px':
      return input.value;
    case 'pt':
      return input.value * PX_PER_PT;
    case 'dimensionless':
      return input.value;
    case 'percent':
      throw new MeasurementError('MISSING_CONTEXT', '百分比转换需要基准上下文');
    case 'em':
      if (context.parentFontSize === undefined) {
        throw new MeasurementError('MISSING_CONTEXT', 'em 转换需要 parentFontSize');
      }
      return input.value * context.parentFontSize;
    case 'rem':
      if (context.rootFontSize === undefined) {
        throw new MeasurementError('MISSING_CONTEXT', 'rem 转换需要 rootFontSize');
      }
      return input.value * context.rootFontSize;
    default: {
      const _exhaustive: never = input.unit;
      throw new MeasurementError('INVALID_UNIT', `未知单位：${_exhaustive}`);
    }
  }
}

export function unitLabel(unit: UnitSystem): string {
  switch (unit) {
    case 'px':
      return 'px';
    case 'em':
      return 'em';
    case 'rem':
      return 'rem';
    case 'pt':
      return 'pt';
    case 'percent':
      return '%';
    case 'dimensionless':
      return '';
    default: {
      const _exhaustive: never = unit;
      return String(_exhaustive);
    }
  }
}

export function isLengthUnit(unit: UnitSystem): boolean {
  return unit === 'px' || unit === 'em' || unit === 'rem' || unit === 'pt';
}
