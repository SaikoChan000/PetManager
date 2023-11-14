-- +migrate Up

ALTER TABLE pets DROP COLUMN image;
ALTER TABLE pets ADD imageurl VARCHAR;