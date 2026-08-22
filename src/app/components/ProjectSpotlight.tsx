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
          <div className='grid w-full grid-cols-7  text-offWhite m-0 ' key={project.artistName}>
          <img src={project.img} className='w-full col-span-5 h-auto'></img>
            <div  className='text-xl col-span-2 ml-5 ext-left h-full font-[Inter] overflow-hidden'>
              <div className='mb-1 text-[1rem]'>
                <a className='block text-right w-full whitespace-nowrap text-2xl font-[Redaction] hover:underline text-grayboxYellow uppercase no-underline' href={project.artistLink}>{project.artistName}</a>
                <p className='italic text-right text-[1.25rem] font-[Redaction]'>{project.workName}</p>
                <p className='pt-5 no-underline text-[1.25rem] font-[Redaction]  text-grayboxYellow '>{project.venue}</p>
                <p className='no-underline font-[Redaction] '>{project.address}</p>
                <p className='no-underline font-[Redaction] '>Los Angeles, CA</p>
                <p className='text-right text-[1.25rem] pt-5 font-[Redcation]'>{formatDate(project.launchDate)} - {formatDate(endDate)}</p>
              </div>
            </div>
          <div className='col-span-5 col-start-2 items-center text-offWhite mt-[50px]'>
          <div className='text-[1.2rem] font-[Redaction] space-y-5 '>
              <p >{project.artistDescription}</p>
              <p className=''>{project.workDescription}</p>
              <p className=''>{project.workDescription}</p>
              <p className=''>{project.workDescription}</p>
              <p className=''>{project.workDescription}</p>
            </div>
        </div>
        </div>


      </div>

    )
}
export default ProjectSpotlight;
