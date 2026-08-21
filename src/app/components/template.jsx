'use client';
// Layout.js
import React from 'react';

function Layout({ children}) {
  return (
    <div className='relative text-white w-full  min-h-full'>
      <div className='mx-auto p-10 text-[.9rem]'>
              <a
        id='logo'
        href='/'
        className='p-4  w-fit font-[Redaction] hover:bg-white hover:text-black whitespace-nowrap md:p-0 px-0 md:px-2 justify-center md:justify-normal pb-1 md:block flex text-[2.5rem] xl:text-[3rem] leading-none'
      >
      </a>
        <div className='w-full flex md:flex-row flex-col'>
          <div className='w-full px-[5svw]'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
