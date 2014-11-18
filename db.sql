create table Admin(
AdminID int identity primary key,
AdminName varchar(100),
Password varchar(32)
)

insert into Admin (AdminName,Password) values ('admin','E10ADC3949BA59ABBE56E057F20F883E')

alter table BCUSTOMER add CTM_PRZ_ID int


create table Prize(
PrizeID int primary key identity,
PrizeName varchar(300),
Picture varchar(255),
Deleted bit,
Number varchar(200)
)

create table Settings(
Name varchar(30) primary key,
Value varchar(200)
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