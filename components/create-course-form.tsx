'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import Link from 'next/link';

interface CreateCourseFormProps {
    userId: string;
    onCancel?: () => void;
}

export default function CreateCourseForm({ userId, onCancel }: CreateCourseFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            isActive: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.code.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Course title and code are required.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    ownerId: userId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create course');
            }

            toast({
                title: 'Course Created',
                description: `Course "${formData.title}" has been created successfully.`
            });

            router.push(`/dashboard/courses/${data.course.id}`);
        } catch (error) {
            console.error('Error creating course:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create course',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/courses">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to Courses
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Create New Course</h1>
                    <p className="text-muted-foreground">
                        Set up a new course for your students
                    </p>
                </div>
            </div>

            {/* Course Creation Form */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="size-5" />
                        Course Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Course Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., Introduction to Computer Science"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Course Code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Course Code *</Label>
                            <Input
                                id="code"
                                name="code"
                                placeholder="e.g., CS101"
                                value={formData.code}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                                className="uppercase"
                                style={{ textTransform: 'uppercase' }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Course code must be unique (e.g., CS101, MATH201)
                            </p>
                        </div>

                        {/* Course Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Course Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe what this course covers..."
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between rounded-md border p-4">
                            <div>
                                <Label htmlFor="isActive" className="text-sm font-medium">
                                    Course Status
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Active courses are visible to students
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={handleSwitchChange}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                {isSubmitting ? 'Creating...' : 'Create Course'}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel || (() => router.back())}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-medium text-primary">1</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Create your course</p>
                            <p className="text-xs text-muted-foreground">
                                Set up the basic course information
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-medium text-primary">2</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Add students</p>
                            <p className="text-xs text-muted-foreground">
                                Invite students to join your course
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-medium text-primary">3</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Create assignments & discussions</p>
                            <p className="text-xs text-muted-foreground">
                                Start adding course content for your students
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}