import {
    calcBalance,
    minSwish,
    splitEqual,
    splitPercentage,
    splitExact
} from "./levelpegging"; // Update with your actual file name
import { Expense, Settlement, Transfer } from "./types";

describe("Expense and Settlement Logic", () => {
    describe("splitEqual", () => {
        it("1. should return an empty object if there are no participants", () => {
            expect(splitEqual([], 100)).toEqual({});
        });

        it("2. should split perfectly divisible amounts equally", () => {
            expect(splitEqual(["A", "B"], 100)).toEqual({ A: 50, B: 50 });
        });

        it("3. should split perfectly divisible amounts equally among many", () => {
            expect(splitEqual(["A", "B", "C", "D"], 200)).toEqual({ A: 50, B: 50, C: 50, D: 50 });
        });

        it("4. should handle rounding remainders by assigning to the last participant (1 cent)", () => {
            expect(splitEqual(["A", "B", "C"], 100)).toEqual({ A: 33.33, B: 33.33, C: 33.34 });
        });

        it("5. should handle remainders correctly with 2 cents", () => {
            expect(splitEqual(["A", "B", "C"], 200)).toEqual({ A: 66.66, B: 66.66, C: 66.68 });
        });

        it("6. should assign the full price to a single participant", () => {
            expect(splitEqual(["A"], 42.55)).toEqual({ A: 42.55 });
        });

        it("7. should handle zero price", () => {
            expect(splitEqual(["A", "B"], 0)).toEqual({ A: 0, B: 0 });
        });
    });

    describe("splitPercentage", () => {
        it("8. should split correctly for 50/50", () => {
            expect(splitPercentage({ A: 50, B: 50 }, 200)).toEqual({ A: 100, B: 100 });
        });

        it("9. should split correctly for asymmetric percentages", () => {
            expect(splitPercentage({ A: 20, B: 80 }, 100)).toEqual({ A: 20, B: 80 });
        });

        it("10. should throw an error if percentages sum to less than 100", () => {
            expect(() => splitPercentage({ A: 50, B: 40 }, 100)).toThrow(
                "Percentages must sum to 100, got 90"
            );
        });

        it("11. should throw an error if percentages sum to more than 100", () => {
            expect(() => splitPercentage({ A: 60, B: 50 }, 100)).toThrow(
                "Percentages must sum to 100, got 110"
            );
        });

        it("12. should handle fractional percentage calculations and round correctly", () => {
            expect(splitPercentage({ A: 33.33, B: 33.33, C: 33.34 }, 100)).toEqual({
                A: 33.33,
                B: 33.33,
                C: 33.34
            });
        });

        it("13. should handle assigning 100% to one person", () => {
            expect(splitPercentage({ A: 100 }, 75.5)).toEqual({ A: 75.5 });
        });
    });

    describe("splitExact", () => {
        it("14. should return exact splits if they match the price", () => {
            expect(splitExact({ A: 20, B: 30.5 }, 50.5)).toEqual({ A: 20, B: 30.5 });
        });

        it("15. should throw an error if exact splits sum to less than the price", () => {
            expect(() => splitExact({ A: 20, B: 20 }, 50)).toThrow(
                "Exact splits (40) must equal price (50)"
            );
        });

        it("16. should throw an error if exact splits sum to more than the price", () => {
            expect(() => splitExact({ A: 30, B: 30 }, 50)).toThrow(
                "Exact splits (60) must equal price (50)"
            );
        });

        it("17. should handle decimal rounding precision accurately", () => {
            expect(splitExact({ A: 10.33, B: 10.33, C: 10.34 }, 31)).toEqual({
                A: 10.33,
                B: 10.33,
                C: 10.34
            });
        });
    });

    describe("calcBalance", () => {
        const GROUP_ID = "group-1";

        it("18. should return an empty map if there are no expenses or settlements", () => {
            expect(calcBalance([], [], GROUP_ID)).toEqual({});
        });

        it("19. should calculate balances for a simple equal split", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "A", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            expect(calcBalance(expenses, [], GROUP_ID)).toEqual({ A: 50, B: -50 });
        });

        it("20. should ignore expenses and settlements from other groups", () => {
            const expenses = [
                { groupId: "other-group", price: 100, paidBy: "A", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            const settlements = [
                { groupId: "other-group", fromUserId: "B", toUserId: "A", amount: 50 }
            ] as unknown as Settlement[];
            expect(calcBalance(expenses, settlements, GROUP_ID)).toEqual({});
        });

        it("21. should aggregate multiple expenses properly", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "A", splitType: "equal", splits: { A: 1, B: 1 } },
                { groupId: GROUP_ID, price: 50, paidBy: "B", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            expect(calcBalance(expenses, [], GROUP_ID)).toEqual({ A: 25, B: -25 });
        });

        it("22. should handle expenses where the payer is not part of the splits", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "C", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            expect(calcBalance(expenses, [], GROUP_ID)).toEqual({ C: 100, A: -50, B: -50 });
        });

        it("23. should calculate balances using percentage splits", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 200, paidBy: "A", splitType: "percentage", splits: { A: 25, B: 75 } }
            ] as unknown as Expense[];
            expect(calcBalance(expenses, [], GROUP_ID)).toEqual({ A: 150, B: -150 });
        });

        it("24. should calculate balances using exact splits", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "B", splitType: "exact", splits: { A: 30, B: 70 } }
            ] as unknown as Expense[];
            expect(calcBalance(expenses, [], GROUP_ID)).toEqual({ B: 30, A: -30 });
        });

        it("25. should apply settlements correctly (debtor paying creditor)", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "A", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            const settlements = [
                { groupId: GROUP_ID, fromUserId: "B", toUserId: "A", amount: 50 }
            ] as unknown as Settlement[];
            expect(calcBalance(expenses, settlements, GROUP_ID)).toEqual({ A: 0, B: 0 });
        });

        it("26. should calculate correctly if settlement is partial", () => {
            const expenses = [
                { groupId: GROUP_ID, price: 100, paidBy: "A", splitType: "equal", splits: { A: 1, B: 1 } }
            ] as unknown as Expense[];
            const settlements = [
                { groupId: GROUP_ID, fromUserId: "B", toUserId: "A", amount: 20 }
            ] as unknown as Settlement[];
            expect(calcBalance(expenses, settlements, GROUP_ID)).toEqual({ A: 30, B: -30 });
        });
    });

    describe("minSwish", () => {
        it("27. should return an empty array for an empty balance map", () => {
            expect(minSwish({})).toEqual([]);
        });

        it("28. should return an empty array if all balances are strictly 0", () => {
            expect(minSwish({ A: 0, B: 0, C: 0 })).toEqual([]);
        });

        it("29. should resolve a simple 1-to-1 debt", () => {
            const balance = { A: 50, B: -50 };
            expect(minSwish(balance)).toEqual([{ from: "B", to: "A", amount: 50 }]);
        });

        it("30. should resolve chained debt (A owes B, B owes C -> A owes C)", () => {
            const balance = { A: -50, B: 0, C: 50 };
            expect(minSwish(balance)).toEqual([{ from: "A", to: "C", amount: 50 }]);
        });

        it("31. should resolve multiple debtors owing a single creditor", () => {
            const balance = { A: 100, B: -60, C: -40 };
            const transfers = minSwish(balance);
            expect(transfers).toHaveLength(2);
            expect(transfers).toEqual(
                expect.arrayContaining([
                    { from: "B", to: "A", amount: 60 },
                    { from: "C", to: "A", amount: 40 }
                ])
            );
        });

        it("32. should resolve a single debtor owing multiple creditors", () => {
            const balance = { A: -100, B: 70, C: 30 };
            const transfers = minSwish(balance);
            expect(transfers).toHaveLength(2);
            expect(transfers).toEqual(
                expect.arrayContaining([
                    { from: "A", to: "B", amount: 70 },
                    { from: "A", to: "C", amount: 30 }
                ])
            );
        });

        it("33. should handle decimals correctly to prevent infinite loops", () => {
            const balance = { A: 33.34, B: -16.67, C: -16.67 };
            const transfers = minSwish(balance);
            expect(transfers).toHaveLength(2);
            expect(transfers).toEqual(
                expect.arrayContaining([
                    { from: "B", to: "A", amount: 16.67 },
                    { from: "C", to: "A", amount: 16.67 }
                ])
            );
        });
    });
});
