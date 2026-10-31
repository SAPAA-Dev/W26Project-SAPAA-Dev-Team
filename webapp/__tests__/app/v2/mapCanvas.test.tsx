import React from 'react';
import { act, render } from '@testing-library/react';
import MapCanvas from '@/app/v2/_components/map/MapCanvas';

const mockHandlers: Record<string, (event: { error?: Error }) => void> = {};
const mockSetStyle = jest.fn();
const mockRelease = jest.fn();
jest.mock('maplibre-gl', () => ({
  Map: class {
    touchZoomRotate = { disableRotation: jest.fn() };
    setStyle = mockSetStyle;
    on(name: string, callback: (event: { error?: Error }) => void) { mockHandlers[name] = callback; }
    getCanvas() { return { addEventListener: jest.fn() }; }
    remove() {}
  },
  Popup: class { remove() {} },
}), { virtual: true });
jest.mock('@/components/map/SiteMap', () => ({ createPopupContent: jest.fn() }));
jest.mock('@/components/map/offlineProtocol', () => ({
  OFFLINE_MISS_MARKER: 'Not in offline cache',
  retainOfflineProtocol: jest.fn(),
  releaseOfflineProtocol: () => mockRelease(),
  makeTransformRequest: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

function mount(online: boolean, onMissingTiles = jest.fn()) {
  return { onMissingTiles, ...render(<MapCanvas
    sites={[]} boundaries={undefined} online={online} regions={[]} selected={null} hoverId={null}
    inset={{ top: 0, right: 0, bottom: 0, left: 0 }}
    onSelect={jest.fn()} onReady={jest.fn()} onOffline={jest.fn()} onMissingTiles={onMissingTiles}
  />) };
}

it('batches offline tile misses and ignores unrelated map errors', () => {
  const { onMissingTiles } = mount(false);
  act(() => {
    mockHandlers.error({ error: new Error('Not in offline cache: tile-a') });
    mockHandlers.error({ error: new Error('Not in offline cache: tile-b') });
    mockHandlers.error({ error: new Error('Another error') });
  });
  expect(onMissingTiles).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(500));
  expect(onMissingTiles).toHaveBeenCalledTimes(1);
  expect(onMissingTiles).toHaveBeenCalledWith(2);
});

it('does not count tile misses while online', () => {
  const { onMissingTiles } = mount(true);
  act(() => {
    mockHandlers.error({ error: new Error('Not in offline cache: tile-a') });
    jest.advanceTimersByTime(500);
  });
  expect(onMissingTiles).not.toHaveBeenCalled();
});

it('resets the missing-tile count after moving the map', () => {
  const { onMissingTiles } = mount(false);
  act(() => {
    mockHandlers.error({ error: new Error('Not in offline cache: tile-a') });
    jest.advanceTimersByTime(500);
    mockHandlers.moveend({});
  });
  expect(onMissingTiles).toHaveBeenLastCalledWith(0);
  act(() => {
    mockHandlers.error({ error: new Error('Not in offline cache: tile-b') });
    jest.advanceTimersByTime(500);
  });
  expect(onMissingTiles).toHaveBeenLastCalledWith(1);
});

it('cancels a pending tile-count update when the map closes', () => {
  const { onMissingTiles, unmount } = mount(false);
  act(() => mockHandlers.error({ error: new Error('Not in offline cache: tile-a') }));
  unmount();
  act(() => jest.advanceTimersByTime(500));
  expect(onMissingTiles).not.toHaveBeenCalled();
  expect(mockRelease).toHaveBeenCalledTimes(1);
});
