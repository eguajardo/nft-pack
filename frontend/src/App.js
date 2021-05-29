import './App.css';
import { Switch, Route } from 'react-router-dom';

import NFTIndex from './pages/NFTIndex'
import NFTNew from './pages/NFTNew';
import CollectionIndex from './pages/CollectionIndex';

import Navbar from './components/Layout/Navbar';

function App() {
  return (
    <div>
      <Navbar />
      <Switch>
        <Route path="/nfts/new">
          <NFTNew />
        </Route>
        <Route path="/nfts">
          <NFTIndex />
        </Route>
        <Route path="/boosters">
          <CollectionIndex />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
