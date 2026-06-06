import Link from 'next/link';
import { ArrowLeft, ExternalLink, GitBranch, Settings } from 'lucide-react';

export const revalidate = 0;

const flowchartAppUrl = process.env.NEXT_PUBLIC_FLOWCHART_APP_URL?.trim();

export default function FlowchartGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            返回实用工具
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600">
              <GitBranch className="h-4 w-4" />
              <span>流程图生成</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">AI 流程图生成</h1>
            <p className="text-muted-foreground">
              用自然语言生成、修改和优化流程图、架构图与业务流程图。当前工具由 PM Hub 包装承载，绘图能力由独立部署的流程图应用提供。
            </p>
          </div>

          {flowchartAppUrl ? (
            <a
              href={flowchartAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              新窗口打开
            </a>
          ) : null}
        </div>

        {flowchartAppUrl ? (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <iframe
              src={flowchartAppUrl}
              title="流程图生成"
              className="block h-[calc(100vh-15rem)] min-h-[620px] w-full bg-background md:h-[calc(100vh-12rem)]"
              referrerPolicy="no-referrer-when-downgrade"
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Settings className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="mb-2 text-lg font-semibold">流程图生成工具尚未配置</h2>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  请设置环境变量 <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">NEXT_PUBLIC_FLOWCHART_APP_URL</code>，
                  指向独立部署的 next-ai-draw-io 应用地址。
                </p>
                <div className="rounded-lg bg-muted/60 p-4 text-sm">
                  <p className="mb-2 font-medium">本地开发示例：</p>
                  <code className="break-all text-muted-foreground">NEXT_PUBLIC_FLOWCHART_APP_URL=http://localhost:6002</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
