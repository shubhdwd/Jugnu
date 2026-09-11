import { estimateAbility, selectDifficulty, detectTrend, generateExplanation, checkSustainedDecline } from '../src/services/ai.service';

describe('AI Service', () => {
  describe('estimateAbility', () => {
    it('should return baseline for empty attempts', () => {
      const result = estimateAbility([]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return higher ability for correct answers', () => {
      const attempts = Array(10).fill(null).map(() => ({
        correct: true,
        responseTimeMs: 1000,
        difficulty: 'MEDIUM' as const,
      }));
      const result = estimateAbility(attempts);
      expect(result).toBeGreaterThan(0.5);
    });

    it('should return lower ability for incorrect answers', () => {
      const attempts = Array(10).fill(null).map(() => ({
        correct: false,
        responseTimeMs: 3000,
        difficulty: 'EASY' as const,
      }));
      const result = estimateAbility(attempts);
      expect(result).toBeLessThan(0.5);
    });

    it('should weight harder difficulties more', () => {
      const easyCorrect = Array(5).fill(null).map(() => ({
        correct: true, responseTimeMs: 1000, difficulty: 'EASY' as const,
      }));
      const hardCorrect = Array(5).fill(null).map(() => ({
        correct: true, responseTimeMs: 1000, difficulty: 'HARD' as const,
      }));
      expect(estimateAbility(hardCorrect)).toBeGreaterThan(estimateAbility(easyCorrect));
    });
  });

  describe('selectDifficulty', () => {
    it('should return HARD for high ability', () => {
      const result = selectDifficulty(0.85, []);
      expect(result).toBe('HARD');
    });

    it('should return EASY for low ability', () => {
      const result = selectDifficulty(0.2, []);
      expect(result).toBe('EASY');
    });

    it('should return MEDIUM for medium ability', () => {
      const result = selectDifficulty(0.6, []);
      expect(result).toBe('MEDIUM');
    });

    it('should reduce difficulty after consecutive failures', () => {
      const result = selectDifficulty(0.7, [
        { correct: false },
        { correct: false },
      ]);
      expect(result).toBe('EASY');
    });

    it('should not reduce difficulty for single failure at high ability', () => {
      const result = selectDifficulty(0.85, [{ correct: false }]);
      expect(result).toBe('HARD');
    });
  });

  describe('detectTrend', () => {
    it('should return null for insufficient data', () => {
      const result = detectTrend([
        { abilityEstimate: 0.5, createdAt: new Date() },
      ]);
      expect(result).toBeNull();
    });

    it('should detect improving trend', () => {
      const data = [
        { abilityEstimate: 0.3, createdAt: new Date('2024-01-01') },
        { abilityEstimate: 0.5, createdAt: new Date('2024-01-08') },
        { abilityEstimate: 0.7, createdAt: new Date('2024-01-15') },
        { abilityEstimate: 0.9, createdAt: new Date('2024-01-22') },
      ];
      const result = detectTrend(data);
      expect(result).toBe('IMPROVING');
    });

    it('should detect declining trend', () => {
      const data = [
        { abilityEstimate: 0.9, createdAt: new Date('2024-01-01') },
        { abilityEstimate: 0.7, createdAt: new Date('2024-01-08') },
        { abilityEstimate: 0.5, createdAt: new Date('2024-01-15') },
        { abilityEstimate: 0.3, createdAt: new Date('2024-01-22') },
      ];
      const result = detectTrend(data);
      expect(result).toBe('DECLINING');
    });

    it('should detect stable trend', () => {
      const data = [
        { abilityEstimate: 0.6, createdAt: new Date('2024-01-01') },
        { abilityEstimate: 0.58, createdAt: new Date('2024-01-08') },
        { abilityEstimate: 0.62, createdAt: new Date('2024-01-15') },
        { abilityEstimate: 0.59, createdAt: new Date('2024-01-22') },
      ];
      const result = detectTrend(data);
      expect(result).toBe('STABLE');
    });
  });

  describe('checkSustainedDecline', () => {
    it('should return false for insufficient data', () => {
      const result = checkSustainedDecline([
        { abilityEstimate: 0.5, cognitiveDomain: 'OBJECT_MATCH' },
      ]);
      expect(result).toBe(false);
    });

    it('should return true for 3+ consecutive declines in same domain', () => {
      const result = checkSustainedDecline([
        { abilityEstimate: 0.8, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.7, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.6, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.5, cognitiveDomain: 'OBJECT_MATCH' },
      ]);
      expect(result).toBe(true);
    });

    it('should return false when decline is broken', () => {
      const result = checkSustainedDecline([
        { abilityEstimate: 0.8, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.7, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.75, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.6, cognitiveDomain: 'OBJECT_MATCH' },
      ]);
      expect(result).toBe(false);
    });

    it('should not cross domain boundaries', () => {
      const result = checkSustainedDecline([
        { abilityEstimate: 0.8, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.7, cognitiveDomain: 'PATTERN_RECALL' },
        { abilityEstimate: 0.6, cognitiveDomain: 'OBJECT_MATCH' },
        { abilityEstimate: 0.5, cognitiveDomain: 'PATTERN_RECALL' },
      ]);
      expect(result).toBe(false);
    });
  });

  describe('generateExplanation', () => {
    it('should generate explanation for improving trend', () => {
      const result = generateExplanation('OBJECT_MATCH', 0.75, 'IMPROVING');
      expect(result.toLowerCase()).toContain('object match');
      expect(result).not.toContain('dementia');
      expect(result).not.toContain('diagnosis');
    });

    it('should not mention dementia or diagnosis', () => {
      const domains = ['OBJECT_MATCH', 'PATTERN_RECALL', 'WHO_IS_CALLING'];
      const trends: Array<'IMPROVING' | 'STABLE' | 'DECLINING'> = ['IMPROVING', 'STABLE', 'DECLINING'];

      for (const domain of domains) {
        for (const trend of trends) {
          const result = generateExplanation(domain, 0.6, trend);
          expect(result.toLowerCase()).not.toContain('dementia');
          expect(result.toLowerCase()).not.toContain('diagnos');
        }
      }
    });

    it('should include ability percentage', () => {
      const result = generateExplanation('OBJECT_MATCH', 0.75, 'STABLE');
      expect(result).toContain('75%');
    });

    it('should handle null trend', () => {
      const result = generateExplanation('OBJECT_MATCH', 0.5, null);
      expect(result).toContain('50%');
      expect(result.toLowerCase()).toContain('monitored');
    });
  });
});
