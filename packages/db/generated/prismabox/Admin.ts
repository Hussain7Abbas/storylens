import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const AdminPlain = t.Object(
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
);

export const AdminRelations = t.Object(
  {
    avatar: __nullable__(
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
    uploads: t.Array(
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
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const AdminPlainInputCreate = t.Object(
  {
    username: t.String(),
    password: t.String(),
    name: t.String(),
    phone: t.String(),
    birthDate: t.Optional(__nullable__(t.Date())),
    gender: t.Optional(
      __nullable__(
        t.Union([t.Literal('Male'), t.Literal('Female')], {
          additionalProperties: false,
        }),
      ),
    ),
    isRoot: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const AdminPlainInputUpdate = t.Object(
  {
    username: t.Optional(t.String()),
    password: t.Optional(t.String()),
    name: t.Optional(t.String()),
    phone: t.Optional(t.String()),
    birthDate: t.Optional(__nullable__(t.Date())),
    gender: t.Optional(
      __nullable__(
        t.Union([t.Literal('Male'), t.Literal('Female')], {
          additionalProperties: false,
        }),
      ),
    ),
    isRoot: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const AdminRelationsInputCreate = t.Object(
  {
    avatar: t.Optional(
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
    uploads: t.Optional(
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

export const AdminRelationsInputUpdate = t.Partial(
  t.Object(
    {
      avatar: t.Partial(
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
      uploads: t.Partial(
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

export const AdminWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          username: t.String(),
          password: t.String(),
          name: t.String(),
          phone: t.String(),
          birthDate: t.Date(),
          gender: t.Union([t.Literal('Male'), t.Literal('Female')], {
            additionalProperties: false,
          }),
          avatarId: t.String(),
          isRoot: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'Admin' },
  ),
);

export const AdminWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), username: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.String() }), t.Object({ username: t.String() })], {
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
              username: t.String(),
              password: t.String(),
              name: t.String(),
              phone: t.String(),
              birthDate: t.Date(),
              gender: t.Union([t.Literal('Male'), t.Literal('Female')], {
                additionalProperties: false,
              }),
              avatarId: t.String(),
              isRoot: t.Boolean(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'Admin' },
);

export const AdminSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      username: t.Boolean(),
      password: t.Boolean(),
      name: t.Boolean(),
      phone: t.Boolean(),
      birthDate: t.Boolean(),
      gender: t.Boolean(),
      avatarId: t.Boolean(),
      avatar: t.Boolean(),
      isRoot: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      uploads: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const AdminInclude = t.Partial(
  t.Object(
    {
      gender: t.Boolean(),
      avatar: t.Boolean(),
      uploads: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const AdminOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      username: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      password: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      phone: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      birthDate: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      avatarId: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      isRoot: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const Admin = t.Composite([AdminPlain, AdminRelations], {
  additionalProperties: false,
});

export const AdminInputCreate = t.Composite(
  [AdminPlainInputCreate, AdminRelationsInputCreate],
  { additionalProperties: false },
);

export const AdminInputUpdate = t.Composite(
  [AdminPlainInputUpdate, AdminRelationsInputUpdate],
  { additionalProperties: false },
);
