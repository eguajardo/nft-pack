import { loadJsonFromIPFS } from "../../helpers/ipfs";
import { useState, useCallback, useEffect } from "react";

import Player from "./Player";

function NftCard(props) {
  const [metadata, setMetadata] = useState({});

  const loadMetadata = useCallback(async () => {
    const json = await loadJsonFromIPFS(props.uri);

    setMetadata(json);
  }, [props.uri]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return (
    <div className="card">
      {metadata.image && (
        <Player
          image={metadata.image}
          animation_url={metadata.animation_url}
          className="card-img-top"
        />
      )}
      <div className="card-body">
        {metadata.name && (
          <div>
            <div className="mt-2 font-weight-bold">{"Title:"}</div>
            <div>{metadata.name}</div>
          </div>
        )}

        {metadata.description && (
          <div>
            <div className="font-weight-bold">{"Description:"}</div>
            <div>{metadata.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NftCard;
