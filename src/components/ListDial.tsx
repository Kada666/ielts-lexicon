import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './list-dial.css';

type Props = {
  label: string;
  lists: number[];
  value: string;
  onChange: (value: string) => void;
  shortcuts?: { value: string; label: string }[];
};

const visibleTicks = 9;
const tickOffsets = Array.from({ length: visibleTicks + 2 }, (_, index) => index - 5);

export default function ListDial({ label, lists, value, onChange, shortcuts = [] }: Props) {
  const id = useId();
  const selected = lists.indexOf(Number(value));
  const index = Math.max(0, selected);
  const current = lists[index];
  const last = lists.length - 1;
  const drag = useRef<{ pointer: number; x: number; index: number; step: number; moved: boolean; lastIndex: number } | null>(null);
  const [shift, setShift] = useState(0);

  function choose(next: number) {
    const list = lists[Math.min(last, Math.max(0, next))];
    if (list !== undefined && String(list) !== value) onChange(String(list));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft': case 'ArrowDown': next = selected < 0 ? index : index - 1; break;
      case 'ArrowRight': case 'ArrowUp': next = selected < 0 ? index : index + 1; break;
      case 'PageDown': next = index - 10; break;
      case 'PageUp': next = index + 10; break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      case 'Enter': case ' ': if (selected >= 0) return; next = index; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    choose(next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const step = event.currentTarget.getBoundingClientRect().width / visibleTicks;
    drag.current = { pointer: event.pointerId, x: event.clientX, index, step, moved: false, lastIndex: selected };
    if (event.pointerType === 'mouse') event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = start.x - event.clientX;
    if (!start.moved && Math.abs(dx) < 8) return;
    start.moved = true;
    const position = Math.min(last, Math.max(0, start.index + dx / start.step));
    const next = Math.round(position);
    if (next !== start.lastIndex) {
      start.lastIndex = next;
      onChange(String(lists[next]));
    }
    setShift((next - position) * 100 / visibleTicks);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, tap = false) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    if (tap && !start.moved) {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      choose(index + Math.round((event.clientX - left - width / 2) / start.step));
    }
    drag.current = null;
    setShift(0);
  }

  return <div className="list-dial" role="group" aria-labelledby={id}>
    <div className="list-dial-heading" id={id}>{label}</div>
    {shortcuts.length > 0 && <div className="list-dial-shortcuts">
      {shortcuts.map(option => <button key={option.value} type="button" aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>}
    {current !== undefined && <div className="list-dial-controls">
      <button type="button" className="list-dial-arrow" aria-label="上一个 List"
        disabled={selected === 0} onClick={() => choose(selected < 0 ? index : index - 1)}><ChevronLeft size={21}/></button>
      <div className="list-dial-track" data-selected={selected >= 0} tabIndex={0} role="slider"
        aria-label={label} aria-valuemin={lists[0]} aria-valuemax={lists[last]} aria-valuenow={current}
        aria-valuetext={selected >= 0 ? `List ${current}` : `${shortcuts.find(option => option.value === value)?.label ?? '全部'}，可选择 List ${current}`}
        onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={event => endDrag(event, true)} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        <div className="list-dial-needle" aria-hidden="true"><strong>{selected >= 0 ? current : '—'}</strong><span>List</span></div>
        <div className="list-dial-ticks" aria-hidden="true" style={{ transform: `translateX(${shift}%)` }}>
          {tickOffsets.map(offset => {
            const list = lists[index + offset];
            const major = list !== undefined && (list === lists[0] || list === lists[last] || list % 5 === 0);
            return <span key={offset} className="list-dial-tick" data-visible={list !== undefined}
              data-major={major} data-current={offset === 0 && selected >= 0}
              style={{ left: `${50 + offset * 100 / visibleTicks}%` }}>
              {major && (offset !== 0 || selected < 0) && <span className="list-dial-tick-label">{list}</span>}<i/>
            </span>;
          })}
        </div>
      </div>
      <button type="button" className="list-dial-arrow" aria-label="下一个 List"
        disabled={selected === last} onClick={() => choose(selected < 0 ? index : index + 1)}><ChevronRight size={21}/></button>
    </div>}
  </div>;
}
