import { loadJsonFromIPFS } from "../utils/ipfs-utils";
import { useState, useEffect } from "react";

function useMetadata(uri) {
  const [metadata, setMetadata] = useState({});

  const loadMetadata = async () => {
    const json = await loadJsonFromIPFS(uri);

    setMetadata(json);
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  return metadata;
}

export default useMetadata;
