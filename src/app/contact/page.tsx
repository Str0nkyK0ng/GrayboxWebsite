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
      <div className='w-full grid grid-cols-1 sm:grid-cols-7 max-w-4xl text-left text-md md:text-xl text-offWhite font-[Redaction10] h-fit'>
        <div className='sm:col-span-5 sm:col-start-2'>
        <div className='my-10'>
          <p>If you're in the Los Angeles area and are interested in hosting the cabinet, or want to get in touch, you can reach us at</p>
          <p className='pl-5 text-grayboxYellow'>grayboxla[at]gmail[dot]com</p>
        </div>
      </div>
      <div>
        </div>
        </div>
    </Layout>
  );
}

export default LP;
