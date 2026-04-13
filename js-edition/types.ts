export Expence {
    Name: string;
    Id: string;
    groupId: string;
    paidBy: string;
    price: number;
    splits?: Record<string, number>;
    date: Date;
}

export Group {
    Name: string;
    Id: string;
    membersIds: string[];
    balance: Record<string, number>;
}

export User {
    Name: string;
    Id: string;
}
