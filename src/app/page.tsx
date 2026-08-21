'use client';
import React from 'react';
import NotesLayout from './components/NotesLayout';
import PixelCube from './components/PixelCube'
import CrunchMap from './components/CrunchMap'


interface Season{
  artistName:string;
  artistLink:string;
  artistDescription:string;
  workName:string;
  workDescription:string;
  location:string;
  img:string;
  locationGoogleMapsLink:string;
  launchDate: Date,
}

let Seasons: Season[] = [
  {
    artistName: 'gurn group',
    artistLink: 'https://gurngroup.com',
    artistDescription: ' social transformation and financial success, absolute liberation through creative applications of digital technology, a passion for video games and interactive entertainment, highly replayable and socially responsible digital media, entertaining and visually stunning pc gaming, home console gaming, video game technology, online games, online game free, online gambling games, online casino, play poker online, mobile games, video game industry, video game companies, video game development, video game console, video game news, video game reviews, video game websites, video games free, video games online, video games for kids, video games shop, video games history, video games facts, video games list, video game jobs, video game companies, video game industry, video game industry news, video game industry statistics, video game industry jobs, online gambling, online casino games, online casino no deposit bonus, free online casino, online casino free spins no deposit, online casino free spins, online casino free spins no deposit bonus, online casino free spins no deposit uk, online casino free spins no deposit usa, online casino free spins no deposit australia, online casino free spins no deposit south africa, online casino free spins no deposit canada, online casino free spins no deposit nz, online casino free spins no deposit uk, online casino no deposit bonus, online casino no deposit bonus codes, online casino no deposit bonus keep what you win, online casino no deposit bonus uk, online casino no deposit bonus usa, online casino no deposit bonus 2018, online casino no deposit bonus 2019, online casino no deposit bonus keep what you win uk, online casino no deposit bonus uk 2018, online casino no deposit bonus uk 2019, online casino no deposit bonus australia, online casino no deposit bonus free spins, online casino no deposit bonus codes usa, online casino no deposit bonus codes 2019, online casino no deposit bonus codes canada, online casino no deposit bonus canada, online casino no deposit bonus codes australia ',
    workDescription:'Four instances of NBA Basketball 2000 for the PlayStation, chroma keyed and overlaid. Four-byte integer at address 0x132BB8 in emulated memory is fixed at value 15728640. ',
    workName: 'may 9 2025',
    launchDate: new Date("10-1-26"),
    location: 'Vidiots, CA, Eagle Rock',
    img: 'https://img.itch.zone/aW1nLzIxMTA3OTE2LnBuZw==/347x500/sQhd%2BY.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  }
]

function LP() {
  return (
    <NotesLayout>
      <PixelCube color="#FFC500" pixelSize={10} speed={1} />
      {Seasons.map(season => {
        const endDate = new Date(season.launchDate);
        endDate.setMonth(endDate.getMonth() + 3);
        const formatDate = (date: Date) =>
          new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(date);

        return (  
          <div key={season.artistName} className='text-xl w-1/4 text-left z-30 font-[Inter]   flex-col flex'>
            <a className='text-[2rem] font-[Coral] uppercase no-underline' href={season.artistLink}>{season.artistName}'s</a>
            <p className='italic p-0 mt-0'>{season.workName}</p>
            <p className='m-0 text-[1rem]'>{formatDate(season.launchDate)} - {formatDate(endDate)}</p>
            <a className='no-underline text-[1rem] ' href={season.locationGoogleMapsLink}>{season.location}</a>
            <p className=''>{season.workDescription}</p>

            <img src={season.img} className='max-h-fit max-w-fit'></img>
          </div>
        );
      })}
      <div>
      </div>
    </NotesLayout>
  );
}

export default LP;
