"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcBalance = calcBalance;
exports.minSwish = minSwish;
// ─── Split helpers ──────────────────────────────────────────────
function splitEqual(participantIds, price) {
    if (participantIds.length === 0)
        return {};
    var share = Math.floor((price * 100) / participantIds.length);
    var remainder = Math.round(price * 100) - share * participantIds.length;
    var result = {};
    participantIds.forEach(function (id, i) {
        // Last person absorbs the rounding remainder (usually 0 or 1 cent)
        result[id] =
            (share + (i === participantIds.length - 1 ? remainder : 0)) / 100;
    });
    return result;
}
function splitPercentage(splits, price) {
    var total = Object.values(splits).reduce(function (a, b) { return a + b; }, 0);
    if (Math.round(total) !== 100) {
        throw new Error("Percentages must sum to 100, got ".concat(total));
    }
    var result = {};
    Object.entries(splits).forEach(function (_a) {
        var id = _a[0], pct = _a[1];
        result[id] = Math.round((pct / 100) * price * 100) / 100;
    });
    return result;
}
function splitExact(splits, price) {
    var total = Object.values(splits).reduce(function (a, b) { return a + b; }, 0);
    if (Math.round(total * 100) !== Math.round(price * 100)) {
        throw new Error("Exact splits (".concat(total, ") must equal price (").concat(price, ")"));
    }
    return splits;
}
// ─── Balance calculation ────────────────────────────────────────
/**
 * Returns a net balance map for a group.
 * Positive = owed money. Negative = owes money.
 */
function calcBalance(expenses, groupId) {
    var _a, _b;
    var balance = {};
    for (var _i = 0, expenses_1 = expenses; _i < expenses_1.length; _i++) {
        var expense = expenses_1[_i];
        if (expense.groupId !== groupId)
            continue; // <-- group filter
        var price = expense.price, paidBy = expense.paidBy, splits = expense.splits, splitType = expense.splitType;
        // Credit the payer
        balance[paidBy] = ((_a = balance[paidBy]) !== null && _a !== void 0 ? _a : 0) + price;
        // Debit each participant according to their share
        var deductions = void 0;
        switch (splitType // <-- use expense's own splitType
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
        for (var _c = 0, _d = Object.entries(deductions); _c < _d.length; _c++) {
            var _e = _d[_c], userId = _e[0], amount = _e[1];
            balance[userId] = ((_b = balance[userId]) !== null && _b !== void 0 ? _b : 0) - amount;
        }
    }
    return balance;
}
// ─── minimize swish algorithm ───────────────────────────────────
/**
 * Given a balance map, returns a list of transfers to settle all debts.
 * Uses a greedy algorithm to minimize the number of transactions.
 */
function minSwish(balance) {
    var transfers = [];
    var cents = {};
    for (var _i = 0, _a = Object.entries(balance); _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], amt = _b[1];
        cents[id] = Math.round(amt * 100);
    }
    var debtors = Object.entries(cents)
        .filter(function (_a) {
        var v = _a[1];
        return v < 0;
    })
        .map(function (_a) {
        var id = _a[0], v = _a[1];
        return ({ id: id, amount: -v });
    }) // make positive for ease
        .sort(function (a, b) { return b.amount - a.amount; });
    var creditors = Object.entries(cents)
        .filter(function (_a) {
        var v = _a[1];
        return v > 0;
    })
        .map(function (_a) {
        var id = _a[0], v = _a[1];
        return ({ id: id, amount: v });
    })
        .sort(function (a, b) { return b.amount - a.amount; });
    var d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
        var debtor = debtors[d];
        var creditor = creditors[c];
        var transferAmount = Math.min(debtor.amount, creditor.amount);
        transfers.push({
            from: debtor.id,
            to: creditor.id,
            amount: transferAmount / 100,
        });
        debtor.amount -= transferAmount;
        creditor.amount -= transferAmount;
        if (debtor.amount === 0)
            d++;
        if (creditor.amount === 0)
            c++;
    }
    return transfers;
}
