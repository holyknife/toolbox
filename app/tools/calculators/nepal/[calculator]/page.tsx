import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCalculatorBySlug, getNepalCalculators } from '../../registry/calculators-registry';
import CalculatorViewDispatcher from '../../components/calculator-view-dispatcher';

export function generateStaticParams() {
  const nepalCalcs = getNepalCalculators();
  const nepalAliases = [
    'class-12-gpa',
    'class-12-planner',
    'salary-tax',
    'nepal-tax',
    'land-units',
    'nepal-land',
    'tola-gold',
    'gold-tola',
    'electricity-bill',
    'nepal-electricity',
    'fuel-cost',
    'bsad-age',
  ];

  const slugs = Array.from(
    new Set([...nepalCalcs.map((c) => c.slug), ...nepalAliases])
  );

  return slugs.map((slug) => ({ calculator: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ calculator: string }>;
}): Promise<Metadata> {
  const { calculator } = await params;
  const item = getCalculatorBySlug(calculator);

  return {
    title: item ? `${item.title} | Nepal Tools | Toolbox` : 'Nepal Calculator | Toolbox',
    description:
      item?.description ||
      'Official Nepal-first calculator for study, grading, salary tax, dates, and land units.',
  };
}

export default async function NepalCalculatorPage({
  params,
}: {
  params: Promise<{ calculator: string }>;
}) {
  const { calculator } = await params;
  const item = getCalculatorBySlug(calculator);

  if (!item) {
    notFound();
  }

  return (
    <div className="page calculators-detail-page py-4 sm:py-6 px-3 sm:px-6 max-w-7xl mx-auto">
      <CalculatorViewDispatcher slug={calculator} />
    </div>
  );
}
