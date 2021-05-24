import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container">
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div className="navbar-nav ml-auto">
            <NavLink
              id="new-link"
              className="nav-item nav-link"
              activeClassName="active"
              to="/nfts"
            >
              Browse NFTs
            </NavLink>
            <NavLink
              id="new-link"
              className="nav-item nav-link"
              activeClassName="active"
              to="/boosters"
            >
              Buy Booster Packs
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
