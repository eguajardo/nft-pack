// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./Blueprint.sol";
import "./TokenPack.sol";
import "./Utils.sol";

/**
 * @title Token
 * @notice The ERC721 that is hold by packs. Tokens are created from author's blueprints
 */
contract Token is ERC721Enumerable, AccessControlEnumerable {
    /**
     * @notice Struct holding relevant information from the minting process
     */
    struct MintData {
        bytes32 purchaseOrderId;
        uint256 index; // index in the pack
    }

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Blueprint private blueprintContract;
    TokenPack private tokenPackContract;

    /**
     * @dev Map of tokens to their mint data
     */
    mapping(uint256 => MintData) private _mintData;

    /**
     * @notice Emitted when the 'tokenId' is minted and transfered to the 'owner' in accordance to purchase order 'purchaseOrderId'
     */
    event Minted(uint256 indexed tokenId, address owner, bytes32 indexed purchaseOrderId);

    /**
     * @notice Initializes the contract by setting a `name`, `symbol` and `minter` for the token.
     */
    constructor (string memory name_, 
            string memory symbol_,
            address tokenPackAddress
    ) ERC721(name_, symbol_) { 
        _setupRole(MINTER_ROLE, tokenPackAddress);
        blueprintContract = new Blueprint();
        tokenPackContract = TokenPack(tokenPackAddress);
    }

    /**
     * @notice Gets the address of the used ERC721 for minting
     * @return address of the Token contract
     */
    function blueprintContractAddress() external view returns(address) {
        return address(blueprintContract);
    }

    /**
     * @notice Mint a token based on the author's blueprint
     * @param to The address to where the minted token will be transfered
     * @param purchaseOrderId The purchase order used to mint this Token
     * @param index The position in the opened pack containing this Token
     */
    function mintFromPack(address to, bytes32 purchaseOrderId, uint256 index) public virtual {
        require (hasRole(MINTER_ROLE, _msgSender()), "ERROR_UNAUTHORIZED_MINTER");

        uint256 tokenId = totalSupply();
        _safeMint(to, tokenId);
        _mintData[tokenId].purchaseOrderId = purchaseOrderId;
        _mintData[tokenId].index = index;

        emit Minted(tokenId, to, purchaseOrderId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERROR_INVALID_TOKEN_ID");

        uint256 blueprintId = tokenPackContract.mintedBlueprint(
            _mintData[tokenId].purchaseOrderId, 
            _mintData[tokenId].index
        );

        return blueprintContract.blueprintURI(blueprintId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

}