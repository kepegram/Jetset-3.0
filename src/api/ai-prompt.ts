export const AI_PROMPT = `Generate a detailed and realistic JSON Travel Plan for a trip to a {destinationType} destination, lasting {totalDays} days and {totalNight} nights.
The trip is designed for {whoIsGoing} with a {budget} budget level
and the desired activity level is {activityLevel}. Please tailor all recommendations accordingly.

Important requirements:
- All prices must be realistic and match the specified budget level (low=$100-200/day, average=$200-400/day, luxury=$400+/day)
- Hotel ratings must be between 3-5 stars, with at least one 4+ star option
- Include exactly 3 activities/places per day in the itinerary, spaced throughout morning, afternoon and evening
- All coordinates must be real and accurate to within 100 meters
- All URLs must link to official websites or Google Maps listings
- Descriptions must include specific facts, dates, and historical context
- Avoid generic descriptions and marketing language

Return ONLY a valid JSON object with this exact structure:
{
  "travelPlan": {
    "budget": "Total estimated cost in USD (sum of all components)",
    "destination": "Full destination name including city, region and country",
    "photoRef": "Google Places photo reference for destination",
    "flights": {
      "airlineName": "Major international airline name",
      "flightPrice": "Average round-trip price in USD",
      "airlineUrl": "Direct URL to airline's booking page"
    },
    "hotels": [
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code",
        "price": "Price per night in USD (integer)",
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      },
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code", 
        "price": "Price per night in USD (integer)",
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      },
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code",
        "price": "Price per night in USD (integer)", 
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      }
    ],
    "itinerary": [
      {
        "day": "Day X: Theme for the day",
        "places": [
          {
            "placeName": "Official attraction name",
            "placeDetails": "Key highlights and practical visitor information",
            "placeExtendedDetails": "Historical background, architectural details, cultural significance and insider tips",
            "geoCoordinates": {
              "latitude": "Decimal coordinates to 6 decimal places",
              "longitude": "Decimal coordinates to 6 decimal places"
            },
            "ticketPrice": "Price in USD or 'Free' (include student/senior discounts if available)",
            "placeUrl": "Direct URL to official website or Google Maps"
          }
        ]
      }
    ]
  }
}`;

export const PLACE_AI_PROMPT = `Generate a detailed and realistic JSON Travel Plan for a trip to {name}, lasting {totalDays} days and {totalNight} nights.
The trip is designed for {whoIsGoing} with a {budget} budget level
and the desired activity level is {activityLevel}. Please tailor all recommendations accordingly.

Important requirements:
- All prices must be realistic and match the specified budget level (low=$100-200/day, average=$200-400/day, luxury=$400+/day)
- Hotel ratings must be between 3-5 stars, with at least one 4+ star option
- Include exactly 3 activities/places per day in the itinerary, spaced throughout morning, afternoon and evening
- All coordinates must be real and accurate to within 100 meters
- All URLs must link to official websites or Google Maps listings
- Descriptions must include specific facts, dates, and historical context
- Avoid generic descriptions and marketing language

Return ONLY a valid JSON object with this exact structure:
{
  "travelPlan": {
    "budget": "Total estimated cost in USD (sum of all components)",
    "destination": "Full destination name including city, region and country",
    "photoRef": "Google Places photo reference for destination",
    "flights": {
      "airlineName": "Major international airline name",
      "flightPrice": "Average round-trip price in USD",
      "airlineUrl": "Direct URL to airline's booking page"
    },
    "hotels": [
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code",
        "price": "Price per night in USD (integer)",
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      },
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code",
        "price": "Price per night in USD (integer)",
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      },
      {
        "hotelName": "Full official hotel name",
        "hotelAddress": "Complete street address with postal code",
        "price": "Price per night in USD (integer)",
        "geoCoordinates": {
          "latitude": "Decimal coordinates to 6 decimal places",
          "longitude": "Decimal coordinates to 6 decimal places"
        },
        "rating": "Rating out of 5 to one decimal place",
        "description": "Factual description including room types, amenities and recent renovations",
        "bookingUrl": "Direct URL to hotel's booking page"
      }
    ],
    "itinerary": [
      {
        "day": "Day X: Theme for the day",
        "places": [
          {
            "placeName": "Official attraction name",
            "placeDetails": "Key highlights and practical visitor information",
            "placeExtendedDetails": "Historical background, architectural details, cultural significance and insider tips",
            "geoCoordinates": {
              "latitude": "Decimal coordinates to 6 decimal places",
              "longitude": "Decimal coordinates to 6 decimal places"
            },
            "ticketPrice": "Price in USD or 'Free' (include student/senior discounts if available)",
            "placeUrl": "Direct URL to official website or Google Maps"
          }
        ]
      }
    ]
  }
}`;

export const RECOMMEND_TRIP_AI_PROMPT = `Generate a detailed and realistic JSON Travel Plan for a popular tourist destination that meets these exact parameters:
- Must be a top 50 global tourist destination by visitor numbers
- Must be from a different continent than any other generated destination in this session
- Must have a different primary tourism type (e.g., beach, cultural, historical, adventure) than other destinations
- Duration: Exactly 5 days
- Group size: 2 adults
- Budget level: Average ($300 per person per day)
- Accommodation: 4-star hotels only
- Activity level: Moderate (2-3 hours walking per day)

Important diversity requirements:
- Each destination must be from a different continent
- Each destination must offer a different primary type of tourism experience
- Destinations should vary in climate and setting (e.g., not all tropical beaches)
- Cultural and geographical diversity must be maintained

Important date requirements:
- Start date must be in the current year
- Dates must be during the destination's peak or shoulder season
- Consider local weather patterns and events
- Avoid major holidays unless they are a key attraction
- Format dates as ISO strings (YYYY-MM-DD)

Important formatting requirements:
- Response must be ONLY valid JSON - no additional text before or after
- All JSON properties must be wrapped in double quotes
- No trailing commas in arrays or objects
- No comments in the JSON
- No line breaks within string values
- All numbers must be unquoted
- Boolean values must be unquoted (true/false)

Return this exact JSON structure:
{
  "travelPlan": {
    "budget": "5000",
    "numberOfDays": 5,
    "numberOfNights": 4,
    "destination": "City, Region, Country",
    "destinationType": "Primary tourism type (Beach/Cultural/Historical/Adventure)",
    "destinationDescription": "Single line description",
    "photoRef": "photo_reference_string",
    "dates": {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "bestTimeToVisit": "Brief explanation of why these dates are optimal"
    },
    "flights": {
      "airlineName": "Airline Name",
      "flightPrice": "1200",
      "airlineUrl": "https://example.com"
    },
    "hotels": [
      {
        "hotelName": "Hotel Name",
        "hotelAddress": "Full Address",
        "price": 200,
        "geoCoordinates": {
          "latitude": 12.345678,
          "longitude": -12.345678
        },
        "rating": 4.0,
        "description": "Single line description",
        "bookingUrl": "https://example.com"
      }
    ],
    "itinerary": [
      {
        "day": "Day 1: Theme",
        "places": [
          {
            "placeName": "Place Name",
            "placeDetails": "Single line details",
            "placeExtendedDetails": "Single line extended details",
            "geoCoordinates": {
              "latitude": 12.345678,
              "longitude": -12.345678
            },
            "ticketPrice": "Free",
            "placeUrl": "https://example.com"
          }
        ]
      }
    ]
  }
}`;
