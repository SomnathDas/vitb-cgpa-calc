'use client'

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { calculateGPA, calculateCGPA, gradeValues } from '@/utils/gradeCalculations'
import { exportToExcel, importFromExcel } from '@/utils/excelOperations'
import { Course, Semester, ChartData } from '@/types/calculator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Trash2, Download, Upload } from 'lucide-react'

// Simple function to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function CGPACalculator() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [cgpa, setCGPA] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gpaChartData, setGPAChartData] = useState<ChartData[]>([])
  const [cgpaChartData, setCGPAChartData] = useState<ChartData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addSemester = () => {
    setSemesters(prevSemesters => {
      const newSemesters = [...prevSemesters, { id: generateId(), number: prevSemesters.length + 1, courses: [], gpa: 0 }]
      setTimeout(() => calculateResults(newSemesters), 0)
      return newSemesters
    })
  }

  const removeSemester = (semesterId: string) => {
    setSemesters(prevSemesters => {
      const newSemesters = prevSemesters.filter(semester => semester.id !== semesterId)
        .map((semester, index) => ({ ...semester, number: index + 1 }))
      setTimeout(() => calculateResults(newSemesters), 0)
      return newSemesters
    })
  }

  const addCourse = (semesterId: string) => {
    setSemesters(prevSemesters => {
      const newSemesters = prevSemesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: [...semester.courses, { id: generateId(), grade: 'S', credits: 3 }]
          }
        }
        return semester
      })
      setTimeout(() => calculateResults(newSemesters), 0)
      return newSemesters
    })
  }

  const removeCourse = (semesterId: string, courseId: string) => {
    setSemesters(prevSemesters => {
      const newSemesters = prevSemesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.filter(course => course.id !== courseId)
          }
        }
        return semester
      })
      setTimeout(() => calculateResults(newSemesters), 0)
      return newSemesters
    })
  }

  const updateCourse = (semesterId: string, courseId: string, field: 'grade' | 'credits', value: string | number) => {
    setSemesters(prevSemesters => {
      const newSemesters = prevSemesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            courses: semester.courses.map(course => {
              if (course.id === courseId) {
                return { ...course, [field]: value }
              }
              return course
            })
          }
        }
        return semester
      })
      setTimeout(() => calculateResults(newSemesters), 0)
      return newSemesters
    })
  }

  const calculateResults = (currentSemesters: Semester[]) => {
    try {
      setError(null)
      const updatedSemesters = currentSemesters.map(semester => {
        const gpa = calculateGPA(semester.courses)
        return { ...semester, gpa }
      })

      const semesterResults = updatedSemesters.map(semester => {
        const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0)
        return { gpa: semester.gpa, totalCredits }
      })

      const calculatedCGPA = calculateCGPA(semesterResults)
      setCGPA(calculatedCGPA)
      setSemesters(updatedSemesters)

      // Update GPA chart data
      const newGPAChartData: any = updatedSemesters.map(semester => ({
        semester: semester.number,
        gpa: semester.gpa,
      }))
      setGPAChartData(newGPAChartData)

      // Update CGPA chart data
      const newCGPAChartData: ChartData[] = []
      let runningTotalCredits = 0
      let runningTotalPoints = 0

      updatedSemesters.forEach((semester, index) => {
        const semesterCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0)
        runningTotalCredits += semesterCredits
        runningTotalPoints += semester.gpa * semesterCredits
        const currentCGPA = runningTotalPoints / runningTotalCredits

        newCGPAChartData.push({
          semester: semester.number,
          cgpa: currentCGPA,
          gpa: 0
        })
      })

      setCGPAChartData(newCGPAChartData)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    }
  }

  const handleExport = () => {
    exportToExcel(semesters);
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedSemesters = await importFromExcel(file);
        setSemesters(importedSemesters);
        calculateResults(importedSemesters);
      } catch (err) {
        setError('Error importing file. Please make sure it\'s a valid Excel file.');
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">VIT-B CGPA Calculator</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Button onClick={addSemester} className="w-full">Add Semester</Button>
        <Button onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Import from Excel
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
      />
      {semesters.map((semester) => (
        <Card key={semester.id} className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Semester {semester.number}</CardTitle>
              <CardDescription>Enter <strong>[GRADE, COURSE CREDIT]</strong> respectively for each course.</CardDescription>
            </div>
            <Button variant="destructive" size="icon" onClick={() => removeSemester(semester.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {semester.courses.map((course) => (
              <div key={course.id} className="flex gap-4 mb-2 items-center">
                <Select
                  value={course.grade}
                  onValueChange={(value) => updateCourse(semester.id, course.id, 'grade', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(gradeValues).map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={course.credits}
                  onChange={(e) => updateCourse(semester.id, course.id, 'credits', parseInt(e.target.value) || 0)}
                  placeholder="Credits"
                  className="w-[100px]"
                />
                <Button variant="outline" size="icon" onClick={() => removeCourse(semester.id, course.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button onClick={() => addCourse(semester.id)} className="mt-2">Add Course</Button>
          </CardContent>
          <CardFooter>
            <p>GPA: {semester.gpa.toFixed(2)}</p>
          </CardFooter>
        </Card>
      ))}
      {cgpa !== null && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>CGPA: {cgpa.toFixed(2)}</p>
          </CardContent>
        </Card>
      )}
      {gpaChartData.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>GPA for Each Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} minWidth={300}>
              <BarChart data={gpaChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semester" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="gpa" fill="#8884d8" name="GPA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {cgpaChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CGPA Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} minWidth={300}>
              <LineChart data={cgpaChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semester" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cgpa" stroke="#82ca9d" name="CGPA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
