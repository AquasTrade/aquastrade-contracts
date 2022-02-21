// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/IRubyNFT.sol";

contract RubyNFT is ERC721Upgradeable, OwnableUpgradeable, IRubyNFT {

    uint256 public override nftIds;

    address public override nftFactory;

    function initialize(
        address _owner,
        string memory name, 
        string memory symbol,
        address _nftFactory
        ) external virtual initializer {
        require(_nftFactory != address(0), "RubyNFT: Invalid NFT factory address");
        require(_owner != address(0), "RubyNFT: Invalid owner address");
        ERC721Upgradeable.__ERC721_init(name, symbol);
        nftFactory = _nftFactory;

        OwnableUpgradeable.__Ownable_init();
        transferOwnership(_owner);
    }


    function mint(address to) override virtual external {
        require(msg.sender == nftFactory, "RubyNFT: Minting not allowed");
        require(to != address(0), "RubyNFT: Invalid Receiver");
        uint256 tokenId = nftIds;
        _safeMint(to, tokenId);
        nftIds = tokenId + 1;
    }


    function setNftFactory(address newNftFactory) override onlyOwner virtual external {
        require(newNftFactory != address(0), "RubyNFT: Invalid new factory address");
        nftFactory = newNftFactory;
    }    

}