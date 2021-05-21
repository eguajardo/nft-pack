// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

/**
 * @title Token
 * @notice The ERC721 that is hold by packs. Tokens are created from author's blueprints
 */
contract Token is ERC721URIStorage, AccessControlEnumerable {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor (string memory name_, string memory symbol_, address minter) ERC721(name_, symbol_) { 
        _setupRole(MINTER_ROLE, minter);
    }

    /**
     * @notice Struct containing blueprints for NFTs
     */
    struct TokenBlueprint {
        string title;
        string description;
        string ipfsPath;
    }

    /**
     * @notice Struct representing the key to find a specific blueprint
     */
    struct BlueprintKey {
        address author;
        uint16 blueprint;
    }

    /**
     * @dev Mapping of author to their current own blueprint index counter 
     * Limit maximum blueprint's index per author to 65535 by using uint16
     */
    mapping (address => uint16) private _mapAuthorToBlueprintCounter;

    /**
     * @dev Mapping of author address to a map of their blueprint index and corresponding TokenBlueprint
     */
    mapping (address => mapping (uint16 => TokenBlueprint)) private _mapAuthorToBlueprints;

    uint256 private _tokenIdCounter;

    /**
     * @dev Mapping of token Id to blueprint key
     */
    mapping (uint256 => BlueprintKey) private _mapTokenIdToBlueprintKey;

    /**
     * Emitted when the 'author' creates the a blueprint with index 'blueprintIndex'
     */
    event BlueprintCreated(address indexed author, uint16 indexed blueprintIndex);

    /**
     * Emitted when the 'tokenId' is minted and transfered to the 'owner' using the blueprint index 'blueprintIndex' from author 'author'
     */
    event Minted(uint256 tokenId, address owner, address indexed author, uint16 indexed blueprintIndex);

    /**
     * @notice Creates a new token blueprint
     * @param title The title of the NFTs created by this blueprint
     * @param description The description of the NFTs created by this blueprint
     * @param ipfsPath The IPFS path to compose the tokenURI of the NFT's created by this blueprint
     * @return id of author's created blueprint index
     */
    function createBlueprint(string calldata title,
            string calldata description,
            string calldata ipfsPath) external returns (uint16){

        require (_isNotEmptyString(title), "ERROR_EMPTY_IPFS_TITLE");
        require (_isNotEmptyString(description), "ERROR_EMPTY_IPFS_DESCRIPTION");
        require (_isNotEmptyString(ipfsPath), "ERROR_EMPTY_IPFS_PATH");

        TokenBlueprint memory blueprint = TokenBlueprint(title, description, ipfsPath);

        uint16 currentIndex = _mapAuthorToBlueprintCounter[_msgSender()];
        _mapAuthorToBlueprints[_msgSender()][currentIndex] = blueprint;
        _mapAuthorToBlueprintCounter[_msgSender()] = currentIndex + 1;

        emit BlueprintCreated(_msgSender(), currentIndex);
        return currentIndex;
    }

    /**
     * @notice Mint a token based on the author's blueprint
     * @param to The address to where the minted token will be transfered
     * @param blueprintAuthor The address of the author of the blueprint
     * @param blueprintIndex The author's blueprint index
     */
    function mintFromBlueprint(address to, address blueprintAuthor, uint16 blueprintIndex) public virtual {
        require (hasRole(MINTER_ROLE, _msgSender()), "ERROR_UNAUTHORIZED_MINTER");
        require (_isNotEmptyString(_mapAuthorToBlueprints[blueprintAuthor][blueprintIndex].title), "ERROR_INVALID_BLUEPRINT");

        BlueprintKey memory key = BlueprintKey(blueprintAuthor, blueprintIndex);
        _mapTokenIdToBlueprintKey[_tokenIdCounter] = key;

        _safeMint(to, _tokenIdCounter);

        emit Minted(_tokenIdCounter, to, blueprintAuthor, blueprintIndex);

        _tokenIdCounter += 1;
    }

    /**
     * @dev Returns true if the string is not empty or false otherwise
     */
    function _isNotEmptyString(string memory _string) internal pure returns (bool) {
        return keccak256(abi.encodePacked(_string)) != keccak256(abi.encodePacked(""));
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

}