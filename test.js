import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 50, // usuarios concurrentes
  duration: '30s', // duración de la prueba
};

export default function () {
  const url = 'http://localhost:3000/api/usuarios';
  http.get(url);
  sleep(1);
}

