import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { calculators, getCalculatorBySlug } from '../registry/calculators-registry';
import CalculatorViewDispatcher from '../components/calculator-view-dispatcher';

// Prebuild all 26 official calculators plus legacy aliases
export function generateStaticParams() {
  const legacySlugs = ['basic', 'tax', 'gpa', 'grade', 'age'];
  const allSlugs = Array.from(
    new Set([...calculators.map((c) => c.slug), ...legacySlugs])
  );
  return allSlugs.map((slug) => ({ calculator: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ calculator: string }>;
}): Promise<Metadata> {
  const { calculator } = await params;
  const item = getCalculatorBySlug(calculator);
  return {
    title: item ? `${item.title} | Toolbox` : 'Calculator | Toolbox',
    description:
      item?.description ||
      'Clean Nepal-first and everyday calculators for study, money, dates, and productivity.',
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ calculator: string }>;
}) {
  const { calculator } = await params;
  const item = getCalculatorBySlug(calculator);

  if (!item && !['basic', 'tax', 'gpa', 'grade', 'age'].includes(calculator)) {
    notFound();
  }

  return (
    <div className="page calculators-detail-page py-4 sm:py-6 px-3 sm:px-6 max-w-7xl mx-auto">
      <CalculatorViewDispatcher slug={calculator} />
    </div>
  );
}
