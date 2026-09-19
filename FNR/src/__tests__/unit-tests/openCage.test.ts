import axios from 'axios';
import { getCoordinatesFromName } from '../../services/openCage';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenCage getCoordinatesFromName', () => {
  it('returns coordinates when OpenCage API returns results', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        results: [
          { geometry: { lat: 51.5074, lng: -0.1278 } } // London example
        ]
      }
    });

    const coords = await getCoordinatesFromName('London');
    expect(coords).toEqual({ latitude: 51.5074, longitude: -0.1278 });
  });

  it('returns null and warns when OpenCage API returns no results', async () => {
    // Temporarily spy on console.warn to prevent noise
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockedAxios.get.mockResolvedValue({ data: { results: [] } });

    const coords = await getCoordinatesFromName('Nonexistent Place');
    expect(coords).toBeNull();

    warnSpy.mockRestore(); // restore console.warn
  });

  it('returns null and logs error when OpenCage API call fails', async () => {
    // Temporarily spy on console.error to prevent noise
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const coords = await getCoordinatesFromName('Any Place');
    expect(coords).toBeNull();

    errorSpy.mockRestore(); // restore console.error
  });
});
