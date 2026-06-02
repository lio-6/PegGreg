import { Hono } from "hono";
import { db } from "../db";
import { expenses, expenseSplits, groupMembers } from "../db/schema";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";

const expenseRoute = new Hono();

async function isGroupMember(
    groupId: string,
    userId: string,
): Promise<boolean> {
    const [membership] = await db
        .select()
        .from(groupMembers)
        .where(
            and(
                eq(groupMembers.groupId, groupId),
                eq(groupMembers.userId, userId),
            ),
        )
        .limit(1);

    return Boolean(membership);
}
expenseRoute.post("/create", async (c) => {
    const {
        groupId,
        paidBy,
        priceCents,
        splitType,
        description,
        date,
        splits,
    } = await c.req.json();

    if (
        !groupId ||
        !paidBy ||
        typeof priceCents !== "number" ||
        !splitType ||
        !description ||
        !date ||
        !splits
    ) {
        return c.json({ error: "Missing fields" }, 400);
    }

    if (priceCents <= 0) {
        return c.json({ error: "Price must be greater than 0" }, 400);
    }

    if (!(await isGroupMember(groupId, paidBy))) {
        return c.json({ error: "Payer is not a member of this group" }, 400);
    }

    for (const userId of Object.keys(splits)) {
        if (!(await isGroupMember(groupId, userId))) {
            return c.json(
                { error: `Split user ${userId} is not a member of this group` },
                400,
            );
        }
    }

    const newExpense = {
        id: nanoid(),
        groupId,
        paidBy,
        priceCents,
        split_type: splitType,
        description,
        date: new Date(date),
    };

    await db.insert(expenses).values(newExpense);

    const splitEntries = Object.entries(splits).map(([userId, value]) => ({
        expenseId: newExpense.id,
        userId,
        value,
    }));

    await db.insert(expenseSplits).values(splitEntries);

    return c.json({ expenseId: newExpense.id });
});

export default expenseRoute;
