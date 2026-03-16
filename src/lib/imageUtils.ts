export const resizeImage = (file: File | Blob, targetWidth = 300, targetHeight = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Calculate center crop for 3:4 aspect ratio
        const targetAspect = targetWidth / targetHeight;
        const imgAspect = img.width / img.height;
        
        let cropWidth = img.width;
        let cropHeight = img.height;
        let cropX = 0;
        let cropY = 0;
        
        if (imgAspect > targetAspect) {
          // Image is wider than 3:4, crop sides
          cropWidth = img.height * targetAspect;
          cropX = (img.width - cropWidth) / 2;
        } else if (imgAspect < targetAspect) {
          // Image is taller than 3:4, crop top/bottom
          cropHeight = img.width / targetAspect;
          cropY = (img.height - cropHeight) / 2;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(
            img, 
            cropX, cropY, cropWidth, cropHeight, // Source crop
            0, 0, targetWidth, targetHeight      // Destination
          );
        }
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
