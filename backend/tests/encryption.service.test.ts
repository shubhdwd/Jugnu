import { encrypt, decrypt, hashData } from '../src/services/encryption.service';

describe('Encryption Service', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text', () => {
      const original = 'Hello, Jugnu!';
      const encrypted = encrypt(original);
      expect(encrypted).not.toBe(original);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input (due to random IV)', () => {
      const original = 'Same text';
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('hashData', () => {
    it('should produce consistent hash', () => {
      const hash1 = hashData('test data');
      const hash2 = hashData('test data');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input', () => {
      const hash1 = hashData('data1');
      const hash2 = hashData('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce hex string', () => {
      const hash = hashData('test');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
