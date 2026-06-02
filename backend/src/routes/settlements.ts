import { Hono } from "hono";
import { db } from "../db";
import { settlement, groupMembers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const settlementRoute = new Hono();

settlementRoute.post("/create", async (c) => {
    const { groupId, fromUserId, toUserId, amountCents } = await c.req.json();

    if (
        !groupId ||
        !fromUserId ||
        !toUserId ||
        typeof amountCents !== "number"
    ) {
        return c.json({ error: "Missing fields" }, 400);
    }

    if (amountCents <= 0) {
        return c.json({ error: "Amount must be greater than 0" }, 400);
    }

    // Check if both users are members of the group
    const [fromMembership] = await db
        .select()
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, fromUserId),
            ),
        )
        .limit(1);

    const [toMembership] = await db
        .select()
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, toUserId),
            ),
        )
        .limit(1);

    if (!fromMembership || !toMembership) {
        return c.json(
            { error: "Both users must be members of the group" },
            400,
        );
    }

    if (fromUserId === toUserId) {
        return c.json({ error: "Cannot settle with yourself" }, 400);
    }

    if (!Number.isInteger(amountCents)) {
        return c.json({ error: "amountCents must be an integer" }, 400);
    }

    const newSettlement = {
        id: nanoid(),
        groupId,
        fromUserId,
        toUserId,
        amountCents,
        date: new Date(),
    };

    await db.insert(settlement).values(newSettlement);

    return c.json({ settlementId: newSettlement.id });
});

export default settlementRoute;
