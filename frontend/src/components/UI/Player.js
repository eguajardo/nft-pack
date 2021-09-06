import { ipfsPathToURL } from "../../helpers/ipfs";

import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-regular-svg-icons";

function Player(props) {
  const [isPreview, setPreview] = useState(true);

  const videoPreviewRef = useRef();
  const videoRef = useRef();

  const image = ipfsPathToURL(props.image);
  const animation = ipfsPathToURL(props.animation_url);

  const play = () => {
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
        <div>
          <video
            key={"image_" + image}
            ref={videoPreviewRef}
            autoPlay
            muted
            loop
            poster={image}
            className={props.className}
          >
            <source src={image} />
          </video>
          {animation && (
            <div className="play-button" onClick={play}>
              <FontAwesomeIcon icon={faPlayCircle} />
            </div>
          )}
        </div>
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
