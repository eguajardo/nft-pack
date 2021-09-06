import { useEffect, useRef, useState } from "react";
import { ipfsPathToURL } from "../../helpers/ipfs";

function Player(props) {
  const [isPreview, setPreview] = useState(true);

  const videoPreviewRef = useRef();
  const videoRef = useRef();

  const image = ipfsPathToURL(props.image);
  const animation = ipfsPathToURL(props.animation_url);

  const play = (event) => {
    if (animation) {
      console.log(
        "videoPreviewRef.current.currentTime",
        videoPreviewRef.current?.currentTime
      );
      setPreview(false);
    }
  };

  useEffect(() => {
    if (!isPreview) {
      console.log(
        "videoRef.current.currentTime",
        videoRef.current?.currentTime
      );

      videoRef.current.play();
    }
  }, [isPreview]);

  return (
    <div>
      {isPreview && (
        <video
          key={"image_" + image}
          ref={videoPreviewRef}
          autoPlay
          muted
          loop
          poster={image}
          className={props.className}
          onClick={play}
        >
          <source src={image} />
        </video>
      )}

      {!isPreview && (
        <video
          key={"animation_" + animation}
          ref={videoRef}
          controls
          loop
          className={props.className}
        >
          <source src={animation} />
        </video>
      )}
    </div>
  );
}

export default Player;
