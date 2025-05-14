import { SubscriptionDetails } from "./subscription-details"
import { dummySubscriptions } from "./data"

// This generates the static paths for all subscription IDs
export function generateStaticParams() {
  return dummySubscriptions.map((sub) => ({
    id: sub.id,
  }))
}

// This is a server component
export default function Page({ params }: { params: { id: string } }) {
  const subscription = dummySubscriptions.find(sub => sub.id === params.id) || dummySubscriptions[0]

  return (
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8">
          <SubscriptionDetails id={params.id} subscription={subscription} />
        </div>
      </main>
  )
}
