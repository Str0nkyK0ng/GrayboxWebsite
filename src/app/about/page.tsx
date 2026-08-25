'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Layout from '../components/template';
import Header from '../components/Header';
import Projects from '../projects';




function LP() {
  return (
    <Layout>
      <div className='w-full grid grid-cols-1 sm:grid-cols-7 max-w-4xl text-left text-md md:text-xl text-offWhite font-[Redaction10] h-fit'>
        <div className='sm:col-span-5 sm:col-start-2 bg-offBlack'>
        <div className='my-10'>
          <p>Graybox Arcade is placed in a new location across Los Angeles every three months. 
            The arcade features work by artists pushing the boundaries of experimental games.</p>
          <p className='mt-10'>We have shown work at:</p>
            {Projects.map((project)=>{
            return(
              <p className='pl-5 ' key={project.workName}><a  className='text-grayboxYellow hover:underline no-underline' href={project.locationGoogleMapsLink}>{project.venue}</a></p>
            )
        })} 
        </div>


        <div className='my-10'>
          <p>This project is inspired by, and in conversation with a variety of spaces for art and games.</p>
          {
          [
            { name: 'UCLA Game Lab', href: 'https://games.ucla.edu' },
            { name: 'Boshi\'s Place', href: 'https://boshis.place/' },
            { name: 'Killscreen', href: 'https://killscreen.com/' },
            { name: 'Glitch City', href: 'https://glitch.city/' },
            { name: 'Babycastles', href: 'https://babycastles.com/' },
            { name: 'LIKELIKE', href: 'https://likelike.org/' },
            { name: 'Hand Eye Society', href: 'https://handeyesociety.com/' }
          ]
          .map((project)=>{
              return(
                <p key={project.name} className='pl-5'>
                  <a target="_blank" className='text-grayboxYellow hover:underline no-underline' href={project.href}>
                    {project.name}
                  </a>
                </p>
              )
          })} 

        </div>

        <div className='my-10'>
          <p>Graybox Arcade is run by:</p>
          <p className='pl-5 text-grayboxYellow hover:underline no-underline'><a target="_blank" href='https://vinnyroca.info'>Vinny Roca</a></p>
          <p className='pl-5 text-grayboxYellow hover:underline no-underline'><a target="_blank" href='https://aidanstrong.info'>Aidan Strong</a></p>
        </div>

      
      </div>
      <div>
        </div>
        </div>
    </Layout>
  );
}

export default LP;
