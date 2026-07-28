import {
  addExerciseToDay,
  removeExerciseFromDay,
  moveExercise,
  addDay,
  removeDay,
  duplicateDay,
} from '../programEditor';
import type { Program } from '@/models';

function makeProgram(): Program {
  return {
    id: 'p1',
    name: 'Test',
    description: '',
    daysPerWeek: 1,
    goal: 'muscle_gain',
    level: 'beginner',
    isPreset: false,
    days: [
      {
        id: 'd1',
        name: 'Jour 1',
        order: 0,
        exercises: [
          { exerciseId: 'bench_press', order: 0, sets: 3, targetReps: '8-10', restSeconds: 90 },
          { exerciseId: 'back_squat', order: 1, sets: 4, targetReps: '6-8', restSeconds: 120 },
        ],
      },
    ],
  };
}

describe('programEditor — exercices', () => {
  it('ajoute un exercice avec les recommandations du catalogue', () => {
    const p = addExerciseToDay(makeProgram(), 'd1', 'deadlift');
    const list = p.days[0].exercises;
    expect(list).toHaveLength(3);
    expect(list[2].exerciseId).toBe('deadlift');
    expect(list[2].order).toBe(2);
    expect(list[2].sets).toBeGreaterThan(0);
  });

  it('ne mute pas le programme source', () => {
    const source = makeProgram();
    addExerciseToDay(source, 'd1', 'deadlift');
    expect(source.days[0].exercises).toHaveLength(2);
  });

  it('retire un exercice et renumérote', () => {
    const p = removeExerciseFromDay(makeProgram(), 'd1', 0);
    expect(p.days[0].exercises).toHaveLength(1);
    expect(p.days[0].exercises[0].exerciseId).toBe('back_squat');
    expect(p.days[0].exercises[0].order).toBe(0);
  });

  it('déplace un exercice vers le bas', () => {
    const p = moveExercise(makeProgram(), 'd1', 0, 1);
    expect(p.days[0].exercises.map((e) => e.exerciseId)).toEqual(['back_squat', 'bench_press']);
    expect(p.days[0].exercises.map((e) => e.order)).toEqual([0, 1]);
  });

  it('ignore un déplacement hors limites', () => {
    const p = moveExercise(makeProgram(), 'd1', 0, -1);
    expect(p.days[0].exercises.map((e) => e.exerciseId)).toEqual(['bench_press', 'back_squat']);
  });
});

describe('programEditor — jours', () => {
  it('ajoute un jour vide', () => {
    const p = addDay(makeProgram());
    expect(p.days).toHaveLength(2);
    expect(p.days[1].exercises).toHaveLength(0);
    expect(p.days[1].order).toBe(1);
  });

  it('conserve au moins un jour lors d\'une suppression', () => {
    const p = removeDay(makeProgram(), 'd1');
    expect(p.days).toHaveLength(1);
  });

  it('supprime un jour quand il en reste d\'autres', () => {
    const p = removeDay(addDay(makeProgram()), 'd1');
    expect(p.days).toHaveLength(1);
    expect(p.days[0].id).not.toBe('d1');
    expect(p.days[0].order).toBe(0);
  });

  it('duplique une séance juste après l\'originale avec un nouvel identifiant', () => {
    const p = duplicateDay(makeProgram(), 'd1');
    expect(p.days).toHaveLength(2);
    expect(p.days[1].name).toBe('Jour 1 (copie)');
    expect(p.days[1].id).not.toBe('d1');
    expect(p.days[1].exercises).toHaveLength(2);
    expect(p.days.map((d) => d.order)).toEqual([0, 1]);
  });

  it('copie les exercices en profondeur lors de la duplication', () => {
    const p = duplicateDay(makeProgram(), 'd1');
    p.days[1].exercises[0].sets = 99;
    expect(p.days[0].exercises[0].sets).toBe(3);
  });

  it('ignore la duplication d\'un jour inexistant', () => {
    const p = duplicateDay(makeProgram(), 'inconnu');
    expect(p.days).toHaveLength(1);
  });
});
