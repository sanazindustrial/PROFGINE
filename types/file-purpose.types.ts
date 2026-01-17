enum FilePurposeEnum {
  rubric = "rubricPrompt",
  assignment = "assignmentPrompt",
  student = "studentPost",
  professor = "professorProfile",
}

type FilePurpose =
  | FilePurposeEnum.rubric
  | FilePurposeEnum.assignment
  | FilePurposeEnum.student
  | FilePurposeEnum.professor

interface FilePurposeInterface {
  [name: string]: string
}

export { FilePurposeEnum }

export type { FilePurpose, FilePurposeInterface }
