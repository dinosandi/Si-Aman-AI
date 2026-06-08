import { ApiAuthRepository } from "./apiAuthRepository";
import { ApiIncidentRepository } from "./apiIncidentRepository";
import { ApiNavigationRepository } from "./apiNavigationRepository";

export const authRepository = new ApiAuthRepository();
export const incidentRepository = new ApiIncidentRepository();
export const navigationRepository = new ApiNavigationRepository();
