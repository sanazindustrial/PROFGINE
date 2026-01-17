import { FilePurposeEnum } from "@/types/file-purpose.types"

const MESSAGE_CHUNKS_COMPONENTS = [
  FilePurposeEnum.professor,
  FilePurposeEnum.assignment,
  FilePurposeEnum.rubric,
  FilePurposeEnum.student,
]

type messageContent = {
  [FilePurposeEnum.professor]?: string
  [FilePurposeEnum.assignment]?: string
  [FilePurposeEnum.rubric]?: string
  [FilePurposeEnum.student]?: string
}

type messageContentExp = Partial<Record<FilePurposeEnum, string>>

const MESSAGE_CHUNKS = {
  professorProfile: "Professor Writing Style and Background",
  assignmentPrompt: "Assignment",
  rubricPrompt: "Rubric",
  studentPost: "Student's Response to the Assignment",
  ending: "myTArequestType: \n" + "assignment",
}

const getMessageContent = (messageInput: messageContentExp) => {
  const {
    professorProfile = "",
    assignmentPrompt = "",
    rubricPrompt = "",
    studentPost = "",
  } = messageInput

  let message = ""
  if (professorProfile) {
    message = `${MESSAGE_CHUNKS.professorProfile}:
        ${professorProfile}
      `
  }

  if (assignmentPrompt) {
    message += `${MESSAGE_CHUNKS.assignmentPrompt}:
      ${assignmentPrompt}
    `
  }

  if (rubricPrompt) {
    message += `${MESSAGE_CHUNKS.rubricPrompt}:
      ${rubricPrompt}
    `
  }

  if (studentPost) {
    message += `${MESSAGE_CHUNKS.studentPost}:
      ${studentPost}
    `
  }

  return message + MESSAGE_CHUNKS.ending
}

export { getMessageContent, MESSAGE_CHUNKS_COMPONENTS }
