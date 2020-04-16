create table account(
    email varchar(80) primary key,
	pass varchar(30) not null,
    forename varchar(30) not null,
    surnames varchar(60) not null,
    birthdate date not null,

    isShelter boolean not null
);

create table shelter(
    userEmail varchar(80) not null, 
    shelterName varchar(30) not null,
    shelterAddress varchar(80) not null,
    webpage varchar(80) not null,
    shelterDescription varchar(360) not null,

    foreign key (userEmail) references account(email).
    primary key (userEmail, shelterName)
);
