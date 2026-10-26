import { addProtocol, removeProtocol } from 'maplibre-gl';
import type { AddProtocolAction, RequestTransformFunction } from 'maplibre-gl';

import { getCachedResponse } from '@/lib/map/offline/tileCache';

// The badge in SiteMap filters map error events on this text, so one constant
// keeps the protocol message and the badge in step.
export const OFFLINE_MISS_MARKER = 'Not in offline cache';

const OFFLINE_SCHEME = 'sapaa-offline';
const SCHEME_PREFIX = `${OFFLINE_SCHEME}://`;
const PROTOMAPS_ORIGIN = 'https://api.protomaps.com/';

// addProtocol and removeProtocol write one global registry, and two maps can be
// mounted at once during a page change, so a reference count owns the registration.
let protocolUsers = 0;

export function retainOfflineProtocol(): void {
  protocolUsers += 1;
  if (protocolUsers === 1) {
    addProtocol(OFFLINE_SCHEME, makeOfflineProtocolHandler(getCachedResponse));
  }
}

export function releaseOfflineProtocol(): void {
  protocolUsers = Math.max(0, protocolUsers - 1);
  if (protocolUsers === 0) removeProtocol(OFFLINE_SCHEME);
}

function decodeOfflineUrl(url: string): string {
  return url.startsWith(SCHEME_PREFIX) ? url.slice(SCHEME_PREFIX.length) : url;
}

export function makeTransformRequest(online: () => boolean): RequestTransformFunction {
  return (url) => {
    if (online()) return undefined;
    // The trailing slash keeps a look-alike host such as api.protomaps.com.evil
    // out of the offline path.
    if (!url.startsWith(PROTOMAPS_ORIGIN)) return undefined;
    return { url: `${OFFLINE_SCHEME}://${url}` };
  };
}

function makeOfflineProtocolHandler(
  lookup: (url: string) => Promise<Response | null>
): AddProtocolAction {
  return async (requestParameters) => {
    const realUrl = decodeOfflineUrl(requestParameters.url);
    const response = await lookup(realUrl);
    if (response === null) {
      throw new Error(`${OFFLINE_MISS_MARKER}: ${realUrl}`);
    }
    if (requestParameters.type === 'json') {
      return { data: await response.json() };
    }
    if (requestParameters.type === 'string') {
      return { data: await response.text() };
    }
    return { data: await response.arrayBuffer() };
  };
}
