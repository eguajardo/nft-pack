import { loadJsonFromIPFS } from "../../utils/ipfs-utils";
import { useState } from "react";

function NftCard(props) {
  const [metadata, setMetadata] = useState({});

  loadJsonFromIPFS(props.uri.replace("ipfs://", "")).then((json) => {
    setMetadata(json);
  });

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div>{metadata.title && metadata.title}</div>
          <br/>
          <div>{metadata.description && metadata.description}</div>
        </div>
      </div>
    </div>
  );
}

export default NftCard;
