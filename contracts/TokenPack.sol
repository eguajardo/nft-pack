// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";

import "./Token.sol";
import "./Utils.sol";

/**
 * @title TokenPack
 * @notice The pack responsible for selling random Tokens from collections
 */
contract TokenPack is Context, VRFConsumerBase {
    using Strings for uint256;

    bytes32 internal keyHash;
    uint256 internal chainlinkFee;

    uint256 internal randomResult;

    uint8 public constant MINIMUM_PACK_PRICE = 1;
    uint8 public constant MINIMUM_PACK_CAPACITY = 1;
    uint8 public constant MINIMUM_COLLECTION_BLUEPRINTS = 5;

    Token private tokenContract;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` for the token.
     */
    constructor (
            string memory name, 
            string memory symbol, 
            address vrfCoordinator, 
            address linkToken,
            bytes32 keyHash_,
            uint256 chainlinkFee_
        ) VRFConsumerBase (
            vrfCoordinator,
            linkToken
        ) 
    { 
        keyHash = keyHash_;
        chainlinkFee = chainlinkFee_;
        tokenContract = new Token(name, symbol, address(this));
    }
    
    /**
     * @notice Struct containing the collection details
     */
    struct TokenCollection {
        string ipfsPath;
        uint256 price;
        uint8 capacity;
        uint256[] blueprints;
    }

    /**
     * @notice Struct containing information from purchase order
     */
    struct PurchaseOrder {
        address buyer;
        uint256 collectionId;
    }

    /**
     * @dev Mapping from distributor to list of collections IDs
     */
    mapping (address => uint256[]) private _distributorCollections;

    /**
     * @dev Keeps track of total of collections
     */
    uint256 private _collectionsCounter;

    /**
     * @dev Mapping storing all TokenCollections
     */
    mapping (uint256 => TokenCollection) private _tokenCollections;

    /**
     * @dev Mapping from the requestId for randomness (ie. purchase order id) to the Purchase order
     */
    mapping (bytes32 => PurchaseOrder) private _purchaseOrders;

    /**
     * @notice Emitted when the sender 'distributor' creates the collection with index 'collectionIndex'
     */
    event CollectionCreated (address indexed distributor, uint256 indexed collectionId, uint256 distributorCollectionIndex);

    /**
     * @notice Emitted when the 'buyer' generates a 'purchaseOrderId' for purchasing a pack from the collection with ID 'collectionId'
     */
    event PurchaseOrdered (address indexed buyer, uint256 collectionId, bytes32 indexed purchaseOrderId);

    /**
     * @notice Emitted when the pack bought by 'buyer' in 'purchaseOrderId' was opened
     */
    event PackOpened (bytes32 indexed purchaseOrderId, address indexed buyer);

    /**
     * @notice Gets the address of the used ERC721 for minting
     * @return address of the Token contract
     */
    function tokenContractAddress() external view returns(address) {
        return address(tokenContract);
    }

    /**
     * @notice Creates a new token collection
     * @param ipfsPath The path to the collection metadata
     * @param price Cost to buy a pack from this collection
     * @param capacity The amount of cards per pack in this collection
     * @param blueprints An array of blueprint keys that represents this collection
     * @return id of the collection index relative to the collection creator
     */
    function createTokenCollection(string calldata ipfsPath,
            uint256 price, 
            uint8 capacity, 
            uint256[] calldata blueprints) external returns (uint256) {
        
        require (Utils.isNotEmptyString(ipfsPath), "ERROR_EMPTY_IPFS_PATH");
        require (price >= MINIMUM_PACK_PRICE, "ERROR_PRICE_UNDER_LIMIT");
        require (capacity >= MINIMUM_PACK_CAPACITY, "ERROR_CAPACITY_UNDER_LIMIT");
        require (blueprints.length >= MINIMUM_COLLECTION_BLUEPRINTS, "ERROR_BLUEPRINTS_UNDER_LIMIT");

        uint256 collectionId = _collectionsCounter;
        _collectionsCounter += 1;
        uint256 distributorCollectionIndex = _distributorCollections[_msgSender()].length;

        TokenCollection storage collection = _tokenCollections[collectionId];
        collection.ipfsPath = ipfsPath;
        collection.price = price;
        collection.capacity = capacity;
        collection.blueprints = blueprints;

        _distributorCollections[_msgSender()].push(collectionId);        

        emit CollectionCreated(_msgSender(), collectionId, distributorCollectionIndex);
        return collectionId;
    }

    /**
     * @notice Buys a pack of Tokens as defined in the collection
     * @param collectionId The collection ID to which the pack belongs
     */
    function buyPack(uint256 collectionId) public returns (bytes32) {
        // TODO: price and token transfer
        // TODO: income amount split

        require(exist(collectionId), "ERROR_INVALID_COLLECTION_ID");

        uint256 seed = uint(keccak256(abi.encodePacked(_msgSender())));
        // callback function will be fulfillRandomness (see Chainlink VRF documentation)
        bytes32 requestId = _requestRandomTokens(seed);

        _purchaseOrders[requestId] = PurchaseOrder(
            _msgSender(), collectionId
        );

        emit PurchaseOrdered(_msgSender(), collectionId, requestId);
        return requestId;
    }

    /**
     * @notice Collection URI pointing to it's metadata.
     */
    function collectionURI(uint256 collectionId) external view returns (string memory) {
        require(exist(collectionId), "ERROR_INVALID_COLLECTION_ID");
        return string(abi.encodePacked("ipfs://", _tokenCollections[collectionId].ipfsPath));
    }

    function exist(uint256 collectionId) public view returns (bool) {
        return Utils.isNotEmptyString(_tokenCollections[collectionId].ipfsPath);
    }

    /**
     * @notice Returns the total amount of collections stored by the contract.
     */
    function totalCollections() external view returns (uint256) {
        return _collectionsCounter;
    }

    /**
     * @dev internal function caalled after random number is generated to open the pack bought
     * @param randomNumber The random number received from chainlink
     * @param purchaseOrderId The purchase order id, ie. the request id for randomness to chainlink 
     * @param buyer The buyer address
     * @param collectionId The collection ID to which the pack belongs
     */
    function _openPack(uint256 randomNumber, bytes32 purchaseOrderId, address buyer, uint256 collectionId) internal {
        TokenCollection storage collection = _tokenCollections[collectionId];

        for (uint8 i = 0; i < collection.capacity; i++) {
            uint256 derivedRandom = uint(keccak256(abi.encodePacked(randomNumber, i)));

            uint256 index = derivedRandom % collection.blueprints.length;

            tokenContract.mintFromBlueprint(
                buyer, 
                collection.blueprints[index]
            );
        }

        emit PackOpened(purchaseOrderId, buyer);
    }

    /** 
     * @dev Requests random number from chainlink to generate content of pack
     */
    function _requestRandomTokens(uint256 userProvidedSeed) internal returns (bytes32 requestId) {
        require (LINK.balanceOf(address(this)) >= chainlinkFee, "ERROR_NOT_ENOUGH_LINK");

        return requestRandomness(keyHash, chainlinkFee, userProvidedSeed);
    }

    /**
     * @notice Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        require (_purchaseOrders[requestId].buyer != address(0), "ERROR_INVALID_PURCHASE_ORDER");

        _openPack(
            randomness,
            requestId,
            _purchaseOrders[requestId].buyer,
            _purchaseOrders[requestId].collectionId
        );
    }
}