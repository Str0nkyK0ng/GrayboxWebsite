'use client';
// Layout.js
import React from 'react';
import Projects from '../projects';
import CrunchMap from './CrunchMap';
import AnimatedCubeCursor from './AnimatedCubeCursor';
import Header from './Header';

function Layout({ children}) {
  let project = Projects[Projects.length-1];
  return (
    <div className='relative w-full min-h-screen overflow-hidden'>
          <AnimatedCubeCursor/>
          <CrunchMap lat={project.coordinates.lat} lon={project.coordinates.long} res={90} color="#ACACAC" markerColor="#FFC500"
          locationName={project.venue}
          address={project.address}
          locationLink={project.locationGoogleMapsLink}
          className='absolute inset-0 w-full h-full object-cover opacity-[7.5%] -z-10 pointer-events-none'
          style={{ backgroundRepeat: 'repeat', backgroundSize: 'cover' }}
          /> 
      <div className='relative w-[800px] max-w-full min-h-full mx-auto px-5 sm:px-6 md:px-8 lg:px-0'>
        <Header></Header>
          {children}
      </div>
      <div className="invisible" aria-hidden="true">
        <Header />
      </div>
    </div>
  );
}
export default Layout;
