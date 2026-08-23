
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

export let Projects: Project[] = [
      {
    artistName: 'Ian McLarty',
    artistLink: 'https://ianmaclarty.com/about.html',
    artistDescription: 'I\'m a videogame developer living in Melbourne, Australia, with an interest in experimental designs.',
    workDescription:'The goal of this game is to find your favourite room in the catacombs. It\'s a perspective maze that plays with your perception of 3D space on a 2D screen.',
    workName: 'Catacombs of Solaris Revisited',
    launchDate: new Date("1-1-27"),
    venue: 'Braindead Studios',
    address: '611 N Fairfax Ave',
    coordinates: {
      lat:34.0820184,
      long:-118.3617556,
    },
    slug: 'catacombs',
    img: 'https://img.itch.zone/aW1nLzUyMzAxNTAucG5n/347x500/ZU3zDW.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  },
  {
    artistName: 'gurn group',
    artistLink: 'https://gurngroup.com',
    artistDescription: 'gurn group is a NYC-based experimental game artist and a member of the plunderludics working group.',
    workDescription:'Eddo Stern (born 1972 in Tel Aviv) is a California-based artist and developer known for creating experimental video games, game art and machinima-based works. Stern was a founding member of the physical-computing based collective and artist-run space C-Level.[1] He holds a BA in Electronic Media and Art from University of California, Santa Cruz and an MFA in Art and Integrated Media from California Institute of the Arts. A professor at University of California, Los Angeles\' Design Media Arts program, he is additionally the director of the UCLA Game Lab.[2][3]',
    workName: 'may 9 2025',
    slug:'gurn',
    launchDate: new Date("10-1-26"),
    venue: 'Vidiots',
    address: '4884 N Eagle Rock Blvd',
    coordinates: {
      lat:34.027283,
      long:-118.4135427,
    },
    img: 'https://img.itch.zone/aW1nLzIxMTA3OTE2LnBuZw==/347x500/sQhd%2BY.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  },

]
export default Projects