# NFTs booster packs

This project was created as part of the gitcoin contest https://gitcoin.co/hackathon/0x-hack?org=smartcontractkit

These are the bounties participating:

EthWorks

https://gitcoin.co/issue/EthWorks/useDApp/178/100025570

https://gitcoin.co/issue/EthWorks/useDApp/176/100025566

Polygon

https://gitcoin.co/issue/maticnetwork/matic-bounties/21/100025715

Chainlink

https://gitcoin.co/issue/smartcontractkit/chainlink/4375/100025683


## About

DApp to create and buy NFTs booster packs.  Made with useDApp for building the platform, Chainlink to get a random number used for deciding the content of the pack and deployed to Polygon's Mumbai testnetwork

Smart contracts deployed to Polygon's Mumbai testnet:

TokenPack contract Address: 0xb5d79FA12a4BC71c0a48E8784D2FC8b5B4172Dd0

Token contract address: 0x39aC18F547ce1bdA85F417247e12935299842e5f

Blueprint contract address: 0xc9546c96a69da6A28902B3A9C92896dF62FCEB2a

## Vide Demo

https://youtu.be/d_ibhxWMgI8

## Run localy

First we install the dependencies
```
yarn
```

### You will need 3 parallel terminals:
### Terminal 1: hardhat local node
Run the following to start a local node fork of mumbai polygon testnet
```
npx hardhat node
```
The terminal will display some accounts which you can use to import them to Metamask for testing

### Terminal 2: Deployment
Now that the network is running, you need to deploy the contract to the running Hardhat Network node

```
npx hardhat run scripts/deploy.ts --network localhost
```

### Terminal 3: Frontend
First make sure the frontend/src/index/js is pointing to the correct chain and URL

```
const config = {
  readOnlyChainId: ChainId.Hardhat,
  readOnlyUrls: {
    [ChainId.Hardhat]: "http://127.0.0.1:8545",
  },
  supportedChains: [[ChainId.Hardhat]],
  multicallAddresses: {
    [ChainId.Hardhat]: "0x935Bfe9AfaA2Be26049ea4EDE40A3A2243361F87",
  },
};
```

To run the local server to serve the react application, run the following commands
```
# Navigate to frontend app
cd frontend
yarn start
```

### Mocking VRFCoordinator locally
We can mock the VRFCoordinator for testing by deploying our own coordinator and execute the fulfillment. The deployment script already deploys the coordinator mock for testnets, just run the following command to fulfill a request
```
npx hardhat vrf-callback --request 0x60b962966c755228e0c0b987ebfdfc6836ba45cda53cb25cea7f1bfc134da232 --coordinator 0xc1EeD9232A0A44c2463ACB83698c162966FBc78d --tokenpack 0x12456Fa31e57F91B70629c1196337074c966492a --randomness 777 --network localhost
```

replace

--request : for the requestId to simulate (it's thrown in the browsers console when buying  pack)

--coordinator : the coordinator address, which was logged in the console when the deployment script was executed

-- tokenpack : the address of the TokenPack contract which was logged in the console when the deployment script was executed

-- randomness : the random number to send to the consumer (TokenPack contract)

## Pending stuff for the future
- fix useDapp dependencies when the pull request is merged or an alternative solution is provided
- refactor code, there is a lot of shitty and duplicated code that can be improved because I was in a hurry and in learning process