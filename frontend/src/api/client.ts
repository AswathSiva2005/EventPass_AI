import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: apiUrl ?? "http://localhost:5000/api/v1",
  timeout: 20_000,
  headers: {
    Accept: "application/json"
  }
});
