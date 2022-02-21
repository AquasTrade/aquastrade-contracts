// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/IRubyNFTFactory.sol";
import "../interfaces/IRubyNFT.sol";

contract RubyNFTFactory is IRubyNFTFactory, OwnableUpgradeable {

    // nft address => status
    mapping(address => bool) public override enabledNfts;

    // minter => nft address => isAllowed
    mapping(address => mapping(address => bool)) public override minterNftAllowances;

    // max amount of nfts to be minted in one go
    uint256 public override maxAmountOfNfts;

    address[] public override initialNfts;

    function initialize(
        address _owner, 
        uint256 _maxAmountOfNfts
    ) external initializer {
        require(_owner != address(0), "RubyNFTFactory: Invalid owner address");
        require(_maxAmountOfNfts <= 10, "RubyNFTFactory: _maxAmountOfNfts too large");
        OwnableUpgradeable.__Ownable_init();
        transferOwnership(_owner);
        maxAmountOfNfts = _maxAmountOfNfts;

    }

    function setInitialNfts(address _defaultMinter, address[] calldata _initialNfts) public override onlyOwner {
        require(_defaultMinter != address(0), "RubyNFTFactory: Invalid default minter");
        require(_initialNfts.length <= maxAmountOfNfts, "RubyNFTFactory: Too many nfts");
        delete initialNfts;

        for(uint256 i = 0; i < _initialNfts.length; i++) {
            address nftAddress = _initialNfts[i];
            enableNft(nftAddress);
            setMinter(nftAddress, _defaultMinter, true);
            initialNfts.push(nftAddress);
        }

    }


    function enableNft(address nft) public override onlyOwner {
        require(nft != address(0), "RubyNFTFactory: Invalid NFT address");
        enabledNfts[nft] = true;
    }

    function disableNft(address nft) public override onlyOwner {
        delete enabledNfts[nft];
    }

    function setMinter(address nft, address minter, bool allowance) public override onlyOwner {
        require(minter != address(0), "RubyNFTFactory: Invalid minter");
        minterNftAllowances[minter][nft] = allowance;
    }

    function mint(address receiver, address[] calldata nfts) external override {
        require(nfts.length <= maxAmountOfNfts, "RubyNFTFactory: Too many nfts to mint");
        require(receiver != address(0), "RubyNFTFactory: Invalid receiver");

        for(uint256 i = 0; i < nfts.length; i++) {
            address nft = nfts[i];
            require(enabledNfts[nft], "RubyNFTFactory: Nft not enabled");
            require(minterNftAllowances[msg.sender][nft], "RubyNFTFactory: Minting not allowed");
            IRubyNFT(nft).mint(receiver);
        }
    }

    // TODO: Can be gas optimised (less general)
    function mintInitial(address receiver) external override {
        require(receiver != address(0), "RubyNFTFactory: Invalid receiver");
        
        for(uint256 i = 0; i < initialNfts.length; i++) {
            address nft = initialNfts[i];
            require(enabledNfts[nft], "RubyNFTFactory: Nft not enabled");
            require(minterNftAllowances[msg.sender][nft], "RubyNFTFactory: Minting not allowed");

            if(IRubyNFT(nft).balanceOf(receiver) == 0) {
                IRubyNFT(nft).mint(receiver);
            }

        }
    }


}