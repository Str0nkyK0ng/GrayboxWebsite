'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Layout from '../components/template';
import PixelCube from '../components/PixelCube'
import CrunchMap from '../components/CrunchMap'
import Header from '../components/Header';


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


function LP() {
  const pathname = usePathname();

  return (
    <Layout>
      <Header></Header>
      <div className='w-full max-w-4xl text-left text-md md:text-xl font-[Inter] h-fit'>
          <p>If you are interested in housing the Graybox Arcade for a future artist, please contact us at <br></br>aidan.m.strong [at] gmail.com</p>
      
      </div>
      <div>
        </div>
    </Layout>
  );
}

export default LP;
