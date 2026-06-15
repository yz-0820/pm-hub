import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, GitBranch } from 'lucide-react';

export const revalidate = 60;

const tools = [
  {
    href: '/tools/prd',
    title: 'PRD 生成',
    description: '输入需求背景与功能点，AI 自动生成结构化产品需求文档。',
    icon: FileText,
    color: 'sky',
  },
  {
    href: '/tools/prototype',
    title: '原型生成',
    description: '上传界面截图并描述修改需求，AI 生成编辑后的原型图。',
    icon: ImageIcon,
    color: 'violet',
  },
  {
    href: '/tools/flowchart',
    title: '流程图生成',
    description: '用自然语言生成、修改和优化流程图、架构图与业务流程图。',
    icon: GitBranch,
    color: 'indigo',
  },
];

export default function ToolsHomePage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-no-repeat opacity-[0.35] saturate-[0.6] contrast-[1.02] brightness-[1.05]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0)",
              backgroundPosition: 'center',
              backgroundSize: 'clamp(1000px, 120vw, 2200px) auto',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background/85" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,hsl(var(--background))_0%,transparent_62%)] opacity-80" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 top-40 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              实用工具
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              AI 驱动的轻量工作台，覆盖 PRD 生成、原型生成与流程图生成等高频场景
            </p>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
                sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'hover:border-sky-200', hover: 'group-hover:text-sky-600' },
                violet: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'hover:border-violet-200', hover: 'group-hover:text-violet-600' },
                indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'hover:border-indigo-200', hover: 'group-hover:text-indigo-600' },
              };
              const c = colorClasses[tool.color] || colorClasses.sky;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group rounded-lg border bg-card/70 backdrop-blur-sm p-6 hover:shadow-lg ${c.border} transition-all`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className={`text-xl font-bold mb-2 ${c.hover} transition-colors`}>{tool.title}</h2>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                  </div>
                  <div className={`mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground ${c.hover} transition-colors`}>
                    <span>打开工具</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
