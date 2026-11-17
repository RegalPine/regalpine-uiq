# UIQ Diagnostics

Diagnostics explain Findings.

## Principle

Diagnostic != Evaluation

Diagnostic != Recommendation

## Evidence Graph

DOM
↓
Measurement
↓
Metric
↓
Rule
↓
Evaluation
↓
Finding
↓
Diagnostic

## Root Cause

Possible causes:

- MEASUREMENT
- METRIC
- TOKEN
- COMPONENT
- THEME
- CONFIGURATION
- UNKNOWN

## Confidence

- DIRECT
- SUPPORTED
- INFERRED
- UNKNOWN

Do not invent a root cause when evidence is insufficient.

## Visual Texture Diagnostics

7 specialized diagnostics trace findings to root causes:

| Diagnostic | Dimension | Key Causes |
|-----------|-----------|------------|
| diagnoseSurface | Surface | CONFIGURATION |
| diagnoseDepth | Depth | THEME, CONFIGURATION |
| diagnoseColorTexture | Color | TOKEN, THEME, CONFIGURATION |
| diagnoseTypographyTexture | Typography | TOKEN, CONFIGURATION |
| diagnoseSpatialTexture | Spatial | TOKEN, CONFIGURATION |
| diagnoseMotionTexture | Motion | TOKEN, CONFIGURATION |
| diagnoseMicroDetailTexture | Micro Detail | COMPONENT, CONFIGURATION |
