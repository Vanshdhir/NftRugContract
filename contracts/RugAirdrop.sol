// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2;

import "./BasicAccessControl.sol";
import "./Rug.sol";

contract RugAirdrop is BasicAccessControl {
    Rug public nftContract;

    constructor(address _nftContract) BasicAccessControl() {
        nftContract = Rug(_nftContract);
    }

    function Airdrop(address[] calldata recipients) external onlyModerators isActive {
        for (uint256 i = 0; i < recipients.length; i++) {
            try nftContract.mintNextToken(recipients[i]) {} catch {}
        }
    }
}