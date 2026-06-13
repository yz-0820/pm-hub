import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, RefreshCw } from 'lucide-react';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  articles,
  careerContents,
  contentFetchLogs,
  contentSources,
  fetchLogs,
  rssSourceStatus,
} from '@/lib/db/schema';
import { parseRSSFetchLogPayload } from '@/lib/rss/fetch-summary';

export const dynamic = 'force-dynamic';

type CountRow = {
  category: string;
  count: number;
};

type ReasonRow = {
  reason: string;
  count: number;
};

type CareerLogPayload = {
  version: 1;
  errors: string[];
  rejectedCount: number;
  rejectionReasons: Record<string, number>;
};

const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  'product-management': '产品经理',
  tech: '科技动态',
  ai: '人工智能',
  finance: '金融市场',
};

const CAREER_CATEGORY_LABELS: Record<string, string> = {
  communication: '职场沟通',
  productivity: '高效工作',
  teamwork: '团队协作',
  leadership: '领导力',
  all: '未分类',
};

const REASON_LABELS: Record<string, string> = {
  old_publish_date: '发布时间过早',
  promo_deal: '促销/导购内容',
  source_keyword_prefilter: '来源关键词预筛未命中',
  gaming_entertainment: '游戏/娱乐内容',
  ithome_product_launch: '产品发布/参数导购',
  low_pm_relevance: '产品经理相关度不足',
  low_tech_relevance: '科技相关度不足',
  low_finance_relevance: '金融相关度不足',
  low_ai_relevance: 'AI 相关度不足',
  non_top_tier_product_release: '非重点品牌产品发布',
  no_relevant_category: '未命中有效资讯分类',
  ai_finance_conflict: 'AI/金融分类冲突',
  source_filter_miss: '内容源过滤条件未命中',
  hard_reject: '硬性拒绝规则',
  non_career_relevance: '非职业发展主题',
  category_match_score_low: '分类匹配分不足',
  category_core_missing: '分类核心条件不足',
  career_anchor_missing: '职业场景锚点不足',
  actionability_missing: '可执行方法不足',
  quality_score_low: '质量分不足',
  invalid_url: '原文链接不可用',
  rejected: '准入未通过',
};

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getBeijingDayRange(now = new Date()) {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const startUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  ) - 8 * 60 * 60 * 1000;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000),
  };
}

function formatDateTime(value: unknown) {
  const date = normalizeDate(value);
  if (!date) return '暂无';

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parseCareerLogPayload(value: string | null | undefined): CareerLogPayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CareerLogPayload>;
    if (parsed?.version === 1 && typeof parsed.rejectedCount === 'number') {
      return parsed as CareerLogPayload;
    }
  } catch {
    return null;
  }

  return null;
}

function addReasonCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [reason, count] of Object.entries(source)) {
    target[reason] = (target[reason] || 0) + count;
  }
}

function topReasons(reasons: Record<string, number>, limit = 8): ReasonRow[] {
  return Object.entries(reasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function reasonLabel(reason: string) {
  if (reason.startsWith('url_')) return `链接不可用：${reason.slice(4)}`;
  return REASON_LABELS[reason] || reason;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function CountList({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.category} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {ARTICLE_CATEGORY_LABELS[row.category] || CAREER_CATEGORY_LABELS[row.category] || row.category}
              </span>
              <span className="font-medium text-foreground">{row.count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">今日暂无新增</p>
        )}
      </div>
    </div>
  );
}

function ReasonList({ title, rows }: { title: string; rows: ReasonRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.reason} className="flex items-center justify-between gap-4 text-sm">
              <span className="line-clamp-1 text-muted-foreground">{reasonLabel(row.reason)}</span>
              <span className="shrink-0 font-medium text-foreground">{row.count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">暂无可读拒绝原因。RSS 旧日志不会回补历史拒绝原因。</p>
        )}
      </div>
    </div>
  );
}

async function getStatusData() {
  const { start: todayStart } = getBeijingDayRange();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    latestRssLog,
    rssSourceLatest,
    latestCareerLog,
    careerSourceLatest,
    rssLogsToday,
    careerLogsToday,
    articleCategoryRows,
    careerCategoryRows,
    rejectedCareerRows,
    unhealthyRssSources,
    unhealthyCareerSources,
  ] = await Promise.all([
    db.query.fetchLogs.findFirst({ orderBy: [desc(fetchLogs.startedAt)] }),
    db.select({ latest: sql<Date | null>`max(${rssSourceStatus.lastFetchAt})` }).from(rssSourceStatus),
    db.query.contentFetchLogs.findFirst({ orderBy: [desc(contentFetchLogs.startedAt)] }),
    db.select({ latest: sql<Date | null>`max(${contentSources.lastFetchAt})` }).from(contentSources),
    db.query.fetchLogs.findMany({
      where: gte(fetchLogs.startedAt, todayStart),
      orderBy: [desc(fetchLogs.startedAt)],
      limit: 100,
    }),
    db.query.contentFetchLogs.findMany({
      where: gte(contentFetchLogs.startedAt, todayStart),
      orderBy: [desc(contentFetchLogs.startedAt)],
      limit: 200,
    }),
    db
      .select({
        category: articles.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(articles)
      .where(gte(articles.fetchedAt, todayStart))
      .groupBy(articles.category),
    db
      .select({
        category: careerContents.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(careerContents)
      .where(and(eq(careerContents.status, 'active'), gte(careerContents.fetchedAt, todayStart)))
      .groupBy(careerContents.category),
    db.query.careerContents.findMany({
      where: and(eq(careerContents.status, 'rejected'), gte(careerContents.fetchedAt, sevenDaysAgo)),
      columns: {
        qualityReasons: true,
        matchCoreMissing: true,
        qualityScore: true,
        matchScore: true,
        matchCoreMatched: true,
      },
      limit: 300,
    }),
    db.query.rssSourceStatus.findMany({
      where: eq(rssSourceStatus.isHealthy, false),
      columns: { sourceId: true, sourceName: true, lastError: true, lastErrorAt: true },
      limit: 8,
    }),
    db.query.contentSources.findMany({
      where: eq(contentSources.isHealthy, false),
      columns: { sourceId: true, sourceName: true, lastError: true, lastErrorAt: true },
      limit: 8,
    }),
  ]);

  const rssReasonCounts: Record<string, number> = {};
  const careerReasonCounts: Record<string, number> = {};

  let rssRejectedToday = 0;
  let rssErrorsToday = 0;
  for (const log of rssLogsToday) {
    const payload = parseRSSFetchLogPayload(log.errors);
    if (payload) {
      rssRejectedToday += payload.totals.rejectedArticles;
      rssErrorsToday += payload.totals.errorCount;
      addReasonCounts(rssReasonCounts, payload.totals.rejectionReasons);
    } else if (log.errors) {
      rssErrorsToday += 1;
    }
  }

  let careerRejectedToday = 0;
  let careerErrorsToday = 0;
  let careerNewToday = 0;
  let careerUpdatedToday = 0;
  for (const log of careerLogsToday) {
    careerNewToday += log.newCount || 0;
    careerUpdatedToday += log.updatedCount || 0;
    careerErrorsToday += log.errorCount || 0;
    const payload = parseCareerLogPayload(log.errors);
    if (payload) {
      careerRejectedToday += payload.rejectedCount || 0;
      addReasonCounts(careerReasonCounts, payload.rejectionReasons || {});
    }
  }

  for (const row of rejectedCareerRows) {
    const qualityReasons = parseJsonArray(row.qualityReasons);
    if (qualityReasons.length > 0) {
      for (const reason of qualityReasons) careerReasonCounts[reason] = (careerReasonCounts[reason] || 0) + 1;
      continue;
    }

    if ((row.matchScore || 0) < 75) careerReasonCounts.category_match_score_low = (careerReasonCounts.category_match_score_low || 0) + 1;
    if (!row.matchCoreMatched) careerReasonCounts.category_core_missing = (careerReasonCounts.category_core_missing || 0) + 1;
    if (parseJsonArray(row.matchCoreMissing).length > 0) {
      careerReasonCounts.category_core_missing = (careerReasonCounts.category_core_missing || 0) + 1;
    }
    if ((row.qualityScore || 0) < 70) careerReasonCounts.quality_score_low = (careerReasonCounts.quality_score_low || 0) + 1;
  }

  const latestRssPayload = parseRSSFetchLogPayload(latestRssLog?.errors);

  return {
    latestRssAt: latestRssLog?.completedAt || latestRssLog?.startedAt || rssSourceLatest[0]?.latest || null,
    latestCareerAt: latestCareerLog?.completedAt || latestCareerLog?.startedAt || careerSourceLatest[0]?.latest || null,
    rssLatestNew: latestRssLog?.totalNewArticles || 0,
    rssLatestRejected: latestRssPayload?.totals.rejectedArticles ?? null,
    rssTodayNew: articleCategoryRows.reduce((sum, row) => sum + row.count, 0),
    rssRejectedToday,
    rssErrorsToday,
    careerTodayNew: careerCategoryRows.reduce((sum, row) => sum + row.count, 0),
    careerUpdatedToday,
    careerRejectedToday,
    careerErrorsToday,
    articleCategoryRows: articleCategoryRows.map((row) => ({ category: row.category, count: row.count })),
    careerCategoryRows: careerCategoryRows.map((row) => ({ category: row.category, count: row.count })),
    rssReasons: topReasons(rssReasonCounts),
    careerReasons: topReasons(careerReasonCounts),
    unhealthyRssSources,
    unhealthyCareerSources,
  };
}

export default async function ContentStatusPage() {
  const data = await getStatusData();

  return (
    <main className="min-h-screen bg-background px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <Activity className="h-4 w-4" />
              内部运行状态
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">内容抓取状态</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              汇总 RSS 与 Career 抓取、准入、拒绝原因和缓存刷新相关状态。页面按北京时间统计“今日”。
            </p>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            返回首页
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="最近 RSS 抓取"
            value={formatDateTime(data.latestRssAt)}
            hint={`最近一轮新增 ${data.rssLatestNew}，拒绝 ${data.rssLatestRejected ?? '旧日志未记录'}`}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            title="最近 Career 抓取"
            value={formatDateTime(data.latestCareerAt)}
            hint={`今日新增 ${data.careerTodayNew}，更新 ${data.careerUpdatedToday}`}
            icon={<RefreshCw className="h-5 w-5" />}
          />
          <StatCard
            title="今日 RSS"
            value={data.rssTodayNew}
            hint={`拒绝 ${data.rssRejectedToday}，错误 ${data.rssErrorsToday}`}
            icon={<Database className="h-5 w-5" />}
          />
          <StatCard
            title="今日 Career"
            value={data.careerTodayNew}
            hint={`拒绝 ${data.careerRejectedToday}，错误 ${data.careerErrorsToday}`}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <CountList title="专业资讯今日新增" rows={data.articleCategoryRows} />
          <CountList title="职业发展今日新增" rows={data.careerCategoryRows} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReasonList title="RSS 主要拒绝原因" rows={data.rssReasons} />
          <ReasonList title="Career 主要拒绝原因" rows={data.careerReasons} />
        </section>

        {(data.unhealthyRssSources.length > 0 || data.unhealthyCareerSources.length > 0) && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">异常来源</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">RSS</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {data.unhealthyRssSources.length > 0 ? (
                    data.unhealthyRssSources.map((source) => (
                      <p key={source.sourceId}>
                        {source.sourceName}：{source.lastError || '未知错误'} · {formatDateTime(source.lastErrorAt)}
                      </p>
                    ))
                  ) : (
                    <p>暂无异常</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Career</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {data.unhealthyCareerSources.length > 0 ? (
                    data.unhealthyCareerSources.map((source) => (
                      <p key={source.sourceId}>
                        {source.sourceName}：{source.lastError || '未知错误'} · {formatDateTime(source.lastErrorAt)}
                      </p>
                    ))
                  ) : (
                    <p>暂无异常</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
