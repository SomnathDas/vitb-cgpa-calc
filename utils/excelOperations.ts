import * as XLSX from 'xlsx';
import { Semester } from '../types/calculator';

export const exportToExcel = (semesters: Semester[]) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(semesters.flatMap(semester => 
    semester.courses.map(course => ({
      Semester: semester.number,
      Grade: course.grade,
      Credits: course.credits
    }))
  ));

  XLSX.utils.book_append_sheet(workbook, worksheet, "CGPA Data");
  XLSX.writeFile(workbook, "cgpa_data.xlsx");
};

export const importFromExcel = (file: File): Promise<Semester[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const semesters: Semester[] = [];
      jsonData.forEach((row: any) => {
        let semester = semesters.find(s => s.number === row.Semester);
        if (!semester) {
          semester = { id: generateId(), number: row.Semester, courses: [], gpa: 0 };
          semesters.push(semester);
        }
        semester.courses.push({
          id: generateId(),
          grade: row.Grade,
          credits: row.Credits
        });
      });

      resolve(semesters);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

const generateId = () => Math.random().toString(36).substr(2, 9);

