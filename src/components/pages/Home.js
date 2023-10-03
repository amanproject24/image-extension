import React from 'react'
import Layout from '../Layout'
import ImageExtractor from './ImageExtractor'
import ImageExtractorBackUp from './ImageExtractorBackup'
const Home = () => {

  return (
    <Layout>
      <div className='mx-auto bg-[#FFF9F9] rounded-[6px] result-container w-full'>
      <ImageExtractor/>
      </div>
    </Layout>
  )
}

export default Home
