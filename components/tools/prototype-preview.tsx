'use client';

import type { CSSProperties } from 'react';
import { PrototypeElement, PrototypeFrame, PrototypeSpec } from '@/lib/tools/prototype-spec';
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

function PrototypeElementView({ element }: { element: PrototypeElement }) {
  const style = baseStyle(element);

  if (element.type === 'text') {
    return (
      <div
        className="absolute overflow-hidden text-slate-950 leading-snug"
        style={{ ...style, backgroundColor: undefined, borderColor: undefined }}
      >
        {element.text}
      </div>
    );
  }

  if (element.type === 'button') {
    return (
      <div
        className="absolute inline-flex items-center justify-center rounded-xl px-4 text-sm font-medium shadow-sm"
        style={{ ...style, backgroundColor: element.background || '#2563eb', color: element.color || '#ffffff' }}
      >
        <span className="line-clamp-1">{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'input') {
    return (
      <div
        className="absolute flex items-center rounded-xl border bg-white px-4 text-sm text-slate-400"
        style={{ ...style, borderColor: element.borderColor || '#cbd5e1' }}
      >
        <span className="line-clamp-1">{element.text || element.name}</span>
      </div>
    );
  }

  if (element.type === 'card' || element.type === 'section' || element.type === 'frame') {
    return (
      <div
        className="absolute rounded-2xl border p-4 shadow-sm"
        style={{ ...style, backgroundColor: element.background || '#ffffff', borderColor: element.borderColor || '#e2e8f0' }}
      >
        <div className="text-sm font-medium text-slate-950 line-clamp-2">{element.text || element.name}</div>
        {renderItems(element.items)}
      </div>
    );
  }

  if (element.type === 'imagePlaceholder') {
    return (
      <div
        className="absolute flex items-center justify-center rounded-2xl border border-dashed bg-slate-100 text-xs text-slate-500"
        style={{ ...style, borderColor: element.borderColor || '#cbd5e1' }}
      >
        {element.text || '图片占位'}
      </div>
    );
  }

  if (element.type === 'list') {
    return (
      <div
        className="absolute rounded-2xl border bg-white p-4"
        style={{ ...style, borderColor: element.borderColor || '#e2e8f0' }}
      >
        <div className="mb-2 text-sm font-medium text-slate-950">{element.text || element.name}</div>
        {renderItems(element.items || ['列表项一', '列表项二', '列表项三'])}
      </div>
    );
  }

  if (element.type === 'tab') {
    return (
      <div className="absolute flex items-center gap-2 rounded-xl bg-slate-100 p-1" style={style}>
        {(element.items || ['选项一', '选项二']).slice(0, 4).map((item, index) => (
          <div
            key={`${item}-${index}`}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-center text-xs',
              index === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            )}
          >
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (element.type === 'navbar') {
    return (
      <div
        className="absolute flex items-center justify-between border-b bg-white px-6"
        style={{ ...style, borderColor: element.borderColor || '#e2e8f0' }}
      >
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
    <div
      className="absolute flex items-center justify-center rounded-lg border border-dashed bg-amber-50 px-2 text-center text-xs text-amber-700"
      style={style}
    >
      不支持：{element.type}
    </div>
  );
}

function PrototypeFrameView({ frame }: { frame: PrototypeFrame }) {
  const previewScale = frame.width > 900 ? 0.55 : 1;
  return (
    <div
      className="mx-auto overflow-visible"
      style={{ width: frame.width * previewScale, height: frame.height * previewScale }}
    >
      <div
        className="relative origin-top-left overflow-hidden rounded-[28px] border bg-slate-50 shadow-sm"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `scale(${previewScale})`,
        }}
      >
        {frame.elements.map((element, index) => (
          <PrototypeElementView key={`${element.name}-${index}`} element={element} />
        ))}
      </div>
    </div>
  );
}

export function PrototypePreview({ spec }: { spec: PrototypeSpec }) {
  const frame = spec.frames[0];
  if (!frame) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        暂无可预览的原型页面
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{frame.name}</div>
          <div className="text-xs text-muted-foreground">
            {frame.width} x {frame.height}
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{spec.platform}</span>
      </div>
      <div className="max-h-[760px] overflow-auto rounded-lg bg-muted/40 p-4">
        <PrototypeFrameView frame={frame} />
      </div>
    </div>
  );
}
