'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import PixelCube from './PixelCube';

function Header(){
    const pathname = usePathname();

    return(
        <div className="w-full h-min">
            <a href='/'>
                <PixelCube />
            </a>
            <div className='flex justify-center pb-[5rem] pt-[5%] text-[1.25rem] space-x-10 items-center max-h-min font-[Coral]'>
                {
                ['ABOUT','PROJECTS','CONTACT'].map(str =>{
                const href = `/${str.toLowerCase()}`;
                const isActive = pathname === href;
                return <a key={str} href={href} className={`transition-color duration-300 hover:text-grayboxYellow ${isActive ? 'text-grayboxYellow' : ''}`}>{str}</a>

                })

                }
            </div>
        </div>
    )
}
export default Header;
