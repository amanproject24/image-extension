import React, { useState } from 'react'
import 'tw-elements';

import dummyImage from '../../images/dummy-image.png'
import dounloadIcon from '../../images/icon_settings.png'
import axios from 'axios';

           
const ImageExtractorBackup = () => {
    const [response, setResponse] = useState('');
    const [disabled, setDisabled] = useState(false);
    const handleChange = async (e) => {
            const { id, value, checked } = e.target;
            const tab = await chrome.tabs.query({active: true});
            var tabId = tab[0]['id'];
            chrome.scripting.executeScript(
                {
                    target:{tabId, allFrames: true},
                    func:grabImages
                },
                onResult
                );          
        }
        
        function grabImages() {
            const images = document.querySelectorAll("img");
            console.log(images);
            return Array.from(images).map(image=>image.src);    
        }

        function onResult(frames) {
            // If script execution failed on remote end and could not return results
            if (!frames || !frames.length) { 
                alert("Could not retrieve images from specified page");
                return;
            }
            // Combine arrays of image URLs fromeach frame to a single array
            const imageUrls = frames.map(frame=>frame.result).reduce((r1,r2)=>r1.concat(r2));
            console.log(imageUrls);
            setResponse(imageUrls);
            setDisabled(true);
        }
  return (
  <>
    <button id="imageScanBtn" onClick={handleChange} className="bg-[#4C66DF] mb-6 text-black py-2 px-8 rounded-md border border-primary cursor-pointer hover:text-primary hover:bg-transparent disabled:opacity-50" >Start Scan</button>
    {response && response.map((imageUrl) => (
      <div className="group relative">
          <img src={imageUrl} className="w-full object-cover h-24" />
          <a href={imageUrl} className='absolute text-[8px] top-1 left-1 z-50 flex px-1 bg-primary text-white rounded-md group-hover:flex ' download>
              <img src={dounloadIcon} className="mr-1" /> <span>export</span>
          </a>     
      </div>
  ))}
  
    </>
  )
}

export default ImageExtractorBackup
