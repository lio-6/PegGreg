import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const splitTypeEnum = pgEnum("split_type", [
    "equal",
    "percentage",
    "exact",
]);

// creates a table User, each user has an id, name, password hash and created at timestamp
export const user = pgTable("users", {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    displayName: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const group = pgTable("groups", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    InviteCode: text("invite_code").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
    groupId: text("group_id")
        .notNull()
        .references(() => group.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const expenses = pgTable("expenses", {
    id: text("id").primaryKey(),
    groupId: text("group_id")
        .notNull()
        .references(() => group.id, { onDelete: "cascade" }),
    paidBy: text("paid_by")
        .notNull()
        .references(() => user.id),
    priceCents: integer("price_cents").notNull(),
    split_type: splitTypeEnum("split_type").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull(),
});

export const expenseSplits = pgTable("expense_splits", {
    expenseId: text("expense_id")
        .notNull()
        .references(() => expenses.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
});

export const settlements = pgTable("settlements", {
    id: text("id").primaryKey(),
    groupId: text("group_id")
        .notNull()
        .references(() => group.id, { onDelete: "cascade" }),
    fromUserId: text("from_user_id")
        .notNull()
        .references(() => user.id),
    toUserId: text("to_user_id")
        .notNull()
        .references(() => user.id),
    amountCents: integer("amount_cents").notNull(),
    note: text("note"),
    date: timestamp("date").notNull(),
});
