'use client';

import { CheckCircle2, Lightbulb, BarChart3, FileSearch, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface DimensionScoreCardProps {
  /** 维度名称 */
  name: string;
  /** 0-100 的分值 */
  score: number;
  /** 权重，如 "30%" */
  weight: string;
  /** 维度描述 */
  description: string;
  /** AI 分析文本（作为参考答案的详细分析） */
  analysis?: string;
  /** 关键依据（来自答案的具体引用） */
  evidence?: string[];
  /** 改进建议 */
  suggestions?: string[];
  /** 参考框架（来自整体点评的 reference_framework） */
  referenceFramework?: string[];
}

function scoreToColor(score: number): { bg: string; text: string; bar: string; glow: string } {
  if (score >= 85) return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', glow: 'shadow-emerald-200 dark:shadow-emerald-900/30' };
  if (score >= 70) return { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', glow: 'shadow-blue-200 dark:shadow-blue-900/30' };
  if (score >= 55) return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', glow: 'shadow-amber-200 dark:shadow-amber-900/30' };
  return { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', glow: 'shadow-red-200 dark:shadow-red-900/30' };
}

function scoreLabel(score: number): string {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '一般';
  return '偏弱';
}

export function DimensionScoreCard({
  name,
  score,
  weight,
  description,
  analysis,
  evidence,
  suggestions,
  referenceFramework,
}: DimensionScoreCardProps) {
  const [expanded, setExpanded] = useState(true);
  const colors = scoreToColor(score);
  const label = scoreLabel(score);

  return (
    <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* 卡片头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold tabular-nums ${colors.text}`}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{weight}</span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t pt-4">
          {/* ===== 第一部分：分值 ===== */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10">
                <span className="text-[10px] font-bold text-primary">分</span>
              </div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">分值</h4>
            </div>
            
            <div className="rounded-lg border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tabular-nums ${colors.text}`}>
                    {score}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100 分</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    权重 {weight}
                  </span>
                </div>
              </div>
              
              {/* 评分进度条 */}
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${Math.max(4, score)}%` }}
                />
              </div>
              
              {analysis ? (
                <div className="text-sm leading-relaxed text-card-foreground space-y-2 mt-3 pt-3 border-t border-border/50">
                  {analysis.split('\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i} className={i === 0 ? 'font-medium text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-2">暂无详细分析</p>
              )}
            </div>
          </section>

          {/* ===== 第二部分：关键依据 ===== */}
          {evidence && evidence.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 dark:bg-amber-900/30">
                  <FileSearch className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">关键依据</h4>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  基于你的答案内容
                </span>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 p-3.5">
                <ul className="space-y-2.5">
                  {evidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* ===== 第三部分：参考答案 / 参考框架 ===== */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">参考答案</h4>
              <span className="text-[10px] text-muted-foreground ml-auto">
                建议参考的分析维度与工具
              </span>
            </div>
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10 p-3.5">
              {referenceFramework && referenceFramework.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {referenceFramework.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">暂无参考答案</p>
              )}
            </div>
          </section>

          {/* ===== 第四部分：改进建议 ===== */}
          {suggestions && suggestions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/30">
                  <Lightbulb className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">改进建议</h4>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  可执行的具体方向
                </span>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5">
                <ul className="space-y-2.5">
                  {suggestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
