/** How an amount compares with its goal, for bars and labels. */
export interface GoalProgress {
  /** 0–1 share of the bar filled up to the goal. */
  fill: number;
  /** 0–1 share of the bar that shows the amount past the goal. */
  overflow: number;
  /** Amount left before the goal (0 when met or over). */
  remaining: number;
  /** Amount past the goal (0 when under). */
  over: number;
  /** Whole-number percent of goal, for the "% goal" column. */
  percent: number;
}

/**
 * Splits `value` against `goal` so a bar can draw the part up to the goal and
 * a distinct overflow segment. When over, the bar is rescaled so the whole
 * amount fits: the goal sits at goal/value of the width.
 * A missing or non-positive goal shows no progress rather than dividing by 0.
 */
export function goalProgress(value: number, goal: number): GoalProgress {
  const amount = Math.max(0, value);
  if (!(goal > 0)) return { fill: 0, overflow: 0, remaining: 0, over: 0, percent: 0 };

  const percent = Math.round((amount / goal) * 100);
  if (amount <= goal) {
    return { fill: amount / goal, overflow: 0, remaining: goal - amount, over: 0, percent };
  }
  const goalShare = goal / amount;
  return { fill: goalShare, overflow: 1 - goalShare, remaining: 0, over: amount - goal, percent };
}
