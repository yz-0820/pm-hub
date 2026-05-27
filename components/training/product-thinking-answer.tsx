'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainingQuestion } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Send, Save } from 'lucide-react';

type DraftResponse =
  | { success: true; data: { content: string; updatedAt: string | null } }
  | { success: false; error: string };

export function ProductThinkingAnswer({ question }: { question: TrainingQuestion }) {
  const router = useRouter();
  const storageKey = useMemo(() => `training_draft_${question.id}`, [question.id]);
  const title = useMemo(() => question.title.replace(/^拆解[:：]\s*/, ''), [question.title]);

  const [content, setContent] = useState('');
  const [statusText, setStatusText] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lastSavedRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const local = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (local) setContent(local);

    (async () => {
      const res = await fetch(`/api/training/drafts?questionId=${question.id}`, { cache: 'no-store' });
      const data = (await res.json()) as DraftResponse;
      if (!data.success) return;
      if (data.data.content && data.data.content.trim().length > 0) {
        setContent(data.data.content);
        lastSavedRef.current = data.data.content;
        window.localStorage.setItem(storageKey, data.data.content);
        setStatusText('已加载草稿');
        return;
      }
      if (local) {
        setStatusText('已加载本地草稿');
      }
    })();
  }, [question.id, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, content);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      if (content === lastSavedRef.current) return;
      setSaving(true);
      setStatusText('保存中…');
      try {
        const res = await fetch('/api/training/drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, content }),
        });
        const data = await res.json();
        if (data?.success) {
          lastSavedRef.current = content;
          setStatusText('已保存');
        } else {
          setStatusText('保存失败（已保存在本地）');
        }
      } catch {
        setStatusText('保存失败（已保存在本地）');
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [content, question.id, storageKey]);

  const handleManualSave = async () => {
    if (content === lastSavedRef.current) {
      setStatusText('已是最新草稿');
      return;
    }
    setSaving(true);
    setStatusText('保存中…');
    try {
      const res = await fetch('/api/training/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, content }),
      });
      const data = await res.json();
      if (data?.success) {
        lastSavedRef.current = content;
        setStatusText('已保存');
      } else {
        setStatusText('保存失败（已保存在本地）');
      }
    } catch {
      setStatusText('保存失败（已保存在本地）');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setStatusText('请先输入答案');
      return;
    }
    if (trimmed.length < 80) {
      setStatusText('答案过短，请按题目要求写出完整分析后再提交');
      return;
    }
    const compact = trimmed.replace(/\s+/g, '');
    const letters = (compact.match(/[\p{Script=Han}A-Za-z]/gu) || []).length;
    const digits = (compact.match(/[0-9]/g) || []).length;
    if (letters < 60) {
      setStatusText('答案缺少有效文字内容，请避免仅输入数字或无意义字符');
      return;
    }
    if (digits >= 40 && digits > letters * 2) {
      setStatusText('检测到大量数字内容，请输入结构化分析后再提交');
      return;
    }
    setSubmitting(true);
    setStatusText('提交中…');
    try {
      const res = await fetch('/api/training/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: trimmed }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.attemptId) {
        window.localStorage.removeItem(storageKey);
        router.push(`/training/product-thinking/attempts/${data.data.attemptId}`);
      } else {
        setStatusText(data?.error || '提交失败');
      }
    } catch {
      setStatusText('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
        <h1 className="text-xl font-bold mb-3">{title}</h1>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{question.prompt}</div>
        {question.referencePoints && (
          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">参考要点</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(() => {
                try {
                  const points = JSON.parse(question.referencePoints) as string[];
                  if (!Array.isArray(points)) return null;
                  return points.slice(0, 12).map((x, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                      <span className="leading-relaxed">{x}</span>
                    </li>
                  ));
                } catch {
                  return null;
                }
              })()}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:col-span-3 rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">你的答案</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{statusText || '保存中…'}</span>
                </>
              ) : statusText ? (
                <>
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>{statusText}</span>
                </>
              ) : (
                <span>支持自动保存草稿</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleManualSave} disabled={saving || submitting}>
              <Save />
              保存草稿
            </Button>
            <Button onClick={handleSubmit} disabled={saving || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
              提交并评分
            </Button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="建议按：用户价值 → 商业逻辑 → 功能设计 → 竞争分析 的结构作答…"
          className="w-full min-h-[420px] rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
