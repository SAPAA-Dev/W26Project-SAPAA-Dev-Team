import { setWorkerUrl } from 'maplibre-gl';

// MapLibre builds its worker URL at run time from a template no bundler can rewrite, so the
// request lands on a missing path and the map never loads. A static new URL() here lets
// Turbopack emit the worker file and substitute its real path instead. The worker is a
// standalone bundle with no imports, so nothing has to be published beside it.
//
// This lives in its own module because Jest runs CommonJS, where import.meta is a syntax error.
// jest.config.ts maps this module to a stub. See __mocks__/enableMapLibreWorker.ts.
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href);
