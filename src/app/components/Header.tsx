'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import PixelCube from './PixelCube';

function Header(){
    const pathname = usePathname();
    return(
    <div className="w-full h-min pt-[3%] pb-[5%]">
        <div className="[grid-area:1/1]">
            <p className="m-0 w-full whitespace-nowrap text-center font-[Coral] text-[5.6rem] text-offWhite"> <a className='' href='/'>GRAYBOX ARCADE</a></p>
            <div className='flex text-offWhite justify-center  text-[1.5rem] space-x-10 items-center max-h-min pt-0 mt-0 font-[Redaction]'>
                        {
                        ['ABOUT','PROJECTS','CONTACT'].map(str =>{
                        const href = `/${str.toLowerCase()}`;
                        const isActive = pathname === href;
                        return <a key={str} href={href} className={`mt-0 transition-color duration-300 hover:text-grayboxYellow ${isActive ? 'text-grayboxYellow' : ''}`}>{str}</a>
                        })
                        }
            </div>
        </div>
    </div>
    )
}
export default Header;
