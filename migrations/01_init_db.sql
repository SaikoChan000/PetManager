-- +migrate Up

create table pets (
	id SERIAL primary key,
	name VARCHAR not null,
	raceId INT not null,
	age INT not null,
	textDescription VARCHAR,
	image BYTEA
);

create table races (
	id SERIAL primary key,
	name VARCHAR not null unique
);