import axios from 'axios';

const OPENCAGE_API_KEY = '43b9274aa02e457e967b3a156ca56cf1';

export async function getCoordinatesFromName(namesite: string) {
  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        namesite
      )}&key=${OPENCAGE_API_KEY}`
    );

    const results = response.data.results;
    if (results.length > 0) {
      const { lat, lng } = results[0].geometry;
      return { latitude: lat, longitude: lng };
    } else {
      console.warn('No coordinates found for:', namesite);
      return null;
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}
