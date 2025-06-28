import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { CONTACT } from '../../../constants/Contact';
import { OVERVIEW } from '../../../constants/Overview';
import { QUESTION } from '../../../constants/Question';
import { COMPANY } from '../../../constants/Company';
import { TERM } from '../../../constants/Term';

const app = new OpenAPIHono();

const getContentRoute = createRoute({
  method: 'get',
  path: '/api/v1/content/:type',
  request: {
    params: z.object({
      type: z.enum(['contact', 'overview', 'question', 'company', 'term']),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.string(),
          }),
        },
      },
      description: 'コンテンツデータを取得します',
    },
    400: {
      description: '無効なコンテンツタイプ',
    },
  },
  tags: ['content'],
});

app.openapi(getContentRoute, (c) => {
  const { type } = c.req.valid('param');

  let content: string;

  switch (type) {
    case 'contact':
      content = CONTACT;
      break;
    case 'overview':
      content = OVERVIEW;
      break;
    case 'question':
      content = QUESTION;
      break;
    case 'company':
      content = COMPANY;
      break;
    case 'term':
      content = TERM;
      break;
    default:
      return c.json({ error: '無効なコンテンツタイプです' }, 400);
  }

  return c.json({
    content,
  });
});

export { app as contentApp };
