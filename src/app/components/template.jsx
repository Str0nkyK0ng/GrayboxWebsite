'use client';
// Layout.js
import React from 'react';

function Layout({ children}) {
  return (
    <div className='relative w-full min-h-full'>
        <div className='w-full flex md:flex-row flex-col'>
          <div className='w-full px-[5svw]'>
            {children}
          </div>
        </div>
    </div>
  );
}

export default Layout;
