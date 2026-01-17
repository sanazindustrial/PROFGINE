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
import { ArrowLeft, FileText, Save, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionManager, FeatureType } from '@/lib/subscription-manager';
import { UserRole, SubscriptionType } from '@prisma/client';

interface CreateAssignmentFormProps {
    courseId: string;
    user: {
        role: UserRole;
        subscriptionType: SubscriptionType;
        subscriptionExpiresAt?: Date | null;
        trialExpiresAt?: Date | null;
    };
    currentAssignmentCount: number;
    onCancel?: () => void;
}

export default function CreateAssignmentForm({
    courseId,
    user,
    currentAssignmentCount,
    onCancel
}: CreateAssignmentFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructions: '',
        maxPoints: '100',
        dueDate: '',
        allowLateSubmissions: false,
        isPublished: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    const canCreate = SubscriptionManager.canCreateAssignment(
        user.subscriptionType,
        currentAssignmentCount
    );

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canCreate) {
            toast({
                title: 'Assignment Limit Reached',
                description: SubscriptionManager.getUpgradeMessage(user.subscriptionType, FeatureType.ASSIGNMENT_CREATION),
                variant: 'destructive'
            });
            return;
        }

        if (!formData.title.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Assignment title is required.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/courses/${courseId}/assignments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    maxPoints: parseFloat(formData.maxPoints) || 100,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create assignment');
            }

            toast({
                title: 'Assignment Created',
                description: `Assignment "${formData.title}" has been created successfully.`
            });

            router.push(`/dashboard/courses/${courseId}/assignments/${data.assignment.id}`);
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create assignment',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canCreate) {
        return (
            <div className="container mx-auto space-y-6 py-6">
                <Card className="mx-auto max-w-2xl">
                    <CardContent className="py-12 text-center">
                        <FileText className="mx-auto mb-4 size-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">Assignment Limit Reached</h3>
                        <p className="mb-4 text-muted-foreground">
                            {SubscriptionManager.getUpgradeMessage(user.subscriptionType, FeatureType.ASSIGNMENT_CREATION)}
                        </p>
                        <div className="flex justify-center gap-2">
                            <Link href="/subscription/upgrade">
                                <Button>Upgrade Now</Button>
                            </Link>
                            <Link href={`/dashboard/courses/${courseId}`}>
                                <Button variant="outline">Back to Course</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/courses/${courseId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to Course
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Create New Assignment</h1>
                    <p className="text-muted-foreground">
                        Create an assignment for your students
                    </p>
                </div>
            </div>

            {/* Assignment Creation Form */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Assignment Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Assignment Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Assignment Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., Essay on Data Structures"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Brief description of the assignment..."
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="space-y-2">
                            <Label htmlFor="instructions">Detailed Instructions</Label>
                            <Textarea
                                id="instructions"
                                name="instructions"
                                placeholder="Provide detailed instructions for students..."
                                value={formData.instructions}
                                onChange={handleInputChange}
                                rows={6}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Max Points and Due Date */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="maxPoints">Maximum Points</Label>
                                <Input
                                    id="maxPoints"
                                    name="maxPoints"
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={formData.maxPoints}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                                <Input
                                    id="dueDate"
                                    name="dueDate"
                                    type="datetime-local"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-md border p-4">
                                <div>
                                    <Label htmlFor="allowLateSubmissions" className="text-sm font-medium">
                                        Allow Late Submissions
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Students can submit after the due date
                                    </p>
                                </div>
                                <Switch
                                    id="allowLateSubmissions"
                                    checked={formData.allowLateSubmissions}
                                    onCheckedChange={(checked) => handleSwitchChange('allowLateSubmissions', checked)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-md border p-4">
                                <div>
                                    <Label htmlFor="isPublished" className="text-sm font-medium">
                                        Publish Assignment
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Students can see and submit to this assignment
                                    </p>
                                </div>
                                <Switch
                                    id="isPublished"
                                    checked={formData.isPublished}
                                    onCheckedChange={(checked) => handleSwitchChange('isPublished', checked)}
                                    disabled={isSubmitting}
                                />
                            </div>
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
                                {isSubmitting ? 'Creating...' : 'Create Assignment'}
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
        </div>
    );
}