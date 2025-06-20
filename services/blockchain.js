const { ethers } = require('ethers');

// Contract ABI (simplified)
const contractABI = [
  "function addEvidence(string calldata _evidenceHash, string calldata _metadata) external returns (uint256)",
  "function getEvidence(uint256 _evidenceId) external returns (tuple(uint256 id, string evidenceHash, string metadata, address addedBy, uint256 timestamp, bool isActive))",
  "function getEvidenceCount() external view returns (uint256)",
  "function verifyEvidence(string calldata _evidenceHash) external view returns (bool, uint256)",
  "event EvidenceAdded(uint256 indexed evidenceId, string evidenceHash, address indexed addedBy, uint256 timestamp)"
];

let provider;
let signer;
let contract;

// Initialize blockchain connection
function initializeBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    signer = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);
    console.log('Blockchain connection initialized');
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
  }
}

// Add evidence to blockchain
exports.addEvidenceToBlockchain = async (evidenceHash, metadata, userAddress) => {
  try {
    if (!contract) {
      initializeBlockchain();
    }
    
    const tx = await contract.addEvidence(evidenceHash, metadata);
    const receipt = await tx.wait();
    
    // Parse the event to get evidence ID
    const event = receipt.events?.find(e => e.event === 'EvidenceAdded');
    const evidenceId = event?.args?.evidenceId?.toNumber();
    
    return {
      evidenceId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('Blockchain add evidence error:', error);
    throw new Error('Failed to add evidence to blockchain.');
  }
};

// Get evidence from blockchain
exports.getEvidenceFromBlockchain = async (evidenceId) => {
  try {
    if (!contract) {
      initializeBlockchain();
    }
    
    const evidence = await contract.getEvidence(evidenceId);
    
    return {
      id: evidence.id.toNumber(),
      evidenceHash: evidence.evidenceHash,
      metadata: evidence.metadata,
      addedBy: evidence.addedBy,
      timestamp: evidence.timestamp.toNumber(),
      isActive: evidence.isActive
    };
    
  } catch (error) {
    console.error('Blockchain get evidence error:', error);
    throw new Error('Failed to get evidence from blockchain.');
  }
};

// Verify evidence on blockchain
exports.verifyEvidenceOnBlockchain = async (evidenceHash) => {
  try {
    if (!contract) {
      initializeBlockchain();
    }
    
    const [exists, evidenceId] = await contract.verifyEvidence(evidenceHash);
    
    return {
      exists,
      evidenceId: evidenceId.toNumber()
    };
    
  } catch (error) {
    console.error('Blockchain verify evidence error:', error);
    throw new Error('Failed to verify evidence on blockchain.');
  }
};

// Initialize on module load
initializeBlockchain();