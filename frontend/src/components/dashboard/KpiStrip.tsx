import { Activity, Boxes, DollarSign, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface KpiStripProps {
  loading: boolean;
  inventoryValueLabel: string;
  inventoryValueHint: string;
  stockHealthLabel: string;
  stockHealthHint: string;
  lowStockCount: string;
  lowStockHint: string;
  lowStockStress: boolean;
  fourthTitle: string;
  fourthValue: string;
  fourthHint: string;
  fourthStress?: boolean;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function KpiStrip(props: KpiStripProps) {
  const { t } = useLanguage();

  if (props.loading) {
    return (
      <div aria-busy="true" aria-label={t('erp.kpiLoading')}>
        <KpiSkeleton />
      </div>
    );
  }

  const cards = [
    {
      icon: DollarSign,
      title: t('erp.kpiInventoryValue'),
      value: props.inventoryValueLabel,
      hint: props.inventoryValueHint,
      accent: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: Activity,
      title: t('erp.kpiStockHealth'),
      value: props.stockHealthLabel,
      hint: props.stockHealthHint,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Boxes,
      title: t('erp.kpiLowStock'),
      value: props.lowStockCount,
      hint: props.lowStockHint,
      accent: props.lowStockStress ? 'text-amber-600' : 'text-slate-700',
      bg: props.lowStockStress ? 'bg-amber-50' : 'bg-slate-50',
    },
    {
      icon: Users,
      title: props.fourthTitle,
      value: props.fourthValue,
      hint: props.fourthHint,
      accent: props.fourthStress ? 'text-amber-600' : 'text-slate-700',
      bg: props.fourthStress ? 'bg-amber-50/80' : 'bg-slate-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, title, value, hint, accent, bg }) => (
        <div
          key={title}
          className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-950/[0.02] transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <span className={`inline-flex rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs font-medium leading-snug text-slate-500">{hint}</p>
        </div>
      ))}
    </div>
  );
}
