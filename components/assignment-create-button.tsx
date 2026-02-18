'use client';

import { AssignmentCreateDialog } from '@/components/assignment-create-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AssignmentCreateButtonProps {
    disabled?: boolean;
}

export function AssignmentCreateButton({ disabled }: AssignmentCreateButtonProps) {
    if (disabled) {
        return (
            <Button disabled>
                <Plus className="mr-2 size-4" />
                Create Assignment
            </Button>
        );
    }

    return (
        <AssignmentCreateDialog>
            <Button>
                <Plus className="mr-2 size-4" />
                Create Assignment
            </Button>
        </AssignmentCreateDialog>
    );
}

export function AssignmentCreateFirstButton() {
    return (
        <AssignmentCreateDialog>
            <Button>
                <Plus className="mr-2 size-4" />
                Create First Assignment
            </Button>
        </AssignmentCreateDialog>
    );
}
