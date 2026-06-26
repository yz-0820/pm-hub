'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, Clipboard, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type FormState = {
  productName: string;
  background: string;
  goals: string;
  users: string;
  features: string;
  constraints: string;
  metrics: string;
};

type ApiResponse =
  | {
      success: true;
      data: {
        content: string;
        model: string;
        usedAI: boolean;
      };
    }
  | {
      success: false;
      error: string;
    };

const initialState: FormState = {
  productName: '',
  background: '',
  goals: '',
  users: '',
  features: '',
  constraints: '',
  metrics: '',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${formatInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${formatInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${formatInline(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInline(line)}</p>`);
  }

  closeList();
  return html.join('\n');
}

function buildDocumentHtml(markdown: string, title: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", Arial, sans-serif; color: #111827; line-height: 1.72; padding: 40px; }
    h1 { font-size: 28px; margin: 0 0 24px; }
    h2 { font-size: 22px; margin: 28px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    h3 { font-size: 18px; margin: 22px 0 8px; }
    h4 { font-size: 16px; margin: 18px 0 8px; }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0 12px 24px; padding: 0; }
    li { margin: 4px 0; }
    code { font-family: Consolas, monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>`;
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-28',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          minHeight
        )}
      />
    </label>
  );
}

export function PrdGeneratorForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [result, setResult] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(form.background.trim());
  }, [form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isGenerating) {
      setStatusText('请先描述你的产品想法或需求');
      return;
    }

    setIsGenerating(true);
    setStatusText('正在生成结构化 PRD');
    setCopied(false);

    try {
      const res = await fetch('/api/tools/prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as ApiResponse;

      if (data.success) {
        setResult(data.data.content);
        setStatusText(data.data.usedAI ? `已生成，模型：${data.data.model}` : '已生成结构化模板');
      } else {
        setStatusText(data.error || '生成失败');
      }
    } catch {
      setStatusText('生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const documentTitle = form.productName.trim() || 'PRD';

  const handleGeneratePrototype = () => {
    if (!result) return;
    try {
      window.localStorage.setItem('pmhub:prototype-draft', result);
    } catch {
      // 跳转仍然可用；用户也可以手动复制 PRD。
    }
    window.location.href = '/tools/prototype?from=prd';
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${documentTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    if (!result) return;
    const html = buildDocumentHtml(result, documentTitle);
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${documentTitle}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <section className="xl:col-span-2 rounded-lg border bg-card/70 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">想法 Brief</h2>
            <p className="text-xs text-muted-foreground">只需先写清楚想法，其他信息可以后补。</p>
          </div>
        </div>

        <div className="space-y-5">
          <TextareaField
            label="一句话/一段话描述你的产品想法或需求 *"
            value={form.background}
            onChange={(value) => updateField('background', value)}
            placeholder="例如：我想做一个会员续费提醒功能，帮助用户在到期前看到权益、续费优惠和一键续费入口，减少流失。"
            minHeight="min-h-40"
          />

          <label className="block">
            <span className="text-sm font-medium">产品或功能名称（可选）</span>
            <Input
              value={form.productName}
              onChange={(event) => updateField('productName', event.target.value)}
              placeholder="例如：会员续费提醒"
              className="mt-2"
            />
          </label>

          <TextareaField
            label="目标（可选）"
            value={form.goals}
            onChange={(value) => updateField('goals', value)}
            placeholder="说明业务目标、用户目标或本次迭代希望达成的结果"
          />

          <TextareaField
            label="目标用户（可选）"
            value={form.users}
            onChange={(value) => updateField('users', value)}
            placeholder="说明用户角色、使用场景和关键差异"
          />

          <TextareaField
            label="核心功能点（可选）"
            value={form.features}
            onChange={(value) => updateField('features', value)}
            placeholder="逐行填写功能点、流程、规则或优先级"
            minHeight="min-h-36"
          />

          <TextareaField
            label="约束条件（可选）"
            value={form.constraints}
            onChange={(value) => updateField('constraints', value)}
            placeholder="技术、合规、资源、权限、数据等约束"
          />

          <TextareaField
            label="成功指标（可选）"
            value={form.metrics}
            onChange={(value) => updateField('metrics', value)}
            placeholder="例如：转化率、留存率、处理时长、满意度"
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground min-h-4">{statusText}</p>
            <Button onClick={handleSubmit} disabled={isGenerating || !canSubmit}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              生成结构化 PRD
            </Button>
          </div>
        </div>
      </section>

      <section className="xl:col-span-3 rounded-lg border bg-card/70 p-5 min-h-[720px] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">PRD 编辑器</h2>
            <p className="text-xs text-muted-foreground">生成后可继续编辑文档，再复制、下载或进入原型生成。</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleGeneratePrototype} disabled={!result}>
              <ArrowRight className="h-4 w-4" />
              基于这份 PRD 生成原型
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!result}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? '已复制' : '复制'}
            </Button>
            <Button variant="outline" onClick={handleDownloadMarkdown} disabled={!result}>
              <Download className="h-4 w-4" />
              Markdown
            </Button>
            <Button variant="outline" onClick={handleDownloadWord} disabled={!result}>
              <FileText className="h-4 w-4" />
              Word
            </Button>
          </div>
        </div>

        {result ? (
          <textarea
            value={result}
            onChange={(event) => setResult(event.target.value)}
            className="flex-1 min-h-[600px] w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        ) : (
          <div className="flex-1 min-h-[600px] rounded-lg border border-dashed bg-background/60 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
            输入一个粗略想法即可生成结构化 PRD。文档会显示在这里，可继续编辑、复制、下载，或作为下一步原型生成的输入。
          </div>
        )}
      </section>
    </div>
  );
}
