import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const NovelPlain = t.Object(
  {
    id: t.String(),
    name: t.String(),
    description: __nullable__(t.String()),
    imageId: __nullable__(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const NovelRelations = t.Object(
  {
    image: __nullable__(
      t.Object(
        {
          id: t.String(),
          url: t.String(),
          type: t.Union([t.Literal('Image'), t.Literal('Video')], {
            additionalProperties: false,
          }),
          provider_image_id: t.String(),
          delete_url: t.String(),
          userId: __nullable__(t.String()),
          adminId: __nullable__(t.String()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    Keywords: t.Array(
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
      { additionalProperties: false },
    ),
    chapters: t.Array(
      t.Object(
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
      { additionalProperties: false },
    ),
    replacements: t.Array(
      t.Object(
        {
          id: t.String(),
          replacement: t.String(),
          novelId: t.String(),
          keywordId: __nullable__(t.String()),
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

export const NovelPlainInputCreate = t.Object(
  { name: t.String(), description: t.Optional(__nullable__(t.String())) },
  { additionalProperties: false },
);

export const NovelPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    description: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const NovelRelationsInputCreate = t.Object(
  {
    image: t.Optional(
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
    Keywords: t.Optional(
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
    chapters: t.Optional(
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
    replacements: t.Optional(
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

export const NovelRelationsInputUpdate = t.Partial(
  t.Object(
    {
      image: t.Partial(
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
      Keywords: t.Partial(
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
      chapters: t.Partial(
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
      replacements: t.Partial(
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

export const NovelWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          name: t.String(),
          description: t.String(),
          imageId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'Novel' },
  ),
);

export const NovelWhereUnique = t.Recursive(
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
              description: t.String(),
              imageId: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'Novel' },
);

export const NovelSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      description: t.Boolean(),
      imageId: t.Boolean(),
      image: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      Keywords: t.Boolean(),
      chapters: t.Boolean(),
      replacements: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const NovelInclude = t.Partial(
  t.Object(
    {
      image: t.Boolean(),
      Keywords: t.Boolean(),
      chapters: t.Boolean(),
      replacements: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const NovelOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      description: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      imageId: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const Novel = t.Composite([NovelPlain, NovelRelations], {
  additionalProperties: false,
});

export const NovelInputCreate = t.Composite(
  [NovelPlainInputCreate, NovelRelationsInputCreate],
  { additionalProperties: false },
);

export const NovelInputUpdate = t.Composite(
  [NovelPlainInputUpdate, NovelRelationsInputUpdate],
  { additionalProperties: false },
);
