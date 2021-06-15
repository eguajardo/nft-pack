import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ChainId, DAppProvider } from "@usedapp/core";
import { BrowserRouter } from "react-router-dom";

const config = {
  readOnlyChainId: ChainId.Hardhat,
  readOnlyUrls: {
    [ChainId.Hardhat]: "http://127.0.0.1:8545",
  },
  supportedChains: [ChainId.Hardhat],
  multicallAddresses: {
    [ChainId.Hardhat]: "0x935Bfe9AfaA2Be26049ea4EDE40A3A2243361F87",
  },
};

// const config = {
//   readOnlyChainId: ChainId.Mumbai,
//   readOnlyUrls: {
//     [ChainId.Mumbai]: "https://rpc-mumbai.maticvigil.com",
//   },
//   supportedChains: [ChainId.Mumbai],
//   multicallAddresses: {
//     [ChainId.Mumbai]: "0x935Bfe9AfaA2Be26049ea4EDE40A3A2243361F87",
//   },
// };

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
