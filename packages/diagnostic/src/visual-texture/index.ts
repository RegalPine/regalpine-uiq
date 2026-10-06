import type { Diagnostic, Finding } from '@uiq/core';
import { diagnoseSurface } from './surface';
import { diagnoseDepth } from './depth';
import { diagnoseColorTexture } from './color';
import { diagnoseTypographyTexture } from './typography';
import { diagnoseSpatialTexture } from './spatial';
import { diagnoseMotionTexture } from './motion';
import { diagnoseMicroDetailTexture } from './microDetail';

export {
  diagnoseSurface,
  diagnoseDepth,
  diagnoseColorTexture,
  diagnoseTypographyTexture,
  diagnoseSpatialTexture,
  diagnoseMotionTexture,
  diagnoseMicroDetailTexture,
};

/**
 * 全维度诊断：根据 ruleId 将 Finding 路由到对应维度的专用诊断器。
 */
export function diagnoseAllVisualTexture(findings: readonly Finding[]): Diagnostic[] {
  const surfaceFindings: Finding[] = [];
  const depthFindings: Finding[] = [];
  const colorFindings: Finding[] = [];
  const typographyFindings: Finding[] = [];
  const spatialFindings: Finding[] = [];
  const motionFindings: Finding[] = [];
  const microFindings: Finding[] = [];

  for (const f of findings) {
    const ruleId = f.evaluation.ruleId;
    if (ruleId.includes('SURFACE')) surfaceFindings.push(f);
    else if (ruleId.includes('DEPTH')) depthFindings.push(f);
    else if (ruleId.includes('COLOR')) colorFindings.push(f);
    else if (ruleId.includes('TYPOGRAPHY')) typographyFindings.push(f);
    else if (ruleId.includes('SPATIAL')) spatialFindings.push(f);
    else if (ruleId.includes('MOTION')) motionFindings.push(f);
    else if (ruleId.includes('MICRO')) microFindings.push(f);
    else surfaceFindings.push(f); // fallback
  }
  return [
    ...diagnoseSurface(surfaceFindings),
    ...diagnoseDepth(depthFindings),
    ...diagnoseColorTexture(colorFindings),
    ...diagnoseTypographyTexture(typographyFindings),
    ...diagnoseSpatialTexture(spatialFindings),
    ...diagnoseMotionTexture(motionFindings),
    ...diagnoseMicroDetailTexture(microFindings),
  ];
}
