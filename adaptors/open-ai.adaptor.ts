import fs from "node:fs"
import OpenAI from "openai"

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

class OpenAIAdaptor {
  async createFile(file: any) {
    try {
      // Check if API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < 10) {
        throw new Error("OpenAI API key is not configured. Please add a valid OPENAI_API_KEY to your environment variables.")
      }

      return await openai.files.create({
        file: file,
        purpose: "assistants",
      })
    } catch (err: any) {
      console.error("OpenAI file upload error:", err?.message || err)
      // Re-throw with more context
      if (err?.status === 401 || err?.code === 'invalid_api_key') {
        throw new Error("Invalid OpenAI API key. Please update OPENAI_API_KEY in your .env.local file with a valid key from https://platform.openai.com/api-keys")
      }
      throw err
    }
  }
}

const openAIAdaptor = new OpenAIAdaptor()

export { openAIAdaptor }
