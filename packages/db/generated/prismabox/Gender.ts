import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const Gender = t.Union([t.Literal('Male'), t.Literal('Female')], {
  additionalProperties: false,
});
