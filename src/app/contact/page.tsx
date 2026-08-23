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
        <div className='sm:col-span-5 sm:col-start-2'>
        <div className='my-10'>
          <p>You can contact us at:</p>
          <p className='pl-5'>grayboxla[at]gmail.com</p>
        </div>
      </div>
      <div>
        </div>
        </div>
    </Layout>
  );
}

export default LP;
