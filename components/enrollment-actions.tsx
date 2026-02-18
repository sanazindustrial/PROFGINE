'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
    Users,
    UserPlus,
    Loader2,
    CheckCircle,
    XCircle,
    Upload,
    Mail,
} from 'lucide-react';

interface CourseData {
    id: string;
    title: string;
    code?: string | null;
    _count: {
        enrollments: number;
        assignments: number;
        discussions: number;
    };
    enrollments: {
        id: string;
        user: {
            id: string;
            name: string | null;
            email: string;
            role: string;
        };
    }[];
}

interface EnrollmentActionsProps {
    courses: CourseData[];
    canBulkEnroll: boolean;
}

export function EnrollmentActions({ courses, canBulkEnroll }: EnrollmentActionsProps) {
    const [singleEnrollOpen, setSingleEnrollOpen] = useState(false);
    const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentName, setStudentName] = useState('');
    const [csvData, setCsvData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bulkResults, setBulkResults] = useState<{
        successful: { email: string; name: string }[];
        failed: { email: string; name: string; error?: string }[];
        updated: { email: string; name: string }[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const { toast } = useToast();

    // Single student enrollment
    const handleSingleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCourseId) {
            toast({ title: 'Error', description: 'Please select a course.', variant: 'destructive' });
            return;
        }
        if (!studentEmail.trim()) {
            toast({ title: 'Error', description: 'Student email is required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const csvLine = `name,email\n${studentName || 'Student'},${studentEmail}`;
            const res = await fetch(`/api/courses/${selectedCourseId}/enroll-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedCourseId,
                    csvData: csvLine,
                    notifyStudents: false,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to enroll student');

            if (data.results?.successful?.length > 0) {
                toast({
                    title: 'Student Enrolled',
                    description: `${studentEmail} has been enrolled successfully.`,
                });
            } else if (data.results?.updated?.length > 0) {
                toast({
                    title: 'Already Enrolled',
                    description: `${studentEmail} is already enrolled in this course.`,
                });
            } else if (data.results?.failed?.length > 0) {
                throw new Error(data.results.failed[0].error || 'Enrollment failed');
            }

            setSingleEnrollOpen(false);
            setStudentEmail('');
            setStudentName('');
            setSelectedCourseId('');
            router.refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to enroll student',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bulk enrollment
    const handleBulkEnroll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCourseId) {
            toast({ title: 'Error', description: 'Please select a course.', variant: 'destructive' });
            return;
        }
        if (!csvData.trim()) {
            toast({ title: 'Error', description: 'Please provide CSV data.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        setBulkResults(null);
        try {
            const res = await fetch(`/api/courses/${selectedCourseId}/enroll-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedCourseId,
                    csvData: csvData,
                    notifyStudents: false,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to bulk enroll');

            setBulkResults(data.results);
            toast({
                title: 'Bulk Enrollment Complete',
                description: `${data.results.successful.length} enrolled, ${data.results.updated.length} already enrolled, ${data.results.failed.length} failed`,
            });

            router.refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to bulk enroll',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle CSV file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCsvData(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    // Enroll button for a specific course
    const handleCourseEnroll = (courseId: string) => {
        setSelectedCourseId(courseId);
        setSingleEnrollOpen(true);
    };

    return (
        <>
            {/* Header Buttons */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setSelectedCourseId(''); setSingleEnrollOpen(true); }}>
                    <UserPlus className="mr-2 size-4" />
                    Add Students
                </Button>
                {canBulkEnroll && (
                    <Button onClick={() => { setSelectedCourseId(''); setBulkEnrollOpen(true); setBulkResults(null); }}>
                        <Users className="mr-2 size-4" />
                        Bulk Enroll
                    </Button>
                )}
            </div>

            {/* Course Cards */}
            <div className="grid gap-6">
                {courses.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="mx-auto mb-4 size-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold">No Courses Found</h3>
                            <p className="mb-4 text-gray-600">Create a course first to start enrolling students.</p>
                            <Button asChild>
                                <a href="/dashboard/courses">Create Course</a>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map(course => (
                        <Card key={course.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {course.title}
                                            {course.code && <Badge variant="secondary">{course.code}</Badge>}
                                        </CardTitle>
                                        <CardDescription>
                                            {course._count.enrollments} students enrolled
                                            &bull;{course._count.assignments} assignments
                                            &bull;{course._count.discussions} discussions
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCourseEnroll(course.id)}
                                    >
                                        <UserPlus className="mr-1 size-4" />
                                        Enroll
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {course.enrollments.length > 0 ? (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Enrolled Students:</h4>
                                        <div className="grid gap-2">
                                            {course.enrollments.slice(0, 5).map(enrollment => (
                                                <div key={enrollment.id} className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                                {enrollment.user.name?.charAt(0) || 'U'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">{enrollment.user.name}</div>
                                                            <div className="text-muted-foreground text-xs">{enrollment.user.email}</div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {enrollment.user.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {course.enrollments.length > 5 && (
                                                <p className="text-muted-foreground py-2 text-center text-sm">
                                                    and {course.enrollments.length - 5} more students...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground py-8 text-center">
                                        <Users className="mx-auto mb-2 size-8" />
                                        <p>No students enrolled yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Single Enrollment Dialog */}
            <Dialog open={singleEnrollOpen} onOpenChange={setSingleEnrollOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="size-5" />
                            Enroll Student
                        </DialogTitle>
                        <DialogDescription>
                            Add a student to one of your courses by email.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSingleEnroll} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title} {c.code ? `(${c.code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="enroll-email">Student Email *</Label>
                            <Input
                                id="enroll-email"
                                type="email"
                                placeholder="student@example.com"
                                value={studentEmail}
                                onChange={(e) => setStudentEmail(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="enroll-name">Student Name</Label>
                            <Input
                                id="enroll-name"
                                placeholder="John Doe"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setSingleEnrollOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !selectedCourseId}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 size-4 animate-spin" /> Enrolling...</>
                                ) : (
                                    <><Mail className="mr-2 size-4" /> Enroll Student</>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Enrollment Dialog */}
            <Dialog open={bulkEnrollOpen} onOpenChange={setBulkEnrollOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Bulk Enroll Students
                        </DialogTitle>
                        <DialogDescription>
                            Upload a CSV file or paste CSV data with columns: name, email
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkEnroll} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title} {c.code ? `(${c.code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Upload CSV File</Label>
                            <div className="flex gap-2">
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="cursor-pointer"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
                            <Textarea
                                id="csv-data"
                                placeholder={"name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com"}
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                                rows={6}
                                disabled={isSubmitting}
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Results */}
                        {bulkResults && (
                            <div className="space-y-2">
                                {bulkResults.successful.length > 0 && (
                                    <Alert>
                                        <CheckCircle className="size-4 text-green-600" />
                                        <AlertDescription>
                                            <strong>{bulkResults.successful.length} students enrolled:</strong>{' '}
                                            {bulkResults.successful.map(s => s.email).join(', ')}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {bulkResults.updated.length > 0 && (
                                    <Alert>
                                        <Users className="size-4 text-blue-600" />
                                        <AlertDescription>
                                            <strong>{bulkResults.updated.length} already enrolled:</strong>{' '}
                                            {bulkResults.updated.map(s => s.email).join(', ')}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {bulkResults.failed.length > 0 && (
                                    <Alert variant="destructive">
                                        <XCircle className="size-4" />
                                        <AlertDescription>
                                            <strong>{bulkResults.failed.length} failed:</strong>{' '}
                                            {bulkResults.failed.map(s => `${s.email} (${s.error})`).join(', ')}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setBulkEnrollOpen(false)} disabled={isSubmitting}>
                                {bulkResults ? 'Close' : 'Cancel'}
                            </Button>
                            {!bulkResults && (
                                <Button type="submit" disabled={isSubmitting || !selectedCourseId || !csvData.trim()}>
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 size-4 animate-spin" /> Enrolling...</>
                                    ) : (
                                        <><Users className="mr-2 size-4" /> Enroll All</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
