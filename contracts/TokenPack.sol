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

    /**
     * @notice Struct containing the collection details
     */
    struct TokenCollection {
        string ipfsPath;
        uint256 price;
        uint8 capacity;
        uint256[] blueprints;
        address distributor; // creator of the collection
    }

    /**
     * @notice Struct containing information from purchase order
     */
    struct PurchaseOrder {
        address buyer;
        uint256 collectionId;
        uint256[] mintedTokens;
        uint256 signature;      // random number coming from Chainlink
    }

    uint8 public constant MINIMUM_PACK_PRICE = 1;
    uint8 public constant MINIMUM_PACK_CAPACITY = 1;
    uint8 public constant MINIMUM_COLLECTION_BLUEPRINTS = 5;

    bytes32 internal keyHash;
    uint256 internal chainlinkFee;

    Token internal tokenContract;

    /**
     * @dev Keeps track of total of collections
     */
    uint256 private _collectionsCounter;

    /**
     * @dev Mapping from distributor to list of collections IDs
     */
    mapping(address => uint256[]) private _distributorCollections;

    /**
     * @dev Mapping storing all TokenCollections
     */
    mapping(uint256 => TokenCollection) private _tokenCollections;

    /**
     * @dev Mapping from the requestId for randomness (ie. purchase order id) to the Purchase order
     */
    mapping(bytes32 => PurchaseOrder) private _purchaseOrders;

    /**
     * @notice Emitted when the sender 'distributor' creates the collection with index 'collectionIndex'
     */
    event CollectionCreated (address indexed distributor, uint256 indexed collectionId, uint256 distributorCollectionIndex);

    /**
     * @notice Emitted when the 'buyer' generates a 'purchaseOrderId' for purchasing a pack from the collection with ID 'collectionId'
     */
    event PurchaseOrdered (address indexed buyer, uint256 indexed collectionId, bytes32 indexed purchaseOrderId);

    /**
     * @notice Emitted when the purchase order with 'purchaseOrderId' was signed
     */
    event PurchaseOrderSigned (bytes32 indexed purchaseOrderId);

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
        collection.distributor = _msgSender();

        _distributorCollections[_msgSender()].push(collectionId);        

        emit CollectionCreated(_msgSender(), collectionId, distributorCollectionIndex);
        return collectionId;
    }

    /**
     * @notice Buys a pack of Tokens as defined in the collection
     * @param collectionId The collection ID to which the pack belongs
     */
    function buyPack(uint256 collectionId) payable public returns (bytes32) {
        require(exist(collectionId), "ERROR_INVALID_COLLECTION_ID");
        TokenCollection storage collection = _tokenCollections[collectionId];
        require(msg.value == collection.price, "ERROR_INVALID_AMOUNT");

        uint256 seed = uint(keccak256(abi.encodePacked(_msgSender())));
        // callback function will be fulfillRandomness (see Chainlink VRF documentation)
        bytes32 purchaseOrderId = _requestRandomTokens(seed);

        uint256[] memory mintedTokens = new uint256[](collection.capacity);
        for (uint256 i = 0; i < collection.capacity; i++) {
            uint256 tokenId = tokenContract.mintFromPack(
                _msgSender(), 
                purchaseOrderId,
                i
            );
            mintedTokens[i] = tokenId;
        }

        _purchaseOrders[purchaseOrderId] = PurchaseOrder(
            _msgSender(), collectionId, mintedTokens, 0
        );

        payable(collection.distributor).transfer(msg.value);

        emit PurchaseOrdered(_msgSender(), collectionId, purchaseOrderId);
        return purchaseOrderId;
    }

    /**
     * @notice Collection URI pointing to it's metadata.
     * @param collectionId The ID of the collection to look for
     * @return the collection URI pointing to its metadata
     */
    function collectionURI(uint256 collectionId) external view returns (string memory) {
        require(exist(collectionId), "ERROR_INVALID_COLLECTION_ID");
        return string(abi.encodePacked("ipfs://", _tokenCollections[collectionId].ipfsPath));
    }

    /**
     * @notice Gets the TokenCollection struct containing all its relevant information

     * @param collectionId The ID of the collection to look for
     * @return the TokenCollection struct containing all its relevant information
     */
    function tokenCollection(uint256 collectionId) external view returns (TokenCollection memory) {
        require(exist(collectionId), "ERROR_INVALID_COLLECTION_ID");
        return _tokenCollections[collectionId];
    }

    /**
     * @notice Retrieves the token ids of the minted tokens by this purchase order
     * @param purchaseOrderId The purchase order ID
     * @return an array containing the minted tokens
     */
    function purchaseOrderTokens(bytes32 purchaseOrderId) external view returns (uint256[] memory) {
        require(_purchaseOrders[purchaseOrderId].buyer != address(0), "ERROR_INVALID_PURCHASE_ORDER");
        return _purchaseOrders[purchaseOrderId].mintedTokens;
    }

    /**
     * @notice Gets the ID of the blueprint for the minted token from the purchase order and token index
     * @param purchaseOrderId The purchase order ID that minted the token
     * @param index The index of the minted token in the pack purchased
     * @return the blueprint id
     */
    function mintedBlueprint(bytes32 purchaseOrderId, uint256 index) external view returns (uint256) {
        require(_purchaseOrders[purchaseOrderId].buyer != address(0), "ERROR_INVALID_PURCHASE_ORDER");
        
        uint256 signature = _purchaseOrders[purchaseOrderId].signature;
        uint256 collectionId = _purchaseOrders[purchaseOrderId].collectionId;

        require(signature != 0, "ERROR_TOKEN_NOT_SIGNED");
        
        // Calculated based on Chainlink's signature. 
        uint256 tokenSignature = uint(keccak256(abi.encodePacked(signature, index)));
        uint256 blueprintIndex = tokenSignature % _tokenCollections[collectionId].blueprints.length;
        
        return _tokenCollections[collectionId].blueprints[blueprintIndex];
    }

    /**
     * @notice Gets the purchase order signature
     * @param purchaseOrderId The purchase order
     */
    function purchaseOrderSignature(bytes32 purchaseOrderId) external view returns (uint256) {
        require (_purchaseOrders[purchaseOrderId].buyer != address(0), "ERROR_INVALID_PURCHASE_ORDER");

        return _purchaseOrders[purchaseOrderId].signature;
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
     * @dev Requests random number from chainlink to generate content of pack
     */
    function _requestRandomTokens(uint256 userProvidedSeed) internal returns (bytes32 requestId) {
        require (LINK.balanceOf(address(this)) >= chainlinkFee, "ERROR_NOT_ENOUGH_LINK");

        return requestRandomness(keyHash, chainlinkFee, userProvidedSeed);
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * This is done so that chainlink's callback doesn't run out of gas when 
     * opening booster packs with high capacity.
     * This way we mint the tokens during the purchase order and Chainlink only
     * signs the order.
     * The signature is used to calculate the blueprint of the Token
     */
    function fulfillRandomness(bytes32 purchaseOrderId, uint256 randomness) internal override {
        require (_purchaseOrders[purchaseOrderId].buyer != address(0), "ERROR_INVALID_PURCHASE_ORDER");

        _purchaseOrders[purchaseOrderId].signature = randomness;
        emit PurchaseOrderSigned(purchaseOrderId);
    }
}