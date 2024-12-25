export interface Course {
  id: string;
  grade: string;
  credits: number;
}

export interface Semester {
  id: string;
  number: number;
  courses: Course[];
  gpa: number;
}

export interface ChartData {
  semester: number;
  gpa: number;
  cgpa: number;
}

