import React from 'react'
import { FaUser } from "react-icons/fa";
import { MdArrowForwardIos } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
export default function Header({account}) {




  return (
    <div className='flex items-center w-full justify-between'>
           <div className='flex items-center w-1/2'>
             <div className='flex items-center space-x-6'>
               <FaUser />
              <h5>{account?.slice(0,7)+"..."+account?.slice(-4)}</h5>

             </div>
             <MdArrowForwardIos />
       

           </div>
           <div className='flex items-center w-1/2 justify-end '>
                <IoSettingsSharp 
                  className='text-2xl'
                />

           </div>

    </div>
  )
}
