"use client"

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText,
  BookOpen,
  Shield,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react'

// Validation schema for the form
const SelfReflectionSchema = z.object({
  criterion: z.string(),
  selfScore: z.number().min(0).max(100),
  note: z.string().min(10, "Please provide a meaningful reflection (at least 10 characters)"),
})

const ReadyGateFormSchema = z.object({
  submissionId: z.string(),
  reflections: z.array(SelfReflectionSchema).min(1),
  structureCheck: z.boolean(),
  citationsCheck: z.boolean(),
  evidenceCheck: z.boolean(),
  accessibilityCheck: z.boolean(),
})

type ReadyGateFormData = z.infer<typeof ReadyGateFormSchema>

interface RubricCriterion {
  id: string
  label: string
  description?: string
  maxPoints: number
}

interface AIToolEntry {
  toolName: string
  purpose: string
  sections: string[]
}

interface ReadyGateSelfEvaluationProps {
  submissionId: string
  rubricCriteria: RubricCriterion[]
  onComplete: (data: ReadyGateFormData & { aiUseStatement: any }) => void
  onCancel?: () => void
}

export function ReadyGateSelfEvaluation({ 
  submissionId, 
  rubricCriteria, 
  onComplete,
  onCancel,
}: ReadyGateSelfEvaluationProps) {
  const [step, setStep] = useState<'reflection' | 'ai-use' | 'compliance'>('reflection')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiTools, setAiTools] = useState<AIToolEntry[]>([])
  const [aiReflection, setAiReflection] = useState('')
  const [newToolName, setNewToolName] = useState('')
  const [newToolPurpose, setNewToolPurpose] = useState('')
  const [hasProcessEvidence, setHasProcessEvidence] = useState(false)
  const [draftVersionsCount, setDraftVersionsCount] = useState(0)

  const { 
    register, 
    control, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors, isValid } 
  } = useForm<ReadyGateFormData>({
    resolver: zodResolver(ReadyGateFormSchema),
    defaultValues: {
      submissionId,
      reflections: rubricCriteria.map(c => ({ 
        criterion: c.label, 
        selfScore: 0, 
        note: '' 
      })),
      structureCheck: false,
      citationsCheck: false,
      evidenceCheck: false,
      accessibilityCheck: false,
    },
  })

  const { fields } = useFieldArray({
    control,
    name: 'reflections',
  })

  const watchedReflections = watch('reflections')
  const watchedChecks = {
    structure: watch('structureCheck'),
    citations: watch('citationsCheck'),
    evidence: watch('evidenceCheck'),
    accessibility: watch('accessibilityCheck'),
  }

  const completedReflections = watchedReflections?.filter(
    r => r.note && r.note.length >= 10 && r.selfScore > 0
  ).length || 0

  const checksCompleted = Object.values(watchedChecks).filter(Boolean).length
  const totalSteps = 3
  const currentStepNumber = step === 'reflection' ? 1 : step === 'ai-use' ? 2 : 3

  const addAITool = () => {
    if (newToolName && newToolPurpose) {
      setAiTools([...aiTools, { toolName: newToolName, purpose: newToolPurpose, sections: [] }])
      setNewToolName('')
      setNewToolPurpose('')
    }
  }

  const removeAITool = (index: number) => {
    setAiTools(aiTools.filter((_, i) => i !== index))
  }

  const onSubmitForm = async (data: ReadyGateFormData) => {
    setIsSubmitting(true)
    try {
      const aiUseStatement = {
        toolsUsed: aiTools,
        collaborationReflection: aiReflection,
        hasProcessEvidence,
        draftVersionsCount,
        changeLogAvailable: draftVersionsCount > 1,
      }

      // Submit to API
      const response = await fetch('/api/grading-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'self-evaluation',
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit self-evaluation')
      }

      // Also submit AI-use statement if tools were used
      if (aiTools.length > 0 || aiReflection) {
        await fetch('/api/grading-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ai-use-statement',
            submissionId,
            ...aiUseStatement,
          }),
        })
      }

      onComplete({ ...data, aiUseStatement })
    } catch (error) {
      console.error('Error submitting self-evaluation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isGatePassed = watchedChecks.structure && 
                       watchedChecks.citations && 
                       watchedChecks.evidence &&
                       completedReflections === rubricCriteria.length

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-blue-600" />
              <CardTitle>Ready-Gate: Pre-Submission Checklist</CardTitle>
            </div>
            <Badge variant={isGatePassed ? "default" : "secondary"}>
              Step {currentStepNumber} of {totalSteps}
            </Badge>
          </div>
          <CardDescription>
            Complete this self-evaluation before submitting. Reflect on your mastery of the learning outcomes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(currentStepNumber / totalSteps) * 100} className="h-2" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className={step === 'reflection' ? 'font-semibold text-blue-600' : ''}>
              1. Self-Reflection
            </span>
            <span className={step === 'ai-use' ? 'font-semibold text-blue-600' : ''}>
              2. AI-Use Statement
            </span>
            <span className={step === 'compliance' ? 'font-semibold text-blue-600' : ''}>
              3. Compliance Checks
            </span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        {/* Step 1: Self-Reflection */}
        {step === 'reflection' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Outcome Mastery Self-Reflection
              </CardTitle>
              <CardDescription>
                Rate your mastery of each rubric criterion and explain how you demonstrated this skill.
                <br />
                <span className="text-sm font-medium text-blue-600">
                  Completed: {completedReflections} / {rubricCriteria.length}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => {
                const criterion = rubricCriteria[index]
                const currentScore = watchedReflections?.[index]?.selfScore || 0
                const currentNote = watchedReflections?.[index]?.note || ''
                const isComplete = currentNote.length >= 10 && currentScore > 0

                return (
                  <div 
                    key={field.id} 
                    className={`rounded-lg border p-4 transition-colors ${
                      isComplete ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <Label className="text-base font-medium">{criterion.label}</Label>
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground">{criterion.description}</p>
                        )}
                      </div>
                      {isComplete && <CheckCircle2 className="size-5 text-green-600" />}
                    </div>
                    
                    <div className="mb-3">
                      <Label className="text-sm">Self-Assessment: {currentScore}%</Label>
                      <Slider
                        value={[currentScore]}
                        onValueChange={(value) => setValue(`reflections.${index}.selfScore`, value[0])}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <Textarea
                      {...register(`reflections.${index}.note`)}
                      placeholder="How did you demonstrate this skill? Provide specific examples from your work..."
                      className="min-h-[80px]"
                    />
                    {errors.reflections?.[index]?.note && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.reflections[index]?.note?.message}
                      </p>
                    )}
                  </div>
                )
              })}

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => setStep('ai-use')}
                  disabled={completedReflections < rubricCriteria.length}
                >
                  Continue to AI-Use Statement <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI-Use Statement */}
        {step === 'ai-use' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5" />
                AI-Use Statement Wizard
              </CardTitle>
              <CardDescription>
                Document any AI tools you used and how you verified the output. This promotes academic integrity through transparency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Tools List */}
              <div className="space-y-3">
                <Label>AI Tools Used (if any)</Label>
                {aiTools.map((tool, index) => (
                  <div key={index} className="flex items-center gap-2 rounded border bg-gray-50 p-3">
                    <div className="flex-1">
                      <p className="font-medium">{tool.toolName}</p>
                      <p className="text-sm text-muted-foreground">{tool.purpose}</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick= {() => removeAITool(index)}
                    >
                      <XCircle className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                <div className="grid gap-2 rounded border border-dashed p-3">
                  <input
                    type="text"
                    placeholder="Tool name (e.g., ChatGPT, Gemini, Grammarly)"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    className="rounded border px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Purpose (e.g., grammar check, brainstorming ideas)"
                    value={newToolPurpose}
                    onChange={(e) => setNewToolPurpose(e.target.value)}
                    className="rounded border px-3 py-2 text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addAITool}
                    disabled={!newToolName || !newToolPurpose}
                  >
                    Add Tool
                  </Button>
                </div>
              </div>

              {/* AI Collaboration Reflection */}
              <div>
                <Label>Reflection on AI Collaboration</Label>
                <Textarea
                  value={aiReflection}
                  onChange={(e) => setAiReflection(e.target.value)}
                  placeholder="Describe how you verified AI outputs, what changes you made to AI suggestions, and how you ensured the final work represents your own understanding..."
                  className="mt-2 min-h-[120px]"
                />
              </div>

              {/* Process Evidence */}
              <div className="space-y-3 rounded border p-4">
                <Label className="text-base">Process Evidence</Label>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="processEvidence"
                    checked={hasProcessEvidence}
                    onCheckedChange={(checked) => setHasProcessEvidence(!!checked)}
                  />
                  <Label htmlFor="processEvidence" className="font-normal">
                    I have drafts, notes, or version history showing my work process
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Label>Number of draft versions:</Label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={draftVersionsCount}
                    onChange={(e) => setDraftVersionsCount(parseInt(e.target.value) || 0)}
                    className="w-20 rounded border px-3 py-1 text-center"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep('reflection')}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep('compliance')}>
                  Continue to Compliance Checks <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Compliance Checks */}
        {step === 'compliance' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Compliance Checklist
              </CardTitle>
              <CardDescription>
                Verify that your submission meets all requirements. All checks must pass before you can submit.
                <br />
                <span className="text-sm font-medium text-blue-600">
                  Checks Passed: {checksCompleted} / 4
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className={`flex items-start gap-3 rounded border p-4 ${
                  watchedChecks.structure ? 'border-green-200 bg-green-50/50' : ''
                }`}>
                  <Checkbox
                    id="structureCheck"
                    {...register('structureCheck')}
                    onCheckedChange={(checked) => setValue('structureCheck', !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="structureCheck" className="text-base font-medium">
                      Structure Verified
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      My submission follows the required format (introduction, body, conclusion, etc.)
                    </p>
                  </div>
                  {watchedChecks.structure ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-5 text-yellow-500" />
                  )}
                </div>

                <div className={`flex items-start gap-3 rounded border p-4 ${
                  watchedChecks.citations ? 'border-green-200 bg-green-50/50' : ''
                }`}>
                  <Checkbox
                    id="citationsCheck"
                    {...register('citationsCheck')}
                    onCheckedChange={(checked) => setValue('citationsCheck', !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="citationsCheck" className="text-base font-medium">
                      Citations Complete
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      All sources are properly cited in the required format (APA, MLA, etc.)
                    </p>
                  </div>
                  {watchedChecks.citations ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-5 text-yellow-500" />
                  )}
                </div>

                <div className={`flex items-start gap-3 rounded border p-4 ${
                  watchedChecks.evidence ? 'border-green-200 bg-green-50/50' : ''
                }`}>
                  <Checkbox
                    id="evidenceCheck"
                    {...register('evidenceCheck')}
                    onCheckedChange={(checked) => setValue('evidenceCheck', !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="evidenceCheck" className="text-base font-medium">
                      Evidence Provided
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have included sufficient evidence to support my arguments and claims
                    </p>
                  </div>
                  {watchedChecks.evidence ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-5 text-yellow-500" />
                  )}
                </div>

                <div className={`flex items-start gap-3 rounded border p-4 ${
                  watchedChecks.accessibility ? 'border-green-200 bg-green-50/50' : ''
                }`}>
                  <Checkbox
                    id="accessibilityCheck"
                    {...register('accessibilityCheck')}
                    onCheckedChange={(checked) => setValue('accessibilityCheck', !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="accessibilityCheck" className="text-base font-medium">
                      Accessibility Reviewed
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Images have alt text, headings are used properly, and content is readable
                    </p>
                  </div>
                  {watchedChecks.accessibility ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-5 text-yellow-500" />
                  )}
                </div>
              </div>

              {/* Gate Status */}
              {isGatePassed ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All checks passed! You are ready to submit your work.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="size-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Please complete all self-reflections and compliance checks before submitting.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep('ai-use')}>
                  Back
                </Button>
                <div className="flex gap-2">
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={!isGatePassed || isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Complete Ready-Gate & Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
