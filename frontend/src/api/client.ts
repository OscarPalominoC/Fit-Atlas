import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getExercises = async (params?: any) => {
  const response = await api.get('/exercises/', { params });
  return response.data;
};

export const getRoutines = async (userId: string) => {
  const response = await api.get('/routines/', { params: { user_id: userId } });
  return response.data;
};

export const createRoutine = async (routine: any) => {
  const response = await api.post('/routines/', routine);
  return response.data;
};

export const updateRoutine = async (routineId: string, routine: any) => {
  const response = await api.put(`/routines/${routineId}`, routine);
  return response.data;
};

export const deleteRoutine = async (routineId: string) => {
  const response = await api.delete(`/routines/${routineId}`);
  return response.data;
};

export const startSession = async (userId: string, routineId?: string) => {
  const response = await api.post('/sessions/start', null, { params: { user_id: userId, routine_id: routineId } });
  return response.data;
};

export const completeSession = async (sessionId: string, sessionData: any) => {
  const response = await api.post(`/sessions/${sessionId}/complete`, sessionData);
  return response.data;
};

export const deleteSession = async (sessionId: string) => {
  const response = await api.delete(`/sessions/${sessionId}`);
  return response.data;
};

export const updateSession = async (sessionId: string, data: any) => {
  const response = await api.patch(`/sessions/${sessionId}`, data);
  return response.data;
};


export const getSessions = async (userId: string) => {
  const response = await api.get('/sessions/', { params: { user_id: userId } });
  return response.data;
};

export const getAnalyticsSummary = async (userId: string) => {
  const response = await api.get(`/analytics/summary/${userId}`);
  return response.data;
};

export const getMuscleRecovery = async (userId: string) => {
  const response = await api.get(`/analytics/recovery/${userId}`);
  return response.data;
};

export const updateProfile = async (userId: string, data: any) => {
  const response = await api.put(`/auth/user/${userId}`, data);
  return response.data;
};

export const getMe = async (userId: string) => {
  const response = await api.get(`/auth/me?user_id=${userId}`);
  return response.data;
};
export const getBodyMetrics = async (userId: string) => {
  const response = await api.get(`/metrics/${userId}`);
  return response.data;
};

export const addBodyMetric = async (data: any) => {
  const response = await api.post('/metrics/', data);
  return response.data;
};
