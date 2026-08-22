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

        <div className='my-10'>
          <h3 className='text-4xl font-[Coral] pb-2'>WHAT??</h3>
          <p>The Graybox Aracde is placed in a new location across Los Angeles every three months. 
            The arcade features work by artists pushing the boundaries of experimental games.</p>
          <p>Our intention is to release experimental games from the confines of sterile, while-walled galleries, and into the larger arts community.</p>
          <p>We are not promoting commercial games.</p>
          <p>We are not selling products.</p>
        </div>

        <div className='my-10'>
          <h3 className='text-4xl font-[Coral] pb-2'>WHO??</h3>
          <p>The Graybox Collective Consists of:</p>
          <p className='pl-5'>Vinny Roca</p>
          <p className='pl-5'>Aidan Strong</p>
        </div>

        <div className='my-10'>
        <h3 className='text-4xl font-[Coral] pb-2'>WHEN??</h3>
        <p className=''>The first season of the Graybox Arcade {new Date()<=new Date('10-1-26')?'will begin':'began'} on October 1st, 2026.</p>
        </div>


      
      </div>
      <div>
        </div>
    </Layout>
  );
}

export default LP;
