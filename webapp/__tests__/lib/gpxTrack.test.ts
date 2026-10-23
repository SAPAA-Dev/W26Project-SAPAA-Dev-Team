import {
  GpxTrackError,
  parseGpxTrackFile,
  parseGpxTrackText,
} from '../../lib/map/gpxTrack';

const VALID_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Site visit</name></metadata>
  <trk>
    <name>Walk to the lake</name>
    <trkseg>
      <trkpt lat="53.5461" lon="-113.4938"><ele>650.5</ele><time>2026-10-01T10:00:00Z</time></trkpt>
      <trkpt lat="53.5560" lon="-113.5010"><ele>651</ele><time>2026-10-01T10:12:30Z</time></trkpt>
      <trkpt lat="53.5702" lon="-113.5200"/>
    </trkseg>
  </trk>
</gpx>`;

const NO_TRACK_POINTS_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="53.5461" lon="-113.4938"><name>Parking</name></wpt>
</gpx>`;

const VALID_GPX_POINTS = [
  { lat: 53.5461, lon: -113.4938, ele: 650.5, time: '2026-10-01T10:00:00Z' },
  { lat: 53.556, lon: -113.501, ele: 651, time: '2026-10-01T10:12:30Z' },
  { lat: 53.5702, lon: -113.52, ele: null, time: null },
];

describe('parseGpxTrackText', () => {
  it('reads every trkpt in document order (US 2.0.9)', () => {
    expect(parseGpxTrackText(VALID_GPX)).toEqual(VALID_GPX_POINTS);
  });

  it('refuses a file that is not valid XML (AT3)', () => {
    // xmldom repairs a truncated tag instead of failing, so a file with no
    // XML structure at all is the broken-XML case.
    expect(() => parseGpxTrackText('this is not xml at all')).toThrow(GpxTrackError);
    try {
      parseGpxTrackText('this is not xml at all');
    } catch (error) {
      expect(error).toBeInstanceOf(GpxTrackError);
      expect((error as GpxTrackError).code).toBe('not-gpx');
      expect((error as GpxTrackError).message).toBe('The file is not a valid GPX track.');
    }
  });

  it('refuses XML whose root is not gpx (AT3)', () => {
    expect(() => parseGpxTrackText('<kml><trkpt lat="1" lon="2"/></kml>')).toThrow(GpxTrackError);
  });

  it('refuses a track point without coordinates (AT3)', () => {
    const noLat = '<gpx><trk><trkseg><trkpt lon="-113.5"/></trkseg></trk></gpx>';
    expect(() => parseGpxTrackText(noLat)).toThrow(GpxTrackError);

    const notANumber = '<gpx><trk><trkseg><trkpt lat="north" lon="-113.5"/></trkseg></trk></gpx>';
    expect(() => parseGpxTrackText(notANumber)).toThrow(GpxTrackError);
  });

  it('refuses a file with no trkpt elements (AT3)', () => {
    expect(() => parseGpxTrackText(NO_TRACK_POINTS_GPX)).toThrow(GpxTrackError);
    try {
      parseGpxTrackText(NO_TRACK_POINTS_GPX);
    } catch (error) {
      expect((error as GpxTrackError).code).toBe('no-track-points');
      expect((error as GpxTrackError).message).toBe('The GPX file has no track points.');
    }
  });
});

// jsdom has no TextEncoder, and the test files are ASCII.
function encode(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

describe('parseGpxTrackFile', () => {
  it('reads the same points from bytes as from text (AT4)', () => {
    const bytes = encode(VALID_GPX);
    expect(parseGpxTrackFile(bytes)).toEqual(VALID_GPX_POINTS);
  });

  it('refuses bytes of an invalid file (AT3)', () => {
    const bytes = encode('this is not xml at all');
    expect(() => parseGpxTrackFile(bytes)).toThrow(GpxTrackError);
  });
});
