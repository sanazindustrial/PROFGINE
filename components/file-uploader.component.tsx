import { forwardRef, useState } from "react"
import {
  ACCEPTED_FILE_TYPES,
  fileInputSchema,
} from "@/schemas/file-input.schema"
import { CheckIcon } from "@radix-ui/react-icons"
import { Spinner } from "@radix-ui/themes"
import axios from "axios"
import { fromError, isZodErrorLike } from "zod-validation-error"

import { FilePurpose } from "@/types/file-purpose.types"
import { Input } from "@/components/ui/input"

const MAX_FILE_NUM = 3

const _FileUploader = (
  {
    purpose,
    fileId,
    trackFile,
    onClick,
    multiple = false,
  }: {
    purpose: FilePurpose
    fileId: string
    trackFile: (purpose: FilePurpose, fileId: string) => void
    onClick: (purpose: FilePurpose) => void
    multiple?: boolean
  },
  ref: any
) => {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const onChangeHandler = async (e: React.ChangeEvent<any>) => {
    const filesList = e.target.files
    setError("")

    if (!filesList || filesList.length === 0) {
      return
    }

    if (filesList.length > MAX_FILE_NUM) {
      setError(`⚠️ Maximum ${MAX_FILE_NUM} files allowed. You selected ${filesList.length} files.`)
      e.target.value = null
      return
    }

    const formData = new FormData()
    const fileNames: string[] = []

    for (const file of filesList) {
      try {
        fileInputSchema.parse(file)
        formData.append(file.name, file)
        fileNames.push(file.name)
      } catch (err) {
        if (isZodErrorLike(err)) {
          const validationError = fromError(err)
          setError(`❌ ${validationError.toString()}`)
        } else {
          setError(
            `❌ Invalid file: ${file.name}. Please check the file type and size.`
          )
        }
        e.target.value = null
        return
      }
    }

    setIsLoading(true)

    try {
      const { data } = await axios.post("/api/user-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      
      if (data && Object.keys(data).length > 0) {
        trackFile(purpose, data)
      } else {
        throw new Error("No file ID returned")
      }
    } catch (error: any) {
      console.error("File upload error:", error)
      const errorMsg = error?.response?.data?.message || error?.message || "Upload failed"
      setError(`❌ Upload failed: ${errorMsg}. Please try again.`)
      e.target.value = null
    } finally {
      setIsLoading(false)
    }
  }

  const onClickHandler = () => {
    setError("")
    onClick(purpose)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Input
          type="file"
          onChange={onChangeHandler}
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onClick={onClickHandler}
          className="flex-1 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
          ref={ref}
          disabled={isLoading}
          multiple={multiple}
        />
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner
              loading={true}
              size="3"
            ></Spinner>
            <span>Uploading...</span>
          </div>
        )}
        {fileId && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
            <CheckIcon className="size-5" />
            <span className="font-medium">Uploaded ✓</span>
          </div>
        )}
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

const FileUploader = forwardRef(_FileUploader)
export { FileUploader }
