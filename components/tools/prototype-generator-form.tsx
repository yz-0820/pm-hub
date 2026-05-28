'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Image as ImageIcon, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ApiResponse =
  | {
      success: true;
      data: {
        imageDataUrl: string;
        model: string;
      };
    }
  | {
      success: false;
      error: string;
      details?: string;
    };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function fileToPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

function splitPromptItems(prompt: string): string[] {
  const items = prompt
    .split(/\r?\n|[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : [prompt.trim()];
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';

  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const imageElement = new window.Image();
    imageElement.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imageElement);
    };
    imageElement.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败'));
    };
    imageElement.src = url;
  });
}

async function generateAnnotatedPrototypeImage(file: File, prompt: string): Promise<string> {
  const source = await loadImageElement(file);
  const maxSourceWidth = 1080;
  const scale = Math.min(1, maxSourceWidth / source.naturalWidth);
  const imageWidth = Math.max(1, Math.round(source.naturalWidth * scale));
  const imageHeight = Math.max(1, Math.round(source.naturalHeight * scale));
  const panelWidth = 420;
  const canvasWidth = imageWidth + panelWidth;
  const canvasHeight = Math.max(imageHeight, 720);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持 Canvas');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(source, 0, 0, imageWidth, imageHeight);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(imageWidth, 0, panelWidth, canvasHeight);
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(imageWidth, 0);
  ctx.lineTo(imageWidth, canvasHeight);
  ctx.stroke();

  const panelX = imageWidth + 28;
  const contentWidth = panelWidth - 56;
  let y = 44;

  ctx.fillStyle = '#1d4ed8';
  ctx.font = '700 26px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.fillText('原型修改标注', panelX, y);
  y += 34;

  ctx.fillStyle = '#64748b';
  ctx.font = '14px "Microsoft YaHei", "Segoe UI", sans-serif';
  ctx.fillText('免费模式：基于原图叠加修改说明', panelX, y);
  y += 44;

  const items = splitPromptItems(prompt);
  ctx.font = '16px "Microsoft YaHei", "Segoe UI", sans-serif';

  for (let index = 0; index < items.length; index += 1) {
    const badgeY = y - 18;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(panelX, badgeY, 28, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillText(String(index + 1), panelX + 9, badgeY + 19);

    ctx.fillStyle = '#0f172a';
    ctx.font = '16px "Microsoft YaHei", "Segoe UI", sans-serif';
    const lines = wrapCanvasText(ctx, items[index], contentWidth - 44);
    let textY = y;
    for (const line of lines) {
      ctx.fillText(line, panelX + 42, textY);
      textY += 24;
    }
    y = textY + 18;

    if (y > canvasHeight - 56) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Microsoft YaHei", "Segoe UI", sans-serif';
      ctx.fillText('更多修改说明请查看输入内容。', panelX, canvasHeight - 32);
      break;
    }
  }

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, imageWidth - 20, imageHeight - 20);

  return canvas.toDataURL('image/png');
}

export function PrototypeGeneratorForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const canSubmit = useMemo(() => Boolean(image && prompt.trim() && !isGenerating), [image, prompt, isGenerating]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatusText('仅支持 PNG、JPG、JPEG、WEBP 图片');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setStatusText('图片不能超过 10MB');
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(file);
    setPreviewUrl(fileToPreviewUrl(file));
    setResultUrl('');
    setStatusText('');
  };

  const handleClearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(null);
    setPreviewUrl('');
    setResultUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!image) {
      setStatusText('请先上传一张图片');
      return;
    }
    if (!prompt.trim()) {
      setStatusText('请填写需要修改的内容');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt.trim());

    setIsGenerating(true);
    setStatusText('正在生成原型图');
    setResultUrl('');

    try {
      const res = await fetch('/api/tools/prototype', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as ApiResponse;

      if (data.success) {
        setResultUrl(data.data.imageDataUrl);
        setStatusText(`已生成，模型：${data.data.model}`);
      } else {
        const fallbackUrl = await generateAnnotatedPrototypeImage(image, prompt.trim());
        setResultUrl(fallbackUrl);
        setStatusText('已生成免费标注版原型图');
      }
    } catch {
      try {
        const fallbackUrl = await generateAnnotatedPrototypeImage(image, prompt.trim());
        setResultUrl(fallbackUrl);
        setStatusText('已生成免费标注版原型图');
      } catch {
        setStatusText('原型图生成失败，请稍后重试');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!resultUrl) return;
    const anchor = document.createElement('a');
    anchor.href = resultUrl;
    anchor.download = 'prototype.png';
    anchor.click();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <section className="xl:col-span-2 rounded-lg border bg-card/70 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">原型信息</h2>
            <p className="text-xs text-muted-foreground">上传图片并描述要修改的位置和内容</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-sm font-medium mb-2">上传图片 *</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="rounded-lg border bg-background overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={previewUrl} alt="上传的原型图" className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute right-3 top-3 h-8 w-8 rounded-md bg-background/90 border shadow-sm inline-flex items-center justify-center hover:bg-background"
                    aria-label="移除图片"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{image?.name}</div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full aspect-[4/3] rounded-lg border border-dashed bg-background/60',
                  'flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors'
                )}
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">选择图片</span>
                <span className="text-xs">支持 PNG、JPG、JPEG、WEBP，最大 10MB</span>
              </button>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium">修改说明 *</span>
            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setResultUrl('');
              }}
              placeholder="例如：把顶部按钮改成蓝色；把右侧表单区域改成两列布局；把卡片标题改为更醒目的样式"
              className="mt-2 w-full min-h-40 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground min-h-4">{statusText}</p>
            <Button onClick={handleGenerate} disabled={!canSubmit}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成原型图
            </Button>
          </div>
        </div>
      </section>

      <section className="xl:col-span-3 rounded-lg border bg-card/70 p-5 min-h-[720px] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">生成结果</h2>
          <Button variant="outline" onClick={handleSave} disabled={!resultUrl}>
            <Download className="h-4 w-4" />
            保存
          </Button>
        </div>

        {resultUrl ? (
          <div className="flex-1 min-h-[600px] rounded-lg border bg-background p-3 flex items-center justify-center">
            <img src={resultUrl} alt="生成后的原型图" className="max-h-full max-w-full object-contain rounded-md" />
          </div>
        ) : (
          <div className="flex-1 min-h-[600px] rounded-lg border border-dashed bg-background/60 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
            生成后的原型图会显示在这里，可保存到本地。
          </div>
        )}
      </section>
    </div>
  );
}
