import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "purgar fichas TMDB vencidas",
  { hourUTC: 9, minuteUTC: 0 },
  internal.fichas.purgarVencidas,
  {},
);

export default crons;
