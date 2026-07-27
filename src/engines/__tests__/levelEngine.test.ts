import { resolveLevel, computeLevelUp, titleForLevel } from '../levelEngine';
import { xpForNextLevel, MAX_LEVEL } from '@/data/levels';

describe('levelEngine — résolution du niveau', () => {
  it('démarre au niveau 1 avec 0 XP', () => {
    const s = resolveLevel(0);
    expect(s.level).toBe(1);
    expect(s.xpIntoLevel).toBe(0);
    expect(s.title).toBe('Débutant');
  });

  it('passe au niveau 2 au seuil exact', () => {
    const need = xpForNextLevel(1);
    expect(resolveLevel(need).level).toBe(2);
    expect(resolveLevel(need - 1).level).toBe(1);
  });

  it('progress est borné entre 0 et 1', () => {
    const s = resolveLevel(150);
    expect(s.progress).toBeGreaterThanOrEqual(0);
    expect(s.progress).toBeLessThanOrEqual(1);
  });

  it('ne dépasse pas le niveau maximum', () => {
    const s = resolveLevel(100_000_000);
    expect(s.level).toBe(MAX_LEVEL);
    expect(s.progress).toBe(1);
  });
});

describe('levelEngine — titres', () => {
  it('résout les titres aux paliers', () => {
    expect(titleForLevel(1)).toBe('Débutant');
    expect(titleForLevel(5)).toBe('Novice');
    expect(titleForLevel(10)).toBe('Apprenti');
    expect(titleForLevel(50)).toBe('Titan');
    expect(titleForLevel(100)).toBe('Mythique');
  });
});

describe('levelEngine — montée de niveau', () => {
  it('détecte une montée simple', () => {
    const need = xpForNextLevel(1);
    const result = computeLevelUp(0, need);
    expect(result.leveledUp).toBe(true);
    expect(result.fromLevel).toBe(1);
    expect(result.toLevel).toBe(2);
    expect(result.levelsGained).toBe(1);
  });

  it('gère plusieurs montées de niveau simultanées', () => {
    // XP suffisante pour franchir plusieurs niveaux d'un coup
    let cumulative = 0;
    for (let l = 1; l <= 4; l++) cumulative += xpForNextLevel(l);
    const result = computeLevelUp(0, cumulative);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBeGreaterThanOrEqual(4);
    expect(result.toLevel).toBeGreaterThanOrEqual(5);
    // un nouveau titre "Novice" est atteint au niveau 5
    if (result.toLevel >= 5) {
      expect(result.newTitle).toBe('Novice');
    }
  });

  it('ne signale pas de montée sans XP suffisante', () => {
    const result = computeLevelUp(10, 5);
    expect(result.leveledUp).toBe(false);
    expect(result.levelsGained).toBe(0);
    expect(result.rewards).toHaveLength(0);
  });
});
