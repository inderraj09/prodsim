import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "rotate daily scenario",
  "30 18 * * *",
  internal.scenarios.rotateDaily,
  {},
);

export default crons;
