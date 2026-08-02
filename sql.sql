
/* =========================
   Users
========================= */

CREATE TABLE [dbo].[Users]
(
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Username] NVARCHAR(50) NOT NULL,
    [Password] NVARCHAR(200) NOT NULL,
    [Fullname] NVARCHAR(50) NULL,
    [IsActive] TINYINT NOT NULL DEFAULT 1,

    CONSTRAINT [PK_Users]
        PRIMARY KEY CLUSTERED ([Id])
);
GO


CREATE UNIQUE INDEX IX_Users_Username
ON Users(Username);
GO



/* =========================
   Caravan
========================= */

CREATE TABLE [dbo].[Caravan]
(
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Admin] NVARCHAR(100) NULL,
    [City] NVARCHAR(100) NULL,

    CONSTRAINT [PK_Caravan]
        PRIMARY KEY CLUSTERED ([Id])
);
GO



/* =========================
   Zaer
========================= */

CREATE TABLE [dbo].[Zaer]
(
    [Id] INT IDENTITY(1000,1) NOT NULL,

    [Fullname] NVARCHAR(50) NULL,

    -- کد ملی با صفر اول
    [NationalCode] VARCHAR(10) NULL,

    [Sex] TINYINT NOT NULL DEFAULT 1,

    [CaravanId] INT NULL,


    CONSTRAINT [PK_Zaer]
        PRIMARY KEY CLUSTERED ([Id])
);
GO


CREATE UNIQUE INDEX IX_Zaer_NationalCode
ON Zaer(NationalCode)
WHERE NationalCode IS NOT NULL;
GO


ALTER TABLE Zaer
ADD CONSTRAINT FK_Zaer_Caravan
FOREIGN KEY(CaravanId)
REFERENCES Caravan(Id);
GO



/* =========================
   Traffic
========================= */

CREATE TABLE [dbo].[Traffic]
(
    [Id] INT IDENTITY(1,1) NOT NULL,

    [Barcode] INT NOT NULL,

    [Date] DATETIME NOT NULL
        DEFAULT GETDATE(),


    CONSTRAINT [PK_Traffic]
        PRIMARY KEY CLUSTERED ([Id])
);
GO



ALTER TABLE Traffic
ADD CONSTRAINT FK_Traffic_Zaer
FOREIGN KEY(Barcode)
REFERENCES Zaer(Id)
ON DELETE CASCADE;
GO



CREATE NONCLUSTERED INDEX IX_Traffic_Barcode_Date
ON Traffic(Barcode, Date DESC);
GO



/* =========================
   Default Admin User
========================= */

INSERT INTO Users
(
    Username,
    Password,
    Fullname,
    IsActive
)
VALUES
(
    'admin',
    '$2a$11$pCF4869ehPyko7Az8s/l6eumvN3LfcLni50Nwc7IGzwUTA3y6nlLu',
    'admin',
    1
);
GO