import { Plus, SlidersHorizontal, Sun, CheckCircle2 } from 'lucide-react';
import { LifeSpaceId } from '../../../types';
import { useTranslation } from '../../../i18n';

interface TodayHeaderProps {
  totalCount: number;
  completedCount: number;
  completionRate: number;
  spaceBreakdown: Record<LifeSpaceId, { total: number; completed: number }>;
  onOpenQuickAdd: () => void;
  onOpenPreferences: () => void;
}

export function TodayHeader({ totalCount, completedCount, completionRate, onOpenQuickAdd, onOpenPreferences }: TodayHeaderProps) {
  const { language } = useTranslation();
  const ar = language === 'ar';
  return <header className="today-hero">
    <div className="today-hero-copy">
      <p className="today-eyebrow"><Sun size={15} /> {new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
      <h1>{ar ? 'يومك، بتوازن.' : 'Your day, in balance.'}</h1>
      <p className="today-muted">{ar ? 'كل مساحات حياتك في مكان واحد. اختر ما يهم، وابدأ بخطوة.' : 'Every part of life, in one place. Choose what matters and take the next step.'}</p>
      <div className="today-hero-actions">
        <button className="today-primary" onClick={onOpenQuickAdd}><Plus size={17} />{ar ? 'أضف إلى يومك' : 'Add to your day'}</button>
        <button className="today-secondary" onClick={onOpenPreferences}><SlidersHorizontal size={16} />{ar ? 'تخصيص اليوم' : 'Customize Today'}</button>
      </div>
    </div>
    <div className="today-progress-summary">
      <div className="today-progress-ring" style={{ background: `conic-gradient(#34d399 ${completionRate * 3.6}deg, rgba(148,163,184,.12) 0deg)` }}>
        <div><strong>{completionRate}<small>%</small></strong><span>{ar ? 'أساسيات اليوم' : 'essentials'}</span></div>
      </div>
      <p><CheckCircle2 size={15} /> {ar ? `${completedCount} من ${totalCount} منجز` : `${completedCount} of ${totalCount} done`}</p>
      <span className="today-muted">{ar ? 'كل خطوة صغيرة تُحسب' : 'Small steps count'}</span>
    </div>
  </header>;
}
