import { ArrowRight, BookOpen, CheckCheck, Layers3 } from 'lucide-react';
import type { Progress } from '../types';
import { DAY, recallAt } from '../review/scheduler';

interface DashboardProps {
  now: number;
  progress: Progress[];
  due: number;
  dueNow: number;
  done: number;
  mastered: number;
  newWords: number;
  newToday: number;
  total: number;
  canStart: boolean;
  onStart: () => void;
  onImport: () => void;
}

const forecastDays = [0, 1, 3, 7];
const dayLabel = (day: number) => day ? `${day} 天后` : '现在';

function RecallForecast({ progress, now }: { progress: Progress[]; now: number }) {
  const studied = progress.filter(p => p.reviews && p.last_review !== null);
  const sample = (day: number) => studied.reduce((sum, word) => sum + (recallAt(word, now + day * DAY) ?? 0), 0) / studied.length;
  const readings = studied.length ? forecastDays.map(day => ({ day, percent: Math.round(sample(day) * 100) })) : [];
  const path = studied.length ? Array.from({ length: 57 }, (_, i) => `${i * 10},${100 - sample(i / 8) * 100}`).join(' ') : '';
  return <section className="panel forecast-panel" aria-labelledby="recall-forecast">
    <h2 id="recall-forecast">我的遗忘曲线</h2>
    {studied.length ? <>
      <p>如果接下来不复习，已练过的 {studied.length} 个词的预计平均回忆率。</p>
      <div className="forecast-chart" aria-hidden="true">
        <div className="forecast-axis"><span>100%</span><span>50%</span><span>0%</span></div>
        <svg viewBox="0 0 560 100" preserveAspectRatio="none">
          {[0, 50, 100].map(y => <line key={y} x1="0" x2="560" y1={y} y2={y} vectorEffect="non-scaling-stroke"/>)}
          <polygon points={`0,100 ${path} 560,100`}/>
          <polyline points={path} vectorEffect="non-scaling-stroke"/>
        </svg>
      </div>
      <div className="forecast-time-axis" aria-hidden="true"><span>现在</span><span>7 天后</span></div>
      <dl className="forecast-values">{readings.map(({ day, percent }) =>
        <div key={day}><dt>{dayLabel(day)}</dt><dd>{percent}%</dd></div>)}</dl>
    </> : <p className="forecast-empty">完成第一次练习后，这里会显示你的预计回忆率。</p>}
  </section>;
}

export default function StudyDashboard(props: DashboardProps) {
  const { now, progress, due, dueNow, done, mastered, newWords, newToday, total, canStart, onStart, onImport } = props;
  return <div className="study-dashboard">
    <section className="panel daily-panel" aria-labelledby="daily-study-title">
      <div className="daily-heading">
        <div>
          <h1 id="daily-study-title">艾宾浩斯每日背诵</h1>
          <p>{total ? '先练最容易忘的到期词，再学新词。' : '导入你的词库，开始建立每日复习计划。'}</p>
        </div>
        <button className="primary" onClick={total ? onStart : onImport} disabled={!!total && !canStart}>
          {total ? '开始今日背诵' : '核对并导入初始词库'} <ArrowRight size={20}/>
        </button>
      </div>
      <div className="daily-metrics">
        <div className="metric metric-accent"><div className="metric-label">今日待复习 <Layers3 size={18}/></div><strong>{due}<small>词</small></strong><p>{dueNow} 词现在可练</p></div>
        <div className="metric"><div className="metric-label">今日已复习 <CheckCheck size={18}/></div><strong>{done}<small>词</small></strong><p>按不同单词计数</p></div>
        <div className="metric"><div className="metric-label">已掌握 <BookOpen size={18}/></div><strong>{mastered}<small>词</small></strong><p>词库共 {total} 个词</p></div>
      </div>
      {!!total && <p className="daily-complete">新词 {newWords} 个 · 今日可学 {newToday} 个</p>}
      {!!total && !canStart && <p className="daily-complete">当前没有到期词，下一批到期后会自动出现。</p>}
    </section>
    <RecallForecast progress={progress} now={now}/>
  </div>;
}
