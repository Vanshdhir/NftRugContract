// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./BasicAccessControl.sol";

contract Rug is ERC721, BasicAccessControl {
    using Strings for uint256;

    uint256 public constant START_TOKEN = 1;
    uint256 public MAX_CAP = 1000;
    uint256 public itemsMintedCount = 0;
    string private _baseTokenURI;

    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);
    event TokenMinted(address indexed owner, uint256 tokenId);
    event MaxCapUpdated(uint256 newCap);

    constructor(
        string memory baseURI
    ) ERC721("Rug", "RUG") BasicAccessControl() {
        require(bytes(baseURI).length > 0, "Invalid baseURI");
        _baseTokenURI = baseURI;
        itemsMintedCount = START_TOKEN;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        require(bytes(baseURI).length > 0, "Invalid baseURI");
        _baseTokenURI = baseURI;
        emit BatchMetadataUpdate(START_TOKEN, MAX_CAP);
    }

    function mintNextToken(address _owner) external returns (bool) {
        require(itemsMintedCount < MAX_CAP, "Max supply reached");
        itemsMintedCount++;
        uint256 tokenId = itemsMintedCount;
        _mint(_owner, tokenId);
        emit TokenMinted(_owner, tokenId);
        return true;
    }

    function updateMaxCap(uint256 _newCap) external onlyModerators {
        require(_newCap >= itemsMintedCount, "New cap must be >= minted count");
        MAX_CAP = _newCap;
        emit MaxCapUpdated(_newCap);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return
            string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }
}
