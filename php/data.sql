CREATE TABLE Caravan (
    Id VARCHAR(6) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    City VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Pilgrim (
    Id VARCHAR(6) PRIMARY KEY,
    CaravanId VARCHAR(6) NOT NULL,
    FullName VARCHAR(255) NOT NULL,
    NationalCode VARCHAR(20) NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    FOREIGN KEY (CaravanId) REFERENCES Caravan(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Traffic (
    Id VARCHAR(6) PRIMARY KEY,
    PilgrimId VARCHAR(6) NOT NULL,
    DateTime DATETIME NOT NULL,
    FOREIGN KEY (PilgrimId) REFERENCES Pilgrim(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Caravan (Id, Name, City) VALUES 
('000001', 'کاروان امام رضا (ع)', 'مشهد'),
('000002', 'کاروان حضرت ابوالفضل (ع)', 'کرج'),
('000003', 'کاروان حضرت زهرا (س)', 'اصفهان');

INSERT INTO Pilgrim (Id, CaravanId, FullName, NationalCode, Gender) VALUES 
('000001', '000001', 'محمد رضایی', '1234567890', 'male'),
('000002', '000001', 'علی محمدی', '1234567891', 'male'),
('000003', '000001', 'فاطمه حسینی', '1234567892', 'female'),
('000004', '000002', 'حسین کریمی', '1234567893', 'male'),
('000005', '000002', 'زهرا اکبری', '1234567894', 'female'),
('000006', '000003', 'مهدی رحیمی', '1234567895', 'male'),
('000007', '000003', 'مریم نادری', '1234567896', 'female'),
('000008', '000003', 'رضا قاسمی', '1234567897', 'male');

INSERT INTO Traffic (Id, PilgrimId, DateTime) VALUES 
('000001', '000001', '2023-06-10 08:00:00'),
('000002', '000002', '2023-06-10 08:05:00'),
('000003', '000003', '2023-06-10 08:10:00'),
('000004', '000001', '2023-06-10 18:00:00'),
('000005', '000002', '2023-06-10 18:05:00'),
('000006', '000004', '2023-06-11 09:00:00'),
('000007', '000005', '2023-06-11 09:05:00'),
('000008', '000004', '2023-06-11 19:00:00'),
('000009', '000006', '2023-06-12 10:00:00'),
('000010', '000007', '2023-06-12 10:05:00');