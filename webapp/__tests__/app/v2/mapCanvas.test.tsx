import React from 'react';
import { act, render } from '@testing-library/react';
import MapCanvas from '@/app/v2/_components/map/MapCanvas';

const mockHandlers: Record<string, (event: { error?: Error }) => void> = {};
const mockSetStyle = jest.fn();
const mockRelease = jest.fn();
const mockSetData = jest.fn();
const mockCanvas = { addEventListener: jest.fn(), style: { cursor: '' } };
const mockMap = {
  style: {}, touchZoomRotate: { disableRotation: jest.fn() }, setStyle: mockSetStyle,
  on: (name: string, callback: (event: { error?: Error }) => void) => { mockHandlers[name] = callback; },
  getCanvas: () => mockCanvas,
  getStyle: () => ({ glyphs: 'glyphs', layers: [{ id: 'labels', type: 'symbol' }] }),
  addSource: jest.fn(), addLayer: jest.fn(), getSource: () => ({ setData: mockSetData }),
  getLayer: () => ({}), setFilter: jest.fn(), setFeatureState: jest.fn(),
  fitBounds: jest.fn(), flyTo: jest.fn(), jumpTo: jest.fn(), getZoom: () => 7,
  queryRenderedFeatures: jest.fn(), project: (coordinates: number[]) => ({ x: coordinates[0], y: coordinates[1] }),
  remove: jest.fn(),
};
jest.mock('maplibre-gl', () => ({
  Map: jest.fn(() => mockMap),
  Popup: class {
    remove() {}
    setLngLat() { return this; }
    setDOMContent() { return this; }
    addTo() { return this; }
  },
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
  mockMap.queryRenderedFeatures.mockReturnValue([]);
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
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

it('loads overlays, keeps the nearest pin selectable, and fits the filtered sites', () => {
  const site = { id: 1, slug: 'Park', name: 'Park', center: [-113, 53], status: 'due' } as import('@/lib/api/v1/types').SiteSummary;
  const onSelect = jest.fn();
  const onReady = jest.fn();
  const props = { sites: [site], boundaries: undefined, online: true, regions: [], selected: null, hoverId: null,
    inset: { top: 0, right: 0, bottom: 0, left: 0 }, onSelect, onReady, onOffline: jest.fn(), onMissingTiles: jest.fn() };
  const view = render(<MapCanvas {...props} />);
  act(() => mockHandlers['style.load']({}));
  act(() => jest.runOnlyPendingTimers());
  expect(onReady).toHaveBeenCalledWith(mockMap);
  expect(mockMap.addLayer).toHaveBeenCalled();
  expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({ features: [expect.objectContaining({ id: 1, properties: expect.objectContaining({ slug: 'Park' }) })] }));
  expect(mockMap.fitBounds).toHaveBeenCalledWith([[-113, 53], [-113, 53]], expect.objectContaining({ duration: 0 }));
  mockMap.queryRenderedFeatures.mockReturnValue([
    { id: 2, geometry: { coordinates: [50, 50] }, properties: { slug: 'Far', name: 'Far', st: 'due' } },
    { id: 1, geometry: { coordinates: [5, 5] }, properties: { slug: 'Park', name: 'Park', st: 'due' } },
  ]);
  const click = mockHandlers.click as (event: unknown) => void;
  act(() => click({ point: { x: 5, y: 5 }, lngLat: [-113, 53] }));
  expect(onSelect).toHaveBeenCalledWith('Park');
  const hover = mockHandlers.mousemove as (event: unknown) => void;
  act(() => hover({ point: { x: 5, y: 5 }, lngLat: [-113, 53] }));
  expect(mockCanvas.style.cursor).toBe('pointer');
  view.rerender(<MapCanvas {...props} selected={site} hoverId={1} online={false} />);
  expect(mockMap.setFeatureState).toHaveBeenCalledWith({ source: 'sites', id: 1 }, { selected: true });
  expect(mockMap.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [-113, 53], zoom: 8.8 }));
  expect(mockSetStyle).toHaveBeenCalledWith(expect.anything(), { diff: false });
  mockMap.queryRenderedFeatures.mockReturnValue([]);
  act(() => click({ point: { x: 0, y: 0 }, lngLat: [0, 0] }));
  expect(onSelect).toHaveBeenLastCalledWith(null);
  act(() => hover({ point: { x: 0, y: 0 }, lngLat: [0, 0] }));
  expect(mockCanvas.style.cursor).toBe('');
  view.rerender(<MapCanvas {...props} />);
  expect(mockMap.setFeatureState).toHaveBeenCalledWith({ source: 'sites', id: 1 }, { selected: false });
});
