import {
  PrototypeSpec,
  PrototypeSpecV2,
  PrototypeV2Element,
  PrototypeValidationWarning,
  isPrototypeSpecV2,
} from './prototype-spec';
import { isPrototypeAssetRef } from './prototype-assets';

function hexToRgb(hex?: string): [number, number, number] | null {
  if (!hex || !/^#([0-9a-fA-F]{6})$/.test(hex)) return null;
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function luminance([r, g, b]: [number, number, number]) {
  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrastRatio(foreground?: string, background?: string): number | null {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return null;
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

function intersects(a: PrototypeV2Element, b: PrototypeV2Element) {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const overlapArea = overlapX * overlapY;
  const minArea = Math.min(a.width * a.height, b.width * b.height);
  return minArea > 0 && overlapArea / minArea > 0.42;
}

function flatten(elements: PrototypeV2Element[]): PrototypeV2Element[] {
  return elements.flatMap((element) => [element, ...(element.children ? flatten(element.children) : [])]);
}

export function validatePrototypeSpecForPreview(spec: PrototypeSpec): PrototypeValidationWarning[] {
  if (!isPrototypeSpecV2(spec)) return [];
  return validatePrototypeSpecV2(spec);
}

export function validatePrototypeSpecV2(spec: PrototypeSpecV2): PrototypeValidationWarning[] {
  const warnings: PrototypeValidationWarning[] = [];

  for (const frame of spec.frames) {
    const elements = flatten(frame.elements);
    for (const element of elements) {
      if (element.x + element.width > frame.width || element.y + element.height > frame.height) {
        warnings.push({
          severity: 'error',
          code: 'out-of-bounds',
          message: '元素超出画布边界，已在 normalize 阶段尝试收敛。',
          elementName: element.name,
        });
      }

      if (element.assetRef && !isPrototypeAssetRef(element.assetRef)) {
        warnings.push({
          severity: 'warning',
          code: 'missing-asset',
          message: '资产引用不存在，将使用默认安全资产替代。',
          elementName: element.name,
        });
      }

      if ((element.type === 'text' || element.text) && element.width < 48) {
        warnings.push({
          severity: 'warning',
          code: 'narrow-text',
          message: '文本容器过窄，可能产生裁切。',
          elementName: element.name,
        });
      }

      const ratio = contrastRatio(element.color, element.background);
      if (ratio !== null && ratio < 3) {
        warnings.push({
          severity: 'warning',
          code: 'low-contrast',
          message: '文字与背景对比度偏低。',
          elementName: element.name,
        });
      }
    }

    const majorElements = elements.filter((element) => !['background', 'divider'].includes(element.type));
    for (let i = 0; i < majorElements.length; i += 1) {
      for (let j = i + 1; j < majorElements.length; j += 1) {
        const a = majorElements[i];
        const b = majorElements[j];
        if ((a.zIndex || 0) !== (b.zIndex || 0)) continue;
        if (intersects(a, b)) {
          warnings.push({
            severity: 'warning',
            code: 'overlap',
            message: `元素与「${b.name}」存在明显重叠。`,
            elementName: a.name,
          });
        }
      }
    }
  }

  return warnings.slice(0, 40);
}

export function attachPrototypeValidation(spec: PrototypeSpec): PrototypeSpec {
  if (!isPrototypeSpecV2(spec)) return spec;
  const warnings = validatePrototypeSpecV2(spec);
  return {
    ...spec,
    frames: spec.frames.map((frame) => ({
      ...frame,
      validation: warnings.filter((warning) =>
        frame.elements.some((element) => element.name === warning.elementName || element.children?.some((child) => child.name === warning.elementName))
      ),
    })),
  };
}
