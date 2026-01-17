/**
 * Example React component showing how to use the new API routes
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CourseManager() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create a new course
  const createCourse = async (courseData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      const result = await response.json();
      console.log('Course created:', result.course);
      
      // Refresh courses list
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const result = await response.json();
      setCourses(result.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Create assignment for a course
  const createAssignment = async (courseId: string, assignmentData: any) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }

      const result = await response.json();
      console.log('Assignment created:', result.assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  // Grade a submission
  const gradeSubmission = async (submissionId: string, gradeData: any) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
      }

      const result = await response.json();
      console.log('Grade submitted:', result.grade);
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  if (!session) {
    return <div>Please log in to manage courses.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Course Manager</h1>
      
      <div className="mb-6">
        <button
          onClick={() => createCourse({
            title: "Sample Course",
            code: "SC101",
            term: "Fall 2024",
            description: "A sample course for testing"
          })}
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Sample Course'}
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={fetchCourses}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Load Courses
        </button>
      </div>

      {courses.length > 0 && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Your Courses:</h2>
          <div className="grid gap-4">
            {courses.map((course: any) => (
              <div key={course.id} className="rounded border p-4">
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.code} - {course.term}</p>
                <p className="text-sm">{course.description}</p>
                
                <div className="mt-2">
                  <button
                    onClick={() => createAssignment(course.id, {
                      title: "Sample Assignment",
                      type: "ESSAY",
                      instructions: "Write a 500-word essay",
                      points: 100,
                      dueAt: "2024-12-31T23:59:59Z"
                    })}
                    className="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
                  >
                    Add Sample Assignment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}