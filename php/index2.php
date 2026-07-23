<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

 $host = '127.0.0.1';
 $db   = 'pilgrim_db';
 $user = 'root';
 $pass = '';
 $charset = 'utf8mb4';

 $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
 $opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
 $pdo = new PDO($dsn, $user, $pass, $opt);

 $uploadDir = __DIR__ . '/uploads/';
 $caravanDir = $uploadDir . 'caravans/';
 $pilgrimDir = $uploadDir . 'pilgrims/';

if (!is_dir($caravanDir)) mkdir($caravanDir, 0777, true);
if (!is_dir($pilgrimDir)) mkdir($pilgrimDir, 0777, true);

 $action = $_GET['action'] ?? '';
 $method = $_SERVER['REQUEST_METHOD'];

function generateId($pdo, $table) {
    $stmt = $pdo->query("SELECT Id FROM $table ORDER BY CAST(Id AS UNSIGNED) DESC LIMIT 1");
    $last = $stmt->fetchColumn();
    $next = $last ? (int)$last + 1 : 1;
    return str_pad($next, 6, '0', STR_PAD_LEFT);
}

function processImage($file, $targetPath) {
    $info = getimagesize($file['tmp_name']);
    if ($info === false) return false;
    
    $mime = $info['mime'];
    switch ($mime) {
        case 'image/jpeg': $img = imagecreatefromjpeg($file['tmp_name']); break;
        case 'image/png': $img = imagecreatefrompng($file['tmp_name']); break;
        case 'image/gif': $img = imagecreatefromgif($file['tmp_name']); break;
        default: return false;
    }
    
    if ($img === false) return false;
    
    $maxWidth = 300;
    $width = imagesx($img);
    $height = imagesy($img);
    
    if ($width > $maxWidth) {
        $scale = $maxWidth / $width;
        $newWidth = $maxWidth;
        $newHeight = (int)($height * $scale);
        $newImg = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImg, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($img);
        $img = $newImg;
    }
    
    imagesavealpha($img, true);
    imagepng($img, $targetPath, 9);
    imagedestroy($img);
    return true;
}

try {
    if ($action === 'caravan/list' && $method === 'GET') {
        $search = $_GET['search'] ?? '';
        $stmt = $pdo->prepare("
            SELECT c.*, COUNT(p.Id) as PilgrimCount 
            FROM Caravan c 
            LEFT JOIN Pilgrim p ON c.Id = p.CaravanId
            WHERE c.Name LIKE :search OR c.City LIKE :search
            GROUP BY c.Id
        ");
        $stmt->execute([':search' => "%$search%"]);
        echo json_encode($stmt->fetchAll());
    }
    
    if ($action === 'caravan/upsert' && $method === 'POST') {
        $id = $_POST['id'] ?? null;
        $name = $_POST['name'];
        $city = $_POST['city'];
        
        if ($id) {
            $stmt = $pdo->prepare("UPDATE Caravan SET Name = ?, City = ? WHERE Id = ?");
            $stmt->execute([$name, $city, $id]);
        } else {
            $id = generateId($pdo, 'Caravan');
            $stmt = $pdo->prepare("INSERT INTO Caravan (Id, Name, City) VALUES (?, ?, ?)");
            $stmt->execute([$id, $name, $city]);
        }
        
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            processImage($_FILES['image'], $caravanDir . $id . '.png');
        }
        
        echo json_encode(['status' => 'success', 'id' => $id]);
    }
    
    if ($action === 'caravan/delete' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'];
        
        $stmt = $pdo->prepare("DELETE FROM Caravan WHERE Id = ?");
        $stmt->execute([$id]);
        
        $filePath = $caravanDir . $id . '.png';
        if (file_exists($filePath)) unlink($filePath);
        
        echo json_encode(['status' => 'success']);
    }
    
    if ($action === 'pilgrim/list' && $method === 'GET') {
        $caravanId = $_GET['caravanId'] ?? '';
        $search = $_GET['search'] ?? '';
        
        $stmt = $pdo->prepare("
            SELECT p.*, c.Name as CaravanName 
            FROM Pilgrim p 
            JOIN Caravan c ON p.CaravanId = c.Id
            WHERE p.CaravanId = ? AND (p.FullName LIKE ? OR p.NationalCode LIKE ? OR p.Id LIKE ?)
        ");
        $stmt->execute([$caravanId, "%$search%", "%$search%", "%$search%"]);
        echo json_encode($stmt->fetchAll());
    }
    
    if ($action === 'pilgrim/upsert' && $method === 'POST') {
        $id = $_POST['id'] ?? null;
        $caravanId = $_POST['caravanId'];
        $fullName = $_POST['fullName'];
        $nationalCode = $_POST['nationalCode'];
        $gender = $_POST['gender'];
        
        if ($id) {
            $stmt = $pdo->prepare("UPDATE Pilgrim SET CaravanId = ?, FullName = ?, NationalCode = ?, Gender = ? WHERE Id = ?");
            $stmt->execute([$caravanId, $fullName, $nationalCode, $gender, $id]);
        } else {
            $id = generateId($pdo, 'Pilgrim');
            $stmt = $pdo->prepare("INSERT INTO Pilgrim (Id, CaravanId, FullName, NationalCode, Gender) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $caravanId, $fullName, $nationalCode, $gender]);
        }
        
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            processImage($_FILES['image'], $pilgrimDir . $id . '.png');
        }
        
        echo json_encode(['status' => 'success', 'id' => $id]);
    }
    
    if ($action === 'pilgrim/delete' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'];
        
        $stmt = $pdo->prepare("DELETE FROM Pilgrim WHERE Id = ?");
        $stmt->execute([$id]);
        
        $filePath = $pilgrimDir . $id . '.png';
        if (file_exists($filePath)) unlink($filePath);
        
        echo json_encode(['status' => 'success']);
    }
    
    if ($action === 'traffic/register' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $pilgrimId = $input['pilgrimId'];
        
        $stmt = $pdo->prepare("SELECT Id FROM Pilgrim WHERE Id = ?");
        $stmt->execute([$pilgrimId]);
        if (!$stmt->fetch()) {
            echo json_encode(['status' => 'error', 'message' => 'Pilgrim not found']);
            exit;
        }
        
        $id = generateId($pdo, 'Traffic');
        $date = (new DateTime())->format('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare("INSERT INTO Traffic (Id, PilgrimId, DateTime) VALUES (?, ?, ?)");
        $stmt->execute([$id, $pilgrimId, $date]);
        
        echo json_encode(['status' => 'success', 'id' => $id]);
    }
    
    if ($action === 'traffic/list' && $method === 'GET') {
        $pilgrimId = $_GET['pilgrimId'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM Traffic WHERE PilgrimId = ? ORDER BY DateTime ASC");
        $stmt->execute([$pilgrimId]);
        $records = $stmt->fetchAll();
        
        $count = 1;
        foreach ($records as &$rec) {
            $rec['TrafficType'] = ($count % 2 === 1) ? 'Entry' : 'Exit';
            $count++;
        }
        
        echo json_encode($records);
    }
    
    if ($action === 'report' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $caravanIds = $input['caravanIds'] ?? [];
        $isExcel = $input['isExcel'] ?? false;
        $detail = $input['detail'] ?? false;
        
        if (empty($caravanIds)) {
            echo json_encode([]);
            exit;
        }
        
        $in = str_repeat('?,', count($caravanIds) - 1) . '?';
        
        if ($detail) {
            $stmt = $pdo->prepare("
                SELECT c.Name as CaravanName, p.FullName as PilgrimName, t.DateTime, 
                       (CASE WHEN (SELECT COUNT(*) FROM Traffic t2 WHERE t2.PilgrimId = p.Id AND t2.DateTime <= t.DateTime) % 2 = 1 THEN 'Entry' ELSE 'Exit' END) as TrafficType
                FROM Traffic t
                JOIN Pilgrim p ON t.PilgrimId = p.Id
                JOIN Caravan c ON p.CaravanId = c.Id
                WHERE c.Id IN ($in)
                ORDER BY t.DateTime
            ");
            $stmt->execute($caravanIds);
            $data = $stmt->fetchAll();
            
            if ($isExcel) {
                $rows = ["<tr><th>نام کاروان</th><th>نام زائر</th><th>تاریخ تردد</th><th>نوع تردد</th></tr>"];
                foreach ($data as $row) {
                    $rows[] = "<tr><td>{$row['CaravanName']}</td><td>{$row['PilgrimName']}</td><td>{$row['DateTime']}</td><td>{$row['TrafficType']}</td></tr>";
                }
                $table = "<table border='1'>" . implode('', $rows) . "</table>";
                header('Content-Type: application/vnd.ms-excel; charset=utf-8');
                header('Content-Disposition: attachment; filename="report.xls"');
                echo "\xEF\xBB\xBF" . $table;
                exit;
            }
            echo json_encode($data);
        } else {
            $stmt = $pdo->prepare("
                SELECT c.Name as CaravanName, COUNT(DISTINCT p.Id) as PilgrimCount, COUNT(t.Id) as TotalTraffic,
                       SUM(CASE WHEN (SELECT COUNT(*) FROM Traffic t2 WHERE t2.PilgrimId = p.Id AND t2.DateTime <= t.DateTime) % 2 = 1 THEN 1 ELSE 0 END) as EntryCount,
                       SUM(CASE WHEN (SELECT COUNT(*) FROM Traffic t2 WHERE t2.PilgrimId = p.Id AND t2.DateTime <= t.DateTime) % 2 = 0 THEN 1 ELSE 0 END) as ExitCount
                FROM Caravan c
                LEFT JOIN Pilgrim p ON c.Id = p.CaravanId
                LEFT JOIN Traffic t ON p.Id = t.PilgrimId
                WHERE c.Id IN ($in)
                GROUP BY c.Id, c.Name
            ");
            $stmt->execute($caravanIds);
            $data = $stmt->fetchAll();
            
            if ($isExcel) {
                $rows = ["<tr><th>نام کاروان</th><th>تعداد زائرین</th><th>مجموع تردد</th><th>ورود</th><th>خروج</th></tr>"];
                foreach ($data as $row) {
                    $rows[] = "<tr><td>{$row['CaravanName']}</td><td>{$row['PilgrimCount']}</td><td>{$row['TotalTraffic']}</td><td>{$row['EntryCount']}</td><td>{$row['ExitCount']}</td></tr>";
                }
                $table = "<table border='1'>" . implode('', $rows) . "</table>";
                header('Content-Type: application/vnd.ms-excel; charset=utf-8');
                header('Content-Disposition: attachment; filename="report.xls"');
                echo "\xEF\xBB\xBF" . $table;
                exit;
            }
            echo json_encode($data);
        }
    }
    
    if ($action === 'pilgrim/import/template' && $method === 'GET') {
        header('Content-Type: application/vnd.ms-excel; charset=utf-8');
        header('Content-Disposition: attachment; filename="template.xls"');
        echo "\xEF\xBB\xBF" . "<table border='1'><tr><th>نام و نام خانوادگی</th><th>کد ملی</th><th>جنسیت (male/female)</th></tr></table>";
        exit;
    }
    
    if ($action === 'pilgrim/import' && $method === 'POST') {
        $caravanId = $_POST['caravanId'];
        $file = $_FILES['file'];
        $data = file_get_contents($file['tmp_name']);
        $rows = str_getcsv($data, "\n");
        
        $count = 0;
        foreach ($rows as $row) {
            if (trim($row) === '') continue;
            $cols = str_getcsv($row, ",");
            if (count($cols) >= 3) {
                $fullName = $cols[0];
                $nationalCode = $cols[1];
                $gender = $cols[2];
                
                if ($fullName === 'نام و نام خانوادگی') continue;
                
                $id = generateId($pdo, 'Pilgrim');
                $stmt = $pdo->prepare("INSERT INTO Pilgrim (Id, CaravanId, FullName, NationalCode, Gender) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$id, $caravanId, $fullName, $nationalCode, $gender]);
                $count++;
            }
        }
        echo json_encode(['status' => 'success', 'count' => $count]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}