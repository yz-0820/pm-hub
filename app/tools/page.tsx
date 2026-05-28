import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, Wrench } from 'lucide-react';

export const revalidate = 60;

const tools = [
  {
    href: '/tools/prd',
    title: 'PRD 生成',
    description: '把背景、目标、用户和功能点整理成可评审的产品需求文档。',
    icon: FileText,
  },
  {
    href: '/tools/prototype',
    title: '原型绘制',
    description: '上传原型图或界面截图，用文字说明修改内容，生成新的原型图。',
    icon: ImageIcon,
  },
];

export default function ToolsHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Wrench className="h-4 w-4" />
            <span>实用工具</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">实用工具</h1>
          <p className="text-muted-foreground text-lg mb-10">
            面向产品经理的轻量工作台，覆盖 PRD 生成、原型绘制等高频工作流。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-lg border bg-card/70 backdrop-blur-sm p-6 hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.title}</h2>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  <span>打开工具</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
