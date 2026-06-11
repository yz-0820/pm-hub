'use client';

/* eslint-disable @next/next/no-img-element -- local object URL preview cannot use next/image optimization */
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Check, Clipboard, Loader2, RefreshCw, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrototypePlatform, PrototypeSpec } from '@/lib/tools/prototype-spec';
import { cn } from '@/lib/utils';
import { PrototypePreview } from './prototype-preview';

type StoredPrototype = {
  specId: string;
  parentSpecId: string | null;
  version: number;
  importCode: string;
  expiresAt: number;
  summary: string;
  model: string;
  usedAI: boolean;
  prototypeSpec: PrototypeSpec;
};

type ApiResponse =
  | {
      success: true;
      data: StoredPrototype;
    }
  | {
      success: false;
      error: string;
      details?: string;
    };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const platformOptions: Array<{ value: PrototypePlatform; label: string }> = [
  { value: 'mobile', label: '移动端' },
  { value: 'web', label: 'Web' },
  { value: 'miniprogram', label: '小程序' },
  { value: 'responsive', label: '响应式' },
];

const pageTypes = ['首页', '详情页', '列表页', '表单页', 'Dashboard', '会员/订阅页', '内容流', '音乐/媒体页', '其他'];

function formatExpiresAt(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PrototypeGeneratorForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<PrototypePlatform>('mobile');
  const [pageType, setPageType] = useState('首页');
  const [productContext, setProductContext] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [pageGoal, setPageGoal] = useState('');
  const [keyContent, setKeyContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const [versions, setVersions] = useState<StoredPrototype[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find((item) => item.specId === selectedSpecId) || versions[versions.length - 1] || null,
    [selectedSpecId, versions]
  );

  const validationCount = selectedVersion?.prototypeSpec.version === '2.0'
    ? selectedVersion.prototypeSpec.frames.reduce((sum, frame) => sum + (frame.validation?.length || 0), 0)
    : 0;

  const canCreate = Boolean(
    name.trim() &&
      productContext.trim() &&
      targetUser.trim() &&
      pageGoal.trim() &&
      keyContent.trim() &&
      instructions.trim() &&
      !isGenerating
  );

  const canRevise = Boolean(selectedVersion && revisionInstruction.trim() && !isGenerating);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatusText('参考图仅支持 PNG、JPG、JPEG、WEBP');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setStatusText('参考图不能超过 10MB');
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setReferenceImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatusText('');
  };

  const handleClearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setReferenceImage(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pushVersion = (version: StoredPrototype) => {
    setVersions((current) => [...current, version]);
    setSelectedSpecId(version.specId);
  };

  const handleCreate = async () => {
    if (!canCreate) {
      setStatusText('请先填写必填信息');
      return;
    }

    const formData = new FormData();
    formData.append('mode', 'create');
    formData.append('name', name.trim());
    formData.append('platform', platform);
    formData.append('pageType', pageType);
    formData.append('productContext', productContext.trim());
    formData.append('targetUser', targetUser.trim());
    formData.append('pageGoal', pageGoal.trim());
    formData.append('keyContent', keyContent.trim());
    formData.append('instructions', instructions.trim());
    if (referenceImage) formData.append('referenceImage', referenceImage);

    setIsGenerating(true);
    setStatusText('正在生成高保真原型结构');
    setCopied(false);

    try {
      const res = await fetch('/api/tools/prototype', { method: 'POST', body: formData });
      const data = (await res.json()) as ApiResponse;
      if (!data.success) throw new Error(data.error);
      setVersions([data.data]);
      setSelectedSpecId(data.data.specId);
      setStatusText(data.data.usedAI ? `已生成，模型：${data.data.model}` : '已生成本地高保真基础版');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : '原型生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevise = async () => {
    if (!selectedVersion || !revisionInstruction.trim()) return;

    setIsGenerating(true);
    setStatusText('正在基于上一版生成新版本');
    setCopied(false);

    try {
      const res = await fetch('/api/tools/prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'revise',
          baseSpecId: selectedVersion.specId,
          revisionInstruction: revisionInstruction.trim(),
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!data.success) throw new Error(data.error);
      pushVersion(data.data);
      setRevisionInstruction('');
      setStatusText(data.data.usedAI ? `已生成 V${data.data.version}，模型：${data.data.model}` : `已生成 V${data.data.version} 本地基础版`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : '继续修改失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!selectedVersion) return;
    await navigator.clipboard.writeText(selectedVersion.importCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <section className="xl:col-span-2 rounded-lg border bg-card/70 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">原型信息</h2>
            <p className="text-xs text-muted-foreground">填写页面需求，生成高保真预览和 Figma 可编辑图层。</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">原型名称 *</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：音乐 App 首页"
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">平台类型 *</span>
              <select value={platform} onChange={(event) => setPlatform(event.target.value as PrototypePlatform)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {platformOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">页面类型 *</span>
              <select value={pageType} onChange={(event) => setPageType(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {pageTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">产品背景 *</span>
            <textarea value={productContext} onChange={(event) => setProductContext(event.target.value)} placeholder="描述产品、业务场景和当前问题" className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">目标用户 *</span>
            <input value={targetUser} onChange={(event) => setTargetUser(event.target.value)} placeholder="例如：经常听歌的年轻用户" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">页面目标 *</span>
            <input value={pageGoal} onChange={(event) => setPageGoal(event.target.value)} placeholder="例如：提升推荐内容点击和播放转化" className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">关键模块 *</span>
            <textarea value={keyContent} onChange={(event) => setKeyContent(event.target.value)} placeholder="例如：搜索、推荐横幅、快捷入口、歌单卡片、排行榜、底部播放器" className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">生成说明 *</span>
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="例如：做成类似音乐 App 的高保真移动端页面，绿色品牌感，视觉要丰富但信息清晰" className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed" />
          </label>

          <div>
            <div className="text-sm font-medium mb-2">参考图（可选）</div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
            {previewUrl ? (
              <div className="rounded-lg border bg-background overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={previewUrl} alt="参考图" className="h-full w-full object-contain" />
                  <button type="button" onClick={handleClearImage} className="absolute right-3 top-3 h-8 w-8 rounded-md bg-background/90 border shadow-sm inline-flex items-center justify-center hover:bg-background" aria-label="移除参考图">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{referenceImage?.name}</div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className={cn('w-full rounded-lg border border-dashed bg-background/60 py-8', 'flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors')}>
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">上传参考图</span>
                <span className="text-xs">支持 PNG、JPG、JPEG、WEBP，最大 10MB</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground min-h-4">{statusText}</p>
            <Button onClick={handleCreate} disabled={!canCreate}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成原型
            </Button>
          </div>
        </div>
      </section>

      <section className="xl:col-span-3 rounded-lg border bg-card/70 p-5 min-h-[720px] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">原型预览</h2>
            <p className="text-xs text-muted-foreground">网页内高保真预览；复制导入码到 Figma 插件后生成可编辑图层。</p>
          </div>
          {versions.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-2">
              {versions.map((item) => (
                <button key={item.specId} type="button" onClick={() => setSelectedSpecId(item.specId)} className={cn('rounded-full border px-3 py-1 text-xs transition-colors', selectedVersion?.specId === item.specId ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}>
                  V{item.version}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedVersion ? (
          <div className="space-y-5">
            <PrototypePreview spec={selectedVersion.prototypeSpec} />

            <div className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold">Figma 导入信息</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedVersion.summary}</p>
                  {validationCount ? <p className="mt-1 text-xs text-amber-600">自动校验发现 {validationCount} 条提示，导入前可先检查预览。</p> : null}
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{formatExpiresAt(selectedVersion.expiresAt)} 过期</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm tracking-widest">{selectedVersion.importCode}</code>
                <Button variant="outline" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copied ? '已复制' : '复制导入码'}
                </Button>
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>打开 Figma 文件并运行 PM Hub Prototype 插件。</li>
                <li>粘贴导入码，点击导入。</li>
                <li>插件会在当前文件创建可编辑图层，v2 原型会使用更丰富的视觉和组件层级。</li>
              </ol>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <label className="block">
                <span className="text-sm font-semibold">继续修改</span>
                <textarea value={revisionInstruction} onChange={(event) => setRevisionInstruction(event.target.value)} placeholder="例如：把底部播放器改得更突出；新增会员权益卡片；整体更像 B 端看板" className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed" />
              </label>
              <div className="mt-3 flex justify-end">
                <Button onClick={handleRevise} disabled={!canRevise}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  基于当前版本生成
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-[600px] items-center justify-center rounded-lg border border-dashed bg-background/60 px-6 text-center text-sm text-muted-foreground">
            填写左侧信息后，这里会展示可导入 Figma 的高保真原型预览。
          </div>
        )}
      </section>
    </div>
  );
}
