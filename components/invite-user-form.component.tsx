"use client"

import { useRouter } from "next/navigation"
import { Button, Select, TextField } from "@radix-ui/themes"
import axios from "axios"
import { Controller, useForm } from "react-hook-form"

enum Role {
  Admin = "ADMIN ",
  Professor = "PROF",
}

interface InviteUserFormI {
  email: string
  role: Role
}

const InviteUserForm = () => {
  const { register, handleSubmit, control } = useForm<InviteUserFormI>()
  const router = useRouter()

  return (
    <form
      className="flex flex-col space-y-4"
      onSubmit={handleSubmit(async (data) => {
        await axios.post("api/invitations", data)
        router.push("/user-management")
      })}
    >
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
              <Select.Item value="PROF">Professor</Select.Item>
              <Select.Item value="ADMIN">Admin</Select.Item>
            </Select.Content>
          </Select.Root>
        )}
      />
      <Button>Invite User</Button>
    </form>
  )
}

export { InviteUserForm }
