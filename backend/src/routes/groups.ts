import { Hono } from "hono";
import { db } from "../db";
import { group, groupMembers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const groupRoute = new Hono();

const JWT_SECRET = process.env.JWT_SECRET;

groupRoute.post("/create", async (c) => {
    const { name } = await c.req.json();
    if (!name) {
        return c.json({ error: "Missing fields" }, 400);
    }

    const inviteCode = nanoid(8);

    const newGroup = {
        id: nanoid(),
        name,
        InviteCode: inviteCode,
    };

    await db.insert(group).values(newGroup);

    return c.json({ groupId: newGroup.id, inviteCode });
});

groupRoute.post("/join", async (c) => {
    const { inviteCode, userId } = await c.req.json();
    if (!inviteCode || !userId) {
        return c.json({ error: "Missing fields" }, 400);
    }

    const [foundGroup] = await db
        .select()
        .from(group)
        .where(eq(group.InviteCode, inviteCode));

    if (!foundGroup) return c.json({ error: "Invalid invite code" }, 404);

    const existingMembership = await db
        .select()
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, foundGroup.id),
                eq(groupMembers.userId, userId),
            ),
        )
        .limit(1);

    if (existingMembership.length > 0) {
        return c.json({ error: "User already a member of this group" }, 400);
    }

    const membership = {
        groupId: foundGroup.id,
        userId,
    };

    await db.insert(groupMembers).values(membership);

    return c.json({ groupId: foundGroup.id, name: foundGroup.name });
});

export default groupRoute;
