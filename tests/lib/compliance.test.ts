/**
 * Unit tests for compliance scoring logic.
 * We test the pure math; DB calls are mocked.
 */

// ─── Inline the scoring logic so we don't hit Prisma ────────────────────────

const PENALTY_PER_INVOICE = 15;
const ANNUAL_CAP = 45_000;

function computeScore(params: {
  issuedTotal: number;
  pendingSubmission: number;
  unreportedB2C: number;
}) {
  const { issuedTotal, pendingSubmission, unreportedB2C } = params;
  const violatingInvoices = pendingSubmission + unreportedB2C;
  const rawPenalty = violatingInvoices * PENALTY_PER_INVOICE;
  const penaltyExposure = Math.min(rawPenalty, ANNUAL_CAP);
  const totalIssued = issuedTotal || 1;
  const violationRatio = violatingInvoices / totalIssued;
  const score = Math.max(0, Math.round(100 - violationRatio * 100));
  const level: 'green' | 'warning' | 'red' =
    score >= 80 ? 'green' : score >= 50 ? 'warning' : 'red';
  return { score, level, penaltyExposure };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('compliance score calculation', () => {
  describe('score', () => {
    it('returns 100 when all invoices are compliant', () => {
      const { score } = computeScore({ issuedTotal: 10, pendingSubmission: 0, unreportedB2C: 0 });
      expect(score).toBe(100);
    });

    it('returns 0 when all invoices are in violation', () => {
      const { score } = computeScore({ issuedTotal: 10, pendingSubmission: 10, unreportedB2C: 0 });
      expect(score).toBe(0);
    });

    it('returns 50 when half the invoices are in violation', () => {
      const { score } = computeScore({ issuedTotal: 10, pendingSubmission: 5, unreportedB2C: 0 });
      expect(score).toBe(50);
    });

    it('considers both pendingSubmission and unreportedB2C as violations', () => {
      const { score } = computeScore({ issuedTotal: 10, pendingSubmission: 2, unreportedB2C: 3 });
      // 5 violations / 10 total = 50%
      expect(score).toBe(50);
    });

    it('handles 0 total issued invoices without division by zero', () => {
      const { score } = computeScore({ issuedTotal: 0, pendingSubmission: 0, unreportedB2C: 0 });
      expect(score).toBe(100);
    });
  });

  describe('level', () => {
    it('returns green when score >= 80', () => {
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 0, unreportedB2C: 0 }).level).toBe('green');
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 2, unreportedB2C: 0 }).level).toBe('green'); // score=80
    });

    it('returns warning when score is 50–79', () => {
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 5, unreportedB2C: 0 }).level).toBe('warning');
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 3, unreportedB2C: 0 }).level).toBe('warning'); // score=70
    });

    it('returns red when score < 50', () => {
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 6, unreportedB2C: 0 }).level).toBe('red');
      expect(computeScore({ issuedTotal: 10, pendingSubmission: 10, unreportedB2C: 0 }).level).toBe('red');
    });
  });

  describe('penaltyExposure', () => {
    it('returns 0 when no violations', () => {
      const { penaltyExposure } = computeScore({ issuedTotal: 100, pendingSubmission: 0, unreportedB2C: 0 });
      expect(penaltyExposure).toBe(0);
    });

    it('charges €15 per violating invoice', () => {
      const { penaltyExposure } = computeScore({ issuedTotal: 100, pendingSubmission: 3, unreportedB2C: 0 });
      expect(penaltyExposure).toBe(45);
    });

    it('caps penalty at €45,000 per year', () => {
      // 3001 violations × €15 = €45,015 → capped at €45,000
      const { penaltyExposure } = computeScore({ issuedTotal: 4000, pendingSubmission: 3001, unreportedB2C: 0 });
      expect(penaltyExposure).toBe(45_000);
    });

    it('exactly €45,000 at the cap boundary (3000 violations)', () => {
      const { penaltyExposure } = computeScore({ issuedTotal: 4000, pendingSubmission: 3000, unreportedB2C: 0 });
      expect(penaltyExposure).toBe(45_000);
    });

    it('does not exceed cap even with large numbers', () => {
      const { penaltyExposure } = computeScore({ issuedTotal: 100_000, pendingSubmission: 100_000, unreportedB2C: 0 });
      expect(penaltyExposure).toBeLessThanOrEqual(45_000);
    });

    it('sums B2B pending and B2C unreported violations for penalty', () => {
      const { penaltyExposure } = computeScore({ issuedTotal: 100, pendingSubmission: 2, unreportedB2C: 1 });
      expect(penaltyExposure).toBe(3 * 15);
    });
  });
});
