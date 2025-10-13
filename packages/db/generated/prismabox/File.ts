import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const FilePlain = t.Object(
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
);

export const FileRelations = t.Object(
  {
    user: __nullable__(
      t.Object(
        {
          id: t.String(),
          username: t.String(),
          password: t.String(),
          name: t.String(),
          phone: t.String(),
          birthDate: __nullable__(t.Date()),
          gender: __nullable__(
            t.Union([t.Literal('Male'), t.Literal('Female')], {
              additionalProperties: false,
            }),
          ),
          avatarId: __nullable__(t.String()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    admin: __nullable__(
      t.Object(
        {
          id: t.String(),
          username: t.String(),
          password: t.String(),
          name: t.String(),
          phone: t.String(),
          birthDate: __nullable__(t.Date()),
          gender: __nullable__(
            t.Union([t.Literal('Male'), t.Literal('Female')], {
              additionalProperties: false,
            }),
          ),
          avatarId: __nullable__(t.String()),
          isRoot: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    admins: t.Array(
      t.Object(
        {
          id: t.String(),
          username: t.String(),
          password: t.String(),
          name: t.String(),
          phone: t.String(),
          birthDate: __nullable__(t.Date()),
          gender: __nullable__(
            t.Union([t.Literal('Male'), t.Literal('Female')], {
              additionalProperties: false,
            }),
          ),
          avatarId: __nullable__(t.String()),
          isRoot: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    users: t.Array(
      t.Object(
        {
          id: t.String(),
          username: t.String(),
          password: t.String(),
          name: t.String(),
          phone: t.String(),
          birthDate: __nullable__(t.Date()),
          gender: __nullable__(
            t.Union([t.Literal('Male'), t.Literal('Female')], {
              additionalProperties: false,
            }),
          ),
          avatarId: __nullable__(t.String()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    novels: t.Array(
      t.Object(
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
      { additionalProperties: false },
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
  },
  { additionalProperties: false },
);

export const FilePlainInputCreate = t.Object(
  {
    url: t.String(),
    type: t.Union([t.Literal('Image'), t.Literal('Video')], {
      additionalProperties: false,
    }),
    delete_url: t.String(),
  },
  { additionalProperties: false },
);

export const FilePlainInputUpdate = t.Object(
  {
    url: t.Optional(t.String()),
    type: t.Optional(
      t.Union([t.Literal('Image'), t.Literal('Video')], {
        additionalProperties: false,
      }),
    ),
    delete_url: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const FileRelationsInputCreate = t.Object(
  {
    user: t.Optional(
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
    admin: t.Optional(
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
    admins: t.Optional(
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
    users: t.Optional(
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
    novels: t.Optional(
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
  },
  { additionalProperties: false },
);

export const FileRelationsInputUpdate = t.Partial(
  t.Object(
    {
      user: t.Partial(
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
      admin: t.Partial(
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
      admins: t.Partial(
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
      users: t.Partial(
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
      novels: t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const FileWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          url: t.String(),
          type: t.Union([t.Literal('Image'), t.Literal('Video')], {
            additionalProperties: false,
          }),
          provider_image_id: t.String(),
          delete_url: t.String(),
          userId: t.String(),
          adminId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'File' },
  ),
);

export const FileWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), url: t.String(), provider_image_id: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({ url: t.String() }),
            t.Object({ provider_image_id: t.String() }),
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
              url: t.String(),
              type: t.Union([t.Literal('Image'), t.Literal('Video')], {
                additionalProperties: false,
              }),
              provider_image_id: t.String(),
              delete_url: t.String(),
              userId: t.String(),
              adminId: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'File' },
);

export const FileSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      url: t.Boolean(),
      type: t.Boolean(),
      provider_image_id: t.Boolean(),
      delete_url: t.Boolean(),
      userId: t.Boolean(),
      user: t.Boolean(),
      admin: t.Boolean(),
      adminId: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      admins: t.Boolean(),
      users: t.Boolean(),
      novels: t.Boolean(),
      Keywords: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const FileInclude = t.Partial(
  t.Object(
    {
      type: t.Boolean(),
      user: t.Boolean(),
      admin: t.Boolean(),
      admins: t.Boolean(),
      users: t.Boolean(),
      novels: t.Boolean(),
      Keywords: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const FileOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      url: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      provider_image_id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      delete_url: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      adminId: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const File = t.Composite([FilePlain, FileRelations], {
  additionalProperties: false,
});

export const FileInputCreate = t.Composite(
  [FilePlainInputCreate, FileRelationsInputCreate],
  { additionalProperties: false },
);

export const FileInputUpdate = t.Composite(
  [FilePlainInputUpdate, FileRelationsInputUpdate],
  { additionalProperties: false },
);
