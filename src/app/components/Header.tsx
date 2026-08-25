'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import PixelCube from './PixelCube';

function Header(){
    const pathname = usePathname();
    return(
    <div className="w-full h-min pt-[3%] pb-[5%]">
        <div className="[grid-area:1/1]">
            <p className="m-0 w-full whitespace-normal lg:whitespace-nowrap hover:text-grayboxYellow text-center font-[Coral] text-[2.9rem] sm:text-[3.6rem] md:text-[4.5rem] lg:text-[5.6rem] text-offWhite"> <a className='' href='/'>GRAYBOX ARCADE</a></p>
            <div className='flex flex-wrap text-offWhite justify-center text-[1rem] sm:text-[1.25rem] md:text-[1.5rem] gap-x-5 sm:gap-x-8 md:gap-x-10 gap-y-1 items-center max-h-min pt-2 md:pt-0 mt-0 font-[Redaction]'>
                        {
                        ['ABOUT','PROJECTS','CONTACT'].map(str =>{
                        const href = `/${str.toLowerCase()}`;
                        const isActive = pathname === href;
                        return <a key={str} href={href} className={`mt-0 transition-color duration-300 hover:text-grayboxYellow ${isActive ? 'text-grayboxYellow' : ''}`}>{str}</a>
                        })
                        }
                         <a href={'https://www.instagram.com/grayboxla/'} className={`mt-0 transition-color duration-300 hover:text-grayboxYellow `}>INSTAGRAM</a>
            </div>
        </div>
    </div>
    )
}
export default Header;
