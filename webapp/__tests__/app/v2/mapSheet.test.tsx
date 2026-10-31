import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import MapSheet from '@/app/v2/_components/map/MapSheet';

const mockAnimate = jest.fn();
const mockStart = jest.fn();
let mockDragEnd: (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => void;
jest.mock('motion/react', () => ({
  animate: (...args: unknown[]) => mockAnimate(...args),
  useDragControls: () => ({ start: mockStart }),
  useReducedMotion: () => true,
  useMotionValue: (initial: number) => {
    const React = jest.requireActual('react');
    const value = React.useRef(initial);
    return React.useRef({ get: () => value.current, set: (next: number) => { value.current = next; } }).current;
  },
}));
jest.mock('motion/react-m', () => {
  const React = jest.requireActual('react');
  return { section: React.forwardRef(function SheetSurface({ children, style, 'aria-label': label, onKeyDown, onDragEnd }: React.PropsWithChildren<{ style: React.CSSProperties; 'aria-label': string; onKeyDown: React.KeyboardEventHandler; onDragEnd: typeof mockDragEnd }>, ref: React.Ref<HTMLElement>) { mockDragEnd = onDragEnd; return <section ref={ref} onKeyDown={onKeyDown} aria-label={label} style={{ top: style.top, bottom: style.bottom }}>{children}</section>; }) };
});

beforeEach(() => {
  mockAnimate.mockReset();
  mockAnimate.mockImplementation((value, target) => value.set(target));
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.tagName === 'SECTION' ? 600 : 64; } });
  window.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) { this.callback = callback; }
    observe() { this.callback([], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  };
});

it('starts with a compact preview and expands details only on request', () => {
  const onDismiss = jest.fn();
  const onCover = jest.fn();
  render(<MapSheet mode="card" top={120} onCover={onCover} onDismissCard={onDismiss} preview={<p>Park preview</p>}><p>Full boundary details and color controls</p></MapSheet>);
  expect(screen.getByText('Park preview')).toBeVisible();
  expect(screen.queryByText('Full boundary details and color controls')).not.toBeInTheDocument();
  expect(onCover).toHaveBeenLastCalledWith(130);
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  expect(screen.getByText('Full boundary details and color controls')).toBeVisible();
  expect(onCover).toHaveBeenLastCalledWith(330);
  fireEvent.click(screen.getByRole('button', { name: 'Back to map' }));
  expect(screen.getByText('Park preview')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
  expect(onDismiss).toHaveBeenCalledWith(true);
  fireEvent.keyDown(screen.getByText('Park preview'), { key: 'Escape' });
  expect(onDismiss).toHaveBeenCalledTimes(2);
});

it('keeps list rows available and supports keyboard expansion and collapse', () => {
  render(<MapSheet mode="list" top={120} header="Two sites" onCover={jest.fn()} onDismissCard={jest.fn()}><p>Park row</p></MapSheet>);
  expect(screen.getByText('Park row')).toBeVisible();
  const expand = screen.getByRole('button', { name: 'Expand the list' });
  fireEvent.keyDown(expand, { key: 'ArrowUp' });
  fireEvent.keyDown(expand, { key: 'ArrowUp' });
  expect(screen.getByRole('button', { name: 'Collapse the list' })).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Collapse the list' }));
  expect(screen.getByRole('button', { name: 'Expand the list' })).toHaveAttribute('aria-expanded', 'false');
});

it('lets a swipe expand the list and a downward swipe dismiss selected details', () => {
  const onCover = jest.fn();
  const view = render(<MapSheet mode="list" top={120} header="Two sites" onCover={onCover} onDismissCard={jest.fn()}><p>Rows</p></MapSheet>);
  fireEvent.pointerDown(screen.getByText('Two sites'));
  expect(mockStart).toHaveBeenCalled();
  act(() => mockDragEnd(null, { offset: { y: -100 }, velocity: { y: -4000 } }));
  expect(screen.getByRole('button', { name: 'Collapse the list' })).toBeVisible();
  expect(onCover).toHaveBeenLastCalledWith(600);
  view.unmount();
  const dismiss = jest.fn();
  render(<MapSheet mode="card" top={120} preview="Park" onCover={jest.fn()} onDismissCard={dismiss}>Details</MapSheet>);
  act(() => mockDragEnd(null, { offset: { y: 5 }, velocity: { y: 0 } }));
  expect(dismiss).not.toHaveBeenCalled();
  act(() => mockDragEnd(null, { offset: { y: 100 }, velocity: { y: 0 } }));
  expect(dismiss).toHaveBeenCalledWith(false);
});
