import React, { useState, useEffect } from 'react'
import dummyImage from '../../images/dummy-image.png'
import dounloadIcon from '../../images/icon _download.svg';
import newloader from '../../images/newloader.gif';
import JSZip from 'jszip';

const ImageExtractor = () => {
  const [getImage, setGetImage] = useState([]);
  const [totalImage, setTotalImage] = useState('000');
  const [imageInfo, setImageInfo] = useState([]);
  const [imageInfo1, setImageInfo1] = useState([]);
  const [checkbox1, setcheckbox1] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loader, setLoader] = useState(false)
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [filterImageLength, setfilterImageLength] = useState(1);
  const [initial, setInitial] = useState(true);
  const [scan, setScan] = useState("Scan");




  
    const scanImage = () => {
      setScan("Re-scan")
      setLoader(true)
      setInitial(false);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        var tabId = tabs[0]['id'];
        chrome.scripting.executeScript(
          {
            target: { tabId, allFrames: true },
            func: grabImages
          },
          onResult
        );
        setTotalImage("000");
      });
    }
    



  function grabImages() {
    // Define the image extensions you're interested in
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  
    // Collect image URLs with the specified extensions
    const imageUrls = [];
  
    // Function to check if a string ends with any of the provided extensions
    function hasAnyExtension(str, extensions) {
      return extensions.some(ext => str.toLowerCase().endsWith(ext));
    }
  
    // Get all image elements on the page
    const imageElements = document.querySelectorAll('img');
  
    // Check img elements
    Array.from(imageElements).forEach(img => {
      const imageUrl = img.src;
  
      // Check if the image URL starts with 'chrome://'
      if (!imageUrl.startsWith('chrome://')) {
        imageUrls.push({
          imageUrl: imageUrl,
        });
      }
    });
  
    // Get all elements on the page
    const allElements = document.querySelectorAll('*');
  
    // Check background images
    allElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const backgroundImage = computedStyle.getPropertyValue('background-image');
  
      const imageUrlRegex = /url\(['"]?([^'")]+)['"]?\)/i;
      const newBackgroundImage = backgroundImage.match(imageUrlRegex);
  
      if (
        newBackgroundImage !== null &&
        newBackgroundImage[1] &&
        !newBackgroundImage[1].startsWith('chrome://') &&
        hasAnyExtension(newBackgroundImage[1], imageExtensions)
      ) {
        imageUrls.push({
          imageUrl: newBackgroundImage[1],
        });
      }
    });
  
    return imageUrls;
  }
  


  function onResult(frames) {
    // If script execution failed on remote end and could not return results
    if (!frames || !frames.length) {
      alert("Could not retrieve images from specified page");
      return;
    }
    // Combine arrays of image URLs fromeach frame to a single array
    const collectedImageUrls = frames.map(frame => frame.result).reduce((r1, r2) => r1.concat(r2), []);
    console.log(collectedImageUrls)
    const uniqueData = collectedImageUrls.filter((obj, index, self) =>
      index === self.findIndex((o) => o.imageUrl === obj.imageUrl)
    );
    setGetImage(uniqueData);
  }

  async function convertImagesToBase64(imageDataArray) {
    let convertedImages = [];
    for (const imageData of imageDataArray) {
      try {
        let blob = await fetch(imageData.imageUrl).then(response => response.blob());
        let fileSizeInBytes = blob.size;
        let ImageSizeInKB = fileSizeInBytes / 1024;
        let imageSize = ImageSizeInKB > 1024 ? `${(ImageSizeInKB / 1024).toFixed(1)}MB` : `${ImageSizeInKB.toFixed(1)}KB`;
        const base64Url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        let imageExtension = base64Url.split(';')[0].split('/')[1];
        if (imageExtension === 'svg+xml') {
          imageExtension = 'svg';
        } else if (imageExtension === 'octet-stream') {
          imageExtension = 'webp';
        }
        if (imageExtension !== 'html' && imageExtension !== 'plain') {
          convertedImages.push({
            orignalImage: imageData.imageUrl,
            imageUrl: base64Url,
            imageExtension: imageExtension,
            fileSize: imageSize
          });
        }
      }
      catch (error) {
        console.error(`Error fetching image at ${imageData.imageUrl}:`, error);
      }
    }
    let newFIlterArray = convertedImages.filter((items) => items.fileSize != "0.0KB")
    setImageInfo(newFIlterArray);
    setTotalImage(newFIlterArray.length);
    setImageInfo1(newFIlterArray);
  }

  useEffect(() => {
    convertImagesToBase64(getImage)
  }, [getImage]);

  //Copy the Image Link
  const copyUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert("URL is copied");
    } catch (error) {
      console.error("Clipboard write failed:", error);
    }
  };

  //Downloard Part
  let checkboxes = [];

  const selectall = () => {
    checkboxes = document.querySelectorAll('input[type="checkbox"]');
    // Toggle the checked state of each checkbox
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true; // Change this line to 'false' if you want to uncheck them all
    });
    setcheckbox1(checkboxes);
  };

  const downloader = async () => {
    const zip = new JSZip();
    let links = [];

    if (links) {
      links = [...selectedItems];
    }
    if (checkbox1) {
      checkbox1.forEach((checkbox) => {
        if (checkbox.checked) {
          links.push(checkbox.defaultValue);
        }
      });
    }

    const downloadPromises = links.map(async (imageUrl, index) => {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const typeExtension = blob.type.split("/")

      let fileName = `image${index + 1}.${typeExtension[1]}`;
      zip.file(fileName, blob, { binary: true });
    });

    await Promise.all(downloadPromises);
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = 'images.zip';
      downloadLink.click();
    });
  };

  const handleCheckboxClick = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedItems(prevSelectedItems => [...prevSelectedItems, value]);
    } else {
      setSelectedItems(prevSelectedItems => prevSelectedItems.filter(item => item !== value));
    }
  };

  // ----menu----
  const options = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'svg', label: 'SVG' },
    { value: 'gif', label: 'GIF' },
    { value: 'webp', label: 'WEBP' },
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };


  const handleCheckboxChange = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(item => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  // For Select the Image and Downloard functionlity.
  useEffect(() => {
    // Filter imageInfo based on selectedOptions
    if (selectedOptions && selectedOptions.length > 0) {
     console.log(selectedOptions.length)
      // Filter imageInfo based on selectedOptions
      const filteredImageInfo = imageInfo1.filter(item => selectedOptions.includes(item.imageExtension));

      setfilterImageLength(filteredImageInfo.length)
      setImageInfo(filteredImageInfo);
      setTotalImage(filteredImageInfo.length);
    } else {
      setImageInfo(imageInfo1);
      setTotalImage(imageInfo1.length)
    }
  }, [selectedOptions]);

  //For Loader Functionlity.
  useEffect(() => {
    setLoader(false);
  }, [imageInfo])

  return (
    <>
      <div className='flex-1  overflow-y-auto content text-center p-4 pb-0'>
        <div className='pt-2 flex justify-between  '>
          <div>
            <h3 className='text-[12px] font-medium leading-normal total_image text-black'>
              Images found:  {totalImage == 0 ? "000" : totalImage}
            </h3>
          </div>
          <a href="http://accounts.attenti.io/" target="blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10.7834 18.3333H9.20835C8.83705 18.3333 8.48096 18.1858 8.2184 17.9233C7.95585 17.6607 7.80835 17.3046 7.80835 16.9333V16.025C7.80384 15.9715 7.78421 15.9203 7.75175 15.8776C7.71929 15.8348 7.67534 15.8021 7.62502 15.7833C7.57403 15.7507 7.51474 15.7333 7.45419 15.7333C7.39363 15.7333 7.33434 15.7507 7.28335 15.7833L6.66669 16.45C6.53733 16.5803 6.38349 16.6836 6.21401 16.7542C6.04453 16.8247 5.86276 16.8611 5.67919 16.8611C5.49561 16.8611 5.31385 16.8247 5.14437 16.7542C4.97489 16.6836 4.82104 16.5803 4.69169 16.45L3.55002 15.3333C3.41787 15.2042 3.31292 15.05 3.24135 14.8796C3.16979 14.7093 3.13307 14.5264 3.13335 14.3417C3.13389 13.9638 3.28364 13.6014 3.55002 13.3333L4.16669 12.7167C4.19646 12.6707 4.2123 12.6172 4.2123 12.5625C4.2123 12.5078 4.19646 12.4542 4.16669 12.4083C4.11669 12.2833 4.03335 12.1917 3.91669 12.1917H3.06669C2.69462 12.1895 2.33854 12.0401 2.07623 11.7762C1.81391 11.5124 1.66668 11.1554 1.66669 10.7833V9.20832C1.66669 8.83702 1.81419 8.48092 2.07674 8.21837C2.33929 7.95582 2.69538 7.80832 3.06669 7.80832H3.97502C4.02854 7.80381 4.07967 7.78418 4.12245 7.75172C4.16524 7.71926 4.19792 7.67531 4.21669 7.62499C4.24936 7.574 4.26672 7.51471 4.26672 7.45416C4.26672 7.3936 4.24936 7.33431 4.21669 7.28332L3.55002 6.66666C3.41976 6.5373 3.31637 6.38346 3.24583 6.21398C3.17528 6.0445 3.13896 5.86273 3.13896 5.67916C3.13896 5.49558 3.17528 5.31382 3.24583 5.14434C3.31637 4.97486 3.41976 4.82101 3.55002 4.69166L4.66669 3.54999C4.79452 3.41847 4.94737 3.31384 5.11625 3.24229C5.28512 3.17073 5.46661 3.13368 5.65002 3.13332C5.83856 3.1325 6.02541 3.16887 6.19986 3.24037C6.37432 3.31187 6.53296 3.41709 6.66669 3.54999L7.28335 4.16666C7.32926 4.19643 7.38281 4.21227 7.43752 4.21227C7.49224 4.21227 7.54578 4.19643 7.59169 4.16666C7.71669 4.11666 7.80835 4.03332 7.80835 3.91666V3.06666C7.81055 2.69459 7.9599 2.33851 8.22378 2.0762C8.48766 1.81388 8.84461 1.66665 9.21669 1.66666H10.8334C11.2047 1.66666 11.5608 1.81416 11.8233 2.07671C12.0859 2.33926 12.2334 2.69535 12.2334 3.06666V3.97499C12.2379 4.02851 12.2575 4.07964 12.29 4.12242C12.3224 4.16521 12.3664 4.19789 12.4167 4.21666C12.4677 4.24933 12.527 4.26669 12.5875 4.26669C12.6481 4.26669 12.7074 4.24933 12.7584 4.21666L13.3334 3.54999C13.4627 3.41973 13.6166 3.31634 13.786 3.24579C13.9555 3.17525 14.1373 3.13892 14.3209 3.13892C14.5044 3.13892 14.6862 3.17525 14.8557 3.24579C15.0252 3.31634 15.179 3.41973 15.3084 3.54999L16.45 4.66666C16.5818 4.79604 16.6865 4.95035 16.758 5.12061C16.8296 5.29086 16.8665 5.47365 16.8667 5.65832C16.8707 5.84607 16.8358 6.03261 16.764 6.20616C16.6923 6.37972 16.5854 6.53652 16.45 6.66666L15.8334 7.28332C15.8036 7.32923 15.7877 7.38277 15.7877 7.43749C15.7877 7.49221 15.8036 7.54575 15.8334 7.59166C15.8834 7.71666 15.9667 7.80832 16.0834 7.80832H16.9917C17.3535 7.82547 17.6948 7.98138 17.9447 8.24366C18.1946 8.50594 18.3338 8.85441 18.3334 9.21666V10.8333C18.3334 11.2046 18.1859 11.5607 17.9233 11.8233C17.6608 12.0858 17.3047 12.2333 16.9334 12.2333H16.025C15.9715 12.2378 15.9204 12.2575 15.8776 12.2899C15.8348 12.3224 15.8021 12.3663 15.7834 12.4167C15.7536 12.4626 15.7377 12.5161 15.7377 12.5708C15.7377 12.6255 15.7536 12.6791 15.7834 12.725L16.425 13.3667C16.5553 13.496 16.6587 13.6499 16.7292 13.8193C16.7998 13.9888 16.8361 14.1706 16.8361 14.3542C16.8361 14.5377 16.7998 14.7195 16.7292 14.889C16.6587 15.0585 16.5553 15.2123 16.425 15.3417L15.3334 16.45C15.2055 16.5815 15.0527 16.6861 14.8838 16.7577C14.7149 16.8293 14.5334 16.8663 14.35 16.8667C13.9779 16.8618 13.6223 16.7123 13.3584 16.45L12.7167 15.8333C12.6708 15.8036 12.6172 15.7877 12.5625 15.7877C12.5078 15.7877 12.4543 15.8036 12.4084 15.8333C12.2834 15.8833 12.1917 15.9667 12.1917 16.0833V16.9917C12.1745 17.3535 12.0186 17.6948 11.7563 17.9447C11.4941 18.1945 11.1456 18.3337 10.7834 18.3333ZM9.47502 16.6667H10.525V16.025C10.5286 15.6407 10.6461 15.2661 10.8627 14.9486C11.0792 14.6312 11.3852 14.3851 11.7417 14.2417C12.0997 14.0852 12.4961 14.0389 12.8805 14.1086C13.2649 14.1784 13.6199 14.361 13.9 14.6333L14.35 15.0833L15.0834 14.35L14.6334 13.8917C14.3628 13.6157 14.1803 13.2656 14.1091 12.8858C14.0379 12.506 14.0811 12.1135 14.2334 11.7583C14.3781 11.4034 14.6247 11.0992 14.9421 10.8842C15.2594 10.6691 15.6334 10.5529 16.0167 10.55H16.6667V9.47499H16.025C15.6407 9.47144 15.2661 9.35393 14.9487 9.13735C14.6312 8.92076 14.3852 8.61484 14.2417 8.25832C14.0852 7.90035 14.0389 7.50388 14.1087 7.11948C14.1784 6.73508 14.3611 6.38016 14.6334 6.09999L15.0834 5.64999L14.35 4.91666L13.8917 5.36666C13.6115 5.62263 13.2639 5.7932 12.89 5.85828C12.5161 5.92337 12.1314 5.88026 11.7811 5.73404C11.4309 5.58781 11.1297 5.34456 10.9131 5.03292C10.6965 4.72128 10.5734 4.35423 10.5584 3.97499V3.33332H9.47502V3.97499C9.47147 4.35928 9.35396 4.73387 9.13738 5.05133C8.92079 5.36879 8.61487 5.61484 8.25835 5.75832C7.90038 5.9148 7.50391 5.96111 7.11951 5.89136C6.73511 5.8216 6.38019 5.63894 6.10002 5.36666L5.65002 4.91666L4.91669 5.64999L5.36669 6.10832C5.62266 6.38855 5.79323 6.73609 5.85831 7.11C5.9234 7.48392 5.88029 7.86864 5.73407 8.21888C5.58784 8.56912 5.34459 8.87029 5.03295 9.08692C4.72131 9.30355 4.35426 9.42663 3.97502 9.44166H3.33335V10.4917H3.97502C4.35931 10.4952 4.7339 10.6127 5.05136 10.8293C5.36882 11.0459 5.61487 11.3518 5.75835 11.7083C5.91483 12.0663 5.96114 12.4628 5.89139 12.8472C5.82163 13.2316 5.63897 13.5865 5.36669 13.8667L4.91669 14.3167L5.65002 15.05L6.10835 14.6C6.38858 14.344 6.73612 14.1734 7.11003 14.1084C7.48395 14.0433 7.86867 14.0864 8.21891 14.2326C8.56915 14.3788 8.87032 14.6221 9.08695 14.9337C9.30358 15.2454 9.42666 15.6124 9.44169 15.9917L9.47502 16.6667Z" fill="black" />
              <path d="M10 12.9166C9.42318 12.9166 8.85927 12.7456 8.37963 12.4251C7.89999 12.1046 7.52615 11.6491 7.30539 11.1161C7.08464 10.5832 7.02688 9.99675 7.13942 9.43097C7.25196 8.86519 7.52974 8.34549 7.93765 7.93759C8.34555 7.52968 8.86525 7.2519 9.43103 7.13936C9.99681 7.02682 10.5833 7.08458 11.1162 7.30533C11.6492 7.52609 12.1047 7.89992 12.4252 8.37957C12.7456 8.85921 12.9167 9.42312 12.9167 9.99998C12.9167 10.7735 12.6094 11.5154 12.0624 12.0624C11.5155 12.6094 10.7736 12.9166 10 12.9166ZM10 8.74998C9.75282 8.74998 9.51114 8.82329 9.30558 8.96064C9.10002 9.098 8.9398 9.29322 8.84519 9.52163C8.75058 9.75003 8.72583 10.0014 8.77406 10.2438C8.82229 10.4863 8.94134 10.709 9.11616 10.8839C9.29097 11.0587 9.5137 11.1777 9.75618 11.226C9.99866 11.2742 10.25 11.2494 10.4784 11.1548C10.7068 11.0602 10.902 10.9 11.0394 10.6944C11.1767 10.4889 11.25 10.2472 11.25 9.99998C11.25 9.66846 11.1183 9.35052 10.8839 9.1161C10.6495 8.88168 10.3316 8.74998 10 8.74998Z" fill="black" />
            </svg>
          </a>
        </div>
        <div className='flex flex-row  mb-[12px] gap-4 pt-[18px] '>
          <button className='bg-[#81929A] button py-2 px-4 rounded-md  w-full' onClick={scanImage}>
            {scan}
          </button>
          <button className='bg-[#4A3F3F] text-[10px] py-2 px-4 rounded-md  w-full button' onClick={selectall} >
            Select all
          </button>
        </div>
      </div>
      <div className='bg-[#EBEBEB] pt-[8px] h-full rounded-[6px] ml-[5px] mr-[6px]'>
        <div className="ml-[6px] mt-[7px] mr-[8px] flex justify-between">
          <div className="main-filter w-[86px] relative">
            <div className='button-filter '>
              <button className="dropdown-toggle border-none flex justify-around items-center w-[86px]" onClick={toggleDropdown}>
                Filter by
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M4 6L0.535899 0.75L7.4641 0.75L4 6Z" fill="#CDAEAE" />
                </svg>
              </button>
            </div>
            {
              isOpen ? (<>
                <div className=' flex flex-col bg-[#f1f1f1] pt-[5px] pb-[5px] open-filter' >
                  {options.map(option => (
                    <label className='flex justify-between pl-[10px] pr-[10px] input-label' key={option.value}>
                      {option.label}
                      <input
                        className='bg-white'
                        type="checkbox"
                        value={option.value}
                        checked={selectedOptions.includes(option.value)}
                        onChange={() => handleCheckboxChange(option.value)}
                      />
                    </label>
                  ))} 
                </div>
              </>) : null
            }
          </div>

          <button className='downloard mr-[8] flex items-center justify-around bg-[#000] w-[110px] h-[28px] text-[12px] text-white py-[3px] px-[2px]  rounded-[4px]' onClick={downloader}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="13" viewBox="0 0 10 13" fill="none">
              <path d="M1 12.1223H9.34169" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.17084 1V9.34169M5.17084 9.34169L7.60383 6.90869M5.17084 9.34169L2.73785 6.90869" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>    Download
          </button>
        </div>
        {
          loader ? (
            <img src={newloader} alt='loader' className='w-[90%]' style={{ mixBlendMode: "darken" }} />) : (
            <div className=' mx-auto grid grid-cols-2 gap-2 mt-4 mr-[7px] ml-[6px] pb-[8px] '>

              {imageInfo && imageInfo.map((items, index) => (
                <div key={index} className=' h-[143px] relative'>
                  <img src={items.imageUrl} className="w-full object-fill h-[143px]" id='imageUrl' />
                  <div className='main_container absolute  mx-auto top-0 flex'>
                    <div className='flex container ml-[2px] mr-[1px] gap-[1px]'>
                      <a href={items.orignalImage} className='bg-black w-[25px] h-[20px] rounded-[4px] flex justify-center items-center  ' download={`original-${index}.jpg`}>
                        <img src={dounloadIcon} className="mr-1" width="11" height="13" />
                      </a>
                      <button className='bg-black w-[25px] ml-[1px] h-[20px] rounded-[4px] flex justify-center items-center' onClick={() => copyUrl(items.imageUrl)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.31391 5.93866C7.91068 5.53543 7.46504 5.08922 7.06181 4.68599C6.20672 3.83147 4.65206 3.931 3.5962 4.98629C2.75299 5.82951 1.71805 6.86501 0.874273 7.70822C-0.181585 8.76408 -0.280554 10.3187 0.574538 11.1733C0.977766 11.5765 1.42341 12.0227 1.82664 12.4259C2.68116 13.2805 4.23583 13.1815 5.29168 12.1256C5.89059 11.5273 6.58563 10.8322 7.24052 10.1774C7.40962 10.0083 7.40962 9.73341 7.24052 9.56431C7.07143 9.39465 6.79601 9.39465 6.62692 9.56431C5.97202 10.2186 5.27698 10.9143 4.67864 11.5126C3.99321 12.198 2.99504 12.3677 2.43968 11.8123L1.18758 10.5602C0.632223 10.0049 0.801884 9.00669 1.48788 8.32126C2.3311 7.47861 3.36603 6.44255 4.20981 5.5999C4.89524 4.9139 5.89341 4.74424 6.44821 5.29903L7.70087 6.5517C7.86997 6.72079 8.14482 6.72079 8.31391 6.5517C8.48301 6.3826 8.48301 6.10775 8.31391 5.93866ZM4.68599 7.06181C5.08922 7.46504 5.53543 7.91068 5.93866 8.31391C6.79318 9.16844 8.34841 9.06947 9.4037 8.01361C10.2469 7.1704 11.2824 6.13546 12.1256 5.29168C13.1815 4.23583 13.2805 2.68116 12.4259 1.82664C12.0227 1.42341 11.5765 0.977766 11.1733 0.574538C10.3187 -0.280554 8.76408 -0.181585 7.70822 0.874273C7.10988 1.47261 6.41484 2.16822 5.75995 2.82255C5.59085 2.99164 5.59085 3.26706 5.75995 3.43616C5.92904 3.60525 6.20389 3.60525 6.37299 3.43616C7.02788 2.78183 7.72293 2.08622 8.32126 1.48788C9.00669 0.801884 10.0049 0.632223 10.5602 1.18758L11.8123 2.43968C12.3677 2.99504 12.198 3.99321 11.5126 4.67864C10.6688 5.52186 9.63388 6.55735 8.79066 7.4C8.10466 8.08657 7.10649 8.25566 6.5517 7.70087L5.29903 6.44821C5.12994 6.27911 4.85509 6.27911 4.68599 6.44821C4.5169 6.6173 4.5169 6.89272 4.68599 7.06181Z" fill="white" />
                        </svg>
                      </button>
                    </div>

                    <div className='flex container ml-[5px] gap-[4px]'>
                      <button className='bg-primary text-[12px] text-white p-[2px] w-full h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        {items.fileSize}
                      </button>
                      <div className='bg-primary text-[12px] ml-[1px] text-white p-[2px] w-full h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        {items.imageExtension}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[4px] ml-2 container mx-auto">
                    <input className='bg-white' type='checkbox' value={items.orignalImage} onChange={handleCheckboxClick} />
                  </div>
                </div>
              ))}
              {initial  ? (<>
                <div className='w-full h-[143px] relative'>
                  <img src={dummyImage} className="w-full object-cover h-[143px]" />
                  <div className='main_container absolute  mx-auto top-1 flex'>
                    <div className='flex container ml-2 gap-[1px]'>
                      <a href={dummyImage} className='bg-black w-[25px] h-[20px] rounded-[4px] flex justify-center items-center  ' download>
                        <img src={dounloadIcon} className="mr-1" width="11" height="13" />
                      </a>
                      <button className='bg-black w-[25px] h-[20px] rounded-[4px] flex justify-center items-center'>

                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.31391 5.93866C7.91068 5.53543 7.46504 5.08922 7.06181 4.68599C6.20672 3.83147 4.65206 3.931 3.5962 4.98629C2.75299 5.82951 1.71805 6.86501 0.874273 7.70822C-0.181585 8.76408 -0.280554 10.3187 0.574538 11.1733C0.977766 11.5765 1.42341 12.0227 1.82664 12.4259C2.68116 13.2805 4.23583 13.1815 5.29168 12.1256C5.89059 11.5273 6.58563 10.8322 7.24052 10.1774C7.40962 10.0083 7.40962 9.73341 7.24052 9.56431C7.07143 9.39465 6.79601 9.39465 6.62692 9.56431C5.97202 10.2186 5.27698 10.9143 4.67864 11.5126C3.99321 12.198 2.99504 12.3677 2.43968 11.8123L1.18758 10.5602C0.632223 10.0049 0.801884 9.00669 1.48788 8.32126C2.3311 7.47861 3.36603 6.44255 4.20981 5.5999C4.89524 4.9139 5.89341 4.74424 6.44821 5.29903L7.70087 6.5517C7.86997 6.72079 8.14482 6.72079 8.31391 6.5517C8.48301 6.3826 8.48301 6.10775 8.31391 5.93866ZM4.68599 7.06181C5.08922 7.46504 5.53543 7.91068 5.93866 8.31391C6.79318 9.16844 8.34841 9.06947 9.4037 8.01361C10.2469 7.1704 11.2824 6.13546 12.1256 5.29168C13.1815 4.23583 13.2805 2.68116 12.4259 1.82664C12.0227 1.42341 11.5765 0.977766 11.1733 0.574538C10.3187 -0.280554 8.76408 -0.181585 7.70822 0.874273C7.10988 1.47261 6.41484 2.16822 5.75995 2.82255C5.59085 2.99164 5.59085 3.26706 5.75995 3.43616C5.92904 3.60525 6.20389 3.60525 6.37299 3.43616C7.02788 2.78183 7.72293 2.08622 8.32126 1.48788C9.00669 0.801884 10.0049 0.632223 10.5602 1.18758L11.8123 2.43968C12.3677 2.99504 12.198 3.99321 11.5126 4.67864C10.6688 5.52186 9.63388 6.55735 8.79066 7.4C8.10466 8.08657 7.10649 8.25566 6.5517 7.70087L5.29903 6.44821C5.12994 6.27911 4.85509 6.27911 4.68599 6.44821C4.5169 6.6173 4.5169 6.89272 4.68599 7.06181Z" fill="white" />
                        </svg>

                      </button>
                    </div>

                    <div className='flex container ml-2 gap-[1px]'>
                      <button className='bg-primary text-[12px] text-white w-[44px] h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        421kb
                      </button>
                      <div className='bg-primary text-[12px] text-white w-[33px] h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        PNG
                      </div>
                    </div>

                  </div>
                  <div className="absolute bottom-[4px] ml-2 container mx-auto">
                    <input className='bg-white' type='checkbox' />
                  </div>
                </div>
                <div className='w-full h-[143px] relative'>
                  <img src={dummyImage} className="w-full object-cover h-[143px]" />
                  <div className='main_container absolute  mx-auto top-1 flex'>
                    <div className='flex container ml-2 gap-[1px]'>
                      <a href={dummyImage} className='bg-black w-[25px] h-[20px] rounded-[4px] flex justify-center items-center  ' download>
                        <img src={dounloadIcon} className="mr-1" width="11" height="13" />
                      </a>
                      <button className='bg-black w-[25px] h-[20px] rounded-[4px] flex justify-center items-center'>

                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.31391 5.93866C7.91068 5.53543 7.46504 5.08922 7.06181 4.68599C6.20672 3.83147 4.65206 3.931 3.5962 4.98629C2.75299 5.82951 1.71805 6.86501 0.874273 7.70822C-0.181585 8.76408 -0.280554 10.3187 0.574538 11.1733C0.977766 11.5765 1.42341 12.0227 1.82664 12.4259C2.68116 13.2805 4.23583 13.1815 5.29168 12.1256C5.89059 11.5273 6.58563 10.8322 7.24052 10.1774C7.40962 10.0083 7.40962 9.73341 7.24052 9.56431C7.07143 9.39465 6.79601 9.39465 6.62692 9.56431C5.97202 10.2186 5.27698 10.9143 4.67864 11.5126C3.99321 12.198 2.99504 12.3677 2.43968 11.8123L1.18758 10.5602C0.632223 10.0049 0.801884 9.00669 1.48788 8.32126C2.3311 7.47861 3.36603 6.44255 4.20981 5.5999C4.89524 4.9139 5.89341 4.74424 6.44821 5.29903L7.70087 6.5517C7.86997 6.72079 8.14482 6.72079 8.31391 6.5517C8.48301 6.3826 8.48301 6.10775 8.31391 5.93866ZM4.68599 7.06181C5.08922 7.46504 5.53543 7.91068 5.93866 8.31391C6.79318 9.16844 8.34841 9.06947 9.4037 8.01361C10.2469 7.1704 11.2824 6.13546 12.1256 5.29168C13.1815 4.23583 13.2805 2.68116 12.4259 1.82664C12.0227 1.42341 11.5765 0.977766 11.1733 0.574538C10.3187 -0.280554 8.76408 -0.181585 7.70822 0.874273C7.10988 1.47261 6.41484 2.16822 5.75995 2.82255C5.59085 2.99164 5.59085 3.26706 5.75995 3.43616C5.92904 3.60525 6.20389 3.60525 6.37299 3.43616C7.02788 2.78183 7.72293 2.08622 8.32126 1.48788C9.00669 0.801884 10.0049 0.632223 10.5602 1.18758L11.8123 2.43968C12.3677 2.99504 12.198 3.99321 11.5126 4.67864C10.6688 5.52186 9.63388 6.55735 8.79066 7.4C8.10466 8.08657 7.10649 8.25566 6.5517 7.70087L5.29903 6.44821C5.12994 6.27911 4.85509 6.27911 4.68599 6.44821C4.5169 6.6173 4.5169 6.89272 4.68599 7.06181Z" fill="white" />
                        </svg>
                      </button>
                    </div>
                    <div className='flex container ml-2 gap-[1px]'>
                      <button className='bg-primary text-[12px] text-white w-[44px] h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        421kb
                      </button>
                      <div className='bg-primary text-[12px] text-white w-[33px] h-[20px] rounded-[4px] flex justify-center items-center detail_text'>
                        PNG
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[4px] ml-2 container mx-auto">
                    <input className='bg-white' type='checkbox' />
                  </div>
                </div>
              </>) : null}
            </div>
          )
        }
        <div>
          {filterImageLength == 0   && imageInfo.length == 0 ? (<h1 className='flex justify-center items-center text-[12px] pt-[20px] font-semibold	'>No Image Found For selective filter</h1>) : (null)}
        </div>
      </div>
    </>
  )
}
export default ImageExtractor

