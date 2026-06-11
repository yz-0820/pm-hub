'use client';

import type { CSSProperties } from 'react';
import {
  PrototypeElement,
  PrototypeFrame,
  PrototypeSpec,
  PrototypeV2Element,
  PrototypeV2Frame,
  PrototypeValidationWarning,
  isPrototypeSpecV2,
} from '@/lib/tools/prototype-spec';
import { getIconGlyph, getPrototypeTheme } from '@/lib/tools/prototype-design-system';
import { getPrototypeAsset } from '@/lib/tools/prototype-assets';
import { validatePrototypeSpecForPreview } from '@/lib/tools/prototype-validator';
import { cn } from '@/lib/utils';

function baseStyle(element: PrototypeElement): CSSProperties {
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    color: element.color,
    backgroundColor: element.background,
    borderColor: element.borderColor,
    fontSize: element.fontSize,
  };
}

function renderItems(items?: string[]) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-start gap-2 text-xs text-slate-600">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="line-clamp-1">{item}</span>
        </div>
      ))}
    </div>
  );
}

function PrototypeElementV1View({ element }: { element: PrototypeElement }) {
  const style = baseStyle(element);

  if (element.type === 'text') {
    return (
      <div className="absolute overflow-hidden text-slate-950 leading-snug" style={{ ...style, backgroundColor: undefined, borderColor: undefined }}>
        {element.text}
      </div>
    );
  }

  if (element.type === 'button') {
    return (
      <div className="absolute inline-flex items-center justify-center rounded-xl px-4 text-sm font-medium shadow-sm" style={{ ...style, backgroundColor: element.background || '#2563eb', color: element.color || '#ffffff' }}>
        <span className="line-clamp-1">{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'input') {
    return (
      <div className="absolute flex items-center rounded-xl border bg-white px-4 text-sm text-slate-400" style={{ ...style, borderColor: element.borderColor || '#cbd5e1' }}>
        <span className="line-clamp-1">{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'card' || element.type === 'section' || element.type === 'frame') {
    return (
      <div className="absolute rounded-2xl border p-4 shadow-sm" style={{ ...style, backgroundColor: element.background || '#ffffff', borderColor: element.borderColor || '#e2e8f0' }}>
        <div className="text-sm font-medium text-slate-950 line-clamp-2">{element.text || element.name}</div>
        {renderItems(element.items)}
      </div>
    );
  }

  if (element.type === 'imagePlaceholder') {
    return (
      <div className="absolute flex items-center justify-center rounded-2xl border border-dashed bg-slate-100 text-xs text-slate-500" style={{ ...style, borderColor: element.borderColor || '#cbd5e1' }}>
        {element.text || '图片占位'}
      </div>
    );
  }

  if (element.type === 'list') {
    return (
      <div className="absolute rounded-2xl border bg-white p-4" style={{ ...style, borderColor: element.borderColor || '#e2e8f0' }}>
        <div className="mb-2 text-sm font-medium text-slate-950">{element.text || element.name}</div>
        {renderItems(element.items || ['列表项一', '列表项二', '列表项三'])}
      </div>
    );
  }

  if (element.type === 'tab') {
    return (
      <div className="absolute flex items-center gap-2 rounded-xl bg-slate-100 p-1" style={style}>
        {(element.items || ['选项一', '选项二']).slice(0, 4).map((item, index) => (
          <div key={`${item}-${index}`} className={cn('flex-1 rounded-lg px-3 py-2 text-center text-xs', index === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500')}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (element.type === 'navbar') {
    return (
      <div className="absolute flex items-center justify-between border-b bg-white px-6" style={{ ...style, borderColor: element.borderColor || '#e2e8f0' }}>
        <div className="text-sm font-semibold text-slate-950 line-clamp-1">{element.text || element.name}</div>
        <div className="hidden gap-4 text-xs text-slate-500 sm:flex">
          {(element.items || []).slice(0, 4).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute flex items-center justify-center rounded-lg border border-dashed bg-amber-50 px-2 text-center text-xs text-amber-700" style={style}>
      不支持：{element.type}
    </div>
  );
}

function gradientCss(element: PrototypeV2Element, fallback?: string) {
  if (!element.gradient) return fallback;
  const direction = element.gradient.direction === 'horizontal' ? '90deg' : element.gradient.direction === 'vertical' ? '180deg' : '135deg';
  const stops = [element.gradient.from, element.gradient.via, element.gradient.to].filter(Boolean).join(', ');
  return `linear-gradient(${direction}, ${stops})`;
}

function elementStyle(element: PrototypeV2Element, frame: PrototypeV2Frame): CSSProperties {
  const theme = getPrototypeTheme(frame.theme);
  return {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    color: element.color || theme.colors.text,
    background: gradientCss(element, element.background),
    borderColor: element.borderColor || 'transparent',
    borderRadius: element.radius ?? (element.type === 'button' ? theme.radius.pill : theme.radius.lg),
    boxShadow: theme.shadow[element.shadow || 'none'],
    opacity: element.opacity,
    zIndex: element.zIndex,
    fontSize: element.fontSize,
  };
}

function AssetArt({ element, compact = false }: { element: PrototypeV2Element; compact?: boolean }) {
  const asset = getPrototypeAsset(element.assetRef);
  const icon = getIconGlyph(element.icon || asset.icon);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: compact ? 40 : Math.min(element.width, 104),
        height: compact ? 40 : Math.min(element.width, 104),
        borderRadius: compact ? 999 : element.radius ?? 18,
        background: `linear-gradient(135deg, ${asset.gradient.from}, ${asset.gradient.via || asset.gradient.to}, ${asset.gradient.to})`,
      }}
    >
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/20" />
      <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-black/10" />
      <span className="relative text-2xl font-bold text-white">{icon}</span>
    </div>
  );
}

function V2Children({ element, frame }: { element: PrototypeV2Element; frame: PrototypeV2Frame }) {
  if (!element.children?.length) return null;
  return (
    <>
      {element.children.map((child, index) => (
        <PrototypeElementV2View key={`${child.name}-${index}`} element={child} frame={frame} nested />
      ))}
    </>
  );
}

function PrototypeElementV2View({ element, frame, nested = false }: { element: PrototypeV2Element; frame: PrototypeV2Frame; nested?: boolean }) {
  const theme = getPrototypeTheme(frame.theme);
  const style = elementStyle(element, frame);
  const positionClass = nested ? 'absolute' : 'absolute';

  if (element.type === 'text') {
    return (
      <div className={`${positionClass} overflow-hidden leading-snug`} style={{ ...style, background: undefined, boxShadow: undefined }}>
        <span className={element.fontSize && element.fontSize >= 18 ? 'font-semibold' : ''}>{element.text}</span>
      </div>
    );
  }

  if (element.type === 'icon') {
    return (
      <div className={`${positionClass} flex items-center justify-center font-semibold`} style={style}>
        {getIconGlyph(element.icon)}
      </div>
    );
  }

  if (element.type === 'image' || element.type === 'imagePlaceholder') {
    return (
      <div className={`${positionClass} overflow-hidden border`} style={{ ...style, borderColor: element.borderColor || theme.colors.border }}>
        <AssetArt element={element} />
      </div>
    );
  }

  if (element.type === 'navbar') {
    return (
      <div className={`${positionClass} flex flex-col justify-between border px-4 py-3 backdrop-blur`} style={{ ...style, background: element.background || 'rgba(255,255,255,0.88)', borderColor: element.borderColor || theme.colors.border }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>高保真原型</div>
            <div className="text-xl font-bold leading-tight">{element.text || frame.name}</div>
          </div>
          <AssetArt element={element} compact />
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full border px-3 text-xs" style={{ borderColor: theme.colors.border, color: theme.colors.textMuted, background: theme.colors.surfaceMuted }}>
          <span className="text-base" style={{ color: theme.colors.primary }}>{getIconGlyph(element.icon || 'search')}</span>
          <span>{element.items?.[0] || '搜索内容'}</span>
        </div>
      </div>
    );
  }

  if (element.type === 'hero') {
    return (
      <div className={`${positionClass} overflow-hidden px-5 py-4`} style={style}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <div className="relative flex h-full items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-xs font-semibold text-white/85">{element.items?.[0] || '推荐'}</div>
            <div className="line-clamp-2 text-xl font-bold leading-tight text-white">{element.text}</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold" style={{ color: theme.colors.primaryText }}>
              <span>{getIconGlyph(element.icon || 'play')}</span>
              <span>{element.items?.[1] || '开始'}</span>
            </div>
          </div>
          <AssetArt element={element} />
        </div>
      </div>
    );
  }

  if (element.type === 'button') {
    const compactButton = element.width <= 90 && element.height >= 56;
    return (
      <div className={`${positionClass} flex items-center justify-center gap-2 px-3 text-center font-semibold ${compactButton ? 'flex-col text-[10px]' : 'text-sm'}`} style={style}>
        <span className={compactButton ? 'text-sm leading-none' : ''}>{getIconGlyph(element.icon)}</span>
        <span className={compactButton ? 'line-clamp-1 leading-tight' : 'line-clamp-1'}>{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'section' || element.type === 'frame') {
    return (
      <div
        className={`${positionClass} overflow-visible`}
        style={{ ...style, background: element.background ? style.background : undefined, boxShadow: element.shadow ? style.boxShadow : undefined }}
      >
        <V2Children element={element} frame={frame} />
      </div>
    );
  }

  if (element.type === 'card') {
    const artSize = Math.min(element.width - 18, element.height > 148 ? 92 : 84);
    return (
      <div className={`${positionClass} overflow-hidden border p-2.5`} style={{ ...style, background: element.background || theme.colors.surface, borderColor: element.borderColor || theme.colors.border }}>
        {element.assetRef ? (
          <div style={{ width: artSize, height: artSize }}>
            <AssetArt element={{ ...element, width: artSize, height: artSize }} />
          </div>
        ) : null}
        <div className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight">{element.text || element.name}</div>
        {element.items?.[0] ? <div className="mt-0.5 truncate text-[9px]" style={{ color: theme.colors.textMuted }}>{element.items[0]}</div> : null}
        <V2Children element={element} frame={frame} />
      </div>
    );
  }

  if (element.type === 'list') {
    return (
      <div className={`${positionClass} border p-4`} style={{ ...style, background: element.background || theme.colors.surface, borderColor: element.borderColor || theme.colors.border }}>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-bold">{element.text || element.name}</div>
          <span className="text-xs font-medium" style={{ color: theme.colors.primary }}>实时</span>
        </div>
        <div className="space-y-2">
          {(element.items || []).slice(0, 4).map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-3">
              <span className="w-6 text-sm font-bold" style={{ color: index === 0 ? theme.colors.primary : theme.colors.textMuted }}>{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{item}</span>
              <span className="text-xs" style={{ color: theme.colors.textMuted }}>›</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (element.type === 'mediaPlayer') {
    return (
      <div className={`${positionClass} flex items-center gap-3 px-3`} style={style}>
        <AssetArt element={element} compact />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold">{element.text}</div>
          <div className="truncate text-[10px] text-white/65">{element.items?.[0]}</div>
        </div>
        <span className="text-lg">{getIconGlyph(element.icon || 'pause')}</span>
        <span className="text-xl">{getIconGlyph('next')}</span>
      </div>
    );
  }

  if (element.type === 'bottomNav') {
    const items = element.items?.length ? element.items : ['首页', '发现', '工具', '我的'];
    const icons = ['home', 'search', 'music', 'user'];
    return (
      <div className={`${positionClass} flex items-center justify-around border-t px-4`} style={{ ...style, borderRadius: 0, borderColor: theme.colors.border, background: element.background || theme.colors.surface }}>
        {items.slice(0, 5).map((item, index) => (
          <div key={`${item}-${index}`} className="flex flex-col items-center gap-1 text-[10px]" style={{ color: index === 0 ? theme.colors.primary : theme.colors.textMuted }}>
            <span className="text-lg">{getIconGlyph(icons[index])}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  }

  if (element.type === 'badge' || element.type === 'stat') {
    return (
      <div className={`${positionClass} flex items-center gap-2 px-4 text-xs font-semibold`} style={style}>
        <span>{getIconGlyph(element.icon)}</span>
        <span className="line-clamp-1">{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'divider') {
    return <div className={positionClass} style={{ ...style, height: Math.max(1, element.height), background: element.background || theme.colors.border }} />;
  }

  return (
    <div className={`${positionClass} border p-4`} style={{ ...style, background: element.background || theme.colors.surface, borderColor: element.borderColor || theme.colors.border }}>
      <div className="text-sm font-semibold">{element.text || element.name}</div>
      {renderItems(element.items)}
      <V2Children element={element} frame={frame} />
    </div>
  );
}

function ValidationWarnings({ warnings }: { warnings?: PrototypeValidationWarning[] }) {
  if (!warnings?.length) return null;
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      <div className="mb-1 font-semibold">自动校验提示</div>
      <ul className="space-y-1">
        {warnings.slice(0, 5).map((warning, index) => (
          <li key={`${warning.code}-${index}`}>
            [{warning.severity}] {warning.elementName ? `${warning.elementName}: ` : ''}
            {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrototypeFrameV1View({ frame }: { frame: PrototypeFrame }) {
  const previewScale = frame.width > 900 ? 0.55 : 1;
  return (
    <div className="mx-auto overflow-visible" style={{ width: frame.width * previewScale, height: frame.height * previewScale }}>
      <div className="relative origin-top-left overflow-hidden rounded-[28px] border bg-slate-50 shadow-sm" style={{ width: frame.width, height: frame.height, transform: `scale(${previewScale})` }}>
        {frame.elements.map((element, index) => (
          <PrototypeElementV1View key={`${element.name}-${index}`} element={element} />
        ))}
      </div>
    </div>
  );
}

function PrototypeFrameV2View({ frame }: { frame: PrototypeV2Frame }) {
  const previewScale = frame.width > 900 ? 0.55 : 1;
  const theme = getPrototypeTheme(frame.theme);
  const background = frame.background?.gradient
    ? `linear-gradient(${frame.background.gradient.direction === 'vertical' ? '180deg' : '135deg'}, ${[frame.background.gradient.from, frame.background.gradient.via, frame.background.gradient.to].filter(Boolean).join(', ')})`
    : frame.background?.color || theme.colors.background;

  return (
    <div className="mx-auto overflow-visible" style={{ width: frame.width * previewScale, height: frame.height * previewScale }}>
      <div
        className="relative origin-top-left overflow-hidden border shadow-sm"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `scale(${previewScale})`,
          borderRadius: frame.width < 500 ? 32 : 24,
          background,
          color: theme.colors.text,
          borderColor: theme.colors.border,
        }}
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20" style={{ background: theme.colors.primary }} />
        <div className="absolute -left-20 top-32 h-56 w-56 rounded-full opacity-10" style={{ background: theme.colors.accent }} />
        {frame.elements.map((element, index) => (
          <PrototypeElementV2View key={`${element.name}-${index}`} element={element} frame={frame} />
        ))}
      </div>
    </div>
  );
}

export function PrototypePreview({ spec }: { spec: PrototypeSpec }) {
  const frame = spec.frames[0];
  if (!frame) {
    return <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">暂无可预览的原型页面</div>;
  }

  const isV2 = isPrototypeSpecV2(spec);
  const warnings = isV2 ? validatePrototypeSpecForPreview(spec) : [];

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{frame.name}</div>
          <div className="text-xs text-muted-foreground">
            {frame.width} x {frame.height} {isV2 ? `· ${spec.frames[0]?.theme || 'brand'} · v2` : '· v1'}
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{spec.platform}</span>
      </div>
      <ValidationWarnings warnings={warnings} />
      <div className="max-h-[760px] overflow-auto rounded-lg bg-muted/40 p-4">
        {isV2 ? <PrototypeFrameV2View frame={frame as PrototypeV2Frame} /> : <PrototypeFrameV1View frame={frame as PrototypeFrame} />}
      </div>
    </div>
  );
}
