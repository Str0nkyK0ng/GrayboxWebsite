'use client';
import React from 'react';
import { Projects } from '../projects';


function ProjectTeaser({
    project = Projects[0],
}){
        const endDate = new Date(project.launchDate);
        endDate.setMonth(endDate.getMonth() + 3);
        const formatDate = (date: Date) =>
          `${date.getMonth() + 1}.${date.getDate()}.${String(date.getFullYear()).slice(-2)}`;
    return(
      <a className='grayscale hover:grayscale-0' href={`${project.slug}`}>
          <div className='flex flex-col md:flex-row w-full text-offWhite m-0 gap-4 md:gap-0' key={project.artistName}>
          <img src={project.img} className='w-full md:w-[71.4286%] h-auto'></img>
            <div  className='text-xl w-full md:w-[28.5714%] md:ml-5 text-left h-full font-[Inter] overflow-hidden'>
              <div className='mb-1 text-[1rem]'>
                <p className='block text-right w-full whitespace-normal md:whitespace-nowrap text-2xl font-[Redaction] hover:underline text-grayboxYellow uppercase no-underline'>{project.artistName}</p>
                <p className='italic text-right text-[1.25rem] font-[Redaction]'>{project.workName}</p>
                <p className='pt-5 no-underline text-[1.25rem] font-[Redaction]  text-grayboxYellow '>{project.venue}</p>
                <p className='no-underline font-[Redaction] '>{project.address}</p>
                <p className='no-underline font-[Redaction] '>Los Angeles, CA</p>
                <p className='text-right text-[1.25rem] pt-5 text-grayboxYellow font-[Redcation]'>{formatDate(project.launchDate)} - {formatDate(endDate)}</p>
              </div>
            </div>
      </div>
      </a>
    )
}
export default ProjectTeaser;
