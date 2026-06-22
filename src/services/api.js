// services/api.js

// Replace this with your actual IPv4 address! Do not use 'localhost'.
const BASE_URL = 'http://192.168.1.174/NHC-Reservation/api';

export const loginUser = async (username, password) => {
    try {
        // Send the data to your PHP file
        const response = await fetch(`${BASE_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            // Package the username and password into a JSON string
            body: JSON.stringify({ 
                username: username, 
                password: password 
            }),
        });

        // Read the response from PHP
        const json = await response.json();
        return json;

    } catch (error) {
        console.error("API Error:", error);
        return { status: "error", message: "Cannot connect to server." };
    }
};

// Add the sortOrder parameter with a default of 'desc'
export const fetchBookings = async (startDate = '', endDate = '', sortOrder = 'desc') => {
    try {
        // Pass the sort order in the URL string
        let url = `${BASE_URL}/get_bookings.php?sort=${sortOrder}&`;
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}`;

        const response = await fetch(url);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        return { status: "error", message: "Cannot connect to server." };
    }
};

// Add this to src/services/api.js
export const fetchDashboardData = async (filter = 'today') => {
    try {
        const response = await fetch(`${BASE_URL}/get_dashboard.php?filter=${filter}`);
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        return { status: "error", message: "Cannot connect to server." };
    }
};


export const createBooking = async (bookingData) => {
    try {
        const response = await fetch(`${BASE_URL}/add_booking.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Create Booking Error:", error);
        return { status: "error", message: "Cannot connect to server." };
    }
};