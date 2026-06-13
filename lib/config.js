export const DEFAULT_SUBWAY_STOP = "R03S"; // Astoria Blvd, Manhattan-bound (N/W)
export const DEFAULT_BUS_STOP = process.env.M60_STOP_ID || "";
export const DEFAULT_BUS_LINE = "MTA NYCT_M60+SBS"; // westbound M60 at Hoyt Av/31 St

// MTA GTFS-Realtime protobuf feeds — no API key required
export const SUBWAY_FEEDS = {
  "1234567": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  nqrw: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  ace: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  bdfm: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  g: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
  jz: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
  l: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
  si: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si",
};

// Maps every subway route letter/number to its feed group key above
export const ROUTE_TO_FEED = {
  N: "nqrw", Q: "nqrw", R: "nqrw", W: "nqrw",
  A: "ace",  C: "ace",  E: "ace",
  B: "bdfm", D: "bdfm", F: "bdfm", M: "bdfm",
  G: "g",
  J: "jz",   Z: "jz",
  L: "l",
  "1": "1234567", "2": "1234567", "3": "1234567",
  "4": "1234567", "5": "1234567", "6": "1234567", "7": "1234567",
  SI: "si",
};
