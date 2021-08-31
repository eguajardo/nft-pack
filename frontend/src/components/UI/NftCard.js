import { loadJsonFromIPFS, ipfsPathToURL } from "../../helpers/ipfs";
import { useState, useCallback, useEffect } from "react";

function NftCard(props) {
  const [metadata, setMetadata] = useState({});

  const source = ipfsPathToURL(metadata.image);

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
        <video
          key={source}
          autoPlay
          muted
          loop
          poster={source}
          className="card-img-top"
        >
          <source src={source} />
        </video>
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
