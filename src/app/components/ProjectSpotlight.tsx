'use client';
import React from 'react';
import { Projects } from '../projects';


function ProjectSpotlight({
    project = Projects[0],
}){
        const endDate = new Date(project.launchDate);
        endDate.setMonth(endDate.getMonth() + 3);
        const formatDate = (date: Date) =>
          `${date.getMonth() + 1}.${date.getDate()}.${String(date.getFullYear()).slice(-2)}`;
    return(
      <div>
          <div className='flex flex-col w-full text-offWhite m-0' key={project.artistName}>
          <div className='flex flex-col md:flex-row w-full gap-4 md:gap-0'>
            <img src={project.img} className='w-full md:w-[71.4286%] h-auto'></img>
              <div  className='text-xl w-full md:w-[28.5714%] md:ml-5 text-left h-full font-[Inter] overflow-hidden'>
                <div className='mb-1 text-[1rem] '>
                  <a className='block text-right w-full whitespace-normal md:whitespace-nowrap text-2xl font-[Redaction] hover:underline text-grayboxYellow uppercase no-underline' href={project.artistLink}>{project.artistName}</a>
                  <p className='italic text-right text-[1.25rem] font-[Redaction]'>{project.workName}</p>

                  <a href={project.locationGoogleMapsLink} className='hover:underline no-underline'>
                    <p className='pt-5 no-underline text-[1.25rem] font-[Redaction]  text-grayboxYellow '>{project.venue}</p>
                    <p className='no-underline font-[Redaction] '>{project.address}</p>
                    <p className='no-underline font-[Redaction] '>Los Angeles, CA</p>
                  </a>
                  <p className='text-right text-[1.25rem]  text-grayboxYellow pt-5 font-[Redcation]'>{formatDate(project.launchDate)} - {formatDate(endDate)}</p>
                </div>
              </div>
          </div>
          <div className='w-full md:w-[71.4286%] md:ml-[14.2857%] items-center text-offWhite mt-2 md:mt-[50px]  bg-offBlack'>
          <div className='text-[1.2rem] font-[Redaction10] space-y-5 p-[10px]'>
              <p className='pb-10 italic'>{project.artistDescription}</p>
              <p className='pb-10'>{project.workDescription}</p>
            </div>
        </div>
        </div>


      </div>

    )
}
export default ProjectSpotlight;
