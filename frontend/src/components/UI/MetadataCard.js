import { ipfsPathToURL } from "../../utils/ipfs-utils";
import useMetadata from "../../hooks/use-metadata";
import { useState } from "react";

/**
 * @param {object} props
 * props.id: the id of the card
 * props.uri: metadata location URI
 * props.onSetSelected: function to call when selected (optional)
 * @returns
 */
function MetadataCard(props) {
  const metadata = useMetadata(props.uri);
  const [selected, setSelected] = useState(false);

  const toggleSelected = () => {
    // Only if callback function is defined
    if (props.onSetSelected) {
      if (selected) {
        setSelected(false);
        props.onSetSelected(props.id, false);
      } else {
        setSelected(true);
        props.onSetSelected(props.id, true);
      }
    }
  };

  return (
    <div
      className={selected ? "card selected" : "card"}
      onClick={toggleSelected}
    >
      {metadata.image && (
        <img
          className="card-img-top"
          alt={metadata.name}
          src={ipfsPathToURL(metadata.image)}
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

export default MetadataCard;
