"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Select, TextField } from "@radix-ui/themes"
import axios from "axios"
import { Controller, useForm } from "react-hook-form"

enum Role {
  Admin = "ADMIN",
  Professor = "PROFESSOR",
  Student = "STUDENT",
}

interface InviteUserFormI {
  email: string
  role: Role
}

const InviteUserForm = () => {
  const { register, handleSubmit, control } = useForm<InviteUserFormI>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="flex flex-col space-y-4"
      onSubmit={handleSubmit(async (data) => {
        setError(null)
        setLoading(true)
        try {
          await axios.post("/api/invitations", data)
          router.push("/user-management")
        } catch (err: any) {
          setError(err?.response?.data?.message || err?.message || "Failed to send invitation")
        } finally {
          setLoading(false)
        }
      })}
    >
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <TextField.Root
        type="email"
        placeholder="email"
        {...register("email")}
        required
      />
      <Controller
        name="role"
        control={control}
        defaultValue={Role.Professor}
        render={({ field }) => (
          <Select.Root
            defaultValue={Role.Professor}
            onValueChange={field.onChange}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="PROFESSOR">Professor</Select.Item>
              <Select.Item value="ADMIN">Admin</Select.Item>
              <Select.Item value="STUDENT">Student</Select.Item>
            </Select.Content>
          </Select.Root>
        )}
      />
      <Button disabled={loading}>{loading ? "Sending..." : "Invite User"}</Button>
    </form>
  )
}

export { InviteUserForm }
