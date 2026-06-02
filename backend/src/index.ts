import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { auth } from "./routes/auth";
import { groupRoute } from "./routes/groups";
import { expenseRoute } from "./routes/expenses";

const app = new Hono();

app.route("/auth/*", auth);
app.route("/groups/*", groupRoute);
app.route("/expenses/*", expenseRoute);

serve({
    fetch: app.fetch,
    port: 3000,
});

console.log("Server running on http://localhost:3000");
