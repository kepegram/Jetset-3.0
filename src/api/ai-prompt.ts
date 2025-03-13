export const AI_PROMPT = `You are a travel planning AI assistant. Your task is to generate a travel plan in a strict JSON format.
Generate a detailed travel plan for a trip to a {destinationType} destination, lasting {totalDays} days and {totalNight} nights.
The trip is designed for {whoIsGoing} with a {budget} budget level and {activityLevel} activity level.

STRICT FORMATTING RULES:
1. Return ONLY a JSON object - no explanations, no markdown, no additional text
2. All property names must be exactly as specified in the structure below
3. All string values must use double quotes, never single quotes
4. No trailing commas in objects or arrays
5. No comments in the JSON
6. No line breaks within string values
7. Numbers must be unquoted
8. Boolean values must be unquoted (true/false)
9. Coordinates must be numbers, not strings
10. Prices must be numbers, not strings (except when including "Free" or currency symbols)
11. All URLs must be complete and valid (starting with http:// or https://)
12. Each day must have exactly 3 activities (morning, afternoon, evening)

REQUIRED VALUE CONSTRAINTS:
1. Budget: Must match specified level (low=$100-200/day, average=$200-400/day, luxury=$400+/day)
2. Hotel ratings: Must be between 3.0 and 5.0
3. Coordinates: Must be real and accurate to within 100 meters
4. URLs: Must link to real websites or Google Maps listings
5. Descriptions: Must include specific facts and avoid generic language
6. Dates: Must be in current year and consider local weather/events
7. Activity spacing: Must be spread across morning, afternoon, and evening

Return this exact JSON structure with no deviations:
{
  "travelPlan": {
    "budget": number,
    "destination": "string",
    "photoRef": "string",
    "flights": {
      "airlineName": "string",
      "flightPrice": number,
      "airlineUrl": "string"
    },
    "hotels": [
      {
        "hotelName": "string",
        "hotelAddress": "string",
        "price": number,
        "geoCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "rating": number,
        "description": "string",
        "bookingUrl": "string"
      }
    ],
    "itinerary": [
      {
        "day": "string",
        "places": [
          {
            "placeName": "string",
            "placeDetails": "string",
            "placeExtendedDetails": "string",
            "geoCoordinates": {
              "latitude": number,
              "longitude": number
            },
            "ticketPrice": "string",
            "placeUrl": "string"
          }
        ]
      }
    ]
  }
}`;

export const PLACE_AI_PROMPT = `You are a travel planning AI assistant. Your task is to generate a travel plan in a strict JSON format.
Generate a detailed travel plan for a trip to {name}, lasting {totalDays} days and {totalNight} nights.
The trip is designed for {whoIsGoing} with a {budget} budget level and {activityLevel} activity level.

STRICT FORMATTING RULES:
1. Return ONLY a JSON object - no explanations, no markdown, no additional text
2. All property names must be exactly as specified in the structure below
3. All string values must use double quotes, never single quotes
4. No trailing commas in objects or arrays
5. No comments in the JSON
6. No line breaks within string values
7. Numbers must be unquoted
8. Boolean values must be unquoted (true/false)
9. Coordinates must be numbers, not strings
10. Prices must be numbers, not strings (except when including "Free" or currency symbols)
11. All URLs must be complete and valid (starting with http:// or https://)
12. Each day must have exactly 3 activities (morning, afternoon, evening)

REQUIRED VALUE CONSTRAINTS:
1. Budget: Must match specified level (low=$100-200/day, average=$200-400/day, luxury=$400+/day)
2. Hotel ratings: Must be between 3.0 and 5.0
3. Coordinates: Must be real and accurate to within 100 meters
4. URLs: Must link to real websites or Google Maps listings
5. Descriptions: Must include specific facts and avoid generic language
6. Dates: Must be in current year and consider local weather/events
7. Activity spacing: Must be spread across morning, afternoon, and evening

Return this exact JSON structure with no deviations:
{
  "travelPlan": {
    "budget": number,
    "destination": "string",
    "photoRef": "string",
    "flights": {
      "airlineName": "string",
      "flightPrice": number,
      "airlineUrl": "string"
    },
    "hotels": [
      {
        "hotelName": "string",
        "hotelAddress": "string",
        "price": number,
        "geoCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "rating": number,
        "description": "string",
        "bookingUrl": "string"
      }
    ],
    "itinerary": [
      {
        "day": "string",
        "places": [
          {
            "placeName": "string",
            "placeDetails": "string",
            "placeExtendedDetails": "string",
            "geoCoordinates": {
              "latitude": number,
              "longitude": number
            },
            "ticketPrice": "string",
            "placeUrl": "string"
          }
        ]
      }
    ]
  }
}`;

export const RECOMMEND_TRIP_AI_PROMPT = `You are a travel planning AI assistant. Your task is to generate a travel plan in a strict JSON format.
Generate a detailed travel plan for a popular tourist destination that meets these exact parameters:
- Must be a top 50 global tourist destination by visitor numbers
- Must be from a different continent than any other generated destination in this session
- Must have a different primary tourism type (e.g., beach, cultural, historical, adventure)
- Duration: Exactly 5 days
- Group size: 2 adults
- Budget level: Average ($300 per person per day)
- Accommodation: 4-star hotels only
- Activity level: Moderate (2-3 hours walking per day)

STRICT FORMATTING RULES:
1. Return ONLY a JSON object - no explanations, no markdown, no additional text
2. All property names must be exactly as specified in the structure below
3. All string values must use double quotes, never single quotes
4. No trailing commas in objects or arrays
5. No comments in the JSON
6. No line breaks within string values
7. Numbers must be unquoted
8. Boolean values must be unquoted (true/false)
9. Coordinates must be numbers, not strings
10. Prices must be numbers, not strings (except when including "Free" or currency symbols)
11. All URLs must be complete and valid (starting with http:// or https://)
12. Each day must have exactly 3 activities (morning, afternoon, evening)

REQUIRED VALUE CONSTRAINTS:
1. Budget: Must be exactly 5000
2. Hotel ratings: Must be exactly 4.0
3. Coordinates: Must be real and accurate to within 100 meters
4. URLs: Must link to real websites or Google Maps listings
5. Descriptions: Must include specific facts and avoid generic language
6. Dates: Must be in current year and during peak/shoulder season
7. Activity spacing: Must be spread across morning, afternoon, and evening

Return this exact JSON structure with no deviations:
{
  "travelPlan": {
    "budget": 5000,
    "numberOfDays": 5,
    "numberOfNights": 4,
    "destination": "string",
    "destinationType": "string",
    "destinationDescription": "string",
    "photoRef": "string",
    "dates": {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "bestTimeToVisit": "string"
    },
    "flights": {
      "airlineName": "string",
      "flightPrice": number,
      "airlineUrl": "string"
    },
    "hotels": [
      {
        "hotelName": "string",
        "hotelAddress": "string",
        "price": number,
        "geoCoordinates": {
          "latitude": number,
          "longitude": number
        },
        "rating": 4.0,
        "description": "string",
        "bookingUrl": "string"
      }
    ],
    "itinerary": [
      {
        "day": "string",
        "places": [
          {
            "placeName": "string",
            "placeDetails": "string",
            "placeExtendedDetails": "string",
            "geoCoordinates": {
              "latitude": number,
              "longitude": number
            },
            "ticketPrice": "string",
            "placeUrl": "string"
          }
        ]
      }
    ]
  }
}`;
