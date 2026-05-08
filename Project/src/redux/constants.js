export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const USERS_URL = `${BASE_URL}/api/users`;
export const API_URL = `${BASE_URL}/api/projects`;
export const WORKSPACES_URL = `${BASE_URL}/api/workspaces`;
export const TEAMS_URL = `${BASE_URL}/api/teams`;
export const TASKS_URL = `${BASE_URL}/api/tasks`;
