//import redis from 'redis';
// import Redis from "ioredis";
import { ENV } from "../config/env.config.js";
// export const redis = new Redis({
//   host: ENV.REDIS_HOST,
//   port: ENV.REDIS_PORT,
//   password: ENV.REDIS_PASSWORD,
// });

import { createClient } from "redis";

export const redis = createClient({
  url: ENV.REDIS_PORT,
});

redis.on("error", (err) => console.error("Redis Error:", err));
await redis.connect();
