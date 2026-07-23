<?php
ini_set('display_errors', 0);
error_reporting(0);
define('DB_HOST', 'localhost');
define('DB_NAME', 'pilgrim_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    }
    return $pdo;
}
function jsonResponse($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function errorResponse(string $msg, int $code = 400): void {
    jsonResponse(['success' => false, 'error' => $msg], $code);
}
function successResponse($data = null): void {
    jsonResponse(['success' => true, 'data' => $data]);
}
function generateId(string $table): string {
    $db = getDB();
    $stmt = $db->query("SELECT MAX(CAST(Id AS UNSIGNED)) as maxId FROM `$table`");
    $row = $stmt->fetch();
    $next = ($row['maxId'] === null) ? 1 : ((int)$row['maxId'] + 1);
    return str_pad((string)$next, 6, '0', STR_PAD_LEFT);
}
function convertAndSaveImage(array $file, string $savePath): bool {
    $tmpPath = $file['tmp_name'];
    $imgInfo = @getimagesize($tmpPath);
    if (!$imgInfo) return false;
    switch ($imgInfo['mime']) {
        case 'image/jpeg': $src = @imagecreatefromjpeg($tmpPath); break;
        case 'image/png': $src = @imagecreatefrompng($tmpPath); break;
        case 'image/gif': $src = @imagecreatefromgif($tmpPath); break;
        case 'image/webp': $src = @imagecreatefromwebp($tmpPath); break;
        default: return false;
    }
    if (!$src) return false;
    $w = imagesx($src); $h = imagesy($src); $maxDim = 400;
    if ($w > $maxDim || $h > $maxDim) {
        $ratio = min($maxDim / $w, $maxDim / $h);
        $nw = (int)($w * $ratio); $nh = (int)($h * $ratio);
        $dst = imagecreatetruecolor($nw, $nh);
        imagealphablending($dst, false); imagesavealpha($dst, true);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src); $src = $dst;
    }
    $dir = dirname($savePath);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $result = imagepng($src, $savePath, 6);
    imagedestroy($src);
    return $result;
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path);
$path = rtrim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];
$body = [];
if ($method === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($ct, 'application/json')) {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $body = $_POST;
    }
}
function gp(string $key, $default = null) {
    global $body;
    return $body[$key] ?? $_GET[$key] ?? $default;
}
function route(string $m, string $p): bool {
    global $method, $path;
    return $method === $m && $path === $p;
}
try {
    if (route('GET', '/caravan/list')) {
        $db = getDB();
        $rows = $db->query("SELECT c.Id, c.Name, c.City, COUNT(p.Id) as PilgrimCount FROM Caravan c LEFT JOIN Pilgrim p ON p.CaravanId = c.Id GROUP BY c.Id ORDER BY CAST(c.Id AS UNSIGNED)")->fetchAll();
        successResponse($rows);
    } elseif (route('POST', '/caravan/upsert')) {
        $db = getDB();
        $id = gp('id'); $name = trim(gp('name', '')); $city = trim(gp('city', ''));
        if (!$name || !$city) errorResponse('Name and city are required');
        if ($id) {
            $db->prepare("UPDATE Caravan SET Name=?, City=? WHERE Id=?")->execute([$name, $city, $id]);
        } else {
            $id = generateId('Caravan');
            $db->prepare("INSERT INTO Caravan (Id, Name, City) VALUES (?,?,?)")->execute([$id, $name, $city]);
        }
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            convertAndSaveImage($_FILES['image'], UPLOAD_DIR . 'caravans/' . $id . '.png');
        }
        successResponse(['id' => $id]);
    } elseif (route('DELETE', '/caravan/delete')) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) errorResponse('ID required');
        $db = getDB();
        $db->prepare("DELETE FROM Caravan WHERE Id=?")->execute([$id]);
        $img = UPLOAD_DIR . 'caravans/' . $id . '.png';
        if (file_exists($img)) unlink($img);
        successResponse();
    } elseif (route('GET', '/pilgrim/list')) {
        $caravanId = $_GET['caravanId'] ?? null;
        if (!$caravanId) errorResponse('caravanId required');
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM Pilgrim WHERE CaravanId=? ORDER BY CAST(Id AS UNSIGNED)");
        $stmt->execute([$caravanId]);
        successResponse($stmt->fetchAll());
    } elseif (route('POST', '/pilgrim/upsert')) {
        $db = getDB();
        $id = gp('id'); $caravanId = gp('caravanId'); $fullName = trim(gp('fullName', '')); $nationalCode = trim(gp('nationalCode', '')); $gender = gp('gender');
        if (!$caravanId || !$fullName || !$nationalCode || !$gender) errorResponse('All fields required');
        if ($id) {
            $db->prepare("UPDATE Pilgrim SET CaravanId=?, FullName=?, NationalCode=?, Gender=? WHERE Id=?")->execute([$caravanId, $fullName, $nationalCode, $gender, $id]);
        } else {
            $id = generateId('Pilgrim');
            $db->prepare("INSERT INTO Pilgrim (Id, CaravanId, FullName, NationalCode, Gender) VALUES (?,?,?,?,?)")->execute([$id, $caravanId, $fullName, $nationalCode, $gender]);
        }
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            convertAndSaveImage($_FILES['image'], UPLOAD_DIR . 'pilgrims/' . $id . '.png');
        }
        successResponse(['id' => $id]);
    } elseif (route('DELETE', '/pilgrim/delete')) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) errorResponse('ID required');
        $db = getDB();
        $db->prepare("DELETE FROM Pilgrim WHERE Id=?")->execute([$id]);
        $img = UPLOAD_DIR . 'pilgrims/' . $id . '.png';
        if (file_exists($img)) unlink($img);
        successResponse();
    } elseif (route('GET', '/traffic/list')) {
        $pilgrimId = $_GET['pilgrimId'] ?? null;
        if (!$pilgrimId) errorResponse('pilgrimId required');
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM Traffic WHERE PilgrimId=? ORDER BY DateTime");
        $stmt->execute([$pilgrimId]);
        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $i => $row) { $row['type'] = (($i + 1) % 2 === 1) ? 'entry' : 'exit'; $result[] = $row; }
        successResponse($result);
    } elseif (route('POST', '/traffic/register')) {
        $pilgrimId = gp('pilgrimId');
        if (!$pilgrimId) errorResponse('pilgrimId required');
        $db = getDB();
        $check = $db->prepare("SELECT Id FROM Pilgrim WHERE Id=?");
        $check->execute([$pilgrimId]);
        if (!$check->fetch()) errorResponse('Pilgrim not found', 404);
        $id = generateId('Traffic');
        $db->prepare("INSERT INTO Traffic (Id, PilgrimId, DateTime) VALUES (?,?,NOW())")->execute([$id, $pilgrimId]);
        $cnt = (int)$db->prepare("SELECT COUNT(*) as cnt FROM Traffic WHERE PilgrimId=?")->execute([$pilgrimId]) ? (function() use ($db, $pilgrimId) { $s = $db->prepare("SELECT COUNT(*) as cnt FROM Traffic WHERE PilgrimId=?"); $s->execute([$pilgrimId]); return (int)$s->fetch()['cnt']; })() : 1;
        $s2 = $db->prepare("SELECT COUNT(*) as cnt FROM Traffic WHERE PilgrimId=?");
        $s2->execute([$pilgrimId]);
        $cnt = (int)$s2->fetch()['cnt'];
        $type = ($cnt % 2 === 1) ? 'entry' : 'exit';
        successResponse(['trafficId' => $id, 'type' => $type, 'count' => $cnt]);
    } elseif (route('GET', '/pilgrim/import/template')) {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="pilgrim_template.csv"');
        echo "\xEF\xBB\xBFFullName,NationalCode,Gender\n";
        echo "نام نمونه,1234567890,male\n";
        exit;
    } elseif (route('POST', '/pilgrim/import')) {
        $caravanId = gp('caravanId');
        if (!$caravanId) errorResponse('caravanId required');
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) errorResponse('File required');
        $db = getDB();
        $c = $db->prepare("SELECT Id FROM Caravan WHERE Id=?"); $c->execute([$caravanId]);
        if (!$c->fetch()) errorResponse('Caravan not found');
        $handle = fopen($_FILES['file']['tmp_name'], 'r');
        if (!$handle) errorResponse('Cannot read file');
        fgetcsv($handle);
        $imported = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 3) continue;
            $fn = trim($row[0]); $nc = trim($row[1]); $g = trim($row[2]);
            if (!$fn || !$nc || !in_array($g, ['male','female'])) continue;
            $nid = generateId('Pilgrim');
            $db->prepare("INSERT INTO Pilgrim (Id, CaravanId, FullName, NationalCode, Gender) VALUES (?,?,?,?,?)")->execute([$nid, $caravanId, $fn, $nc, $g]);
            $imported++;
        }
        fclose($handle);
        successResponse(['imported' => $imported]);
    } elseif (route('POST', '/report')) {
        $db = getDB();
        $caravanIds = gp('caravanIds', []);
        $isExcel = filter_var(gp('isExcel', false), FILTER_VALIDATE_BOOLEAN);
        $detail = filter_var(gp('detail', false), FILTER_VALIDATE_BOOLEAN);
        if (empty($caravanIds)) errorResponse('caravanIds required');
        $ph = implode(',', array_fill(0, count($caravanIds), '?'));
        if ($detail) {
            $sql = "SELECT c.Name as CaravanName, p.FullName as PilgrimName, p.Id as PilgrimId, t.DateTime, t.Id as TrafficId FROM Traffic t JOIN Pilgrim p ON p.Id=t.PilgrimId JOIN Caravan c ON c.Id=p.CaravanId WHERE c.Id IN ($ph) ORDER BY c.Id, p.Id, t.DateTime";
            $stmt = $db->prepare($sql); $stmt->execute($caravanIds);
            $rows = $stmt->fetchAll();
            $map = [];
            foreach ($rows as &$row) { $pid = $row['PilgrimId']; if (!isset($map[$pid])) $map[$pid] = 0; $map[$pid]++; $row['TrafficType'] = ($map[$pid] % 2 === 1) ? 'ورود' : 'خروج'; }
            unset($row);
            if ($isExcel) {
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="detail_report.csv"');
                echo "\xEF\xBB\xBFنام کاروان,نام زائر,تاریخ و ساعت,نوع تردد\n";
                foreach ($rows as $r) echo '"'.$r['CaravanName'].'","'.$r['PilgrimName'].'","'.$r['DateTime'].'","'.$r['TrafficType'].'"'."\n";
                exit;
            }
            successResponse($rows);
        } else {
            $sql = "SELECT c.Id as CaravanId, c.Name as CaravanName, COUNT(DISTINCT p.Id) as PilgrimCount, COUNT(t.Id) as TotalTraffic FROM Caravan c LEFT JOIN Pilgrim p ON p.CaravanId=c.Id LEFT JOIN Traffic t ON t.PilgrimId=p.Id WHERE c.Id IN ($ph) GROUP BY c.Id";
            $stmt = $db->prepare($sql); $stmt->execute($caravanIds);
            $caravansData = $stmt->fetchAll();
            $result = [];
            foreach ($caravansData as $car) {
                $cid = $car['CaravanId'];
                $ts = $db->prepare("SELECT p.Id as PilgrimId, t.Id as TrafficId FROM Traffic t JOIN Pilgrim p ON p.Id=t.PilgrimId WHERE p.CaravanId=? ORDER BY p.Id, t.DateTime");
                $ts->execute([$cid]); $traffics = $ts->fetchAll();
                $pmap = [];
                foreach ($traffics as $tr) { $pid = $tr['PilgrimId']; if (!isset($pmap[$pid])) $pmap[$pid] = 0; $pmap[$pid]++; }
                $entry = 0; $exit = 0;
                foreach ($pmap as $cnt) { $entry += (int)ceil($cnt / 2); $exit += (int)floor($cnt / 2); }
                $result[] = ['CaravanName' => $car['CaravanName'], 'PilgrimCount' => $car['PilgrimCount'], 'TotalTraffic' => $car['TotalTraffic'], 'EntryCount' => $entry, 'ExitCount' => $exit];
            }
            if ($isExcel) {
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="summary_report.csv"');
                echo "\xEF\xBB\xBFنام کاروان,تعداد زائر,کل تردد,ورود,خروج\n";
                foreach ($result as $r) echo '"'.$r['CaravanName'].'",'.$r['PilgrimCount'].','.$r['TotalTraffic'].','.$r['EntryCount'].','.$r['ExitCount']."\n";
                exit;
            }
            successResponse($result);
        }
    } else {
        errorResponse('Not found', 404);
    }
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}