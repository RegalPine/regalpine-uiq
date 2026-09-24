import type { Measurement, MeasurementSnapshot } from '@uiq/core';
import { measureBackgroundColor, measureForegroundColor } from '../color/measureColor';
import { measureEnvironment } from '../environment/measureViewport';
import { measureGeometry } from '../geometry/measureGeometry';
import { createMeasurementFactory } from '../measurement-factory';
import { measureSpacing } from '../spacing/measureSpacing';
import { measureTypography } from '../typography/measureTypography';
import { measureLayout } from '../layout/measureLayout';
import { computeDomPath } from '../entity/domPath';
import { resolveEntityId } from '../entity/resolveEntityId';
import type {
  BrowserMeasurementAdapter,
  BrowserMeasurementContext,
} from './BrowserMeasurementAdapter';

/** 单个 subject 的采集上下文（内部）。 */
interface SubjectCapture {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly stableId: boolean;
  readonly domPath: string;
}

function getComputedStyleOf(element: Element): CSSStyleDeclaration {
  const view = element.ownerDocument.defaultView;
  if (view === null) {
    throw new Error('element 未连接到浏览器视图，无法读取 computed style');
  }
  return view.getComputedStyle(element);
}

/**
 * IMPL-07 §5/§56：Adapter 实现。
 * 每个测量类别独立 try/catch —— 单类别失败只影响该类别的 Measurement
 * （输出 UNKNOWN/ERROR），不影响其他类别（AC-BROWSER-11）。
 */
export class BrowserMeasurementAdapterImpl implements BrowserMeasurementAdapter {
  measure(element: Element, context: BrowserMeasurementContext = {}): MeasurementSnapshot {
    const timestamp = Date.now();
    const factory = createMeasurementFactory(timestamp);
    const subject = this.resolveSubject(element, 0);
    const measurements = this.measureSubject(subject, factory, context);
    const env = this.environment(element, context);
    return {
      id: context.snapshotId ?? `snap-${timestamp}`,
      capturedAt: timestamp,
      source: factory.source,
      ...(env !== undefined ? { environment: env } : {}),
      measurements,
    };
  }

  /**
   * 采集单个 subject 的全部测量（多 subject 采集复用同一 factory/timestamp，
   * 由 browser-global 的 capture 编排）。
   */
  measureElement(
    element: Element,
    factory: ReturnType<typeof createMeasurementFactory>,
    context: BrowserMeasurementContext,
    fallbackIndex: number,
  ): readonly Measurement<unknown>[] {
    const subject = this.resolveSubject(element, fallbackIndex);
    return this.measureSubject(subject, factory, context);
  }

  environment(element: Element, context: BrowserMeasurementContext) {
    const view = element.ownerDocument.defaultView;
    if (view === null) return undefined;
    const env = measureEnvironment(view);
    if (context.viewport !== undefined) {
      return { ...env, viewport: context.viewport };
    }
    return env;
  }

  private resolveSubject(element: Element, fallbackIndex: number): SubjectCapture {
    const { id, stable } = resolveEntityId(element, fallbackIndex);
    return {
      subjectId: id,
      element,
      style: getComputedStyleOf(element),
      stableId: stable,
      domPath: computeDomPath(element),
    };
  }

  private baseMetadata(subject: SubjectCapture): Record<string, unknown> {
    return {
      ...(subject.stableId ? {} : { entityIdStable: false }),
      domPath: subject.domPath,
    };
  }

  private measureSubject(
    subject: SubjectCapture,
    factory: ReturnType<typeof createMeasurementFactory>,
    context: BrowserMeasurementContext,
  ): readonly Measurement<unknown>[] {
    const {
      includeColor = true,
      includeTypography = true,
      includeGeometry = true,
      includeSpacing = false,
      includeLayout = false,
    } = context;
    const includeStyles = context.includeStyles ?? true;
    const measurements: Measurement<unknown>[] = [];
    const ctx = {
      subjectId: subject.subjectId,
      element: subject.element,
      style: subject.style,
      factory,
      lookup: { getElementId: (el: Element) => resolveEntityId(el, 0).id },
    };
    const withBase = (metadata?: Readonly<Record<string, unknown>>): Record<string, unknown> => {
      if (metadata === undefined) return this.baseMetadata(subject);
      return { ...this.baseMetadata(subject), ...metadata };
    };

    if (includeStyles && includeColor) {
      try {
        const fg = measureForegroundColor(ctx);
        measurements.push({
          ...fg,
          ...(fg.metadata !== undefined
            ? { metadata: withBase(fg.metadata) }
            : { metadata: withBase() }),
        });
      } catch (error) {
        measurements.push(
          factory.create({
            subjectId: subject.subjectId,
            type: 'color.srgb',
            value: null,
            status: 'ERROR',
            metadata: withBase({
              reason: error instanceof Error ? error.message : 'measure-failed',
            }),
          }),
        );
      }
      try {
        const bg = measureBackgroundColor(ctx);
        measurements.push({
          ...bg,
          ...(bg.metadata !== undefined
            ? { metadata: withBase(bg.metadata) }
            : { metadata: withBase() }),
        });
      } catch (error) {
        measurements.push(
          factory.create({
            subjectId: subject.subjectId,
            type: 'color.srgb.background',
            value: null,
            status: 'ERROR',
            metadata: withBase({
              reason: error instanceof Error ? error.message : 'measure-failed',
            }),
          }),
        );
      }
    }

    if (includeStyles && includeTypography) {
      try {
        for (const m of measureTypography(ctx)) {
          measurements.push({
            ...m,
            ...(m.metadata !== undefined
              ? { metadata: withBase(m.metadata) }
              : { metadata: withBase() }),
          });
        }
      } catch (error) {
        measurements.push(
          factory.create({
            subjectId: subject.subjectId,
            type: 'typography.font-size',
            value: null,
            status: 'ERROR',
            metadata: withBase({
              reason: error instanceof Error ? error.message : 'measure-failed',
            }),
          }),
        );
      }
    }

    if (includeStyles && includeGeometry) {
      try {
        for (const m of measureGeometry(ctx)) {
          measurements.push({
            ...m,
            ...(m.metadata !== undefined
              ? { metadata: withBase(m.metadata) }
              : { metadata: withBase() }),
          });
        }
      } catch (error) {
        measurements.push(
          factory.create({
            subjectId: subject.subjectId,
            type: 'geometry.width',
            value: null,
            status: 'ERROR',
            metadata: withBase({
              reason: error instanceof Error ? error.message : 'measure-failed',
            }),
          }),
        );
      }
    }

    if (includeStyles && includeSpacing) {
      try {
        for (const m of measureSpacing(ctx)) {
          measurements.push({
            ...m,
            ...(m.metadata !== undefined
              ? { metadata: withBase(m.metadata) }
              : { metadata: withBase() }),
          });
        }
      } catch {
        // IMPL-07 §56：间距为可选类别，采集失败不产生额外测量。
      }
    }

    if (includeStyles && includeLayout) {
      try {
        const view = subject.element.ownerDocument.defaultView;
        const vw = view?.innerWidth ?? 0;
        const vh = view?.innerHeight ?? 0;
        const layoutResult = measureLayout({
          subjectId: subject.subjectId,
          element: subject.element,
          style: subject.style,
          factory,
          viewportWidth: vw,
          viewportHeight: vh,
        });
        for (const m of layoutResult.measurements) {
          measurements.push({
            ...m,
            ...(m.metadata !== undefined
              ? { metadata: withBase(m.metadata) }
              : { metadata: withBase() }),
          });
        }
      } catch (error) {
        measurements.push(
          factory.create({
            subjectId: subject.subjectId,
            type: 'layout.visibility',
            value: null,
            status: 'ERROR',
            metadata: withBase({
              reason: error instanceof Error ? error.message : 'measure-failed',
            }),
          }),
        );
      }
    }

    return measurements;
  }
}
