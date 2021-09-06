export const getVideoPoster = (source) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement("video");

      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = canvas.toBlob((blob) => {
          const file = new File([blob], "poster.png");
          resolve(file);
        }, "image/png");
      };

      video.src = source;
    } catch (error) {
      reject(error);
    }
  });
};
