// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicAccessControl is Ownable {
    uint16 public totalModerators = 0;
    mapping(address => bool) public moderators;
    bool public isMaintaining = false;

    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);
    event MaintenanceUpdated(bool isMaintaining);

    constructor() Ownable(msg.sender) {}

    modifier onlyModerators() {
        require(
            _msgSender() == owner() || moderators[_msgSender()],
            "Restricted Access"
        );
        _;
    }

    modifier isActive() {
        require(!isMaintaining, "Contract under maintenance");
        _;
    }

    function addModerator(address _newModerator) external onlyOwner {
        require(_newModerator != address(0), "Invalid moderator address");
        if (!moderators[_newModerator]) {
            moderators[_newModerator] = true;
            totalModerators += 1;
            emit ModeratorAdded(_newModerator);
        }
    }

    function removeModerator(address _moderator) external onlyOwner {
        require(_moderator != address(0), "Invalid moderator address");
        if (moderators[_moderator]) {
            moderators[_moderator] = false;
            totalModerators -= 1;
            emit ModeratorRemoved(_moderator);
        }
    }

    function updateMaintaining(bool _isMaintaining) external onlyOwner {
        isMaintaining = _isMaintaining;
        emit MaintenanceUpdated(_isMaintaining);
    }
}