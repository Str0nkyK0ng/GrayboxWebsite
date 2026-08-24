'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Layout from '../components/template';
import Header from '../components/Header';
import Projects from '../projects';




function LP() {
  return (
    <Layout>
      <Header></Header>
      <div className='w-full grid grid-cols-1 sm:grid-cols-7 max-w-4xl text-left text-md md:text-xl text-offWhite font-[Redaction] h-fit'>
        <div className='sm:col-span-5 sm:col-start-2 bg-offBlack'>
        <div className='my-10'>
          <p>Graybox Arcade is placed in a new location across Los Angeles every three months. 
            The arcade features work by artists pushing the boundaries of experimental games.</p>
          <p>We have shown work at:</p>
                 {Projects.map((project)=>{
            return(
              <p className='pl-5' key={project.workName}><a  className='text-grayboxYellow hover:underline no-underline' href={project.locationGoogleMapsLink}>{project.venue}</a></p>
            )
        })} 
        </div>


        <div className='my-10'>
          <p>This project is inspired by and in conversation with a variety of spaces for art and games.</p>
          {
          [ 'UCLA Game Lab',
            'Boshi\'s Place',
            'Killscreen',
            'Glitch City',
            'LikeLike',
            'Hand Eye Society'
          ]
          .map((project)=>{
              return(
                <p key={project}  className='pl-5 text-grayboxYellow' >{project}</p>
              )
          })} 

        </div>

        <div className='my-10'>
          <p>Graybox Arcade is run by:</p>
          <p className='pl-5 text-grayboxYellow'><a href='vinnyroca.info'>Vinny Roca</a></p>
          <p className='pl-5 text-grayboxYellow'><a href='aidanstrong.info'>Aidan Strong</a></p>
        </div>

      
      </div>
      <div>
        </div>
        </div>
    </Layout>
  );
}

export default LP;
