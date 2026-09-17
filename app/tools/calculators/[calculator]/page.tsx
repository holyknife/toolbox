import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { calculators, getCalculatorBySlug } from '../registry/calculators-registry';
import CalculatorViewDispatcher from '../components/calculator-view-dispatcher';

// Prebuild all 9 calculators plus convenient aliases
export function generateStaticParams() {
  const aliases = ['currency', 'loan', 'percent', 'forex'];
  const allSlugs = Array.from(
    new Set([...calculators.map((c) => c.slug), ...aliases])
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
      'Clean, instant, and privacy-friendly calculators for everyday math, finance, and health.',
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ calculator: string }>;
}) {
  const { calculator } = await params;
  const item = getCalculatorBySlug(calculator);

  if (!item && !['currency', 'loan', 'percent', 'forex'].includes(calculator)) {
    notFound();
  }

  return (
    <div className="page calculators-detail-page py-4 sm:py-6 px-3 sm:px-6 max-w-7xl mx-auto">
      <CalculatorViewDispatcher slug={calculator} />
    </div>
  );
}
