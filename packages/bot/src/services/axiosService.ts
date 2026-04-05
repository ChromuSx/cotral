import axios from 'axios';

const api = axios.create({
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 15000,
});

export default api;
