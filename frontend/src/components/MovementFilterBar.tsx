type MovementFilterOption = 'today' | 'thisWeek' | 'last30' | 'custom';

export interface MovementFilterValue {
  option: MovementFilterOption;
  startDate?: string;
  endDate?: string;
}

interface MovementFilterBarProps {
  value: MovementFilterValue;
  onChange: (value: MovementFilterValue) => void;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MovementFilterBar({ value, onChange }: MovementFilterBarProps) {
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
      const day = now.getDay(); // 0 (Sun) - 6 (Sat)
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

    // custom
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

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
        Filter by date
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handlePresetChange('today')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            value.option === 'today'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('thisWeek')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            value.option === 'thisWeek'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          This Week
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('last30')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            value.option === 'last30'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Last 30 Days
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('custom')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            value.option === 'custom'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Custom Range
        </button>
      </div>
      {value.option === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600">
            From
            <input
              type="date"
              value={startInputValue}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="ml-1 px-2 py-1 rounded border border-slate-300 text-xs"
            />
          </label>
          <label className="text-xs text-slate-600">
            To
            <input
              type="date"
              value={endInputValue}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="ml-1 px-2 py-1 rounded border border-slate-300 text-xs"
            />
          </label>
        </div>
      )}
    </div>
  );
}

