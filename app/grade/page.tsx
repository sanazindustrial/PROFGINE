"use client"

import { Grading } from "@/components/grading"
import { FeatureLayout } from "@/components/feature-layout"

export default function GradePage() {
  return (
    <FeatureLayout
      title="Grading Assistant"
      description="Save time with AI-powered grading suggestions and get insights into student performance with faster, more consistent feedback."
    >
      <Grading />
    </FeatureLayout>
  )
}
