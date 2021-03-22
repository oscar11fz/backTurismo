drop Table Userr;
drop Table News;
drop Table Events;
drop TABLE AdminApp;



Create Table AdminApp(
	idAdmin int primary key not null,
    email varchar(100) not null,
    password_hash text not null,
    password_salt text not null
);

Create Table Userr(
	idUser serial primary key not null,
    nombre varchar(100) not null,
    email varchar(100) not null,
    coment text not null,
    fecha Date,
    idAdmin int,
    foreign key (idAdmin) references AdminApp(idAdmin)    
);

Create Table News(
	idNews serial primary key not null,
    fecha Date,
    title text not null,
    picture text,
    body text,   
    StateEvent boolean, 
    idAdmin int,
    foreign key (idAdmin) references AdminApp(idAdmin)
);

Create Table Events(
    idEvent serial primary key not null,
    title text,
    descriptionEvent text,
    datePublication Date,
    dateInit date,    
    StateEvent boolean,
    picture text,
    idAdmin int,
    foreign key (idAdmin) references AdminApp(idAdmin) 

);
    

    