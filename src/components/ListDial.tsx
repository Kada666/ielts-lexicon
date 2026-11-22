import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './list-dial.css';

type Props = {
  label: string;
  lists: number[];
  value: string;
  onChange: (value: string) => void;
  shortcuts?: { value: string; label: string }[];
  unavailableLabel: string;
};

const listCount = 50;
const visibleTicks = 9;
const tickOffsets = Array.from({ length: visibleTicks + 2 }, (_, index) => index - 5);

export default function ListDial({ label, lists, value, onChange, shortcuts = [], unavailableLabel }: Props) {
  const id = useId();
  const listNumber = Number(value);
  const selected = Number.isInteger(listNumber) && listNumber >= 1 && listNumber <= listCount;
  const current = selected ? listNumber : 1;
  const available = lists.includes(current);
  const selectLabel = selected
    ? `List ${current}${available ? '' : `，${unavailableLabel}`}`
    : `${shortcuts.find(option => option.value === value)?.label ?? '全部'}，可选择 List ${current}`;
  const drag = useRef<{ pointer: number; x: number; start: number; step: number; moved: boolean; lastList: number } | null>(null);
  const [shift, setShift] = useState(0);

  function choose(next: number) {
    const list = String(Math.min(listCount, Math.max(1, next)));
    if (list !== value) onChange(list);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft': case 'ArrowDown': next = selected ? current - 1 : current; break;
      case 'ArrowRight': case 'ArrowUp': next = selected ? current + 1 : current; break;
      case 'PageDown': next = current - 10; break;
      case 'PageUp': next = current + 10; break;
      case 'Home': next = 1; break;
      case 'End': next = listCount; break;
      case 'Enter': case ' ': if (selected) return; next = current; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    choose(next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const step = event.currentTarget.getBoundingClientRect().width / visibleTicks;
    drag.current = { pointer: event.pointerId, x: event.clientX, start: current, step, moved: false, lastList: selected ? current : 0 };
    if (event.pointerType === 'mouse') event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = start.x - event.clientX;
    if (!start.moved && Math.abs(dx) < 8) return;
    start.moved = true;
    const position = Math.min(listCount, Math.max(1, start.start + dx / start.step));
    const next = Math.round(position);
    if (next !== start.lastList) {
      start.lastList = next;
      onChange(String(next));
    }
    setShift((next - position) * 100 / visibleTicks);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, tap = false) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    if (tap && !start.moved) {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      choose(current + Math.round((event.clientX - left - width / 2) / start.step));
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
    <div className="list-dial-controls">
      <button type="button" className="list-dial-arrow" aria-label="上一个 List"
        disabled={selected && current === 1} onClick={() => choose(selected ? current - 1 : current)}><ChevronLeft size={21}/></button>
      <div className="list-dial-track" data-selected={selected && available} tabIndex={0} role="slider"
        aria-label={label} aria-valuemin={1} aria-valuemax={listCount} aria-valuenow={current}
        aria-valuetext={selectLabel}
        onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={event => endDrag(event, true)} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        <div className="list-dial-needle" aria-hidden="true">
          <strong>{selected ? current : '—'}</strong><span>{selected && !available ? unavailableLabel : 'List'}</span>
        </div>
        <div className="list-dial-ticks" aria-hidden="true" style={{ transform: `translateX(${shift}%)` }}>
          {tickOffsets.map(offset => {
            const list = current + offset;
            const visible = list >= 1 && list <= listCount;
            const major = list === 1 || list % 5 === 0;
            return <span key={offset} className="list-dial-tick" data-visible={visible}
              data-major={major} data-current={offset === 0 && selected} data-available={lists.includes(list)}
              style={{ left: `${50 + offset * 100 / visibleTicks}%` }}>
              {major && (offset !== 0 || !selected) && <span className="list-dial-tick-label">{list}</span>}<i/>
            </span>;
          })}
        </div>
      </div>
      <button type="button" className="list-dial-arrow" aria-label="下一个 List"
        disabled={selected && current === listCount} onClick={() => choose(selected ? current + 1 : current)}><ChevronRight size={21}/></button>
    </div>
  </div>;
}
