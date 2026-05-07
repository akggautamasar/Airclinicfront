const BASE = process.env.NEXT_PUBLIC_API_URL

async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_token') : null
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export const api = {
  // Doctor
  getProfile:      () => apiFetch('/api/doctor/profile'),
  createProfile:   (body) => apiFetch('/api/doctor/profile', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile:   (body) => apiFetch('/api/doctor/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getDashboard:    () => apiFetch('/api/doctor/dashboard'),

  // Patients
  getPatients:     (search = '') => apiFetch(`/api/patients?search=${search}`),
  getPatient:      (id) => apiFetch(`/api/patients/${id}`),
  createPatient:   (body) => apiFetch('/api/patients', { method: 'POST', body: JSON.stringify(body) }),
  updatePatient:   (id, body) => apiFetch(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePatient:   (id) => apiFetch(`/api/patients/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: (date) => apiFetch(`/api/appointments${date ? `?date=${date}` : ''}`),
  getSlots:        (date) => apiFetch(`/api/appointments/slots?date=${date}`),
  bookAppointment: (body) => apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointment:(id, body) => apiFetch(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancelAppointment:(id) => apiFetch(`/api/appointments/${id}`, { method: 'DELETE' }),

  // Prescriptions
  getPrescriptions: (patient_id) => apiFetch(`/api/prescriptions${patient_id ? `?patient_id=${patient_id}` : ''}`),
  getPrescription:  (id) => apiFetch(`/api/prescriptions/${id}`),
  createPrescription:(body) => apiFetch('/api/prescriptions', { method: 'POST', body: JSON.stringify(body) }),

  // Bills
  getBills:        (patient_id) => apiFetch(`/api/bills${patient_id ? `?patient_id=${patient_id}` : ''}`),
  getSummary:      () => apiFetch('/api/bills/summary'),
  createBill:      (body) => apiFetch('/api/bills', { method: 'POST', body: JSON.stringify(body) }),
  updateBill:      (id, body) => apiFetch(`/api/bills/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
}
