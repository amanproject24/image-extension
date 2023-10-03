import React from 'react'
import Layout from '../Layout'

const Loadingscreen = () => {
  return (
    <Layout>
        <div className='content text-center bg-[#FFF9F9] p-8 '>
            <h2 className='text-xl font-medium mb-3'>Checking Login Status....</h2>
        </div>
    </Layout>
  )
}

export default Loadingscreen
