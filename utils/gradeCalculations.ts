export const gradeValues: { [key: string]: number } = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

export function calculateGPA(courses: { grade: string; credits: number }[]): number {
  if (courses.length === 0) return 0;

  let totalPoints = 0;
  let totalCredits = 0;

  courses.forEach((course) => {
    if (!(course.grade in gradeValues)) {
      throw new Error(`Invalid grade: ${course.grade}`);
    }
    if (course.credits <= 0) {
      throw new Error("Credits must be a positive number");
    }
    totalPoints += gradeValues[course.grade] * course.credits;
    totalCredits += course.credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export function calculateCGPA(semesters: { gpa: number; totalCredits: number }[]): number {
  if (semesters.length === 0) return 0;

  let totalPoints = 0;
  let totalCredits = 0;

  semesters.forEach((semester) => {
    if (semester.gpa < 0 || semester.gpa > 10) {
      throw new Error(`Invalid GPA: ${semester.gpa}`);
    }
    if (semester.totalCredits <= 0) {
      throw new Error("Total credits must be a positive number");
    }
    totalPoints += semester.gpa * semester.totalCredits;
    totalCredits += semester.totalCredits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

