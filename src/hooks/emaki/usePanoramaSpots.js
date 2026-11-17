/**
 * Panorama spot list: merge data.spots with quiz targets, dedupe by spot id / quizQuestionId.
 */

export function buildPanoramaSpots(data, quizQuestions = []) {
  const byId = new Map();
  const quizQuestionIds = new Set();

  if (Array.isArray(data?.spots)) {
    for (const s of data.spots) {
      if (s?.id == null) continue;
      byId.set(s.id, { ...s, isPanorama: true });
      if (s.quizQuestionId != null) {
        quizQuestionIds.add(s.quizQuestionId);
      }
    }
  }

  if (Array.isArray(quizQuestions)) {
    for (const q of quizQuestions) {
      const target = q?.target;
      if (!target || typeof target.x !== "number" || typeof target.y !== "number") {
        continue;
      }

      const qSpotId = `quiz_target_${q.id}`;
      if (byId.has(qSpotId) || quizQuestionIds.has(q.id)) {
        continue;
      }

      const order = q.order ?? "";
      const label = q.jumpLabelJa || q.id;

      byId.set(qSpotId, {
        id: qSpotId,
        quizQuestionId: q.id,
        name: `【Q${order}】${label}`,
        x: target.x,
        y: target.y,
        rect: { w: target.w ?? 6, h: target.h ?? 12 },
        scale: target.scale ?? 4.6,
        hidden: true,
        isPanorama: true,
      });
      quizQuestionIds.add(q.id);
    }
  }

  const panoramaSpots = Array.from(byId.values());
  return {
    panoramaSpots,
    hasPanoramaSpots: panoramaSpots.length > 0,
  };
}

export function usePanoramaSpots(data, quizQuestions = []) {
  return buildPanoramaSpots(data, quizQuestions);
}