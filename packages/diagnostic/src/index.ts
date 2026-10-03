// 诊断引擎
export { DiagnosticEngine } from './engine';

// Finding/Diagnostic ID
export { createDiagnosticId } from './finding/factory';

// 原因分类
export { classifyCause } from './cause/classifier';

// 解释生成
export { generateExplanation } from './explanation/generator';

// Visual Texture 诊断
export {
  diagnoseSurface,
  diagnoseDepth,
  diagnoseColorTexture,
  diagnoseTypographyTexture,
  diagnoseSpatialTexture,
  diagnoseMotionTexture,
  diagnoseMicroDetailTexture,
  diagnoseAllVisualTexture,
} from './visual-texture';
