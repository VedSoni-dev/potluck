import type { Space } from "./types";

/** The sample plan's id. A space with this id is the example: it is shown, never saved as someone's plan. */
export const SAMPLE_ID = "demo-ski-trip";

/* Fixed ids so the server render and the first client render match. */
export function demoSpace(): Space {
  const people = ["Maya", "Dev", "Priya", "Sam", "Jonah", "Lena"];
  return {
    v: 1,
    id: SAMPLE_ID,
    title: "Tahoe ski weekend",
    subtitle: "Fri Jan 16 – Mon Jan 19 · 6 friends · a cabin near Truckee",
    members: [
      { id: "m1", name: "Maya", color: "#d9480f" },
      { id: "m2", name: "Dev", color: "#5f3dc4" },
      { id: "m3", name: "Priya", color: "#0b7285" },
      { id: "m4", name: "Sam", color: "#c2255c" },
      { id: "m5", name: "Jonah", color: "#2b8a3e" },
      { id: "m6", name: "Lena", color: "#e67700" },
    ],
    pins: [
      {
        id: "p1",
        kind: "link",
        text: "Road conditions on I-80 (chains?)",
        url: "https://quickmap.dot.ca.gov/",
        by: "Dev",
      },
      {
        id: "p2",
        kind: "link",
        text: "Truckee forecast",
        url: "https://forecast.weather.gov/MapClick.php?lat=39.328&lon=-120.1833",
        by: "Priya",
      },
      { id: "p3", kind: "note", text: "Door code is in the group chat, not here.", by: "Maya" },
      { id: "p4", kind: "note", text: "Idea: snowshoe Sunday morning for anyone not skiing?", by: "Lena" },
      { id: "p5", kind: "note", text: "Check-in 4pm Fri, check-out 11am Mon.", by: "Maya" },
    ],
    tools: [
      {
        id: "t-seat",
        type: "seating",
        title: "Who sleeps where",
        by: "Maya",
        prompt: "who sleeps where at the cabin? loft fits 2, bunk room 3, queen room 2",
        tables: [
          { id: "loft", name: "Loft", seats: 2 },
          { id: "bunk", name: "Bunk room", seats: 3 },
          { id: "queen", name: "Queen room", seats: 2 },
        ],
        guests: [
          { id: "g1", name: "Maya", tableId: "queen" },
          { id: "g2", name: "Dev", tableId: "queen" },
          { id: "g3", name: "Priya", tableId: "loft" },
          { id: "g4", name: "Sam", tableId: "bunk" },
          { id: "g5", name: "Jonah", tableId: "bunk" },
          { id: "g6", name: "Lena", tableId: null },
        ],
      },
      {
        id: "t-poll",
        type: "poll",
        title: "Saturday dinner",
        by: "Priya",
        prompt: "dinner poll for saturday night",
        question: "What are we doing for dinner Saturday?",
        options: [
          { id: "o1", label: "Taco night at the cabin", votes: ["Maya", "Dev", "Lena"] },
          { id: "o2", label: "Fondue place in town", votes: ["Priya", "Sam"] },
          { id: "o3", label: "Pizza delivery + hot tub", votes: ["Jonah"] },
        ],
      },
      {
        id: "t-exp",
        type: "expenses",
        title: "Trip costs",
        by: "Dev",
        prompt: "split the cabin, groceries and gas",
        currency: "$",
        people,
        items: [
          { id: "e1", label: "Cabin, 3 nights", amount: 1260, paidBy: "Maya", split: people },
          { id: "e2", label: "Groceries + firewood", amount: 214.6, paidBy: "Dev", split: people },
          { id: "e3", label: "Gas, Priya's car", amount: 86, paidBy: "Priya", split: ["Priya", "Sam", "Jonah"] },
          { id: "e4", label: "Board rentals", amount: 180, paidBy: "Sam", split: ["Sam", "Lena"] },
        ],
      },
      {
        id: "t-itin",
        type: "itinerary",
        title: "The weekend",
        by: "Maya",
        prompt: "plan fri to mon, we leave SF friday at 4",
        days: [
          {
            id: "d1",
            label: "Fri · Jan 16",
            items: [
              { id: "i1", time: "4:00 PM", text: "Meet at Maya's, load the cars" },
              { id: "i2", time: "8:30 PM", text: "Arrive at the cabin, grocery drop" },
            ],
          },
          {
            id: "d2",
            label: "Sat · Jan 17",
            items: [
              { id: "i3", time: "8:30 AM", text: "First chair, meet at the lodge for lunch" },
              { id: "i4", time: "4:30 PM", text: "Après, then hot tub" },
              { id: "i5", time: "7:30 PM", text: "Dinner (see poll)" },
            ],
          },
          {
            id: "d3",
            label: "Sun · Jan 18",
            items: [
              { id: "i6", time: "9:00 AM", text: "Ski day 2 / snowshoe crew" },
              { id: "i7", time: "8:00 PM", text: "Ping-pong cup final" },
            ],
          },
          {
            id: "d4",
            label: "Mon · Jan 19",
            items: [{ id: "i8", time: "11:00 AM", text: "Check out, lunch stop on the drive" }],
          },
        ],
      },
      {
        id: "t-check",
        type: "checklist",
        title: "Who brings what",
        by: "Lena",
        prompt: "list of who brings what",
        items: [
          { id: "c1", text: "Snow chains", done: true, who: "Dev" },
          { id: "c2", text: "Hot cocoa + marshmallows", done: true, who: "Priya" },
          { id: "c3", text: "Bluetooth speaker", done: false, who: "Sam" },
          { id: "c4", text: "Board games", done: false, who: "Lena" },
          { id: "c5", text: "First-aid kit", done: false, who: "Maya" },
          { id: "c6", text: "Taco fixings", done: false, who: "Jonah" },
        ],
      },
      {
        id: "t-brk",
        type: "bracket",
        title: "Cabin ping-pong cup",
        by: "Sam",
        prompt: "ping pong bracket for all 6 of us",
        entrants: people,
        winners: { "0-2": "Sam", "0-3": "Lena", "1-1": "Lena" },
      },
    ],
  };
}
