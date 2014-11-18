create table Admin(
AdminID int identity primary key,
AdminName varchar(100),
Password varchar(32)
)

insert into Admin (AdminName,Password) values ('admin','E10ADC3949BA59ABBE56E057F20F883E')

create table Closes(
CloseID int primary key identity,
CloseName varchar(500),
Cover varchar(255),
Cover1 varchar(255),
Picture varchar(255),
Url varchar(400)
)

create table Note (
NoteID int primary key identity,
CloseID int,
NoteText varchar(1000),
AddTime DateTime default GetDate()
)
alter table Note add UserID int default 0

create table Users (
UserID int primary key identity,
Email varchar(200),
Mobile varchar(20),
Name varchar(20),
CreationTime datetime,
PrizeID int
)

create table Prize(
PrizeID int primary key identity,
PrizeName varchar(300),
Picture varchar(255),
Deleted bit,
Number varchar(200)
)

create table Address(
AddressID int primary key identity,
PrizeID int,
UserID int,
Receiver varchar(20),
Address varchar(400),
Phone varchar(30),
Zip varchar(6),
CreationTime datetime
)

create table Settings(
Name varchar(30) primary key,
Value varchar(200)
)