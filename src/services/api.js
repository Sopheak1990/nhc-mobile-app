// services/api.js

const BASE_URL = 'https://unhealthy-clip-coleslaw.ngrok-free.dev/NHC-Reservation';

// Centralized helper to avoid code duplication
const apiFetch = async (endpoint, options = {}) => {
    try {
        const fullUrl = `${BASE_URL}/${endpoint}`;
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '69420',
                ...options.headers
            }
        });

        const rawText = await response.text();
        try {
            return JSON.parse(rawText);
        } catch (e) {
            console.error(`🚨 SERVER ERROR in ${endpoint}:`, rawText);
            return { status: "error", message: "Server returned invalid data." };
        }
    } catch (error) {
        console.error(`🚨 NETWORK ERROR in ${endpoint}:`, error);
        return { status: "error", message: "Cannot connect to server." };
    }
};

// --- API EXPORTS ---

export const loginUser = (username, password) => 
    apiFetch('login.php', { method: 'POST', body: JSON.stringify({ username, password }) });

export const fetchBookings = (startDate = '', endDate = '', sortOrder = 'desc') => 
    apiFetch(`get_bookings.php?sort=${sortOrder}&start_date=${startDate}&end_date=${endDate}`);

export const fetchDashboardData = (filter = 'today') => 
    apiFetch(`get_dashboard.php?filter=${filter}`);

export const createBooking = (bookingData) => 
    apiFetch('api_add_booking.php', { method: 'POST', body: JSON.stringify(bookingData) });

export const manageUsers = async (userData) => {
  // If data is passed in (like for Edit or Delete), send a POST request
  if (userData) {
    return apiFetch('api_manage_users.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
  
  // If no data is passed (just loading the list), send a normal request
  return apiFetch('api_manage_users.php');
};

export const changePassword = (userId, currentPassword, newPassword) => 
    apiFetch('api_change_password.php', { 
        method: 'POST', 
        body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword }) 
    });

export const updateBooking = (bookingData) => 
    apiFetch('api_update_booking.php', { method: 'POST', body: JSON.stringify(bookingData) });

export const deleteBooking = (bookingId, userId) => 
    apiFetch('api_delete_booking.php', { method: 'POST', body: JSON.stringify({ delete_id: bookingId, user_id: userId }) });