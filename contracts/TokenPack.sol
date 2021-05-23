// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./ICommonStructs.sol";
import "./Token.sol";
import "./Utils.sol";

/**
 * @title TokenPack
 * @notice The pack responsible for selling random Tokens from collections
 */
contract TokenPack is Context, ICommonStructs {
    using Strings for uint256;

    uint8 public constant MINIMUM_PACK_PRICE = 1;
    uint8 public constant MINIMUM_PACK_CAPACITY = 1;
    uint8 public constant MINIMUM_COLLECTION_BLUEPRINTS = 20;

    Token private tokenContract;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` for the token.
     */
    constructor (string memory name, string memory symbol) { 
        tokenContract = new Token(name, symbol, address(this));
    }
    
    /**
     * @notice Struct containing the collection details
     */
    struct TokenCollection {
        string name;
        string description;
        uint256 price;
        uint8 capacity;
        uint256 collectionSize;
        mapping (uint256 => BlueprintKey) blueprints;
    }

    /**
     * @dev Mapping of the packer to their current own collections index counter
     * Limit maximum collections index per author to 65535 by using uint16
     */
    mapping (address => uint16) private _mapPackerToCollectionCounter;

    /**
     * @dev Mapping of the addresses that created the collection and their Collections
     */
    mapping (address => mapping (uint16 => TokenCollection)) private _mapPackerToCollection;

    /**
     * @notice Emitted when the sender 'packer' creates the collection with index 'collectionIndex'
     */
    event CollectionCreated (address indexed packer, uint16 indexed collectionIndex);

    /**
     * @notice Emitted when the 'buyer' buys a pack from 'packer' collection with index 'collectionIndex'
     */
    event PackBought (address indexed buyer, address indexed packer, uint16 indexed collectionIndex);

    /**
     * @notice Gets the address of the used ERC721 for minting
     * @return address of the Token contract
     */
    function getTokenContractAddress() external view returns(address) {
        return address(tokenContract);
    }

    /**
     * @notice Creates a new token collection
     * @param name The name of the collection
     * @param description The description of the collection
     * @param price Cost to buy a pack from this collection
     * @param capacity The amount of cards per pack in this collection
     * @param blueprints An array of blueprint keys that represents this collection
     * @return id of the collection index relative to the collection creator
     */
    function createTokenCollection(string calldata name, 
            string calldata description,
            uint256 price, 
            uint8 capacity, 
            BlueprintKey[] calldata blueprints) external returns (uint16) {
        
        require (Utils.isNotEmptyString(name), "ERROR_EMPTY_COLLECTION_NAME");
        require (Utils.isNotEmptyString(description), "ERROR_EMPTY_COLLECTION_DESCRIPTION");
        require (price >= MINIMUM_PACK_PRICE, "ERROR_PRICE_UNDER_LIMIT");
        require (capacity >= MINIMUM_PACK_CAPACITY, "ERROR_CAPACITY_UNDER_LIMIT");
        require (blueprints.length >= MINIMUM_COLLECTION_BLUEPRINTS, "ERROR_BLUEPRINTS_UNDER_LIMIT");

        uint16 currentIndex = _mapPackerToCollectionCounter[_msgSender()];
        TokenCollection storage collection = _mapPackerToCollection[_msgSender()][currentIndex];
        collection.name = name;
        collection.description = description;
        collection.price = price;
        collection.capacity = capacity;
        collection.collectionSize = blueprints.length;

        for (uint256 i; i < blueprints.length; i++) {
            collection.blueprints[i] = blueprints[i];
        }

        _mapPackerToCollectionCounter[_msgSender()] = currentIndex + 1;

        emit CollectionCreated(_msgSender(), currentIndex);
        return currentIndex;
    }

    /**
     * @notice Buys a pack of Tokens as defined in the collection
     * @param packer The address of the packer who created the collection for identification purposes
     * @param collectionIndex The index of the packer collection to which the pack being bought belongs
     */
    function buyPack(address packer, uint16 collectionIndex) public {
        // TODO: price and token transfer
        // TODO: income amount split

        TokenCollection storage collection = _mapPackerToCollection[packer][collectionIndex];

        // TODO: get random number from Chainlink
        uint256 randomNumber = 1000;
        for (uint8 i = 0; i < collection.capacity; i++) {
            uint256 derivedRandom = uint(keccak256(abi.encodePacked(randomNumber + i)));

            uint256 index = derivedRandom % collection.collectionSize;

            tokenContract.mintFromBlueprint(
                _msgSender(), 
                collection.blueprints[index].author, 
                collection.blueprints[index].blueprint
            );
        }

        emit PackBought(_msgSender(), packer, collectionIndex);
    }
}