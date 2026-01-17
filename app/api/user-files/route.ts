import { NextResponse } from "next/server"
import { openAIAdaptor } from "@/adaptors/open-ai.adaptor"
import { fileInputSchema } from "@/schemas/file-input.schema"
import { fromError } from "zod-validation-error"

export async function POST(req: any) {
  try {
    const formData = await req.formData()
    const createdFiles = []

    if (!formData || formData.entries().next().done) {
      return NextResponse.json(
        { message: "No files provided" },
        { status: 400 }
      )
    }

    for (const file of formData.values()) {
      try {
        fileInputSchema.parse(file)
        createdFiles.push(openAIAdaptor.createFile(file))
      } catch (err) {
        const error = fromError(err)
        const errorMessage = error.toString()
        console.error("File validation error:", errorMessage)
        return NextResponse.json({ message: errorMessage }, { status: 400 })
      }
    }

    if (createdFiles.length === 0) {
      return NextResponse.json(
        { message: "No valid files to upload" },
        { status: 400 }
      )
    }

    const uploadedFiles = await Promise.all(createdFiles)
    const filesId = uploadedFiles.reduce(
      (responseObject: Record<string, any>, file: any, index: number) => {
        if (file?.id) {
          responseObject[file.filename] = file.id
          return responseObject
        } else {
          console.error("File upload failed - no ID returned:", file)
          throw new Error("File upload failed - invalid response from OpenAI")
        }
      },
      {}
    )

    console.log("Files uploaded successfully:", Object.keys(filesId))
    return NextResponse.json(filesId, { status: 201 })
  } catch (err: any) {
    console.error("File upload error:", err)

    // Provide specific error messages for common issues
    let errorMessage = err?.message || "Something went wrong! Please try again"

    // Check if it's an OpenAI API key error
    if (errorMessage.includes("OpenAI API key") || errorMessage.includes("Invalid OpenAI")) {
      errorMessage = "File upload requires a valid OpenAI API key. Please contact your administrator to configure the OPENAI_API_KEY environment variable."
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
