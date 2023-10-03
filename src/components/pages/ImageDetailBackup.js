import React, { useState, useEffect } from 'react';

function ImageToBase64() {
  const imageUrls ="https://www.ktmsolutions.com.au/wp-content/uploads/2023/07/ktm-solutions-logo.png"
   
  
  const [base64Images, setBase64Images] = useState([]);

  async function convertImageUrlToBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching and converting image:", error);
      return null;
    }
  }
  
  const imageUrl = "https://www.ktmsolutions.com.au/wp-content/uploads/2023/07/ktm-solutions-logo.png";
  
  convertImageUrlToBase64(imageUrl)
    .then((base64Image) => {
      if (base64Image) {
        console.log(base64Image)
        console.log("Base64 image:", base64Image);
      } else {
        console.log("Image conversion failed.");
      }
    });

  useEffect(() => {
    async function fetchImagesAndConvertToBase64() {
      try {
        const base64ImageArray = await Promise.all(
          imageUrls.map(async (item) => {
            const response = await fetch(item.imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise((resolve) => {
              reader.onloadend = () => {
                resolve(reader.result);
              };
              reader.readAsDataURL(blob);
            });
          })
        );
        
        setBase64Images(base64ImageArray);
      } catch (error) {
        console.error("Error fetching and converting images:", error);
      }
    }

    fetchImagesAndConvertToBase64();
  }, []);
  

  return (
    <div>
      {base64Images.length > 0 ? (
        base64Images.map((base64Image, index) => (
          <img key={index} src={base64Image} alt={`Image ${index}`} />
        ))
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default ImageToBase64;


const copyUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert("URL is copied");
    } catch (error) {
      console.error("Clipboard write failed:", error);
    }
  };