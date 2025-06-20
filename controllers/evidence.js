const db = require('../models'); // Correct import via models/index.js
const Evidence = db.Evidence;     // Get initialized Evidence model
const minioClient = require('../services/minio');
const { addEvidenceToBlockchain, verifyOnBlockchain } = require('../services/blockchain');
const crypto = require('crypto');

// Upload evidence with blockchain recording
exports.uploadEvidence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Process file
    const fileBuffer = req.file.buffer;
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Upload to MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      fileName,
      fileBuffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );

    // Parse metadata
    const { metadata, caseId } = req.body;
    if (!metadata || !caseId) {
      return res.status(400).json({ error: 'Metadata and caseId are required' });
    }

    // Save to database with filePointer
    const evidence = await Evidence.create({
      hash,
      metadata: JSON.stringify({ metadata, caseId }),
      filePointer: fileName,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      addedBy: req.user.id
    });

    // Blockchain integration (non-blocking)
    try {
      const blockchainResult = await addEvidenceToBlockchain(
        hash,
        JSON.stringify({ metadata, caseId }),
        req.user.blockchainAddress
      );
      await evidence.update({
        blockchainId: blockchainResult.evidenceId,
        transactionHash: blockchainResult.transactionHash
      });
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError.message);
      await evidence.update({ blockchainStatus: 'pending' });
    }

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidenceId: evidence.id,
      hash,
      fileName: evidence.filePointer
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Evidence upload failed',
      details: error.message
    });
  }
};

// Get evidence details
exports.getEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findByPk(req.params.id, {
      attributes: { exclude: ['updatedAt'] }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const response = {
      id: evidence.id,
      hash: evidence.hash,
      metadata: JSON.parse(evidence.metadata),
      filePointer: evidence.filePointer,
      fileName: evidence.fileName,
      fileSize: evidence.fileSize,
      mimeType: evidence.mimeType,
      blockchainId: evidence.blockchainId,
      transactionHash: evidence.transactionHash,
      createdAt: evidence.createdAt
    };

    res.json(response);

  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve evidence',
      details: error.message
    });
  }
};

// Download evidence file
exports.downloadEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findByPk(req.params.id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const dataStream = await minioClient.getObject(
      process.env.MINIO_BUCKET,
      evidence.filePointer
    );
    
    res.header('Content-Type', evidence.mimeType);
    res.attachment(evidence.fileName);
    dataStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'File download failed',
      details: error.message
    });
  }
};

// Verify evidence integrity
exports.verifyEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findByPk(req.params.id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Verify MinIO file
    const dataStream = await minioClient.getObject(
      process.env.MINIO_BUCKET,
      evidence.filePointer
    );
    
    // Hash verification
    const chunks = [];
    for await (const chunk of dataStream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const verification = {
      evidenceId: evidence.id,
      storedHash: evidence.hash,
      currentHash,
      match: currentHash === evidence.hash,
      blockchainVerified: false
    };

    // Blockchain verification
    try {
      const blockchainResult = await verifyOnBlockchain(evidence.hash);
      verification.blockchainVerified = blockchainResult.verified;
      verification.blockchainDetails = blockchainResult;
    } catch (blockchainError) {
      console.error('Blockchain verification failed:', blockchainError);
    }

    res.json(verification);

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      details: error.message
    });
  }
};

// List evidence with pagination
exports.listEvidence = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Evidence.findAndCountAll({
      where: { isActive: true },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'hash', 'fileName', 'fileSize', 'createdAt']
    });

    res.json({
      data: rows,
      pagination: {
        totalItems: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('List evidence error:', error);
    res.status(500).json({ 
      error: 'Failed to list evidence',
      details: error.message
    });
  }
};