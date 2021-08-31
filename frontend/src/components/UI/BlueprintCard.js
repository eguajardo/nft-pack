import { loadJsonFromIPFS, ipfsPathToURL } from "../../helpers/ipfs";
import { useState, useCallback, useEffect } from "react";

function BlueprintCard(props) {
  const [metadata, setMetadata] = useState({});
  const [selected, setSelected] = useState(false);

  const source = ipfsPathToURL(metadata.image);

  const loadMetadata = useCallback(async () => {
    const json = await loadJsonFromIPFS(props.uri);

    setMetadata(json);
  }, [props.uri]);

  const toggleSelected = () => {
    if (selected) {
      setSelected(false);
      props.setSelected(props.blueprintId, false);
    } else {
      setSelected(true);
      props.setSelected(props.blueprintId, true);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return (
    <div
      className={selected ? "card selected" : "card"}
      onClick={toggleSelected}
    >
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

export default BlueprintCard;
