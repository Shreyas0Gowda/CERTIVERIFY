// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateVerification
 * @notice Tamper-proof academic certificate verification on Ethereum.
 * Only the contract owner (authorized institutional admin) can issue and revoke certificates.
 * Public verification allows anyone to check authenticity and revocation status.
 */
contract CertificateVerification is Ownable {

    struct Certificate {
        string certificateId;
        string certificateHash; // SHA-256 hex string (64 characters)
        address issuer;
        uint256 issueTimestamp;
        bool isRevoked;
        uint256 revocationTimestamp;
        string revocationReason;
        bool exists;
    }

    // Hash => Certificate
    mapping(string => Certificate) private _certificatesByHash;

    // Certificate ID => Hash
    mapping(string => string) private _hashByCertificateId;

    // Array of all certificate hashes for enumeration and audit
    string[] private _certificateHashes;

    // Events
    event CertificateRegistered(
        string indexed certificateId,
        string indexed certificateHash,
        address indexed issuer,
        uint256 issueTimestamp
    );

    event CertificateRevoked(
        string indexed certificateId,
        string indexed certificateHash,
        address indexed revoker,
        uint256 revocationTimestamp,
        string reason
    );

    // Custom errors
    error CertificateAlreadyRegistered(string certificateHash);
    error CertificateIdAlreadyExists(string certificateId);
    error CertificateNotFound(string certificateHash);
    error CertificateAlreadyRevoked(string certificateHash);
    error InvalidInput(string reason);

    /**
     * @notice Initializes the contract setting the deployer as initial owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Registers a new certificate on-chain.
     * @dev Only the authorized contract owner can call this.
     * @param certificateId Unique human-readable certificate identifier
     * @param certificateHash SHA-256 hash of the certificate document
     */
    function registerCertificate(
        string calldata certificateId,
        string calldata certificateHash
    ) external onlyOwner {
        if (bytes(certificateId).length == 0) {
            revert InvalidInput("Certificate ID cannot be empty");
        }
        if (bytes(certificateHash).length == 0) {
            revert InvalidInput("Certificate hash cannot be empty");
        }
        if (_certificatesByHash[certificateHash].exists) {
            revert CertificateAlreadyRegistered(certificateHash);
        }
        if (bytes(_hashByCertificateId[certificateId]).length > 0) {
            revert CertificateIdAlreadyExists(certificateId);
        }

        Certificate memory newCert = Certificate({
            certificateId: certificateId,
            certificateHash: certificateHash,
            issuer: msg.sender,
            issueTimestamp: block.timestamp,
            isRevoked: false,
            revocationTimestamp: 0,
            revocationReason: "",
            exists: true
        });

        _certificatesByHash[certificateHash] = newCert;
        _hashByCertificateId[certificateId] = certificateHash;
        _certificateHashes.push(certificateHash);

        emit CertificateRegistered(
            certificateId,
            certificateHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verifies a certificate by its SHA-256 hash.
     * @param certificateHash The SHA-256 hash of the uploaded document
     * @return isValid True if certificate exists and is not revoked
     * @return isRevoked True if certificate exists but was revoked
     * @return certificateId The registered certificate ID
     * @return issuer The address that registered the certificate
     * @return issueTimestamp Block timestamp when registered
     */
    function verifyCertificate(string calldata certificateHash)
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            string memory certificateId,
            address issuer,
            uint256 issueTimestamp
        )
    {
        Certificate storage cert = _certificatesByHash[certificateHash];
        if (!cert.exists) {
            return (false, false, "", address(0), 0);
        }

        if (cert.isRevoked) {
            return (false, true, cert.certificateId, cert.issuer, cert.issueTimestamp);
        }

        return (true, false, cert.certificateId, cert.issuer, cert.issueTimestamp);
    }

    /**
     * @notice Checks if a certificate hash is already registered.
     */
    function isCertificateRegistered(string calldata certificateHash)
        external
        view
        returns (bool)
    {
        return _certificatesByHash[certificateHash].exists;
    }

    /**
     * @notice Gets the full on-chain details of a certificate by its hash.
     */
    function getCertificate(string calldata certificateHash)
        external
        view
        returns (Certificate memory)
    {
        Certificate storage cert = _certificatesByHash[certificateHash];
        if (!cert.exists) {
            revert CertificateNotFound(certificateHash);
        }
        return cert;
    }

    /**
     * @notice Gets the full on-chain details of a certificate by its ID.
     */
    function getCertificateById(string calldata certificateId)
        external
        view
        returns (Certificate memory)
    {
        string memory cHash = _hashByCertificateId[certificateId];
        if (bytes(cHash).length == 0) {
            revert CertificateNotFound(certificateId);
        }
        return _certificatesByHash[cHash];
    }

    /**
     * @notice Revokes a previously registered certificate.
     * @dev Only the contract owner can revoke.
     * @param certificateHash The hash of the certificate to revoke
     * @param reason The justification for revocation
     */
    function revokeCertificate(
        string calldata certificateHash,
        string calldata reason
    ) external onlyOwner {
        Certificate storage cert = _certificatesByHash[certificateHash];
        if (!cert.exists) {
            revert CertificateNotFound(certificateHash);
        }
        if (cert.isRevoked) {
            revert CertificateAlreadyRevoked(certificateHash);
        }

        cert.isRevoked = true;
        cert.revocationTimestamp = block.timestamp;
        cert.revocationReason = bytes(reason).length > 0 ? reason : "Revoked by issuer";

        emit CertificateRevoked(
            cert.certificateId,
            certificateHash,
            msg.sender,
            block.timestamp,
            cert.revocationReason
        );
    }

    /**
     * @notice Returns total number of registered certificates.
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateHashes.length;
    }

    /**
     * @notice Returns paginated certificate hashes.
     */
    function getCertificateHashes(uint256 offset, uint256 limit)
        external
        view
        returns (string[] memory)
    {
        uint256 total = _certificateHashes.length;
        if (offset >= total) {
            return new string[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 size = end - offset;
        string[] memory result = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = _certificateHashes[offset + i];
        }
        return result;
    }
}

