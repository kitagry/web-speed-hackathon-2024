import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { TERM } from '../../../constants/Term';

const app = new OpenAPIHono();

const getTermRoute = createRoute({
  method: 'get',
  path: '/api/v1/term',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            term: z.string(),
          }),
        },
      },
      description: '利用規約を取得します',
    },
  },
  tags: ['term'],
});

app.openapi(getTermRoute, (c) => {
  return c.json({
    term: TERM,
  });
});

export { app as termApp };
