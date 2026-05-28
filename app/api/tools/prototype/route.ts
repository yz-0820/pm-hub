import { NextRequest, NextResponse } from 'next/server';
import { generatePrototypeImage, validatePrototypeInput } from '@/lib/tools/prototype-generator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const prompt = formData.get('prompt');

    if (!(image instanceof File)) {
      return NextResponse.json({ success: false, error: '请上传一张图片' }, { status: 400 });
    }

    if (typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: '请填写需要修改的内容' }, { status: 400 });
    }

    const validationError = validatePrototypeInput({ image, prompt });
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const result = await generatePrototypeImage({ image, prompt });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error generating prototype image:', error);
    const message = error instanceof Error ? error.message : '原型图生成失败';
    const isConfigError = message.includes('DASHSCOPE_API_KEY');
    return NextResponse.json(
      {
        success: false,
        error: isConfigError ? message : '原型图生成失败',
        details: process.env.NODE_ENV !== 'production' ? message : undefined,
        timestamp: Date.now(),
      },
      { status: isConfigError ? 500 : 500 }
    );
  }
}
