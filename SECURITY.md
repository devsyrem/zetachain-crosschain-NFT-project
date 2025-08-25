# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Actively supported |

## Security Features

### Cross-Chain Security
- **TSS Integration**: All cross-chain operations verified through Threshold Signature Scheme
- **Nonce-based Replay Protection**: Each transaction includes incremental nonce to prevent replay attacks
- **Message Authentication**: All cross-chain messages cryptographically signed and verified

### Smart Contract Security
- **Authority Controls**: Program operations restricted to authorized accounts
- **Input Validation**: Comprehensive validation of all user inputs
- **State Management**: Safe state transitions with proper error handling
- **Compute Optimization**: Efficient compute unit usage to prevent resource exhaustion

### Infrastructure Security
- **Rent Exemption**: All accounts properly funded for persistence
- **PDA Security**: Program Derived Addresses generated with secure seeds
- **Account Validation**: Strict validation of all account inputs

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please:

1. **Do NOT create a public GitHub issue**
2. **Contact us privately** via email: security@universalnft.com
3. **Provide detailed information**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

## Response Timeline

- **Initial Response**: Within 24 hours
- **Investigation**: 48-72 hours for initial assessment
- **Resolution**: Target 7 days for critical issues, 30 days for non-critical

## Security Best Practices

### For Developers
- Always validate ZetaChain gateway addresses before deployment
- Use official TSS addresses only
- Implement proper error handling for all cross-chain operations
- Regular security audits of integration code

### For Users
- Verify program ID before interacting
- Use official client SDK only
- Monitor cross-chain transfers on block explorers
- Keep private keys secure and never share

## Known Security Considerations

### Cross-Chain Risks
- **Bridge Security**: Security depends on ZetaChain's TSS network reliability
- **Chain Dependencies**: Security limited by the weakest supported chain
- **Finality Requirements**: Wait for sufficient confirmations before considering transfers complete

### Solana-Specific Risks
- **Compute Limits**: Complex operations may exceed compute budget
- **Rent Requirements**: Accounts must maintain minimum SOL balance
- **Network Congestion**: High traffic may cause transaction delays

## Security Audits

| Date | Auditor | Scope | Status |
|------|---------|-------|--------|
| TBD | TBD | Full Program | Planned |

## Disclosure Policy

We believe in responsible disclosure and will:
- Acknowledge security researchers appropriately
- Provide updates on fix timelines
- Release security advisories for significant vulnerabilities
- Coordinate disclosure timing with reporters

## Contact Information

- **Security Email**: security@universalnft.com
- **General Contact**: hello@universalnft.com
- **GitHub Issues**: For non-security related issues only

---

Thank you for helping keep Universal NFT Program secure!