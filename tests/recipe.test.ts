import request from 'supertest';
import { Server } from 'http';
import app from '../src/app';
import { clearStorage } from '../src/storage/recipe';
let server: Server;
beforeAll(() => {     // ← додати
  server = app.listen(0);
});

afterAll((done) => {  // ← додати
  server.close(done);
});

beforeEach(() => {
  clearStorage();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const validRecipe = {
  title: 'Борщ',
  description: 'Класичний український борщ',
  cookingTimeMinutes: 90,
  difficulty: 'medium',
  cuisine: 'ukrainian',
  servings: 6,
};

async function createTestRecipe(overrides = {}) {
  const res = await request(app)
    .post('/api/recipes')
    .send({ ...validRecipe, ...overrides });
  return res.body;
}

// ─── POST /api/recipes ───────────────────────────────────────────────────────

describe('POST /api/recipes', () => {
  it('створює рецепт і повертає 201', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send(validRecipe)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Борщ');
    expect(res.body.difficulty).toBe('medium');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('повертає 400 якщо title відсутній', async () => {
    const { title, ...noTitle } = validRecipe;
    const res = await request(app)
      .post('/api/recipes')
      .send(noTitle)
      .expect(400);

    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('повертає 400 якщо title порожній рядок', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ...validRecipe, title: '' })
      .expect(400);

    expect(res.body.details[0].field).toBe('title');
  });

  it('повертає 400 якщо difficulty невалідний', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ...validRecipe, difficulty: 'impossible' })
      .expect(400);

    expect(res.body).toHaveProperty('details');
  });

  it('повертає 400 якщо cookingTimeMinutes менше 1', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ ...validRecipe, cookingTimeMinutes: 0 })
      .expect(400);

    expect(res.body).toHaveProperty('details');
  });

  it('створює рецепт без опціональних полів', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({
        title: 'Яєчня',
        cookingTimeMinutes: 5,
        difficulty: 'easy',
      })
      .expect(201);

    expect(res.body.title).toBe('Яєчня');
    expect(res.body.cuisine).toBeUndefined();
  });
});

// ─── GET /api/recipes ────────────────────────────────────────────────────────

describe('GET /api/recipes', () => {
  it('повертає порожній масив якщо немає рецептів', async () => {
    const res = await request(app).get('/api/recipes').expect(200);
    expect(res.body).toEqual([]);
  });

  it('повертає всі рецепти', async () => {
    await createTestRecipe({ title: 'Борщ' });
    await createTestRecipe({ title: 'Вареники' });

    const res = await request(app).get('/api/recipes').expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('фільтрує за difficulty', async () => {
    await createTestRecipe({ title: 'Легка страва', difficulty: 'easy' });
    await createTestRecipe({ title: 'Складна страва', difficulty: 'hard' });

    const res = await request(app)
      .get('/api/recipes?difficulty=easy')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Легка страва');
  });

  it('фільтрує за cuisine', async () => {
    await createTestRecipe({ cuisine: 'italian' });
    await createTestRecipe({ cuisine: 'ukrainian' });

    const res = await request(app)
      .get('/api/recipes?cuisine=italian')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].cuisine).toBe('italian');
  });

  it('фільтрує за maxCookingTime', async () => {
    await createTestRecipe({ title: 'Швидко', cookingTimeMinutes: 10 });
    await createTestRecipe({ title: 'Довго', cookingTimeMinutes: 120 });

    const res = await request(app)
      .get('/api/recipes?maxCookingTime=30')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Швидко');
  });

  it('фільтрує за пошуковим запитом search', async () => {
    await createTestRecipe({ title: 'Mushroom soup' });
    await createTestRecipe({ title: 'Borscht' });

    const res = await request(app)
        .get('/api/recipes?search=mushroom')
        .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Mushroom soup');
  });

  it('комбінує кілька фільтрів', async () => {
    await createTestRecipe({ difficulty: 'easy', cookingTimeMinutes: 10, cuisine: 'italian' });
    await createTestRecipe({ difficulty: 'easy', cookingTimeMinutes: 60, cuisine: 'italian' });
    await createTestRecipe({ difficulty: 'hard', cookingTimeMinutes: 10, cuisine: 'italian' });

    const res = await request(app)
      .get('/api/recipes?difficulty=easy&maxCookingTime=30')
      .expect(200);

    expect(res.body).toHaveLength(1);
  });
});

// ─── GET /api/recipes/:id ────────────────────────────────────────────────────

describe('GET /api/recipes/:id', () => {
  it('повертає рецепт за id', async () => {
    const created = await createTestRecipe();

    const res = await request(app)
      .get(`/api/recipes/${created.id}`)
      .expect(200);

    expect(res.body.id).toBe(created.id);
    expect(res.body.title).toBe(created.title);
  });

  it('повертає 404 якщо рецепт не існує', async () => {
    const res = await request(app)
      .get('/api/recipes/nonexistent-id')
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });
});

// ─── PATCH /api/recipes/:id ──────────────────────────────────────────────────

describe('PATCH /api/recipes/:id', () => {
  it('оновлює рецепт і повертає оновлені дані', async () => {
    const created = await createTestRecipe();

    const res = await request(app)
      .patch(`/api/recipes/${created.id}`)
      .send({ title: 'Оновлений борщ', difficulty: 'hard' })
      .expect(200);

    expect(res.body.title).toBe('Оновлений борщ');
    expect(res.body.difficulty).toBe('hard');
    expect(res.body.updatedAt).not.toBe(created.updatedAt);
  });

  it('повертає 404 при оновленні неіснуючого рецепту', async () => {
    const res = await request(app)
      .patch('/api/recipes/nonexistent-id')
      .send({ title: 'Тест' })
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });

  it('повертає 400 якщо дані невалідні', async () => {
    const created = await createTestRecipe();

    const res = await request(app)
      .patch(`/api/recipes/${created.id}`)
      .send({ cookingTimeMinutes: -5 })
      .expect(400);

    expect(res.body).toHaveProperty('details');
  });
});

// ─── DELETE /api/recipes/:id ─────────────────────────────────────────────────

describe('DELETE /api/recipes/:id', () => {
  it('видаляє рецепт і повертає 204', async () => {
    const created = await createTestRecipe();

    await request(app)
      .delete(`/api/recipes/${created.id}`)
      .expect(204);

    await request(app)
      .get(`/api/recipes/${created.id}`)
      .expect(404);
  });

  it('повертає 404 при видаленні неіснуючого рецепту', async () => {
    const res = await request(app)
      .delete('/api/recipes/nonexistent-id')
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });
});

// ─── GET /api/recipes/quick ──────────────────────────────────────────────────

describe('GET /api/recipes/quick', () => {
  it('повертає лише рецепти до 30 хвилин', async () => {
    await createTestRecipe({ title: 'Яєчня', cookingTimeMinutes: 5 });
    await createTestRecipe({ title: 'Паста', cookingTimeMinutes: 20 });
    await createTestRecipe({ title: 'Борщ', cookingTimeMinutes: 90 });

    const res = await request(app).get('/api/recipes/quick').expect(200);

    expect(res.body).toHaveLength(2);
    res.body.forEach((r: { cookingTimeMinutes: number }) => {
      expect(r.cookingTimeMinutes).toBeLessThanOrEqual(30);
    });
  });

  it('повертає порожній масив якщо немає швидких рецептів', async () => {
    await createTestRecipe({ cookingTimeMinutes: 120 });

    const res = await request(app).get('/api/recipes/quick').expect(200);
    expect(res.body).toEqual([]);
  });
});
