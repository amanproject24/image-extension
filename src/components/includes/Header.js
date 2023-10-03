import React from 'react'
import logoImg from '../../images/icon _image_.png'
import close from '../../images/close.png'

const Header = () => {

  const exit = () => {
    window.close();
  }


  return (
    <>
      <header className='p-2 flex items-center justify-between '>
        <div className='flex items-center gap-5'>
          <img className="logo-img" src={logoImg} /> <span className='leading-normal	text-base tracking-tightest font-bold text-black'>IMAGE EXTRACTOR</span>
        </div>
        <div>
          <img className='cursor-pointer' src={close} alt="close" onClick={exit} />
        </div>
      </header>
    </>
  )
}

export default Header
