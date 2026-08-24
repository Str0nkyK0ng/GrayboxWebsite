
import { LoremIpsum } from "lorem-ipsum";
export interface Project{
  artistName:string;
  artistLink:string;
  artistDescription:string;
  workName:string;
  workDescription:string;
  img:string;
  venue:string;
  address:string;
  locationGoogleMapsLink:string;
  launchDate: Date,
  slug:string;
  coordinates: {
    long:number,
    lat:number,
  }
}

// Deterministic PRNG (mulberry32) so server and client render the same
// "random" text. Math.random() differs per-process, which caused a
// hydration mismatch when this ran once during SSR and again on the client.
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
  random: seededRandom(42),
});

const description = lorem.generateSentences(5);
const artistDescription = description;
const workDescription = description;

export let Projects: Project[] = [
      {
    artistName: 'PLACEHOLDER',
    artistLink: '',
    artistDescription,
    workDescription,
    workName: 'PLACEHOLDER',
    launchDate: new Date("1-1-27"),
    venue: 'PLACEHOLDER',
    address: 'PLACEHOLDER',
    coordinates: {
      lat:34.0820184,
      long:-118.3617556,
    },
    slug: 'placeholder',
    img: 'https://developer.valvesoftware.com/w/images/thumb/8/8b/Debugempty.png/200px-Debugempty.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  },
  {
    artistName: 'gurn group',
    artistLink: 'https://gurngroup.com',
    artistDescription,
    workDescription,
    workName: 'may 9 2025',
    slug:'gurn',
    launchDate: new Date("10-1-26"),
    venue: 'Vidiots',
    address: '4884 N Eagle Rock Blvd',
    coordinates: {
      lat:34.027283,
      long:-118.4135427,
    },
    img: '/graphics/gurn/game.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  },

]
export default Projects