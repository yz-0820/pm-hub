'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { trainingDifficulty, trainingIndustries, trainingProductTypes } from '@/config/training';

export function ProductThinkingFilters(props: {
  industry: string;
  productType: string;
  difficulty: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/training/product-thinking?${qs}` : '/training/product-thinking');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
      <select
        value={props.industry}
        onChange={(e) => setParam('industry', e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">全部行业</option>
        {trainingIndustries.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <select
        value={props.productType}
        onChange={(e) => setParam('productType', e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">全部类型</option>
        {trainingProductTypes.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <select
        value={props.difficulty}
        onChange={(e) => setParam('difficulty', e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">全部难度</option>
        {trainingDifficulty.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </div>
  );
}

