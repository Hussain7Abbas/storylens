import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const ChapterPlain = t.Object(
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
);

export const ChapterRelations = t.Object(
  {
    novel: t.Object(
      {
        id: t.String(),
        name: t.String(),
        description: __nullable__(t.String()),
        imageId: __nullable__(t.String()),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
    KeywordsChapters: t.Array(
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
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ChapterPlainInputCreate = t.Object(
  {
    name: t.String(),
    number: t.Integer(),
    description: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const ChapterPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    number: t.Optional(t.Integer()),
    description: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const ChapterRelationsInputCreate = t.Object(
  {
    novel: t.Object(
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
    KeywordsChapters: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const ChapterRelationsInputUpdate = t.Partial(
  t.Object(
    {
      novel: t.Object(
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
      KeywordsChapters: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const ChapterWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          name: t.String(),
          number: t.Integer(),
          description: t.String(),
          novelId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'Chapter' },
  ),
);

export const ChapterWhereUnique = t.Recursive(
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
              name: t.String(),
              number: t.Integer(),
              description: t.String(),
              novelId: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'Chapter' },
);

export const ChapterSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      number: t.Boolean(),
      description: t.Boolean(),
      novelId: t.Boolean(),
      novel: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      KeywordsChapters: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ChapterInclude = t.Partial(
  t.Object(
    { novel: t.Boolean(), KeywordsChapters: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ChapterOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      number: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      description: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      novelId: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const Chapter = t.Composite([ChapterPlain, ChapterRelations], {
  additionalProperties: false,
});

export const ChapterInputCreate = t.Composite(
  [ChapterPlainInputCreate, ChapterRelationsInputCreate],
  { additionalProperties: false },
);

export const ChapterInputUpdate = t.Composite(
  [ChapterPlainInputUpdate, ChapterRelationsInputUpdate],
  { additionalProperties: false },
);
