// types.ts
export type SplitType = "equal" | "percentage" | "exact";

export interface Expense {
    id: string;
    groupId: string;
    paidBy: string;
    /** Total price in SEK */
    price: number;
    splitType: SplitType;
    /**
     * Meaning depends on splitType:
     *  - "equal":      keys = participating user IDs, values ignored
     *  - "percentage": keys = user IDs, values = percentage (must sum to 100)
     *  - "exact":      keys = user IDs, values = exact amounts (must sum to price)
     */
    splits: Record<string, number>;
    description: string;
    date: Date;
}

export interface Group {
    id: string;
    name: string;
    memberIds: string[];
}

export interface User {
    id: string;
    username: string;
    name: string;
}

/** A single debt: `from` owes `to` the amount `amount` */
export interface Transfer {
    from: string;
    to: string;
    amount: number;
}

export interface Settlement {
    id: string;
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    note?: string; // funny avsugning note
    date: Date;
}
