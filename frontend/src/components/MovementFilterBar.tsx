import { useLanguage } from '../contexts/LanguageContext';

type MovementFilterOption = 'today' | 'thisWeek' | 'last30' | 'custom';

export interface MovementFilterValue {
  option: MovementFilterOption;
  startDate?: string;
  endDate?: string;
}

interface MovementFilterBarProps {
  value: MovementFilterValue;
  onChange: (value: MovementFilterValue) => void;
  embedded?: boolean;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MovementFilterBar({ value, onChange, embedded = false }: MovementFilterBarProps) {
  const { t } = useLanguage();

  const handlePresetChange = (option: MovementFilterOption) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (option === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      onChange({ option, startDate: start.toISOString(), endDate: end.toISOString() });
      return;
    }

    if (option === 'thisWeek') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      onChange({ option, startDate: start.toISOString(), endDate: end.toISOString() });
      return;
    }

    if (option === 'last30') {
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date(end);
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      onChange({ option, startDate: start.toISOString(), endDate: end.toISOString() });
      return;
    }

    onChange({ option, startDate: value.startDate, endDate: value.endDate });
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', dateValue: string) => {
    if (!dateValue) {
      onChange({ ...value, option: 'custom', [field]: undefined });
      return;
    }
    const [year, month, day] = dateValue.split('-').map((x) => Number(x));
    const date = new Date(year, month - 1, day, field === 'startDate' ? 0 : 23, 59, 59, 999);
    onChange({ ...value, option: 'custom', [field]: date.toISOString() });
  };

  const startInputValue = value.startDate ? toDateInputValue(new Date(value.startDate)) : '';
  const endInputValue = value.endDate ? toDateInputValue(new Date(value.endDate)) : '';

  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-medium border transition';
  const pillInactive =
    'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50';
  const pillActive = 'bg-indigo-600 text-white border-indigo-600 shadow-sm';

  const wrapperClass = embedded
    ? 'flex flex-wrap items-center gap-3'
    : 'flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50';

  return (
    <div className={wrapperClass}>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {t('filter.period')}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => handlePresetChange('today')}
          className={`${pillBase} ${value.option === 'today' ? pillActive : pillInactive}`}
        >
          {t('filter.today')}
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('thisWeek')}
          className={`${pillBase} ${value.option === 'thisWeek' ? pillActive : pillInactive}`}
        >
          {t('filter.thisWeek')}
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('last30')}
          className={`${pillBase} ${value.option === 'last30' ? pillActive : pillInactive}`}
        >
          {t('filter.last30')}
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('custom')}
          className={`${pillBase} ${value.option === 'custom' ? pillActive : pillInactive}`}
        >
          {t('filter.custom')}
        </button>
      </div>
      {value.option === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            {t('filter.from')}
            <input
              type="date"
              value={startInputValue}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm"
            />
          </label>
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            {t('filter.to')}
            <input
              type="date"
              value={endInputValue}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
