import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const FileType = t.Union([t.Literal('Image'), t.Literal('Video')], {
  additionalProperties: false,
});
