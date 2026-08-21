'use client';
import React, { useState } from 'react';
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
  coordinates: {
    long:number,
    lat:number,
  }
}

let Seasons: Season[] = [
  {
    artistName: 'gurn group',
    artistLink: 'https://gurngroup.com',
    artistDescription: 'gurn group is a NYC-based experimental game artist and a member of the plunderludics working group.',
    workDescription:'may 9 2025 presents four instances of NBA Basketball 2000 for the PlayStation, chroma keyed and overlaid. Four-byte integer at address 0x132BB8 in emulated memory is fixed at value 15728640. ',
    workName: 'may 9 2025',
    launchDate: new Date("10-1-26"),
    location: 'Vidiots, CA, Eagle Rock',
    coordinates: {
      long:-118.2177014,
      lat: 34.1349023
    },
    img: 'https://img.itch.zone/aW1nLzIxMTA3OTE2LnBuZw==/347x500/sQhd%2BY.png',
    locationGoogleMapsLink: 'https://www.google.com/maps/place/Vidiots/@34.1349827,-118.2152474,3a,75y,90t/data=!3m8!1e2!3m6!1sCIHM0ogKEICAgMCYrMe55AE!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHRPTWnObLWN42hvxctcjtHxZOGo0wkEiband6Q2P08qvoVtY_kIW6NDVphwgID4Tfd-a9vVjH87E_kygPdnII2lg3JM8RSFfR343nyvJpiRms8Sxt1uGJsU72uUZiZIbGV4WTeYryr1LA%3Dw203-h270-k-no!7i4284!8i5712!4m7!3m6!1s0x80c2a4d5226aee75:0x404c78e5bf636379!8m2!3d34.1349023!4d-118.2151265!10e5!16s%2Fg%2F1tfwdrv1?entry=ttu&g_ep=EgoyMDI2MDgxMC4wIKXMDSoASAFQAw%3D%3D'
  }
]

function LP() {
    const [at, setAt] = useState({ lat: 34.0479, lon: -118.2513 });

  return (
    <NotesLayout>
      <PixelCube />

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
          <div className=' flex w-full flex-row space-x-[5rem] p-0 m-0' key={season.artistName}>
            <div  className='text-xl col-span-1 w-1/2 pt-50 items-left z-30 font-[Inter]   flex-col flex'>
              <a className='text-[2rem] font-[Coral] uppercase no-underline' href={season.artistLink}>SEASON ONE: {season.artistName}</a>
              <p className='italic p-0 mt-0'>{season.workName}</p>
              <p className='m-0 text-[1rem]'>{formatDate(season.launchDate)} - {formatDate(endDate)}</p>
              <a className='no-underline text-[1rem] ' href={season.locationGoogleMapsLink}>{season.location}</a>
              <p >{season.artistDescription}</p>
              <p className=''>{season.workDescription}</p>
              <img src={season.img} className='max-h-fit max-w-fit'></img>
            </div>
          <CrunchMap lat={34.1349023} lon={-118.2177014} res={90} color="#ACACAC" markerColor="#FFC500"
          locationName="Vidiots"
          address="4884 N Eagle Rock Blvd, Los Angeles, CA 90041"
          className='col-span-1 h-auto w-1/2 border-[3px]'
            /> 
          </div>
        );
      })}
      <div className='w-full max-w-4xl text-left text-xl md:text-2xl font-[Coral] h-fit'>
    <p>Installed in a new location across LA every three months, the GRAYBOX ARCADE features work by artists
    pushing the boundaries of experimental games.</p>
      <p> We bring experimental games outside of the confines of sterile, while-walled galleries.</p>
      <p> If you want to host the next season of games. Please reach out. </p>
      {/* <img src='graphics/render.png' className='h-auto w-1/2 max-w-full object-contain border-[2px] border-offWhite'></img> */}
      
      </div>
      <div>
        </div>
    </NotesLayout>
  );
}

export default LP;
