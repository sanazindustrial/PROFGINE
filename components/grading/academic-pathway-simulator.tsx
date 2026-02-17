"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    BookOpen,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    GraduationCap,
    Globe,
    Layers,
    Lightbulb,
    MapPin,
    Plus,
    Save,
    Target,
    TrendingUp,
    Users,
    X,
    Zap,
} from 'lucide-react'

// Types
type SkillLevel = 'NOVICE' | 'DEVELOPING' | 'PROFICIENT' | 'EXEMPLARY'
type CourseStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'AT_RISK'
type PathwayType = 'MAJOR' | 'MINOR' | 'CERTIFICATE' | 'CONCENTRATION'

interface SkillCompetency {
    id: string
    name: string
    category: string
    currentLevel: SkillLevel
    targetLevel: SkillLevel
    progress: number
    evidenceCount: number
    lastDemonstrated?: string
}

interface CourseProjection {
    id: string
    code: string
    title: string
    credits: number
    term: string
    year: number
    status: CourseStatus
    prerequisites: string[]
    skillsGained: string[]
    riskScore?: number
    consensusScore?: number
}

interface CareerOpportunity {
    id: string
    title: string
    company: string
    type: 'INTERNSHIP' | 'FULL_TIME' | 'EXCHANGE' | 'RESEARCH'
    matchScore: number
    requiredSkills: string[]
    missingSkills: string[]
    location?: string
    deadline?: string
}

interface PathwayOption {
    id: string
    name: string
    type: PathwayType
    requiredCredits: number
    completedCredits: number
    estimatedCompletion: string
    courses: CourseProjection[]
}

interface InterventionImpact {
    action: string
    probabilityIncrease: number
    affectedCourses: string[]
    estimatedTimeToComplete: string
}

interface AcademicPathwaySimulatorProps {
    studentId: string
    studentName: string
    currentMajor: string
    academicLevel: 'UNDERGRADUATE' | 'GRADUATE' | 'DOCTORAL'
    currentTerm: string
    currentYear: number
    skills: SkillCompetency[]
    pathways: PathwayOption[]
    careerOpportunities: CareerOpportunity[]
    interventions?: InterventionImpact[]
    onSavePathway?: (pathway: PathwayOption) => Promise<void>
    onRequestIntervention?: (intervention: InterventionImpact) => Promise<void>
    isAdvisorView?: boolean
}

const SKILL_LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; bgColor: string; value: number }> = {
    NOVICE: { label: 'Novice', color: 'text-gray-600', bgColor: 'bg-gray-100', value: 25 },
    DEVELOPING: { label: 'Developing', color: 'text-blue-600', bgColor: 'bg-blue-100', value: 50 },
    PROFICIENT: { label: 'Proficient', color: 'text-green-600', bgColor: 'bg-green-100', value: 75 },
    EXEMPLARY: { label: 'Exemplary', color: 'text-purple-600', bgColor: 'bg-purple-100', value: 100 },
}

const COURSE_STATUS_CONFIG: Record<CourseStatus, { label: string; color: string; bgColor: string }> = {
    COMPLETED: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    PLANNED: { label: 'Planned', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    AT_RISK: { label: 'At Risk', color: 'text-red-600', bgColor: 'bg-red-100' },
}

export function AcademicPathwaySimulator({
    studentId,
    studentName,
    currentMajor,
    academicLevel,
    currentTerm,
    currentYear,
    skills,
    pathways,
    careerOpportunities,
    interventions = [],
    onSavePathway,
    onRequestIntervention,
    isAdvisorView = false,
}: AcademicPathwaySimulatorProps) {
    const [activeTab, setActiveTab] = useState<'skills' | 'pathway' | 'career' | 'whatif'>('skills')
    const [selectedPathway, setSelectedPathway] = useState<PathwayOption | null>(pathways[0] || null)
    const [selectedCareer, setSelectedCareer] = useState<CareerOpportunity | null>(null)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const overallProgress = useMemo(() => {
        if (!selectedPathway) return 0
        return Math.round((selectedPathway.completedCredits / selectedPathway.requiredCredits) * 100)
    }, [selectedPathway])

    const skillsByCategory = useMemo(() => {
        const grouped: Record<string, SkillCompetency[]> = {}
        skills.forEach(skill => {
            if (!grouped[skill.category]) grouped[skill.category] = []
            grouped[skill.category].push(skill)
        })
        return grouped
    }, [skills])

    const atRiskCourses = useMemo(() => {
        if (!selectedPathway) return []
        return selectedPathway.courses.filter(c => c.status === 'AT_RISK' || (c.riskScore && c.riskScore > 50))
    }, [selectedPathway])

    const handleSavePathway = async () => {
        if (!selectedPathway || !onSavePathway) return
        setIsSaving(true)
        try {
            await onSavePathway(selectedPathway)
            setShowSaveDialog(false)
        } catch (error) {
            console.error('Error saving pathway:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <TooltipProvider>
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="size-5" />
                                Academic Pathway Simulator
                            </CardTitle>
                            <CardDescription>
                                {isAdvisorView ? `Advising: ${studentName}` : 'Plan your academic journey'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{academicLevel}</Badge>
                            <Badge variant="secondary">{currentMajor}</Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="skills" className="flex items-center gap-1">
                                <Target className="size-4" />
                                <span className="hidden sm:inline">Skills Map</span>
                            </TabsTrigger>
                            <TabsTrigger value="pathway" className="flex items-center gap-1">
                                <Layers className="size-4" />
                                <span className="hidden sm:inline">Pathway</span>
                            </TabsTrigger>
                            <TabsTrigger value="career" className="flex items-center gap-1">
                                <Briefcase className="size-4" />
                                <span className="hidden sm:inline">Career</span>
                            </TabsTrigger>
                            <TabsTrigger value="whatif" className="flex items-center gap-1">
                                <Lightbulb className="size-4" />
                                <span className="hidden sm:inline">What-If</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Skills Map Tab */}
                        <TabsContent value="skills" className="mt-4">
                            <div className="space-y-6">
                                {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                                    <div key={category}>
                                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {categorySkills.map(skill => {
                                                const levelConfig = SKILL_LEVEL_CONFIG[skill.currentLevel]
                                                return (
                                                    <div key={skill.id} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm">{skill.name}</span>
                                                            <Badge className={`${levelConfig.bgColor} ${levelConfig.color}`} variant="outline">
                                                                {levelConfig.label}
                                                            </Badge>
                                                        </div>
                                                        <Progress value={skill.progress} className="h-2 mb-2" />
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>{skill.evidenceCount} evidence items</span>
                                                            {skill.lastDemonstrated && <span>Last: {skill.lastDemonstrated}</span>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Pathway Tab */}
                        <TabsContent value="pathway" className="mt-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Select
                                        value={selectedPathway?.id || ''}
                                        onValueChange={(id) => setSelectedPathway(pathways.find(p => p.id === id) || null)}
                                    >
                                        <SelectTrigger className="w-64">
                                            <SelectValue placeholder="Select pathway" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pathways.map(pathway => (
                                                <SelectItem key={pathway.id} value={pathway.id}>
                                                    {pathway.name} ({pathway.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedPathway && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Progress:</span>
                                            <Progress value={overallProgress} className="w-32 h-2" />
                                            <span className="font-medium">{overallProgress}%</span>
                                        </div>
                                    )}
                                </div>

                                {selectedPathway && (
                                    <>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <Card className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="size-5 text-green-600" />
                                                    <div>
                                                        <p className="text-2xl font-bold">{selectedPathway.completedCredits}</p>
                                                        <p className="text-xs text-muted-foreground">Credits Completed</p>
                                                    </div>
                                                </div>
                                            </Card>
                                            <Card className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="size-5 text-blue-600" />
                                                    <div>
                                                        <p className="text-2xl font-bold">{selectedPathway.requiredCredits - selectedPathway.completedCredits}</p>
                                                        <p className="text-xs text-muted-foreground">Credits Remaining</p>
                                                    </div>
                                                </div>
                                            </Card>
                                            <Card className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-5 text-purple-600" />
                                                    <div>
                                                        <p className="text-2xl font-bold">{selectedPathway.estimatedCompletion}</p>
                                                        <p className="text-xs text-muted-foreground">Est. Graduation</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        {atRiskCourses.length > 0 && (
                                            <Alert variant="destructive">
                                                <AlertTriangle className="size-4" />
                                                <AlertDescription>
                                                    {atRiskCourses.length} course(s) at risk based on current performance trends.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Course Timeline</h3>
                                            <ScrollArea className="h-80">
                                                <div className="space-y-2">
                                                    {selectedPathway.courses.map((course) => {
                                                        const statusConfig = COURSE_STATUS_CONFIG[course.status]
                                                        return (
                                                            <div
                                                                key={course.id}
                                                                className={`p-3 border rounded-lg ${course.status === 'AT_RISK' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-center min-w-16">
                                                                            <p className="text-xs text-muted-foreground">{course.term}</p>
                                                                            <p className="font-semibold">{course.year}</p>
                                                                        </div>
                                                                        <Separator orientation="vertical" className="h-8" />
                                                                        <div>
                                                                            <p className="font-medium">{course.code} - {course.title}</p>
                                                                            <p className="text-xs text-muted-foreground">{course.credits} credits</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`} variant="outline">
                                                                        {statusConfig.label}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* Career Tab */}
                        <TabsContent value="career" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Matching Opportunities</h3>
                                    <ScrollArea className="h-96">
                                        <div className="space-y-2 pr-4">
                                            {careerOpportunities
                                                .sort((a, b) => b.matchScore - a.matchScore)
                                                .map(opportunity => (
                                                    <div
                                                        key={opportunity.id}
                                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedCareer?.id === opportunity.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                                            }`}
                                                        onClick={() => setSelectedCareer(opportunity)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <p className="font-medium">{opportunity.title}</p>
                                                                <p className="text-sm text-muted-foreground">{opportunity.company}</p>
                                                            </div>
                                                            <Badge variant={opportunity.matchScore >= 80 ? 'default' : 'secondary'}>
                                                                {opportunity.matchScore}% match
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Badge variant="outline">{opportunity.type}</Badge>
                                                            {opportunity.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="size-3" />
                                                                    {opportunity.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div>
                                    {selectedCareer ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{selectedCareer.title}</CardTitle>
                                                <CardDescription>{selectedCareer.company}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedCareer.requiredSkills.map(skill => (
                                                            <Badge
                                                                key={skill}
                                                                variant={selectedCareer.missingSkills.includes(skill) ? 'outline' : 'default'}
                                                                className={selectedCareer.missingSkills.includes(skill) ? 'border-red-300' : 'bg-green-600'}
                                                            >
                                                                {selectedCareer.missingSkills.includes(skill) ? <X className="size-3 mr-1" /> : <Check className="size-3 mr-1" />}
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                {selectedCareer.missingSkills.length > 0 && (
                                                    <Alert>
                                                        <AlertTriangle className="size-4" />
                                                        <AlertDescription>
                                                            <strong>Skill Gap:</strong> You need {selectedCareer.missingSkills.length} more skill(s).
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full">Apply Now <ArrowRight className="size-4 ml-2" /></Button>
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
                                            <p className="text-muted-foreground">Select an opportunity</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* What-If Tab */}
                        <TabsContent value="whatif" className="mt-4">
                            <div className="space-y-6">
                                <Alert>
                                    <Lightbulb className="size-4" />
                                    <AlertDescription>
                                        Simulate how interventions affect your academic trajectory.
                                    </AlertDescription>
                                </Alert>

                                {interventions.length > 0 ? (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Available Interventions</h3>
                                        {interventions.map((intervention, index) => (
                                            <Card key={index} className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">{intervention.action}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Estimated time: {intervention.estimatedTimeToComplete}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="size-4 text-green-600" />
                                                            <span className="text-green-600 font-medium">
                                                                +{intervention.probabilityIncrease}% success probability
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => onRequestIntervention?.(intervention)}>
                                                        Request <Zap className="size-4 ml-1" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Lightbulb className="size-12 mx-auto mb-4 opacity-50" />
                                        <p>No interventions currently suggested.</p>
                                    </div>
                                )}

                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-4">Simulate Major Change</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select new major" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cs">Computer Science</SelectItem>
                                                <SelectItem value="data">Data Science</SelectItem>
                                                <SelectItem value="business">Business Administration</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline">
                                            <Activity className="size-4 mr-2" />
                                            Run Simulation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
                        <Save className="size-4 mr-2" />
                        Save to Profile
                    </Button>
                    <Button variant="outline">
                        <Download className="size-4 mr-2" />
                        Export PDF
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Pathway to Profile</DialogTitle>
                        <DialogDescription>
                            This pathway will be saved to {isAdvisorView ? `${studentName}'s` : 'your'} 360-degree profile.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                        <Button onClick={handleSavePathway} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Pathway'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}

export default AcademicPathwaySimulator
