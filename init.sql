-- Extension pour UUID (si non encore activée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table user
CREATE TABLE IF NOT EXISTS "user"
(
    id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS category
(
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

-- Table book
CREATE TABLE IF NOT EXISTS book
(
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        TEXT           NOT NULL,
    author       TEXT           NOT NULL,
    price        NUMERIC(10, 2) NOT NULL,
    publish_date DATE           NOT NULL,
    isbn         TEXT           NOT NULL UNIQUE,
    quantity     INTEGER        NOT NULL,
    category_id  UUID REFERENCES category (id)
);

CREATE TABLE IF NOT EXISTS book_review
(
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id   UUID    NOT NULL REFERENCES book (id) ON DELETE CASCADE,
    user_name TEXT    NOT NULL,
    message   TEXT    NOT NULL,
    rating    INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5)
);