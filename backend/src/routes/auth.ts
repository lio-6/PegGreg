import { Hono } from 'hono';
import { sign, verify } from 'jsonwebtoken';
import bcrypt, { compare } from 'bcryptjs';
import { db } from '../db';
import { user } from '../db/schema'; 
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid'; 

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET

auth.post('/register', async (c) => {
    const { username, password, displayName } = await c.req.json();
    if (!username || !password || !displayName) {
        return c.json({ error: 'Missing fields' }, 400);
    }

    const [existing] = await db.select().from(user).where(eq(user.username, username));

    if (existing) return c.json({ error: 'Username already exists' }, 409); 
    
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
        id: nanoid(),
        username: username,
        displayName: displayName,
        passwordHash: hashedPassword,
    };

    await db.insert(user).values(newUser);

    const token = sign({ userId: newUser.id }, JWT_SECRET!, { expiresIn: '7d' }); 

    return c.json({ token, userId: newUser.id, username, displayName });
});

auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return c.json({ error: 'Missing fields' }, 400);
    }
    const [foundUser] = await db.select().from(user).where(eq(user.username, username));

    if (!foundUser) return c.json({ error: 'invalid username or password' }, 401);

    const valid = await compare(password, user.passwordHash);

    if (!valid) return c.json({ error: 'invalid username or password' }, 401);

    const token = sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
  // Return displayName so the frontend can greet the user immediately
    return c.json({ token, userId: user.id, username: user.username, displayName: user.displayName });
});

