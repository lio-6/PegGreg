import { Expense, Group, Transfer, Settlement } from "./types";

// ─── Split helpers ──────────────────────────────────────────────

export function splitEqual(participantIds: string[], price: number): Record<string, number> {
    if (participantIds.length === 0) return {};
    const share = Math.floor((price * 100) / participantIds.length);
    const remainder = Math.round(price * 100) - share * participantIds.length;
    const result: Record<string, number> = {};
    participantIds.forEach((id, i) => {
        // Last person absorbs the rounding remainder (usually 0 or 1 cent)
        result[id] =
            (share + (i === participantIds.length - 1 ? remainder : 0)) / 100;
    });
    return result;
}

export function splitPercentage(splits: Record<string, number>, price: number): Record<string, number> {
    const total = Object.values(splits).reduce((a, b) => a + b, 0);
    if (Math.round(total) !== 100) {
        throw new Error(`Percentages must sum to 100, got ${total}`);
    }
    const result: Record<string, number> = {};
    Object.entries(splits).forEach(([id, pct]) => {
        result[id] = Math.round((pct / 100) * price * 100) / 100;
    });
    return result;
}

export function splitExact(splits: Record<string, number>,price: number): Record<string, number> {
    const total = Object.values(splits).reduce((a, b) => a + b, 0);
    if (Math.round(total * 100) !== Math.round(price * 100)) {
        throw new Error(`Exact splits (${total}) must equal price (${price})`);
    }
    return splits;
}

// ─── Balance calculation ────────────────────────────────────────

/**
 * Returns a net balance map for a group.
 * Positive = owed money. Negative = owes money.
 */
export function calcBalance(expenses: Expense[], settlements: Settlement[], groupId: string): Record<string, number> {
    const balance: Record<string, number> = {};

    for (const expense of expenses) {
        if (expense.groupId !== groupId) continue; // <-- group filter

        const { price, paidBy, splits, splitType } = expense;

        // Credit the payer
        balance[paidBy] = (balance[paidBy] ?? 0) + price;

        // Debit each participant according to their share
        let deductions: Record<string, number>;
        switch (
            splitType // <-- use expense's own splitType
        ) {
            case "equal":
                deductions = splitEqual(Object.keys(splits), price);
                break;
            case "percentage":
                deductions = splitPercentage(splits, price);
                break;
            case "exact":
                deductions = splitExact(splits, price);
                break;
        }

        for (const [userId, amount] of Object.entries(deductions)) {
            balance[userId] = (balance[userId] ?? 0) - amount;
        }
    }

    for (const settlement of settlements) {
        if (settlement.groupId !== groupId) continue; // <-- group filter
            
        balance[settlement.fromUserId] = (balance[settlement.fromUserId] ?? 0) + settlement.amount;
        balance[settlement.toUserId] = (balance[settlement.toUserId] ?? 0) - settlement.amount;
    
    }

    return balance;
}

// ─── minimize swish algorithm ───────────────────────────────────

/**
 * Given a balance map, returns a list of transfers to settle all debts.
 * Uses a greedy algorithm to minimize the number of transactions.
 */
export function minSwish(balance: Record<string, number>): Transfer[] {
    const transfers: Transfer[] = [];

    const cents: Record<string, number> = {};
    for (const [id, amt] of Object.entries(balance)) {
        cents[id] = Math.round(amt * 100);
    }

    const debtors = Object.entries(cents)
        .filter(([, v]) => v < 0)
        .map(([id, v]) => ({ id, amount: -v })) // make positive for ease
        .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(cents)
        .filter(([, v]) => v > 0)
        .map(([id, v]) => ({ id, amount: v }))
        .sort((a, b) => b.amount - a.amount);

    let d = 0,
        c = 0;

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];
        const transferAmount = Math.min(debtor.amount, creditor.amount);

        transfers.push({
            from: debtor.id,
            to: creditor.id,
            amount: transferAmount / 100,
        });

        debtor.amount -= transferAmount;
        creditor.amount -= transferAmount;

        if (debtor.amount === 0) d++;
        if (creditor.amount === 0) c++;
    }

    return transfers;
}
