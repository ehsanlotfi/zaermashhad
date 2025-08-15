CREATE TABLE [dbo].[Traffic](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Barcode] [int] NOT NULL,
	[Date] [datetime] NULL,
 CONSTRAINT [PK_Traffic] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 12/06/1403 08:52:45 ق.ظ ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Username] [nvarchar](50) NULL,
	[Password] [nvarchar](200) NULL,
	[Fullname] [nvarchar](50) NULL,
	[IsActive] [tinyint] NULL,
 CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Zaer]    Script Date: 12/06/1403 08:52:45 ق.ظ ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Zaer](
	[Id] [int] IDENTITY(1000,1) NOT NULL,
	[Fullname] [nvarchar](50) NULL,
	[NationalCode] [char](10) NULL,
	[Sex] [tinyint] NULL,
	[Team] [nvarchar](50) NULL,
	[TeamAdmin] [nvarchar](50) NULL,
	[CaravanId] [int] NULL,
	[Image] [nvarchar](max) NULL,
 CONSTRAINT [PK_zaer] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
INSERT INTO [dbo].[Users] 
    ([Username], [Password], [Fullname], [IsActive])
VALUES 
    ('admin', '$2a$11$pCF4869ehPyko7Az8s/l6eumvN3LfcLni50Nwc7IGzwUTA3y6nlLu', 'admin', 1)
GO
-- Aa123456