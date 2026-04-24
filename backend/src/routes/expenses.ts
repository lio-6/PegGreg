import {Hono} from 'hono';
import {db} from '../db';
import {expense, expenseSplits, groupMembers} from '../db/schema';
import {nanoid} from 'nanoid';
import {eq} from 'drizzle-orm';

const expenseRoute = new Hono();

expenseRoute.post('/add', async (c) => {
    const {groupId, paidBy, priceCents, splitType, description, date, splits} = await c.req.json();
    if (!groupId || !paidBy || !priceCents || !splitType || !description || !date || !splits) {
        return c.json({error: 'Missing fields'}, 400);
    }

