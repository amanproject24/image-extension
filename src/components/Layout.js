import React, { useEffect } from 'react'
import Header from './includes/Header'


const Layout = ({children, props}) => {
 

  return (
    <>
      <div className='flex flex-col bg-white min-w-[357px] h-[709px] rounded-lg'>
      <Header />
          {children}
      </div>
    </> 
  )
}

export default Layout
