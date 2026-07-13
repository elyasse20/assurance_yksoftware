/** Points to the Spring Boot backend (port 8080). */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export default API_BASE_URL;
