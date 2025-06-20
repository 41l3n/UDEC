// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EvidenceManager is AccessControl {
    using Counters for Counters.Counter;
    
    bytes32 public constant INVESTIGATOR_ROLE = keccak256("INVESTIGATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    Counters.Counter private _evidenceIds;
    
    struct Evidence {
        uint256 id;
        string evidenceHash;
        string metadata;
        address addedBy;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(uint256 => Evidence) public evidences;
    mapping(string => uint256) public hashToId;
    
    event EvidenceAdded(
        uint256 indexed evidenceId,
        string evidenceHash,
        address indexed addedBy,
        uint256 timestamp
    );
    
    event EvidenceAccessed(
        uint256 indexed evidenceId,
        address indexed accessedBy,
        uint256 timestamp
    );
    
    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
    }
    
    function addInvestigator(address investigator) external onlyRole(ADMIN_ROLE) {
        grantRole(INVESTIGATOR_ROLE, investigator);
    }
    
    function addEvidence(
        string calldata _evidenceHash,
        string calldata _metadata
    ) external onlyRole(INVESTIGATOR_ROLE) returns (uint256) {
        require(hashToId[_evidenceHash] == 0, "Evidence already exists");
        
        _evidenceIds.increment();
        uint256 newEvidenceId = _evidenceIds.current();
        
        evidences[newEvidenceId] = Evidence({
            id: newEvidenceId,
            evidenceHash: _evidenceHash,
            metadata: _metadata,
            addedBy: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });
        
        hashToId[_evidenceHash] = newEvidenceId;
        
        emit EvidenceAdded(newEvidenceId, _evidenceHash, msg.sender, block.timestamp);
        
        return newEvidenceId;
    }
    
    function getEvidence(uint256 _evidenceId) external returns (Evidence memory) {
        require(_evidenceId > 0 && _evidenceId <= _evidenceIds.current(), "Invalid evidence ID");
        require(evidences[_evidenceId].isActive, "Evidence not active");
        
        emit EvidenceAccessed(_evidenceId, msg.sender, block.timestamp);
        
        return evidences[_evidenceId];
    }
    
    function getEvidenceCount() external view returns (uint256) {
        return _evidenceIds.current();
    }
    
    function verifyEvidence(string calldata _evidenceHash) external view returns (bool, uint256) {
        uint256 evidenceId = hashToId[_evidenceHash];
        if (evidenceId == 0) {
            return (false, 0);
        }
        return (evidences[evidenceId].isActive, evidenceId);
    }
}