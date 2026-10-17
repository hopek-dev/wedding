import { WEDDING_SITE_URL } from "@/lib/site";

// Everything the public wedding website says that isn't pulled from the planner.
// Taken from the couple's Joy website. Edit the text here; the schedule, RSVP
// deadline and dress code come from the planner itself, so they never go stale.

export const WEDDING = {
  names: "Vanessa & Hope",
  date: "2027-03-15", // YYYY-MM-DD
  welcome: "We’re so excited to celebrate our big day with you!",
};

export const VENUE = {
  name: "Mulberry House",
  address: ["Chelmsford Road", "High Ongar", "Ongar, Essex", "CM5 9NL"],
  lat: 51.712352,
  lng: 0.260324,
};

export const mapLink = `https://www.google.com/maps/search/?api=1&query=${VENUE.lat},${VENUE.lng}`;
export const mapEmbed = `https://www.google.com/maps?q=${VENUE.lat},${VENUE.lng}&z=14&output=embed`;

export const STORY = [
  "It began on a Monday evening, 22nd April 2024, in a softly lit bar in Soho. One drink became an evening stroll, and by the time we parted we already knew we weren’t ready to say goodbye.",
  "We swore we’d see each other again on Wednesday. Vanessa, the sensible one of the two of us, gently vetoed it, so we made it Friday instead. Dinner stretched on and on, and neither of us noticed the tables emptying around us, the chairs being turned up, the candles burning low. We were lost in a world of our own making.",
  "After that, we chased every excuse to be together. We walked the canal as the evening light turned to gold, and wandered through as many parks as London could offer. We laughed at comedy shows and sat in the hush of the theatre. We even sat through a very questionable two-person stage drama, which we will never speak of again (sorry to the cast).",
  "It didn’t matter where we were or what we were doing. All that mattered was that we were together.",
];

// Short questions and answers shown under the story.
export const STORY_QA: Array<{ q: string; a: string }> = [
  { q: "What is your favourite movie?", a: "There are so many: The Great Debaters, Gladiator II, American Gangster... basically anything with Denzel!" },
  { q: "What’s your favourite thing to do together?", a: "DIY, gardening and a quiet evening watching a good show and munching on some popcorn. Well, at least one of us watches the show :P" },
  { q: "Where are you heading for your honeymoon?", a: "Anywhere with gorgeous beaches, or some greenery, or both. Maybe Barbados?" },
  { q: "What’s the best meal you’ve shared together?", a: "7 course dinner at Dvor, Split, Croatia. Simply amazing!" },
  { q: "What’s the most memorable trip you’ve been on together?", a: "Ghana in 2024, when Vanessa was in Ghana for the very first time and met Hope’s family :)" },
  { q: "Who’s taking out the bins?", a: "Hope, if he ever remembers :)" },
];

// The Travel page. Edit the wording here.
export const TRAVEL = {
  gettingHere:
    "If you are travelling from outside the UK, the airports closest to the venue are London Stansted Airport and London Luton Airport.",
  waysIntro: "There are plenty of ways to get to Mulberry House!",
  ways: [
    {
      title: "Navigation",
      text: "If using Apple Maps, please use the venue’s address and not the postcode. If you are using Google Maps, CM5 9NL takes you directly to Mulberry. The venue is located on the A414, approximately 100 yards from High Ongar, on the left, as you travel towards Chipping Ongar.",
    },
    {
      title: "Train",
      text: "You can take the Greater Anglia train from London Liverpool Street Station to Chelmsford and take the 32 bus to High Ongar Church. The venue is an 8 minute walk from there.",
    },
    {
      title: "Car",
      text: "The venue is a 1 hour drive from London Liverpool Street Station, 30 minutes from London Stansted, 1 hour from London Luton and 1.5 hours from London Heathrow.",
    },
  ],
  venueWebsite: "https://www.mulberry-house.com",
  venueWebsiteLabel: "mulberry-house.com",
  venuePhone: "+44 1277 365398",
  highSeason: {
    heading: "High season in London",
    text: "March is not a particularly busy period in London compared with summer, but please leave plenty of time for the inevitable traffic, and book your accommodation well in advance to get the best prices.",
  },
};

// The Our London page: the couple's own recommendations for the days around the wedding. In the text, [words](address) becomes a link, so every place named
// can be opened. A name's own "url" links its heading.
export const LONDON = {
  intro: "Our favourite places and things to do while you’re in town.",
  favouriteBars: {
    heading: "Our Special Spots in the City",
    items: [
      {
        name: "Swift",
        url: "https://soho.barswift.com",
        text: "We don’t go to many bars, but we had our first date here, and returned on the night of our engagement, so there must be something in the air there :)",
      },
      { name: "Hawksmoor", url: "https://thehawksmoor.com", text: "Our second date. We talked for so long and laughed so hard, we knew there was no world where we wouldn’t be together." },
    ],
  },
  thingsWeLove: {
    heading: "Things we love to do in London",
    items: [
      {
        name: "Visit the theatre",
        text: "Some of our favourites are [Hamilton](https://hamiltonmusical.com/london), Guys and Dolls, [Tina!](https://tinathemusical.com), [MJ the Musical](https://mjthemusical.com) and [Book of Mormon](https://thebookofmormonmusical.com).",
      },
      {
        name: "Comedy",
        text: "London is full of comedy clubs with classic British humour. Our favourites are the [Comedy Store](https://london.thecomedystore.co.uk) and [Top Secret Comedy Club](https://topsecretcomedyclub.co.uk).",
      },
      { name: "Music", text: "We love to escape and discover new artists, and we tend to find them at [Sofar Sounds](https://www.sofarsounds.com) events. We also love small venues such as [The Jazz Cafe](https://thejazzcafe.com) and dancing the night away at [The Piano Works](https://www.pianoworks.bar)." },
      {
        name: "Museums",
        text: "If you have a little nerd in you, the entire city is one big museum. Try the [British Museum](https://www.britishmuseum.org), the [Natural History Museum](https://www.nhm.ac.uk), the [Transport Museum](https://www.ltmuseum.co.uk) and more.",
      },
      {
        name: "Food!",
        text: "Vanessa likes to eat (yes, Hope wrote this one). If you want street food, check out [Borough Market](https://boroughmarket.org.uk) in London Bridge or [Seven Dials Market](https://www.sevendialsmarket.com) in Covent Garden. For a quick bite or a spot of brunch, try [Granary Square Brasserie](https://ivycollection.com/restaurants-near-me/the-ivy-london/granary-square-brasserie-kings-cross/) in Kings X (the buttermilk pancakes are a must!), Juliet’s in Tooting for their infamous banana bread with salted espresso butter, and [Branché](https://branchelondon.co.uk) or [Affogato](https://affogato.co.uk) for a full English. For a sit-down meal, [Hawksmoor](https://thehawksmoor.com), [Chakana](https://chakana-restaurant.co.uk/london), [Indian Room](https://www.indianroom.co.uk), [Novikov](https://www.novikovrestaurant.co.uk) or [Kanada-Ya](https://kanada-ya.com) to name a few...",
      },
      {
        name: "Walks",
        text: "Walk along the many canals or parks in London. You can stroll around the [South Bank](https://southbank.london), or start a long walk in [Little Venice](https://www.google.com/maps/search/?api=1&query=Little+Venice+London) in West London and walk all the way to the East - or give up half-way, we don’t judge!",
      },
      {
        name: "Experiences",
        text: "Live shows you can step into: [Frameless](https://frameless.com), The Last Days of Pompeii Immersive Exhibition, [The Traitors Live Experience](https://www.thetraitorslive.co.uk) (guess who won 👀), Horizon of Khufu, Life Chronicles and [The Cube](https://bookthecube.com).",
      },
    ],
  },
};

export const STAY = {
  intro:
    "The venue has blocked all available accommodation on their premises. There are 25 double bedrooms and cottages available to book for the night of the wedding. If you would rather stay nearby, here are our favourite options around the venue.",
  // Where guests book the venue's own rooms. Set NEXT_PUBLIC_ACCOMMODATION_URL to the venue's booking page.
  bookingUrl: process.env.NEXT_PUBLIC_ACCOMMODATION_URL?.trim() || "https://www.secure-hotel-booking.com/d-edge/Mulberry-House-Hotel-Conference-Centre/2MKA/en/DateSelection",
};

// Places to stay, shown on the map and list. Coordinates are from each postcode.
// Ratings are Google ratings as seen when this was written; check the live listing before relying on them.
// "id" is what a guest's RSVP stores, so don't change an id once guests have replied.
export interface StayPlace {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  miles: number | null; // by road/air from the venue, null for the venue itself
  rating: number | null;
  ratingOutOf: number;
  ratingSource: string;
  reviews: number | null;
  blurb: string;
  url: string;
  bookLabel: string;
  onSite?: boolean;
  tag?: string; // a small label shown above the name
}

export const STAY_PLACES: StayPlace[] = [
  {
    id: "mulberry-house",
    name: "Mulberry House",
    kind: "At the venue",
    lat: VENUE.lat,
    lng: VENUE.lng,
    miles: null,
    rating: 4.6,
    ratingOutOf: 5,
    ratingSource: "Google",
    reviews: 969,
    blurb: "Rooms in the Georgian house and the courtyard, steps from the ceremony and the dance floor. Mention our wedding when you book.",
    url: process.env.NEXT_PUBLIC_ACCOMMODATION_URL?.trim() || "https://www.secure-hotel-booking.com/d-edge/Mulberry-House-Hotel-Conference-Centre/2MKA/en/DateSelection",
    bookLabel: "Book at the venue",
    onSite: true,
    tag: "We’re Staying Here",
  },
  {
    id: "down-hall",
    name: "Down Hall Hotel & Spa",
    kind: "Country house hotel · Hatfield Heath",
    lat: 51.795984,
    lng: 0.21251,
    miles: 6.2,
    rating: 4.3,
    ratingOutOf: 5,
    ratingSource: "Google",
    reviews: 1815,
    blurb: "A four-star Victorian country house with a spa and gardens, if you want to make a weekend of it.",
    url: "https://www.booking.com/hotel/gb/downhallhotel.en-gb.html",
    bookLabel: "Book on Booking.com",
  },
  {
    id: "elmcroft",
    name: "Elmcroft Guest House",
    kind: "Guest house · Thornwood, Epping",
    lat: 51.724902,
    lng: 0.127428,
    miles: 4.1,
    rating: 4.2,
    ratingOutOf: 5,
    ratingSource: "Google",
    reviews: 33,
    blurb: "A friendly, well-reviewed guest house with free parking and wifi.",
    url: "https://elmcroftepping.co.uk/",
    bookLabel: "Book direct",
  },
  {
    id: "premier-inn-harlow",
    name: "Premier Inn Harlow East",
    kind: "Hotel · Church Langley, Harlow",
    lat: 51.767099,
    lng: 0.130731,
    miles: 6.7,
    rating: 4.4,
    ratingOutOf: 5,
    ratingSource: "Google",
    reviews: 349,
    blurb: "A dependable, good-value option with free wifi.",
    url: "https://www.premierinn.com/gb/en/hotels/england/essex/harlow/harlow-east-church-langley.html",
    bookLabel: "Book at Premier Inn",
  },
  {
    id: "ivy-hill",
    name: "Ivy Hill Hotel",
    kind: "Hotel · Margaretting",
    lat: 51.694814,
    lng: 0.411707,
    miles: 6.7,
    rating: 4.3,
    ratingOutOf: 5,
    ratingSource: "Google",
    reviews: 545,
    blurb: "A relaxed hotel on the Chelmsford side, with parking on site.",
    url: "https://www.booking.com/hotel/gb/best-western-ivy-hill.en-gb.html",
    bookLabel: "Book on Booking.com",
  },
];

// What a guest can choose on their RSVP: one of the places above, or one of these.
export const STAY_OTHER = [
  { id: "elsewhere", label: "Somewhere else" },
  { id: "not-staying", label: "Not staying overnight" },
  { id: "undecided", label: "Not sure yet" },
] as const;

export function stayLabel(id: string | null | undefined) {
  if (!id) return "";
  return STAY_PLACES.find((p) => p.id === id)?.name ?? STAY_OTHER.find((o) => o.id === id)?.label ?? "";
}

export const GIFTS = {
  message:
    "Your presence is the best gift we could ask for! But if you’re feeling generous, you can contribute towards our honeymoon :)",
  // Where cash gifts go: a Monzo link that works for everyone. It doesn't report back to this site; the gifts show
  // up in the Monzo account.
  monzoUrl: "https://monzo.me/vanessahaughton?h=fVwWDt&account_type=personal",
};

// The Q & A page. The RSVP deadline answer is filled in from the planner's deadline setting
// (the date that is actually enforced on guests' RSVPs), so the page and the form never
// disagree. FALLBACK_DEADLINE_TEXT is shown only while no deadline has been set there.
export const QA_INTRO = "If you\u2019ve got any questions, have a look at our Q & A first!";
export const FALLBACK_DEADLINE_TEXT = "30th November";

// Who guests should contact with questions. Add the phone number here when you have it.
export const QA_CONTACT = { name: "Joy Senyo", phone: "+44 7517 387974" };

// "deadline" and "contact" mark answers that are filled in by the page. Everything else is as written.
export const QA: Array<{ q: string; a?: string; kind?: "deadline" | "contact" }> = [
  { q: "What\u2019s the RSVP deadline?", kind: "deadline" },
  { q: "Can I bring a guest?", a: "Please check your invite to see if you have a plus one!" },
  {
    q: "Are children welcome?",
    a: "As much as we adore your little ones, they won\u2019t be included in the ceremony or reception. Please do get in touch if you have any questions!",
  },
  { q: "Where can I park?", a: "There\u2019s plenty of parking at the venue." },
  {
    q: "Are the ceremony and reception venues wheelchair accessible?",
    a: "Yes, and help will be available for anyone who needs a hand getting around the grounds.",
  },
  {
    q: "What should I wear?",
    a: "Come dressed in your best and most comfortable to dance the night away. You can wear any colour you want except white.",
  },
  {
    q: "What kind of shoes should I wear (or steer clear of)?",
    a: "Ladies, just a quick heads up: please steer clear of stiletto heels. There are plenty of grassy and uneven spots to cross, so block heels or sandals are your safest bet. We don\u2019t want anyone spoiling their lovely shoes or twisting an ankle.",
  },
  { q: "Who should I contact if I have questions?", kind: "contact" },
  {
    q: "What will the weather be like?",
    a: "Welcome to England, everyone coming along! The weather can be a bit unpredictable. Daytime temperatures range from 8-22\u00b0C, but it can feel cooler in the evenings, so best bring a light jacket or wrap just in case.",
  },
  {
    q: "Is the wedding inside or outside?",
    a: "Our wedding ceremony will be outside if the weather is good on the day, otherwise it will be indoors. The reception will be indoors.",
  },
  { q: "Can we take photos on our phones and cameras during the wedding?", a: "Absolutely! We\u2019d love you to take some photos and share them." },
];

export const NAV = [
  { label: "Welcome", href: "/welcome" },
  { label: "Our Story", href: "/our-story" },
  { label: "Schedule", href: "/schedule" },
  { label: "Travel", href: "/travel" },
  { label: "Our London", href: "/our-london" },
  { label: "Places to Stay", href: "/places-to-stay" },
  { label: "Q & A", href: "/qa" },
  { label: "Gift List", href: "/gift-list" },
  { label: "RSVP", href: "/rsvp" },
] as const;

export const SITE_PATHS = NAV.map((n) => n.href);
