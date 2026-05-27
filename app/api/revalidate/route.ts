import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * 手动触发 ISR 刷新的 API
 * 可用于后台任务或手动刷新
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, tag, secret } = body;

    // 简单的安全验证（可选）
    // 在生产环境中建议使用更安全的验证方式
    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: '无效的密钥' },
        { status: 401 }
      );
    }

    // 刷新指定路径
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        message: `路径 ${path} 已刷新`,
        timestamp: Date.now(),
      });
    }

    // 刷新指定标签
    if (tag) {
      revalidateTag(tag, 'page');
      return NextResponse.json({
        success: true,
        message: `标签 ${tag} 已刷新`,
        timestamp: Date.now(),
      });
    }

    // 默认刷新所有文章相关页面
    revalidatePath('/', 'layout');
    revalidatePath('/articles', 'layout');
    revalidatePath('/categories', 'layout');

    return NextResponse.json({
      success: true,
      message: '所有页面已刷新',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Revalidate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '刷新失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
