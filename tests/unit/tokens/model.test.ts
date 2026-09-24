import { describe, expect, it } from 'vitest';
import { TokenAssetError, normalizeDesignToken, normalizeTokenAsset } from '@uiq/tokens';

describe('normalizeDesignToken（AD-14 dialect 双字段投影）', () => {
  it('IMPL09 dialect：type=层级，valueType 显式补充', () => {
    const token = normalizeDesignToken(
      {
        id: 'color.blue.600',
        name: 'Blue 600',
        type: 'PRIMITIVE',
        valueType: 'COLOR',
        value: '#2563EB',
      },
      'IMPL09',
    );
    expect(token).toMatchObject({
      id: 'color.blue.600',
      layer: 'PRIMITIVE',
      valueType: 'COLOR',
      value: '#2563EB',
    });
  });

  it('TK01 dialect：type=值类别，layer 显式补充', () => {
    const token = normalizeDesignToken(
      {
        id: 'color.action.primary',
        name: 'Action Primary',
        type: 'COLOR',
        layer: 'SEMANTIC',
        reference: 'color.blue.600',
      },
      'TK01',
    );
    expect(token).toMatchObject({
      layer: 'SEMANTIC',
      valueType: 'COLOR',
      reference: 'color.blue.600',
    });
  });

  it('TK01 缺 layer → LAYER_MISSING（不按引用关系推测，AD-14）', () => {
    expect(() =>
      normalizeDesignToken({ id: 'a', name: 'A', type: 'COLOR', reference: 'b' }, 'TK01'),
    ).toThrowError(TokenAssetError);
    try {
      normalizeDesignToken({ id: 'a', name: 'A', type: 'COLOR', reference: 'b' }, 'TK01');
    } catch (e) {
      expect((e as TokenAssetError).code).toBe('LAYER_MISSING');
    }
  });

  it('IMPL09 缺 valueType → VALUE_TYPE_MISSING', () => {
    expect(() =>
      normalizeDesignToken({ id: 'a', name: 'A', type: 'SEMANTIC', reference: 'b' }, 'IMPL09'),
    ).toThrowError(TokenAssetError);
  });

  it('无 value 也无 reference → TOKEN_INVALID', () => {
    expect(() =>
      normalizeDesignToken({ id: 'a', name: 'A', type: 'PRIMITIVE', valueType: 'COLOR' }, 'IMPL09'),
    ).toThrowError(TokenAssetError);
  });

  it('TK01 的 type 不是值类别 → VALUE_TYPE_MISSING', () => {
    expect(() =>
      normalizeDesignToken(
        { id: 'a', name: 'A', type: 'PRIMITIVE', layer: 'SEMANTIC', reference: 'b' },
        'TK01',
      ),
    ).toThrowError(TokenAssetError);
  });
});

describe('normalizeTokenAsset', () => {
  it('完整资产归一化', () => {
    const asset = normalizeTokenAsset({
      assetId: 'ds-core',
      version: '1.0.0',
      dialect: 'IMPL09',
      tokens: [
        { id: 'p.1', name: 'P1', type: 'PRIMITIVE', valueType: 'COLOR', value: '#2563EB' },
        { id: 's.1', name: 'S1', type: 'SEMANTIC', valueType: 'COLOR', reference: 'p.1' },
      ],
    });
    expect(asset.tokens).toHaveLength(2);
    expect(asset.tokens[1]?.layer).toBe('SEMANTIC');
  });

  it('重复 token id → DUPLICATE_TOKEN_ID', () => {
    expect(() =>
      normalizeTokenAsset({
        assetId: 'a',
        version: '1.0.0',
        dialect: 'IMPL09',
        tokens: [
          { id: 'x', name: 'X', type: 'PRIMITIVE', valueType: 'COLOR', value: 1 },
          { id: 'x', name: 'X2', type: 'PRIMITIVE', valueType: 'SIZE', value: 2 },
        ],
      }),
    ).toThrowError(TokenAssetError);
  });

  it('dialect 缺失或非法 → ASSET_INVALID', () => {
    expect(() => normalizeTokenAsset({ assetId: 'a', version: '1.0.0', tokens: [] })).toThrowError(
      TokenAssetError,
    );
    expect(() =>
      normalizeTokenAsset({
        assetId: 'a',
        version: '1.0.0',
        dialect: 'W3C',
        tokens: [{ id: 'x', name: 'X', type: 'PRIMITIVE', valueType: 'COLOR', value: 1 }],
      }),
    ).toThrowError(TokenAssetError);
  });

  it('tokens 为空数组 → ASSET_INVALID', () => {
    expect(() =>
      normalizeTokenAsset({ assetId: 'a', version: '1.0.0', dialect: 'IMPL09', tokens: [] }),
    ).toThrowError(TokenAssetError);
  });
});
