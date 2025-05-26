// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BasicAccessControl.sol";
import "./Rug.sol";

contract RugDistributor is BasicAccessControl {
    using SafeERC20 for IERC20;
    event Mint(address indexed owner, uint256 token);
    event ZORRewarded(address indexed owner, uint256 amount);
    event Debug(string message, address indexed sender, uint256 value);

    IERC20 public immutable pcToken;
    IERC20 public immutable zorToken;
    Rug public nftContract;

    uint256 public constant MINTING_CAP = 100;
    uint256 public constant ERC20_PRICE_NFT = 0.01 * 10 ** 18;
    uint256 public constant ZOR_REWARD_AMOUNT = 10 * 10 ** 18;
    bool public mintingPaused = false;
    uint256 private rngNonce = 0;

    uint256[] private probabilities = [2, 1, 1];

    constructor(
        address _nftContract,
        address _pcToken,
        address _zorToken
    ) BasicAccessControl() {
        require(_nftContract != address(0), "Invalid NFT contract address");
        require(_pcToken != address(0), "Invalid PC token address");
        require(_zorToken != address(0), "Invalid ZOR token address");
        nftContract = Rug(_nftContract);
        pcToken = IERC20(_pcToken);
        zorToken = IERC20(_zorToken);
    }

    function getRNG() private returns (uint256) {
        rngNonce++;
        uint256 seed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    block.prevrandao,
                    rngNonce
                )
            )
        );
        return seed % 100;
    }

    function erc20Mint() external isActive returns (bool) {
        require(!mintingPaused, "Minting paused");
        require(
            nftContract.itemsMintedCount() < MINTING_CAP,
            "Minting cap reached"
        );
        require(
            pcToken.balanceOf(msg.sender) >= ERC20_PRICE_NFT,
            "Insufficient pcToken balance"
        );
        require(
            pcToken.allowance(msg.sender, address(this)) >= ERC20_PRICE_NFT,
            "Insufficient pcToken allowance"
        );

        emit Debug("Attempting pcToken transfer", msg.sender, ERC20_PRICE_NFT);
        pcToken.safeTransferFrom(msg.sender, address(this), ERC20_PRICE_NFT);
        emit Debug("pcToken transfer succeess", msg.sender, ERC20_PRICE_NFT);

        uint256 random = getRNG();
        uint256 outcome = probabilities[random % probabilities.length];
        emit Debug("Outcome selected", msg.sender, random);

        if (outcome == 2) {
            uint256 tokenId = nftContract.itemsMintedCount();
            emit Debug("Attempting NFT mint", msg.sender, tokenId);
            nftContract.mintNextToken(msg.sender);
            emit Mint(msg.sender, tokenId);
        } else {
            emit Debug(
                "Attempting ZOR transfer",
                msg.sender,
                ZOR_REWARD_AMOUNT
            );
            require(
                zorToken.balanceOf(address(this)) >= ZOR_REWARD_AMOUNT,
                "Insufficient ZOR tokens"
            );
            zorToken.safeTransfer(msg.sender, ZOR_REWARD_AMOUNT);
            emit ZORRewarded(msg.sender, ZOR_REWARD_AMOUNT);
        }

        return true;
    }

    function adminWithdrawZOR(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            zorToken.balanceOf(address(this)) >= _amount,
            "Insufficient ZOR balance"
        );
        zorToken.safeTransfer(msg.sender, _amount);
    }

    function adminWithdrawERC20(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            pcToken.balanceOf(address(this)) >= _amount,
            "Insufficient pcToken balance"
        );
        pcToken.safeTransfer(msg.sender, _amount);
    }

    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function togglePause() external onlyModerators {
        mintingPaused = !mintingPaused;
    }

    function setContracts(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = Rug(_nftContract);
    }

    fallback() external payable {}
    receive() external payable {}
}
