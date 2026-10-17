import { preconnect } from 'react-dom';
import { STYLE_URL } from './mapStyle';

let started = false;

/**
 * Download and evaluate the map's code before the user opens it: MapLibre is the heaviest chunk in the app,
 * and the basemap host gets a warm connection. Called on idle from the list and on intent (Map toggle).
 */
export function preloadMap() {
  if (started) return;
  started = true;
  preconnect(new URL(STYLE_URL).origin, { crossOrigin: 'anonymous' });
  Promise.all([import('./SitesMap'), import('./MapCanvas')]).catch(() => {
    started = false; // offline: the next intent tries again
  });
}
