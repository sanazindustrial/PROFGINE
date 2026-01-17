import { InviteUserForm } from "@/components/invite-user-form.component"

const InviteUser = () => (
  <section className="m-4 flex flex-col items-center justify-between p-1 ">
    <h2 className="m-5">Invite a user to join the platform</h2>
    <InviteUserForm />
  </section>
)

export default InviteUser
