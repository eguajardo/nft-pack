import { Link } from 'react-router-dom';

function NFTIndex() {
  return (
    <div>
      <div id="actions" className="container mb-3 d-flex flex-row-reverse">
        <Link className="btn btn-outline-info" to="/nfts/new">
          Create NFT blueprint
        </Link>
      </div>
      <div className="container content-container">

      </div>
    </div>
  );
}

export default NFTIndex;
