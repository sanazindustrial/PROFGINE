import { NextResponse } from "next/server"
import OpenAI from "openai"
import { APIPromise } from "openai/core"

import {
  FilePurposeEnum,
  FilePurposeInterface,
} from "@/types/file-purpose.types"

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  timeout: 300000
})

const FILE_TYPE_INSTRUCTIONS: Record<FilePurposeEnum, string> = {
  [FilePurposeEnum.rubric]:
    "This file contains rubric instructions. Please grade and evaluate students according to it",
  [FilePurposeEnum.assignment]:
    "This file contains the tasks the student should have worked on",
  [FilePurposeEnum.student]:
    "This file contains the student response, which should be evaluated according to the rubric criteria",
  [FilePurposeEnum.professor]:
    "This is the professor profile, their background and style",
}

export async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null
    message: string
    data?: FilePurposeInterface
  } = await req.json()

  // Create a thread if needed
  // TODO: move all the open ai api to the openai adaptor
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id

  // Add user file to a specific message, let's upload it.
  if (input.data && Object.keys(input.data).length > 0) {
    const { data } = input
    const uploadedFiles: APIPromise<any>[] = []

    try {
      Object.keys(data).forEach((purpose) => {
        const filesId = Object.values(data[purpose])
        filesId.forEach((fileId) => {
          uploadedFiles.push(
            openai.beta.threads.messages.create(threadId, {
              role: "user",
              content: FILE_TYPE_INSTRUCTIONS[purpose as FilePurposeEnum],
              attachments: [
                {
                  file_id: fileId,
                  tools: [{ type: "file_search" }],
                },
              ],
            })
          )
        })
      })

      await Promise.all(uploadedFiles)
    } catch (err) {
      console.log(err)
      //TODO: Implement a retry logic here
      return NextResponse.json(
        {
          message:
            "something went wrong when processing the files content! Please try again",
        },
        { status: 400 }
      )
    }
  }

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  })

  // Run the assistant on the thread
  const runStream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id:
      process.env.ASSISTANT_ID ??
      (() => {
        throw new Error("ASSISTANT_ID is not set")
      })(),
  })

  runStream.on("messageDone", (data) => {
    console.log("/---start---/")
    console.log("assistant_id", data.assistant_id)
    console.log("thread_id", data.thread_id)
    console.log("message", data.content)
    console.log("/---end---/")
  })

  // Return the stream as a Response
  return new Response(runStream.toReadableStream(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Thread-ID": threadId,
      "X-Message-ID": createdMessage.id,
    },
  })
}

export const dynamic = "force-dynamic"
