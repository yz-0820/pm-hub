import { describe, expect, it } from 'vitest';
import { validatePrototypeInput } from '@/lib/tools/prototype-generator';

function imageFile(type: string, size = 10): File {
  return new File([new Uint8Array(size)], 'prototype.png', { type });
}

describe('prototype input validation', () => {
  it('accepts supported image types with a prompt', () => {
    const error = validatePrototypeInput({
      image: imageFile('image/png'),
      prompt: '把按钮文案改成立即提交',
    });

    expect(error).toBeNull();
  });

  it('rejects unsupported image types', () => {
    const error = validatePrototypeInput({
      image: imageFile('image/gif'),
      prompt: '修改标题',
    });

    expect(error).toContain('仅支持');
  });

  it('rejects empty prompts', () => {
    const error = validatePrototypeInput({
      image: imageFile('image/jpeg'),
      prompt: '   ',
    });

    expect(error).toBe('请填写需要修改的内容');
  });
});
