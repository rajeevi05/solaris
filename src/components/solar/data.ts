export type PlanetData = {
  name: string;
  color: string;
  emissive?: string;
  radius: number;
  orbit: number;
  speed: number;
  tilt: number;
  ring?: { inner: number; outer: number; color: string };
  description: string;
  stats: { label: string; value: string }[];
};

export type Satellite = {
  name: string;
  radius: number;
  orbit: number;
  speed: number;
  inclination: number;
  description: string;
};

export const EARTH_SATELLITES: Satellite[] = [
  {
    name: "ISS",
    radius: 0.06,
    orbit: 1.15,
    speed: 1.6,
    inclination: 0.9,
    description: "International Space Station — humanity's outpost in low Earth orbit.",
  },
  {
    name: "Hubble",
    radius: 0.05,
    orbit: 1.35,
    speed: 1.2,
    inclination: -0.4,
    description: "Hubble Space Telescope — peering 13 billion years into the past.",
  },
  {
    name: "JWST",
    radius: 0.05,
    orbit: 1.65,
    speed: 0.7,
    inclination: 0.3,
    description: "James Webb Space Telescope proxy — infrared eye on the cosmos.",
  },
];

export const PLANETS: PlanetData[] = [
  {
    name: "Mercury",
    color: "#a39187",
    radius: 0.45,
    orbit: 9,
    speed: 0.42,
    tilt: 0.03,
    description:
      "The smallest planet — a scorched, cratered world racing around the Sun every 88 days.",
    stats: [
      { label: "Distance", value: "57.9M km" },
      { label: "Day", value: "59 Earth days" },
      { label: "Moons", value: "0" },
    ],
  },
  {
    name: "Venus",
    color: "#e8c486",
    emissive: "#3a1f10",
    radius: 0.72,
    orbit: 13,
    speed: 0.31,
    tilt: 3.1,
    description:
      "A runaway greenhouse hidden beneath thick sulfuric clouds. Hotter than Mercury despite being farther out.",
    stats: [
      { label: "Distance", value: "108.2M km" },
      { label: "Surface", value: "464°C" },
      { label: "Moons", value: "0" },
    ],
  },
  {
    name: "Earth",
    color: "#2e6cb8",
    emissive: "#0a2540",
    radius: 0.78,
    orbit: 17.5,
    speed: 0.25,
    tilt: 0.41,
    description:
      "The pale blue dot. Liquid oceans, breathable atmosphere, and the only known cradle of life.",
    stats: [
      { label: "Distance", value: "149.6M km" },
      { label: "Day", value: "24 hours" },
      { label: "Moons", value: "1" },
    ],
  },
  {
    name: "Mars",
    color: "#c1502a",
    radius: 0.55,
    orbit: 22,
    speed: 0.2,
    tilt: 0.44,
    description:
      "The red planet. Frozen poles, ancient riverbeds, and dust storms that swallow continents.",
    stats: [
      { label: "Distance", value: "227.9M km" },
      { label: "Day", value: "24.6 hours" },
      { label: "Moons", value: "2" },
    ],
  },
  {
    name: "Jupiter",
    color: "#d9a86a",
    radius: 2.4,
    orbit: 32,
    speed: 0.12,
    tilt: 0.05,
    description:
      "The king of planets. A churning gas giant with storms larger than Earth and a magnetic field that dwarfs the Sun's.",
    stats: [
      { label: "Distance", value: "778.5M km" },
      { label: "Day", value: "9.9 hours" },
      { label: "Moons", value: "95+" },
    ],
  },
  {
    name: "Saturn",
    color: "#e2c993",
    radius: 2.05,
    orbit: 42,
    speed: 0.09,
    tilt: 0.47,
    ring: { inner: 2.6, outer: 4.2, color: "#c9b48a" },
    description:
      "Crowned by a glittering ring system of ice and rock — the jewel of the Solar System.",
    stats: [
      { label: "Distance", value: "1.43B km" },
      { label: "Rings", value: "7 main" },
      { label: "Moons", value: "146" },
    ],
  },
  {
    name: "Uranus",
    color: "#8ecfd9",
    radius: 1.4,
    orbit: 52,
    speed: 0.065,
    tilt: 1.7,
    ring: { inner: 1.8, outer: 2.2, color: "#6fb8c4" },
    description:
      "An ice giant tipped on its side, rolling around the Sun through an 84-year orbit.",
    stats: [
      { label: "Distance", value: "2.87B km" },
      { label: "Tilt", value: "97.8°" },
      { label: "Moons", value: "27" },
    ],
  },
  {
    name: "Neptune",
    color: "#3b6cf0",
    emissive: "#0b1a4d",
    radius: 1.35,
    orbit: 60,
    speed: 0.05,
    tilt: 0.49,
    description:
      "The windy blue frontier. Supersonic storms tear through methane clouds at the edge of the planetary realm.",
    stats: [
      { label: "Distance", value: "4.5B km" },
      { label: "Winds", value: "2,100 km/h" },
      { label: "Moons", value: "14" },
    ],
  },
];

export const SECTIONS = [
  {
    title: "Solaris",
    eyebrow: "Prologue",
    body: "Cosmic silence. Drifting dust. The faint glow of a distant star begins to grow.",
  },
  ...PLANETS.map((p) => ({
    title: p.name,
    eyebrow: "Planet",
    body: p.description,
    planet: p,
  })),
  {
    title: "The Kuiper Belt",
    eyebrow: "Outer Reach",
    body: "Beyond Neptune lies a frozen archive of the Solar System's origin — dwarf worlds and ancient ice.",
  },
  {
    title: "Into the Milky Way",
    eyebrow: "Epilogue",
    body: "We pull back. Our star becomes one of four hundred billion. The journey continues outward, forever.",
  },
];
