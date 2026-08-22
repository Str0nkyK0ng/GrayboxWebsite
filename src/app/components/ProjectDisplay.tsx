'use client';
import React from 'react';
import { Projects } from '../projects';
import CrunchMap from '../components/CrunchMap'


function ProjectDisplay({
    project = Projects[0],
}){
        const endDate = new Date(project.launchDate);
        endDate.setMonth(endDate.getMonth() + 3);
        const formatDate = (date: Date) =>
          new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(date);
    return(
        <div className='w-fit h-fit'>
          <div className='flex w-full flex-row text-offWhite space-x-[5rem] pt-[5rem] m-0' key={project.artistName}>
            <div  className='text-xl space-y-2 col-span-1 w-1/2 pt-50 items-left z-30 font-[Inter]   flex-col flex'>
            <div className='mb-1'>
               <a className='text-[2rem] font-[Coral] uppercase no-underline' href={project.artistLink}> {project.artistName}</a>
              <p className='italic p-0 mt-0'>{project.workName}</p>
              <p className='m-0 pt-5 text-[1rem]'>{formatDate(project.launchDate)} - {formatDate(endDate)}</p>
              <a className='no-underline text-[1rem] ' href={project.locationGoogleMapsLink}>{project.venue + ', '+project.address}</a>
            </div>

              <p >{project.artistDescription}</p>
              <p className=''>{project.workDescription}</p>
            </div>

            <CrunchMap lat={project.coordinates.lat} lon={project.coordinates.long} res={90} color="#ACACAC" markerColor="#FFC500"
            locationName={project.venue}
            address={project.address}
            locationLink={project.locationGoogleMapsLink}
            className='col-span-1 w-[40%] max-h-auto border-[3px]'
                /> 
            </div>
            
        </div>
    )
}
export default ProjectDisplay;
