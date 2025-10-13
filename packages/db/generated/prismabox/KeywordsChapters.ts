import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const KeywordsChaptersPlain = t.Object(
  {
    id: t.String(),
    keywordId: t.String(),
    chapterId: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const KeywordsChaptersRelations = t.Object(
  {
    keyword: t.Object(
      {
        id: t.String(),
        name: t.String(),
        description: t.String(),
        categoryId: t.String(),
        natureId: t.String(),
        imageId: __nullable__(t.String()),
        parentId: __nullable__(t.String()),
        novelId: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
    chapter: t.Object(
      {
        id: t.String(),
        name: t.String(),
        number: t.Integer(),
        description: __nullable__(t.String()),
        novelId: t.String(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const KeywordsChaptersPlainInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const KeywordsChaptersPlainInputUpdate = t.Object(
  {},
  { additionalProperties: false },
);

export const KeywordsChaptersRelationsInputCreate = t.Object(
  {
    keyword: t.Object(
      {
        connect: t.Object(
          {
            id: t.String({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
    chapter: t.Object(
      {
        connect: t.Object(
          {
            id: t.String({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const KeywordsChaptersRelationsInputUpdate = t.Partial(
  t.Object(
    {
      keyword: t.Object(
        {
          connect: t.Object(
            {
              id: t.String({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
      chapter: t.Object(
        {
          connect: t.Object(
            {
              id: t.String({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const KeywordsChaptersWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          keywordId: t.String(),
          chapterId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'KeywordsChapters' },
  ),
);

export const KeywordsChaptersWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(t.Object({ id: t.String() }, { additionalProperties: false }), {
          additionalProperties: false,
        }),
        t.Union([t.Object({ id: t.String() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
            NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.String(),
              keywordId: t.String(),
              chapterId: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'KeywordsChapters' },
);

export const KeywordsChaptersSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      keywordId: t.Boolean(),
      keyword: t.Boolean(),
      chapterId: t.Boolean(),
      chapter: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const KeywordsChaptersInclude = t.Partial(
  t.Object(
    { keyword: t.Boolean(), chapter: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const KeywordsChaptersOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      keywordId: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      chapterId: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const KeywordsChapters = t.Composite(
  [KeywordsChaptersPlain, KeywordsChaptersRelations],
  { additionalProperties: false },
);

export const KeywordsChaptersInputCreate = t.Composite(
  [KeywordsChaptersPlainInputCreate, KeywordsChaptersRelationsInputCreate],
  { additionalProperties: false },
);

export const KeywordsChaptersInputUpdate = t.Composite(
  [KeywordsChaptersPlainInputUpdate, KeywordsChaptersRelationsInputUpdate],
  { additionalProperties: false },
);
