import { calcBalance, minSwish } from "./levelpegging";
import { Expense } from "./types";

describe("Levelpegging Logic", () => {
    describe("calcBalance", () => {
        const groupId = "group-1";

        it("should calculate simple equal splits correctly", () => {
            const expenses: Expense[] = [
                {
                    id: "e1",
                    groupId,
                    paidBy: "alice",
                    price: 300,
                    splitType: "equal",
                    splits: { alice: 0, bob: 0, charlie: 0 },
                    description: "Dinner",
                    date: new Date(),
                },
            ];

            const balance = calcBalance(expenses, groupId);

            // Alice paid 300, owes 100 -> Net +200
            // Bob paid 0, owes 100 -> Net -100
            // Charlie paid 0, owes 100 -> Net -100
            expect(balance).toEqual({
                alice: 200,
                bob: -100,
                charlie: -100,
            });
        });

        it("should handle rounding remainders in equal splits", () => {
            const expenses: Expense[] = [
                {
                    id: "e2",
                    groupId,
                    paidBy: "alice",
                    price: 10, // 10 / 3 = 3.3333...
                    splitType: "equal",
                    splits: { alice: 0, bob: 0, charlie: 0 },
                    description: "Rounding test",
                    date: new Date(),
                },
            ];

            const balance = calcBalance(expenses, groupId);

            // Total sum of balances should always be 0
            const sum = Object.values(balance).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(0);

            // In your code, the last person (charlie) absorbs the remainder
            // 10.00 - (3.33 * 3) = 0.01 extra
            // Alice: 10 - 3.33 = 6.67
            // Bob: 0 - 3.33 = -3.33
            // Charlie: 0 - (3.33 + 0.01) = -3.34
            expect(balance.charlie).toBe(-3.34);
        });

        it("should process exact splits correctly", () => {
            const expenses: Expense[] = [
                {
                    id: "e3",
                    groupId,
                    paidBy: "bob",
                    price: 100,
                    splitType: "exact",
                    splits: { alice: 70, bob: 30 },
                    description: "Specific split",
                    date: new Date(),
                },
            ];

            const balance = calcBalance(expenses, groupId);
            expect(balance.alice).toBe(-70);
            expect(balance.bob).toBe(70); // Paid 100, owed 30
        });

        it("should throw an error if exact splits do not match total price", () => {
            const brokenExpenses: Expense[] = [
                {
                    id: "e4",
                    groupId,
                    paidBy: "alice",
                    price: 100,
                    splitType: "exact",
                    splits: { alice: 50 }, // Only 50 accounted for
                    description: "Error test",
                    date: new Date(),
                },
            ];

            expect(() => calcBalance(brokenExpenses, groupId)).toThrow();
        });
    });

    describe("minSwish (Settlement Algorithm)", () => {
        it("should return an empty array if everyone is settled", () => {
            const balance = { alice: 0, bob: 0 };
            expect(minSwish(balance)).toEqual([]);
        });

        it("should generate the minimum number of transfers", () => {
            // Alice is owed 100
            // Bob owes 40, Charlie owes 60
            const balance = {
                alice: 100,
                bob: -40,
                charlie: -60,
            };

            const transfers = minSwish(balance);

            expect(transfers).toHaveLength(2);
            expect(transfers).toContainEqual({
                from: "charlie",
                to: "alice",
                amount: 60,
            });
            expect(transfers).toContainEqual({
                from: "bob",
                to: "alice",
                amount: 40,
            });
        });

        it("should handle complex net-zero settlements", () => {
            const balance = {
                alice: 50,
                bob: 50,
                charlie: -100,
            };

            const transfers = minSwish(balance);

            // Charlie should pay both Alice and Bob
            expect(transfers).toContainEqual({
                from: "charlie",
                to: "alice",
                amount: 50,
            });
            expect(transfers).toContainEqual({
                from: "charlie",
                to: "bob",
                amount: 50,
            });
        });
    });
});
