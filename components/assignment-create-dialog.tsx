'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, FileText, Save, Loader2 } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    code?: string | null;
}

interface AssignmentCreateDialogProps {
    children?: React.ReactNode;
}

export function AssignmentCreateDialog({ children }: AssignmentCreateDialogProps) {
    const [open, setOpen] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructions: '',
        maxPoints: '100',
        dueDate: '',
        allowLateSubmissions: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    // Fetch courses when dialog opens
    useEffect(() => {
        if (open) {
            fetchCourses();
        }
    }, [open]);

    const fetchCourses = async () => {
        setIsLoadingCourses(true);
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses || data || []);
                if ((data.courses || data).length === 1) {
                    setSelectedCourseId((data.courses || data)[0].id);
                }
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
        } finally {
            setIsLoadingCourses(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCourseId) {
            toast({ title: 'Error', description: 'Please select a course.', variant: 'destructive' });
            return;
        }

        if (!formData.title.trim()) {
            toast({ title: 'Error', description: 'Assignment title is required.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/courses/${selectedCourseId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    instructions: formData.instructions || formData.description || null,
                    points: parseFloat(formData.maxPoints) || 100,
                    dueAt: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                    lateSubmissionAllowed: formData.allowLateSubmissions,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create assignment');
            }

            toast({
                title: 'Assignment Created',
                description: `"${formData.title}" has been created successfully.`
            });

            setOpen(false);
            setFormData({ title: '', description: '', instructions: '', maxPoints: '100', dueDate: '', allowLateSubmissions: false });
            setSelectedCourseId('');
            router.refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create assignment',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <Plus className="mr-2 size-4" />
                        Create Assignment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Create New Assignment
                    </DialogTitle>
                    <DialogDescription>
                        Create an assignment for one of your courses.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Course Selection */}
                    <div className="space-y-2">
                        <Label>Course *</Label>
                        {isLoadingCourses ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                Loading courses...
                            </div>
                        ) : courses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No courses found. Create a course first.
                            </p>
                        ) : (
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title} {course.code ? `(${course.code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="create-title">Assignment Title *</Label>
                        <Input
                            id="create-title"
                            name="title"
                            placeholder="e.g., Essay on Data Structures"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                        <Label htmlFor="create-instructions">Instructions</Label>
                        <Textarea
                            id="create-instructions"
                            name="instructions"
                            placeholder="Provide instructions for students..."
                            value={formData.instructions}
                            onChange={handleInputChange}
                            rows={4}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Points and Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-maxPoints">Points</Label>
                            <Input
                                id="create-maxPoints"
                                name="maxPoints"
                                type="number"
                                min="1"
                                value={formData.maxPoints}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-dueDate">Due Date</Label>
                            <Input
                                id="create-dueDate"
                                name="dueDate"
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Late Submissions */}
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label className="text-sm font-medium">Allow Late Submissions</Label>
                            <p className="text-xs text-muted-foreground">Students can submit after due date</p>
                        </div>
                        <Switch
                            checked={formData.allowLateSubmissions}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowLateSubmissions: checked }))}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !selectedCourseId || courses.length === 0}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 size-4" />
                                    Create Assignment
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
