import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { trainingAttempts, trainingEvaluations, trainingQuestions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft, Brain, Sparkles, Zap, Trophy, Target } from 'lucide-react';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';
import { getUserKey } from '@/lib/training/user-key';
import { DimensionScoreCard } from '@/components/training/dimension-score-card';

export const revalidate = 0;

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function scoreToColor(score: number): string {
  if (score >= 85) return 'text-emerald-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 55) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBgColor(score: number): string {
  if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (score >= 70) return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
  if (score >= 55) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
}

function scoreLabel(score: number): string {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '一般';
  return '偏弱';
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

  const overallLabel = scoreLabel(evaluation.totalScore);
  const overallColor = scoreToColor(evaluation.totalScore);
  const overallBg = scoreBgColor(evaluation.totalScore);

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

        {/* 报告头 */}
        <div className="rounded-2xl border bg-card shadow-lg mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${usedAI ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border'}`}>
                  {usedAI ? <Sparkles className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                  <span>{usedAI ? 'AI 深度评分' : '规则兜底评分'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('zh-CN') : '-'}
                </div>
              </div>
              <div className="md:ml-auto text-xs text-muted-foreground">
                尝试 #{attempt.id}
              </div>
            </div>
          </div>
          <div className="px-6 py-6">
            <h1 className="text-xl font-bold mb-6 leading-snug">{title}</h1>

            {/* 总分卡片 */}
            <div className={`rounded-xl border-2 p-5 ${overallBg}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-background shadow-sm">
                  <Trophy className={`h-7 w-7 ${overallColor}`} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-0.5 font-medium">综合评分</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-extrabold tabular-nums ${overallColor}`}>
                      {evaluation.totalScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${overallBg}`}>
                      {overallLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 整体点评 */}
          <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">整体点评</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">✨ 亮点</h3>
                <ul className="space-y-2">
                  {(report?.overall?.strengths || ['—']).slice(0, 6).map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">🔧 不足</h3>
                <ul className="space-y-2">
                  {(report?.overall?.weaknesses || ['—']).slice(0, 6).map((x, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              {report?.overall?.next_steps?.length ? (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">📋 下一步行动</h3>
                  <ol className="space-y-2">
                    {report.overall.next_steps.slice(0, 6).map((x, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                        {x}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </div>

          {/* 原始答案 */}
          <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-bold">你的原始答案</h2>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-xl p-4 max-h-[500px] overflow-y-auto">
              {attempt.answer}
            </div>
          </div>
        </div>

        {/* 维度详情 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold">维度详细分析</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sections.map((s) => {
              const detail = report?.dimensions?.[s.key];
              return (
                <DimensionScoreCard
                  key={s.key}
                  name={s.name}
                  score={s.score}
                  weight={s.weight}
                  description={s.description}
                  analysis={detail?.analysis}
                  evidence={detail?.evidence}
                  suggestions={detail?.suggestions}
                  referenceFramework={report?.overall?.reference_framework}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
