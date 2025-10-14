import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const ReplacementPlain = t.Object(
  {
    id: t.String(),
    from: t.String(),
    to: t.String(),
    novelId: t.String(),
    keywordId: __nullable__(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const ReplacementRelations = t.Object(
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
    keyword: __nullable__(
      t.Object(
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
    ),
  },
  { additionalProperties: false },
);

export const ReplacementPlainInputCreate = t.Object(
  { from: t.String(), to: t.String() },
  { additionalProperties: false },
);

export const ReplacementPlainInputUpdate = t.Object(
  { from: t.Optional(t.String()), to: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const ReplacementRelationsInputCreate = t.Object(
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
    keyword: t.Optional(
      t.Object(
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
    ),
  },
  { additionalProperties: false },
);

export const ReplacementRelationsInputUpdate = t.Partial(
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
      keyword: t.Partial(
        t.Object(
          {
            connect: t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            disconnect: t.Boolean(),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const ReplacementWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          from: t.String(),
          to: t.String(),
          novelId: t.String(),
          keywordId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'Replacement' },
  ),
);

export const ReplacementWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              from_novelId: t.Object(
                { from: t.String(), novelId: t.String() },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({
              from_novelId: t.Object(
                { from: t.String(), novelId: t.String() },
                { additionalProperties: false },
              ),
            }),
          ],
          { additionalProperties: false },
        ),
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
              from: t.String(),
              to: t.String(),
              novelId: t.String(),
              keywordId: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'Replacement' },
);

export const ReplacementSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      from: t.Boolean(),
      to: t.Boolean(),
      novelId: t.Boolean(),
      novel: t.Boolean(),
      keywordId: t.Boolean(),
      keyword: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ReplacementInclude = t.Partial(
  t.Object(
    { novel: t.Boolean(), keyword: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ReplacementOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      from: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      to: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      novelId: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      keywordId: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const Replacement = t.Composite([ReplacementPlain, ReplacementRelations], {
  additionalProperties: false,
});

export const ReplacementInputCreate = t.Composite(
  [ReplacementPlainInputCreate, ReplacementRelationsInputCreate],
  { additionalProperties: false },
);

export const ReplacementInputUpdate = t.Composite(
  [ReplacementPlainInputUpdate, ReplacementRelationsInputUpdate],
  { additionalProperties: false },
);
