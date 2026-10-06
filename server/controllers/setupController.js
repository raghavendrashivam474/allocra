import * as setupReadinessService from '../core/institution/setup/setupReadinessService.js';

export async function getReadiness(req, res, next) {
  try {
    const readiness = await setupReadinessService.getReadiness();
    res.json(readiness);
  } catch (error) {
    next(error);
  }
}
