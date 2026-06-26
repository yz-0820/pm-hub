import Link from 'next/link';
import { ArrowLeft, PenTool } from 'lucide-react';
import { PrototypeGeneratorForm } from '@/components/tools/prototype-generator-form';

export const revalidate = 0;

export default function PrototypeGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            返回实用工具
          </Link>
        </div>

        <div className="flex items-start justify-between gap-6 flex-col lg:flex-row mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <PenTool className="h-4 w-4" />
              <span>原型生成</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">AI生成Figma原型图</h1>
            <p className="text-muted-foreground">
              上传界面截图并描述修改需求，AI 生成编辑后的原型图。
            </p>
          </div>
        </div>

        <PrototypeGeneratorForm />
      </div>
    </div>
  );
}
