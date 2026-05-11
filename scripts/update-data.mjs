import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, '..', 'data', 'csv');
const JSON_DIR = path.join(__dirname, '..', 'src', 'data');

function parseTags(tagString) {
  if (!tagString) return [];
  return tagString.split(',').map(t => t.trim()).filter(Boolean);
}

function convertCourses() {
  const csvPath = path.join(CSV_DIR, 'courses.csv');
  const jsonPath = path.join(JSON_DIR, 'courses.json');
  
  if (!fs.existsSync(csvPath)) {
    console.warn(`[Warning] ${csvPath} not found.`);
    return;
  }

  let records = [];
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    records = parse(csvContent, { columns: true, skip_empty_lines: true });
  } catch (error) {
    console.error(`[Error] Failed to parse ${csvPath}. Please check for extra commas or missing columns.`);
    console.error(error.message);
    process.exit(1);
  }

  const processed = records.map(record => ({
    ...record,
    commonTags: parseTags(record.commonTags)
  }));

  fs.writeFileSync(jsonPath, JSON.stringify(processed, null, 2), 'utf8');
  console.log(`[Success] Converted courses.csv to courses.json (${processed.length} records)`);
}

function convertVideos() {
  let csvPath = path.join(CSV_DIR, 'videos.csv');
  const jsonPath = path.join(JSON_DIR, 'videos.json');
  
  if (!fs.existsSync(csvPath)) {
    const fallbackPath = path.join(CSV_DIR, 'videos.csv.csv');
    if (fs.existsSync(fallbackPath)) {
      csvPath = fallbackPath;
    } else {
      console.warn(`[Warning] ${csvPath} not found.`);
      return;
    }
  }

  let records = [];
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    records = parse(csvContent, { columns: true, skip_empty_lines: true });
  } catch (error) {
    console.error(`[Error] Failed to parse ${csvPath}. Please check for extra commas or missing columns.`);
    console.error(error.message);
    process.exit(1);
  }

  // Load courses to validate courseId
  const coursesJsonPath = path.join(JSON_DIR, 'courses.json');
  let validCourseIds = new Set();
  if (fs.existsSync(coursesJsonPath)) {
    const coursesData = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));
    validCourseIds = new Set(coursesData.map(c => c.id));
  }

  const processed = records.map(record => {
    if (validCourseIds.size > 0 && !validCourseIds.has(record.courseId)) {
      console.warn(`[Warning] Video ID "${record.id}" has an unknown courseId: "${record.courseId}"`);
    }
    return {
      ...record,
      individualTags: parseTags(record.individualTags)
    };
  });

  fs.writeFileSync(jsonPath, JSON.stringify(processed, null, 2), 'utf8');
  console.log(`[Success] Converted videos.csv to videos.json (${processed.length} records)`);
}

function main() {
  console.log('Starting CSV to JSON conversion...');
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }
  convertCourses();
  convertVideos();
  console.log('Conversion complete.');
}

main();
