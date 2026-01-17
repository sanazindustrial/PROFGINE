import { z } from "zod"

const MAX_UPLOAD_SIZE = 1024 * 1024 * 0.5
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
]

export const fileInputSchema = z
  .instanceof(File)
  .refine((file) => !file || file.size <= MAX_UPLOAD_SIZE, {
    message: "max_file_size_exceed ",
  })
  .refine(
    (file) => {
      return !file || ACCEPTED_FILE_TYPES.includes(file.type)
    },
    {
      message: "file_type_unsupported",
    }
  )
