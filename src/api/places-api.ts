export const getPhotoReference = async (
  placeId: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      // @ts-ignore
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${process.env.EXPO_PUBLIC_GOOGLE_MAP_KEY}`
    );

    const data = await response.json();

    if (data.result?.photos?.[0]?.photo_reference) {
      return data.result.photos[0].photo_reference;
    }

    return null;
  } catch (error) {
    console.error("Error fetching photo reference:", error);
    return null;
  }
};
