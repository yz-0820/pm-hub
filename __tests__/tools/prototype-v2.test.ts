import { describe, expect, it } from 'vitest';
import { generatePrototypeFromInput } from '@/lib/tools/prototype-generator-v2';
import { isPrototypeAssetRef } from '@/lib/tools/prototype-assets';
import { selectPrototypeTemplate } from '@/lib/tools/prototype-templates';
import { createPrototypeInputSchema, validatePrototypeSpec } from '@/lib/tools/prototype-spec';
import { validatePrototypeSpecV2 } from '@/lib/tools/prototype-validator';

describe('prototype spec v2', () => {
  it('validates legacy v1 specs and high fidelity v2 specs', () => {
    const v1 = validatePrototypeSpec({
      version: '1.0',
      specId: 'proto_v1',
      name: 'Legacy',
      platform: 'mobile',
      canvas: { width: 390, height: 844 },
      frames: [
        {
          name: 'Legacy frame',
          width: 390,
          height: 844,
          elements: [{ type: 'text', name: 'Title', text: 'Hello', x: 24, y: 24, width: 120, height: 32 }],
        },
      ],
    });

    const v2 = validatePrototypeSpec({
      version: '2.0',
      specId: 'proto_v2',
      name: 'High Fidelity',
      platform: 'mobile',
      canvas: { width: 390, height: 844 },
      frames: [
        {
          name: 'Home',
          width: 390,
          height: 844,
          theme: 'brand',
          templateId: 'mobile-home',
          elements: [
            {
              type: 'hero',
              name: 'Hero',
              text: 'Main value',
              x: 24,
              y: 120,
              width: 342,
              height: 140,
              gradient: { from: '#13d78a', to: '#1ba5ff' },
              assetRef: 'cover.green-wave',
              shadow: 'glow',
            },
          ],
        },
      ],
    });

    expect(v1.version).toBe('1.0');
    expect(v2.version).toBe('2.0');
  });

  it('selects media template for music-oriented input', () => {
    const template = selectPrototypeTemplate({
      pageType: '首页',
      productContext: '音乐 App',
      keyContent: '歌单、播放器、排行榜',
      instructions: '类似腾讯音乐',
    });

    expect(template.id).toBe('mobile-media');
  });

  it('knows safe built-in assets', () => {
    expect(isPrototypeAssetRef('cover.green-wave')).toBe(true);
    expect(isPrototypeAssetRef('https://example.com/image.png')).toBe(false);
  });

  it('flags invalid asset references and narrow text containers', () => {
    const warnings = validatePrototypeSpecV2({
      version: '2.0',
      specId: 'proto_warn',
      name: 'Warn',
      platform: 'mobile',
      canvas: { width: 390, height: 844 },
      designSystemVersion: 'pmhub-prototype-v2',
      frames: [
        {
          name: 'Frame',
          width: 390,
          height: 844,
          theme: 'brand',
          elements: [
            {
              type: 'text',
              name: 'Tiny Text',
              text: 'Too narrow',
              x: 24,
              y: 24,
              width: 32,
              height: 24,
              assetRef: 'missing',
            },
          ],
        },
      ],
    });

    expect(warnings.some((warning) => warning.code === 'missing-asset')).toBe(true);
    expect(warnings.some((warning) => warning.code === 'narrow-text')).toBe(true);
  });

  it('generates v2 fallback without API credentials', async () => {
    const output = await generatePrototypeFromInput({
      mode: 'create',
      name: '音乐 App 首页',
      platform: 'mobile',
      pageType: '音乐/媒体页',
      productContext: '面向年轻用户的音乐播放产品',
      targetUser: '经常听歌的年轻用户',
      pageGoal: '提升推荐内容点击和播放转化',
      keyContent: '搜索、推荐横幅、快捷入口、歌单卡片、排行榜、底部播放器',
      instructions: '绿色品牌感，高保真移动端页面',
      hasReferenceImage: false,
    });

    expect(output.prototypeSpec.version).toBe('2.0');
    if (output.prototypeSpec.version !== '2.0') throw new Error('Expected v2 output');
    expect(output.prototypeSpec.frames[0]?.templateId).toBe('mobile-media');
    expect(output.prototypeSpec.frames[0]?.elements.some((element) => element.type === 'mediaPlayer')).toBe(true);
  });

  it('accepts a single required page description for create input', async () => {
    const parsed = createPrototypeInputSchema.parse({
      mode: 'create',
      instructions: '生成一个会员续费提醒移动端页面，包含到期提示、权益对比、优惠说明和一键续费按钮。',
    });

    expect(parsed.platform).toBe('mobile');
    expect(parsed.pageType).toBe('首页');
    expect(parsed.name).toBe('');

    const output = await generatePrototypeFromInput(parsed);
    expect(output.prototypeSpec.version).toBe('2.0');
    expect(output.prototypeSpec.name).toContain('会员续费提醒');
  });
});
