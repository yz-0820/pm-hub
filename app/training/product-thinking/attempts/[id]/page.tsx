import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { trainingAttempts, trainingEvaluations, trainingQuestions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft, Brain, CheckCircle2 } from 'lucide-react';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';
import { getUserKey } from '@/lib/training/user-key';

export const revalidate = 0;

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default async function TrainingAttemptReportPage(props: { params: Promise<{ id: string }> }) {
  ensureTrainingSchema();
  const userKey = await getUserKey();
  if (!userKey) notFound();

  const { id } = await props.params;
  const attemptId = Number(id);
  if (!Number.isFinite(attemptId) || attemptId <= 0) notFound();

  const attempt = await db.query.trainingAttempts.findFirst({
    where: and(eq(trainingAttempts.id, attemptId), eq(trainingAttempts.userKey, userKey)),
  });
  if (!attempt) notFound();

  const question = await db.query.trainingQuestions.findFirst({
    where: eq(trainingQuestions.id, attempt.questionId),
  });
  if (!question) notFound();

  const evaluation = await db.query.trainingEvaluations.findFirst({
    where: eq(trainingEvaluations.attemptId, attemptId),
  });
  if (!evaluation) notFound();

  const report = safeJsonParse<{
    usedAI: boolean;
    weights: { userValue: number; businessLogic: number; featureDesign: number; competition: number };
    dimensions: Record<
      string,
      { score: number; analysis: string; evidence?: string[]; suggestions: string[] }
    >;
    overall: {
      strengths: string[];
      weaknesses: string[];
      next_steps: string[];
      reference_framework: string[];
    };
  }>(evaluation.report);

  const usedAI = report?.usedAI ?? false;
  const title = question.title.replace(/^拆解[:：]\s*/, '');

  const scoreLabel = (score: number) => {
    if (score >= 85) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 55) return '一般';
    return '偏弱';
  };

  const extractBrief = (text: string) => {
    const t = text
      .replace(/\s+/g, ' ')
      .replace(/^[\-\u2022]\s*/g, '')
      .trim();
    if (!t) return '';
    const m = /(.+?[。！？.!?])/u.exec(t);
    const first = (m?.[1] || t).trim();
    if (first.length <= 80) return first;
    return `${first.slice(0, 80).trim()}…`;
  };

  const stripLeadingBrief = (analysis: string, brief: string) => {
    const a = analysis.trim();
    const b = brief.trim();
    if (!a || !b) return a;
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const cutTail = (s: string) => normalize(s).replace(/[。！？.!?…]+$/u, '').trim();
    const na = normalize(a);
    const nb = cutTail(b);
    if (!nb) return a;
    if (!na.startsWith(nb)) return a;
    const m = /(.+?[。！？.!?])/u.exec(a);
    if (!m) {
      const idx = a.indexOf(nb);
      if (idx !== 0) return a;
      return a.slice(nb.length).replace(/^[\s:：\-–—]+/u, '').trim();
    }
    const first = m[1].trim();
    if (!normalize(first).startsWith(nb)) return a;
    return a.slice(m[0].length).replace(/^[\s:：\-–—]+/u, '').trim();
  };

  const sections = [
    {
      key: 'user_value',
      name: '用户价值分析',
      description: '是否清晰定义目标用户与使用场景，说明核心痛点、价值主张、优先级与可验证的指标。',
      score: evaluation.valueScore,
      weight: '30%',
    },
    {
      key: 'business_logic',
      name: '商业逻辑完整性',
      description: '是否说明增长与转化链路、成本与收益、定价与渠道，以及关键假设与风险应对。',
      score: evaluation.businessScore,
      weight: '25%',
    },
    {
      key: 'feature_design',
      name: '功能设计合理性',
      description: '功能是否围绕价值闭环展开，包含流程/信息结构/关键交互，并解释取舍与边界条件。',
      score: evaluation.designScore,
      weight: '25%',
    },
    {
      key: 'competition_analysis',
      name: '竞争分析深度',
      description: '是否对标竞品与替代方案，比较差异与定位，并提出可落地的差异化策略与验证路径。',
      score: evaluation.competitionScore,
      weight: '20%',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/training/product-thinking/${question.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回题目
          </Link>
        </div>

        <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                <Brain className="h-3.5 w-3.5" />
                <span>{usedAI ? 'AI 评分已启用' : '规则兜底评分'}</span>
              </div>
              <h1 className="text-xl font-bold mb-2">{title}</h1>
              <p className="text-sm text-muted-foreground">
                总分（0-100）：<span className="text-foreground font-semibold">{evaluation.totalScore}</span>
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border bg-background px-5 py-4 w-full md:w-auto">
              <div className="text-xs text-muted-foreground mb-1">尝试编号</div>
              <div className="text-sm font-semibold">#{attempt.id}</div>
              <div className="text-xs text-muted-foreground mt-3 mb-1">提交时间</div>
              <div className="text-sm font-semibold">
                {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('zh-CN') : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
            <div className="text-sm font-semibold mb-4">维度评分</div>
            <div className="space-y-4">
              {sections.map((s) => {
                const detail = report?.dimensions?.[s.key];
                const analysisText = detail?.analysis || '';
                const brief = (() => {
                  const label = scoreLabel(s.score);
                  const reason = analysisText ? extractBrief(analysisText) : '';
                  return reason
                    ? `${label}（${s.score}/100）：${reason}`
                    : `${label}（${s.score}/100）：${s.description}`;
                })();
                const reason = analysisText ? extractBrief(analysisText) : '';
                const detailAnalysis = analysisText && reason ? stripLeadingBrief(analysisText, reason) : analysisText.trim();
                return (
                  <div key={s.key} className="rounded-xl border bg-background p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-sm font-semibold">
                        {s.score} <span className="text-xs text-muted-foreground font-normal">（权重 {s.weight}）</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {brief}
                    </div>
                    {detailAnalysis ? (
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {detailAnalysis}
                      </div>
                    ) : null}
                    {detail?.evidence?.length ? (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-2">关键依据</div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {detail.evidence.slice(0, 4).map((x, i) => (
                            <li key={i} className="leading-relaxed">
                              {x}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {detail?.suggestions?.length ? (
                      <div className="mt-3 space-y-2">
                        {detail.suggestions.slice(0, 5).map((x, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{x}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
              <div className="text-sm font-semibold mb-4">整体点评</div>
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border bg-background p-4">
                  <div className="text-sm font-semibold mb-2">亮点</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(report?.overall?.strengths || ['—']).slice(0, 6).map((x, i) => (
                      <li key={i} className="leading-relaxed">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <div className="text-sm font-semibold mb-2">不足</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(report?.overall?.weaknesses || ['—']).slice(0, 6).map((x, i) => (
                      <li key={i} className="leading-relaxed">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
              <div className="text-sm font-semibold mb-4">你的原始答案</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{attempt.answer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
