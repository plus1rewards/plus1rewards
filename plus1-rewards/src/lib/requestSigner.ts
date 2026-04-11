// Request signing and validation to prevent replay attacks
// Each request includes a cryptographic signature that can't be forged

interface SignedRequest {
  timestamp: number;
  nonce: string;
  signature: string;
}

class RequestSigner {
  private readonly SECRET_KEY = 'plus1_request_signing_key_v1';
  private usedNonces = new Set<string>();
  private readonly MAX_NONCE_AGE = 5 * 60 * 1000; // 5 minutes

  // Generate a random nonce
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Create HMAC-like signature
  private async createSignature(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.SECRET_KEY);
    const messageData = encoder.encode(data);

    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    
    // Convert to hex
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Sign a request
  async signRequest(sessionToken: string): Promise<SignedRequest> {
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    
    // Create signature from token + timestamp + nonce
    const data = `${sessionToken}:${timestamp}:${nonce}`;
    const signature = await this.createSignature(data);

    return {
      timestamp,
      nonce,
      signature
    };
  }

  // Verify a signed request (client-side validation)
  async verifyRequest(
    sessionToken: string,
    signedRequest: SignedRequest
  ): Promise<boolean> {
    try {
      // Check timestamp (prevent replay attacks)
      const age = Date.now() - signedRequest.timestamp;
      if (age > this.MAX_NONCE_AGE || age < 0) {
        console.error('Request timestamp invalid');
        return false;
      }

      // Check nonce hasn't been used
      if (this.usedNonces.has(signedRequest.nonce)) {
        console.error('Nonce already used');
        return false;
      }

      // Verify signature
      const data = `${sessionToken}:${signedRequest.timestamp}:${signedRequest.nonce}`;
      const expectedSignature = await this.createSignature(data);

      if (expectedSignature !== signedRequest.signature) {
        console.error('Signature mismatch');
        return false;
      }

      // Mark nonce as used
      this.usedNonces.add(signedRequest.nonce);

      // Clean up old nonces periodically
      this.cleanupNonces();

      return true;
    } catch (error) {
      console.error('Request verification failed:', error);
      return false;
    }
  }

  // Clean up old nonces to prevent memory leak
  private cleanupNonces() {
    if (this.usedNonces.size > 1000) {
      // Clear all nonces (they're time-limited anyway)
      this.usedNonces.clear();
    }
  }
}

export const requestSigner = new RequestSigner();
