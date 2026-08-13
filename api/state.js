import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default {
  async fetch(request) {
    try {
      if (request.method === 'GET') {
        const rows = await sql`
          SELECT state, updated_at
          FROM app_state
          WHERE id = 1
        `;

        return Response.json({
          ok: true,
          state: rows[0]?.state || {},
          updated_at: rows[0]?.updated_at || null
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();

        if (!body || typeof body.state !== 'object') {
          return Response.json(
            { ok: false, error: 'Invalid state' },
            { status: 400 }
          );
        }

        await sql`
          INSERT INTO app_state (id, state, updated_at)
          VALUES (1, ${JSON.stringify(body.state)}::jsonb, NOW())
          ON CONFLICT (id)
          DO UPDATE SET
            state = EXCLUDED.state,
            updated_at = NOW()
        `;

        return Response.json({ ok: true });
      }

      return Response.json(
        { ok: false, error: 'Method not allowed' },
        { status: 405 }
      );
    } catch (error) {
      console.error(error);

      return Response.json(
        { ok: false, error: 'Database error' },
        { status: 500 }
      );
    }
  }
};
